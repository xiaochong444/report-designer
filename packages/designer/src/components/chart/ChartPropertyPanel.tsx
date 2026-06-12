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

export const ChartPropertyPanel: React.FC<{
  chart: ChartComponent;
  dataSourceOptions: Array<{ value: string; label: string }>;
  dataSourceDefinitions: DataSource[];
  onChange: (field: string, value: any) => void;
  t: ChartPanelT;
}> = ({ chart, dataSourceDefinitions, dataSourceOptions, onChange, t }) => {
  const ui = chartUiText(t);
  const updateTitle = (title: ReturnType<typeof getChartTitle>) => {
    onChange('title', title);
    onChange('appearance', {
      ...(chart.appearance ?? {}),
      title: title.text ?? '',
      subtitle: title.subtitle ?? '',
    });
  };

  return (
    <Collapse
      size="small"
      defaultActiveKey={['basic', 'data', 'theme', 'title', 'legend', 'axes', 'labels', 'style']}
      items={[
        {
          key: 'basic',
          label: ui.basic,
          children: (
            <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
              <Form.Item label={t('chartType')}>
                <Select
                  aria-label={t('chartType')}
                  value={chart.chartType}
                  onChange={chartType => onChange('chartType', chartType)}
                  size="small"
                  options={chartTypeOptions(t)}
                  virtual={false}
                />
              </Form.Item>
              <Form.Item label={t('chartEmptyMessage')}>
                <Input aria-label={t('chartEmptyMessage')} value={chart.emptyMessage ?? ''} onChange={event => onChange('emptyMessage', event.target.value)} size="small" />
              </Form.Item>
            </Form>
          ),
        },
        {
          key: 'data',
          label: ui.data,
          children: <ChartDataPanel binding={chart.binding} dataSourceOptions={dataSourceOptions} dataSourceDefinitions={dataSourceDefinitions} onChange={binding => onChange('binding', binding)} t={t} />,
        },
        {
          key: 'theme',
          label: ui.theme,
          children: <ChartThemePanel value={getChartTheme(chart)} emptyMessage={chart.emptyMessage} onChange={theme => onChange('theme', theme)} onEmptyMessageChange={emptyMessage => onChange('emptyMessage', emptyMessage)} t={t} />,
        },
        {
          key: 'title',
          label: ui.title,
          children: <ChartTitlePanel value={getChartTitle(chart)} onChange={updateTitle} t={t} />,
        },
        {
          key: 'legend',
          label: ui.legend,
          children: <ChartLegendPanel value={getChartLegend(chart)} onChange={legend => onChange('legend', legend)} t={t} />,
        },
        {
          key: 'axes',
          label: ui.axes,
          children: <ChartAxesPanel chartType={chart.chartType} value={getChartAxes(chart)} onChange={axes => onChange('axes', axes)} t={t} />,
        },
        {
          key: 'labels',
          label: ui.labels,
          children: <ChartLabelPanel value={getChartLabels(chart)} onChange={labels => onChange('labels', labels)} t={t} />,
        },
        {
          key: 'style',
          label: ui.typeStyle,
          children: <ChartTypeStylePanel chartType={chart.chartType} value={getChartPlotOptions(chart)} onChange={plotOptions => onChange('plotOptions', plotOptions)} t={t} />,
        },
      ]}
    />
  );
};
