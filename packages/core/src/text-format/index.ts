import type { TextFormatConfig } from '../template-model/types';

export function formatValue(value: unknown, format?: TextFormatConfig): string {
  if (!format || format.type === 'none') return value == null ? '' : String(value);
  if (value == null || value === '') return format.nullValue ?? '';

  switch (format.type) {
    case 'boolean':
      return Boolean(value) ? format.trueText ?? 'True' : format.falseText ?? 'False';
    case 'date':
      return formatDate(value, format.pattern ?? 'yyyy-MM-dd');
    case 'time':
      return formatDate(value, format.pattern ?? 'HH:mm:ss');
    case 'percent':
      return `${formatNumber(toNumber(value) * 100, stripPercent(format.pattern ?? '0.00%'))}%`;
    case 'currency':
      return formatCurrency(toNumber(value), format.pattern ?? '$#,##0.00');
    case 'number':
    case 'custom':
      return formatNumber(toNumber(value), format.pattern ?? '#,##0.##');
    default:
      return String(value);
  }
}

function formatCurrency(value: number, pattern: string): string {
  const numericPattern = pattern.replace(/[^#0.,]+/g, '') || '#,##0.00';
  const prefix = pattern.match(/^[^#0.,]+/)?.[0] ?? '';
  const suffix = pattern.match(/[^#0.,]+$/)?.[0] ?? '';
  return `${prefix}${formatNumber(value, numericPattern)}${suffix}`;
}

function formatNumber(value: number, pattern: string): string {
  if (!Number.isFinite(value)) return '';
  const hasThousands = pattern.includes(',');
  const fraction = pattern.split('.')[1] ?? '';
  const minDecimals = (fraction.match(/0/g) ?? []).length;
  const maxDecimals = fraction.length;
  const decimals = Math.max(minDecimals, maxDecimals);
  const fixed = value.toFixed(decimals);
  let [integer, decimal = ''] = fixed.split('.');

  if (hasThousands) {
    integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  if (maxDecimals === 0) return integer;
  if (decimal.length > minDecimals) {
    decimal = decimal.replace(/0+$/g, '');
  }
  while (decimal.length < minDecimals) {
    decimal += '0';
  }

  return decimal ? `${integer}.${decimal}` : integer;
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

function toNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? 0 : numberValue;
}
