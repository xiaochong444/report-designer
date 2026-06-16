import type { RenderDocument } from '@report-designer/core';
import { exportRenderDocumentToPDF, type PdfExportOptions } from '../export/pdf/export-render-document';

const CHROME_PRINT_CHANNEL = 'report-designer.chrome-print' as const;
const DEFAULT_TIMEOUT_MS = 15000;

export interface ChromePrintOffset {
  xMm?: number;
  yMm?: number;
}

export type ChromePrintBackend = 'chromePrinting';

export interface ChromePrintRequest {
  channel: typeof CHROME_PRINT_CHANNEL;
  direction: 'page-to-extension';
  requestId: string;
  command: 'printPdf';
  payload: {
    format: 'pdf';
    pdfBase64: string;
    jobName?: string;
    printerId?: string;
    copies?: number;
    silent?: boolean;
    backend?: ChromePrintBackend;
    offset?: ChromePrintOffset;
  };
}

export interface ChromePrintResponse {
  channel: typeof CHROME_PRINT_CHANNEL;
  direction: 'extension-to-page';
  requestId: string;
  ok: boolean;
  result?: unknown;
  error?: string;
}

export interface ChromeExtensionPrintOptions {
  requestId?: string;
  jobName?: string;
  printerId?: string;
  copies?: number;
  silent?: boolean;
  backend?: ChromePrintBackend;
  offset?: ChromePrintOffset;
  timeoutMs?: number;
  pdfOptions?: PdfExportOptions;
  windowRef?: Window;
}

export interface ChromePrintTransport {
  send(request: ChromePrintRequest): Promise<ChromePrintResponse>;
}

export function buildChromePrintRequest(pdfBytes: Uint8Array, options: ChromeExtensionPrintOptions = {}): ChromePrintRequest {
  return {
    channel: CHROME_PRINT_CHANNEL,
    direction: 'page-to-extension',
    requestId: options.requestId ?? createRequestId(),
    command: 'printPdf',
    payload: {
      format: 'pdf',
      pdfBase64: bytesToBase64(pdfBytes),
      jobName: options.jobName,
      printerId: options.printerId,
      copies: options.copies,
      silent: options.silent,
      backend: options.backend ?? 'chromePrinting',
      offset: options.offset,
    },
  };
}

export async function printRenderDocumentWithChromeExtension(
  document: RenderDocument,
  options: ChromeExtensionPrintOptions = {},
  transport?: ChromePrintTransport,
): Promise<ChromePrintResponse> {
  const pdfBytes = await exportRenderDocumentToPDF(document, options.pdfOptions ?? {});
  const request = buildChromePrintRequest(pdfBytes, options);
  return transport
    ? transport.send(request)
    : sendChromePrintRequest(request, { timeoutMs: options.timeoutMs, windowRef: options.windowRef });
}

export function sendChromePrintRequest(
  request: ChromePrintRequest,
  options: { timeoutMs?: number; windowRef?: Window } = {},
): Promise<ChromePrintResponse> {
  const windowRef = options.windowRef ?? window;
  return new Promise((resolve, reject) => {
    const timeout = windowRef.setTimeout(() => {
      cleanup();
      reject(new Error('Chrome extension print request timed out'));
    }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

    const cleanup = () => {
      windowRef.clearTimeout(timeout);
      windowRef.removeEventListener('message', handleMessage);
    };

    const handleMessage = (event: MessageEvent<ChromePrintResponse>) => {
      const response = event.data;
      if (!response || response.channel !== CHROME_PRINT_CHANNEL || response.direction !== 'extension-to-page' || response.requestId !== request.requestId) {
        return;
      }
      cleanup();
      if (response.ok) {
        resolve(response);
        return;
      }
      reject(new Error(response.error || 'Chrome extension print failed'));
    };

    windowRef.addEventListener('message', handleMessage);
    windowRef.postMessage(request, '*');
  });
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  if (typeof btoa === 'function') {
    return btoa(binary);
  }

  const nodeBuffer = (globalThis as { Buffer?: { from: (value: string, encoding: string) => { toString: (encoding: string) => string } } }).Buffer;
  if (nodeBuffer) {
    return nodeBuffer.from(binary, 'binary').toString('base64');
  }

  throw new Error('No base64 encoder is available in this environment');
}

function createRequestId(): string {
  return `chrome-print-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
