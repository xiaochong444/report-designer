import { describe, expect, it } from 'vitest';
import {
  createDefaultTemplate,
  getDefaultTextStyle,
  getTextStyleById,
  resolveTextStyle,
} from '../src';
import type { ReportStyle } from '../src';

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
});
