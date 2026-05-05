import { rgb, type PDFPage, type PDFFont } from 'pdf-lib';
import type { RenderComponentBox, RenderText } from '@report-designer/core';

const MM_TO_PT = 72 / 25.4;

export function drawRenderComponent(
  page: PDFPage,
  component: RenderComponentBox,
  pageHeightMm: number,
  font: PDFFont,
  boldFont: PDFFont,
): void {
  const x = component.x * MM_TO_PT;
  const y = (pageHeightMm - component.y - component.height) * MM_TO_PT;
  const width = component.width * MM_TO_PT;
  const height = component.height * MM_TO_PT;
  const backgroundColor = component.style?.backgroundColor;
  const border = component.style?.border;

  if (backgroundColor) {
    page.drawRectangle({ x, y, width, height, color: parseColor(backgroundColor) });
  }

  if (border && border.style !== 'none' && border.width > 0) {
    page.drawRectangle({
      x,
      y,
      width,
      height,
      borderColor: parseColor(border.color),
      borderWidth: Math.max(0.5, border.width * MM_TO_PT),
    });
  }

  if (component.type === 'text' && 'content' in component) {
    const text = component as RenderText;
    const fontSize = text.style?.font?.size ?? 10;
    const pdfFont = text.style?.font?.bold ? boldFont : font;
    page.drawText(safePdfText(text.content), {
      x: x + 2,
      y: y + height - fontSize - 2,
      size: fontSize,
      font: pdfFont,
      color: parseColor(text.style?.font?.color ?? '#000000'),
      maxWidth: Math.max(1, width - 4),
    });
  }

  if (component.type === 'line') {
    page.drawLine({ start: { x, y: y + height / 2 }, end: { x: x + width, y: y + height / 2 }, thickness: 1, color: rgb(0, 0, 0) });
  }

  if (component.type === 'shape') {
    page.drawRectangle({ x, y, width, height, borderColor: rgb(0, 0, 0), borderWidth: 1 });
  }
}

function parseColor(color: string): ReturnType<typeof rgb> {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (!match) return rgb(0, 0, 0);
  return rgb(parseInt(match[1], 16) / 255, parseInt(match[2], 16) / 255, parseInt(match[3], 16) / 255);
}

function safePdfText(text: string): string {
  return text.replace(/[^\x00-\x7F]/g, '?');
}
