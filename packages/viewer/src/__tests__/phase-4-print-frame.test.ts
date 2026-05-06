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

  it('renders component coordinates relative to their containing band', () => {
    const html = buildPrintHtml(makeRenderDocument());

    expect(html).toContain('class="rd-print-band" style="left:20mm;top:20mm;width:170mm;height:20mm;"');
    expect(html).toContain('class="rd-print-component');
    expect(html).toContain('left:5mm;top:5mm');
    expect(html).not.toContain('left:25mm;top:25mm');
  });

  it('applies centered print text alignment to a full-width text content box', () => {
    const document = makeRenderDocument();
    const component = document.pages[0].items[0].components[0];
    if (component.type === 'text') {
      component.content = 'Centered Print Title';
      component.style = {
        ...component.style,
        textAlign: 'center',
      };
    }

    const html = buildPrintHtml(document);

    expect(html).toContain('class="rd-print-text-content"');
    expect(html).toContain('style="width:100%;text-align:center;white-space:inherit;"');
    expect(html).toContain('Centered Print Title');
  });
});
