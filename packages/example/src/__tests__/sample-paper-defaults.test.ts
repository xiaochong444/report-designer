import { describe, expect, it } from 'vitest';
import { renderReport } from '@report-designer/core';
import { expressionFunctions } from '../expression-extensions';
import { sampleReports } from '../templates';
import { commonTextStyles, template } from '../templates/common';
import { eventLogicTemplate } from '../templates/event-logic';

function renderedContent(document: any): string[] {
  return document.pages
    .flatMap((page: any) => page.items)
    .flatMap((item: any) => item.components)
    .flatMap((component: any) => {
      if (component.type === 'table') {
        return component.rows.flatMap((row: any[]) => row.map(cell => cell.content));
      }
      return [component.content];
    })
    .filter((value: unknown): value is string => value !== undefined && value !== null);
}

describe('example sample paper defaults', () => {
  it('uses A4 paper for every bundled sample report', () => {
    for (const sample of sampleReports) {
      const firstPage = sample.template.pages[0];
      expect(firstPage?.width).toBe(210);
      expect(firstPage?.height).toBe(297);
      expect(firstPage?.orientation).toBe('portrait');
    }
  });

  it('clones the common text style seed for each generated template', () => {
    const originalLength = commonTextStyles.length;
    const first = template('seed-a', 'Seed A', []);
    const second = template('seed-b', 'Seed B', []);

    expect(first.styles).not.toBe(second.styles);
    expect(first.styles[0]).not.toBe(second.styles[0]);
    expect(first.styles[0]?.font).not.toBe(second.styles[0]?.font);

    first.styles.push({
      id: 'local-only',
      name: 'Local Only',
      category: 'text',
      font: { size: 11 },
    });

    expect(commonTextStyles).toHaveLength(originalLength);
    expect(second.styles).toHaveLength(originalLength);
  });

  it('bundles a common components sample with panel children and a local subreport key', () => {
    const sample = sampleReports.find(report => report.key === 'commonComponents');

    expect(sample?.label).toBe('Common Components');

    const components = sample?.template.pages.flatMap(page => page.bands.flatMap(band => band.components)) ?? [];
    const panel = components.find(component => component.type === 'panel') as any;
    const subreport = components.find(component => component.type === 'subreport') as any;

    expect(panel?.components?.map((component: any) => component.type)).toEqual(expect.arrayContaining([
      'text',
      'image',
      'line',
      'shape',
      'checkbox',
      'barcode',
      'richtext',
      'subreport',
    ]));
    expect(subreport?.templateUrl).toBe('common-components-detail');
    expect(sample?.subreports?.['common-components-detail']?.name).toBe('Common Components Detail');
  });

  it('bundles an event logic sample with render-time scripts', () => {
    const sample = sampleReports.find(report => report.key === 'eventLogic');
    const dataBand = eventLogicTemplate.pages[0].bands.find(band => band.type === 'data');
    const textComponents = eventLogicTemplate.pages[0].bands.flatMap(band => band.components).filter(component => component.type === 'text');

    expect(sample?.label).toBe('Event Logic');
    expect(eventLogicTemplate.events?.beforePreview?.script).toContain('ctx.log');
    expect(dataBand?.events?.beforePrint?.script).toContain('ctx.createText');
    expect(textComponents.some(component => component.events?.getValue)).toBe(true);
    expect(textComponents.some(component => component.events?.beforePrint?.script.includes('ctx.hide'))).toBe(true);
    expect(textComponents.some(component => component.events?.beforePrint?.script.includes('ctx.component.font'))).toBe(true);
  });

  it('bundles a table detail sample rendered by a data band table', () => {
    const sample = sampleReports.find(report => report.key === 'tableDetail');
    const components = sample?.template.pages.flatMap(page => page.bands.flatMap(band => band.components)) ?? [];
    const tables = components.filter(component => component.type === 'table') as any[];
    const detailTable = tables.find(component => component.id === 'table-detail-line-table');

    expect(sample?.label).toBe('Table Detail');
    expect(sample?.data.orders[0].items).toHaveLength(2);
    expect(sample?.template.dataSources.map(source => source.id)).toEqual(expect.arrayContaining(['orderLines']));
    expect(sample?.template.pages[0].bands.find(band => band.id === 'table-detail-data')?.dataBand?.dataSourceId).toBe('orderLines');
    expect(detailTable).toMatchObject({
      type: 'table',
    });
    expect('binding' in detailTable).toBe(false);
    expect('columns' in detailTable).toBe(false);
    expect('cells' in detailTable).toBe(false);
    expect(detailTable.rows[0].cells).toEqual(expect.arrayContaining([
      expect.objectContaining({ text: '{orderLines.sku}' }),
      expect.objectContaining({ text: '{orderLines.name}' }),
      expect.objectContaining({ text: '{orderLines.qty}' }),
    ]));

    const document = renderReport(sample!.template, sample!.data);
    const renderedTables = document.pages.flatMap(page => page.items)
      .flatMap(item => item.components)
      .filter(component => component.type === 'table') as any[];

    expect(renderedTables[0].rows.map((row: any[]) => row.map(cell => cell.content))).toEqual([
      ['Order', 'Customer', 'SKU', 'Item', 'Qty', 'Total'],
    ]);
    expect(renderedContent(document)).toEqual(expect.arrayContaining([
      'SO-1001',
      'Northwind Studio',
      'P-100',
      'Design Seat',
      '480.00',
    ]));
  });

  it('bundles a sales order print sample driven by inferred object data sources and data bands', () => {
    const sample = sampleReports.find(report => report.key === 'salesOrderPrint');
    const bands = sample?.template.pages[0].bands ?? [];
    const components = bands.flatMap(band => band.components);

    expect(sample?.label).toBe('Sales Order Print');
    expect(sample?.template.dataSources).toEqual([]);
    expect(components.filter(component => component.type === 'table').map(component => component.id)).toEqual(expect.arrayContaining([
      'sop-header-table',
      'sop-detail-table',
      'sop-footer-table',
    ]));
    expect(bands.find(band => band.id === 'sop-title')?.dataBand?.dataSourceId).toBe('root');
    expect(bands.find(band => band.id === 'sop-detail')?.dataBand?.dataSourceId).toBe('items');
    expect(components.find(component => component.id === 'sop-approved')).toMatchObject({
      type: 'text',
      text: '已审核',
      visible: '{status} = "已审核"',
    });
    const detailTable = components.find(component => component.id === 'sop-detail-table') as any;
    const footerTable = components.find(component => component.id === 'sop-footer-table') as any;
    expect(detailTable.rows[0].cells).toEqual(expect.arrayContaining([
      expect.objectContaining({ text: '{items.product.name}' }),
      expect.objectContaining({ text: 'FORMAT("N2", DISCOUNT({items.salesPrice} * {items.qty}, 1 - {items.salesDiscount}))' }),
    ]));
    expect(bands.find(band => band.id === 'sop-detail-header')?.behavior?.printOnAllPages).toBe(true);
    expect(footerTable.rows[0].cells[0]).toMatchObject({
      text: '合计',
      colSpan: 7,
    });
    expect(detailTable.border.sides).toMatchObject({ top: false, right: true, bottom: true, left: true });

    const document = renderReport(sample!.template, sample!.data as any, { expressionFunctions });
    const content = renderedContent(document);
    const salesOrderData = sample!.data as { items: Array<{ salesAmount: number }> };
    const totalAmount = salesOrderData.items.reduce((sum, item) => sum + item.salesAmount, 0).toFixed(2);

    expect(document.pages.length).toBeGreaterThan(1);
    expect(content).toEqual(expect.arrayContaining([
      '销售订单',
      '已审核',
      'SO-202606-001',
      '华东科技有限公司',
      '138****5678',
      '云服务年包',
      '实施服务',
      '培训服务',
      '1000.00',
      totalAmount,
    ]));
    expect(content.some(value => String(value).endsWith('元整'))).toBe(true);
  });

  it('bundles a chart sample with common chart types bound to JSON data', () => {
    const sample = sampleReports.find(report => report.key === 'charts');
    const components = sample?.template.pages.flatMap(page => page.bands.flatMap(band => band.components)) ?? [];
    const charts = components.filter(component => component.type === 'chart') as any[];

    expect(sample?.label).toBe('Charts');
    expect(charts.map(chart => chart.chartType)).toEqual(expect.arrayContaining(['bar', 'line', 'area', 'pie', 'point']));
    expect(charts.every(chart => chart.binding.dataSourceId === 'chartSales')).toBe(true);

    const document = renderReport(sample!.template, sample!.data);
    const renderedCharts = document.pages.flatMap(page => page.items)
      .flatMap(item => item.components)
      .filter(component => component.type === 'chart') as any[];

    expect(renderedCharts).toHaveLength(5);
    expect(renderedCharts.find(chart => chart.chartType === 'bar')?.data.length).toBeGreaterThan(0);
    expect(renderedCharts.find(chart => chart.chartType === 'pie')?.variant).toBe('donut');
    expect(renderedCharts.find(chart => chart.chartType === 'point')?.data[0]).toMatchObject({
      x: expect.any(Number),
      y: expect.any(Number),
    });
  });

  it('bundles a custom Chinese font sample registered from template code', () => {
    const sample = sampleReports.find(report => report.key === 'customChineseFont');
    const components = sample?.template.pages.flatMap(page => page.bands.flatMap(band => band.components)) ?? [];
    const textComponents = components.filter(component => component.type === 'text') as any[];
    const reportTitleBand = sample?.template.pages[0].bands.find(band => band.type === 'reportTitle');

    expect(sample?.label).toBe('Custom Chinese Font');
    expect(sample?.template.pages[0].bands.some(band => band.type === 'data')).toBe(false);
    expect(reportTitleBand?.components).toHaveLength(textComponents.length);
    expect(sample?.template.fonts).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: '微软雅黑', family: 'Microsoft YaHei' }),
      expect.objectContaining({ name: '宋体', family: 'SimSun' }),
      expect.objectContaining({ name: '黑体', family: 'SimHei' }),
      expect.objectContaining({ name: '楷体', family: 'KaiTi' }),
      expect.objectContaining({ name: '仿宋', family: 'FangSong' }),
    ]));
    expect(textComponents.length).toBeGreaterThan(0);
    expect(textComponents.map(component => component.font.family)).toEqual(expect.arrayContaining([
      'Microsoft YaHei',
      'SimSun',
      'SimHei',
      'KaiTi',
      'FangSong',
    ]));

    const document = renderReport(sample!.template, {});
    expect(document.fonts?.map(font => font.name)).toEqual(expect.arrayContaining(['微软雅黑', '宋体', '黑体', '楷体', '仿宋']));
    expect(document.pages.flatMap(page => page.items).flatMap(item => item.components).map((component: any) => component.content)).toEqual(
      expect.arrayContaining(['常见中文字体代码注册示例', '微软雅黑：采购入库单、供应商、仓库、明细合计。']),
    );
  });
});
