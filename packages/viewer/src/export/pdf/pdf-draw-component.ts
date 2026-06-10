import { type PDFDocument, type PDFPage, type PDFFont } from 'pdf-lib';
import type { BorderConfig, Padding, RenderBarcode, RenderChart, RenderCheckbox, RenderComponentBox, RenderImage, RenderLine, RenderQRCode, RenderRichText, RenderShape, RenderTable, RenderTableCell, RenderText } from '@report-designer/core';
import { dataUrlMimeType, dataUrlToUint8Array, MM_TO_PT, parsePdfColor, safePdfText, stripHtmlToPdfText } from './pdf-component-rendering';
import { printableBorderWidthPt } from '../../renderers/border-width';
import { flipSvgPathY, parseCodeSymbolGeometry, renderCodeSymbolSvg, type CodeSymbolType } from '../../code-symbols';

export interface PdfFontSet {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
  families?: Map<string, Partial<PdfFontVariants>>;
}

export type PdfFontVariants = Pick<PdfFontSet, 'regular' | 'bold' | 'italic' | 'boldItalic'>;

type PdfFontStyle = {
  family?: string;
  bold?: boolean;
  italic?: boolean;
};

type DrawPdfTextOptions = {
  x: number;
  y: number;
  size: number;
  font: PDFFont;
  color: ReturnType<typeof parsePdfColor>;
  colorCss: string;
  maxWidth: number;
  family?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
};

type DrawPdfTextBoxOptions = Omit<DrawPdfTextOptions, 'x' | 'y' | 'maxWidth'> & {
  x: number;
  y: number;
  width: number;
  height: number;
  padding: Padding;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  wrap?: boolean;
};

type PdfTextLineLayout = {
  text: string;
  width: number;
};

type DrawnPdfTextLine = PdfTextLineLayout & {
  x: number;
  y: number;
};

