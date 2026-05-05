import type { RenderDocument } from '@report-designer/core';
import { exportRenderDocumentToPDF, type PdfExportOptions } from './pdf/export-render-document';
import { printRenderDocument } from '../print/print-frame';

export { exportRenderDocumentToPDF } from './pdf/export-render-document';
export type { PdfExportOptions } from './pdf/export-render-document';
export { buildPrintHtml, printRenderDocument } from '../print/print-frame';

/** Export a RenderDocument report to PDF. Chinese text requires fontBytes. */
export async function exportToPDF(
  document: RenderDocument,
  options: PdfExportOptions = {},
): Promise<Uint8Array> {
  return exportRenderDocumentToPDF(document, options);
}

/** Trigger browser print dialog */
export async function printReport(document?: RenderDocument): Promise<void> {
  if (document) {
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
