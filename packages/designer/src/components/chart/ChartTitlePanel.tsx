import React from 'react';
import { Form, Input, Switch } from 'antd';
import type { ChartTitleConfig, ReportFontOption } from '@report-designer/core';
import { chartUiText, type ChartPanelT } from './chart-options';
import { FontEditor } from '../properties/FontEditor';

const FORM_LABEL_COL = { span: 8 };
const FORM_WRAPPER_COL = { span: 16 };
const DEFAULT_TITLE_FONT: ChartTitleConfig['font'] = { size: 14, color: '#111827' };
const DEFAULT_SUBTITLE_FONT: ChartTitleConfig['subtitleFont'] = { size: 12, color: '#6b7280' };

const PanelGroup: React.FC<React.PropsWithChildren<{ title: string }>> = ({ children, title }) => (
  <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 8 }}>
    <div style={{ color: '#4b5563', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{title}</div>
    {children}
  </div>
);

export const ChartTitlePanel: React.FC<{
  value: ChartTitleConfig;
  reportFontOptions: ReportFontOption[];
  onChange: (value: ChartTitleConfig) => void;
  t: ChartPanelT;
}> = React.memo(({ onChange, reportFontOptions, t, value }) => {
  const ui = React.useMemo(() => chartUiText(t), [t]);
  const update = React.useCallback((updates: Partial<ChartTitleConfig>) => onChange({ ...value, ...updates }), [onChange, value]);
  const updateFont = React.useCallback((next: ChartTitleConfig['font']) => update({ font: next }), [update]);
  const updateSubtitleFont = React.useCallback((next: ChartTitleConfig['subtitleFont']) => update({ subtitleFont: next, subtitleColor: next?.color }), [update]);

  const fontLabels = React.useMemo(() => ({
    fontFamily: t('fontFamily'),
    fontSize: ui.titleFontSize,
    textColor: ui.titleColor,
    bold: t('bold'),
    italic: t('italic'),
    underline: t('underline'),
    strike: t('strike'),
  }), [t, ui]);
  const subtitleFontLabels = React.useMemo(() => ({
    fontFamily: t('fontFamily'),
    fontSize: `${t('chartSubtitle')} ${t('fontSize')}`,
    textColor: `${t('chartSubtitle')} ${t('textColor')}`,
    bold: t('bold'),
    italic: t('italic'),
    underline: t('underline'),
    strike: t('strike'),
  }), [t]);
  const shortFontLabels = React.useMemo(() => ({
    fontFamily: ui.familyShort,
    fontSize: ui.sizeShort,
    textColor: ui.colorShort,
    bold: t('bold'),
    italic: t('italic'),
    underline: t('underline'),
    strike: t('strike'),
  }), [t, ui]);

  return (
    <Form size="small" labelCol={FORM_LABEL_COL} wrapperCol={FORM_WRAPPER_COL}>
      <PanelGroup title={ui.standardGroup}>
        <Form.Item label={ui.visible}>
          <Switch aria-label={ui.titleVisible} size="small" checked={value.visible} onChange={checked => update({ visible: checked })} />
        </Form.Item>
        <Form.Item label={ui.textShort}>
          <Input aria-label={ui.titleText} value={value.text ?? ''} onChange={event => update({ text: event.target.value })} size="small" />
        </Form.Item>
        <FontEditor
          value={{ ...DEFAULT_TITLE_FONT, ...value.font }}
          onChange={updateFont}
          reportFontOptions={reportFontOptions}
          sizeRange={[6, 72]}
          labels={shortFontLabels}
          ariaLabels={fontLabels}
        />
      </PanelGroup>
      <PanelGroup title={ui.subtitleGroup}>
        <Form.Item label={ui.textShort}>
          <Input aria-label={t('chartSubtitle')} value={value.subtitle ?? ''} onChange={event => update({ subtitle: event.target.value })} size="small" />
        </Form.Item>
        <FontEditor
          value={{ ...DEFAULT_SUBTITLE_FONT, ...value.subtitleFont, color: value.subtitleColor ?? value.subtitleFont?.color ?? DEFAULT_SUBTITLE_FONT.color }}
          onChange={updateSubtitleFont}
          reportFontOptions={reportFontOptions}
          fields={['family', 'size', 'color', 'bold', 'italic']}
          sizeRange={[6, 72]}
          labels={shortFontLabels}
          ariaLabels={subtitleFontLabels}
        />
      </PanelGroup>
    </Form>
  );
});