export async function drawRenderComponent(
  pdfDoc: PDFDocument,
  page: PDFPage,
  component: RenderComponentBox,
  pageHeightMm: number,
  fonts: PdfFontSet,
): Promise<void> {
  const x = component.x * MM_TO_PT;
  const y = (pageHeightMm - component.y - component.height) * MM_TO_PT;
  const width = component.width * MM_TO_PT;
  const height = component.height * MM_TO_PT;
  const backgroundColor = component.style?.backgroundColor;
  const border = component.type === 'table' ? undefined : component.style?.border;

  if (backgroundColor && backgroundColor.toLowerCase() !== 'transparent') {
    page.drawRectangle({ x, y, width, height, color: parsePdfColor(backgroundColor) });
  }

  if (border && border.style !== 'none' && border.width > 0) {
    drawComponentBorder(page, border, x, y, width, height);
  }

  if ((component.type === 'panel' || component.type === 'subreport') && 'children' in component) {
    for (const child of component.children) {
      await drawRenderComponent(pdfDoc, page, child, pageHeightMm, fonts);
    }
    return;
  }

  if (component.type === 'text' && 'content' in component) {
    await drawText(pdfDoc, page, component as RenderText, x, y, width, height, fonts);
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

  if (component.type === 'chart') {
    const chart = component as RenderChart;
    if (chart.imageDataUrl) {
      await drawImage(pdfDoc, page, { ...chart, type: 'image', src: chart.imageDataUrl, fitMode: 'contain' }, x, y, width, height);
      return;
    }
    page.drawRectangle({ x, y, width, height, borderColor: parsePdfColor('#d9d9d9'), borderWidth: 0.5 });
    await drawPdfText(pdfDoc, page, chart.emptyMessage ?? 'No data', {
      x: x + 4,
      y: y + height / 2,
      size: 10,
      font: fonts.regular,
      color: parsePdfColor('#8c8c8c'),
      colorCss: '#8c8c8c',
      maxWidth: Math.max(1, width - 8),
    });
    return;
  }

  if (component.type === 'richtext' && 'html' in component) {
    const richtext = component as RenderRichText;
    const pdfFont = selectPdfFont(fonts, richtext.style?.font);
    await drawPdfText(pdfDoc, page, stripHtmlToPdfText(richtext.html), {
      x: x + 2,
      y: y + height - 12,
      size: richtext.style?.font?.size ?? 10,
      font: pdfFont,
      color: parsePdfColor(richtext.style?.font?.color ?? '#000000'),
      colorCss: richtext.style?.font?.color ?? '#000000',
      maxWidth: Math.max(1, width - 4),
      family: richtext.style?.font?.family,
      bold: richtext.style?.font?.bold,
      italic: richtext.style?.font?.italic,
    });
    return;
  }

  if (component.type === 'barcode' && 'value' in component) {
    await drawBarcode(pdfDoc, page, component as RenderBarcode, x, y, width, height, fonts);
    return;
  }

  if (component.type === 'qrcode' && 'value' in component) {
    drawCodeSymbol(page, component as RenderQRCode, 'qrcode', x, y, width, height);
    return;
  }

  if (component.type === 'checkbox' && 'checked' in component) {
    await drawCheckbox(pdfDoc, page, component as RenderCheckbox, x, y, width, height, fonts);
    return;
  }

  if (component.type === 'table' && 'rows' in component && 'columns' in component) {
    await drawTable(pdfDoc, page, component as RenderTable, x, y, height, fonts);
  }
}

function selectPdfFont(fonts: PdfFontSet, style?: PdfFontStyle): PDFFont {
  const familyFonts = style?.family ? fonts.families?.get(normalizeFontFamilyKey(style.family)) : undefined;
  if (style?.bold && style.italic) return familyFonts?.boldItalic ?? familyFonts?.bold ?? familyFonts?.italic ?? familyFonts?.regular ?? fonts.boldItalic;
  if (style?.bold) return familyFonts?.bold ?? familyFonts?.regular ?? fonts.bold;
  if (style?.italic) return familyFonts?.italic ?? familyFonts?.regular ?? fonts.italic;
  return familyFonts?.regular ?? fonts.regular;
}

export function normalizeFontFamilyKey(value: string): string {
  return value
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .toLowerCase();
}

async function drawText(pdfDoc: PDFDocument, page: PDFPage, text: RenderText, x: number, y: number, width: number, height: number, fonts: PdfFontSet): Promise<void> {
  const fontSize = text.style?.font?.size ?? 10;
  const pdfFont = selectPdfFont(fonts, text.style?.font);
  const padding = text.style?.padding ?? { top: 0, right: 0, bottom: 0, left: 0 };
  await drawPdfTextBox(pdfDoc, page, text.content, {
    x,
    y,
    width,
    height,
    padding,
    size: fontSize,
    font: pdfFont,
    color: parsePdfColor(text.style?.font?.color ?? '#000000'),
    colorCss: text.style?.font?.color ?? '#000000',
    family: text.style?.font?.family,
    bold: text.style?.font?.bold,
    italic: text.style?.font?.italic,
    underline: text.style?.font?.underline,
    strikethrough: text.style?.font?.strikethrough,
    textAlign: text.style?.textAlign,
    verticalAlign: text.style?.verticalAlign,
    wrap: true,
  });
}

function drawComponentBorder(
  page: PDFPage,
  border: BorderConfig,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  if (border.style === 'none' || border.width <= 0) return;
  const color = parsePdfColor(border.color);
  const thickness = printableBorderWidthPt(border.width);
  const dashArray = pdfBorderDashArray(border.style);

  if (border.sides.top) {
    page.drawLine({ start: { x, y: y + height }, end: { x: x + width, y: y + height }, thickness, color, dashArray });
  }
  if (border.sides.right) {
    page.drawLine({ start: { x: x + width, y: y + height }, end: { x: x + width, y }, thickness, color, dashArray });
  }
  if (border.sides.bottom) {
    page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness, color, dashArray });
  }
  if (border.sides.left) {
    page.drawLine({ start: { x, y: y + height }, end: { x, y }, thickness, color, dashArray });
  }
}

