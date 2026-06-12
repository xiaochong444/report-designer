import React from 'react';
import { Form, Input, Select } from 'antd';
import type { ChartAggregateMode, ChartBinding, DataSource } from '@report-designer/core';
import { chartAggregateOptions, type ChartPanelT } from './chart-options';
import { getFieldsForPath } from '../../data-source-paths';

export const ChartDataPanel: React.FC<{
  binding?: ChartBinding;
  dataSourceOptions: Array<{ value: string; label: string }>;
  dataSourceDefinitions: DataSource[];
  onChange: (binding: ChartBinding) => void;
  t: ChartPanelT;
}> = ({ binding = {}, dataSourceDefinitions, dataSourceOptions, onChange, t }) => {
  const fields = getFieldsForPath(dataSourceDefinitions, binding.dataSourceId);
  const fieldOptions = fields.map(field => ({ value: field.name, label: field.label || field.name }));
  const numberFieldOptions = fields.filter(field => field.type === 'number').map(field => ({ value: field.name, label: field.label || field.name }));
  const update = (updates: Partial<ChartBinding>) => {
    onChange({
      dataSourceId: '',
      dimensions: [],
      measures: [],
      seriesField: '',
      labelField: '',
      sort: [],
      aggregate: 'none',
      ...binding,
      ...updates,
    });
  };

  const handleDataSourceChange = (dataSourceId?: string) => {
    const dsFields = getFieldsForPath(dataSourceDefinitions, dataSourceId);
    const dimension = dsFields.find(field => field.type !== 'number') ?? dsFields[0];
    const measure = dsFields.find(field => field.type === 'number') ?? dsFields[1] ?? dsFields[0];
    update({
      dataSourceId: dataSourceId ?? '',
      arrayPath: dataSourceId ?? '',
      dimensions: dimension ? [{ field: dimension.name }] : [],
      measures: measure ? [{ field: measure.name }] : [],
      seriesField: '',
      labelField: '',
    });
  };

  return (
    <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
      <Form.Item label={t('chartDataSource')}>
        <Select
          aria-label={t('chartDataSource')}
          value={binding.dataSourceId || undefined}
          onChange={handleDataSourceChange}
          allowClear
          showSearch
          size="small"
          placeholder={t('chooseDataSource')}
          options={dataSourceOptions}
          virtual={false}
        />
      </Form.Item>
      <Form.Item label={t('chartArrayPath')} tooltip={t('chartArrayPathTooltip')}>
        <Input
          aria-label={t('chartArrayPath')}
          value={binding.arrayPath ?? ''}
          onChange={event => update({ arrayPath: event.target.value })}
          size="small"
          placeholder={t('chartArrayPathPlaceholder')}
        />
      </Form.Item>
      <Form.Item label={t('chartCategoryField')}>
        <Select
          aria-label={t('chartCategoryField')}
          value={binding.dimensions?.[0]?.field}
          onChange={field => update({ dimensions: field ? [{ field }] : [] })}
          size="small"
          options={fieldOptions}
          allowClear
          virtual={false}
        />
      </Form.Item>
      <Form.Item label={t('chartValueField')}>
        <Select
          aria-label={t('chartValueField')}
          value={binding.measures?.[0]?.field}
          onChange={field => update({ measures: field ? [{ field }] : [] })}
          size="small"
          options={numberFieldOptions.length ? numberFieldOptions : fieldOptions}
          allowClear
          virtual={false}
        />
      </Form.Item>
      <Form.Item label={t('chartSeriesField')}>
        <Select
          aria-label={t('chartSeriesField')}
          value={binding.seriesField || undefined}
          onChange={field => update({ seriesField: field ?? '' })}
          size="small"
          options={fieldOptions}
          allowClear
          virtual={false}
        />
      </Form.Item>
      <Form.Item label={t('chartLabelField')}>
        <Select
          aria-label={t('chartLabelField')}
          value={binding.labelField || undefined}
          onChange={field => update({ labelField: field ?? '' })}
          size="small"
          options={fieldOptions}
          allowClear
          virtual={false}
        />
      </Form.Item>
      <Form.Item label={t('chartAggregate')}>
        <Select
          aria-label={t('chartAggregate')}
          value={binding.aggregate ?? 'none'}
          onChange={aggregate => update({ aggregate: aggregate as ChartAggregateMode })}
          size="small"
          options={chartAggregateOptions(t)}
          virtual={false}
        />
      </Form.Item>
    </Form>
  );
};
