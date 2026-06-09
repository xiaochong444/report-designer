import type { ChartAggregateMode, ChartComponent, ChartType, ChartVariant } from '@report-designer/core';
import { band, commonTextStyleIds, template, text } from './common';

const chartPalette = ['#2f6fed', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'];

function chart(
  id: string,
  chartType: ChartType,
  variant: ChartVariant,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    title: string;
    categoryExpression?: string;
    valueExpression?: string;
    xExpression?: string;
    yExpression?: string;
    seriesExpression?: string;
    aggregate?: ChartAggregateMode;
    axisTitleX?: string;
    axisTitleY?: string;
  },
): ChartComponent {
  return {
    id,
    type: 'chart',
    name: id,
    x,
    y,
    width,
    height,
    chartType,
    variant,
    binding: {
      dataSourceId: 'chartSales',
      categoryExpression: options.categoryExpression ?? '',
      valueExpression: options.valueExpression ?? '',
      xExpression: options.xExpression ?? '',
      yExpression: options.yExpression ?? '',
      seriesExpression: options.seriesExpression ?? '',
      labelExpression: options.categoryExpression ?? '',
      sort: [{ field: options.categoryExpression ?? options.xExpression ?? '', direction: 'asc' }],
      aggregate: options.aggregate ?? 'sum',
    },
    appearance: {
      title: options.title,
      showLegend: Boolean(options.seriesExpression || chartType === 'pie'),
      legendPosition: 'bottom',
      showAxes: chartType !== 'pie',
      showGrid: chartType !== 'pie',
      showLabels: chartType === 'pie',
      palette: chartPalette,
      axisTitleX: options.axisTitleX ?? '',
      axisTitleY: options.axisTitleY ?? '',
      innerRadius: variant === 'donut' ? 0.55 : 0,
      outerRadius: 0.85,
    },
    emptyMessage: 'No chart data',
  };
}

export const chartsTemplate = template('charts', 'Charts', [
  band('charts-title', 'reportTitle', 16, [
    text('charts-title-text', 'Charts', 0, 2, 80, 8, { style: commonTextStyleIds.title }),
    text('charts-subtitle', 'Bar, line, area, pie, and point charts bound to JSON data', 92, 3, 92, 6, { style: commonTextStyleIds.pageHeader }),
  ]),
  band('charts-body', 'reportTitle', 150, [
    chart('chart-sales-customer', 'bar', 'default', 0, 0, 88, 44, {
      title: 'Sales by Customer',
      categoryExpression: '{customer}',
      valueExpression: '{amount}',
      aggregate: 'sum',
      axisTitleY: 'Amount',
    }),
    chart('chart-sales-date', 'line', 'smooth', 96, 0, 88, 44, {
      title: 'Sales Trend',
      categoryExpression: '{month}',
      valueExpression: '{amount}',
      aggregate: 'sum',
      axisTitleY: 'Amount',
    }),
    chart('chart-qty-date', 'area', 'stacked', 0, 52, 88, 44, {
      title: 'Quantity by Month',
      categoryExpression: '{month}',
      valueExpression: '{qty}',
      seriesExpression: '{channel}',
      aggregate: 'sum',
      axisTitleY: 'Quantity',
    }),
    chart('chart-sales-share', 'pie', 'donut', 96, 52, 88, 44, {
      title: 'Customer Share',
      categoryExpression: '{customer}',
      valueExpression: '{amount}',
      aggregate: 'sum',
    }),
    chart('chart-qty-value', 'point', 'scatter', 48, 104, 88, 38, {
      title: 'Quantity / Amount',
      xExpression: '{qty}',
      yExpression: '{amount}',
      seriesExpression: '{customer}',
      aggregate: 'none',
      axisTitleX: 'Qty',
      axisTitleY: 'Amount',
    }),
  ]),
  band('charts-footer', 'pageFooter', 8, [
    text('charts-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footerCenter }),
  ]),
]);

chartsTemplate.dataSources.push({
  id: 'chartSales',
  name: 'chartSales',
  type: 'json',
  path: 'chartSales',
  fields: [
    { id: 'chartSales.month', name: 'month', path: 'chartSales.month', type: 'string', nullable: false },
    { id: 'chartSales.customer', name: 'customer', path: 'chartSales.customer', type: 'string', nullable: false },
    { id: 'chartSales.channel', name: 'channel', path: 'chartSales.channel', type: 'string', nullable: false },
    { id: 'chartSales.amount', name: 'amount', path: 'chartSales.amount', type: 'number', nullable: false },
    { id: 'chartSales.qty', name: 'qty', path: 'chartSales.qty', type: 'number', nullable: false },
  ],
});
