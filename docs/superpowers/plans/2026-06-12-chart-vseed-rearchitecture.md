# Chart VSeed Rearchitecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the chart component around a stable report chart DSL, VSeed-backed compiler, richer chart configuration, and usable palette/theme editing.

**Architecture:** Core owns the template/render chart contract and compatibility normalization. Viewer owns the chart compiler from `RenderChart` to VSeed input to VChart spec plus report-specific patches. Designer owns chart-specific property panels under `components/chart/`, with `PropertyEditor.tsx` only delegating to them.

**Tech Stack:** TypeScript, React 19, Ant Design 6, Vitest, `@visactor/vseed@0.5.6`, `@visactor/vchart@2.0.22`, pnpm workspaces.

---

## File Structure

Core:

- Modify: `packages/core/src/template-model/types.ts`
  - Add new chart config interfaces: title, legend, axes, labels, theme, plot options.
  - Keep `appearance?: ChartAppearance` temporarily for compatibility.
  - Extend `ChartMeasure` with `axis?: 'left' | 'right'` and `aggregation?: 'none' | ...`.
- Modify: `packages/core/src/template-model/normalize-template.ts`
  - Normalize old `appearance` into new fields.
  - Preserve old `appearance` during compatibility period.
- Modify: `packages/core/src/render-document/types.ts`
  - Add new chart config fields to `RenderChart`.
- Modify: `packages/core/src/layout-engine/layout-band.ts`
  - Populate new fields in `layoutChart` while preserving old render fields until viewer migration is complete.
- Test: `packages/core/__tests__/phase-41-chart-rendering.test.ts`
  - Update existing tests for new normalized chart fields.
- Test: `packages/core/__tests__/phase-48-chart-config-normalization.test.ts`
  - New focused normalization and render contract tests.

Viewer:

- Create: `packages/viewer/src/renderers/chart/chart-type-capabilities.ts`
  - Stable/advanced chart type metadata and field requirements.
- Create: `packages/viewer/src/renderers/chart/chart-data.ts`
  - Dataset builder helpers from `RenderChart`.
- Create: `packages/viewer/src/renderers/chart/chart-theme.ts`
  - Token theme creation, palette presets, and registration.
- Create: `packages/viewer/src/renderers/chart/chart-vseed.ts`
  - VSeed input builder.
- Create: `packages/viewer/src/renderers/chart/chart-spec-patch.ts`
  - Report-level spec patches for title, legend, axes, labels, plot options, and fallback palette.
- Modify: `packages/viewer/src/renderers/chart/chart-spec.ts`
  - Replace large inline builder helpers with compiler orchestration.
- Modify: `packages/viewer/src/renderers/chart/chart-themes.ts`
  - Either re-export from `chart-theme.ts` for compatibility or reduce to palette constants.
- Test: `packages/viewer/src/__tests__/phase-41-chart-rendering.test.tsx`
  - Update theme expectations away from direct `spec.color.range` only.
- Test: `packages/viewer/src/__tests__/phase-48-chart-compiler.test.ts`
  - New compiler unit tests.

Designer:

- Create: `packages/designer/src/components/chart/chart-options.ts`
  - Chart options, panel visibility helpers, palette presets for UI.
- Create: `packages/designer/src/components/chart/ColorPaletteEditor.tsx`
  - Palette preset and color swatch editor.
- Create: `packages/designer/src/components/chart/ChartPropertyPanel.tsx`
  - Main chart panel shell.
- Create: `packages/designer/src/components/chart/ChartDataPanel.tsx`
- Create: `packages/designer/src/components/chart/ChartThemePanel.tsx`
- Create: `packages/designer/src/components/chart/ChartTitlePanel.tsx`
- Create: `packages/designer/src/components/chart/ChartLegendPanel.tsx`
- Create: `packages/designer/src/components/chart/ChartAxesPanel.tsx`
- Create: `packages/designer/src/components/chart/ChartLabelPanel.tsx`
- Create: `packages/designer/src/components/chart/ChartTypeStylePanel.tsx`
- Modify: `packages/designer/src/components/PropertyEditor.tsx`
  - Delegate chart-specific content to `ChartPropertyPanel`.
  - Remove inline chart panel code after delegation is green.
- Test: `packages/designer/src/__tests__/phase-41-chart-component.test.tsx`
  - Update existing property tests.
- Test: `packages/designer/src/__tests__/phase-48-chart-property-panel.test.tsx`
  - New palette and rich config tests.

Examples:

- Modify: `packages/example/src/templates/business-dashboard.ts`
- Modify: `packages/example/src/templates/store-daily-sales.ts`
- Modify as needed: other templates containing chart components.

---

## Task 1: Core Chart DSL and Compatibility Normalization

**Files:**
- Modify: `packages/core/src/template-model/types.ts`
- Modify: `packages/core/src/template-model/normalize-template.ts`
- Modify: `packages/core/src/render-document/types.ts`
- Modify: `packages/core/src/layout-engine/layout-band.ts`
- Test: `packages/core/__tests__/phase-41-chart-rendering.test.ts`
- Create: `packages/core/__tests__/phase-48-chart-config-normalization.test.ts`

- [ ] **Step 1: Write failing normalization tests**

Create `packages/core/__tests__/phase-48-chart-config-normalization.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { normalizeTemplate, renderReport } from '../src';
import type { ChartComponent, ReportTemplate } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

function makeChart(overrides: Partial<ChartComponent> = {}): ChartComponent {
  return {
    id: 'chart-1',
    type: 'chart',
    name: 'Chart1',
    x: 0,
    y: 0,
    width: 120,
    height: 60,
    chartType: 'column',
    binding: {
      dataSourceId: 'sales',
      dimensions: [{ field: 'Region' }],
      measures: [{ field: 'Amount' }],
      seriesField: 'Channel',
      aggregate: 'sum',
      sort: [],
    },
    appearance: {
      title: 'Sales by Region',
      subtitle: 'Monthly',
      showLegend: true,
      legendPosition: 'right',
      showAxes: true,
      showGrid: true,
      showLabels: true,
      labelType: 'name-value',
      axisTitleX: 'Region',
      axisTitleY: 'Amount',
      axisLabelRotation: -30,
      theme: {
        baseTheme: 'dark',
        customPalette: ['#ff0000', '#00ff00'],
        axisLabelColor: '#cbd5e1',
        labelColor: '#f8fafc',
      },
      markStyle: {
        cornerRadius: 4,
        fillOpacity: 0.8,
      },
    },
    emptyMessage: 'No chart data',
    ...overrides,
  };
}

function makeChartTemplate(component: ChartComponent): ReportTemplate {
  const template = makeTemplate([
    band('title', 'reportTitle', {
      height: 70,
      components: [component],
    }),
  ]);
  template.dataSources = [{
    id: 'sales',
    name: 'Sales',
    type: 'json',
    fields: [
      { name: 'Region', type: 'string' },
      { name: 'Channel', type: 'string' },
      { name: 'Amount', type: 'number' },
    ],
  }];
  return template;
}

describe('phase 48 chart config normalization', () => {
  it('normalizes legacy chart appearance into structured chart config', () => {
    const normalized = normalizeTemplate(makeChartTemplate(makeChart()));
    const chart = normalized.pages[0].bands[0].components[0] as ChartComponent;

    expect(chart.title).toMatchObject({
      visible: true,
      text: 'Sales by Region',
      subtitle: 'Monthly',
    });
    expect(chart.legend).toMatchObject({
      visible: true,
      position: 'right',
    });
    expect(chart.axes).toMatchObject({
      x: {
        visible: true,
        title: 'Region',
        labelRotate: -30,
        gridVisible: true,
      },
      y: {
        visible: true,
        title: 'Amount',
        gridVisible: true,
      },
    });
    expect(chart.labels).toMatchObject({
      visible: true,
      content: 'name-value',
    });
    expect(chart.theme).toMatchObject({
      baseTheme: 'dark',
      customPalette: ['#ff0000', '#00ff00'],
      axisLabelColor: '#cbd5e1',
      labelColor: '#f8fafc',
    });
    expect(chart.plotOptions).toMatchObject({
      bar: {
        cornerRadius: 4,
        fillOpacity: 0.8,
      },
    });
  });

  it('preserves explicit structured chart config over legacy appearance', () => {
    const normalized = normalizeTemplate(makeChartTemplate(makeChart({
      title: {
        visible: true,
        text: 'Explicit Title',
        color: '#111827',
        font: { family: 'Arial', size: 16, bold: true },
      },
      legend: {
        visible: false,
        position: 'bottom',
        color: '#334155',
      },
      labels: {
        visible: true,
        content: 'value',
        color: '#0f172a',
      },
      theme: {
        baseTheme: 'light',
        palettePresetId: 'business',
      },
      plotOptions: {
        bar: {
          cornerRadius: 8,
        },
      },
    })));
    const chart = normalized.pages[0].bands[0].components[0] as ChartComponent;

    expect(chart.title?.text).toBe('Explicit Title');
    expect(chart.title?.color).toBe('#111827');
    expect(chart.legend?.visible).toBe(false);
    expect(chart.labels?.content).toBe('value');
    expect(chart.theme?.palettePresetId).toBe('business');
    expect(chart.plotOptions?.bar?.cornerRadius).toBe(8);
  });

  it('passes structured chart config into render documents', () => {
    const document = renderReport(makeChartTemplate(makeChart()), {
      sales: [
        { Region: 'East', Channel: 'Online', Amount: 10 },
      ],
    });
    const chart = document.pages[0].items[0].components[0];

    expect(chart.type).toBe('chart');
    expect(chart).toMatchObject({
      titleConfig: {
        visible: true,
        text: 'Sales by Region',
      },
      legendConfig: {
        visible: true,
        position: 'right',
      },
      labelsConfig: {
        visible: true,
        content: 'name-value',
      },
      theme: {
        baseTheme: 'dark',
      },
      plotOptions: {
        bar: {
          cornerRadius: 4,
        },
      },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-48-chart-config-normalization.test.ts
```

