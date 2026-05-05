import { describe, expect, it } from 'vitest';
import { buildPrintHtml } from '../print/print-frame';
import { makeRenderDocument } from './phase-4-helpers';

describe('Phase 4 print frame', () => {
  it('builds static printable HTML with A4 page rules and one div per page', () => {
    const html = buildPrintHtml(makeRenderDocument());

    expect(html).toContain('@page { size: 210mm 297mm; margin: 0; }');
    expect(html).toContain('class="rd-print-page"');
    expect(html.match(/class="rd-print-page"/g)).toHaveLength(1);
  });
});
