import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PaginatedPage, PaginatedComponent } from '@report-designer/core';

/** Convert mm to PDF points (1 pt = 1/72 inch, 1 mm = 72/25.4 pt) */
const MM_TO_PT = 72 / 25.4;

interface ExportOptions {
  pageSize?: string;
}

/** Export paginated report to PDF */
export async function exportToPDF(
  pages: PaginatedPage[],
  options: ExportOptions = {},
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const page of pages) {
    // Determine page size from template dimensions
    const width = page.width * MM_TO_PT;
    const height = page.height * MM_TO_PT;

    const pdfPage = pdfDoc.addPage([width, height]);
    const { drawBand, drawComponent, drawText } = createDrawHelpers(pdfPage, font, boldFont);

    for (const band of page.bands) {
      // Draw components within the band
      for (const comp of band.components) {
        drawComponent(comp, height);
      }
    }
  }

  return pdfDoc.save();
}

function createDrawHelpers(
  pdfPage: import('pdf-lib').PDFPage,
  font: import('pdf-lib').PDFFont,
  boldFont: import('pdf-lib').PDFFont,
) {
  const { width, height } = pdfPage.getSize();

  function drawText(
    text: string,
    x: number,
    y: number,
    fontSize: number,
    isBold: boolean,
    color: ReturnType<typeof rgb> = rgb(0, 0, 0),
    align: 'left' | 'center' | 'right' = 'left',
  ) {
    const f = isBold ? boldFont : font;
    const sizePt = fontSize * (72 / 25.4); // mm to pt
    const textWidth = f.widthOfTextAtSize(text, sizePt);
    let xPos = x * MM_TO_PT;
    if (align === 'center') xPos -= textWidth / 2;
    if (align === 'right') xPos -= textWidth;

    const yPos = (height - y * MM_TO_PT) - sizePt;

    pdfPage.drawText(text, {
      x: xPos,
      y: yPos,
      size: sizePt,
      font: f,
      color,
    });
  }

  function drawComponent(comp: PaginatedComponent, pageHeight: number) {
    const x = comp.absoluteX * MM_TO_PT;
    const y = (pageHeight - comp.absoluteY * MM_TO_PT) - comp.height * MM_TO_PT;
    const w = comp.width * MM_TO_PT;
    const h = comp.height * MM_TO_PT;

    // Draw border if any
    if (comp.content) {
      drawText(
        comp.content,
        comp.absoluteX,
        comp.absoluteY,
        10, // default font size in mm
        false,
        rgb(0, 0, 0),
        'left',
      );
    }
  }

  function drawBand(
    x: number,
    y: number,
    w: number,
    h: number,
    bgColor?: string,
  ) {
    if (bgColor) {
      const c = hexToRgb(bgColor);
      pdfPage.drawRectangle({
        x: x * MM_TO_PT,
        y: (height - y * MM_TO_PT) - h * MM_TO_PT,
        width: w * MM_TO_PT,
        height: h * MM_TO_PT,
        color: rgb(c.r / 255, c.g / 255, c.b / 255),
      });
    }
  }

  return { drawText, drawComponent, drawBand };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/** Trigger browser print dialog */
export function printReport(): void {
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
