import { describe, expect, it } from 'vitest';
import {
  createDefaultTemplate,
  getDefaultTextStyle,
  getTextStyleById,
  renderTemplate,
  resolveTextStyle,
} from '../src';
import type { ReportStyle, ReportTemplate, TextComponent } from '../src';

const DEFAULT_FONT = {
  family: 'Arial',
  size: 10,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  color: '#000000',
} as const;

const DEFAULT_BORDER = {
  style: 'none',
  width: 0,
  color: '#000000',
  sides: { top: false, right: false, bottom: false, left: false },
} as const;

const DEFAULT_PADDING = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as const;

function makeTextStyle(overrides: Partial<ReportStyle> = {}): ReportStyle {
  return {
    id: 'style-1',
    name: 'Style',
    font: {
      family: 'Helvetica',
      size: 12,
      bold: true,
      italic: false,
      underline: false,
      strikethrough: false,
      color: '#333333',
    },
    border: {
      style: 'solid',
      width: 0.2,
      color: '#999999',
      sides: { top: true, right: true, bottom: true, left: true },
    },
    backgroundColor: '#f5f5f5',
    textAlign: 'center',
    verticalAlign: 'middle',
    padding: { top: 1, right: 2, bottom: 3, left: 4 },
    format: { type: 'number', pattern: '#,##0.00' },
    canGrow: true,
    canShrink: true,
    ...overrides,
  };
}

function makeRenderTemplate(
  componentOverrides: Partial<TextComponent> = {},
  styles: ReportStyle[] = [makeTextStyle({ id: 'style-1', isDefault: true })],
): ReportTemplate {
  return {
    id: 'template-1',
    name: 'Template',
    version: '1.0',
    dataSources: [],
    styles,
    conditionalFormats: [],
    pages: [
      {
        id: 'page-1',
        width: 210,
        height: 297,
        margins: { top: 10, right: 10, bottom: 10, left: 10 },
        orientation: 'portrait',
        bands: [
          {
            id: 'band-1',
            type: 'reportTitle',
            height: 20,
            components: [
              {
                id: 'text-1',
                type: 'text',
                x: 0,
                y: 0,
                width: 80,
                height: 12,
                text: 'Styled content',
                font: { ...DEFAULT_FONT },
                border: { ...DEFAULT_BORDER, sides: { ...DEFAULT_BORDER.sides } },
                backgroundColor: 'transparent',
                padding: { ...DEFAULT_PADDING },
                textAlign: 'left',
                verticalAlign: 'top',
                canGrow: false,
                canShrink: false,
                ...componentOverrides,
              } as TextComponent,
            ],
          },
        ],
      },
    ],
  };
}

function getRenderedTextStyle(template: ReportTemplate) {
  const tree = renderTemplate(template, {});
  const rendered = tree.pages[0]?.bands[0]?.components[0];

  expect(rendered?.type).toBe('text');

  return rendered?.style;
}

