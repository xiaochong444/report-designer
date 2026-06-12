import React from 'react';
import { ColorPicker, Form, Input, InputNumber, Switch } from 'antd';
import type { ChartTitleConfig } from '@report-designer/core';
import { chartUiText, type ChartPanelT } from './chart-options';

export const ChartTitlePanel: React.FC<{
  value: ChartTitleConfig;
  onChange: (value: ChartTitleConfig) => void;
  t: ChartPanelT;
}> = ({ onChange, t, value }) => {
  const ui = chartUiText(t);
  const update = (updates: Partial<ChartTitleConfig>) => onChange({ ...value, ...updates });
  const updateFont = (updates: Partial<NonNullable<ChartTitleConfig['font']>>) => {
    update({ font: { ...(value.font ?? {}), ...updates } });
  };

  return (
    <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
      <Form.Item label={ui.visible}>
        <Switch aria-label={ui.titleVisible} size="small" checked={value.visible} onChange={checked => update({ visible: checked })} />
      </Form.Item>
      <Form.Item label={ui.titleText}>
        <Input aria-label={ui.titleText} value={value.text ?? ''} onChange={event => update({ text: event.target.value })} size="small" />
      </Form.Item>
      <Form.Item label={t('chartSubtitle')}>
        <Input aria-label={t('chartSubtitle')} value={value.subtitle ?? ''} onChange={event => update({ subtitle: event.target.value })} size="small" />
      </Form.Item>
      <Form.Item label={ui.titleColor}>
        <ColorPicker aria-label={ui.titleColor} size="small" value={value.color ?? value.font?.color ?? '#111827'} onChange={color => update({ color: color.toHexString() })} />
      </Form.Item>
      <Form.Item label={ui.titleFontSize}>
        <InputNumber
          aria-label={ui.titleFontSize}
          value={value.font?.size ?? 14}
          onChange={size => updateFont({ size: size ?? 14 })}
          size="small"
          min={6}
          max={72}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Form>
  );
};
