import type { ConditionalFormat, ConditionRule, FontConfig, BorderConfig, ReportComponent } from '../template-model/types';
import type { EvalContext } from '../expression-engine/evaluator';
import { evalExpression } from '../expression-engine';

export interface ConditionalRenderedStyle {
  font?: FontConfig;
  background?: string;
  border?: BorderConfig;
  padding?: unknown;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  format?: unknown;
  canGrow?: boolean;
  canShrink?: boolean;
  enabled?: boolean;
}

export function evaluateConditionRule(rule: ConditionRule, ctx: EvalContext): boolean {
  if (rule.enabled === false) return false;
  if ((rule.conditionType ?? 'expression') === 'value') {
    return evaluateValueCondition(rule, ctx);
  }

  const expression = rule.expression?.trim();
  if (!expression) return false;
  try {
    return Boolean(evalExpression(expression, ctx.resolveField.bind(ctx), ctx.rowIndex, ctx.variables, ctx.reportRuntime, ctx.functions));
  } catch {
    return false;
  }
}

export function applyConditionalFormatsToStyle<TStyle extends ConditionalRenderedStyle>(
  baseStyle: TStyle,
  formats: ConditionalFormat[],
  component: ReportComponent,
  ctx: EvalContext,
): TStyle {
  let style: TStyle = cloneStyle(baseStyle);
  const applicableFormats = formats.filter(format => isFormatApplicable(format, component));

  for (const format of applicableFormats) {
    for (const rule of format.rules) {
      if (!evaluateConditionRule(rule, ctx)) continue;
      style = mergeConditionalOverrides(style, rule.overrides);
      if (rule.breakIfTrue) return style;
    }
  }

  return style;
}

function isFormatApplicable(format: ConditionalFormat, component: ReportComponent) {
  if (component.conditionalFormat && component.conditionalFormat === format.id) return true;
  if (format.applyTo?.includes(component.id)) return true;
  return !component.conditionalFormat && (!format.applyTo || format.applyTo.length === 0);
}

function evaluateValueCondition(rule: ConditionRule, ctx: EvalContext) {
  const left = resolveRuleValue(rule.field ?? rule.expression, ctx);
  const rightRaw = rule.dataType === 'expression' ? resolveRuleValue(rule.value, ctx) : rule.value;
  const rightToRaw = rule.dataType === 'expression' ? resolveRuleValue(rule.valueTo, ctx) : rule.valueTo;
  const right = coerceByType(rightRaw, rule.dataType);
  const rightTo = coerceByType(rightToRaw, rule.dataType);
  const [a, b] = [coerceByType(left, rule.dataType), right];

  switch (rule.operator ?? 'equalTo') {
    case 'equalTo':
      return compare(a, b) === 0;
    case 'notEqualTo':
      return compare(a, b) !== 0;
    case 'between':
      return compare(a, b) >= 0 && compare(a, rightTo) <= 0;
    case 'notBetween':
      return !(compare(a, b) >= 0 && compare(a, rightTo) <= 0);
    case 'greaterThan':
      return compare(a, b) > 0;
    case 'greaterThanOrEqualTo':
      return compare(a, b) >= 0;
    case 'lessThan':
      return compare(a, b) < 0;
    case 'lessThanOrEqualTo':
      return compare(a, b) <= 0;
    case 'containing':
      return String(a ?? '').includes(String(b ?? ''));
    case 'notContaining':
      return !String(a ?? '').includes(String(b ?? ''));
    case 'beginningWith':
      return String(a ?? '').startsWith(String(b ?? ''));
    case 'endingWith':
      return String(a ?? '').endsWith(String(b ?? ''));
    default:
      return false;
  }
}

function resolveRuleValue(value: unknown, ctx: EvalContext) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    return evalExpression(trimmed, ctx.resolveField.bind(ctx), ctx.rowIndex, ctx.variables, ctx.reportRuntime, ctx.functions);
  } catch {
    return value;
  }
}

function coerceByType(value: unknown, dataType?: ConditionRule['dataType']) {
  if (value == null) return value;
  if (dataType === 'number') {
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? value : numberValue;
  }
  if (dataType === 'date') {
    const time = new Date(String(value)).getTime();
    return Number.isNaN(time) ? value : time;
  }
  if (dataType === 'boolean') {
    if (typeof value === 'boolean') return value;
    return ['true', '1', 'yes', 'y'].includes(String(value).toLowerCase());
  }
  return value;
}

function compare(left: unknown, right: unknown) {
  if (left === right) return 0;
  if (left == null && right == null) return 0;
  if (left == null) return -1;
  if (right == null) return 1;
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right), undefined, { numeric: true });
}

function mergeConditionalOverrides<TStyle extends ConditionalRenderedStyle>(style: TStyle, overrides: Record<string, any>): TStyle {
  const next: ConditionalRenderedStyle = cloneStyle(style);
  const nextFont: FontConfig | undefined = next.font ? { ...next.font } : undefined;
  const nextBorder: BorderConfig | undefined = next.border ? { ...next.border, sides: { ...next.border.sides } } : undefined;

  if (overrides.font) next.font = { ...(nextFont ?? {}), ...overrides.font } as FontConfig;
  if (overrides.fontWeight !== undefined || overrides.bold !== undefined) {
    next.font = { ...(next.font ?? nextFont ?? {}), bold: normalizeToggle(overrides.fontWeight ?? overrides.bold) } as FontConfig;
  }
  if (overrides.fontStyle !== undefined || overrides.italic !== undefined) {
    next.font = { ...(next.font ?? nextFont ?? {}), italic: normalizeToggle(overrides.fontStyle ?? overrides.italic) } as FontConfig;
  }
  if (overrides.textDecoration !== undefined || overrides.underline !== undefined) {
    next.font = { ...(next.font ?? nextFont ?? {}), underline: normalizeToggle(overrides.textDecoration ?? overrides.underline) } as FontConfig;
  }
  if (overrides.strikethrough !== undefined) {
    next.font = { ...(next.font ?? nextFont ?? {}), strikethrough: normalizeToggle(overrides.strikethrough) } as FontConfig;
  }
  if (overrides.fontColor !== undefined) {
    next.font = { ...(next.font ?? nextFont ?? {}), color: overrides.fontColor } as FontConfig;
  }
  if (overrides.fontSize !== undefined) {
    next.font = { ...(next.font ?? nextFont ?? {}), size: Number(overrides.fontSize) } as FontConfig;
  }
  if (overrides.backgroundColor !== undefined) next.background = overrides.backgroundColor;
  if (overrides.border) {
    next.border = typeof overrides.border === 'string'
      ? { ...(nextBorder ?? defaultBorder()), style: overrides.border }
      : { ...(nextBorder ?? defaultBorder()), ...overrides.border, sides: { ...(nextBorder?.sides ?? defaultBorder().sides), ...(overrides.border.sides ?? {}) } };
  }
  if (overrides.textAlign) next.textAlign = overrides.textAlign;
  if (overrides.verticalAlign) next.verticalAlign = overrides.verticalAlign;
  if (overrides.enabled !== undefined) next.enabled = Boolean(overrides.enabled);

  return next as TStyle;
}

function normalizeToggle(value: unknown) {
  return value === true || value === 'bold' || value === 'italic' || value === 'underline' || value === 'strikethrough';
}

function defaultBorder(): BorderConfig {
  return { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } };
}

function cloneStyle<TStyle extends ConditionalRenderedStyle>(style: TStyle): TStyle {
  return {
    ...style,
    font: style.font ? { ...style.font } : undefined,
    border: style.border ? { ...style.border, sides: { ...style.border.sides } } : undefined,
  };
}
