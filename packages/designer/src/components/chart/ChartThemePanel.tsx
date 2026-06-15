import React from 'react';
import { Form, Select } from 'antd';
import type { ChartThemeConfig } from '@report-designer/core';
import { chartUiText, type ChartPanelT } from './chart-options';
import { ColorPaletteEditor } from './ColorPaletteEditor';

const FORM_LABEL_COL = { span: 8 };
const FORM_WRAPPER_COL = { span: 16 };
const THEME_OPTIONS = [
  { value: 'light', label: 'chartThemeLight' },
  { value: 'dark', label: 'chartThemeDark' },
] as const;

export const ChartThemePanel: React.FC<{
  value: ChartThemeConfig;
  onChange: (value: ChartThemeConfig) => void;
  t: ChartPanelT;
}> = React.memo(({ onChange, t, value }) => {
  const ui = React.useMemo(() => chartUiText(t), [t]);
  const themeOptions = React.useMemo(() => THEME_OPTIONS.map(item => ({ value: item.value, label: t(item.label) })), [t]);
  const update = React.useCallback((updates: Partial<ChartThemeConfig>) => onChange({ ...value, ...updates }), [onChange, value]);

  return (
    <Form size="small" labelCol={FORM_LABEL_COL} wrapperCol={FORM_WRAPPER_COL}>
      <Form.Item label={ui.baseTheme}>
        <Select
          aria-label={ui.baseTheme}
          value={value.baseTheme ?? 'light'}
          onChange={baseTheme => update({ baseTheme })}
          size="small"
          virtual={false}
          options={themeOptions}
        />
      </Form.Item>
      <Form.Item label={ui.customPalette}>
        <ColorPaletteEditor
          t={t}
          presetId={value.palettePresetId}
          colors={value.customPalette ?? []}
          onPresetChange={palettePresetId => update({ palettePresetId, customPalette: undefined })}
          onColorsChange={customPalette => update({ customPalette })}
        />
      </Form.Item>
    </Form>
  );
});
