import type { RenderDocument } from '@report-designer/core';
import { exportRenderDocumentToPDF, type PdfExportOptions } from './pdf/export-render-document';
import { printRenderDocument } from '../print/print-frame';
import { printRenderDocumentWithChromeExtension, type ChromeExtensionPrintOptions } from '../print/chrome-extension-print';

export { exportRenderDocumentToPDF } from './pdf/export-render-document';
export type { PdfExportOptions } from './pdf/export-render-document';
export { buildPrintHtml, printRenderDocument } from '../print/print-frame';
export { buildChromePrintRequest, printRenderDocumentWithChromeExtension, sendChromePrintRequest } from '../print/chrome-extension-print';
export type { ChromeExtensionPrintOptions, ChromePrintBackend, ChromePrintRequest, ChromePrintResponse, ChromePrintTransport } from '../print/chrome-extension-print';

/** Export a RenderDocument report to PDF. Chinese text requires fontBytes or fontBytesByFamily. */
export async function exportToPDF(
  document: RenderDocument,
  options: PdfExportOptions = {},
): Promise<Uint8Array> {
  return exportRenderDocumentToPDF(document, options);
}

export interface PrintReportOptions {
  adapter?: 'browser' | 'chrome-extension';
  chromeExtension?: ChromeExtensionPrintOptions;
}

/** Trigger browser print dialog or send a PDF job to the Chrome print extension bridge */
export async function printReport(document?: RenderDocument, options: PrintReportOptions = {}): Promise<void> {
  if (document) {
    if (options.adapter === 'chrome-extension') {
      await printRenderDocumentWithChromeExtension(document, options.chromeExtension);
      return;
    }
    await printRenderDocument(document);
    return;
  }
  window.print();
}

/** Download PDF file */
export async function downloadPDF(pdfBytes: Uint8Array, filename: string): Promise<void> {
  const arrayBuffer = new ArrayBuffer(pdfBytes.byteLength);
  new Uint8Array(arrayBuffer).set(pdfBytes);
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
