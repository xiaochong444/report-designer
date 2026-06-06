/* @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { printRenderDocument } from '../print/print-frame';
import { makeRenderDocument } from './phase-4-helpers';

describe('Phase 4 browser print frame DOM rendering', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('prints the same RenderDocumentView DOM used by preview before removing the iframe', async () => {
    let iframeAtPrint: HTMLIFrameElement | undefined;
    let hasDocumentViewAtPrint = false;
    let hasPageViewAtPrint = false;
    let bodyTextAtPrint = '';
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(function appendChild(node: Node) {
      const appended = HTMLElement.prototype.appendChild.call(this, node) as Node;
      if (node instanceof HTMLIFrameElement && node.contentWindow) {
        const iframe = node;
        iframe.contentWindow.focus = vi.fn();
        iframe.contentWindow.print = vi.fn(() => {
          iframeAtPrint = iframe;
          hasDocumentViewAtPrint = Boolean(iframe.contentDocument?.querySelector('[data-testid="render-document"]'));
          hasPageViewAtPrint = Boolean(iframe.contentDocument?.querySelector('[data-testid="render-document-page"]'));
          bodyTextAtPrint = iframe.contentDocument?.body.textContent ?? '';
          iframe.contentWindow?.dispatchEvent(new Event('afterprint'));
        });
      }
      return appended;
    });

    await printRenderDocument(makeRenderDocument());

    expect(appendSpy).toHaveBeenCalled();
    expect(parseFloat(iframeAtPrint?.style.width ?? '0')).toBeGreaterThan(0);
    expect(parseFloat(iframeAtPrint?.style.height ?? '0')).toBeGreaterThan(0);
    expect(hasDocumentViewAtPrint).toBe(true);
    expect(hasPageViewAtPrint).toBe(true);
    expect(bodyTextAtPrint).toContain('Hello PDF');
    expect(document.body.querySelector('iframe')).toBeNull();
  });
});
