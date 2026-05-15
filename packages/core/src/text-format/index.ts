import type { TextFormatConfig } from '../template-model/types';

const DEFAULT_NUMBER_DECIMAL_DIGITS = 2;
const DEFAULT_GROUP_SIZE = 3;

export function createDefaultTextFormat(type: TextFormatConfig['type'] = 'none'): TextFormatConfig {
  switch (type) {
    case 'text':
      return { type, textTransform: 'none', trimText: false };
    case 'number':
      return {
        type,
        decimalDigits: 2,
        decimalSeparator: '.',
        useGroupSeparator: true,
        groupSeparator: ',',
        groupSize: 3,
        useAbbreviation: false,
        positivePattern: 'plain',
        negativePattern: 'minus',
      };
    case 'currency':
      return {
        type,
        decimalDigits: 2,
        decimalSeparator: '.',
        useGroupSeparator: true,
        groupSeparator: ',',
        groupSize: 3,
        useAbbreviation: false,
        positivePattern: 'plain',
        negativePattern: 'minus',
        currencySymbol: '$',
        currencySymbolPosition: 'prefix',
        currencySpace: false,
      };
    case 'percent':
      return {
        type,
        decimalDigits: 2,
        decimalSeparator: '.',
        useGroupSeparator: false,
        groupSeparator: ',',
        groupSize: 3,
        positivePattern: 'plain',
        negativePattern: 'minus',
        percentMultiplier: 100,
        percentSymbol: '%',
        percentSymbolPosition: 'suffix',
        percentSpace: false,
      };
    case 'date':
      return { type, dateFormat: 'yyyy-MM-dd' };
    case 'time':
      return { type, timeFormat: 'HH:mm:ss' };
    case 'dateTime':
      return { type, dateFormat: 'yyyy-MM-dd', timeFormat: 'HH:mm:ss' };
    case 'boolean':
      return { type, trueText: 'True', falseText: 'False', trueValues: ['true', '1'], falseValues: ['false', '0'] };
    case 'custom':
      return { type, pattern: '' };
    case 'none':
    default:
      return { type: 'none' };
  }
}

export function normalizeTextFormat(format?: TextFormatConfig): TextFormatConfig {
  const type = format?.type ?? 'none';
  return {
    ...createDefaultTextFormat(type),
    ...format,
  };
}

export function formatValue(value: unknown, format?: TextFormatConfig): string {
  if (!format || format.type === 'none') return value == null ? '' : String(value);
  if (value == null || value === '') return format.nullValue ?? '';

  switch (format.type) {
    case 'text':
      return formatText(value, format);
    case 'boolean':
      return formatBoolean(value, format);
    case 'date':
      return formatDate(value, format.dateFormat ?? format.pattern ?? 'yyyy-MM-dd');
    case 'time':
      return formatDate(value, format.timeFormat ?? format.pattern ?? 'HH:mm:ss');
    case 'dateTime':
      return formatDate(value, [format.dateFormat ?? 'yyyy-MM-dd', format.timeFormat ?? 'HH:mm:ss'].filter(Boolean).join(' '));
    case 'percent':
      return hasStructuredPercentOptions(format)
        ? formatPercent(toNumber(value), format)
        : `${formatNumber(toNumber(value) * 100, stripPercent(format.pattern ?? '0.00%'))}%`;
    case 'currency':
      return hasStructuredCurrencyOptions(format)
        ? formatCurrencyFromOptions(toNumber(value), format)
        : formatCurrency(toNumber(value), format.pattern ?? '$#,##0.00');
    case 'number':
      return hasStructuredNumberOptions(format)
        ? formatNumberFromOptions(toNumber(value), format)
        : formatNumber(toNumber(value), format.pattern ?? '#,##0.##');
    case 'custom':
      return formatCustom(value, format.pattern ?? '');
    default:
      return String(value);
  }
}

function hasStructuredNumberOptions(format: TextFormatConfig): boolean {
  return (
    format.decimalDigits !== undefined
    || format.decimalSeparator !== undefined
    || format.useGroupSeparator !== undefined
    || format.groupSeparator !== undefined
    || format.groupSize !== undefined
    || format.useAbbreviation !== undefined
    || format.positivePattern !== undefined
    || format.negativePattern !== undefined
  );
}

