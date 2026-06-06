import { describe, expect, it } from 'vitest';
import {
  MIN_PRINTABLE_BORDER_WIDTH_MM,
  printableBorderWidthMm,
  printableBorderWidthPt,
  printableBorderWidthPx,
} from '../renderers/border-width';

describe('phase 47 printable border width normalization', () => {
  it('normalizes thin printable borders to the shared minimum width', () => {
    expect(MIN_PRINTABLE_BORDER_WIDTH_MM).toBe(0.3);
    expect(printableBorderWidthMm(0.1)).toBe(0.3);
    expect(printableBorderWidthMm(0.2)).toBe(0.3);
    expect(printableBorderWidthMm(0.6)).toBe(0.6);
  });

  it('uses the same normalized physical width for preview pixels and PDF points', () => {
    expect(printableBorderWidthPx(0.2, 1)).toBeCloseTo(0.3 * 96 / 25.4, 6);
    expect(printableBorderWidthPx(0.2, 2)).toBeCloseTo(0.3 * 96 / 25.4 * 2, 6);
    expect(printableBorderWidthPt(0.2)).toBeCloseTo(0.3 * 72 / 25.4, 6);
  });
});