function drawLine(page: PDFPage, line: RenderLine, x: number, y: number, width: number, height: number): void {
  page.drawLine({
    start: { x: x + (line.startX ?? 0) * MM_TO_PT, y: y + height - (line.startY ?? line.height / 2) * MM_TO_PT },
    end: { x: x + (line.endX ?? line.width) * MM_TO_PT, y: y + height - (line.endY ?? line.height / 2) * MM_TO_PT },
    thickness: printableBorderWidthPt(line.lineWidth ?? 0.2),
    color: parsePdfColor(line.lineColor ?? '#000000'),
    dashArray: line.lineStyle === 'dashed' ? [6, 4] : line.lineStyle === 'dotted' ? [1, 3] : undefined,
  });
}

function drawShape(page: PDFPage, shape: RenderShape, x: number, y: number, width: number, height: number): void {
  const borderWidth = printableBorderWidthPt(shape.borderWidth ?? 0.2);
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

async function drawBarcode(pdfDoc: PDFDocument, page: PDFPage, barcode: RenderBarcode, x: number, y: number, width: number, height: number, fonts: PdfFontSet): Promise<void> {
  const fontSize = barcode.font?.size ?? 8;
  const textHeight = barcode.showText ? fontSize + 2 : 0;
  const barHeight = Math.max(1, height - textHeight);
  const foregroundColor = barcode.foregroundColor ?? '#000000';
  const textColor = barcode.font?.color ?? foregroundColor;
  drawCodeSymbol(page, barcode, 'barcode', x, y + textHeight, width, barHeight);
  if (barcode.showText) {
    const pdfFont = selectPdfFont(fonts, barcode.font);
    await drawPdfTextBox(pdfDoc, page, barcode.value, {
      x,
      y,
      width,
      height: textHeight,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      size: fontSize,
      font: pdfFont,
      color: parsePdfColor(textColor),
      colorCss: textColor,
      family: barcode.font?.family,
      bold: barcode.font?.bold,
      italic: barcode.font?.italic,
      textAlign: 'center',
      verticalAlign: 'middle',
      wrap: false,
    });
  }
}

function drawCodeSymbol(page: PDFPage, component: RenderBarcode | RenderQRCode, type: CodeSymbolType, x: number, y: number, width: number, height: number): void {
  const foregroundColor = component.foregroundColor ?? '#000000';
  const symbol = renderCodeSymbolSvg({
    type,
    value: component.value,
    format: component.format,
    foregroundColor,
    widthMm: width / MM_TO_PT,
    heightMm: height / MM_TO_PT,
  });
  const geometry = parseCodeSymbolGeometry(symbol.svg);
  if (!symbol.ok || !geometry) return;

  page.drawRectangle({ x, y, width, height, color: parsePdfColor('#ffffff') });
  if (type === 'qrcode') {
    const size = Math.max(1, Math.min(width, height));
    const scale = size / Math.max(geometry.viewBox.width, geometry.viewBox.height);
    const offsetX = x + (width - geometry.viewBox.width * scale) / 2 - geometry.viewBox.minX * scale;
    const offsetY = y + (height - geometry.viewBox.height * scale) / 2 - geometry.viewBox.minY * scale;
    for (const path of geometry.paths) {
      if (path.stroke) continue;
      page.drawSvgPath(flipSvgPathY(path.d, geometry.viewBox.height), { x: offsetX, y: offsetY, scale, color: parsePdfColor(path.fill ?? foregroundColor) });
    }
    return;
  }

  const scaleX = width / geometry.viewBox.width;
  const scaleY = height / geometry.viewBox.height;
  for (const path of geometry.paths) {
    if (!path.stroke || !path.strokeWidth) continue;
    drawVerticalStrokePath(page, path.d, {
      x,
      y,
      scaleX,
      scaleY,
      viewBoxMinX: geometry.viewBox.minX,
      viewBoxHeight: geometry.viewBox.height,
      strokeWidth: path.strokeWidth,
      color: path.stroke,
    });
  }
}

function drawVerticalStrokePath(
  page: PDFPage,
  path: string,
  options: { x: number; y: number; scaleX: number; scaleY: number; viewBoxMinX: number; viewBoxHeight: number; strokeWidth: number; color: string },
): void {
  const segmentPattern = /M\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)L\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/gi;
  let match: RegExpExecArray | null;
  while ((match = segmentPattern.exec(path)) !== null) {
    const x1 = Number(match[1]);
    const y1 = Number(match[2]);
    const x2 = Number(match[3]);
    const y2 = Number(match[4]);
    if (![x1, y1, x2, y2].every(Number.isFinite) || Math.abs(x1 - x2) > 0.001) continue;
    const top = Math.max(y1, y2);
    const bottom = Math.min(y1, y2);
    const rectWidth = options.strokeWidth * options.scaleX;
    const rectHeight = (top - bottom) * options.scaleY;
    if (rectWidth <= 0 || rectHeight <= 0) continue;
    page.drawRectangle({
      x: options.x + ((x1 - options.viewBoxMinX) * options.scaleX) - rectWidth / 2,
      y: options.y + (options.viewBoxHeight - top) * options.scaleY,
      width: rectWidth,
      height: rectHeight,
      color: parsePdfColor(options.color),
    });
  }
}

