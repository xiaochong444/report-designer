import { type PDFDocument, type PDFPage, type PDFFont } from 'pdf-lib';
import type { RenderBarcode, RenderCheckbox, RenderComponentBox, RenderImage, RenderLine, RenderRichText, RenderShape, RenderText } from '@report-designer/core';
import { barcodePattern, dataUrlMimeType, dataUrlToUint8Array, MM_TO_PT, parsePdfColor, safePdfText, stripHtmlToPdfText } from './pdf-component-rendering';

export async function drawRenderComponent(
  pdfDoc: PDFDocument,
  page: PDFPage,
  component: RenderComponentBox,
  pageHeightMm: number,
  font: PDFFont,
  boldFont: PDFFont,
): Promise<void> {
  const x = component.x * MM_TO_PT;
  const y = (pageHeightMm - component.y - component.height) * MM_TO_PT;
  const width = component.width * MM_TO_PT;
  const height = component.height * MM_TO_PT;
  const backgroundColor = component.style?.backgroundColor;
  const border = component.style?.border;

  if (backgroundColor) {
    page.drawRectangle({ x, y, width, height, color: parsePdfColor(backgroundColor) });
  }

  if (border && border.style !== 'none' && border.width > 0) {
    page.drawRectangle({
      x,
      y,
      width,
      height,
      borderColor: parsePdfColor(border.color),
      borderWidth: Math.max(0.5, border.width * MM_TO_PT),
    });
  }

  if ((component.type === 'panel' || component.type === 'subreport') && 'children' in component) {
    for (const child of component.children) {
      await drawRenderComponent(pdfDoc, page, child, pageHeightMm, font, boldFont);
    }
    return;
  }

  if (component.type === 'text' && 'content' in component) {
    drawText(page, component as RenderText, x, y, width, height, font, boldFont);
    return;
  }

  if (component.type === 'line') {
    drawLine(page, component as RenderLine, x, y, width, height);
    return;
  }

  if (component.type === 'shape') {
    drawShape(page, component as RenderShape, x, y, width, height);
    return;
  }

  if (component.type === 'image' && 'src' in component) {
    await drawImage(pdfDoc, page, component as RenderImage, x, y, width, height);
    return;
  }

  if (component.type === 'richtext' && 'html' in component) {
    const richtext = component as RenderRichText;
    page.drawText(safePdfText(stripHtmlToPdfText(richtext.html)), {
      x: x + 2,
      y: y + height - 12,
      size: richtext.style?.font?.size ?? 10,
      font: richtext.style?.font?.bold ? boldFont : font,
      color: parsePdfColor(richtext.style?.font?.color ?? '#000000'),
      maxWidth: Math.max(1, width - 4),
    });
    return;
  }

  if (component.type === 'barcode' && 'value' in component) {
    drawBarcode(page, component as RenderBarcode, x, y, width, height, font, boldFont);
    return;
  }

  if (component.type === 'checkbox' && 'checked' in component) {
    drawCheckbox(page, component as RenderCheckbox, x, y, width, height, font, boldFont);
  }
}

function drawText(page: PDFPage, text: RenderText, x: number, y: number, width: number, height: number, font: PDFFont, boldFont: PDFFont): void {
  const fontSize = text.style?.font?.size ?? 10;
  const pdfFont = text.style?.font?.bold ? boldFont : font;
  page.drawText(safePdfText(text.content), {
    x: x + 2,
    y: y + height - fontSize - 2,
    size: fontSize,
    font: pdfFont,
    color: parsePdfColor(text.style?.font?.color ?? '#000000'),
    maxWidth: Math.max(1, width - 4),
  });
}

function drawLine(page: PDFPage, line: RenderLine, x: number, y: number, width: number, height: number): void {
  page.drawLine({
    start: { x: x + (line.startX ?? 0) * MM_TO_PT, y: y + height - (line.startY ?? line.height / 2) * MM_TO_PT },
    end: { x: x + (line.endX ?? line.width) * MM_TO_PT, y: y + height - (line.endY ?? line.height / 2) * MM_TO_PT },
    thickness: Math.max(0.5, (line.lineWidth ?? 0.2) * MM_TO_PT),
    color: parsePdfColor(line.lineColor ?? '#000000'),
    dashArray: line.lineStyle === 'dashed' ? [6, 4] : line.lineStyle === 'dotted' ? [1, 3] : undefined,
  });
}

