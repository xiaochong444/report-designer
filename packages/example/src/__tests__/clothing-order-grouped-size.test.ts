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
  clothingOrderGroupedSizeData,
  clothingOrderGroupedSizeTemplate,
} from '../templates/clothing-order-grouped-size';

function templateComponents(report: ReportTemplate) {
  return report.pages.flatMap(page => page.bands.flatMap(band => band.components));
}

function findTemplateTable(report: ReportTemplate, name: string): TableComponent {
  const table = templateComponents(report).find(
    (component): component is TableComponent => component.type === 'table' && component.name === name,
  );
  expect(table).toBeDefined();
  return table!;
}

function findRenderedTables(document: RenderDocument, id: string): RenderTable[] {
  const tables = document.pages
    .flatMap(page => page.items)
    .flatMap(item => item.components)
    .filter((component): component is RenderTable => component.type === 'table' && component.id === id);
  return tables;
}

function renderedText(document: RenderDocument): string[] {
  return document.pages
    .flatMap(page => page.items)
    .flatMap(item => item.components)
    .flatMap((component) => {
      if (component.type === 'table') {
        return component.rows.flatMap(row => row.map(cell => cell.content));
      }
      return [(component as { content?: string }).content];
    })
    .filter((value): value is string => value !== undefined && value !== null)
    .map(value => String(value));
}

