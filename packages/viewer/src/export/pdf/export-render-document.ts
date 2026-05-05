import { PDFDocument, StandardFonts } from 'pdf-lib';
import type { RenderDocument } from '@report-designer/core';
import { drawRenderComponent } from './pdf-draw-component';

const MM_TO_PT = 72 / 25.4;

export interface PdfExportOptions {
  fontBytes?: Uint8Array;
  fallbackFontName?: string;
}

export async function exportRenderDocumentToPDF(
  document: RenderDocument,
  options: PdfExportOptions = {},
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = options.fontBytes
    ? await pdfDoc.embedFont(options.fontBytes)
    : await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = options.fontBytes
    ? font
    : await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const renderPage of document.pages) {
    const page = pdfDoc.addPage([renderPage.width * MM_TO_PT, renderPage.height * MM_TO_PT]);
    for (const band of renderPage.items) {
      for (const component of band.components) {
        drawRenderComponent(page, component, renderPage.height, font, boldFont);
      }
    }
  }

  return pdfDoc.save();
}
