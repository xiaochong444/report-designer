import { describe, expect, it } from 'vitest';
import { formatValue } from '../src';

describe('Phase 9 text formatting', () => {
  it('formats common number, currency, percent, date, boolean, and null values', () => {
    expect(formatValue(1234.5, { type: 'number', pattern: '#,##0.00' })).toBe('1,234.50');
    expect(formatValue(1234.5, { type: 'currency', pattern: '$#,##0.00' })).toBe('$1,234.50');
    expect(formatValue(0.257, { type: 'percent', pattern: '0.0%' })).toBe('25.7%');
    expect(formatValue('2026-05-06T09:08:07Z', { type: 'date', pattern: 'yyyy-MM-dd' })).toBe('2026-05-06');
    expect(formatValue(true, { type: 'boolean', trueText: 'Yes', falseText: 'No' })).toBe('Yes');
    expect(formatValue(null, { type: 'number', nullValue: '-' })).toBe('-');
  });

  it('formats values from structured format options without requiring a raw pattern', () => {
    expect(formatValue(-1234.5, {
      type: 'number',
      decimalDigits: 2,
      useGroupSeparator: true,
      negativePattern: 'parentheses',
    } as any)).toBe('(1,234.50)');
    expect(formatValue(1234.5, {
      type: 'currency',
      decimalDigits: 0,
      useGroupSeparator: true,
      currencySymbol: '¥',
      currencySymbolPosition: 'prefix',
    } as any)).toBe('¥1,235');
    expect(formatValue(0.257, {
      type: 'percent',
      decimalDigits: 1,
      percentMultiplier: 100,
    } as any)).toBe('25.7%');
    expect(formatValue('2026-05-06T09:08:07Z', {
      type: 'date',
      dateFormat: 'yyyy/MM/dd',
    } as any)).toBe('2026/05/06');
    expect(formatValue(' quarterly total ', {
      type: 'text',
      textTransform: 'uppercase',
      trimText: true,
    } as any)).toBe('QUARTERLY TOTAL');
  });

  it('formats advanced structured options used by the format editor', () => {
    expect(formatValue(1234.5, {
      type: 'number',
      decimalDigits: 2,
      useGroupSeparator: true,
      decimalSeparator: ',',
      groupSeparator: ' ',
    } as any)).toBe('1 234,50');

    expect(formatValue(1250000, {
      type: 'number',
      decimalDigits: 1,
      useAbbreviation: true,
    } as any)).toBe('1.3M');

    expect(formatValue(12.3, {
      type: 'currency',
      decimalDigits: 1,
      useGroupSeparator: false,
      decimalSeparator: ',',
      currencySymbol: '€',
      currencySymbolPosition: 'suffix',
      currencySpace: true,
      positivePattern: 'plus',
    } as any)).toBe('+12,3 €');

    expect(formatValue(0.125, {
      type: 'percent',
      decimalDigits: 1,
      percentMultiplier: 100,
      percentSymbol: 'pct',
      percentSymbolPosition: 'suffix',
      percentSpace: true,
    } as any)).toBe('12.5 pct');

    expect(formatValue('Y', {
      type: 'boolean',
      trueText: '是',
      falseText: '否',
      trueValues: ['Y', '1'],
      falseValues: ['N', '0'],
    } as any)).toBe('是');

    expect(formatValue('N', {
      type: 'boolean',
      trueText: '是',
      falseText: '否',
      trueValues: ['Y', '1'],
      falseValues: ['N', '0'],
    } as any)).toBe('否');
  });
});
