import React from 'react';
import { Form, Input, Select } from 'antd';
import type { ChartThemeConfig } from '@report-designer/core';
import { chartUiText, type ChartPanelT } from './chart-options';
import { ColorPaletteEditor } from './ColorPaletteEditor';

export const ChartThemePanel: React.FC<{
  value: ChartThemeConfig;
  emptyMessage?: string;
  onChange: (value: ChartThemeConfig) => void;
  onEmptyMessageChange: (value: string) => void;
  t: ChartPanelT;
}> = ({ emptyMessage, onChange, onEmptyMessageChange, t, value }) => {
  const ui = chartUiText(t);
  const update = (updates: Partial<ChartThemeConfig>) => onChange({ ...value, ...updates });

  return (
    <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
      <Form.Item label={ui.baseTheme}>
        <Select
          aria-label={ui.baseTheme}
          value={value.baseTheme ?? 'light'}
          onChange={baseTheme => update({ baseTheme })}
          size="small"
          virtual={false}
          options={[
            { value: 'light', label: t('chartThemeLight') },
            { value: 'dark', label: t('chartThemeDark') },
          ]}
        />
      </Form.Item>
      <Form.Item label={ui.customPalette}>
        <ColorPaletteEditor
          t={t}
          presetId={value.palettePresetId}
          colors={value.customPalette ?? []}
          onPresetChange={palettePresetId => update({ palettePresetId })}
          onColorsChange={customPalette => update({ customPalette })}
        />
      </Form.Item>
      <Form.Item label={t('chartEmptyMessage')}>
        <Input aria-label={t('chartEmptyMessage')} value={emptyMessage ?? ''} onChange={event => onEmptyMessageChange(event.target.value)} size="small" />
      </Form.Item>
    </Form>
  );
};
