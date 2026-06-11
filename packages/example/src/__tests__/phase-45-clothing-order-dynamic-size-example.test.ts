import { describe, expect, it } from 'vitest';
import {
  cloneReportTemplate,
  createEventContext,
  createEventLogCollector,
  createEventRuntimeState,
  renderReport,
  runEventScript,
} from '@report-designer/core';
import type { RenderDocument, RenderTable, ReportTemplate, TableComponent } from '@report-designer/core';
import { sampleReports } from '../templates';
import {
  clothingOrderDynamicSizeData,
  clothingOrderDynamicSizeTemplate,
} from '../templates/clothing-order-dynamic-size';

function allTemplateComponents() {
  return clothingOrderDynamicSizeTemplate.pages.flatMap(page => page.bands.flatMap(band => band.components));
}

function templateComponents(report: ReportTemplate) {
  return report.pages.flatMap(page => page.bands.flatMap(band => band.components));
}

function runBeforeDataTemplate(): ReportTemplate {
  const report = cloneReportTemplate(clothingOrderDynamicSizeTemplate as ReportTemplate);
  const target = { ownerType: 'report' as const, ownerId: report.id, eventName: 'beforeData' as const };
  const log = createEventLogCollector(target);
  const runtimeState = createEventRuntimeState();
  const ctx = createEventContext({
    report,
    data: clothingOrderDynamicSizeData as any,
    log,
    target,
    runtime: runtimeState,
  });

  runEventScript({
    event: report.events?.beforeData,
    ctx,
    target,
    eventLogs: log,
    runtimeState,
  });

  return report;
}

function findTemplateTable(report: ReportTemplate, name: string): TableComponent {
  const table = templateComponents(report).find(
    (component): component is TableComponent => component.type === 'table' && component.name === name,
  );

  expect(table).toBeDefined();
  return table!;
}

function findRenderedTable(document: RenderDocument, id: string): RenderTable {
  const table = findRenderedTables(document, id)[0];

  expect(table).toBeDefined();
  return table!;
}

function findRenderedTables(document: RenderDocument, id: string): RenderTable[] {
  const tables = document.pages
    .flatMap(page => page.items)
    .flatMap(item => item.components)
    .filter((component): component is RenderTable => component.type === 'table' && component.id === id);

  expect(tables.length).toBeGreaterThan(0);
  return tables;
}

function renderedText(document: RenderDocument): string[] {
  return document.pages
    .flatMap(page => page.items)
    .flatMap(item => item.components)
    .flatMap((component) => {
      if (component.type === 'table') {
        const table = component as RenderTable;
        return table.rows.flatMap(row => row.map(cell => cell.content));
      }
      return [(component as { content?: string }).content];
    })
    .filter((value: unknown): value is string => value !== undefined && value !== null)
    .map((value: string) => String(value));
}