async function drawCheckbox(pdfDoc: PDFDocument, page: PDFPage, checkbox: RenderCheckbox, x: number, y: number, width: number, height: number, fonts: PdfFontSet): Promise<void> {
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
    const pdfFont = selectPdfFont(fonts, checkbox.font);
    await drawPdfText(pdfDoc, page, checkbox.label, { x: x + boxSize + 4, y: y + height - boxSize + 2, size: fontSize, font: pdfFont, maxWidth: Math.max(1, width - boxSize - 4), color: parsePdfColor(labelColor), colorCss: labelColor, family: checkbox.font?.family, bold: checkbox.font?.bold, italic: checkbox.font?.italic });
  }
}

async function drawTable(pdfDoc: PDFDocument, page: PDFPage, table: RenderTable, x: number, y: number, height: number, fonts: PdfFontSet): Promise<void> {
  const columnWidths = table.columns.map(column => (column.width ?? 0) * MM_TO_PT);
  const rowHeights = table.rows.map(row => (row[0]?.height ?? 8) * MM_TO_PT);
  const columnOffsets = cumulativeOffsets(columnWidths);
  const rowOffsets = cumulativeOffsets(rowHeights);
  const cells = table.rows.flatMap(row => row.map(cell => {
    const cellX = x + (columnOffsets[cell.column] ?? 0);
    const rowTopOffset = rowOffsets[cell.row] ?? 0;
    const cellWidth = spanSize(columnWidths, cell.column, cell.colSpan);
    const cellHeight = spanSize(rowHeights, cell.row, cell.rowSpan);
    const cellY = y + height - rowTopOffset - cellHeight;
    return { cell, x: cellX, y: cellY, width: cellWidth, height: cellHeight };
  }));

  for (const item of cells) {
    drawTableCellBackground(page, item.cell, item.x, item.y, item.width, item.height);
  }
  for (const item of cells) {
    drawTableCellBorders(page, item.cell, item.x, item.y, item.width, item.height);
  }
  for (const item of cells) {
    await drawTableCellContent(pdfDoc, page, item.cell, item.x, item.y, item.width, item.height, fonts);
  }
}

function drawTableCellBackground(
  page: PDFPage,
  cell: RenderTableCell,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const backgroundColor = cell.style?.backgroundColor;
  if (backgroundColor) {
    page.drawRectangle({ x, y, width, height, color: parsePdfColor(backgroundColor) });
  }
}

