import React from 'react';
import { ColorPicker, Form, InputNumber, Select, Switch } from 'antd';
import type { ChartLabelConfig } from '@report-designer/core';
import { chartUiText, type ChartPanelT } from './chart-options';

export const ChartLabelPanel: React.FC<{
  value: ChartLabelConfig;
  onChange: (value: ChartLabelConfig) => void;
  t: ChartPanelT;
}> = ({ onChange, t, value }) => {
  const ui = chartUiText(t);
  const update = (updates: Partial<ChartLabelConfig>) => onChange({ ...value, ...updates });
  const updateFont = (updates: Partial<NonNullable<ChartLabelConfig['font']>>) => {
    update({ font: { ...(value.font ?? {}), ...updates } });
  };

  return (
    <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
      <Form.Item label={ui.visible}>
        <Switch aria-label={ui.labelsVisible} size="small" checked={value.visible} onChange={checked => update({ visible: checked })} />
      </Form.Item>
      <Form.Item label={ui.labelContent}>
        <Select
          aria-label={ui.labelContent}
          value={value.content}
          onChange={content => update({ content })}
          size="small"
          virtual={false}
          options={[
            { value: 'name', label: t('chartLabelTypeName') },
            { value: 'value', label: t('chartLabelTypeValue') },
            { value: 'percent', label: t('chartLabelTypePercent') },
            { value: 'name-value', label: t('chartLabelTypeNameValue') },
          ]}
        />
      </Form.Item>
      <Form.Item label={ui.labelColor}>
        <ColorPicker aria-label={ui.labelColor} size="small" value={value.color ?? '#111827'} onChange={color => update({ color: color.toHexString() })} />
      </Form.Item>
      <Form.Item label={ui.labelFontSize}>
        <InputNumber
          aria-label={ui.labelFontSize}
          value={value.font?.size ?? 12}
          onChange={size => updateFont({ size: size ?? 12 })}
          size="small"
          min={6}
          max={48}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Form>
  );
};
