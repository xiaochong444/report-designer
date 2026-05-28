const DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
const INNER_UNITS = ['', '拾', '佰', '仟'];
const SECTION_UNITS = ['', '万', '亿', '兆'];

export function formatChineseRmbUppercase(value: unknown): string {
  const normalized = toCents(value);
  if (normalized === null) return '';
  const sign = normalized < 0 ? '负' : '';
  const absolute = Math.abs(normalized);
  const integerPart = Math.floor(absolute / 100);
  const fractionPart = Math.round(absolute % 100);

  const integerText = formatIntegerPart(integerPart);
  const fractionText = formatFractionPart(fractionPart, integerPart > 0);

  if (integerPart === 0 && fractionPart === 0) {
    return `${sign}零元整`;
  }

  return `${sign}${integerText}${fractionText}`;
}

function toCents(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue)) return null;
  return Math.round(numberValue * 100);
}

function formatIntegerPart(integerPart: number): string {
  if (integerPart === 0) return '零元';

  const sections: Array<{ value: number; index: number }> = [];
  let remaining = integerPart;
  let sectionIndex = 0;

  while (remaining > 0) {
    sections.push({ value: remaining % 10000, index: sectionIndex });
    remaining = Math.floor(remaining / 10000);
    sectionIndex += 1;
  }

  let result = '';
  let zeroPending = false;
  for (let index = sections.length - 1; index >= 0; index -= 1) {
    const section = sections[index];
    if (section.value === 0) {
      zeroPending = result.length > 0;
      continue;
    }
    if (result && (zeroPending || section.value < 1000)) {
      result += '零';
    }
    result += `${formatSection(section.value)}${SECTION_UNITS[section.index] ?? ''}`;
    zeroPending = false;
  }

  return `${result}元`;
}

function formatSection(section: number): string {
  let result = '';
  let zeroPending = false;

  for (let unitIndex = 3; unitIndex >= 0; unitIndex -= 1) {
    const unitValue = 10 ** unitIndex;
    const digit = Math.floor(section / unitValue) % 10;
    if (digit === 0) {
      zeroPending = result.length > 0;
      continue;
    }
    if (zeroPending) {
      result += '零';
      zeroPending = false;
    }
    result += DIGITS[digit] + INNER_UNITS[unitIndex];
  }

  return result;
}

function formatFractionPart(fractionPart: number, hasInteger: boolean): string {
  const jiao = Math.floor(fractionPart / 10);
  const fen = fractionPart % 10;

  if (jiao === 0 && fen === 0) {
    return '整';
  }

  let text = '';
  if (jiao > 0) {
    text += `${DIGITS[jiao]}角`;
  } else if (fen > 0 && hasInteger) {
    text += '零';
  }

  if (fen > 0) {
    text += `${DIGITS[fen]}分`;
  }

  return text;
}
