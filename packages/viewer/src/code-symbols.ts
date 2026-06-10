import bwipjs from 'bwip-js';

export const BARCODE_FORMATS = ['CODE128', 'EAN13', 'EAN8', 'UPC', 'CODE39', 'ITF14'] as const;
export const QR_CODE_FORMATS = ['QR_CODE'] as const;

export type BarcodeFormat = typeof BARCODE_FORMATS[number];
export type QRCodeFormat = typeof QR_CODE_FORMATS[number];
export type CodeSymbolType = 'barcode' | 'qrcode';

export interface CodeSymbolOptions {
  type: CodeSymbolType;
  value: string;
  format?: string;
  foregroundColor?: string;
  widthMm?: number;
  heightMm?: number;
}

export interface RenderedCodeSymbolSvg {
  ok: boolean;
  svg: string;
  error?: string;
}

export interface CodeSymbolPath {
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface CodeSymbolGeometry {
  viewBox: { minX: number; minY: number; width: number; height: number };
  paths: CodeSymbolPath[];
}

const BWIP_BCID: Record<BarcodeFormat | QRCodeFormat, string> = {
  CODE128: 'code128',
  EAN13: 'ean13',
  EAN8: 'ean8',
  UPC: 'upca',
  CODE39: 'code39',
  ITF14: 'itf14',
  QR_CODE: 'qrcode',
};

export function renderCodeSymbolSvg(options: CodeSymbolOptions): RenderedCodeSymbolSvg {
  const value = String(options.value ?? '');
  if (!value) {
    return { ok: false, svg: emptyCodeSymbolSvg(options.type), error: 'Code value is empty.' };
  }

  const format = normalizeFormat(options.type, options.format);
  if (!format) {
    return { ok: false, svg: emptyCodeSymbolSvg(options.type), error: 'Unsupported code format.' };
  }

  try {
    const svg = bwipjs.toSVG({
      bcid: BWIP_BCID[format],
      text: value,
      scale: 2,
      includetext: false,
      backgroundcolor: 'FFFFFF',
      barcolor: normalizeHexColor(options.foregroundColor),
      paddingwidth: options.type === 'qrcode' ? 8 : 6,
      paddingheight: options.type === 'qrcode' ? 8 : 4,
      ...codeSymbolSizeOptions(options),
    });
    return { ok: true, svg: fitCodeSymbolSvg(svg, options.type) };
  } catch (error) {
    return {
      ok: false,
      svg: emptyCodeSymbolSvg(options.type),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function parseCodeSymbolGeometry(svg: string): CodeSymbolGeometry | null {
  const viewBoxMatch = /\bviewBox="([^"]+)"/i.exec(svg);
  if (!viewBoxMatch) return null;
  const [minX, minY, width, height] = viewBoxMatch[1].trim().split(/\s+/).map(Number);
  if (![minX, minY, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;

  const paths: CodeSymbolPath[] = [];
  const pathPattern = /<path\b([^>]*)>/gi;
  let pathMatch: RegExpExecArray | null;
  while ((pathMatch = pathPattern.exec(svg)) !== null) {
    const attrs = parseSvgAttributes(pathMatch[1]);
    const d = attrs.d;
    if (!d) continue;
    paths.push({
      d,
      fill: attrs.fill,
      stroke: attrs.stroke,
      strokeWidth: attrs['stroke-width'] ? Number(attrs['stroke-width']) : undefined,
    });
  }

  return { viewBox: { minX, minY, width, height }, paths };
}

export function flipSvgPathY(path: string, viewBoxHeight: number): string {
  const tokens = path.match(/[MLZ]|-?\d+(?:\.\d+)?/gi) ?? [];
  const output: string[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index].toUpperCase();
    if (token === 'M' || token === 'L') {
      const x = Number(tokens[index + 1]);
      const y = Number(tokens[index + 2]);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        output.push(token, formatPathNumber(x), formatPathNumber(viewBoxHeight - y));
        index += 2;
      }
      continue;
    }
    if (token === 'Z') {
      output.push('Z');
    }
  }
  return output.join(' ');
}

function normalizeFormat(type: CodeSymbolType, format?: string): BarcodeFormat | QRCodeFormat | null {
  if (type === 'qrcode') return 'QR_CODE';
  const candidate = (format || 'CODE128') as BarcodeFormat;
  return (BARCODE_FORMATS as readonly string[]).includes(candidate) ? candidate : null;
}

function codeSymbolSizeOptions(options: CodeSymbolOptions): { width?: number; height?: number } {
  const width = positiveNumber(options.widthMm);
  const height = positiveNumber(options.heightMm);
  return {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };
}

function positiveNumber(value?: number): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

function fitCodeSymbolSvg(svg: string, type: CodeSymbolType): string {
  const preserveAspectRatio = type === 'barcode' ? 'none' : 'xMidYMid meet';
  return svg.replace('<svg ', `<svg width="100%" height="100%" preserveAspectRatio="${preserveAspectRatio}" `);
}

function emptyCodeSymbolSvg(type: CodeSymbolType): string {
  const viewBox = type === 'qrcode' ? '0 0 100 100' : '0 0 200 80';
  return `<svg width="100%" height="100%" preserveAspectRatio="${type === 'qrcode' ? 'xMidYMid meet' : 'none'}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#FFFFFF" /></svg>`;
}

function normalizeHexColor(value?: string): string {
  const match = /^#?([a-f\d]{6})$/i.exec(value ?? '');
  return match ? match[1].toUpperCase() : '000000';
}

function parseSvgAttributes(value: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrPattern = /([\w:-]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = attrPattern.exec(value)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

function formatPathNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/\.?0+$/, '');
}