async function drawTableCellContent(
  pdfDoc: PDFDocument,
  page: PDFPage,
  cell: RenderTableCell,
  x: number,
  y: number,
  width: number,
  height: number,
  fonts: PdfFontSet,
): Promise<void> {
  const padding = cell.style?.padding ?? { top: 1, right: 1.5, bottom: 1, left: 1.5 };
  const fontSize = cell.style?.font?.size ?? 10;
  const pdfFont = selectPdfFont(fonts, cell.style?.font);
  const color = parsePdfColor(cell.style?.font?.color ?? '#111111');
  const lines = await drawPdfTextBox(pdfDoc, page, cell.content, {
    x,
    y,
    width,
    height,
    padding,
    size: fontSize,
    font: pdfFont,
    color,
    colorCss: cell.style?.font?.color ?? '#111111',
    family: cell.style?.font?.family,
    bold: cell.style?.font?.bold,
    italic: cell.style?.font?.italic,
    textAlign: cell.style?.textAlign,
    verticalAlign: cell.style?.verticalAlign,
    wrap: false,
  });
  for (const line of lines) {
    drawTableTextDecorations(page, cell, line.x, line.y, line.width, fontSize, color);
  }
}

function drawTableTextDecorations(
  page: PDFPage,
  cell: RenderTableCell,
  x: number,
  baselineY: number,
  textWidth: number,
  fontSize: number,
  color: ReturnType<typeof parsePdfColor>,
): void {
  if (textWidth <= 0) return;
  const thickness = 0.5;
  const drawDecorationLine = (y: number) => {
    page.drawLine({
      start: { x, y },
      end: { x: x + textWidth, y },
      thickness,
      color,
    });
  };

  if (cell.style?.font?.underline) {
    drawDecorationLine(baselineY - fontSize * 0.12);
  }
  if (cell.style?.font?.strikethrough) {
    drawDecorationLine(baselineY + fontSize * 0.32);
  }
}

async function drawPdfText(pdfDoc: PDFDocument, page: PDFPage, text: string, options: DrawPdfTextOptions): Promise<number> {
  const encodedText = safePdfText(text, options.font);
  if (encodedText === text) {
    page.drawText(text, {
      x: options.x,
      y: options.y,
      size: options.size,
      font: options.font,
      color: options.color,
      maxWidth: options.maxWidth,
    });
    return Math.min(options.font.widthOfTextAtSize(text, options.size), options.maxWidth);
  }

  const rasterized = await rasterizePdfText(text, options);
  if (rasterized) {
    const image = await pdfDoc.embedPng(rasterized.bytes);
    page.drawImage(image, {
      x: options.x,
      y: options.y - options.size * 0.15,
      width: rasterized.width,
      height: rasterized.height,
    });
    return rasterized.width;
  }

  page.drawText(encodedText, {
    x: options.x,
    y: options.y,
    size: options.size,
    font: options.font,
    color: options.color,
    maxWidth: options.maxWidth,
  });
  return Math.min(options.font.widthOfTextAtSize(encodedText, options.size), options.maxWidth);
}

async function drawPdfTextBox(
  pdfDoc: PDFDocument,
  page: PDFPage,
  text: string,
  options: DrawPdfTextBoxOptions,
): Promise<DrawnPdfTextLine[]> {
  const left = options.x + options.padding.left * MM_TO_PT;
  const right = options.x + options.width - options.padding.right * MM_TO_PT;
  const maxWidth = Math.max(1, right - left);
  const lineBase: Omit<DrawPdfTextOptions, 'x' | 'y' | 'maxWidth'> = {
    size: options.size,
    font: options.font,
    color: options.color,
    colorCss: options.colorCss,
    family: options.family,
    bold: options.bold,
    italic: options.italic,
    underline: options.underline,
    strikethrough: options.strikethrough,
  };
  const measureOptions: DrawPdfTextOptions = { ...lineBase, x: left, y: 0, maxWidth };
  const lines = layoutPdfTextLines(text, measureOptions, options.wrap ?? false);
  const lineHeight = pdfTextLineHeight(options.size);
  const firstBaselineY = firstPdfTextBaselineY(options.y, options.height, options.padding, options.size, lineHeight, lines.length, options.verticalAlign);
  const drawn: DrawnPdfTextLine[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineX = alignedPdfTextX(left, right, line.width, options.textAlign);
    const lineY = firstBaselineY - index * lineHeight;
    const drawnWidth = line.text
      ? await drawPdfText(pdfDoc, page, line.text, { ...lineBase, x: lineX, y: lineY, maxWidth })
      : 0;
    drawn.push({ ...line, x: lineX, y: lineY, width: drawnWidth });
  }

  return drawn;
}

