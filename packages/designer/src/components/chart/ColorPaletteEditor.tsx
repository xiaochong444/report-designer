import React from 'react';
import { Button, ColorPicker, Select, Space } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { CHART_PALETTE_PRESETS, DEFAULT_PALETTE_COLOR, chartUiText, type ChartPanelT } from './chart-options';

export const ColorPaletteEditor: React.FC<{
  presetId?: string;
  colors: string[];
  onPresetChange: (presetId?: string) => void;
  onColorsChange: (colors: string[]) => void;
  t: ChartPanelT;
}> = ({ colors, onColorsChange, onPresetChange, presetId, t }) => {
  const ui = chartUiText(t);
  const presetPalette = CHART_PALETTE_PRESETS.find(preset => preset.id === presetId)?.colors;
  const palette = colors.length ? colors : presetPalette ?? [DEFAULT_PALETTE_COLOR];

  const updateColor = (index: number, color: string) => {
    onColorsChange(palette.map((item, itemIndex) => itemIndex === index ? color : item));
  };

  return (
    <Space data-testid="chart-palette-editor" orientation="vertical" size={8} style={{ width: '100%' }}>
      <Select
        aria-label={ui.palettePreset}
        value={presetId}
        onChange={value => onPresetChange(value)}
        size="small"
        style={{ width: '100%' }}
        virtual={false}
        options={CHART_PALETTE_PRESETS.map(preset => ({
          value: preset.id,
          label: preset.label,
        }))}
        allowClear
      />
      <Space size={6} wrap>
        {palette.map((color, index) => (
          <Space.Compact key={`${index}-${color}`} data-testid={`chart-palette-swatch-${index}`}>
            <ColorPicker
              aria-label={ui.swatch(index + 1)}
              size="small"
              value={color}
              onChange={nextColor => updateColor(index, nextColor.toHexString())}
            />
            <Button
              aria-label={ui.deleteColor(index + 1)}
              title={ui.deleteColor(index + 1)}
              size="small"
              icon={<DeleteOutlined />}
              style={{ width: 28, paddingInline: 0 }}
              disabled={palette.length <= 1}
              onClick={() => onColorsChange(palette.filter((_, itemIndex) => itemIndex !== index))}
            />
          </Space.Compact>
        ))}
        <Button
          aria-label={ui.addColor}
          title={ui.addColor}
          size="small"
          icon={<PlusOutlined />}
          onClick={() => onColorsChange([...palette, DEFAULT_PALETTE_COLOR])}
        />
      </Space>
    </Space>
  );
};