Expected: FAIL because `title`, `legend`, `axes`, `labels`, `plotOptions`, and render `titleConfig` fields do not exist yet.

- [ ] **Step 3: Add chart config types**

In `packages/core/src/template-model/types.ts`, add these interfaces near existing chart types:

```typescript
export interface ChartFontConfig {
  family?: string;
  size?: number;
  bold?: boolean;
  italic?: boolean;
  color?: string;
}

export interface ChartTitleConfig {
  visible: boolean;
  text?: string;
  subtitle?: string;
  position?: 'top' | 'bottom';
  align?: 'left' | 'center' | 'right';
  font?: ChartFontConfig;
  color?: string;
  subtitleFont?: ChartFontConfig;
  subtitleColor?: string;
  padding?: Partial<Padding>;
}

export interface ChartLegendConfig {
  visible: boolean;
  position: ChartLegendPosition;
  align?: 'start' | 'center' | 'end';
  layout?: 'horizontal' | 'vertical';
  font?: ChartFontConfig;
  color?: string;
  markerShape?: 'circle' | 'square' | 'rect' | 'line' | 'diamond';
  maxRows?: number;
  maxColumns?: number;
}

export interface ChartAxesConfig {
  x?: ChartAxisConfig;
  y?: ChartAxisConfig;
  rightY?: ChartAxisConfig;
}

export interface ChartAxisConfig {
  visible: boolean;
  title?: string;
  titleFont?: ChartFontConfig;
  titleColor?: string;
  labelFont?: ChartFontConfig;
  labelColor?: string;
  labelRotate?: number;
  lineVisible?: boolean;
  lineColor?: string;
  tickVisible?: boolean;
  tickColor?: string;
  gridVisible?: boolean;
  gridColor?: string;
  gridDash?: number[];
  min?: number;
  max?: number;
  nice?: boolean;
  format?: TextFormatConfig;
}

export interface ChartLabelConfig {
  visible: boolean;
  content: 'name' | 'value' | 'percent' | 'name-value' | 'custom';
  customTemplate?: string;
  position?: 'auto' | 'inside' | 'outside' | 'top' | 'bottom' | 'left' | 'right' | 'spider';
  font?: ChartFontConfig;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  showLeaderLine?: boolean;
  overlapStrategy?: 'hide' | 'shift' | 'none';
}

export interface ChartBarOptions {
  barWidth?: number;
  cornerRadius?: number;
  fillOpacity?: number;
  borderColor?: string;
  borderWidth?: number;
  labelPosition?: 'inside' | 'top' | 'outside';
}

export interface ChartLineOptions {
  curveType?: 'linear' | 'monotone' | 'step';
  lineWidth?: number;
  showPoint?: boolean;
  pointSize?: number;
  pointShape?: 'circle' | 'square' | 'triangle' | 'diamond';
  connectNulls?: boolean;
}

export interface ChartAreaOptions {
  showArea?: boolean;
  areaOpacity?: number;
}

export interface ChartPieOptions {
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  padAngle?: number;
  roseType?: 'radius' | 'area';
}

export interface ChartScatterOptions {
  pointSize?: number;
  pointShape?: 'circle' | 'square' | 'triangle' | 'diamond';
  fillOpacity?: number;
  showTrendLine?: boolean;
  trendLineType?: 'linear' | 'polynomial' | 'exponential';
}

export interface ChartRadarOptions {
  shape?: 'polygon' | 'circle';
  showArea?: boolean;
  areaOpacity?: number;
  lineWidth?: number;
  showPoint?: boolean;
  pointSize?: number;
  axisCount?: number;
}

export interface ChartFunnelOptions {
  direction?: 'vertical' | 'horizontal';
  shape?: 'trapezoid' | 'triangle' | 'rect';
  showConversionRate?: boolean;
  gap?: number;
  minSize?: number;
  maxSize?: number;
}

export interface ChartDualAxisOptions {
  primaryType?: 'bar' | 'line';
  secondaryType?: 'bar' | 'line';
}

export interface ChartHeatmapOptions {
  cellGap?: number;
  colorRange?: [string, string];
}

export interface ChartPlotOptions {
  bar?: ChartBarOptions;
  line?: ChartLineOptions;
  area?: ChartAreaOptions;
  pie?: ChartPieOptions;
  scatter?: ChartScatterOptions;
  radar?: ChartRadarOptions;
  funnel?: ChartFunnelOptions;
  dualAxis?: ChartDualAxisOptions;
  heatmap?: ChartHeatmapOptions;
}
```

Update `ChartMeasure`:

```typescript
export interface ChartMeasure {
  field: string;
  alias?: string;
  aggregation?: ChartAggregateMode;
  axis?: 'left' | 'right';
}
```

Update `ChartThemeConfig`:

```typescript
export interface ChartThemeConfig {
  baseTheme: 'light' | 'dark';
  palettePresetId?: string;
  customPalette?: string[];
  linearPalette?: [string, string];
  backgroundColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  axisLabelColor?: string;
  axisTitleColor?: string;
  axisLineColor?: string;
  axisGridColor?: string;
  gridColor?: string;
  labelColor?: string;
  legendLabelColor?: string;
  fontFamily?: string;
  textPrimary?: string;
  textSecondary?: string;
}
```

Update `ChartComponent`:

```typescript
export interface ChartComponent extends ReportComponent {
  type: 'chart';
  chartType: ChartType;
  binding: ChartBinding;
  appearance?: ChartAppearance;
  title?: ChartTitleConfig;
  legend?: ChartLegendConfig;
  axes?: ChartAxesConfig;
  labels?: ChartLabelConfig;
  theme?: ChartThemeConfig;
  plotOptions?: ChartPlotOptions;
  data?: ChartDataPoint[];
  emptyMessage?: string;
}
```

- [ ] **Step 4: Implement normalization**

In `packages/core/src/template-model/normalize-template.ts`, replace chart handling with helpers that compute structured fields:

```typescript
if (component.type === 'chart') {
  const chart = component as ChartComponent;
  const appearance = normalizeChartAppearance(chart.appearance);
  return {
    ...chart,
    chartType: chart.chartType ?? 'column',
    binding: normalizeChartBinding(chart.binding),
    appearance,
    title: chart.title ?? normalizeChartTitle(appearance),
    legend: chart.legend ?? normalizeChartLegend(appearance),
    axes: chart.axes ?? normalizeChartAxes(appearance),
    labels: chart.labels ?? normalizeChartLabels(appearance),
    theme: chart.theme ?? appearance.theme ?? { baseTheme: 'light' },
    plotOptions: chart.plotOptions ?? normalizeChartPlotOptions(appearance.markStyle),
  } as ChartComponent;
}
```

Add helper functions:

```typescript
function normalizeChartTitle(appearance: ChartAppearance): ChartTitleConfig {
  return {
    visible: Boolean(appearance.title || appearance.subtitle),
    text: appearance.title,
    subtitle: appearance.subtitle,
    color: appearance.theme?.titleColor,
    subtitleColor: appearance.theme?.subtitleColor,
    font: appearance.theme?.fontFamily ? { family: appearance.theme.fontFamily } : undefined,
  };
}

function normalizeChartLegend(appearance: ChartAppearance): ChartLegendConfig {
  return {
    visible: appearance.showLegend ?? true,
    position: appearance.legendPosition ?? 'bottom',
    color: appearance.theme?.legendLabelColor,
    font: appearance.theme?.fontFamily ? { family: appearance.theme.fontFamily } : undefined,
  };
}

function normalizeChartAxes(appearance: ChartAppearance): ChartAxesConfig {
  const visible = appearance.showAxes ?? true;
  const gridVisible = appearance.showGrid ?? true;
  return {
    x: {
      visible,
      title: appearance.axisTitleX ?? '',
      labelRotate: appearance.axisLabelRotation,
      labelColor: appearance.theme?.axisLabelColor,
      titleColor: appearance.theme?.axisTitleColor,
      lineColor: appearance.theme?.axisLineColor,
      gridVisible,
      gridColor: appearance.theme?.axisGridColor ?? appearance.theme?.gridColor,
    },
    y: {
      visible,
      title: appearance.axisTitleY ?? '',
      labelColor: appearance.theme?.axisLabelColor,
      titleColor: appearance.theme?.axisTitleColor,
      lineColor: appearance.theme?.axisLineColor,
      gridVisible,
      gridColor: appearance.theme?.axisGridColor ?? appearance.theme?.gridColor,
    },
  };
}

function normalizeChartLabels(appearance: ChartAppearance): ChartLabelConfig {
  return {
    visible: appearance.showLabels ?? false,
    content: appearance.labelType ?? 'name',
    color: appearance.theme?.labelColor,
    font: appearance.theme?.fontFamily ? { family: appearance.theme.fontFamily } : undefined,
  };
}

function normalizeChartPlotOptions(markStyle: ChartAppearance['markStyle']): ChartPlotOptions {
  if (!markStyle) return {};
  return {
    bar: {
      barWidth: markStyle.barWidth,
      cornerRadius: markStyle.cornerRadius,
      fillOpacity: markStyle.fillOpacity,
      borderColor: markStyle.stroke,
      borderWidth: markStyle.lineWidth,
      labelPosition: markStyle.barLabelPosition,
    },
    line: {
      curveType: markStyle.curveType,
      lineWidth: markStyle.lineWidth,
      showPoint: markStyle.showPoint,
      pointSize: markStyle.pointSize,
      pointShape: markStyle.pointShape,
      connectNulls: markStyle.connectNulls,
    },
    area: {
      showArea: markStyle.showArea,
      areaOpacity: markStyle.areaOpacity,
    },
    pie: {
      innerRadius: markStyle.innerRadius,
      outerRadius: markStyle.outerRadius,
      startAngle: markStyle.startAngle,
      padAngle: markStyle.padAngle,
      roseType: markStyle.roseType,
    },
    scatter: {
      pointSize: markStyle.pointSize,
      pointShape: markStyle.pointShape,
      fillOpacity: markStyle.fillOpacity,
      showTrendLine: markStyle.showTrendLine,
      trendLineType: markStyle.trendLineType,
    },
    radar: {
      shape: markStyle.radarShape,
      showArea: markStyle.showRadarArea,
      areaOpacity: markStyle.radarAreaOpacity,
      lineWidth: markStyle.lineWidth,
      showPoint: markStyle.showPoint,
      pointSize: markStyle.pointSize,
      axisCount: markStyle.axisCount,
    },
    funnel: {
      direction: markStyle.funnelDirection,
      shape: markStyle.funnelShape,
      showConversionRate: markStyle.showConversionRate,
      gap: markStyle.funnelGap,
      minSize: markStyle.funnelMinSize,
      maxSize: markStyle.funnelMaxSize,
    },
    dualAxis: {
      primaryType: markStyle.primaryType,
      secondaryType: markStyle.secondaryType,
    },
  };
}
```

Add required imports for the new types.

- [ ] **Step 5: Pass structured config into RenderChart**

In `packages/core/src/render-document/types.ts`, import new config types and add fields:

```typescript
titleConfig?: ChartTitleConfig;
legendConfig?: ChartLegendConfig;
axesConfig?: ChartAxesConfig;
labelsConfig?: ChartLabelConfig;
plotOptions?: ChartPlotOptions;
```

In `packages/core/src/layout-engine/layout-band.ts`, inside `layoutChart`, add:

```typescript
titleConfig: component.title,
legendConfig: component.legend,
axesConfig: component.axes,
labelsConfig: component.labels,
theme: component.theme ?? component.appearance?.theme,
plotOptions: component.plotOptions,
```

Keep existing legacy render fields (`title`, `showLegend`, `axisTitleX`, etc.) populated from the new fields when available:

```typescript
title: component.title?.text ?? component.appearance?.title,
subtitle: component.title?.subtitle ?? component.appearance?.subtitle,
showLegend: component.legend?.visible ?? component.appearance?.showLegend ?? true,
legendPosition: component.legend?.position ?? component.appearance?.legendPosition ?? 'bottom',
showAxes: component.axes?.x?.visible ?? component.appearance?.showAxes ?? true,
showGrid: component.axes?.x?.gridVisible ?? component.appearance?.showGrid ?? true,
showLabels: component.labels?.visible ?? component.appearance?.showLabels ?? false,
labelType: component.labels?.content === 'custom' ? 'name' : (component.labels?.content ?? component.appearance?.labelType),
axisTitleX: component.axes?.x?.title ?? component.appearance?.axisTitleX,
axisTitleY: component.axes?.y?.title ?? component.appearance?.axisTitleY,
axisLabelRotation: component.axes?.x?.labelRotate ?? component.appearance?.axisLabelRotation,
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-48-chart-config-normalization.test.ts phase-41-chart-rendering.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/template-model/types.ts packages/core/src/template-model/normalize-template.ts packages/core/src/render-document/types.ts packages/core/src/layout-engine/layout-band.ts packages/core/__tests__/phase-41-chart-rendering.test.ts packages/core/__tests__/phase-48-chart-config-normalization.test.ts
git commit -m "feat(core): 重构图表配置模型"
```

---

## Task 2: Viewer Chart Compiler, Theme Tokens, and Spec Patches

**Files:**
- Create: `packages/viewer/src/renderers/chart/chart-type-capabilities.ts`
- Create: `packages/viewer/src/renderers/chart/chart-data.ts`
- Create: `packages/viewer/src/renderers/chart/chart-theme.ts`
- Create: `packages/viewer/src/renderers/chart/chart-vseed.ts`
- Create: `packages/viewer/src/renderers/chart/chart-spec-patch.ts`
- Modify: `packages/viewer/src/renderers/chart/chart-spec.ts`
- Modify: `packages/viewer/src/renderers/chart/chart-themes.ts`
- Test: `packages/viewer/src/__tests__/phase-41-chart-rendering.test.tsx`
- Create: `packages/viewer/src/__tests__/phase-48-chart-compiler.test.ts`

- [ ] **Step 1: Write failing compiler tests**