function layoutPdfTextLines(text: string, options: DrawPdfTextOptions, wrap: boolean): PdfTextLineLayout[] {
  if (!wrap) return [pdfTextLineLayout(text, options)];
  const lines: PdfTextLineLayout[] = [];
  const hardLines = text.split(/\r\n|\r|\n/);

  for (const hardLine of hardLines) {
    if (hardLine === '') {
      lines.push(pdfTextLineLayout('', options));
      continue;
    }
    let current = '';
    for (const token of wrapTokens(hardLine)) {
      for (const piece of splitTokenForWidth(token, options)) {
        if (!current) {
          current = piece;
          continue;
        }
        const candidate = current + piece;
        if (measurePdfTextWidth(candidate, options) <= options.maxWidth) {
          current = candidate;
        } else {
          lines.push(pdfTextLineLayout(current, options));
          current = piece;
        }
      }
    }
    lines.push(pdfTextLineLayout(current, options));
  }

  return lines.length > 0 ? lines : [pdfTextLineLayout('', options)];
}

function splitTokenForWidth(token: string, options: DrawPdfTextOptions): string[] {
  if (measurePdfTextWidth(token, options) <= options.maxWidth) return [token];
  const pieces: string[] = [];
  let current = '';

  for (const char of Array.from(token)) {
    const candidate = current + char;
    if (!current || measurePdfTextWidth(candidate, options) <= options.maxWidth) {
      current = candidate;
    } else {
      pieces.push(current);
      current = char;
    }
  }

  if (current) pieces.push(current);
  return pieces.length > 0 ? pieces : [token];
}

function wrapTokens(text: string): string[] {
  return text.match(/[A-Za-z0-9_.,:/\\-]+|\s+|./gu) ?? [];
}

function pdfTextLineLayout(text: string, options: DrawPdfTextOptions): PdfTextLineLayout {
  return {
    text,
    width: Math.min(measurePdfTextWidth(text, options), options.maxWidth),
  };
}

function measurePdfTextWidth(text: string, options: DrawPdfTextOptions): number {
  if (!text) return 0;
  const encodedText = safePdfText(text, options.font);
  if (encodedText === text) {
    return options.font.widthOfTextAtSize(text, options.size);
  }
  const canvasWidth = measureCanvasPdfTextWidth(text, options);
  if (canvasWidth !== undefined) return canvasWidth;
  return options.font.widthOfTextAtSize(encodedText, options.size);
}

function measureCanvasPdfTextWidth(text: string, options: DrawPdfTextOptions): number | undefined {
  const context = createPdfCanvasContext();
  if (!context) return undefined;
  const scale = 3;
  context.font = pdfCanvasFont(options, options.size * scale);
  return Math.max(1, context.measureText(text).width / scale);
}

