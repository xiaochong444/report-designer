import { describe, expect, it, vi } from 'vitest';
import {
  buildChromePrintRequest,
  sendChromePrintRequest,
  type ChromePrintResponse,
} from '../print/chrome-extension-print';

describe('phase 42 chrome extension print bridge', () => {
  it('builds a PDF print request with printer, copies, silent flag, and offset metadata', () => {
    const request = buildChromePrintRequest(new Uint8Array([37, 80, 68, 70]), {
      requestId: 'job-1',
      jobName: 'Warehouse Order',
      printerId: 'printer-01',
      copies: 2,
      silent: true,
      backend: 'chromePrinting',
      offset: { xMm: 1.5, yMm: -0.8 },
    });

    expect(request).toMatchObject({
      channel: 'report-designer.chrome-print',
      direction: 'page-to-extension',
      requestId: 'job-1',
      command: 'printPdf',
      payload: {
        format: 'pdf',
        pdfBase64: 'JVBERg==',
        jobName: 'Warehouse Order',
        printerId: 'printer-01',
        copies: 2,
        silent: true,
        backend: 'chromePrinting',
        offset: { xMm: 1.5, yMm: -0.8 },
      },
    });
  });

  it('uses the Chrome printing backend by default', () => {
    const request = buildChromePrintRequest(new Uint8Array([37, 80, 68, 70]), {
      requestId: 'job-default',
    });

    expect(request.payload.backend).toBe('chromePrinting');
  });

  it('posts the request and resolves the matching extension response', async () => {
    const request = buildChromePrintRequest(new Uint8Array([1]), { requestId: 'job-2' });
    const postMessage = vi.spyOn(window, 'postMessage').mockImplementation((message: unknown) => {
      const response: ChromePrintResponse = {
        channel: 'report-designer.chrome-print',
        direction: 'extension-to-page',
        requestId: (message as any).requestId,
        ok: true,
        result: { backend: 'chromePrinting', jobId: 'chrome-job-1' },
      };
      setTimeout(() => window.dispatchEvent(new MessageEvent('message', { data: response, source: window })), 0);
    });

    const result = await sendChromePrintRequest(request, { windowRef: window, timeoutMs: 100 });

    expect(postMessage).toHaveBeenCalledWith(request, '*');
    expect(result).toMatchObject({ ok: true, result: { backend: 'chromePrinting', jobId: 'chrome-job-1' } });
    postMessage.mockRestore();
  });

  it('rejects extension error responses with a readable message', async () => {
    const request = buildChromePrintRequest(new Uint8Array([1]), { requestId: 'job-3' });
    const postMessage = vi.spyOn(window, 'postMessage').mockImplementation((message: unknown) => {
      const response: ChromePrintResponse = {
        channel: 'report-designer.chrome-print',
        direction: 'extension-to-page',
        requestId: (message as any).requestId,
        ok: false,
        error: 'Printer is offline',
      };
      setTimeout(() => window.dispatchEvent(new MessageEvent('message', { data: response, source: window })), 0);
    });

    await expect(sendChromePrintRequest(request, { windowRef: window, timeoutMs: 100 }))
      .rejects.toThrow('Printer is offline');
    postMessage.mockRestore();
  });
});