Create `packages/viewer/src/__tests__/phase-48-chart-compiler.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import type { RenderChart } from '@report-designer/core';
import { buildChartDataset } from '../renderers/chart/chart-data';
import { buildVSeedInput } from '../renderers/chart/chart-vseed';
import { resolveChartTheme } from '../renderers/chart/chart-theme';
import { buildVChartSpec } from '../renderers/chart/chart-spec';

function chart(overrides: Partial<RenderChart> = {}): RenderChart {
  return {
    id: 'chart-1',
    type: 'chart',
    x: 0,
    y: 0,
    width: 120,
    height: 60,
    chartType: 'column',
    data: [
      { category: 'East', series: 'Online', value: 25, label: 'East', x: null, y: 25, raw: {} },
      { category: 'West', series: 'Retail', value: 15, label: 'West', x: null, y: 15, raw: {} },
    ],
    rawData: [],
    binding: {
      dimensions: [{ field: 'category' }],
      measures: [{ field: 'value' }],
      seriesField: 'series',
      aggregate: 'sum',
      sort: [],
    },
    title: 'Sales',
    showLegend: true,
    legendPosition: 'right',
    showAxes: true,
    showGrid: true,
    showLabels: true,
    labelType: 'name-value',
    axisTitleX: 'Region',
    axisTitleY: 'Amount',
    aggregate: 'sum',
    emptyMessage: 'No chart data',
    titleConfig: {
      visible: true,
      text: 'Sales',
      subtitle: 'Monthly',
      color: '#111827',
      font: { family: 'Arial', size: 16, bold: true },
    },
    legendConfig: {
      visible: true,
      position: 'right',
      color: '#334155',
      font: { family: 'Arial', size: 11 },
    },
    axesConfig: {
      x: {
        visible: true,
        title: 'Region',
        labelRotate: -20,
        labelColor: '#475569',
        titleColor: '#0f172a',
        gridVisible: true,
        gridColor: '#e2e8f0',
      },
      y: {
        visible: true,
        title: 'Amount',
        labelColor: '#475569',
        titleColor: '#0f172a',
        gridVisible: true,
        gridColor: '#e2e8f0',
      },
    },
    labelsConfig: {
      visible: true,
      content: 'name-value',
      color: '#1f2937',
      font: { family: 'Arial', size: 10 },
    },
    theme: {
      baseTheme: 'light',
      customPalette: ['#ff0000', '#00ff00'],
      fontFamily: 'Arial',
      axisLabelColor: '#475569',
      axisTitleColor: '#0f172a',
      axisGridColor: '#e2e8f0',
      labelColor: '#1f2937',
      legendLabelColor: '#334155',
    },
    plotOptions: {
      bar: {
        cornerRadius: 6,
        fillOpacity: 0.75,
      },
    },
    style: {},
    ...overrides,
  };
}

describe('phase 48 chart compiler', () => {
  it('builds chart datasets from render chart points', () => {
    expect(buildChartDataset(chart())).toEqual([
      { category: 'East', value: 25, series: 'Online' },
      { category: 'West', value: 15, series: 'Retail' },
    ]);
  });

  it('builds VSeed input with verified field mappings', () => {
    const input = buildVSeedInput(chart(), { width: 320, height: 180 });
    expect(input).toMatchObject({
      chartType: 'column',
      xField: 'category',
      yField: 'value',
      colorField: 'series',
      width: 320,
      height: 180,
    });
    expect(input.dataset).toHaveLength(2);
  });

  it('resolves a deterministic token theme name and palette', () => {
    const resolved = resolveChartTheme(chart().theme);
    expect(resolved.themeName).toMatch(/^rd-chart-light-/);
    expect(resolved.palette).toEqual(['#ff0000', '#00ff00']);
  });

  it('applies report title, axis, labels, palette, and bar options to final spec', () => {
    const spec = buildVChartSpec(chart(), { width: 320, height: 180 }) as Record<string, any>;

    expect(spec.width).toBe(320);
    expect(spec.height).toBe(180);
    expect(spec.title?.text).toBe('Sales');
    expect(spec.title?.textStyle?.fill).toBe('#111827');
    expect(spec.color?.range ?? spec.color?.colorScheme).toEqual(['#ff0000', '#00ff00']);
    expect(JSON.stringify(spec)).toContain('#475569');
    expect(JSON.stringify(spec)).toContain('#1f2937');
    expect(JSON.stringify(spec)).toContain('cornerRadius');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @report-designer/viewer test -- phase-48-chart-compiler.test.ts
```

Expected: FAIL because new compiler modules do not exist yet.

- [ ] **Step 3: Implement chart type capabilities**

Create `packages/viewer/src/renderers/chart/chart-type-capabilities.ts`:

```typescript
import type { ChartType } from '@report-designer/core';

export const STABLE_CHART_TYPES: readonly ChartType[] = [
  'column', 'columnParallel', 'columnPercent',
  'bar', 'barParallel', 'barPercent',
  'line', 'area', 'areaPercent',
  'pie', 'donut', 'rose',
  'scatter', 'radar', 'funnel', 'dualAxis', 'heatmap',
];

export const ADVANCED_CHART_TYPES: readonly ChartType[] = [
  'histogram', 'boxPlot', 'sankey', 'treeMap', 'sunburst', 'circlePacking',
];

export function isPieLikeChart(type: ChartType): boolean {
  return type === 'pie' || type === 'donut' || type === 'rose';
}

export function isBarLikeChart(type: ChartType): boolean {
  return type === 'column' || type === 'columnParallel' || type === 'columnPercent'
    || type === 'bar' || type === 'barParallel' || type === 'barPercent';
}

export function isLineLikeChart(type: ChartType): boolean {
  return type === 'line' || type === 'area' || type === 'areaPercent';
}

export function isCartesianChart(type: ChartType): boolean {
  return !isPieLikeChart(type) && type !== 'funnel' && type !== 'radar';
}

export function mapVSeedChartType(type: ChartType): string {
  return STABLE_CHART_TYPES.includes(type) || ADVANCED_CHART_TYPES.includes(type) ? type : 'column';
}
```

- [ ] **Step 4: Implement dataset and VSeed input builders**

Create `packages/viewer/src/renderers/chart/chart-data.ts`:

```typescript
import type { RenderChart } from '@report-designer/core';

export function buildChartDataset(chart: RenderChart): Record<string, unknown>[] {
  const xField = chart.chartType === 'scatter' ? getDimensionField(chart, 'x') : getDimensionField(chart, 'category');
  const yField = chart.chartType === 'scatter' ? getMeasureField(chart, 'y') : getMeasureField(chart, 'value');
  const seriesField = chart.binding?.seriesField || 'series';

  return chart.data.map(point => {
    const row: Record<string, unknown> = {};
    row[xField] = chart.chartType === 'scatter' ? point.x : point.category;
    row[yField] = chart.chartType === 'scatter' ? point.y : point.value;
    if (point.series) row[seriesField] = point.series;
    return row;
  });
}

export function getDimensionField(chart: RenderChart, fallback: string): string {
  return chart.binding?.dimensions?.[0]?.field || fallback;
}

export function getSecondDimensionField(chart: RenderChart, fallback: string): string {
  return chart.binding?.dimensions?.[1]?.field || fallback;
}

export function getMeasureField(chart: RenderChart, fallback: string): string {
  return chart.binding?.measures?.[0]?.field || fallback;
}

export function getSecondMeasureField(chart: RenderChart, fallback: string): string {
  return chart.binding?.measures?.[1]?.field || fallback;
}
```

Create `packages/viewer/src/renderers/chart/chart-vseed.ts`:

```typescript
import type { RenderChart } from '@report-designer/core';
import { buildChartDataset, getDimensionField, getMeasureField, getSecondDimensionField, getSecondMeasureField } from './chart-data';
import { isPieLikeChart, mapVSeedChartType } from './chart-type-capabilities';
import { resolveChartTheme } from './chart-theme';
import type { ChartSpecSize } from './chart-spec';

export function buildVSeedInput(chart: RenderChart, size?: ChartSpecSize): Record<string, any> {
  const chartType = mapVSeedChartType(chart.chartType);
  const xField = getDimensionField(chart, 'category');
  const yField = getMeasureField(chart, 'value');
  const input: Record<string, any> = {
    chartType,
    dataset: buildChartDataset(chart),
    theme: resolveChartTheme(chart.theme).themeName,
  };

  if (isPieLikeChart(chart.chartType)) {
    input.categoryField = xField;
    input.angleField = yField;
  } else if (chart.chartType === 'heatmap') {
    input.xField = xField;
    input.yField = getSecondDimensionField(chart, 'series');
    input.valueField = yField;
  } else if (chart.chartType === 'dualAxis') {
    input.xField = xField;
    input.yField = yField;
    input.yField2 = getSecondMeasureField(chart, 'value2');
  } else {
    input.xField = chart.chartType === 'scatter' ? getDimensionField(chart, 'x') : xField;
    input.yField = chart.chartType === 'scatter' ? getMeasureField(chart, 'y') : yField;
  }

  if (chart.binding?.seriesField) input.colorField = chart.binding.seriesField;
  if (chart.labelsConfig?.visible || chart.showLabels) input.label = { enable: true };
  if (size?.width) input.width = size.width;
  if (size?.height) input.height = size.height;

  return input;
}
```

- [ ] **Step 5: Implement token theme resolver**

Create `packages/viewer/src/renderers/chart/chart-theme.ts`:

```typescript
import type { ChartThemeConfig } from '@report-designer/core';
import { registerTokenTheme } from '@visactor/vseed';

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
  const linearPalette: [string, string] = theme?.linearPalette ?? [palette[0], palette[1] ?? palette[0]];
  const signature = stableHash(JSON.stringify({ ...theme, baseTheme, palette, linearPalette }));
  const themeName = `rd-chart-${baseTheme}-${signature}`;

  if (!registeredThemes.has(themeName)) {
    registerTokenTheme(themeName, {
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

export function resolvePalette(theme?: ChartThemeConfig): string[] {
  if (theme?.customPalette?.length) return theme.customPalette;
  if (theme?.palettePresetId && theme.palettePresetId in CHART_PALETTE_PRESETS) {
    return [...CHART_PALETTE_PRESETS[theme.palettePresetId as keyof typeof CHART_PALETTE_PRESETS]];
  }
  return theme?.baseTheme === 'dark' ? DEFAULT_DARK : DEFAULT_LIGHT;
}

function ensurePaletteTuple(colors: string[]): [string, string, ...string[]] {
  const fallback = colors.length === 0 ? DEFAULT_LIGHT : colors;
  return [fallback[0], fallback[1] ?? fallback[0], ...fallback.slice(2)];
}

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
```

Update `packages/viewer/src/renderers/chart/chart-themes.ts` to re-export:

```typescript
export { CHART_PALETTE_PRESETS, resolvePalette as resolveColorPalette, resolveChartTheme } from './chart-theme';
```

- [ ] **Step 6: Implement spec patch helpers**

Create `packages/viewer/src/renderers/chart/chart-spec-patch.ts`:

```typescript
import type { RenderChart } from '@report-designer/core';
import { resolveChartTheme } from './chart-theme';
import { isBarLikeChart, isLineLikeChart, isPieLikeChart } from './chart-type-capabilities';

export function applyReportChartSpecPatch(spec: Record<string, any>, chart: RenderChart): void {
  applyDimensions(spec, chart);
  applyTitle(spec, chart);
  applyLegend(spec, chart);
  applyAxes(spec, chart);
  applyLabels(spec, chart);
  applyPaletteFallback(spec, chart);
  applyPlotOptions(spec, chart);
  spec.animation = false;
  spec.tooltip = { visible: false };
}

function applyDimensions(spec: Record<string, any>, chart: RenderChart): void {
  spec.width = spec.width ?? chart.width;
  spec.height = spec.height ?? chart.height;
}

function applyTitle(spec: Record<string, any>, chart: RenderChart): void {
  const title = chart.titleConfig;
  if (!title?.visible && !chart.title) return;
  spec.title = {
    ...(spec.title ?? {}),
    visible: title?.visible ?? true,
    text: title?.text ?? chart.title,
    subtext: title?.subtitle ?? chart.subtitle,
    orient: title?.position,
    align: title?.align,
    textStyle: {
      ...(spec.title?.textStyle ?? {}),
      fill: title?.color ?? chart.theme?.titleColor,
      fontFamily: title?.font?.family,
      fontSize: title?.font?.size,
      fontWeight: title?.font?.bold ? 'bold' : undefined,
      fontStyle: title?.font?.italic ? 'italic' : undefined,
    },
    subtextStyle: {
      ...(spec.title?.subtextStyle ?? {}),
      fill: title?.subtitleColor ?? chart.theme?.subtitleColor,
      fontFamily: title?.subtitleFont?.family,
      fontSize: title?.subtitleFont?.size,
    },
  };
}

function applyLegend(spec: Record<string, any>, chart: RenderChart): void {
  const legend = chart.legendConfig;
  const visible = legend?.visible ?? chart.showLegend;
  spec.legends = [{
    ...(Array.isArray(spec.legends) ? spec.legends[0] : {}),
    visible,
    orient: legend?.position ?? chart.legendPosition,
    item: {
      ...(Array.isArray(spec.legends) ? spec.legends[0]?.item : {}),
      label: {
        style: {
          fill: legend?.color ?? chart.theme?.legendLabelColor,
          fontFamily: legend?.font?.family,
          fontSize: legend?.font?.size,
        },
      },
    },
  }];
}

function applyAxes(spec: Record<string, any>, chart: RenderChart): void {
  if (!chart.showAxes && !chart.axesConfig) {
    spec.axes = [];
    return;
  }
  if (!Array.isArray(spec.axes)) return;
  for (const axis of spec.axes) {
    const axisConfig = axis.orient === 'bottom' || axis.orient === 'top' ? chart.axesConfig?.x : chart.axesConfig?.y;
    if (!axisConfig) continue;
    axis.visible = axisConfig.visible;
    axis.title = {
      ...(axis.title ?? {}),
      visible: Boolean(axisConfig.title),
      text: axisConfig.title,
      style: {
        ...(axis.title?.style ?? {}),
        fill: axisConfig.titleColor,
        fontFamily: axisConfig.titleFont?.family,
        fontSize: axisConfig.titleFont?.size,
      },
    };
    axis.label = {
      ...(axis.label ?? {}),
      style: {
        ...(axis.label?.style ?? {}),
        fill: axisConfig.labelColor,
        fontFamily: axisConfig.labelFont?.family,
        fontSize: axisConfig.labelFont?.size,
        angle: axisConfig.labelRotate,
      },
    };
    axis.domainLine = {
      ...(axis.domainLine ?? {}),
      visible: axisConfig.lineVisible,
      style: { ...(axis.domainLine?.style ?? {}), stroke: axisConfig.lineColor },
    };
    axis.grid = {
      ...(axis.grid ?? {}),
      visible: axisConfig.gridVisible,
      style: { ...(axis.grid?.style ?? {}), stroke: axisConfig.gridColor, lineDash: axisConfig.gridDash },
    };
    if (axisConfig.min != null) axis.min = axisConfig.min;
    if (axisConfig.max != null) axis.max = axisConfig.max;
    if (axisConfig.nice != null) axis.nice = axisConfig.nice;
  }
}

function applyLabels(spec: Record<string, any>, chart: RenderChart): void {
  const labels = chart.labelsConfig;
  const visible = labels?.visible ?? chart.showLabels;
  spec.label = {
    ...(spec.label ?? {}),
    visible,
    position: labels?.position === 'auto' ? undefined : labels?.position,
    style: {
      ...(spec.label?.style ?? {}),
      fill: labels?.color ?? chart.theme?.labelColor,
      fontFamily: labels?.font?.family,
      fontSize: labels?.font?.size,
      stroke: labels?.borderColor,
    },
  };
}

function applyPaletteFallback(spec: Record<string, any>, chart: RenderChart): void {
  const palette = resolveChartTheme(chart.theme).palette;
  if (spec.color && typeof spec.color === 'object') {
    spec.color.range = palette;
    spec.color.colorScheme = palette;
    return;
  }
  spec.color = { range: palette, colorScheme: palette };
}

function applyPlotOptions(spec: Record<string, any>, chart: RenderChart): void {
  const options = chart.plotOptions;
  if (!options) return;
  if (isBarLikeChart(chart.chartType) && options.bar) {
    spec.barStyle = [{
      ...(spec.barStyle?.[0] ?? {}),
      cornerRadius: options.bar.cornerRadius,
      fillOpacity: options.bar.fillOpacity,
      stroke: options.bar.borderColor,
      lineWidth: options.bar.borderWidth,
    }];
    if (options.bar.barWidth != null) spec.barMaxWidth = options.bar.barWidth;
  }
  if (isLineLikeChart(chart.chartType) && options.line) {
    spec.line = {
      ...(spec.line ?? {}),
      style: {
        ...(spec.line?.style ?? {}),
        curveType: options.line.curveType,
        lineWidth: options.line.lineWidth,
      },
    };
    spec.point = {
      ...(spec.point ?? {}),
      visible: options.line.showPoint,
      style: {
        ...(spec.point?.style ?? {}),
        size: options.line.pointSize,
        symbolType: options.line.pointShape,
      },
    };
  }
  if (isPieLikeChart(chart.chartType) && options.pie) {
    if (options.pie.innerRadius != null) spec.innerRadius = options.pie.innerRadius;
    if (options.pie.outerRadius != null) spec.outerRadius = options.pie.outerRadius;
    if (options.pie.startAngle != null) spec.startAngle = options.pie.startAngle;
    if (options.pie.padAngle != null) spec.padAngle = options.pie.padAngle;
  }
}
```

