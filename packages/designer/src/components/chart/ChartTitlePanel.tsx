import React from 'react';
import { Form, Input, Switch } from 'antd';
import type { ChartTitleConfig, ReportFontOption } from '@report-designer/core';
import { chartUiText, type ChartPanelT } from './chart-options';
import { FontEditor } from '../properties/FontEditor';

const FORM_LABEL_COL = { span: 8 };
const FORM_WRAPPER_COL = { span: 16 };
const DEFAULT_TITLE_FONT: ChartTitleConfig['font'] = { size: 14, color: '#111827' };

export const ChartTitlePanel: React.FC<{
  value: ChartTitleConfig;
  reportFontOptions: ReportFontOption[];
  onChange: (value: ChartTitleConfig) => void;
  t: ChartPanelT;
}> = React.memo(({ onChange, reportFontOptions, t, value }) => {
  const ui = React.useMemo(() => chartUiText(t), [t]);
  const update = React.useCallback((updates: Partial<ChartTitleConfig>) => onChange({ ...value, ...updates }), [onChange, value]);
  const updateFont = React.useCallback((next: ChartTitleConfig['font']) => update({ font: next }), [update]);

  const fontLabels = React.useMemo(() => ({
    fontFamily: t('fontFamily'),
    fontSize: ui.titleFontSize,
    textColor: ui.titleColor,
    bold: t('bold'),
    italic: t('italic'),
    underline: t('underline'),
    strike: t('strike'),
  }), [t, ui]);

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
        <Input aria-label={ui.titleColor} value={value.subtitleColor ?? value.color ?? ''} onChange={event => update({ subtitleColor: event.target.value, color: event.target.value })} size="small" />
      </Form.Item>
      <FontEditor
        value={{ ...DEFAULT_TITLE_FONT, ...value.font }}
        onChange={updateFont}
        reportFontOptions={reportFontOptions}
        sizeRange={[6, 72]}
        labels={fontLabels}
      />
    </Form>
  );
});
