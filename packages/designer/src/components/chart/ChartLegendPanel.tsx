import React from 'react';
import { ColorPicker, Form, InputNumber, Select, Switch } from 'antd';
import type { ChartLegendConfig } from '@report-designer/core';
import { chartUiText, type ChartPanelT } from './chart-options';

export const ChartLegendPanel: React.FC<{
  value: ChartLegendConfig;
  onChange: (value: ChartLegendConfig) => void;
  t: ChartPanelT;
}> = ({ onChange, t, value }) => {
  const ui = chartUiText(t);
  const update = (updates: Partial<ChartLegendConfig>) => onChange({ ...value, ...updates });
  const updateFont = (updates: Partial<NonNullable<ChartLegendConfig['font']>>) => {
    update({ font: { ...(value.font ?? {}), ...updates } });
  };

  return (
    <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
      <Form.Item label={ui.visible}>
        <Switch aria-label={ui.legendVisible} size="small" checked={value.visible} onChange={checked => update({ visible: checked })} />
      </Form.Item>
      <Form.Item label={t('chartLegendPosition')}>
        <Select
          aria-label={t('chartLegendPosition')}
          value={value.position}
          onChange={position => update({ position })}
          size="small"
          virtual={false}
          options={['top', 'right', 'bottom', 'left'].map(position => ({
            value: position,
            label: t(position),
          }))}
        />
      </Form.Item>
      <Form.Item label={ui.legendColor}>
        <ColorPicker aria-label={ui.legendColor} size="small" value={value.color ?? '#374151'} onChange={color => update({ color: color.toHexString() })} />
      </Form.Item>
      <Form.Item label={ui.legendFontSize}>
        <InputNumber
          aria-label={ui.legendFontSize}
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