- [ ] **Step 7: Replace `chart-spec.ts` orchestration**

Keep `ChartSpecSize` exported. Replace `buildVChartSpec` internals with:

```typescript
import type { RenderChart } from '@report-designer/core';
import type { ISpec } from '@visactor/vchart';
import { Builder, registerAll, registerLightTheme, registerDarkTheme } from '@visactor/vseed';
import { buildVSeedInput } from './chart-vseed';
import { applyReportChartSpecPatch } from './chart-spec-patch';

let registered = false;

function ensureRegistered(): void {
  if (registered) return;
  registered = true;
  registerAll();
  registerLightTheme();
  registerDarkTheme();
}

export interface ChartSpecSize {
  width: number;
  height: number;
}

export function buildVChartSpec(chart: RenderChart, size?: ChartSpecSize): ISpec {
  ensureRegistered();

  if (chart.data.length === 0 && (!chart.rawData || chart.rawData.length === 0)) {
    return buildEmptySpec(chart, size);
  }

  try {
    const input = buildVSeedInput(chart, size);
    const spec = Builder.from(input as any).build() as Record<string, any>;
    applyReportChartSpecPatch(spec, chart);
    if (size?.width) spec.width = size.width;
    if (size?.height) spec.height = size.height;
    return spec as ISpec;
  } catch {
    return buildEmptySpec(chart, size);
  }
}

function buildEmptySpec(chart: RenderChart, size?: ChartSpecSize): ISpec {
  return {
    type: 'bar' as any,
    width: size?.width,
    height: size?.height,
    data: [{ id: 'empty', values: [] }],
    animation: false,
    tooltip: { visible: false },
    ...(chart.titleConfig?.text || chart.title ? {
      title: {
        visible: true,
        text: chart.titleConfig?.text ?? chart.title,
      },
    } : {}),
  } as ISpec;
}
```

- [ ] **Step 8: Update existing viewer test expectations**

In `packages/viewer/src/__tests__/phase-41-chart-rendering.test.tsx`, update the palette test to allow the new compiler structure:

```typescript
expect((spec as any).color?.range ?? (spec as any).color?.colorScheme).toEqual(['#ff0000', '#00ff00']);
```

- [ ] **Step 9: Run focused viewer tests**

Run:

```bash
pnpm --filter @report-designer/viewer test -- phase-48-chart-compiler.test.ts phase-41-chart-rendering.test.tsx
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add packages/viewer/src/renderers/chart packages/viewer/src/__tests__/phase-41-chart-rendering.test.tsx packages/viewer/src/__tests__/phase-48-chart-compiler.test.ts
git commit -m "feat(viewer): 引入图表编译器和主题令牌"
```

---

## Task 3: Designer Chart Panel Extraction and Palette Editor

**Files:**
- Create: `packages/designer/src/components/chart/chart-options.ts`
- Create: `packages/designer/src/components/chart/ColorPaletteEditor.tsx`
- Create: `packages/designer/src/components/chart/ChartPropertyPanel.tsx`
- Create: `packages/designer/src/components/chart/ChartDataPanel.tsx`
- Create: `packages/designer/src/components/chart/ChartThemePanel.tsx`
- Create: `packages/designer/src/components/chart/ChartTitlePanel.tsx`
- Create: `packages/designer/src/components/chart/ChartLegendPanel.tsx`
- Create: `packages/designer/src/components/chart/ChartAxesPanel.tsx`
- Create: `packages/designer/src/components/chart/ChartLabelPanel.tsx`
- Create: `packages/designer/src/components/chart/ChartTypeStylePanel.tsx`
- Modify: `packages/designer/src/components/PropertyEditor.tsx`
- Test: `packages/designer/src/__tests__/phase-41-chart-component.test.tsx`
- Create: `packages/designer/src/__tests__/phase-48-chart-property-panel.test.tsx`

- [ ] **Step 1: Write failing designer tests**

Create `packages/designer/src/__tests__/phase-48-chart-property-panel.test.tsx`:

```typescript
/* @vitest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import type { ChartComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { PropertyEditor } from '../components/PropertyEditor';
import { useDesignerStore } from '../store/designer-store';

function chartComponent(overrides: Partial<ChartComponent> = {}): ChartComponent {
  return {
    id: 'chart-1',
    type: 'chart',
    name: 'Chart1',
    x: 10,
    y: 8,
    width: 80,
    height: 45,
    chartType: 'column',
    binding: {
      dataSourceId: 'orders',
      dimensions: [{ field: 'customer' }],
      measures: [{ field: 'amount' }],
      seriesField: '',
      labelField: '',
      sort: [],
      aggregate: 'sum',
    },
    title: {
      visible: true,
      text: 'Sales',
      color: '#111827',
      font: { family: 'Arial', size: 16 },
    },
    legend: {
      visible: true,
      position: 'bottom',
      color: '#334155',
    },
    axes: {
      x: { visible: true, title: 'Customer', labelColor: '#475569', gridVisible: true },
      y: { visible: true, title: 'Amount', labelColor: '#475569', gridVisible: true },
    },
    labels: {
      visible: false,
      content: 'value',
      color: '#1f2937',
    },
    theme: {
      baseTheme: 'light',
      palettePresetId: 'business',
      customPalette: ['#1E40AF', '#0F766E'],
    },
    plotOptions: {
      bar: { cornerRadius: 4 },
    },
    ...overrides,
  };
}

function loadSelectedComponent(component: ChartComponent) {
  const template = createDefaultTemplate('Phase 48 Chart Designer');
  template.dataSources = [{
    id: 'orders',
    name: 'orders',
    type: 'json',
    fields: [
      { name: 'customer', type: 'string' },
      { name: 'amount', type: 'number' },
      { name: 'qty', type: 'number' },
    ],
  }];
  template.pages[0].bands.find(band => band.type === 'data')!.components = [component];

  act(() => {
    useDesignerStore.getState().loadTemplate(template);
    useDesignerStore.getState().selectComponents([component.id]);
  });
}

describe('phase 48 chart property panel', () => {
  it('renders structured chart sections for title, legend, axes, labels, and theme', () => {
    loadSelectedComponent(chartComponent());
    render(<PropertyEditor />);

    expect(screen.getByText('图表属性')).toBeInTheDocument();
    expect(screen.getByText('主题与色板')).toBeInTheDocument();
    expect(screen.getByText('标题')).toBeInTheDocument();
    expect(screen.getByText('图例')).toBeInTheDocument();
    expect(screen.getByText('坐标轴')).toBeInTheDocument();
    expect(screen.getByText('数据标签')).toBeInTheDocument();
    expect(screen.getByLabelText('图表标题')).toHaveValue('Sales');
    expect(screen.getByLabelText('X 轴标题')).toHaveValue('Customer');
  });

  it('updates chart title color and label visibility in the selected component', () => {
    loadSelectedComponent(chartComponent());
    render(<PropertyEditor />);

    fireEvent.change(screen.getByLabelText('图表标题'), { target: { value: 'Revenue' } });
    fireEvent.click(screen.getByLabelText('显示数据标签'));

    const component = useDesignerStore.getState().template.pages[0].bands.find(band => band.type === 'data')!.components[0] as ChartComponent;
    expect(component.title?.text).toBe('Revenue');
    expect(component.labels?.visible).toBe(true);
  });

  it('edits palette through swatches instead of comma-separated input', () => {
    loadSelectedComponent(chartComponent());
    render(<PropertyEditor />);

    expect(screen.queryByPlaceholderText(/逗号/)).not.toBeInTheDocument();
    const palette = screen.getByTestId('chart-color-palette-editor');
    expect(within(palette).getAllByTestId('chart-palette-swatch')).toHaveLength(2);
    fireEvent.click(within(palette).getByLabelText('添加颜色'));

    const component = useDesignerStore.getState().template.pages[0].bands.find(band => band.type === 'data')!.components[0] as ChartComponent;
    expect(component.theme?.customPalette?.length).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-48-chart-property-panel.test.tsx
```

