import React from 'react';
import { ColorPicker, Form, InputNumber, Select, Switch } from 'antd';
import type { ChartCapabilities, ChartLegendConfig, ChartType } from '@report-designer/core';
import { chartUiText, type ChartPanelT } from './chart-options';

const FORM_LABEL_COL = { span: 8 };
const FORM_WRAPPER_COL = { span: 16 };
const DEFAULT_LEGEND_COLOR = '#374151';
const DEFAULT_LEGEND_FONT_SIZE = 12;

export const ChartLegendPanel: React.FC<{
  chartType: ChartType;
  capabilities: ChartCapabilities;
  value: ChartLegendConfig;
  onChange: (value: ChartLegendConfig) => void;
  t: ChartPanelT;
}> = React.memo(({ onChange, t, value }) => {
  const ui = React.useMemo(() => chartUiText(t), [t]);
  const update = React.useCallback((updates: Partial<ChartLegendConfig>) => onChange({ ...value, ...updates }), [onChange, value]);
  const updateFont = React.useCallback((updates: Partial<NonNullable<ChartLegendConfig['font']>>) => {
    update({ font: { ...(value.font ?? {}), ...updates } });
  }, [update, value.font]);
  const positionOptions = React.useMemo(() => ['top', 'right', 'bottom', 'left'].map(position => ({
    value: position,
    label: t(position),
  })), [t]);

  return (
    <Form size="small" labelCol={FORM_LABEL_COL} wrapperCol={FORM_WRAPPER_COL}>
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
          options={positionOptions}
        />
      </Form.Item>
      <Form.Item label={ui.legendColor}>
        <ColorPicker aria-label={ui.legendColor} size="small" value={value.color ?? DEFAULT_LEGEND_COLOR} onChange={color => update({ color: color.toHexString() })} />
      </Form.Item>
      <Form.Item label={ui.legendFontSize}>
        <InputNumber
          aria-label={ui.legendFontSize}
          value={value.font?.size ?? DEFAULT_LEGEND_FONT_SIZE}
          onChange={size => updateFont({ size: size ?? DEFAULT_LEGEND_FONT_SIZE })}
          size="small"
          min={6}
          max={48}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Form>
  );
});
