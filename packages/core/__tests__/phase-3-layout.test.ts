import { describe, expect, it } from 'vitest';
import { measureTextBox, renderReport } from '../src';
import { makeTemplate } from './phase-2-helpers';
import { textComponent } from './render-helpers';

describe('Phase 3 layout', () => {
  it('returns a RenderDocument with page metadata and millimeter coordinates', () => {
    const template = makeTemplate([]);

    const document = renderReport(template, {});

    expect(document.pages).toEqual([
      {
        id: 'page-1-1',
        pageNumber: 1,
        totalPages: 1,
        width: 210,
        height: 297,
        items: [],
      },
    ]);
  });

  it('measures text canGrow, canShrink, and overflow deterministically', () => {
    const base = textComponent({ width: 40, height: 8, fontSize: 10 });

    const grown = measureTextBox(base, 'This is a long line that should wrap into multiple deterministic lines.');
    expect(grown.height).toBeGreaterThan(8);
    expect(grown.overflow).toBe(false);

    const shrunk = measureTextBox({ ...base, canGrow: false, canShrink: true, height: 20 }, 'Short');
    expect(shrunk.height).toBeLessThan(20);

    const clipped = measureTextBox({ ...base, canGrow: false, canShrink: false }, 'This is a long line that cannot grow.');
    expect(clipped.height).toBe(8);
    expect(clipped.overflow).toBe(true);
  });
});
