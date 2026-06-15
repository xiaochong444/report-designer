import React from 'react';
import { ColorPicker, Form, Select } from 'antd';
import type { ChartThemeConfig } from '@report-designer/core';
import { chartUiText, type ChartPanelT } from './chart-options';
import { ColorPaletteEditor } from './ColorPaletteEditor';

const FORM_LABEL_COL = { span: 8 };
const FORM_WRAPPER_COL = { span: 16 };
const THEME_OPTIONS = [
  { value: 'light', label: 'chartThemeLight' },
  { value: 'dark', label: 'chartThemeDark' },
] as const;
const DEFAULT_LINEAR_START = '#dbeafe';
const DEFAULT_LINEAR_END = '#1d4ed8';

export const ChartThemePanel: React.FC<{
  value: ChartThemeConfig;
  onChange: (value: ChartThemeConfig) => void;
  t: ChartPanelT;
}> = React.memo(({ onChange, t, value }) => {
  const ui = React.useMemo(() => chartUiText(t), [t]);
  const themeOptions = React.useMemo(() => THEME_OPTIONS.map(item => ({ value: item.value, label: t(item.label) })), [t]);
  const update = React.useCallback((updates: Partial<ChartThemeConfig>) => onChange({ ...value, ...updates }), [onChange, value]);
  const linearPalette = value.linearPalette ?? [DEFAULT_LINEAR_START, DEFAULT_LINEAR_END];

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
      <Form.Item label={ui.heatmapStartColor}>
        <ColorPicker
          aria-label={ui.heatmapStartColor}
          size="small"
          value={linearPalette[0]}
          onChange={color => update({ linearPalette: [color.toHexString(), linearPalette[1]] })}
        />
      </Form.Item>
      <Form.Item label={ui.heatmapEndColor}>
        <ColorPicker
          aria-label={ui.heatmapEndColor}
          size="small"
          value={linearPalette[1]}
          onChange={color => update({ linearPalette: [linearPalette[0], color.toHexString()] })}
        />
      </Form.Item>
    </Form>
  );
});
