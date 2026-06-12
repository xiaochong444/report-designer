import type { ChartThemeConfig } from '@report-designer/core';
import * as vseed from '@visactor/vseed';

export const CHART_PALETTE_PRESETS = {
  business: ['#1E40AF', '#0F766E', '#B45309', '#991B1B', '#5B21B6', '#155E75'],
  vivid: ['#5B8FF9', '#5AD8A6', '#F6BD16', '#E8684A', '#6DC8EC', '#9270CA'],
  soft: ['#93C5FD', '#86EFAC', '#FDE68A', '#FCA5A5', '#C4B5FD', '#A5F3FC'],
  ocean: ['#0EA5E9', '#0284C7', '#0369A1', '#38BDF8', '#06B6D4', '#155E75'],
  forest: ['#16A34A', '#15803D', '#22C55E', '#4ADE80', '#059669', '#047857'],
  sunset: ['#F97316', '#EA580C', '#F59E0B', '#FBBF24', '#EF4444', '#DC2626'],
} as const;

const DEFAULT_LIGHT = ['#5B8FF9', '#5AD8A6', '#5D7092', '#F6BD16', '#6F5EF9', '#6DC8EC'];
const DEFAULT_DARK = ['#7052F2', '#4F4FD9', '#5A8FE8', '#46B9C9', '#44A89D', '#E8C96A'];
const registeredThemes = new Set<string>();

export interface ResolvedChartTheme {
  themeName: string;
  palette: string[];
  linearPalette: [string, string];
}

export function resolveChartTheme(theme?: ChartThemeConfig): ResolvedChartTheme {
  const baseTheme = theme?.baseTheme ?? 'light';
  const palette = resolvePalette(theme);
  const linearPalette: [string, string] = theme?.linearPalette ?? [palette[0] ?? DEFAULT_LIGHT[0], palette[1] ?? palette[0] ?? DEFAULT_LIGHT[0]];
  const signature = stableHash(JSON.stringify({ ...theme, baseTheme, palette, linearPalette }));
  const themeName = `rd-chart-${baseTheme}-${signature}`;

  if (!registeredThemes.has(themeName)) {
    const registerTokenTheme = getRegisterTokenTheme();
    registerTokenTheme?.(themeName, {
      baseTheme,
      fontFamily: theme?.fontFamily,
      colorScheme: ensurePaletteTuple(palette),
      linearColorScheme: linearPalette,
      textPrimary: theme?.textPrimary ?? (baseTheme === 'dark' ? '#f8fafc' : '#0f172a'),
      textSecondary: theme?.textSecondary ?? (baseTheme === 'dark' ? '#cbd5e1' : '#475569'),
      borderColor: theme?.axisGridColor ?? theme?.gridColor ?? (baseTheme === 'dark' ? '#334155' : '#e2e8f0'),
      tooltipBackgroundColor: baseTheme === 'dark' ? '#0f172a' : '#ffffff',
      axisLabelColor: theme?.axisLabelColor,
      axisTitleColor: theme?.axisTitleColor,
      axisGridColor: theme?.axisGridColor ?? theme?.gridColor,
      axisLineColor: theme?.axisLineColor,
      labelColor: theme?.labelColor,
      legendLabelColor: theme?.legendLabelColor,
    }, { ensureRegisterAll: false });
    registeredThemes.add(themeName);
  }

  return { themeName, palette, linearPalette };
}

function getRegisterTokenTheme(): ((themeName: string, tokens: Record<string, unknown>, options?: Record<string, unknown>) => void) | undefined {
  try {
    return (vseed as unknown as { registerTokenTheme?: (themeName: string, tokens: Record<string, unknown>, options?: Record<string, unknown>) => void }).registerTokenTheme;
  } catch {
    return undefined;
  }
}

export function resolvePalette(theme?: ChartThemeConfig): string[] {
  if (theme?.customPalette?.length) return theme.customPalette;
  if (theme?.palettePresetId && theme.palettePresetId in CHART_PALETTE_PRESETS) {
    return [...CHART_PALETTE_PRESETS[theme.palettePresetId as keyof typeof CHART_PALETTE_PRESETS]];
  }
  return theme?.baseTheme === 'dark' ? DEFAULT_DARK : DEFAULT_LIGHT;
}

function ensurePaletteTuple(colors: string[]): [string, string, ...string[]] {
  const fallback = colors.length === 0 ? DEFAULT_LIGHT : colors;
  return [fallback[0] ?? DEFAULT_LIGHT[0], fallback[1] ?? fallback[0] ?? DEFAULT_LIGHT[0], ...fallback.slice(2)];
}

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
