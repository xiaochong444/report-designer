import type { ChartThemeConfig } from '@report-designer/core';

/** Default color palettes by name */
export const COLOR_PALETTES: Record<string, string[]> = {
  default: [
    '#5B8FF9', '#5AD8A6', '#5D7092', '#F6BD16',
    '#6F5EF9', '#6DC8EC', '#945FB9', '#FF9845',
    '#1E9493', '#FF99C3',
  ],
  vivid: [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
    '#9966FF', '#FF9F40', '#C9CBCF', '#7BC8A4',
    '#E7E9ED', '#FF6B6B',
  ],
  pastel: [
    '#A8D8EA', '#AA96DA', '#FCBAD3', '#FFFD98',
    '#B5EAD7', '#C7CEEA', '#FFDAC1', '#E2F0CB',
    '#F0E6EF', '#D4E2D4',
  ],
  earth: [
    '#6B4F3A', '#8C7B6B', '#A69076', '#C4A97D',
    '#D4C4A8', '#7A9E7E', '#5B8C5A', '#3E6B48',
    '#C97C5D', '#92694F',
  ],
  ocean: [
    '#003F5C', '#2F4B7C', '#665191', '#A05195',
    '#D45087', '#F95D6A', '#FF7C43', '#FFA600',
    '#45B7D1', '#2EC4B6',
  ],
  mono: [
    '#1a1a2e', '#16213e', '#0f3460', '#533483',
    '#e94560', '#6c757d', '#adb5bd', '#ced4da',
    '#dee2e6', '#f8f9fa',
  ],
};

/** VSeed light theme palette */
const VSEED_LIGHT_PALETTE = [
  '#8D72F6', '#5766EC', '#66A3FE', '#51D5E6',
  '#4EC0B3', '#F9DF90', '#F9AD71', '#ED8888',
  '#E9A0C3', '#D77DD3',
];

/** VSeed dark theme palette */
const VSEED_DARK_PALETTE = [
  '#7052F2', '#4F4FD9', '#5A8FE8', '#46B9C9',
  '#44A89D', '#E8C96A', '#E0955A', '#D47777',
  '#D089AE', '#BE6DBE',
];

/**
 * Resolve the effective color palette for a chart theme config.
 * Priority: customPalette > palette from baseTheme (light/dark)
 */
export function resolveColorPalette(theme?: ChartThemeConfig): string[] {
  if (theme?.customPalette && theme.customPalette.length > 0) {
    return theme.customPalette;
  }
  // baseTheme: 'dark' uses dark palette, otherwise light
  return theme?.baseTheme === 'dark' ? VSEED_DARK_PALETTE : VSEED_LIGHT_PALETTE;
}

/**
 * Build a VChart theme object from ChartThemeConfig.
 * This returns a partial VChart theme spec for post-processing.
 */
export function buildVChartTheme(theme?: ChartThemeConfig): Record<string, unknown> | undefined {
  if (!theme) return undefined;

  const tokens: Record<string, string> = {};
  if (theme.backgroundColor) tokens['backgroundColor'] = theme.backgroundColor;
  if (theme.titleColor) tokens['titleColor'] = theme.titleColor;
  if (theme.subtitleColor) tokens['subtitleColor'] = theme.subtitleColor;
  if (theme.axisLabelColor) tokens['axisLabelColor'] = theme.axisLabelColor;
  if (theme.axisLineColor) tokens['axisLineColor'] = theme.axisLineColor;
  if (theme.gridColor) tokens['gridColor'] = theme.gridColor;
  if (theme.labelColor) tokens['labelColor'] = theme.labelColor;
  if (theme.fontFamily) tokens['fontFamily'] = theme.fontFamily;

  return Object.keys(tokens).length > 0 ? tokens : undefined;
}

/**
 * Apply theme customizations to a VChart ISpec after VSeed generation.
 */
export function applyThemeToSpec(
  spec: Record<string, any>,
  theme?: ChartThemeConfig,
): void {
  if (!theme) return;

  // Set VChart theme name ('light' or 'dark') — this controls axis colors,
  // background, grid lines, etc.
  if (theme.baseTheme) {
    spec.theme = theme.baseTheme;
  }

  // Apply custom palette to color range (overrides theme's colorScheme)
  // VSeed generates: { type: 'ordinal', domain: [...], range: [...] }
  const palette = resolveColorPalette(theme);
  if (spec.color && typeof spec.color === 'object' && 'range' in spec.color) {
    spec.color.range = palette;
  } else {
    spec.color = { range: palette };
  }

  // Apply background color
  if (theme.backgroundColor) {
    spec.background = theme.backgroundColor;
  }

  // Apply font family globally
  if (theme.fontFamily) {
    spec.fontFamily = theme.fontFamily;
  }

  // Apply title color
  if (theme.titleColor && spec.title) {
    spec.title.textStyle = { ...spec.title.textStyle, fill: theme.titleColor };
  }

  // Apply axis customizations
  if (Array.isArray(spec.axes)) {
    for (const axis of spec.axes) {
      if (theme.axisLabelColor && axis.label) {
        axis.label.style = { ...axis.label.style, fill: theme.axisLabelColor };
      }
      if (theme.axisLineColor && axis.domainLine) {
        axis.domainLine.style = { ...axis.domainLine.style, stroke: theme.axisLineColor };
      }
      if (theme.gridColor && axis.grid) {
        axis.grid.style = { ...axis.grid.style, stroke: theme.gridColor };
      }
      if (theme.fontFamily && axis.label) {
        axis.label.style = { ...axis.label.style, fontFamily: theme.fontFamily };
      }
    }
  }
}
