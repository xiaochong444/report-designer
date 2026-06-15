import React from 'react';
import { ColorPicker, Form, Input, InputNumber, Switch } from 'antd';
import type { ChartTitleConfig } from '@report-designer/core';
import { chartUiText, type ChartPanelT } from './chart-options';

const FORM_LABEL_COL = { span: 8 };
const FORM_WRAPPER_COL = { span: 16 };
const DEFAULT_TITLE_COLOR = '#111827';
const DEFAULT_TITLE_FONT_SIZE = 14;

export const ChartTitlePanel: React.FC<{
  value: ChartTitleConfig;
  onChange: (value: ChartTitleConfig) => void;
  t: ChartPanelT;
}> = React.memo(({ onChange, t, value }) => {
  const ui = React.useMemo(() => chartUiText(t), [t]);
  const update = React.useCallback((updates: Partial<ChartTitleConfig>) => onChange({ ...value, ...updates }), [onChange, value]);
  const updateFont = React.useCallback((updates: Partial<NonNullable<ChartTitleConfig['font']>>) => {
    update({ font: { ...(value.font ?? {}), ...updates } });
  }, [update, value.font]);

  return (
    <Form size="small" labelCol={FORM_LABEL_COL} wrapperCol={FORM_WRAPPER_COL}>
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
        <ColorPicker aria-label={ui.titleColor} size="small" value={value.color ?? value.font?.color ?? DEFAULT_TITLE_COLOR} onChange={color => update({ color: color.toHexString() })} />
      </Form.Item>
      <Form.Item label={ui.titleFontSize}>
        <InputNumber
          aria-label={ui.titleFontSize}
          value={value.font?.size ?? DEFAULT_TITLE_FONT_SIZE}
          onChange={size => updateFont({ size: size ?? DEFAULT_TITLE_FONT_SIZE })}
          size="small"
          min={6}
          max={72}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Form>
  );
});
