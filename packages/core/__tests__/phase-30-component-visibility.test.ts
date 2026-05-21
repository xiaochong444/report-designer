import { describe, expect, it } from 'vitest';
import { renderReport } from '../src';
import { band, makeTemplate } from './phase-2-helpers';
import type { ReportComponent } from '../src';

const textComponent = (overrides: Partial<ReportComponent> & { id: string; text: string }): ReportComponent => ({
  id: overrides.id,
  type: 'text',
  x: 0,
  y: 0,
  width: 40,
  height: 8,
  text: overrides.text,
  font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
  textAlign: 'left',
  verticalAlign: 'top',
  border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
  canGrow: false,
  canShrink: false,
  ...overrides,
} as ReportComponent);

describe('Phase 30 component visibility', () => {
  it('skips components when their visible expression resolves to false', () => {
    const template = makeTemplate([
      band('title', 'reportTitle', {
        components: [
          textComponent({ id: 'shown', text: 'Shown' }),
          textComponent({ id: 'hidden', text: 'Hidden', visible: '{Parameters.ShowHidden}' } as any),
        ],
      }),
    ]);

    const rendered = renderReport(template, {}, { parameters: { ShowHidden: false } });
    const texts = rendered.pages[0].items[0].components.map(component => (component as any).content);

    expect(texts).toEqual(['Shown']);
  });
});