describe('phase 45 clothing order dynamic size example', () => {
  it('declares named header and detail tables for event scripts', () => {
    const tables = allTemplateComponents().filter(component => component.type === 'table');

    expect(tables.map(table => table.name)).toEqual(expect.arrayContaining([
      'OrderSizeHeaderTable',
      'OrderSizeDetailTable',
    ]));
  });

  it('uses beforeData to look up the dynamic size tables by name', () => {
    const script = clothingOrderDynamicSizeTemplate.events?.beforeData?.script ?? '';

    expect(script).toContain('ctx.table?.("OrderSizeHeaderTable")');
    expect(script).toContain('ctx.table?.("OrderSizeDetailTable")');
    expect(script).not.toContain('ctx.data.root');
    expect(script).not.toContain('ctx.data.clothingOrder');
    expect(script).not.toContain('@typedef');
    expect(script).not.toContain('const rowHeight = 7');
    expect(script).not.toContain('const fixedBefore');
    expect(script).not.toContain('const fixedAfter');
    expect(script).not.toContain('const order = directOrder ?? {};');
    expect(script).not.toContain('band.height');
    expect(script).toContain('// S1 是设计时的尺码占位列');
    expect(script).toContain('// 读取占位列左侧和右侧的模板单元格');
  });

  it('bundles unique sizeGroups metadata and S1 quantity data', () => {
    expect(clothingOrderDynamicSizeData.sizeGroups[0]?.sizes[0]).toMatchObject({
      field: 'S1',
      name: 'S',
    });
    expect(clothingOrderDynamicSizeData.sizeGroups[1]?.sizes).toEqual([
      { field: 'S1', name: '80' },
      { field: 'S2', name: '90' },
    ]);
    expect(clothingOrderDynamicSizeData.items[0]).toEqual(expect.objectContaining({
      S1: 12,
      S2: 18,
      S3: 15,
      S4: 10,
    }));
    expect(clothingOrderDynamicSizeData.items[1]).toEqual(expect.objectContaining({
      S1: 5,
      S2: 4,
      S3: '',
      S4: '',
    }));
    const sizeFields = clothingOrderDynamicSizeData.sizeGroups.flatMap(group =>
      group.sizes.map(size => `${group.name}.${size.field}`),
    );
    expect(new Set(sizeFields).size).toBe(sizeFields.length);
    expect(clothingOrderDynamicSizeTemplate.dataSources).toEqual([]);
    expect(clothingOrderDynamicSizeData).not.toHaveProperty('clothingOrder');
    expect(clothingOrderDynamicSizeTemplate.pages[0].bands[2]?.dataBand?.dataSourceId).toBe('items');
    expect(clothingOrderDynamicSizeTemplate.pages[0].bands[1]?.behavior?.autoGrow).toBe(true);
    expect(clothingOrderDynamicSizeData).toMatchObject({
      remark: '备注：请按颜色分包，尾箱随货附尺码明细。',
    });
  });

  it('registers the bundled sample report', () => {
    const sample = sampleReports.find(report => report.key === 'clothingOrderDynamicSize');

    expect(sample?.label).toBe('服装订单动态尺码打印');
    expect(sample?.template).toBe(clothingOrderDynamicSizeTemplate);
    expect(sample?.data).toBe(clothingOrderDynamicSizeData);
  });

  it('renders sample order values and dynamic size quantities', () => {
    const document = renderReport(clothingOrderDynamicSizeTemplate, clothingOrderDynamicSizeData as any);
    const content = renderedText(document);

    expect(content).toEqual(expect.arrayContaining([
      'CO-202606-018',
      '杭州织造商贸有限公司',
      '2026 夏',
      '80',
      '90',
      '特种绣花针织裤',
      '1095',
      '合计',
      '1887.00',
      '金额大写',
      '壹仟捌佰捌拾柒元整',
      '备注：请按颜色分包，尾箱随货附尺码明细。',
    ]));
  });

  it('expands dynamic size header and detail tables with aligned structure', () => {
    const sizeGroups = clothingOrderDynamicSizeData.sizeGroups;
    const fixedBeforeColumnCount = 4;
    const fixedAfterColumnCount = 3;
    const sizeColumnCount = Math.max(...sizeGroups.map(group => group.sizes.length));
    const totalColumnCount = fixedBeforeColumnCount + sizeColumnCount + fixedAfterColumnCount;

    const eventReport = runBeforeDataTemplate();
    const eventHeaderTable = findTemplateTable(eventReport, 'OrderSizeHeaderTable');
    const eventDetailTable = findTemplateTable(eventReport, 'OrderSizeDetailTable');
    const detailCells = eventDetailTable.rows?.[0]?.cells ?? [];

    expect(eventHeaderTable.rows).toHaveLength(sizeGroups.length);
    expect(eventHeaderTable.columnCount).toBe(totalColumnCount);
    expect(eventDetailTable.columnCount).toBe(totalColumnCount);
    expect(eventHeaderTable.rows?.[0]?.height).toBe(7);
    expect(eventDetailTable.rows?.[0]?.height).toBe(7);
    expect(detailCells[fixedBeforeColumnCount]?.text).toBe('{S1}');
    expect(detailCells[fixedBeforeColumnCount + 1]?.text).toBe('{S2}');
    expect(detailCells[fixedBeforeColumnCount + 2]?.text).toBe('{S3}');
    expect(detailCells[fixedBeforeColumnCount + 3]?.text).toBe('{S4}');
    expect((eventHeaderTable.rows?.[0]?.cells ?? [])
      .slice(fixedBeforeColumnCount, fixedBeforeColumnCount + sizeColumnCount)
      .every(cell => cell.width === undefined)).toBe(true);
    expect(detailCells
      .slice(fixedBeforeColumnCount, fixedBeforeColumnCount + sizeColumnCount)
      .every(cell => cell.width === undefined)).toBe(true);

    const document = renderReport(clothingOrderDynamicSizeTemplate, clothingOrderDynamicSizeData as any);
    const renderedHeaderTable = findRenderedTable(document, 'clothing-size-header-table');
    const renderedDetailTables = findRenderedTables(document, 'clothing-size-detail-table');
    const renderedDetailTable = renderedDetailTables[0];
    const headerFirstRow = renderedHeaderTable.rows[0] ?? [];
    const detailRow = renderedDetailTable.rows[0] ?? [];

    expect(renderedHeaderTable.rows).toHaveLength(sizeGroups.length);
    expect(headerFirstRow).toHaveLength(detailRow.length);
    expect(headerFirstRow).toHaveLength(totalColumnCount);
    expect(renderedHeaderTable.columns).toHaveLength(renderedDetailTable.columns.length);
    expect(renderedHeaderTable.columns).toHaveLength(totalColumnCount);
    expect(renderedHeaderTable.columns.reduce((sum, column) => sum + (column.width ?? 0), 0)).toBe(renderedHeaderTable.width);
    expect(renderedDetailTable.columns.reduce((sum, column) => sum + (column.width ?? 0), 0)).toBe(renderedDetailTable.width);

    const fixedColumnIndexes = [
      0,
      1,
      2,
      3,
      totalColumnCount - 3,
      totalColumnCount - 2,
      totalColumnCount - 1,
    ];
    expect(fixedColumnIndexes.map(index => headerFirstRow[index]?.rowSpan)).toEqual(
      Array.from({ length: fixedColumnIndexes.length }, () => sizeGroups.length),
    );
    expect(fixedColumnIndexes.map(index => headerFirstRow[index]?.content)).toEqual([
      '款号',
      '品名',
      '吊牌价',
      '颜色',
      '总数量',
      '价格',
      '金额',
    ]);

    const headerContents = renderedHeaderTable.rows.flatMap(row => row.map(cell => cell.content));
    expect(headerContents).toEqual(expect.arrayContaining(['80', '90']));
    expect(detailRow[fixedBeforeColumnCount]?.content).toBe(String(clothingOrderDynamicSizeData.items[0].S1));
    expect(detailRow[fixedBeforeColumnCount + 1]?.content).toBe(String(clothingOrderDynamicSizeData.items[0].S2));
    expect(detailRow[fixedBeforeColumnCount + 2]?.content).toBe(String(clothingOrderDynamicSizeData.items[0].S3));
    expect(detailRow[fixedBeforeColumnCount + 3]?.content).toBe(String(clothingOrderDynamicSizeData.items[0].S4));

    const pantsRow = renderedDetailTables[1]?.rows[0] ?? [];
    expect(pantsRow[fixedBeforeColumnCount]?.content).toBe(String(clothingOrderDynamicSizeData.items[1].S1));
    expect(pantsRow[fixedBeforeColumnCount + 1]?.content).toBe(String(clothingOrderDynamicSizeData.items[1].S2));
    expect(pantsRow[fixedBeforeColumnCount + 2]?.content).toBe('');
    expect(pantsRow[fixedBeforeColumnCount + 3]?.content).toBe('');
  });
});
