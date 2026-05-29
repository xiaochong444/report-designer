import type { ReportFont } from '../template-model/types';

export interface ReportFontOption {
  value: string;
  label: string;
  fontFamily: string;
  builtin: boolean;
}

export const REGISTERED_REPORT_FONTS: ReportFont[] = [
  { id: 'microsoft-yahei', name: 'Microsoft YaHei', family: 'Microsoft YaHei', fallback: 'sans-serif', builtin: true },
  { id: 'simsun', name: 'SimSun', family: 'SimSun', fallback: 'serif', builtin: true },
  { id: 'simhei', name: 'SimHei', family: 'SimHei', fallback: 'sans-serif', builtin: true },
  { id: 'kaiti', name: 'KaiTi', family: 'KaiTi', fallback: 'serif', builtin: true },
  { id: 'fangsong', name: 'FangSong', family: 'FangSong', fallback: 'serif', builtin: true },
  { id: 'source-han-sans', name: 'Source Han Sans', family: 'Source Han Sans', fallback: 'sans-serif', builtin: true },
  { id: 'source-han-serif', name: 'Source Han Serif', family: 'Source Han Serif', fallback: 'serif', builtin: true },
  { id: 'arial', name: 'Arial', family: 'Arial', fallback: 'sans-serif', builtin: true },
  { id: 'times-new-roman', name: 'Times New Roman', family: 'Times New Roman', fallback: 'serif', builtin: true },
  { id: 'courier-new', name: 'Courier New', family: 'Courier New', fallback: 'monospace', builtin: true },
];

export const DEFAULT_REPORT_FONTS = REGISTERED_REPORT_FONTS;

export function normalizeReportFonts(fonts?: ReportFont[]): ReportFont[] {
  const byId = new Map<string, ReportFont>();

  for (const font of [...REGISTERED_REPORT_FONTS, ...(fonts ?? [])]) {
    const id = normalizeFontId(font.id || font.family || font.name);
    const family = (font.family || font.name || id).trim();
    const name = (font.name || family).trim();
    if (!id || !family || !name) continue;

    byId.set(id, {
      ...font,
      id,
      name,
      family,
      builtin: font.builtin ?? REGISTERED_REPORT_FONTS.some(item => item.id === id),
    });
  }

  return [...byId.values()];
}

export function getReportFontOptions(fonts?: ReportFont[]): ReportFontOption[] {
  return normalizeReportFonts(fonts).map(font => ({
    value: font.family,
    label: font.name,
    fontFamily: formatFontFamily(font),
    builtin: Boolean(font.builtin),
  }));
}

export function buildReportFontCss(fonts?: ReportFont[]): string {
  return normalizeReportFonts(fonts)
    .filter(font => font.source?.url || font.source?.dataUrl)
    .map(font => {
      const source = font.source;
      const url = source?.dataUrl ?? source?.url ?? '';
      const format = source?.format ? ` format('${escapeCssString(source.format)}')` : '';
      return [
        '@font-face {',
        `  font-family: '${escapeCssString(font.family)}';`,
        `  src: url('${escapeCssUrl(url)}')${format};`,
        '  font-display: swap;',
        '}',
      ].join('\n');
    })
    .join('\n');
}

export function formatFontFamily(font: Pick<ReportFont, 'family' | 'fallback'>): string {
  return [font.family, font.fallback].filter(Boolean).join(', ');
}

function normalizeFontId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeCssString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function escapeCssUrl(value: string): string {
  return escapeCssString(value).replace(/\)/g, '\\)');
}
