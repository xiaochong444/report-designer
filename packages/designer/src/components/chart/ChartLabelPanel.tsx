import React from 'react';
import { Form, Select, Switch } from 'antd';
import type { ChartCapabilities, ChartLabelConfig, ChartType, ReportFontOption } from '@report-designer/core';
import { chartUiText, type ChartPanelT } from './chart-options';
import { FontEditor } from '../properties/FontEditor';

const FORM_LABEL_COL = { span: 8 };
const FORM_WRAPPER_COL = { span: 16 };
const DEFAULT_LABEL_FONT: ChartLabelConfig['font'] = { size: 12, color: '#111827' };
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
  reportFontOptions: ReportFontOption[];
  onChange: (value: ChartLabelConfig) => void;
  t: ChartPanelT;
}> = React.memo(({ capabilities, onChange, reportFontOptions, t, value }) => {
  const ui = React.useMemo(() => chartUiText(t), [t]);
  const allowedContent = capabilities.labelContent;
  const update = React.useCallback((updates: Partial<ChartLabelConfig>) => onChange({ ...value, ...updates }), [onChange, value]);
  const updateFont = React.useCallback((next: ChartLabelConfig['font']) => update({ font: next }), [update]);
  const labelOptions = React.useMemo(
    () => LABEL_OPTIONS
      .filter(option => allowedContent.includes(option.value))
      .map(option => ({ value: option.value, label: t(option.label) })),
    [allowedContent, t],
  );

  const fontLabels = React.useMemo(() => ({
    fontFamily: t('fontFamily'),
    fontSize: ui.labelFontSize,
    textColor: ui.labelColor,
    bold: t('bold'),
    italic: t('italic'),
    underline: t('underline'),
    strike: t('strike'),
  }), [t, ui]);

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
      <Form.Item label={t('chartLabelType')}>
        <Select
          aria-label="label position"
          size="small"
          value={value.position ?? 'auto'}
          onChange={(position: NonNullable<ChartLabelConfig['position']>) => update({ position })}
          options={['auto', 'inside', 'outside', 'top', 'bottom', 'left', 'right', 'spider'].map(p => ({ value: p, label: p }))}
        />
      </Form.Item>
      <Form.Item label={t('chartShowLabels')}>
        <Switch aria-label="label leader line" size="small" checked={value.showLeaderLine ?? false} onChange={showLeaderLine => update({ showLeaderLine })} />
      </Form.Item>
      <Form.Item label={t('chartLabelType')}>
        <Select
          aria-label="label overlap strategy"
          size="small"
          value={value.overlapStrategy ?? 'none'}
          onChange={(overlapStrategy: NonNullable<ChartLabelConfig['overlapStrategy']>) => update({ overlapStrategy })}
          options={['hide', 'shift', 'none'].map(s => ({ value: s, label: s }))}
        />
      </Form.Item>
      <FontEditor
        value={{ ...DEFAULT_LABEL_FONT, ...value.font, color: value.color ?? value.font?.color }}
        onChange={next => updateFont({ ...next, color: next.color })}
        reportFontOptions={reportFontOptions}
        fields={['size', 'color', 'bold']}
        sizeRange={[6, 48]}
        labels={fontLabels}
      />
    </Form>
  );
});
