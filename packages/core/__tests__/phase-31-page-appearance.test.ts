import { describe, expect, it } from 'vitest';
import { createDefaultTemplate, renderReport } from '../src';

describe('Phase 31 page appearance', () => {
  it('carries page background color into the render document', () => {
    const template = createDefaultTemplate('Page background');
    template.pages[0].backgroundColor = '#fff7e6';

    const document = renderReport(template, {});

    expect(document.pages[0].backgroundColor).toBe('#fff7e6');
  });
});
