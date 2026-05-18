import { describe, expect, it } from 'vitest';
import type { ConditionalFormat, EvalContext, RenderedStyle, TextComponent } from '../src';
import { applyConditionalFormatsToStyle, evaluateConditionRule, renderTemplate } from '../src';
import { createDefaultTemplate } from '../src/template-model/template';

function context(row: Record<string, any>): EvalContext {
  return {
    rowIndex: 0,
    variables: { row },
    resolveField: (source, field) => row[field] ?? row[`${source}.${field}`],
  };
}

function textComponent(overrides: Partial<TextComponent> = {}): TextComponent {
  return {
    id: 'text_1',
    type: 'text',
    name: 'Text1',
    x: 0,
    y: 0,
    width: 40,
    height: 8,
    text: '{Orders.Amount}',
    font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#111111' },
    textAlign: 'left',
    verticalAlign: 'top',
    border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    canGrow: false,
    canShrink: false,
    ...overrides,
  };
}

describe('Phase 20 conditional format evaluation', () => {
  it('evaluates expression conditions and treats invalid expressions as false', () => {
    const ctx = context({ Amount: 1200, Status: 'Warning' });

    expect(evaluateConditionRule({ id: 'expr_true', conditionType: 'expression', expression: '{Orders.Amount} > 1000', overrides: {} }, ctx)).toBe(true);
    expect(evaluateConditionRule({ id: 'expr_false', conditionType: 'expression', expression: '{Orders.Amount} < 1000', overrides: {} }, ctx)).toBe(false);
    expect(evaluateConditionRule({ id: 'expr_bad', conditionType: 'expression', expression: '{Orders.Amount} >', overrides: {} }, ctx)).toBe(false);
  });

  it.each([
    ['equalTo', 'Warning', true],
    ['notEqualTo', 'Closed', true],
    ['containing', 'arn', true],
    ['notContaining', 'Paid', true],
    ['beginningWith', 'Warn', true],
    ['endingWith', 'ing', true],
  ] as const)('evaluates string value operator %s', (operator, value, expected) => {
    expect(evaluateConditionRule({
      id: `string_${operator}`,
      conditionType: 'value',
      field: '{Orders.Status}',
      dataType: 'string',
      operator,
      value,
      overrides: {},
    }, context({ Status: 'Warning' }))).toBe(expected);
  });

  it.each([
    ['equalTo', 1200, undefined, true],
    ['notEqualTo', 1000, undefined, true],
    ['between', 1000, 1500, true],
    ['notBetween', 100, 500, true],
    ['greaterThan', 1000, undefined, true],
    ['greaterThanOrEqualTo', 1200, undefined, true],
    ['lessThan', 1500, undefined, true],
    ['lessThanOrEqualTo', 1200, undefined, true],
  ] as const)('evaluates numeric value operator %s', (operator, value, valueTo, expected) => {
    expect(evaluateConditionRule({
      id: `number_${operator}`,
      conditionType: 'value',
      field: '{Orders.Amount}',
      dataType: 'number',
      operator,
      value,
      valueTo,
      overrides: {},
    }, context({ Amount: 1200 }))).toBe(expected);
  });

  it.each([
    ['between', '2026-05-01', '2026-05-31', true],
    ['notBetween', '2026-06-01', '2026-06-30', true],
    ['greaterThanOrEqualTo', '2026-05-08', undefined, true],
    ['lessThan', '2026-05-09', undefined, true],
  ] as const)('evaluates date value operator %s', (operator, value, valueTo, expected) => {
    expect(evaluateConditionRule({
      id: `date_${operator}`,
      conditionType: 'value',
      field: '{Orders.CreatedAt}',
      dataType: 'date',
      operator,
      value,
      valueTo,
      overrides: {},
    }, context({ CreatedAt: '2026-05-08' }))).toBe(expected);
  });

  it.each([
    ['equalTo', true, true],
    ['notEqualTo', false, true],
  ] as const)('evaluates boolean value operator %s', (operator, value, expected) => {
    expect(evaluateConditionRule({
      id: `boolean_${operator}`,
      conditionType: 'value',
      field: '{Orders.Paid}',
      dataType: 'boolean',
      operator,
      value,
      overrides: {},
    }, context({ Paid: true }))).toBe(expected);
  });

  it('evaluates expression-typed value conditions by resolving both sides as expressions', () => {
    expect(evaluateConditionRule({
      id: 'expression_value',
      conditionType: 'value',
      field: '{Orders.Amount}',
      dataType: 'expression',
      operator: 'greaterThan',
      value: '{Orders.Target}',
      overrides: {},
    }, context({ Amount: 1200, Target: 1000 }))).toBe(true);
    expect(evaluateConditionRule({
      id: 'expression_value_false',
      conditionType: 'value',
      field: '{Orders.Amount}',
      dataType: 'expression',
      operator: 'greaterThan',
      value: '{Orders.Target}',
      overrides: {},
    }, context({ Amount: 1200, Target: 2000 }))).toBe(false);
  });

  it('evaluates expression and value rules with typed operators', () => {
    const ctx = context({ Amount: 1200, Status: 'Warning', CreatedAt: '2026-05-08', Paid: true });

    expect(evaluateConditionRule({ id: 'r1', expression: '{Orders.Amount} > 1000', overrides: {} }, ctx)).toBe(true);
    expect(evaluateConditionRule({ id: 'r2', conditionType: 'value', field: '{Orders.Status}', dataType: 'string', operator: 'containing', value: 'Warn', overrides: {} }, ctx)).toBe(true);
    expect(evaluateConditionRule({ id: 'r3', conditionType: 'value', field: '{Orders.Amount}', dataType: 'number', operator: 'between', value: 1000, valueTo: 1500, overrides: {} }, ctx)).toBe(true);
    expect(evaluateConditionRule({ id: 'r4', conditionType: 'value', field: '{Orders.CreatedAt}', dataType: 'date', operator: 'greaterThanOrEqualTo', value: '2026-05-01', overrides: {} }, ctx)).toBe(true);
    expect(evaluateConditionRule({ id: 'r5', conditionType: 'value', field: '{Orders.Paid}', dataType: 'boolean', operator: 'equalTo', value: true, overrides: {} }, ctx)).toBe(true);
  });

  it('applies component-selected rules in order and stops on breakIfTrue', () => {
    const base: RenderedStyle = {
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#111111' },
      background: '#ffffff',
      border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
      textAlign: 'left',
    };
    const formats: ConditionalFormat[] = [{
      id: 'cf_high',
      name: 'High amount',
      applyTo: [],
      rules: [
        {
          id: 'r1',
          expression: '{Orders.Amount} > 1000',
          overrides: { fontColor: '#ff0000', backgroundColor: '#fff1f0', fontWeight: true },
          breakIfTrue: true,
        },
        {
          id: 'r2',
          expression: '{Orders.Amount} > 1000',
          overrides: { backgroundColor: '#000000' },
        },
      ],
    }];

    const style = applyConditionalFormatsToStyle(base, formats, textComponent({ conditionalFormat: 'cf_high' }), context({ Amount: 1200 }));

    expect(style.font).toMatchObject({ color: '#ff0000', bold: true });
    expect(style.background).toBe('#fff1f0');
    expect(style.background).not.toBe('#000000');
  });

  it('keeps historical applyTo formats and skips disabled matching rules', () => {
    const base: RenderedStyle = {
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#111111' },
    };
    const formats: ConditionalFormat[] = [{
      id: 'cf_historical',
      name: 'Historical',
      applyTo: ['text_1'],
      rules: [
        { id: 'disabled', enabled: false, expression: '{Orders.Amount} > 1000', overrides: { fontColor: '#ff0000' } },
        { id: 'active', expression: '{Orders.Amount} > 1000', overrides: { fontStyle: true, textDecoration: true, fontSize: 14 } },
      ],
    }];

    const style = applyConditionalFormatsToStyle(base, formats, textComponent(), context({ Amount: 1200 }));

    expect(style.font).toMatchObject({ italic: true, underline: true, size: 14, color: '#111111' });
  });

  it('omits rendered components when a condition disables them', () => {
    const template = createDefaultTemplate('Conditional Render');
    const dataBand = template.pages[0].bands.find(band => band.type === 'data')!;
    dataBand.dataBand = { dataSourceId: 'Orders' };
    dataBand.components = [textComponent({ conditionalFormat: 'cf_hide' })];
    template.conditionalFormats = [{
      id: 'cf_hide',
      name: 'Hide low amount',
      applyTo: [],
      rules: [{
        id: 'r1',
        conditionType: 'value',
        field: '{Orders.Amount}',
        dataType: 'number',
        operator: 'lessThan',
        value: 100,
        overrides: { enabled: false },
      }],
    }];

    const tree = renderTemplate(template, { Orders: [{ Amount: 50 }, { Amount: 200 }] });
    const renderedRows = tree.pages[0].bands.filter(band => band.type === 'data');

    expect(renderedRows[0].components).toHaveLength(0);
    expect(renderedRows[1].components).toHaveLength(1);
  });
});
