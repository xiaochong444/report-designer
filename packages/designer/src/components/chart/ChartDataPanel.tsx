import React from 'react';
import { Button, Form, Input, Select, Space } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import type { ChartAggregateMode, ChartBinding, ChartCapabilities, ChartMeasure, DataSource } from '@report-designer/core';
import { chartAggregateOptions, type ChartPanelT } from './chart-options';
import { getFieldsForPath } from '../../data-source-paths';

const FORM_LABEL_COL = { span: 8 };
const FORM_WRAPPER_COL = { span: 16 };
const EMPTY_BINDING: ChartBinding = {
  dataSourceId: '',
  dimensions: [],
  measures: [],
  sort: [],
};

/**
 * 数据绑定面板。按能力矩阵适配维度/度量槽位：
 * - dimensions: single(1 维度) / dual(2 维度，如 scatter/heatmap/sankey) / hierarchical(有序多字段，如 treeMap)
 * - measures: single(1 度量) / multi(多度量，每度量一个系列) / dualAxis(2 度量带 left/right)
 * - series: 支持显式系列字段时优先使用字段分系列；未设置时多度量仍可按度量名生成系列。
 */
export const ChartDataPanel: React.FC<{
  binding?: ChartBinding;
  capabilities: ChartCapabilities;
  dataSourceOptions: Array<{ value: string; label: string }>;
  dataSourceDefinitions: DataSource[];
  onChange: (binding: ChartBinding) => void;
  t: ChartPanelT;
}> = React.memo(({ binding = EMPTY_BINDING, capabilities, dataSourceDefinitions, dataSourceOptions, onChange, t }) => {
  const fields = React.useMemo(
    () => getFieldsForPath(dataSourceDefinitions, binding.dataSourceId),
    [binding.dataSourceId, dataSourceDefinitions],
  );
  const fieldOptions = React.useMemo(
    () => fields.map(field => ({ value: field.name, label: field.label || field.name })),
    [fields],
  );
  const numberFieldOptions = React.useMemo(
    () => fields.filter(field => field.type === 'number').map(field => ({ value: field.name, label: field.label || field.name })),
    [fields],
  );
  const aggregateOptions = React.useMemo(() => chartAggregateOptions(t), [t]);
  const valueFieldOptions = numberFieldOptions.length ? numberFieldOptions : fieldOptions;
  const supportsSeriesField = capabilities.series === 'fieldOrMeasureNames';
  const update = React.useCallback((updates: Partial<ChartBinding>) => {
    onChange({ ...EMPTY_BINDING, ...binding, ...updates });
  }, [binding, onChange]);

  const dimensions = binding.dimensions ?? [];
  const measures = binding.measures ?? [];

  const handleDataSourceChange = React.useCallback((dataSourceId?: string) => {
    const dsFields = getFieldsForPath(dataSourceDefinitions, dataSourceId);
    const firstDim = dsFields.find(field => field.type !== 'number') ?? dsFields[0];
    const firstMeasure = dsFields.find(field => field.type === 'number') ?? dsFields[1] ?? dsFields[0];
    const initialDimensions = capabilities.dimensions === 'dual'
      ? (firstDim ? [{ field: firstDim.name }] : [])
      : capabilities.dimensions === 'hierarchical'
        ? (firstDim ? [{ field: firstDim.name }] : [])
        : (firstDim ? [{ field: firstDim.name }] : []);
    const initialMeasures: ChartMeasure[] = firstMeasure ? [{ field: firstMeasure.name, aggregation: 'sum' }] : [];
    if (capabilities.measures === 'dualAxis' && initialMeasures[0]) {
      initialMeasures.push({ ...initialMeasures[0], axis: 'right' });
    }
    update({
      dataSourceId: dataSourceId ?? '',
      arrayPath: dataSourceId ?? '',
      dimensions: initialDimensions,
      seriesField: undefined,
      measures: initialMeasures,
    });
  }, [capabilities, dataSourceDefinitions, update]);

  const updateDimension = (index: number, field: string | undefined) => {
    const next = [...dimensions];
    if (field) next[index] = { ...next[index], field };
    else next.splice(index, 1);
    update({ dimensions: next });
  };
  const addDimension = () => update({ dimensions: [...dimensions, { field: '' }] });

  const updateMeasure = (index: number, patch: Partial<ChartMeasure>) => {
    const next = measures.map((m, i) => (i === index ? { ...m, ...patch } : m));
    update({ measures: next });
  };
  const addMeasure = () => {
    const next: ChartMeasure[] = [...measures, { field: '', aggregation: 'sum' }];
    update({ measures: next });
  };
  const removeMeasure = (index: number) => update({ measures: measures.filter((_, i) => i !== index) });

  const dimensionLabel = capabilities.dimensions === 'dual'
    ? (t('chartXField') || 'X')
    : capabilities.dimensions === 'hierarchical'
      ? t('chartCategoryField')
      : t('chartCategoryField');
  const secondDimensionLabel = t('chartYField') || 'Y';

  return (
    <Form size="small" labelCol={FORM_LABEL_COL} wrapperCol={FORM_WRAPPER_COL}>
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

      {/* 维度槽：single 1 个；dual 2 个（X/Y）；hierarchical 可增删的有序列表 */}
      <Form.Item label={dimensionLabel}>
        <Select
          aria-label={dimensionLabel}
          value={dimensions[0]?.field}
          onChange={field => updateDimension(0, field)}
          size="small"
          options={fieldOptions}
          allowClear
          virtual={false}
        />
      </Form.Item>
      {capabilities.dimensions === 'dual' ? (
        <Form.Item label={secondDimensionLabel}>
          <Select
            aria-label={secondDimensionLabel}
            value={dimensions[1]?.field}
            onChange={field => updateDimension(1, field)}
            size="small"
            options={fieldOptions}
            allowClear
            virtual={false}
          />
        </Form.Item>
      ) : null}
      {capabilities.dimensions === 'hierarchical' ? (
        dimensions.slice(1).map((dim, i) => (
          <Form.Item key={`hier-${i}`} label={`${t('chartCategoryField')} ${i + 2}`}>
            <Space.Compact style={{ width: '100%' }}>
              <Select
                aria-label={`${t('chartCategoryField')} ${i + 2}`}
                value={dimensions[i + 1]?.field}
                onChange={field => updateDimension(i + 1, field)}
                size="small"
                options={fieldOptions}
                allowClear
                virtual={false}
                style={{ flex: 1 }}
              />
            </Space.Compact>
          </Form.Item>
        ))
      ) : null}
      {capabilities.dimensions === 'hierarchical' ? (
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addDimension} block>
            {t('chartCategoryField')}
          </Button>
        </Form.Item>
      ) : null}
      {supportsSeriesField ? (
        <Form.Item label={t('chartSeriesField')}>
          <Select
            aria-label={t('chartSeriesField')}
            value={binding.seriesField || undefined}
            onChange={field => update({ seriesField: field })}
            size="small"
            options={fieldOptions}
            allowClear
            virtual={false}
          />
        </Form.Item>
      ) : null}

      {/* 度量槽：single 1 个（含聚合）；multi/dualAxis 多个（每行 field+聚合，dualAxis 带 axis） */}
      {capabilities.measures === 'single' ? (
        <>
          <Form.Item label={t('chartValueField')}>
            <Select
              aria-label={t('chartValueField')}
              value={measures[0]?.field}
              onChange={field => update({ measures: field ? [{ field, aggregation: measures[0]?.aggregation ?? 'sum' }] : [] })}
              size="small"
              options={valueFieldOptions}
              allowClear
              virtual={false}
            />
          </Form.Item>
          <Form.Item label={t('chartAggregate')}>
            <Select
              aria-label={t('chartAggregate')}
              value={measures[0]?.aggregation ?? 'sum'}
              onChange={(agg: ChartAggregateMode) => update({ measures: measures.map((m, i) => i === 0 ? { ...m, aggregation: agg } : m) })}
              size="small"
              options={aggregateOptions}
              virtual={false}
            />
          </Form.Item>
        </>
      ) : (
        measures.map((measure, index) => (
          <React.Fragment key={`measure-${index}`}>
            <Form.Item label={capabilities.measures === 'dualAxis' ? (index === 0 ? t('chartValueField') : t('chartValueField') + ' 2') : `${t('chartValueField')} ${index + 1}`}>
              <Space.Compact style={{ width: '100%' }}>
                <Select
                  aria-label={`${t('chartValueField')} ${index + 1}`}
                  value={measure.field}
                  onChange={field => updateMeasure(index, { field })}
                  size="small"
                  options={valueFieldOptions}
                  allowClear
                  virtual={false}
                  style={{ flex: 1 }}
                />
                {capabilities.measures === 'multi' ? (
                  <Button
                    aria-label={`${t('chartValueField')} ${index + 1} remove`}
                    icon={<MinusCircleOutlined />}
                    size="small"
                    onClick={() => removeMeasure(index)}
                    disabled={measures.length <= 1}
                  />
                ) : null}
              </Space.Compact>
            </Form.Item>
            <Form.Item label={t('chartAggregate')}>
              <Select
                aria-label={`${t('chartAggregate')} ${index + 1}`}
                value={measure.aggregation ?? 'sum'}
                onChange={(agg: ChartAggregateMode) => updateMeasure(index, { aggregation: agg })}
                size="small"
                options={aggregateOptions}
                virtual={false}
              />
            </Form.Item>
          </React.Fragment>
        ))
      )}
      {capabilities.measures === 'multi' ? (
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addMeasure} block>
            {t('chartValueField')}
          </Button>
        </Form.Item>
      ) : null}
    </Form>
  );
});
