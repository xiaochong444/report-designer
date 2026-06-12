import type { ChartAggregateMode, ChartComponent, ChartType } from '@report-designer/core';
import { band, commonTextStyleIds, template, text } from './common';

function chart(
  id: string,
  chartType: ChartType,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    title: string;
    dimField?: string;
    meaField?: string;
    xField?: string;
    yField?: string;
    seriesField?: string;
    aggregate?: ChartAggregateMode;
    axisTitleX?: string;
    axisTitleY?: string;
  },
): ChartComponent {
  const isPieLike = chartType === 'pie' || chartType === 'donut' || chartType === 'rose';
  const isScatter = chartType === 'scatter';
  return {
    id,
    type: 'chart',
    name: id,
    x,
    y,
    width,
    height,
    chartType,
    binding: {
      dataSourceId: 'chartSales',
      dimensions: isScatter
        ? (options.xField ? [{ field: options.xField }] : [])
        : (options.dimField ? [{ field: options.dimField }] : []),
      measures: isScatter
        ? (options.yField ? [{ field: options.yField }] : [])
        : (options.meaField ? [{ field: options.meaField }] : []),
      seriesField: options.seriesField ?? '',
      labelField: isPieLike ? (options.dimField ?? '') : '',
      sort: [{ field: options.dimField ?? options.xField ?? '', direction: 'asc' }],
      aggregate: options.aggregate ?? 'sum',
    },
    appearance: {
      title: options.title,
      showLegend: Boolean(options.seriesField) || isPieLike,
      legendPosition: 'bottom',
      showAxes: !isPieLike,
      showGrid: !isPieLike,
      showLabels: isPieLike,
      theme: { baseTheme: 'light' },
      axisTitleX: options.axisTitleX ?? '',
      axisTitleY: options.axisTitleY ?? '',
    },
    emptyMessage: 'No chart data',
  };
}

export const chartsTemplate = template('charts', '销售图表', [
  band('charts-title', 'reportTitle', 16, [
    text('charts-title-text', '销售数据分析', 0, 2, 80, 8, { style: commonTextStyleIds.title }),
    text('charts-subtitle', '基于销售数据的柱状图、折线图、面积图、饼图、散点图、雷达图和漏斗图', 92, 3, 92, 6, { style: commonTextStyleIds.pageHeader }),
  ]),
  band('charts-body', 'reportTitle', 210, [
    // 按产品类型统计销售额（柱状图）
    chart('chart-sales-product', 'column', 0, 0, 88, 44, {
      title: '产品类型销售额',
      dimField: 'productType',
      meaField: 'amount',
      aggregate: 'sum',
      axisTitleY: '销售额',
    }),
    // 按年月统计销售额趋势（折线图）
    chart('chart-sales-trend', 'line', 96, 0, 88, 44, {
      title: '月度销售趋势',
      dimField: 'yearMonth',
      meaField: 'amount',
      aggregate: 'sum',
      axisTitleY: '销售额',
    }),
    // 按年月统计各产品类型销售数量（面积图 + 系列）
    chart('chart-qty-trend', 'area', 0, 52, 88, 44, {
      title: '各产品类型月度销售数量',
      dimField: 'yearMonth',
      meaField: 'quantity',
      seriesField: 'productType',
      aggregate: 'sum',
      axisTitleY: '销售数量',
    }),
    // 产品类型销售额占比（环图）
    chart('chart-sales-share', 'donut', 96, 52, 88, 44, {
      title: '产品类型销售占比',
      dimField: 'productType',
      meaField: 'amount',
      aggregate: 'sum',
    }),
    // 销售数量 vs 销售额散点图
    chart('chart-qty-amount', 'scatter', 48, 104, 88, 38, {
      title: '销售数量与销售额关系',
      xField: 'quantity',
      yField: 'amount',
      seriesField: 'productType',
      aggregate: 'none',
      axisTitleX: '销售数量',
      axisTitleY: '销售额',
    }),
    // 产品类型销售漏斗
    chart('chart-product-funnel', 'funnel', 0, 152, 88, 44, {
      title: '产品类型销售漏斗',
      dimField: 'productType',
      meaField: 'amount',
      aggregate: 'sum',
    }),
    // 产品类型雷达图
    chart('chart-product-radar', 'radar', 96, 152, 88, 44, {
      title: '产品类型综合评估',
      dimField: 'productType',
      meaField: 'amount',
      aggregate: 'sum',
    }),
  ]),
  band('charts-footer', 'pageFooter', 8, [
    text('charts-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footerCenter }),
  ]),
]);
