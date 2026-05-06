import { describe, expect, it } from 'vitest';
import { formatValue } from '../src';

describe('Phase 9 text formatting', () => {
  it('formats common Stimulsoft-style number, currency, percent, date, boolean, and null values', () => {
    expect(formatValue(1234.5, { type: 'number', pattern: '#,##0.00' })).toBe('1,234.50');
    expect(formatValue(1234.5, { type: 'currency', pattern: '$#,##0.00' })).toBe('$1,234.50');
    expect(formatValue(0.257, { type: 'percent', pattern: '0.0%' })).toBe('25.7%');
    expect(formatValue('2026-05-06T09:08:07Z', { type: 'date', pattern: 'yyyy-MM-dd' })).toBe('2026-05-06');
    expect(formatValue(true, { type: 'boolean', trueText: 'Yes', falseText: 'No' })).toBe('Yes');
    expect(formatValue(null, { type: 'number', nullValue: '-' })).toBe('-');
  });
});
