import type { PageOrientation } from '@report-designer/core';

export type ReportUnit = 'mm' | 'cm';
export type PaperType = 'A5' | 'A4' | 'A3' | 'Letter' | 'Legal' | 'Custom';

export interface PaperPreset {
  value: Exclude<PaperType, 'Custom'>;
  label: string;
  width: number;
  height: number;
}

export const PAPER_PRESETS: PaperPreset[] = [
  { value: 'A5', label: 'A5', width: 148, height: 210 },
  { value: 'A4', label: 'A4', width: 210, height: 297 },
  { value: 'A3', label: 'A3', width: 297, height: 420 },
  { value: 'Letter', label: 'Letter', width: 216, height: 279 },
  { value: 'Legal', label: 'Legal', width: 216, height: 356 },
];

const EPSILON = 0.1;

function normalizeSides(width: number, height: number) {
  return {
    shortSide: Math.min(width, height),
    longSide: Math.max(width, height),
  };
}

export function detectPaperType(width: number, height: number): PaperType {
  const current = normalizeSides(width, height);
  const preset = PAPER_PRESETS.find((item) => {
    const normalized = normalizeSides(item.width, item.height);
    return Math.abs(normalized.shortSide - current.shortSide) <= EPSILON
      && Math.abs(normalized.longSide - current.longSide) <= EPSILON;
  });

  return preset?.value ?? 'Custom';
}

export function getPaperPresetSize(
  paperType: PaperType,
  orientation: PageOrientation,
  fallbackWidth: number,
  fallbackHeight: number,
) {
  if (paperType === 'Custom') {
    return { width: fallbackWidth, height: fallbackHeight };
  }

  const preset = PAPER_PRESETS.find((item) => item.value === paperType);
  if (!preset) {
    return { width: fallbackWidth, height: fallbackHeight };
  }

  const portraitWidth = Math.min(preset.width, preset.height);
  const portraitHeight = Math.max(preset.width, preset.height);
  return orientation === 'portrait'
    ? { width: portraitWidth, height: portraitHeight }
    : { width: portraitHeight, height: portraitWidth };
}

export function getReportUnitLabel(unit: ReportUnit): string {
  return unit === 'cm' ? 'Centimeter' : 'Millimeter';
}

export function getReportUnitSymbol(unit: ReportUnit): string {
  return unit === 'cm' ? 'cm' : 'mm';
}

export function formatUnitValue(valueMm: number, unit: ReportUnit): number {
  const converted = unit === 'cm' ? valueMm / 10 : valueMm;
  const digits = unit === 'cm' ? 2 : 1;
  return Number(converted.toFixed(digits));
}

export function parseUnitValue(
  value: number | string | null | undefined,
  unit: ReportUnit,
  fallbackMm: number,
): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallbackMm;
  }

  const mmValue = unit === 'cm' ? numeric * 10 : numeric;
  return Number(mmValue.toFixed(2));
}

export function getUnitStep(unit: ReportUnit, precision: 'default' | 'fine' = 'default'): number {
  if (precision === 'fine') {
    return unit === 'cm' ? 0.01 : 0.1;
  }

  return unit === 'cm' ? 0.1 : 0.5;
}
