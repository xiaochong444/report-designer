import React from 'react';
import type { CollapseProps } from 'antd';
import { Form, Input, Select } from 'antd';
import type {
  ChartAxesConfig,
  ChartComponent,
  ChartLabelConfig,
  ChartLegendConfig,
  ChartPlotOptions,
  ChartThemeConfig,
  ChartTitleConfig,
  DataSource,
  ReportFontOption,
} from '@report-designer/core';
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
const DEFAULT_CHART_TITLE: ChartTitleConfig = { visible: true, text: '', subtitle: '' };
const DEFAULT_CHART_THEME: ChartThemeConfig = { baseTheme: 'light' };
const DEFAULT_CHART_LEGEND: ChartLegendConfig = { visible: true, position: 'bottom' };
const DEFAULT_CHART_AXES: ChartAxesConfig = {};
const DEFAULT_CHART_LABELS: ChartLabelConfig = { visible: false, content: 'name', position: 'auto' };
const DEFAULT_CHART_PLOT_OPTIONS: ChartPlotOptions = {};

export interface BuildChartPropertyItemsArgs {
  chart: ChartComponent;
  dataSourceOptions: Array<{ value: string; label: string }>;
  dataSourceDefinitions: DataSource[];
  reportFontOptions: ReportFontOption[];
  onChange: (field: string, value: any) => void;
  onChangeMany: (updates: Partial<ChartComponent>) => void;
  t: ChartPanelT;
}

const ChartBasicGroup = React.memo(function ChartBasicGroup({
  chartType,
  emptyMessage,
  onChange,
  t,
}: {
  chartType: ChartComponent['chartType'];
  emptyMessage?: string;
  onChange: (field: string, value: any) => void;
  t: ChartPanelT;
}) {
  const chartTypeSelectOptions = React.useMemo(() => chartTypeOptions(t), [t]);
  const updateChartType = React.useCallback((nextChartType: ChartComponent['chartType']) => onChange('chartType', nextChartType), [onChange]);
  const updateEmptyMessage = React.useCallback((nextEmptyMessage: string) => onChange('emptyMessage', nextEmptyMessage), [onChange]);

  return (
    <Form size="small" labelCol={FORM_LABEL_COL} wrapperCol={FORM_WRAPPER_COL}>
      <Form.Item label={t('chartType')}>
        <Select
          aria-label={t('chartType')}
          value={chartType}
          onChange={updateChartType}
          size="small"
          options={chartTypeSelectOptions}
          virtual={false}
        />
      </Form.Item>
      <Form.Item label={t('chartEmptyMessage')}>
        <Input aria-label={t('chartEmptyMessage')} value={emptyMessage ?? ''} onChange={event => updateEmptyMessage(event.target.value)} size="small" />
      </Form.Item>
    </Form>
  );
});

const ChartDataGroup = React.memo(function ChartDataGroup({
  binding,
  capabilities,
  dataSourceDefinitions,
  dataSourceOptions,
  onChange,
  t,
}: {
  binding: ChartComponent['binding'];
  capabilities: ReturnType<typeof getChartCapabilities>;
  dataSourceDefinitions: DataSource[];
  dataSourceOptions: Array<{ value: string; label: string }>;
  onChange: (field: string, value: any) => void;
  t: ChartPanelT;
}) {
  const updateBinding = React.useCallback((nextBinding: ChartComponent['binding']) => onChange('binding', nextBinding), [onChange]);
  return <ChartDataPanel binding={binding} capabilities={capabilities} dataSourceOptions={dataSourceOptions} dataSourceDefinitions={dataSourceDefinitions} onChange={updateBinding} t={t} />;
});

const ChartTitleGroup = React.memo(function ChartTitleGroup({
  value,
  reportFontOptions,
  onChangeMany,
  t,
}: {
  value?: ChartTitleConfig;
  reportFontOptions: ReportFontOption[];
  onChangeMany: (updates: Partial<ChartComponent>) => void;
  t: ChartPanelT;
}) {
  const updateTitle = React.useCallback((title: ChartTitleConfig) => onChangeMany({ title }), [onChangeMany]);
  return <ChartTitlePanel value={value ?? DEFAULT_CHART_TITLE} reportFontOptions={reportFontOptions} onChange={updateTitle} t={t} />;
});

const ChartThemeGroup = React.memo(function ChartThemeGroup({
  value,
  onChange,
  t,
}: {
  value?: ChartThemeConfig;
  onChange: (field: string, value: any) => void;
  t: ChartPanelT;
}) {
  const updateTheme = React.useCallback((theme: ChartThemeConfig) => onChange('theme', theme), [onChange]);
  return <ChartThemePanel value={value ?? DEFAULT_CHART_THEME} onChange={updateTheme} t={t} />;
});

