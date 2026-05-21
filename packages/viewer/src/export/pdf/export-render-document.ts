import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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
    if (renderPage.backgroundColor) {
      page.drawRectangle({
        x: 0,
        y: 0,
        width: renderPage.width * MM_TO_PT,
        height: renderPage.height * MM_TO_PT,
        color: parsePdfColor(renderPage.backgroundColor),
      });
    }
    for (const band of renderPage.items) {
      for (const component of band.components) {
        await drawRenderComponent(pdfDoc, page, component, renderPage.height, font, boldFont);
      }
    }
  }

  return pdfDoc.save();
}

function parsePdfColor(color: string) {
  if (!color.startsWith('#') || (color.length !== 7 && color.length !== 4)) {
    return rgb(1, 1, 1);
  }

  const normalized = color.length === 4
    ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
    : color;
  const red = Number.parseInt(normalized.slice(1, 3), 16) / 255;
  const green = Number.parseInt(normalized.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(normalized.slice(5, 7), 16) / 255;
  return rgb(red, green, blue);
}
