import { describe, it, expect } from 'vitest';
import type { ConditionalFormat, ConditionRule } from '@report-designer/core';

describe('Task J: 条件格式', () => {
  describe('ConditionalFormat type', () => {
    it('should have correct structure', () => {
      const format: ConditionalFormat = {
        id: 'cf_1',
        name: 'Highlight High Values',
        rules: [],
        applyTo: ['comp_1', 'comp_2'],
      };
      expect(format.id).toBe('cf_1');
      expect(format.name).toBe('Highlight High Values');
      expect(format.applyTo).toHaveLength(2);
    });

    it('should support multiple rules', () => {
      const rules: ConditionRule[] = [
        {
          id: 'rule_1',
          expression: '{Data.Amount} > 1000',
          overrides: { fontColor: '#ff0000', fontWeight: 'bold' },
        },
        {
          id: 'rule_2',
          expression: '{Data.Status} == "Warning"',
          overrides: { backgroundColor: '#ffff00' },
        },
      ];
      const format: ConditionalFormat = {
        id: 'cf_1',
        name: 'Multi-rule Format',
        rules,
        applyTo: ['comp_1'],
      };
      expect(format.rules).toHaveLength(2);
      expect(format.rules[0].expression).toBe('{Data.Amount} > 1000');
      expect(format.rules[0].overrides.fontColor).toBe('#ff0000');
      expect(format.rules[1].overrides.backgroundColor).toBe('#ffff00');
    });
  });

  describe('ConditionRule overrides', () => {
    it('should support all override fields', () => {
      const rule: ConditionRule = {
        id: 'rule_1',
        expression: '{Data.Value} > 0',
        overrides: {
          fontWeight: 'bold',
          fontStyle: 'italic',
          textDecoration: 'underline',
          fontColor: '#ff0000',
          fontSize: 14,
          backgroundColor: '#e6f7ff',
          textAlign: 'center',
          border: 'solid',
        },
      };
      expect(rule.overrides.fontWeight).toBe('bold');
      expect(rule.overrides.fontStyle).toBe('italic');
      expect(rule.overrides.textDecoration).toBe('underline');
      expect(rule.overrides.fontColor).toBe('#ff0000');
      expect(rule.overrides.fontSize).toBe(14);
      expect(rule.overrides.backgroundColor).toBe('#e6f7ff');
      expect(rule.overrides.textAlign).toBe('center');
      expect(rule.overrides.border).toBe('solid');
    });

    it('should support boolean toggle overrides', () => {
      const rule: ConditionRule = {
        id: 'rule_1',
        expression: '1',
        overrides: {
          fontWeight: true,
          fontStyle: true,
          textDecoration: true,
        },
      };
      expect(rule.overrides.fontWeight).toBe(true);
      expect(rule.overrides.fontStyle).toBe(true);
      expect(rule.overrides.textDecoration).toBe(true);
    });
  });

  describe('ConditionalFormatManager operations', () => {
    it('should create new format with empty rules', () => {
      const newFormat: ConditionalFormat = {
        id: 'cf_new',
        name: 'New Format',
        rules: [],
        applyTo: [],
      };
      expect(newFormat.rules).toHaveLength(0);
      expect(newFormat.applyTo).toHaveLength(0);
    });

    it('should add rule to existing format', () => {
      const format: ConditionalFormat = {
        id: 'cf_1',
        name: 'Format',
        rules: [],
        applyTo: [],
      };
      const newRule: ConditionRule = {
        id: 'rule_1',
        expression: '{Data.X} > 100',
        overrides: { backgroundColor: '#ff0' },
      };
      const updated: ConditionalFormat = { ...format, rules: [...format.rules, newRule] };
      expect(updated.rules).toHaveLength(1);
      expect(updated.rules[0].expression).toBe('{Data.X} > 100');
    });

    it('should delete rule from format', () => {
      const format: ConditionalFormat = {
        id: 'cf_1',
        name: 'Format',
        rules: [
          { id: 'rule_1', expression: 'A > 1', overrides: {} },
          { id: 'rule_2', expression: 'B > 2', overrides: {} },
        ],
        applyTo: [],
      };
      const updated: ConditionalFormat = {
        ...format,
        rules: format.rules.filter(r => r.id !== 'rule_1'),
      };
      expect(updated.rules).toHaveLength(1);
      expect(updated.rules[0].id).toBe('rule_2');
    });

    it('should update rule expression', () => {
      const rule: ConditionRule = {
        id: 'rule_1',
        expression: 'old expression',
        overrides: {},
      };
      const updated: ConditionRule = { ...rule, expression: '{Data.NewField} > 0' };
      expect(updated.expression).toBe('{Data.NewField} > 0');
    });

    it('should update rule overrides incrementally', () => {
      const rule: ConditionRule = {
        id: 'rule_1',
        expression: '1',
        overrides: {},
      };
      // Simulate adding overrides one by one
      const step1 = { ...rule, overrides: { ...rule.overrides, fontColor: '#f00' } };
      const step2 = { ...step1, overrides: { ...step1.overrides, backgroundColor: '#0f0' } };
      const step3 = { ...step2, overrides: { ...step2.overrides, fontWeight: 'bold' } };
      expect(step3.overrides).toEqual({
        fontColor: '#f00',
        backgroundColor: '#0f0',
        fontWeight: 'bold',
      });
    });
  });
});
