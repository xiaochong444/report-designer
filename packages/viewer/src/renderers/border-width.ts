export const MIN_PRINTABLE_BORDER_WIDTH_MM = 0.3;
export const MM_TO_PX = 96 / 25.4;
export const MM_TO_PT = 72 / 25.4;

export function printableBorderWidthMm(widthMm: number): number {
  if (!Number.isFinite(widthMm) || widthMm <= 0) return 0;
  return Math.max(MIN_PRINTABLE_BORDER_WIDTH_MM, widthMm);
}

export function printableBorderWidthPx(widthMm: number, scale: number): number {
  return printableBorderWidthMm(widthMm) * MM_TO_PX * scale;
}

export function printableBorderWidthPt(widthMm: number): number {
  return printableBorderWidthMm(widthMm) * MM_TO_PT;
}