async function rasterizePdfText(text: string, options: DrawPdfTextOptions): Promise<{ bytes: Uint8Array; width: number; height: number } | undefined> {
  if (!/[^\x00-\x7F]/.test(text)) return undefined;
  const canvas = createPdfCanvas();
  if (!canvas) return undefined;
  const context = canvas.getContext('2d');
  if (!context) return undefined;

  const scale = 3;
  const fontSize = options.size;
  context.font = pdfCanvasFont(options, fontSize * scale);
  const measuredWidth = Math.min(Math.max(1, context.measureText(text).width / scale), options.maxWidth);
  const width = Math.max(1, measuredWidth);
  const height = Math.max(1, fontSize * 1.35);
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);

  context.scale(scale, scale);
  context.clearRect(0, 0, width, height);
  context.font = pdfCanvasFont(options, fontSize);
  context.fillStyle = options.colorCss;
  context.textBaseline = 'alphabetic';
  context.fillText(text, 0, fontSize, options.maxWidth);
  context.strokeStyle = options.colorCss;
  context.lineWidth = Math.max(0.5, fontSize * 0.05);
  if (options.underline) {
    const y = fontSize + fontSize * 0.12;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  if (options.strikethrough) {
    const y = fontSize - fontSize * 0.32;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  const dataUrl = canvas.toDataURL('image/png');
  return { bytes: dataUrlToUint8Array(dataUrl), width, height };
}

function createPdfCanvas(): HTMLCanvasElement | undefined {
  const doc = globalThis.document;
  if (!doc?.createElement) return undefined;
  return doc.createElement('canvas');
}

function createPdfCanvasContext(): CanvasRenderingContext2D | undefined {
  const canvas = createPdfCanvas();
  return canvas?.getContext('2d') ?? undefined;
}

function pdfCanvasFont(options: DrawPdfTextOptions, size: number): string {
  const family = options.family || 'Microsoft YaHei, SimSun, Arial, sans-serif';
  const style = options.italic ? 'italic ' : '';
  const weight = options.bold ? '700 ' : '400 ';
  return `${style}${weight}${size}px ${family}`;
}

function drawTableCellBorders(
  page: PDFPage,
  cell: RenderTableCell,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const configured = cell.style?.border;
  if (!configured || configured.style === 'none' || configured.width <= 0) return;
  const border: BorderConfig = configured;
  const sides = border.sides;
  const borderWidth = printableBorderWidthPt(border.width);
  const color = parsePdfColor(border.color);
  const dashArray = pdfBorderDashArray(border.style);

  if (sides.top) {
    page.drawLine({ start: { x, y: y + height }, end: { x: x + width, y: y + height }, thickness: borderWidth, color, dashArray });
  }
  if (sides.right) {
    page.drawLine({ start: { x: x + width, y: y + height }, end: { x: x + width, y }, thickness: borderWidth, color, dashArray });
  }
  if (sides.bottom) {
    page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness: borderWidth, color, dashArray });
  }
  if (sides.left) {
    page.drawLine({ start: { x, y: y + height }, end: { x, y }, thickness: borderWidth, color, dashArray });
  }
}

function cumulativeOffsets(values: number[]): number[] {
  const offsets: number[] = [];
  let total = 0;
  for (const value of values) {
    offsets.push(total);
    total += value;
  }
  return offsets;
}

function spanSize(values: number[], start: number, span: number): number {
  return values.slice(start, start + Math.max(1, span)).reduce((sum, value) => sum + value, 0);
}

function alignedPdfTextX(left: number, right: number, textWidth: number, align?: 'left' | 'center' | 'right'): number {
  const availableWidth = Math.max(1, right - left);
  if (align === 'center') {
    return left + Math.max(0, availableWidth - textWidth) / 2;
  }
  if (align === 'right') {
    return Math.max(left, right - textWidth);
  }
  return left;
}

function firstPdfTextBaselineY(
  y: number,
  height: number,
  padding: Padding,
  fontSize: number,
  lineHeight: number,
  lineCount: number,
  align?: 'top' | 'middle' | 'bottom',
): number {
  const contentBottom = y + padding.bottom * MM_TO_PT;
  const contentTop = y + height - padding.top * MM_TO_PT;
  const contentHeight = contentTop - contentBottom;
  const blockHeight = fontSize + Math.max(0, lineCount - 1) * lineHeight;
  if (align === 'middle') {
    return contentBottom + (contentHeight - blockHeight) / 2 + blockHeight - fontSize;
  }
  if (align === 'bottom') {
    return contentBottom + blockHeight - fontSize;
  }
  return contentTop - fontSize;
}

function pdfTextLineHeight(fontSize: number): number {
  return fontSize * 1.2;
}
