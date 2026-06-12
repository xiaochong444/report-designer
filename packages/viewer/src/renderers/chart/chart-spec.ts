import type { RenderChart } from '@report-designer/core';
import type { ISpec } from '@visactor/vchart';
import { Builder, registerAll, registerDarkTheme, registerLightTheme } from '@visactor/vseed';
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

  const vseedInput = buildVSeedInput(chart, size);
  let spec: Record<string, any>;

  try {
    spec = Builder.from(vseedInput as any).build() as Record<string, any>;
  } catch {
    return buildEmptySpec(chart, size);
  }

  applyReportChartSpecPatch(spec, chart);
  if (size?.width) spec.width = size.width;
  if (size?.height) spec.height = size.height;

  return spec as ISpec;
}

function buildEmptySpec(chart: RenderChart, size?: ChartSpecSize): ISpec {
  return {
    type: 'bar' as any,
    width: size?.width,
    height: size?.height,
    data: [{ id: 'empty', values: [] }],
    animation: false,
    tooltip: { visible: false },
    ...(chart.title ? { title: { visible: true, text: chart.title } } : {}),
  } as ISpec;
}
