import React from 'react';
import type { CollapseProps } from 'antd';
import { Form, Input, Select } from 'antd';
import type { ChartComponent, DataSource, ReportFontOption } from '@report-designer/core';
import { getChartCapabilities } from '@report-designer/core';
import { ChartAxesPanel } from './ChartAxesPanel';
import { ChartDataPanel } from './ChartDataPanel';
import { ChartLabelPanel } from './ChartLabelPanel';
import { ChartLegendPanel } from './ChartLegendPanel';
import { ChartThemePanel } from './ChartThemePanel';
import { ChartTitlePanel } from './ChartTitlePanel';
import { ChartTypeStylePanel } from './ChartTypeStylePanel';
import {
  chartTypeOptions,
  chartUiText,
  getChartAxes,
  getChartLabels,
  getChartLegend,
  getChartPlotOptions,
  getChartTheme,
  getChartTitle,
  type ChartPanelT,
} from './chart-options';

const FORM_LABEL_COL = { span: 8 };
const FORM_WRAPPER_COL = { span: 16 };

export interface BuildChartPropertyItemsArgs {
  chart: ChartComponent;
  dataSourceOptions: Array<{ value: string; label: string }>;
  dataSourceDefinitions: DataSource[];
  reportFontOptions: ReportFontOption[];
  onChange: (field: string, value: any) => void;
  onChangeMany: (updates: Partial<ChartComponent>) => void;
  t: ChartPanelT;
}

/**
 * 构建图表属性面板的 Collapse items 数组。
 *
 * 不再渲染自己的 Collapse，而是返回 items 数组，由外层 PropertyEditor merge 进统一的
 * Collapse.items，避免"折叠面板套折叠面板"。数组按能力矩阵 filter 生成——无意义的组
 * （如饼图无坐标轴）根本不出现，而非"出现但置灰/空白"。
 *
 * 这是一个普通函数（非组件），便于外层直接展开返回值到 items 数组。
 */
export function buildChartPropertyItems({
  chart,
  dataSourceDefinitions,
  dataSourceOptions,
  reportFontOptions,
  onChange,
  onChangeMany,
  t,
}: BuildChartPropertyItemsArgs): NonNullable<CollapseProps['items']> {
  const ui = chartUiText(t);
  const chartTypeSelectOptions = chartTypeOptions(t);
  const caps = getChartCapabilities(chart.chartType);

  const titleValue = getChartTitle(chart);
  const themeValue = getChartTheme(chart);
  const legendValue = getChartLegend(chart);
  const axesValue = getChartAxes(chart);
  const labelsValue = getChartLabels(chart);
  const plotOptionsValue = getChartPlotOptions(chart);

  const updateChartType = (chartType: ChartComponent['chartType']) => onChange('chartType', chartType);
  const updateEmptyMessage = (emptyMessage: string) => onChange('emptyMessage', emptyMessage);
  const updateBinding = (binding: ChartComponent['binding']) => onChange('binding', binding);
  const updateTheme = (theme: ChartComponent['theme']) => onChange('theme', theme);
  const updateLegend = (legend: ChartComponent['legend']) => onChange('legend', legend);
  const updateAxes = (axes: ChartComponent['axes']) => onChange('axes', axes);
  const updateLabels = (labels: ChartComponent['labels']) => onChange('labels', labels);
  const updatePlotOptions = (plotOptions: ChartComponent['plotOptions']) => onChange('plotOptions', plotOptions);
  const updateTitle = (title: ChartComponent['title']) => onChangeMany({ title });

  const items: NonNullable<CollapseProps['items']> = [
    {
      key: 'chartBasic',
      label: ui.basic,
      children: (
        <Form size="small" labelCol={FORM_LABEL_COL} wrapperCol={FORM_WRAPPER_COL}>
          <Form.Item label={t('chartType')}>
            <Select
              aria-label={t('chartType')}
              value={chart.chartType}
              onChange={updateChartType}
              size="small"
              options={chartTypeSelectOptions}
              virtual={false}
            />
          </Form.Item>
          <Form.Item label={t('chartEmptyMessage')}>
            <Input aria-label={t('chartEmptyMessage')} value={chart.emptyMessage ?? ''} onChange={event => updateEmptyMessage(event.target.value)} size="small" />
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'chartData',
      label: ui.data,
      children: <ChartDataPanel binding={chart.binding} capabilities={caps} dataSourceOptions={dataSourceOptions} dataSourceDefinitions={dataSourceDefinitions} onChange={updateBinding} t={t} />,
    },
    {
      key: 'chartTitle',
      label: ui.title,
      children: <ChartTitlePanel value={titleValue} reportFontOptions={reportFontOptions} onChange={updateTitle} t={t} />,
    },
    {
      key: 'chartTheme',
      label: ui.theme,
      children: <ChartThemePanel value={themeValue} onChange={updateTheme} t={t} />,
    },
  ];

  if (caps.axes !== false) {
    items.push({
      key: 'chartAxes',
      label: ui.axes,
      children: <ChartAxesPanel chartType={chart.chartType} capabilities={caps} value={axesValue} reportFontOptions={reportFontOptions} onChange={updateAxes} t={t} />,
    });
  }
  if (caps.legend !== false) {
    items.push({
      key: 'chartLegend',
      label: ui.legend,
      children: <ChartLegendPanel chartType={chart.chartType} capabilities={caps} value={legendValue} reportFontOptions={reportFontOptions} onChange={updateLegend} t={t} />,
    });
  }
  if (caps.labelContent.length > 0) {
    items.push({
      key: 'chartLabels',
      label: ui.labels,
      children: <ChartLabelPanel chartType={chart.chartType} capabilities={caps} value={labelsValue} reportFontOptions={reportFontOptions} onChange={updateLabels} t={t} />,
    });
  }
  if (caps.styleOptions.length > 0) {
    items.push({
      key: 'chartStyle',
      label: ui.typeStyle,
      children: <ChartTypeStylePanel chartType={chart.chartType} capabilities={caps} value={plotOptionsValue} onChange={updatePlotOptions} t={t} />,
    });
  }

  return items;
}

