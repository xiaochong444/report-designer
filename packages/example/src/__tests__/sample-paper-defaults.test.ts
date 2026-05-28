import { describe, expect, it } from 'vitest';
import { renderReport } from '@report-designer/core';
import { sampleReports } from '../templates';
import { commonTextStyles, template } from '../templates/common';
import { eventLogicTemplate } from '../templates/event-logic';

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

  it('bundles a table detail sample that binds the table to an order items array', () => {
    const sample = sampleReports.find(report => report.key === 'tableDetail');
    const components = sample?.template.pages.flatMap(page => page.bands.flatMap(band => band.components)) ?? [];
    const table = components.find(component => component.type === 'table') as any;

    expect(sample?.label).toBe('Table Detail');
    expect(sample?.data.orders[0].items).toHaveLength(2);
    expect(sample?.template.dataSources.map(source => source.id)).toEqual(expect.arrayContaining(['orders', 'orders.items']));
    expect(table).toMatchObject({
      type: 'table',
      binding: { mode: 'detail', dataSourceId: 'orders.items', arrayPath: 'items' },
    });
    expect(table.cells).toEqual(expect.arrayContaining([
      expect.objectContaining({ row: 1, column: 0, text: '{sku}' }),
      expect.objectContaining({ row: 1, column: 1, text: '{name}' }),
      expect.objectContaining({ row: 1, column: 2, text: '{qty}' }),
    ]));

    const document = renderReport(sample!.template, sample!.data);
    const firstRenderedTable = document.pages.flatMap(page => page.items)
      .flatMap(item => item.components)
      .find(component => component.type === 'table') as any;
    const firstOrderBandComponents = document.pages[0].items
      .find(item => item.bandId === 'table-detail-data')
      ?.components ?? [];

    expect(firstOrderBandComponents.map((component: any) => component.content)).toEqual(expect.arrayContaining(['Order: SO-1001', 'Northwind Studio']));
    expect(firstRenderedTable.rows.map((row: any[]) => row.map(cell => cell.content))).toEqual([
      ['SKU', 'Item', 'Qty', 'Unit', 'Total'],
      ['P-100', 'Design Seat', '2', '240.00', '480.00'],
      ['P-210', 'PDF Export Pack', '1', '180.00', '180.00'],
    ]);
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
});