const ChartAxesGroup = React.memo(function ChartAxesGroup({
  chartType,
  capabilities,
  value,
  reportFontOptions,
  onChange,
  t,
}: {
  chartType: ChartComponent['chartType'];
  capabilities: ReturnType<typeof getChartCapabilities>;
  value?: ChartAxesConfig;
  reportFontOptions: ReportFontOption[];
  onChange: (field: string, value: any) => void;
  t: ChartPanelT;
}) {
  const updateAxes = React.useCallback((axes: ChartAxesConfig) => onChange('axes', axes), [onChange]);
  return <ChartAxesPanel chartType={chartType} capabilities={capabilities} value={value ?? DEFAULT_CHART_AXES} reportFontOptions={reportFontOptions} onChange={updateAxes} t={t} />;
});

const ChartLegendGroup = React.memo(function ChartLegendGroup({
  chartType,
  capabilities,
  value,
  reportFontOptions,
  onChange,
  t,
}: {
  chartType: ChartComponent['chartType'];
  capabilities: ReturnType<typeof getChartCapabilities>;
  value?: ChartLegendConfig;
  reportFontOptions: ReportFontOption[];
  onChange: (field: string, value: any) => void;
  t: ChartPanelT;
}) {
  const updateLegend = React.useCallback((legend: ChartLegendConfig) => onChange('legend', legend), [onChange]);
  return <ChartLegendPanel chartType={chartType} capabilities={capabilities} value={value ?? DEFAULT_CHART_LEGEND} reportFontOptions={reportFontOptions} onChange={updateLegend} t={t} />;
});

const ChartLabelsGroup = React.memo(function ChartLabelsGroup({
  chartType,
  capabilities,
  value,
  reportFontOptions,
  onChange,
  t,
}: {
  chartType: ChartComponent['chartType'];
  capabilities: ReturnType<typeof getChartCapabilities>;
  value?: ChartLabelConfig;
  reportFontOptions: ReportFontOption[];
  onChange: (field: string, value: any) => void;
  t: ChartPanelT;
}) {
  const updateLabels = React.useCallback((labels: ChartLabelConfig) => onChange('labels', labels), [onChange]);
  return <ChartLabelPanel chartType={chartType} capabilities={capabilities} value={value ?? DEFAULT_CHART_LABELS} reportFontOptions={reportFontOptions} onChange={updateLabels} t={t} />;
});

const ChartStyleGroup = React.memo(function ChartStyleGroup({
  chartType,
  capabilities,
  value,
  onChange,
  t,
}: {
  chartType: ChartComponent['chartType'];
  capabilities: ReturnType<typeof getChartCapabilities>;
  value?: ChartPlotOptions;
  onChange: (field: string, value: any) => void;
  t: ChartPanelT;
}) {
  const updatePlotOptions = React.useCallback((plotOptions: ChartPlotOptions) => onChange('plotOptions', plotOptions), [onChange]);
  return <ChartTypeStylePanel chartType={chartType} capabilities={capabilities} value={value ?? DEFAULT_CHART_PLOT_OPTIONS} onChange={updatePlotOptions} t={t} />;
});

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
  const caps = getChartCapabilities(chart.chartType);

  const items: NonNullable<CollapseProps['items']> = [
    {
      key: 'chartBasic',
      label: ui.basic,
      children: <ChartBasicGroup chartType={chart.chartType} emptyMessage={chart.emptyMessage} onChange={onChange} t={t} />,
    },
    {
      key: 'chartData',
      label: ui.data,
      children: <ChartDataGroup binding={chart.binding} capabilities={caps} dataSourceOptions={dataSourceOptions} dataSourceDefinitions={dataSourceDefinitions} onChange={onChange} t={t} />,
    },
    {
      key: 'chartTitle',
      label: ui.title,
      children: <ChartTitleGroup value={chart.title} reportFontOptions={reportFontOptions} onChangeMany={onChangeMany} t={t} />,
    },
    {
      key: 'chartTheme',
      label: ui.theme,
      children: <ChartThemeGroup value={chart.theme} onChange={onChange} t={t} />,
    },
  ];

  if (caps.axes !== false) {
    items.push({
      key: 'chartAxes',
      label: ui.axes,
      children: <ChartAxesGroup chartType={chart.chartType} capabilities={caps} value={chart.axes} reportFontOptions={reportFontOptions} onChange={onChange} t={t} />,
    });
  }
  if (caps.legend !== false) {
    items.push({
      key: 'chartLegend',
      label: ui.legend,
      children: <ChartLegendGroup chartType={chart.chartType} capabilities={caps} value={chart.legend} reportFontOptions={reportFontOptions} onChange={onChange} t={t} />,
    });
  }
  if (caps.labelContent.length > 0) {
    items.push({
      key: 'chartLabels',
      label: ui.labels,
      children: <ChartLabelsGroup chartType={chart.chartType} capabilities={caps} value={chart.labels} reportFontOptions={reportFontOptions} onChange={onChange} t={t} />,
    });
  }
  if (caps.styleOptions.length > 0) {
    items.push({
      key: 'chartStyle',
      label: ui.typeStyle,
      children: <ChartStyleGroup chartType={chart.chartType} capabilities={caps} value={chart.plotOptions} onChange={onChange} t={t} />,
    });
  }

  return items;
}