Expected: FAIL because chart panel modules do not exist and the old panel still uses comma-separated palette input.

- [ ] **Step 3: Create chart options and palette editor**

Create `packages/designer/src/components/chart/chart-options.ts`:

```typescript
import type { ChartType } from '@report-designer/core';

export const CHART_PALETTE_PRESETS = [
  { id: 'business', name: '商务', colors: ['#1E40AF', '#0F766E', '#B45309', '#991B1B', '#5B21B6', '#155E75'] },
  { id: 'vivid', name: '鲜明', colors: ['#5B8FF9', '#5AD8A6', '#F6BD16', '#E8684A', '#6DC8EC', '#9270CA'] },
  { id: 'soft', name: '柔和', colors: ['#93C5FD', '#86EFAC', '#FDE68A', '#FCA5A5', '#C4B5FD', '#A5F3FC'] },
  { id: 'ocean', name: '海洋', colors: ['#0EA5E9', '#0284C7', '#0369A1', '#38BDF8', '#06B6D4', '#155E75'] },
  { id: 'forest', name: '森林', colors: ['#16A34A', '#15803D', '#22C55E', '#4ADE80', '#059669', '#047857'] },
  { id: 'sunset', name: '日落', colors: ['#F97316', '#EA580C', '#F59E0B', '#FBBF24', '#EF4444', '#DC2626'] },
];

export const CHART_TYPE_OPTIONS: Array<{ value: ChartType; label: string }> = [
  { value: 'column', label: '柱状图' },
  { value: 'columnParallel', label: '分组柱状图' },
  { value: 'columnPercent', label: '百分比柱状图' },
  { value: 'bar', label: '条形图' },
  { value: 'barParallel', label: '分组条形图' },
  { value: 'barPercent', label: '百分比条形图' },
  { value: 'line', label: '折线图' },
  { value: 'area', label: '面积图' },
  { value: 'areaPercent', label: '百分比面积图' },
  { value: 'pie', label: '饼图' },
  { value: 'donut', label: '环图' },
  { value: 'rose', label: '玫瑰图' },
  { value: 'scatter', label: '散点图' },
  { value: 'radar', label: '雷达图' },
  { value: 'funnel', label: '漏斗图' },
  { value: 'dualAxis', label: '双轴图' },
  { value: 'heatmap', label: '热力图' },
];

export function isBarLikeChart(type: ChartType): boolean {
  return ['column', 'columnParallel', 'columnPercent', 'bar', 'barParallel', 'barPercent'].includes(type);
}

export function isLineLikeChart(type: ChartType): boolean {
  return ['line', 'area', 'areaPercent'].includes(type);
}

export function isPieLikeChart(type: ChartType): boolean {
  return ['pie', 'donut', 'rose'].includes(type);
}
```

Create `packages/designer/src/components/chart/ColorPaletteEditor.tsx`:

```typescript
import React from 'react';
import { Button, ColorPicker, Select, Space, Tooltip } from 'antd';
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { CHART_PALETTE_PRESETS } from './chart-options';

export const ColorPaletteEditor: React.FC<{
  value?: string[];
  presetId?: string;
  onChange: (colors: string[], presetId?: string) => void;
}> = ({ onChange, presetId, value = [] }) => {
  const colors = value.length ? value : (CHART_PALETTE_PRESETS.find(preset => preset.id === presetId)?.colors ?? []);

  const updateColor = (index: number, color: string) => {
    const next = [...colors];
    next[index] = color;
    onChange(next, presetId);
  };

  return (
    <Space data-testid="chart-color-palette-editor" direction="vertical" size={8} style={{ width: '100%' }}>
      <Select
        aria-label="色板预设"
        value={presetId}
        placeholder="选择色板"
        size="small"
        onChange={(nextPresetId) => {
          const preset = CHART_PALETTE_PRESETS.find(item => item.id === nextPresetId);
          onChange(preset ? [...preset.colors] : colors, nextPresetId);
        }}
        options={CHART_PALETTE_PRESETS.map(preset => ({
          value: preset.id,
          label: preset.name,
        }))}
      />
      <Space size={4} wrap>
        {colors.map((color, index) => (
          <Space.Compact key={`${color}-${index}`}>
            <ColorPicker
              aria-label={`色板颜色 ${index + 1}`}
              value={color}
              size="small"
              onChange={(_, hex) => updateColor(index, hex)}
            >
              <button
                type="button"
                data-testid="chart-palette-swatch"
                aria-label={`色板颜色 ${index + 1}`}
                style={{ width: 24, height: 24, border: '1px solid #d9d9d9', background: color, cursor: 'pointer' }}
              />
            </ColorPicker>
            <Tooltip title="删除颜色">
              <Button
                aria-label={`删除颜色 ${index + 1}`}
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => onChange(colors.filter((_, itemIndex) => itemIndex !== index), presetId)}
              />
            </Tooltip>
          </Space.Compact>
        ))}
        <Tooltip title="添加颜色">
          <Button
            aria-label="添加颜色"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => onChange([...colors, '#5B8FF9'], presetId)}
          />
        </Tooltip>
        <Tooltip title="恢复主题默认">
          <Button
            aria-label="恢复主题默认"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => onChange([], undefined)}
          />
        </Tooltip>
      </Space>
    </Space>
  );
};
```

- [ ] **Step 4: Create focused chart subpanels**

Create simple controlled subpanels. Each receives `chart`, `onChange`, and uses nested immutable updates. Minimal required fields:

`ChartTitlePanel.tsx`:

```typescript
import React from 'react';
import { ColorPicker, Form, Input, InputNumber, Switch } from 'antd';
import type { ChartComponent } from '@report-designer/core';

export const ChartTitlePanel: React.FC<{
  chart: ChartComponent;
  onChange: (updates: Partial<ChartComponent>) => void;
}> = ({ chart, onChange }) => {
  const title = chart.title ?? { visible: Boolean(chart.appearance?.title), text: chart.appearance?.title ?? '' };
  const updateTitle = (updates: Partial<typeof title>) => onChange({ title: { ...title, ...updates } });
  return (
    <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
      <Form.Item label="显示标题"><Switch aria-label="显示标题" size="small" checked={title.visible} onChange={(visible) => updateTitle({ visible })} /></Form.Item>
      <Form.Item label="图表标题"><Input aria-label="图表标题" value={title.text ?? ''} onChange={(event) => updateTitle({ text: event.target.value })} size="small" /></Form.Item>
      <Form.Item label="标题颜色"><ColorPicker aria-label="标题颜色" value={title.color} onChange={(_, color) => updateTitle({ color })} size="small" /></Form.Item>
      <Form.Item label="标题字号"><InputNumber aria-label="标题字号" value={title.font?.size} onChange={(size) => updateTitle({ font: { ...title.font, size: size ?? undefined } })} size="small" min={6} max={48} style={{ width: '100%' }} /></Form.Item>
    </Form>
  );
};
```

