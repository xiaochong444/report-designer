import { describe, expect, it } from 'vitest';
import { renderReport } from '@report-designer/core';
import { expressionFunctions } from '../expression-extensions';
import { sampleGroups, sampleReports } from '../templates';
import { commonTextStyles, template } from '../templates/common';
import { memberConsumptionTemplate } from '../templates/member-consumption';

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

function findBarcodeValue(reportTitleBand: any, barcodeId: string): string | undefined {
  const barcode = reportTitleBand?.components?.find((component: any) => component.id === barcodeId);
  return barcode?.value;
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

  it('groups bundled samples into five learning-path sections', () => {
    expect(sampleGroups.map(group => group.label)).toEqual([
      '单据打印',
      '分组汇总',
      '服装行业',
      '高级特性',
      '图表与综合',
    ]);
    expect(sampleReports).toHaveLength(12);
    expect(sampleReports.map(report => report.key)).toEqual([
      'purchaseReceipt',
      'salesOrderPrint',
      'storeDailySales',
      'warehouseTransfer',
      'clothingOrderDynamicSize',
      'clothingOrderGroupedSize',
      'productHangTags',
      'orgHierarchy',
      'memberConsumption',
      'businessDashboard',
      'contractTerms',
      'componentShowcase',
    ]);
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

  it('bundles document print samples with order-number barcodes in report headers', () => {
    const documentSamples = [
      { key: 'purchaseReceipt', barcodeId: 'pr-barcode', field: '{receiptNo}' },
      { key: 'salesOrderPrint', barcodeId: 'sop-barcode', field: '{orderNo}' },
      { key: 'storeDailySales', barcodeId: 'sds-barcode', field: '{reportNo}' },
      { key: 'warehouseTransfer', barcodeId: 'wt-barcode', field: '{transferNo}' },
      { key: 'clothingOrderDynamicSize', barcodeId: 'clothing-order-barcode', field: '{orderNo}' },
      { key: 'clothingOrderGroupedSize', barcodeId: 'grouped-size-barcode', field: '{orderNo}' },
    ] as const;

    for (const entry of documentSamples) {
      const sample = sampleReports.find(report => report.key === entry.key);
      const titleBand = sample?.template.pages[0].bands.find(band => band.type === 'reportTitle');
      expect(findBarcodeValue(titleBand, entry.barcodeId)).toBe(entry.field);
    }
  });

  it('bundles a purchase receipt sample with table detail and totals', () => {
    const sample = sampleReports.find(report => report.key === 'purchaseReceipt');
    const detailBand = sample?.template.pages[0].bands.find(band => band.id === 'pr-detail');

    expect(sample?.label).toBe('采购入库单');
    expect(sample?.template.dataSources).toEqual([]);
    expect(detailBand?.dataBand?.dataSourceId).toBe('items');

    const document = renderReport(sample!.template, sample!.data, { expressionFunctions });
    const content = renderedContent(document);

    expect(content).toEqual(expect.arrayContaining([
      '采购入库单',
      'RK-202606-0088',
      '特种绣花针织裤',
      '杭州织造商贸有限公司',
    ]));
    expect(content.some(value => String(value).includes('元'))).toBe(true);
  });

  it('bundles a store daily sales sample with grouped totals', () => {
    const sample = sampleReports.find(report => report.key === 'storeDailySales');
    const groupBand = sample?.template.pages[0].bands.find(band => band.type === 'groupHeader');

    expect(sample?.label).toBe('门店销售日报');
    expect(groupBand?.group?.conditionExpression).toBe('{lines.storeName}');

    const document = renderReport(sample!.template, sample!.data);
    expect(renderedContent(document)).toEqual(expect.arrayContaining([
      '门店销售日报',
      'RB-20260610-SH',
      '门店：南京新街口店',
      '特种绣花针织裤',
      '笔数：8',
      '小计：2633.00',
      '总笔数：24',
      '合计：9065.00',
    ]));
  });

  it('renders store daily sales group and report totals as merged table footer rows', () => {
    const sample = sampleReports.find(report => report.key === 'storeDailySales');
    const groupFooterBand = sample?.template.pages[0].bands.find(band => band.id === 'sds-group-footer');
    const reportFooterBand = sample?.template.pages[0].bands.find(band => band.id === 'sds-footer');

    expect(groupFooterBand?.components[0]).toMatchObject({ type: 'table' });
    expect(reportFooterBand?.components[0]).toMatchObject({ type: 'table' });

    const document = renderReport(sample!.template, sample!.data);
    const groupFooterTables = document.pages
      .flatMap(page => page.items)
      .filter(item => item.bandId === 'sds-group-footer')
      .map(item => item.components.find(component => component.id === 'sds-group-footer-table'));
    const nanjingGroupFooterTable = groupFooterTables.find(component => (
      component?.type === 'table'
      && component.rows[0]?.some(cell => cell.content === '小计：2633.00')
    ));
    const reportFooterTable = document.pages
      .flatMap(page => page.items)
      .find(item => item.bandId === 'sds-footer')
      ?.components.find(component => component.id === 'sds-footer-table');

    expect(nanjingGroupFooterTable).toMatchObject({
      type: 'table',
      rows: [[
        { content: '门店小计', column: 0, colSpan: 4 },
        { content: '笔数：8', column: 4, colSpan: 2 },
        { content: '小计：2633.00', column: 6, colSpan: 1 },
      ]],
    });
    expect(reportFooterTable).toMatchObject({
      type: 'table',
      rows: [[
        { content: '合计', column: 0, colSpan: 4 },
        { content: '总笔数：24', column: 4, colSpan: 2 },
        { content: '合计：9065.00', column: 6, colSpan: 1 },
      ]],
    });
  });

  it('bundles a product hang tag sample using data band columns', () => {
    const sample = sampleReports.find(report => report.key === 'productHangTags');
    const dataBand = sample?.template.pages[0].bands.find(band => band.id === 'pht-data');

    expect(sample?.label).toBe('商品吊牌批量打印');
    expect(dataBand?.dataBand?.dataSourceId).toBe('hangTags');
    expect(dataBand?.dataBand?.columns).toEqual({ count: 3, gap: 5, direction: 'acrossThenDown' });

    const document = renderReport(sample!.template, sample!.data);
    const labels = document.pages.flatMap(page => page.items).filter(item => item.bandId === 'pht-data');

    expect(labels).toHaveLength(12);
    expect(renderedContent(document)).toEqual(expect.arrayContaining([
      '特种绣花针织裤',
      '¥199',
      'KZ-86021',
    ]));
  });

  it('bundles a hierarchical data band sample with tree-shaped rows', () => {
    const sample = sampleReports.find(report => report.key === 'orgHierarchy');
    const dataBand = sample?.template.pages[0].bands.find(band => band.id === 'oh-data');

    expect(sample?.label).toBe('组织架构树');
    expect(dataBand?.type).toBe('hierarchicalData');
    expect(dataBand?.dataBand?.hierarchical).toEqual({ childrenField: 'children', indentChars: 3 });

    const document = renderReport(sample!.template, sample!.data);
    expect(renderedContent(document)).toEqual(expect.arrayContaining([
      '织造服饰集团',
      '   华东大区',
      '      南京分公司',
    ]));
  });

  it('bundles a member consumption sample with render-time scripts', () => {
    const sample = sampleReports.find(report => report.key === 'memberConsumption');
    const dataBand = memberConsumptionTemplate.pages[0].bands.find(band => band.type === 'data');
    const textComponents = memberConsumptionTemplate.pages[0].bands
      .flatMap(band => band.components)
      .filter(component => component.type === 'text');

    expect(sample?.label).toBe('会员消费明细');
    expect(memberConsumptionTemplate.events?.beforePreview?.script).toContain('ctx.log');
    expect(dataBand?.events?.beforePrint?.script).toContain('ctx.createText');
    expect(textComponents.some(component => component.events?.getValue)).toBe(true);
    expect(textComponents.some(component => component.events?.beforePrint?.script.includes('ctx.hide'))).toBe(true);
    expect(textComponents.some(component => component.conditionalFormat === 'amount-high')).toBe(true);
  });

  it('bundles a sales order print sample driven by inferred object data sources and data bands', () => {
    const sample = sampleReports.find(report => report.key === 'salesOrderPrint');
    const bands = sample?.template.pages[0].bands ?? [];
    const components = bands.flatMap(band => band.components);

    expect(sample?.label).toBe('销售订单打印');
    expect(components.find(component => component.id === 'sop-approved')).toMatchObject({
      type: 'text',
      text: '已审核',
      visible: '{status} = "已审核"',
    });

    const document = renderReport(sample!.template, sample!.data as any, { expressionFunctions });
    const content = renderedContent(document);

    expect(document.pages.length).toBeGreaterThan(1);
    expect(content).toEqual(expect.arrayContaining([
      '销售订单',
      '已审核',
      'SO-202606-001',
      '138****5678',
    ]));
    expect(content.some(value => String(value).endsWith('元整'))).toBe(true);
  });

  it('bundles a business dashboard sample with common chart types bound to JSON data', () => {
    const sample = sampleReports.find(report => report.key === 'businessDashboard');
    const components = sample?.template.pages.flatMap(page => page.bands.flatMap(band => band.components)) ?? [];
    const charts = components.filter(component => component.type === 'chart') as any[];

    expect(sample?.label).toBe('经营分析看板');
    expect(charts.map(chart => chart.chartType)).toEqual(expect.arrayContaining([
      'column',
      'line',
      'area',
      'donut',
      'scatter',
      'funnel',
      'radar',
    ]));
    expect(charts.every(chart => chart.binding.dataSourceId === 'salesAnalytics')).toBe(true);

    const document = renderReport(sample!.template, sample!.data);
    const renderedCharts = document.pages.flatMap(page => page.items)
      .flatMap(item => item.components)
      .filter(component => component.type === 'chart') as any[];

    expect(renderedCharts).toHaveLength(7);
    expect(renderedCharts.find(chart => chart.chartType === 'column')?.data.length).toBeGreaterThan(0);
    expect(renderedCharts.find(chart => chart.chartType === 'donut')).toBeTruthy();
  });

  it('bundles a component showcase sample with panel children and Chinese fonts', () => {
    const sample = sampleReports.find(report => report.key === 'componentShowcase');
    const components = sample?.template.pages.flatMap(page => page.bands.flatMap(band => band.components)) ?? [];
    const panel = components.find(component => component.type === 'panel') as any;

    expect(sample?.label).toBe('组件能力全景');
    expect(sample?.template.fonts).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: '微软雅黑', family: 'Microsoft YaHei' }),
      expect.objectContaining({ name: '宋体', family: 'SimSun' }),
    ]));
    expect(panel?.components?.map((component: any) => component.type)).toEqual(expect.arrayContaining([
      'text',
      'image',
      'line',
      'shape',
      'checkbox',
      'barcode',
      'qrcode',
      'richtext',
    ]));
    expect(components.some(component => component.type === 'pagenumber')).toBe(true);
    expect(components.some(component => component.type === 'datetime')).toBe(true);
    expect(components.some(component => component.type === 'subreport')).toBe(false);
  });

  it('bundles a contract terms sample with watermark and page border', () => {
    const sample = sampleReports.find(report => report.key === 'contractTerms');
    const page = sample?.template.pages[0];

    expect(sample?.label).toBe('合同条款与长文本');
    expect(page?.watermark?.enabled).toBe(true);
    expect(page?.watermark?.text).toBe('内部资料');
    expect(page?.pageBorder?.enabled).toBe(true);
  });

  it('uses a single JSON input model for bundled sample templates', () => {
    const forbiddenSourceIds = new Set(['orders.items', 'orderLines', 'productLabels', 'chartSales']);

    for (const sample of sampleReports) {
      const dataSourceIds = sample.template.dataSources.map(source => source.id);
      expect(dataSourceIds.filter(id => forbiddenSourceIds.has(id))).toEqual([]);
    }
  });
});