function drawShape(page: PDFPage, shape: RenderShape, x: number, y: number, width: number, height: number): void {
  const borderWidth = Math.max(0.5, (shape.borderWidth ?? 0.2) * MM_TO_PT);
  const borderDashArray = pdfBorderDashArray(shape.borderStyle);
  const options = {
    color: pdfFillColor(shape.fillColor),
    borderColor: parsePdfColor(shape.borderColor ?? '#000000'),
    borderWidth,
    borderDashArray,
  };
  if (shape.shapeType === 'ellipse') {
    page.drawEllipse({ x: x + width / 2, y: y + height / 2, xScale: width / 2, yScale: height / 2, ...options });
    return;
  }
  if (shape.shapeType === 'triangle') {
    page.drawSvgPath(trianglePath(width, height), { x, y, ...options });
    return;
  }
  if (shape.shapeType === 'roundRect') {
    page.drawSvgPath(roundRectPath(width, height, Math.min(width, height) * 0.15), { x, y, ...options });
    return;
  }
  page.drawRectangle({ x, y, width, height, ...options });
}

function pdfFillColor(color?: string) {
  if (!color || color.toLowerCase() === 'transparent') return undefined;
  return parsePdfColor(color);
}

function pdfBorderDashArray(style?: string): number[] | undefined {
  if (style === 'dashed') return [6, 4];
  if (style === 'dotted') return [1, 3];
  return undefined;
}

function trianglePath(width: number, height: number): string {
  return `M ${width / 2} ${height} L ${width} 0 L 0 0 Z`;
}

function roundRectPath(width: number, height: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  return [
    `M ${r} 0`,
    `L ${width - r} 0`,
    `C ${width} 0 ${width} 0 ${width} ${r}`,
    `L ${width} ${height - r}`,
    `C ${width} ${height} ${width} ${height} ${width - r} ${height}`,
    `L ${r} ${height}`,
    `C 0 ${height} 0 ${height} 0 ${height - r}`,
    `L 0 ${r}`,
    `C 0 0 0 0 ${r} 0`,
    'Z',
  ].join(' ');
}

async function drawImage(pdfDoc: PDFDocument, page: PDFPage, image: RenderImage, x: number, y: number, width: number, height: number): Promise<void> {
  const mimeType = dataUrlMimeType(image.src);
  const bytes = dataUrlToUint8Array(image.src);
  if (bytes.byteLength === 0) return;

  try {
    const embeddedImage = mimeType === 'image/jpeg' || mimeType === 'image/jpg'
      ? await pdfDoc.embedJpg(bytes)
      : await pdfDoc.embedPng(bytes);
    page.drawImage(embeddedImage, { x, y, width, height });
  } catch {
    page.drawRectangle({ x, y, width, height, borderColor: parsePdfColor('#999999'), borderWidth: 0.5 });
  }
}

function drawBarcode(page: PDFPage, barcode: RenderBarcode, x: number, y: number, width: number, height: number, font: PDFFont, boldFont: PDFFont): void {
  const fontSize = barcode.font?.size ?? 8;
  const textHeight = barcode.showText ? fontSize + 2 : 0;
  const barHeight = Math.max(1, height - textHeight);
  const pattern = barcodePattern(barcode.value);
  const barWidth = width / pattern.length;
  const foregroundColor = barcode.foregroundColor ?? '#000000';
  const textColor = barcode.font?.color ?? foregroundColor;
  pattern.forEach((filled, index) => {
    if (filled) {
      page.drawRectangle({ x: x + index * barWidth, y: y + textHeight, width: Math.max(0.5, barWidth), height: barHeight, color: parsePdfColor(foregroundColor) });
    }
  });
  if (barcode.showText) {
    page.drawText(safePdfText(barcode.value), { x, y: y + 1, size: fontSize, font: barcode.font?.bold ? boldFont : font, maxWidth: width, color: parsePdfColor(textColor) });
  }
}

function drawCheckbox(page: PDFPage, checkbox: RenderCheckbox, x: number, y: number, width: number, height: number, font: PDFFont, boldFont: PDFFont): void {
  const boxSize = Math.min(height, 12);
  const foregroundColor = checkbox.foregroundColor ?? '#333333';
  const labelColor = checkbox.font?.color ?? foregroundColor;
  page.drawRectangle({ x, y: y + height - boxSize, width: boxSize, height: boxSize, borderColor: parsePdfColor(foregroundColor), borderWidth: 1 });
  if (checkbox.checked) {
    page.drawLine({ start: { x: x + 2, y: y + height - boxSize / 2 }, end: { x: x + boxSize / 2, y: y + height - boxSize + 2 }, thickness: 1, color: parsePdfColor(foregroundColor) });
    page.drawLine({ start: { x: x + boxSize / 2, y: y + height - boxSize + 2 }, end: { x: x + boxSize - 2, y: y + height - 2 }, thickness: 1, color: parsePdfColor(foregroundColor) });
  }
  if (checkbox.label) {
    const fontSize = checkbox.font?.size ?? 10;
    page.drawText(safePdfText(checkbox.label), { x: x + boxSize + 4, y: y + height - boxSize + 2, size: fontSize, font: checkbox.font?.bold ? boldFont : font, maxWidth: Math.max(1, width - boxSize - 4), color: parsePdfColor(labelColor) });
  }
}
