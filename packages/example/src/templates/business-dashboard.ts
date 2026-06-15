import type { ChartComponent, ChartType } from '@report-designer/core';
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
    axisTitleX?: string;
    axisTitleY?: string;
  },
): ChartComponent {
  const isPieLike = chartType === 'pie' || chartType === 'donut' || chartType === 'rose';
  const isScatter = chartType === 'scatter';
  const showLegend = isPieLike;
  const showAxes = !isPieLike;
  const showLabels = isPieLike;
  const plotOptions: ChartComponent['plotOptions'] = {};

  if (chartType === 'donut') {
    plotOptions.pie = { innerRadius: 0.55 };
  }

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
      dataSourceId: 'salesAnalytics',
      dimensions: isScatter
        ? (options.xField ? [{ field: options.xField }] : [])
        : (options.dimField ? [{ field: options.dimField }] : []),
      measures: isScatter
        ? (options.yField ? [{ field: options.yField, aggregation: 'none' }] : [])
        : (options.meaField ? [{ field: options.meaField, aggregation: 'sum' }] : []),
      sort: [{ field: options.dimField ?? options.xField ?? '', direction: 'asc' }],
    },
    title: {
      visible: true,
      text: options.title,
      color: '#111827',
      font: { size: 14, bold: true },
    },
    legend: {
      visible: showLegend,
      position: 'bottom',
      color: '#475569',
      font: { size: 10 },
    },
    axes: {
      x: {
        visible: showAxes,
        title: options.axisTitleX ?? '',
        gridVisible: false,
        labelColor: '#475569',
        titleColor: '#334155',
      },
      y: {
        visible: showAxes,
        title: options.axisTitleY ?? '',
        gridVisible: showAxes,
        gridColor: '#e2e8f0',
        labelColor: '#475569',
        titleColor: '#334155',
      },
    },
    labels: {
      visible: showLabels,
      content: showLabels ? 'name' : 'value',
      color: '#1f2937',
      font: { size: 10 },
    },
    theme: {
      baseTheme: 'light',
      palettePresetId: 'business',
      axisLabelColor: '#475569',
      axisTitleColor: '#334155',
      axisGridColor: '#e2e8f0',
      labelColor: '#1f2937',
      legendLabelColor: '#475569',
      titleColor: '#111827',
    },
    plotOptions,
    emptyMessage: '暂无图表数据',
  };
}

export const businessDashboardTemplate = template('business-dashboard', '经营分析看板', [
  band('bd-title', 'reportTitle', 16, [
    text('bd-title-text', '经营分析看板', 0, 2, 80, 8, { style: commonTextStyleIds.title }),
    text('bd-subtitle', '柱状图、折线图、面积图、环图、散点图、漏斗图、雷达图', 92, 3, 92, 6, { style: commonTextStyleIds.pageHeader }),
  ]),
  band('bd-body', 'reportTitle', 210, [
    chart('bd-sales-category', 'column', 0, 0, 88, 44, {
      title: '品类销售额',
      dimField: 'category',
      meaField: 'amount',
      axisTitleY: '销售额',
    }),
    chart('bd-sales-trend', 'line', 96, 0, 88, 44, {
      title: '月度销售趋势',
      dimField: 'yearMonth',
      meaField: 'amount',
      axisTitleY: '销售额',
    }),
    chart('bd-qty-trend', 'area', 0, 52, 88, 44, {
      title: '各品类月度销量',
      dimField: 'yearMonth',
      meaField: 'quantity',
      axisTitleY: '销量',
    }),
    chart('bd-channel-share', 'donut', 96, 52, 88, 44, {
      title: '渠道销售占比',
      dimField: 'channel',
      meaField: 'amount',
    }),
    chart('bd-scatter', 'scatter', 48, 104, 88, 38, {
      title: '客单价与连带率',
      xField: 'avgOrderValue',
      yField: 'attachRate',
      axisTitleX: '客单价',
      axisTitleY: '连带率',
    }),
    chart('bd-funnel', 'funnel', 0, 152, 88, 44, {
      title: '会员转化漏斗',
      dimField: 'funnelStage',
      meaField: 'count',
    }),
    chart('bd-radar', 'radar', 96, 152, 88, 44, {
      title: '区域 KPI 雷达',
      dimField: 'region',
      meaField: 'kpiScore',
    }),
  ]),
  band('bd-footer', 'pageFooter', 8, [
    text('bd-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footerCenter }),
  ]),
]);
