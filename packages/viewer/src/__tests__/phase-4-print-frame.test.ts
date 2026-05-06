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

  it('keeps print text styling aligned with the DOM preview renderer', () => {
    const html = buildPrintHtml(makeRenderDocument());

    expect(html).toContain('font-family:Arial');
    expect(html).toContain('font-size:14.663px');
    expect(html).toContain('color:#000000');
    expect(html).toContain('background-color:#f5f5f5');
    expect(html).toContain('border-top:0.2mm solid #000000');
    expect(html).toContain('text-align:left');
    expect(html).toContain('white-space:pre-wrap');
    expect(html).toContain('padding:0.529mm');
  });
});
