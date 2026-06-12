import type { ChartThemeConfig } from '@report-designer/core';
import { CHART_PALETTE_PRESETS, resolveChartTheme, resolvePalette } from './chart-theme';

export { CHART_PALETTE_PRESETS, resolveChartTheme };

export const COLOR_PALETTES: Record<string, string[]> = {
  default: resolvePalette({ baseTheme: 'light' }),
  vivid: [...CHART_PALETTE_PRESETS.vivid],
  pastel: [...CHART_PALETTE_PRESETS.soft],
  earth: [...CHART_PALETTE_PRESETS.forest],
  ocean: [...CHART_PALETTE_PRESETS.ocean],
  mono: resolvePalette({ baseTheme: 'dark' }),
};

export function resolveColorPalette(theme?: ChartThemeConfig): string[] {
  return resolvePalette(theme);
}

export function buildVChartTheme(theme?: ChartThemeConfig): Record<string, unknown> | undefined {
  if (!theme) return undefined;
  const tokens: Record<string, string> = {};
  if (theme.backgroundColor) tokens.backgroundColor = theme.backgroundColor;
  if (theme.titleColor) tokens.titleColor = theme.titleColor;
  if (theme.subtitleColor) tokens.subtitleColor = theme.subtitleColor;
  if (theme.axisLabelColor) tokens.axisLabelColor = theme.axisLabelColor;
  if (theme.axisLineColor) tokens.axisLineColor = theme.axisLineColor;
  if (theme.axisGridColor ?? theme.gridColor) tokens.axisGridColor = theme.axisGridColor ?? theme.gridColor ?? '';
  if (theme.labelColor) tokens.labelColor = theme.labelColor;
  if (theme.legendLabelColor) tokens.legendLabelColor = theme.legendLabelColor;
  if (theme.fontFamily) tokens.fontFamily = theme.fontFamily;
  return Object.keys(tokens).length > 0 ? tokens : undefined;
}

export function applyThemeToSpec(spec: Record<string, any>, theme?: ChartThemeConfig): void {
  if (!theme) return;

  const resolved = resolveChartTheme(theme);
  spec.theme = resolved.themeName;

  if (spec.color && typeof spec.color === 'object' && !Array.isArray(spec.color)) {
    spec.color.range = resolved.palette;
  } else {
    spec.color = { range: resolved.palette };
  }

  if (theme.backgroundColor) spec.background = theme.backgroundColor;
  if (theme.fontFamily) spec.fontFamily = theme.fontFamily;
}
