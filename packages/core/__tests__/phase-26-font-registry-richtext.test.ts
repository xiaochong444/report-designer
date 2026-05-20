import { describe, expect, it } from 'vitest';
import {
  buildReportFontCss,
  DEFAULT_REPORT_FONTS,
  createDefaultTemplate,
  getReportFontOptions,
  normalizeReportFonts,
  normalizeTemplate,
  renderReport,
  sanitizeRichHtml,
  type ReportTemplate,
} from '../src';

const template = {
  id: 'font-report',
  name: 'Font Report',
  version: '2.0',
  pages: [],
  dataSources: [],
  styles: [],
  conditionalFormats: [],
  parameters: [],
} as ReportTemplate;

describe('phase 26 font registry and rich text', () => {
  it('normalizes missing report fonts with Chinese built-in fonts', () => {
    const normalized = normalizeTemplate(template);

    expect(normalized.fonts.map(font => font.family)).toEqual(
      expect.arrayContaining(['Microsoft YaHei', 'SimSun', 'SimHei', 'KaiTi', 'FangSong']),
    );
    expect(normalized.fonts.every(font => font.id && font.name && font.family)).toBe(true);
  });

  it('keeps custom fonts and generates font-face CSS', () => {
    const fonts = normalizeReportFonts([
      ...DEFAULT_REPORT_FONTS,
      {
        id: 'brand-song',
        name: 'Brand Song',
        family: 'BrandSong',
        fallback: 'serif',
        source: { url: '/fonts/brand-song.woff2', format: 'woff2' },
      },
    ]);

    expect(getReportFontOptions(fonts)).toContainEqual({
      value: 'BrandSong',
      label: 'Brand Song',
      fontFamily: 'BrandSong, serif',
      builtin: false,
    });
    expect(buildReportFontCss(fonts)).toContain('@font-face');
    expect(buildReportFontCss(fonts)).toContain("font-family: 'BrandSong'");
    expect(buildReportFontCss(fonts)).toContain("url('/fonts/brand-song.woff2') format('woff2')");
  });

  it('sanitizes rich html while keeping supported inline styles', () => {
    const html = sanitizeRichHtml(
      '<p onclick="bad()" style="font-family:SimSun;font-size:14px;color:#123;background-color:#fff;text-align:center;position:absolute">Hello <script>alert(1)</script><a href="javascript:bad()">bad</a><a href="https://example.com">ok</a></p>',
    );

    expect(html).toContain('font-family: SimSun');
    expect(html).toContain('font-size: 14px');
    expect(html).toContain('color: #123');
    expect(html).toContain('background-color: #fff');
    expect(html).toContain('text-align: center');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('script');
    expect(html).not.toContain('position');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('href="https://example.com"');
  });

  it('carries normalized report fonts into the render document', () => {
    const report = createDefaultTemplate('Font Render Report');
    report.fonts = [
      ...(report.fonts ?? []),
      {
        id: 'brand-song',
        name: 'Brand Song',
        family: 'BrandSong',
        fallback: 'serif',
        source: { url: '/fonts/brand-song.woff2', format: 'woff2' },
      },
    ];

    const document = renderReport(report, {}, { suppressEvents: true });

    expect(document.fonts?.map(font => font.family)).toEqual(expect.arrayContaining(['BrandSong', 'SimSun']));
  });
});
