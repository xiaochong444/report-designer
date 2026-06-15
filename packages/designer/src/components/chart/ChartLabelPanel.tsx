import React from 'react';
import { ColorPicker, Form, InputNumber, Select, Switch } from 'antd';
import type { ChartCapabilities, ChartLabelConfig, ChartType } from '@report-designer/core';
import { chartUiText, type ChartPanelT } from './chart-options';

const FORM_LABEL_COL = { span: 8 };
const FORM_WRAPPER_COL = { span: 16 };
const DEFAULT_LABEL_COLOR = '#111827';
const DEFAULT_LABEL_FONT_SIZE = 12;
const LABEL_OPTIONS = [
  { value: 'name', label: 'chartLabelTypeName' },
  { value: 'value', label: 'chartLabelTypeValue' },
  { value: 'percent', label: 'chartLabelTypePercent' },
  { value: 'name-value', label: 'chartLabelTypeNameValue' },
] as const;

export const ChartLabelPanel: React.FC<{
  chartType: ChartType;
  capabilities: ChartCapabilities;
  value: ChartLabelConfig;
  onChange: (value: ChartLabelConfig) => void;
  t: ChartPanelT;
}> = React.memo(({ capabilities, onChange, t, value }) => {
  const ui = React.useMemo(() => chartUiText(t), [t]);
  const allowedContent = capabilities.labelContent;
  const update = React.useCallback((updates: Partial<ChartLabelConfig>) => onChange({ ...value, ...updates }), [onChange, value]);
  const updateFont = React.useCallback((updates: Partial<NonNullable<ChartLabelConfig['font']>>) => {
    update({ font: { ...(value.font ?? {}), ...updates } });
  }, [update, value.font]);
  const labelOptions = React.useMemo(
    () => LABEL_OPTIONS
      .filter(option => allowedContent.includes(option.value))
      .map(option => ({ value: option.value, label: t(option.label) })),
    [allowedContent, t],
  );

  return (
    <Form size="small" labelCol={FORM_LABEL_COL} wrapperCol={FORM_WRAPPER_COL}>
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
          options={labelOptions}
        />
      </Form.Item>
      <Form.Item label={ui.labelColor}>
        <ColorPicker aria-label={ui.labelColor} size="small" value={value.color ?? DEFAULT_LABEL_COLOR} onChange={color => update({ color: color.toHexString() })} />
      </Form.Item>
      <Form.Item label={ui.labelFontSize}>
        <InputNumber
          aria-label={ui.labelFontSize}
          value={value.font?.size ?? DEFAULT_LABEL_FONT_SIZE}
          onChange={size => updateFont({ size: size ?? DEFAULT_LABEL_FONT_SIZE })}
          size="small"
          min={6}
          max={48}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Form>
  );
});