describe('Phase 17 text style resolution', () => {
  it('accepts legacy text styles without category', () => {
    const legacyStyle = makeTextStyle();

    expect(getTextStyleById([legacyStyle], legacyStyle.id)).toEqual(legacyStyle);
  });

  it('creates a default template with one default text style and the baseline style set', () => {
    const template = createDefaultTemplate();
    const textStyles = template.styles.filter(style => style.category === 'text');

    expect(textStyles.map(style => style.name)).toEqual([
      'Normal',
      'Title',
      'Header',
      'Data',
      'Footer',
      'Group',
    ]);
    expect(textStyles.filter(style => style.isDefault)).toHaveLength(1);
    expect(getDefaultTextStyle(textStyles)?.name).toBe('Normal');
  });

  it('prefers local component values over referenced style values', () => {
    const style = makeTextStyle({ id: 'text-style' });
    const resolved = resolveTextStyle(
      {
        style: style.id,
        font: { color: '#ff0000', bold: false },
        textAlign: 'right',
        verticalAlign: 'bottom',
        padding: { top: 9, right: 8, bottom: 7, left: 6 },
        format: { type: 'currency', pattern: 'C2' },
        canGrow: false,
        canShrink: false,
      },
      [style],
    );

    expect(resolved.font.color).toBe('#ff0000');
    expect(resolved.font.bold).toBe(false);
    expect(resolved.textAlign).toBe('right');
    expect(resolved.verticalAlign).toBe('bottom');
    expect(resolved.padding).toEqual({ top: 9, right: 8, bottom: 7, left: 6 });
    expect(resolved.format).toEqual({ type: 'currency', pattern: 'C2' });
    expect(resolved.canGrow).toBe(false);
    expect(resolved.canShrink).toBe(false);
  });

  it('prefers style values over built-in defaults', () => {
    const style = makeTextStyle({
      id: 'styled',
      font: {
        family: 'Times New Roman',
        size: 16,
        bold: false,
        italic: true,
        underline: false,
        strikethrough: false,
        color: '#0055aa',
      },
      textAlign: 'right',
      verticalAlign: 'bottom',
      padding: { top: 2, right: 2, bottom: 2, left: 2 },
      canGrow: true,
      canShrink: true,
    });

    const resolved = resolveTextStyle(
      {
        style: style.id,
      },
      [style],
    );

    expect(resolved.font.family).toBe('Times New Roman');
    expect(resolved.font.size).toBe(16);
    expect(resolved.font.italic).toBe(true);
    expect(resolved.textAlign).toBe('right');
    expect(resolved.verticalAlign).toBe('bottom');
    expect(resolved.padding).toEqual({ top: 2, right: 2, bottom: 2, left: 2 });
    expect(resolved.canGrow).toBe(true);
    expect(resolved.canShrink).toBe(true);
  });

  it('falls back to the default text style when the referenced style id is missing', () => {
    const styles = [
      makeTextStyle({ id: 'default-style', name: 'Normal', isDefault: true }),
    ];

    const resolved = resolveTextStyle(
      {
        style: 'missing-style',
      },
      styles,
    );

    expect(resolved.font.family).toBe('Helvetica');
    expect(resolved.textAlign).toBe('center');
    expect(resolved.canGrow).toBe(true);
  });

  it('supports partial nested overrides for local text style values', () => {
    const style = makeTextStyle({
      id: 'partial-style',
      font: {
        family: 'Helvetica',
        size: 12,
        bold: true,
        italic: false,
        underline: false,
        strikethrough: false,
        color: '#333333',
      },
      border: {
        style: 'solid',
        width: 0.2,
        color: '#999999',
        sides: { top: true, right: true, bottom: true, left: true },
      },
      padding: { top: 1, right: 2, bottom: 3, left: 4 },
    });

    const resolved = resolveTextStyle(
      {
        style: style.id,
        font: { italic: true },
        border: { sides: { bottom: false, left: false } },
        padding: { left: 12 },
      },
      [style],
    );

    expect(resolved.font.family).toBe('Helvetica');
    expect(resolved.font.italic).toBe(true);
    expect(resolved.border.style).toBe('solid');
    expect(resolved.border.sides).toEqual({ top: true, right: true, bottom: false, left: false });
    expect(resolved.padding).toEqual({ top: 1, right: 2, bottom: 3, left: 12 });
  });

  it('renders the text component current final values directly', () => {
    const style = makeTextStyle({
      id: 'render-style',
      font: DEFAULT_FONT,
      border: DEFAULT_BORDER,
      backgroundColor: '#f0f0f0',
      textAlign: 'center',
      verticalAlign: 'middle',
      padding: { top: 1, right: 1, bottom: 1, left: 1 },
      format: { type: 'number', pattern: '#,##0.00' },
      canGrow: true,
      canShrink: true,
    });

    const renderedStyle = getRenderedTextStyle(
      makeRenderTemplate({
        style: style.id,
        font: {
          family: 'Times New Roman',
          size: 16,
          bold: false,
          italic: true,
          underline: false,
          strikethrough: false,
          color: '#0055aa',
        },
        border: {
          style: 'solid',
          width: 0.5,
          color: '#2266aa',
          sides: { top: true, right: false, bottom: true, left: false },
        },
        backgroundColor: '#eef6ff',
        textAlign: 'right',
        verticalAlign: 'bottom',
        padding: { top: 5, right: 6, bottom: 7, left: 8 },
        format: { type: 'currency', pattern: 'C2' },
        canGrow: false,
        canShrink: true,
      }, [style]),
    );

    expect(renderedStyle?.font).toEqual({
      family: 'Times New Roman',
      size: 16,
      bold: false,
      italic: true,
      underline: false,
      strikethrough: false,
      color: '#0055aa',
    });
    expect(renderedStyle?.textAlign).toBe('right');
    expect(renderedStyle?.verticalAlign).toBe('bottom');
    expect(renderedStyle?.background).toBe('#eef6ff');
    expect(renderedStyle?.border).toEqual({
      style: 'solid',
      width: 0.5,
      color: '#2266aa',
      sides: { top: true, right: false, bottom: true, left: false },
    });
    expect(renderedStyle?.padding).toEqual({ top: 5, right: 6, bottom: 7, left: 8 });
    expect(renderedStyle?.format).toEqual({ type: 'currency', pattern: 'C2' });
    expect(renderedStyle?.canGrow).toBe(false);
    expect(renderedStyle?.canShrink).toBe(true);
  });

  it('includes padding in render output style payload', () => {
    const style = makeTextStyle({
      id: 'padding-style',
      padding: { top: 1, right: 1, bottom: 1, left: 1 },
    });

    const renderedStyle = getRenderedTextStyle(
      makeRenderTemplate({
        style: style.id,
        padding: { top: 9, right: 8, bottom: 7, left: 6 },
      }, [style]),
    );

    expect(renderedStyle?.padding).toEqual({ top: 9, right: 8, bottom: 7, left: 6 });
  });

  it('prefers the component current values even when a style reference is present', () => {
    const style = makeTextStyle({
      id: 'referenced-style',
      font: {
        family: 'Courier New',
        size: 20,
        bold: true,
        italic: false,
        underline: false,
        strikethrough: false,
        color: '#990000',
      },
      backgroundColor: '#ddeeff',
      textAlign: 'center',
      verticalAlign: 'middle',
      padding: { top: 2, right: 2, bottom: 2, left: 2 },
      canGrow: true,
      canShrink: true,
    });

    const renderedStyle = getRenderedTextStyle(
      makeRenderTemplate({
        style: style.id,
        styleBindings: ['font', 'padding', 'textAlign'],
        font: {
          family: 'Arial',
          size: 11,
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          color: '#111111',
        },
        backgroundColor: '#ffffff',
        textAlign: 'left',
        verticalAlign: 'top',
        padding: { top: 4, right: 3, bottom: 2, left: 1 },
        canGrow: false,
        canShrink: false,
      }, [style]),
    );

    expect(renderedStyle?.textAlign).toBe('left');
    expect(renderedStyle?.font).toEqual({
      family: 'Arial',
      size: 11,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      color: '#111111',
    });
    expect(renderedStyle?.background).toBe('#ffffff');
    expect(renderedStyle?.verticalAlign).toBe('top');
    expect(renderedStyle?.padding).toEqual({ top: 4, right: 3, bottom: 2, left: 1 });
    expect(renderedStyle?.canGrow).toBe(false);
    expect(renderedStyle?.canShrink).toBe(false);
  });

  it('includes the full text style payload from the component for render consumers', () => {
    const style = makeTextStyle({
      id: 'payload-style',
      font: DEFAULT_FONT,
      backgroundColor: '#ffffff',
      textAlign: 'left',
      verticalAlign: 'top',
      border: DEFAULT_BORDER,
      padding: DEFAULT_PADDING,
      format: undefined,
      canGrow: true,
      canShrink: false,
    });

    const componentStyle = {
      font: {
        family: 'Georgia',
        size: 14,
        bold: true,
        italic: false,
        underline: true,
        strikethrough: false,
        color: '#222244',
      },
      backgroundColor: '#fff7e6',
      textAlign: 'right',
      verticalAlign: 'bottom',
      border: {
        style: 'double',
        width: 0.4,
        color: '#cc8800',
        sides: { top: true, right: false, bottom: true, left: true },
      },
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      format: { type: 'currency', pattern: 'C2' },
      canGrow: false,
      canShrink: true,
    } satisfies Partial<TextComponent>;

    const renderedStyle = getRenderedTextStyle(
      makeRenderTemplate({ style: style.id, ...componentStyle }, [style]),
    );

    expect(renderedStyle).toMatchObject({
      font: componentStyle.font,
      textAlign: 'right',
      verticalAlign: 'bottom',
      background: '#fff7e6',
      border: componentStyle.border,
      padding: componentStyle.padding,
      format: { type: 'currency', pattern: 'C2' },
      canGrow: false,
      canShrink: true,
    });
  });
});
