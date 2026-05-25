import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { PageBorder, PageWatermark, RenderDocument } from '@report-designer/core';
import { drawRenderComponent } from './pdf-draw-component';
import { safePdfText } from './pdf-component-rendering';

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
    if (renderPage.watermark?.showBehind !== false) {
      drawPageWatermark(page, renderPage.width, renderPage.height, renderPage.watermark, font);
    }
    for (const band of renderPage.items) {
      for (const component of band.components) {
        await drawRenderComponent(pdfDoc, page, component, renderPage.height, font, boldFont);
      }
    }
    if (renderPage.watermark?.showBehind === false) {
      drawPageWatermark(page, renderPage.width, renderPage.height, renderPage.watermark, font);
    }
    drawPageBorder(page, renderPage.width, renderPage.height, renderPage.pageBorder);
  }

  return pdfDoc.save();
}

function drawPageWatermark(page: ReturnType<PDFDocument['addPage']>, pageWidthMm: number, pageHeightMm: number, watermark?: PageWatermark, font?: Awaited<ReturnType<PDFDocument['embedFont']>>): void {
  if (!watermark?.enabled || !watermark.text || !font) return;
  const text = safePdfText(watermark.text);
  const fontSize = watermark.fontSize * MM_TO_PT;
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  const textHeight = font.heightAtSize(fontSize, { descender: false });
  const centerX = watermarkTextCenterX(pageWidthMm * MM_TO_PT, textWidth, watermark.horizontalAlign);
  const centerY = watermarkTextCenterY(pageHeightMm * MM_TO_PT, textHeight, watermark.verticalAlign);
  const { x, y } = rotatedWatermarkOrigin(centerX, centerY, textWidth, textHeight, watermark.angle);

  page.drawText(text, {
    x,
    y,
    size: fontSize,
    font,
    color: parsePdfColor(watermark.color),
    opacity: watermark.opacity,
    rotate: degrees(watermark.angle),
  });
}

function drawPageBorder(page: ReturnType<PDFDocument['addPage']>, pageWidthMm: number, pageHeightMm: number, pageBorder?: PageBorder): void {
  if (!pageBorder?.enabled || pageBorder.style === 'none' || pageBorder.width <= 0) return;

  const offset = pageBorder.offset * MM_TO_PT;
  const width = pageWidthMm * MM_TO_PT;
  const height = pageHeightMm * MM_TO_PT;
  const thickness = Math.max(0.5, pageBorder.width * MM_TO_PT);
  const color = parsePdfColor(pageBorder.color);
  const dashArray = pageBorder.style === 'dashed'
    ? [6, 4]
    : pageBorder.style === 'dotted'
      ? [1, 3]
      : undefined;
  if (pageBorder.style === 'double') {
    drawDoublePageBorder(page, width, height, offset, pageBorder.width * MM_TO_PT, color, pageBorder);
    return;
  }
  const insets = [offset];

  for (const inset of insets) {
    if (inset < 0 || inset * 2 > width || inset * 2 > height) continue;
    if (pageBorder.sides.top) {
      page.drawLine({ start: { x: inset, y: height - inset }, end: { x: width - inset, y: height - inset }, thickness, color, dashArray });
    }
    if (pageBorder.sides.right) {
      page.drawLine({ start: { x: width - inset, y: height - inset }, end: { x: width - inset, y: inset }, thickness, color, dashArray });
    }
    if (pageBorder.sides.bottom) {
      page.drawLine({ start: { x: inset, y: inset }, end: { x: width - inset, y: inset }, thickness, color, dashArray });
    }
    if (pageBorder.sides.left) {
      page.drawLine({ start: { x: inset, y: height - inset }, end: { x: inset, y: inset }, thickness, color, dashArray });
    }
  }
}

function drawDoublePageBorder(
  page: ReturnType<PDFDocument['addPage']>,
  width: number,
  height: number,
  offset: number,
  totalThickness: number,
  color: ReturnType<typeof parsePdfColor>,
  pageBorder: PageBorder,
): void {
  if (totalThickness <= 0) return;
  const lineThickness = totalThickness / 3;
  const outerInset = offset + lineThickness / 2;
  const innerInset = offset + totalThickness - lineThickness / 2;
  const insets = [outerInset, innerInset];

  for (const inset of insets) {
    if (inset < 0 || inset * 2 > width || inset * 2 > height) continue;
    if (pageBorder.sides.top) {
      page.drawLine({ start: { x: inset, y: height - inset }, end: { x: width - inset, y: height - inset }, thickness: lineThickness, color });
    }
    if (pageBorder.sides.right) {
      page.drawLine({ start: { x: width - inset, y: height - inset }, end: { x: width - inset, y: inset }, thickness: lineThickness, color });
    }
    if (pageBorder.sides.bottom) {
      page.drawLine({ start: { x: inset, y: inset }, end: { x: width - inset, y: inset }, thickness: lineThickness, color });
    }
    if (pageBorder.sides.left) {
      page.drawLine({ start: { x: inset, y: height - inset }, end: { x: inset, y: inset }, thickness: lineThickness, color });
    }
  }
}

function rotatedWatermarkOrigin(centerX: number, centerY: number, textWidth: number, textHeight: number, angleDegrees: number): { x: number; y: number } {
  const angle = angleDegrees * Math.PI / 180;
  const halfWidth = textWidth / 2;
  const halfHeight = textHeight / 2;
  return {
    x: centerX - (Math.cos(angle) * halfWidth - Math.sin(angle) * halfHeight),
    y: centerY - (Math.sin(angle) * halfWidth + Math.cos(angle) * halfHeight),
  };
}

function watermarkTextCenterX(pageWidth: number, textWidth: number, align: PageWatermark['horizontalAlign']): number {
  if (align === 'center') return pageWidth / 2;
  if (align === 'right') return pageWidth - textWidth / 2;
  return textWidth / 2;
}

function watermarkTextCenterY(pageHeight: number, textHeight: number, align: PageWatermark['verticalAlign']): number {
  if (align === 'middle') return pageHeight / 2;
  if (align === 'bottom') return textHeight / 2;
  return pageHeight - textHeight / 2;
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