Create equivalent minimal panels:

- `ChartLegendPanel.tsx`: fields `legend.visible`, `legend.position`, `legend.color`.
- `ChartAxesPanel.tsx`: fields `axes.x.title`, `axes.y.title`, `axes.x.labelColor`, `axes.y.labelColor`, `gridVisible`.
- `ChartLabelPanel.tsx`: fields `labels.visible`, `labels.content`, `labels.color`.
- `ChartThemePanel.tsx`: fields `theme.baseTheme`, `theme.backgroundColor`, `theme.fontFamily`, and `ColorPaletteEditor`.
- `ChartDataPanel.tsx`: move the existing chart binding controls from `PropertyEditor.tsx`.
- `ChartTypeStylePanel.tsx`: expose at least bar `cornerRadius`, line `lineWidth`, pie `innerRadius`.

- [ ] **Step 5: Create `ChartPropertyPanel` shell**

Create `packages/designer/src/components/chart/ChartPropertyPanel.tsx`:

```typescript
import React from 'react';
import { Collapse, Form, Input, Select } from 'antd';
import type { ChartComponent, DataSource } from '@report-designer/core';
import { CHART_TYPE_OPTIONS } from './chart-options';
import { ChartDataPanel } from './ChartDataPanel';
import { ChartThemePanel } from './ChartThemePanel';
import { ChartTitlePanel } from './ChartTitlePanel';
import { ChartLegendPanel } from './ChartLegendPanel';
import { ChartAxesPanel } from './ChartAxesPanel';
import { ChartLabelPanel } from './ChartLabelPanel';
import { ChartTypeStylePanel } from './ChartTypeStylePanel';

export const ChartPropertyPanel: React.FC<{
  chart: ChartComponent;
  dataSources: DataSource[];
  onChange: (updates: Partial<ChartComponent>) => void;
}> = ({ chart, dataSources, onChange }) => (
  <Collapse
    size="small"
    defaultActiveKey={['chart-basic', 'chart-data', 'chart-theme', 'chart-title', 'chart-legend', 'chart-axes', 'chart-labels', 'chart-style']}
    items={[
      {
        key: 'chart-basic',
        label: '图表属性',
        children: (
          <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
            <Form.Item label="图表类型">
              <Select aria-label="图表类型" value={chart.chartType} onChange={(chartType) => onChange({ chartType })} options={CHART_TYPE_OPTIONS} size="small" />
            </Form.Item>
            <Form.Item label="空数据提示">
              <Input aria-label="空数据提示" value={chart.emptyMessage ?? ''} onChange={(event) => onChange({ emptyMessage: event.target.value })} size="small" />
            </Form.Item>
          </Form>
        ),
      },
      { key: 'chart-data', label: '数据绑定', children: <ChartDataPanel chart={chart} dataSources={dataSources} onChange={onChange} /> },
      { key: 'chart-theme', label: '主题与色板', children: <ChartThemePanel chart={chart} onChange={onChange} /> },
      { key: 'chart-title', label: '标题', children: <ChartTitlePanel chart={chart} onChange={onChange} /> },
      { key: 'chart-legend', label: '图例', children: <ChartLegendPanel chart={chart} onChange={onChange} /> },
      { key: 'chart-axes', label: '坐标轴', children: <ChartAxesPanel chart={chart} onChange={onChange} /> },
      { key: 'chart-labels', label: '数据标签', children: <ChartLabelPanel chart={chart} onChange={onChange} /> },
      { key: 'chart-style', label: '类型样式', children: <ChartTypeStylePanel chart={chart} onChange={onChange} /> },
    ]}
  />
);
```

- [ ] **Step 6: Delegate from `PropertyEditor.tsx`**

Import:

```typescript
import { ChartPropertyPanel } from './chart/ChartPropertyPanel';
```

In the `text`/chart content panel where chart-specific inline JSX currently renders, replace the chart branch with:

```tsx
component.type === 'chart' ? (
  <ChartPropertyPanel
    chart={component as ChartComponent}
    dataSources={template.dataSources}
    onChange={(updates) => handleChangeMany(updates)}
  />
) : ...
```

If `handleChangeMany` does not exist, add:

```typescript
const handleChangeMany = (updates: Partial<ReportComponent>) => {
  if (!component || !bandId || !currentPageId) return;
  const previous = Object.fromEntries(Object.keys(updates).map(key => [key, (component as any)[key]]));
  updateComponent(currentPageId, bandId, component.id, updates, previous);
};
```

Keep old translation keys in place for other tests; remove only the old inline chart JSX after new tests pass.

- [ ] **Step 7: Run focused designer tests**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-48-chart-property-panel.test.tsx phase-41-chart-component.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/designer/src/components/PropertyEditor.tsx packages/designer/src/components/chart packages/designer/src/__tests__/phase-41-chart-component.test.tsx packages/designer/src/__tests__/phase-48-chart-property-panel.test.tsx
git commit -m "feat(designer): 拆分图表属性面板"
```

---

## Task 4: Examples, Regression, and Integration Fixes

**Files:**
- Modify: `packages/example/src/templates/business-dashboard.ts`
- Modify: `packages/example/src/templates/store-daily-sales.ts`
- Modify as needed: other chart template files found by `rg -n "type: 'chart'" packages/example/src/templates`
- Modify as needed: tests affected by new structured chart config.

- [ ] **Step 1: Find chart templates**

Run:

```bash
rg -n "type: 'chart'|type: \"chart\"" packages/example/src/templates packages/core/__tests__ packages/designer/src/__tests__ packages/viewer/src/__tests__
```

Expected: list of chart component literals to migrate or verify.

- [ ] **Step 2: Update example chart literals**

For each example chart, prefer structured config:

```typescript
title: { visible: true, text: '销售趋势', color: '#111827', font: { size: 14, bold: true } },
legend: { visible: true, position: 'bottom', color: '#475569' },
axes: {
  x: { visible: true, title: '', gridVisible: false, labelColor: '#475569' },
  y: { visible: true, title: '', gridVisible: true, gridColor: '#e2e8f0', labelColor: '#475569' },
},
labels: { visible: false, content: 'value', color: '#1f2937' },
theme: { baseTheme: 'light', palettePresetId: 'business' },
```

Do not remove `appearance` from examples until all package tests pass, unless the example already has equivalent structured fields.

- [ ] **Step 3: Run package tests**

Run:

```bash
pnpm --filter @report-designer/core test
pnpm --filter @report-designer/viewer test
pnpm --filter @report-designer/designer test
pnpm --filter @report-designer/example test
```

Expected: PASS for each package.

- [ ] **Step 4: Run build**

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/example/src/templates packages/core packages/viewer packages/designer
git commit -m "test(chart): 更新图表示例与回归覆盖"
```

---

## Task 5: Final Verification and Cleanup

**Files:**
- Modify only if verification reveals small integration issues.

- [ ] **Step 1: Run full test suite**

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 2: Run full build**

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 3: Inspect changed files**

```bash
git status --short
git log --oneline -n 8
```

Expected: clean working tree after final commit, recent commits correspond to chart refactor tasks.

- [ ] **Step 4: Manual code review checklist**

Verify:

- `PropertyEditor.tsx` delegates chart details to `components/chart`.
- No comma-separated palette input remains for chart palettes.
- Viewer chart compiler files have focused responsibilities.
- Core normalize still preserves old `appearance`.
- VSeed registration happens once and token themes use deterministic names.

- [ ] **Step 5: Commit cleanup if needed**

If Step 4 required small fixes:

```bash
git add <changed-files>
git commit -m "fix(chart): 收尾图表重构集成问题"
```

If no fixes were needed, do not create an empty commit.