function runBeforeData(): ReportTemplate {
  const report = cloneReportTemplate(clothingOrderGroupedSizeTemplate as ReportTemplate);
  const target = { ownerType: 'report' as const, ownerId: report.id, eventName: 'beforeData' as const };
  const log = createEventLogCollector(target);
  const runtimeState = createEventRuntimeState();
  const ctx = createEventContext({
    report,
    data: clothingOrderGroupedSizeData as Record<string, unknown>,
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

describe('clothing order grouped size example', () => {
  it('declares named header and detail tables', () => {
    const tables = templateComponents(clothingOrderGroupedSizeTemplate as ReportTemplate)
      .filter(c => c.type === 'table');

    expect(tables.map(t => t.name)).toEqual(expect.arrayContaining([
      'GroupSizeHeaderTable',
      'GroupSizeDetailTable',
    ]));
  });

  it('has groupHeader band with conditionExpression and beforePrint event', () => {
    const bands = clothingOrderGroupedSizeTemplate.pages[0].bands;
    const groupBand = bands.find(b => b.type === 'groupHeader');

    expect(groupBand).toBeDefined();
    expect(groupBand?.group?.conditionExpression).toBe('{items.sizeGroupName}');
    expect(groupBand?.behavior?.autoShrink).toBe(true);
    expect(groupBand?.events?.beforePrint?.enabled).toBe(true);
    expect(groupBand?.events?.beforePrint?.script).toContain('ctx.row');
    expect(groupBand?.events?.beforePrint?.script).toContain('sizeGroupName');
    expect(groupBand?.events?.beforePrint?.script).not.toMatch(/\bvar\s/);
  });

  it('uses beforeData to expand tables by max size count', () => {
    const script = clothingOrderGroupedSizeTemplate.events?.beforeData?.script ?? '';

    expect(script).toContain('ctx.table?.("GroupSizeHeaderTable")');
    expect(script).toContain('ctx.table?.("GroupSizeDetailTable")');
    expect(script).toContain('insertColumnsAfter');
    expect(script).not.toMatch(/\bvar\s/);
  });

  it('bundles items with sizeGroupName and three size groups', () => {
    const { sizeGroups, items } = clothingOrderGroupedSizeData;

    expect(sizeGroups).toHaveLength(3);
    expect(sizeGroups[0].sizes).toHaveLength(4);
    expect(sizeGroups[1].sizes).toHaveLength(3);
    expect(sizeGroups[2].sizes).toHaveLength(3);
    expect(items.every(item => typeof item.sizeGroupName === 'string')).toBe(true);
    expect(new Set(items.map(item => item.sizeGroupName)).size).toBe(3);
  });

  it('registers the bundled sample report', () => {
    const sample = sampleReports.find(r => r.key === 'clothingOrderGroupedSize');

    expect(sample?.label).toBe('服装订单分组尺码打印');
    expect(sample?.template).toBe(clothingOrderGroupedSizeTemplate);
    expect(sample?.data).toBe(clothingOrderGroupedSizeData);
  });

  it('beforeData expands header and detail tables to max size columns', () => {
    const maxSizeCount = Math.max(
      ...clothingOrderGroupedSizeData.sizeGroups.map(g => g.sizes.length),
    );
    const fixedColumns = 7; // 4 before + 3 after (placeholder replaced)
    const expectedColumnCount = fixedColumns + maxSizeCount;

    const report = runBeforeData();
    const headerTable = findTemplateTable(report, 'GroupSizeHeaderTable');
    const detailTable = findTemplateTable(report, 'GroupSizeDetailTable');

    expect(headerTable.columnCount).toBe(expectedColumnCount);
    expect(detailTable.columnCount).toBe(expectedColumnCount);

    // 初始标签设为最大尺码组（常规尺码: S, M, L, XL）
    const largestSizes = clothingOrderGroupedSizeData.sizeGroups[0].sizes;
    const headerCells = headerTable.rows?.[0]?.cells ?? [];
    const sizeColumnStart = 4;
    for (let i = 0; i < maxSizeCount; i++) {
      expect(headerCells[sizeColumnStart + i]?.text).toBe(largestSizes[i]?.name ?? '');
    }

    // 明细表尺码列绑定 {S1}...{S4}
    const detailCells = detailTable.rows?.[0]?.cells ?? [];
    for (let i = 0; i < maxSizeCount; i++) {
      expect(detailCells[sizeColumnStart + i]?.text).toBe(`{S${i + 1}}`);
    }
  });

  it('renders order header values and summary totals', () => {
    const document = renderReport(
      clothingOrderGroupedSizeTemplate as ReportTemplate,
      clothingOrderGroupedSizeData as Record<string, unknown>,
    );
    const content = renderedText(document);

    expect(content).toEqual(expect.arrayContaining([
      'CO-202606-032',
      '上海锦绣服饰有限公司',
      '2026 秋冬',
      '合计',
    ]));
  });

  it('renders grouped header tables with per-group size labels', () => {
    const document = renderReport(
      clothingOrderGroupedSizeTemplate as ReportTemplate,
      clothingOrderGroupedSizeData as Record<string, unknown>,
    );

    const headerTables = findRenderedTables(document, 'grouped-size-header-table');
    const sizeGroups = clothingOrderGroupedSizeData.sizeGroups;

    // 每个尺码组生成一个独立的表头表
    expect(headerTables.length).toBe(sizeGroups.length);

    const sizeColumnStart = 4;

    // 验证每个分组的表头标签
    headerTables.forEach((headerTable, groupIndex) => {
      const group = sizeGroups[groupIndex];
      const maxSizeCount = Math.max(...sizeGroups.map(g => g.sizes.length));
      const headerRow = headerTable.rows[0] ?? [];

      // 当前组尺码列有正确的名称
      group.sizes.forEach((size, i) => {
        expect(headerRow[sizeColumnStart + i]?.content).toBe(size.name);
      });

      // 超出当前组尺码数的列为空
      for (let i = group.sizes.length; i < maxSizeCount; i++) {
        expect(headerRow[sizeColumnStart + i]?.content ?? '').toBe('');
      }
    });
  });

  it('renders detail rows grouped by sizeGroupName', () => {
    const document = renderReport(
      clothingOrderGroupedSizeTemplate as ReportTemplate,
      clothingOrderGroupedSizeData as Record<string, unknown>,
    );

    const detailTables = findRenderedTables(document, 'grouped-size-detail-table');
    const { items, sizeGroups } = clothingOrderGroupedSizeData;
    const maxSizeCount = Math.max(...sizeGroups.map(g => g.sizes.length));
    const sizeColumnStart = 4;

    // 明细表行数 = items 总数
    expect(detailTables.length).toBe(items.length);

    // 验证每条明细的尺码数量列
    items.forEach((item, index) => {
      const row = detailTables[index]?.rows[0] ?? [];
      for (let i = 0; i < maxSizeCount; i++) {
        const field = `S${i + 1}` as keyof typeof item;
        const expected = item[field];
        const actual = row[sizeColumnStart + i]?.content;
        if (expected === '' || expected === undefined) {
          expect(actual ?? '').toBe('');
        } else {
          expect(actual).toBe(String(expected));
        }
      }
    });
  });
});
