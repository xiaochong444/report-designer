import React from 'react';
import { Form, Select, Switch } from 'antd';
import type { ChartCapabilities, ChartLegendConfig, ChartType, ReportFontOption } from '@report-designer/core';
import { chartUiText, type ChartPanelT } from './chart-options';
import { FontEditor } from '../properties/FontEditor';

const FORM_LABEL_COL = { span: 8 };
const FORM_WRAPPER_COL = { span: 16 };
const DEFAULT_LEGEND_FONT: ChartLegendConfig['font'] = { size: 12, color: '#374151' };

export const ChartLegendPanel: React.FC<{
  chartType: ChartType;
  capabilities: ChartCapabilities;
  value: ChartLegendConfig;
  reportFontOptions: ReportFontOption[];
  onChange: (value: ChartLegendConfig) => void;
  t: ChartPanelT;
}> = React.memo(({ onChange, reportFontOptions, t, value }) => {
  const ui = React.useMemo(() => chartUiText(t), [t]);
  const update = React.useCallback((updates: Partial<ChartLegendConfig>) => onChange({ ...value, ...updates }), [onChange, value]);
  const updateFont = React.useCallback((next: ChartLegendConfig['font']) => update({ font: next }), [update]);
  const positionOptions = React.useMemo(() => ['top', 'right', 'bottom', 'left'].map(position => ({
    value: position,
    label: t(position),
  })), [t]);

  const fontLabels = React.useMemo(() => ({
    fontFamily: t('fontFamily'),
    fontSize: ui.legendFontSize,
    textColor: ui.legendColor,
    bold: t('bold'),
    italic: t('italic'),
    underline: t('underline'),
    strike: t('strike'),
  }), [t, ui]);

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
      <FontEditor
        value={{ ...DEFAULT_LEGEND_FONT, ...value.font, color: value.color ?? value.font?.color }}
        onChange={next => updateFont({ ...next, color: next.color })}
        reportFontOptions={reportFontOptions}
        fields={['size', 'color']}
        sizeRange={[6, 48]}
        labels={fontLabels}
      />
    </Form>
  );
});