function hasStructuredCurrencyOptions(format: TextFormatConfig): boolean {
  return (
    hasStructuredNumberOptions(format)
    || format.currencySymbol !== undefined
    || format.currencySymbolPosition !== undefined
    || format.currencySpace !== undefined
  );
}

function hasStructuredPercentOptions(format: TextFormatConfig): boolean {
  return (
    hasStructuredNumberOptions(format)
    || format.percentMultiplier !== undefined
    || format.percentSymbol !== undefined
    || format.percentSymbolPosition !== undefined
    || format.percentSpace !== undefined
  );
}

function formatBoolean(value: unknown, format: TextFormatConfig): string {
  const booleanValue = readBoolean(value, format);
  return booleanValue ? format.trueText ?? 'True' : format.falseText ?? 'False';
}

function readBoolean(value: unknown, format: TextFormatConfig): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;

  const normalized = String(value).trim().toLowerCase();
  const trueValues = normalizeBooleanValues(format.trueValues, ['true', '1', 'yes', 'y']);
  const falseValues = normalizeBooleanValues(format.falseValues, ['false', '0', 'no', 'n']);

  if (trueValues.includes(normalized)) return true;
  if (falseValues.includes(normalized)) return false;
  return Boolean(value);
}

function normalizeBooleanValues(values: string[] | undefined, fallback: string[]): string[] {
  return (values && values.length > 0 ? values : fallback).map(value => value.trim().toLowerCase());
}

function formatText(value: unknown, format: TextFormatConfig): string {
  let text = String(value);
  if (format.trimText) {
    text = text.trim();
  }

  switch (format.textTransform) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'capitalize':
      return text.replace(/\b\w/g, char => char.toUpperCase());
    case 'none':
    default:
      return text;
  }
}

