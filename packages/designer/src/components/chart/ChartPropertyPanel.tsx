import React from 'react';
import { Collapse, Form, Input, Select } from 'antd';
import type { ChartComponent, DataSource } from '@report-designer/core';
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

const DEFAULT_ACTIVE_KEYS = ['basic', 'data', 'theme', 'title', 'legend', 'axes', 'labels', 'style'];
const FORM_LABEL_COL = { span: 8 };
const FORM_WRAPPER_COL = { span: 16 };

export const ChartPropertyPanel: React.FC<{
  chart: ChartComponent;
  dataSourceOptions: Array<{ value: string; label: string }>;
  dataSourceDefinitions: DataSource[];
  onChange: (field: string, value: any) => void;
  onChangeMany: (updates: Partial<ChartComponent>) => void;
  t: ChartPanelT;
}> = ({ chart, dataSourceDefinitions, dataSourceOptions, onChange, onChangeMany, t }) => {
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  const onChangeManyRef = React.useRef(onChangeMany);
  React.useEffect(() => {
    onChangeManyRef.current = onChangeMany;
  }, [onChangeMany]);

  const ui = React.useMemo(() => chartUiText(t), [t]);
  const chartTypeSelectOptions = React.useMemo(() => chartTypeOptions(t), [t]);
  const titleValue = React.useMemo(
    () => getChartTitle(chart),
    [chart.title, chart.appearance?.title, chart.appearance?.subtitle],
  );
  const themeValue = React.useMemo(
    () => getChartTheme(chart),
    [chart.theme, chart.appearance?.theme],
  );
  const legendValue = React.useMemo(
    () => getChartLegend(chart),
    [chart.legend, chart.appearance?.showLegend, chart.appearance?.legendPosition],
  );
  const axesValue = React.useMemo(
    () => getChartAxes(chart),
    [chart.axes, chart.appearance?.showAxes, chart.appearance?.axisTitleX, chart.appearance?.axisTitleY, chart.appearance?.axisLabelRotation, chart.appearance?.showGrid],
  );
  const labelsValue = React.useMemo(
    () => getChartLabels(chart),
    [chart.labels, chart.appearance?.showLabels, chart.appearance?.labelType],
  );
  const plotOptionsValue = React.useMemo(
    () => getChartPlotOptions(chart),
    [chart.plotOptions, chart.appearance?.markStyle],
  );

  const changeField = React.useCallback((field: string, value: any) => {
    onChangeRef.current(field, value);
  }, []);

  const updateChartType = React.useCallback((chartType: ChartComponent['chartType']) => changeField('chartType', chartType), [changeField]);
  const updateEmptyMessage = React.useCallback((emptyMessage: string) => changeField('emptyMessage', emptyMessage), [changeField]);
  const updateBinding = React.useCallback((binding: ChartComponent['binding']) => changeField('binding', binding), [changeField]);
  const updateTheme = React.useCallback((theme: ChartComponent['theme']) => changeField('theme', theme), [changeField]);
  const updateLegend = React.useCallback((legend: ChartComponent['legend']) => changeField('legend', legend), [changeField]);
  const updateAxes = React.useCallback((axes: ChartComponent['axes']) => changeField('axes', axes), [changeField]);
  const updateLabels = React.useCallback((labels: ChartComponent['labels']) => changeField('labels', labels), [changeField]);
  const updatePlotOptions = React.useCallback((plotOptions: ChartComponent['plotOptions']) => changeField('plotOptions', plotOptions), [changeField]);
  const updateTitle = React.useCallback((title: ReturnType<typeof getChartTitle>) => {
    onChangeManyRef.current({
      title,
      appearance: {
        ...(chart.appearance ?? {}),
        title: title.text ?? '',
        subtitle: title.subtitle ?? '',
      },
    });
  }, [chart.appearance]);

  const items = React.useMemo(() => [
    {
      key: 'basic',
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
      key: 'data',
      label: ui.data,
      children: <ChartDataPanel binding={chart.binding} dataSourceOptions={dataSourceOptions} dataSourceDefinitions={dataSourceDefinitions} onChange={updateBinding} t={t} />,
    },
    {
      key: 'theme',
      label: ui.theme,
      children: <ChartThemePanel value={themeValue} emptyMessage={chart.emptyMessage} onChange={updateTheme} onEmptyMessageChange={updateEmptyMessage} t={t} />,
    },
    {
      key: 'title',
      label: ui.title,
      children: <ChartTitlePanel value={titleValue} onChange={updateTitle} t={t} />,
    },
    {
      key: 'legend',
      label: ui.legend,
      children: <ChartLegendPanel value={legendValue} onChange={updateLegend} t={t} />,
    },
    {
      key: 'axes',
      label: ui.axes,
      children: <ChartAxesPanel chartType={chart.chartType} value={axesValue} onChange={updateAxes} t={t} />,
    },
    {
      key: 'labels',
      label: ui.labels,
      children: <ChartLabelPanel value={labelsValue} onChange={updateLabels} t={t} />,
    },
    {
      key: 'style',
      label: ui.typeStyle,
      children: <ChartTypeStylePanel chartType={chart.chartType} value={plotOptionsValue} onChange={updatePlotOptions} t={t} />,
    },
  ], [
    axesValue,
    chart.binding,
    chart.chartType,
    chart.emptyMessage,
    chartTypeSelectOptions,
    dataSourceDefinitions,
    dataSourceOptions,
    labelsValue,
    legendValue,
    plotOptionsValue,
    t,
    themeValue,
    titleValue,
    ui,
    updateAxes,
    updateBinding,
    updateChartType,
    updateEmptyMessage,
    updateLabels,
    updateLegend,
    updatePlotOptions,
    updateTheme,
    updateTitle,
  ]);

  return (
    <Collapse
      size="small"
      defaultActiveKey={DEFAULT_ACTIVE_KEYS}
      items={items}
    />
  );
};
