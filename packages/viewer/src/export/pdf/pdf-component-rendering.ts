import { rgb } from 'pdf-lib';

export const MM_TO_PT = 72 / 25.4;

export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const match = /^data:([^;,]+);base64,(.*)$/i.exec(dataUrl);
  if (!match) return new Uint8Array();
  const base64 = match[2];
  const binary = typeof globalThis.atob === 'function'
    ? globalThis.atob(base64)
    : bufferFromBase64(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function dataUrlMimeType(dataUrl: string): string | undefined {
  return /^data:([^;,]+);base64,/i.exec(dataUrl)?.[1]?.toLowerCase();
}

export function stripHtmlToPdfText(html: string): string {
  return decodeBasicEntities(
    html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{2,}/g, '\n')
      .trim(),
  );
}

export function safePdfText(text: string, font?: { encodeText?: (value: string) => unknown }): string {
  if (font?.encodeText) {
    try {
      font.encodeText(text);
      return text;
    } catch {
      return text.replace(/[^\x00-\x7F]/g, '?');
    }
  }
  return text.replace(/[^\x00-\x7F]/g, '?');
}

export function parsePdfColor(color?: string): ReturnType<typeof rgb> {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color ?? '');
  if (!match) return rgb(0, 0, 0);
  return rgb(parseInt(match[1], 16) / 255, parseInt(match[2], 16) / 255, parseInt(match[3], 16) / 255);
}

export function barcodePattern(value: string): boolean[] {
  const seed = value.split('').reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) >>> 0, 2166136261);
  return Array.from({ length: 48 }, (_, index) => ((seed >>> (index % 24)) + index + value.length) % 3 !== 0);
}

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}

function bufferFromBase64(base64: string): string {
  const bufferCtor = (globalThis as typeof globalThis & { Buffer?: { from(value: string, encoding: 'base64'): { toString(encoding: 'binary'): string } } }).Buffer;
  return bufferCtor ? bufferCtor.from(base64, 'base64').toString('binary') : '';
}