function formatCurrency(value: number, pattern: string): string {
  const numericPattern = pattern.replace(/[^#0.,]+/g, '') || '#,##0.00';
  const prefix = pattern.match(/^[^#0.,]+/)?.[0] ?? '';
  const suffix = pattern.match(/[^#0.,]+$/)?.[0] ?? '';
  return `${prefix}${formatNumber(value, numericPattern)}${suffix}`;
}

function formatCurrencyFromOptions(value: number, format: TextFormatConfig): string {
  if (!Number.isFinite(value)) return '';
  const negative = value < 0;
  const numeric = formatUnsignedNumber(Math.abs(value), format);
  const symbol = format.currencySymbol ?? '$';
  const gap = format.currencySpace ? ' ' : '';
  const body = (format.currencySymbolPosition ?? 'prefix') === 'suffix'
    ? `${numeric}${gap}${symbol}`
    : `${symbol}${gap}${numeric}`;
  return applySignPattern(body, value, format);
}

function formatPercent(value: number, format: TextFormatConfig): string {
  if (!Number.isFinite(value)) return '';
  const multiplier = format.percentMultiplier ?? 100;
  const numeric = formatUnsignedNumber(Math.abs(value) * multiplier, format);
  const symbol = format.percentSymbol ?? '%';
  const gap = format.percentSpace ? ' ' : '';
  const body = (format.percentSymbolPosition ?? 'suffix') === 'prefix'
    ? `${symbol}${gap}${numeric}`
    : `${numeric}${gap}${symbol}`;
  return applySignPattern(body, value, format);
}

function formatNumberFromOptions(value: number, format: TextFormatConfig): string {
  if (!Number.isFinite(value)) return '';
  return applySignPattern(formatUnsignedNumber(Math.abs(value), format), value, format);
}

function formatUnsignedNumber(value: number, format: TextFormatConfig): string {
  const decimalDigits = clampInteger(format.decimalDigits, 0, 8, DEFAULT_NUMBER_DECIMAL_DIGITS);
  const abbreviated = abbreviateNumber(value, format);
  const fixed = abbreviated.value.toFixed(decimalDigits);
  let [integer, decimal = ''] = fixed.split('.');

  if (format.useGroupSeparator ?? true) {
    integer = groupInteger(integer, clampInteger(format.groupSize, 1, 9, DEFAULT_GROUP_SIZE), normalizeSeparator(format.groupSeparator, ','));
  }

  const decimalSeparator = normalizeSeparator(format.decimalSeparator, '.');
  const numeric = decimalDigits > 0 ? `${integer}${decimalSeparator}${decimal}` : integer;
  return `${numeric}${abbreviated.suffix}`;
}

function groupInteger(value: string, groupSize: number, separator: string): string {
  const groups: string[] = [];
  for (let index = value.length; index > 0; index -= groupSize) {
    groups.unshift(value.slice(Math.max(0, index - groupSize), index));
  }
  return groups.join(separator);
}

function applySignPattern(value: string, originalValue: number, format: TextFormatConfig): string {
  if (originalValue < 0) {
    return format.negativePattern === 'parentheses' ? `(${value})` : `-${value}`;
  }
  if (originalValue > 0 && format.positivePattern === 'plus') {
    return `+${value}`;
  }
  return value;
}

function abbreviateNumber(value: number, format: TextFormatConfig): { value: number; suffix: string } {
  if (!format.useAbbreviation) {
    return { value, suffix: '' };
  }

  const units = [
    { threshold: 1_000_000_000_000, suffix: 'T' },
    { threshold: 1_000_000_000, suffix: 'B' },
    { threshold: 1_000_000, suffix: 'M' },
    { threshold: 1_000, suffix: 'K' },
  ];
  const unit = units.find(item => value >= item.threshold);
  return unit ? { value: value / unit.threshold, suffix: unit.suffix } : { value, suffix: '' };
}

function normalizeSeparator(value: string | undefined, fallback: string): string {
  return value === undefined ? fallback : value;
}

function formatNumber(value: number, pattern: string): string {
  if (!Number.isFinite(value)) return '';
  const negative = value < 0;
  const absoluteValue = Math.abs(value);
  const hasThousands = pattern.includes(',');
  const fraction = pattern.split('.')[1] ?? '';
  const minDecimals = (fraction.match(/0/g) ?? []).length;
  const maxDecimals = fraction.length;
  const decimals = Math.max(minDecimals, maxDecimals);
  const fixed = absoluteValue.toFixed(decimals);
  let [integer, decimal = ''] = fixed.split('.');

  if (hasThousands) {
    integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  const sign = negative ? '-' : '';
  if (maxDecimals === 0) return `${sign}${integer}`;
  if (decimal.length > minDecimals) {
    decimal = decimal.replace(/0+$/g, '');
  }
  while (decimal.length < minDecimals) {
    decimal += '0';
  }

  return decimal ? `${sign}${integer}.${decimal}` : `${sign}${integer}`;
}

function formatDate(value: unknown, pattern: string): string {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';

  const parts: Record<string, string> = {
    yyyy: String(date.getUTCFullYear()).padStart(4, '0'),
    MM: String(date.getUTCMonth() + 1).padStart(2, '0'),
    dd: String(date.getUTCDate()).padStart(2, '0'),
    HH: String(date.getUTCHours()).padStart(2, '0'),
    mm: String(date.getUTCMinutes()).padStart(2, '0'),
    ss: String(date.getUTCSeconds()).padStart(2, '0'),
  };

  return pattern.replace(/yyyy|MM|dd|HH|mm|ss/g, token => parts[token]);
}

function stripPercent(pattern: string): string {
  return pattern.replace('%', '');
}

function formatCustom(value: unknown, pattern: string): string {
  if (!pattern) return value == null ? '' : String(value);
  if (/yyyy|MM|dd|HH|mm|ss/.test(pattern)) {
    return formatDate(value, pattern);
  }
  if (pattern.includes('%')) {
    return `${formatNumber(toNumber(value) * 100, stripPercent(pattern))}%`;
  }
  if (/[#0]/.test(pattern)) {
    return formatCurrency(toNumber(value), pattern);
  }
  return String(value);
}

function clampInteger(value: number | undefined, min: number, max: number, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function toNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? 0 : numberValue;
}
