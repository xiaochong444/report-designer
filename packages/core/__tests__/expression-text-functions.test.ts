import { describe, expect, it } from 'vitest';
import { evalExpression } from '../src/expression-engine';

describe('expression text filter functions', () => {
  const resolveField = (_source: string, field: string) => ({
    name: 'Alice Adams',
  })[field];

  it('evaluates text containment helpers for data band filters', () => {
    expect(evalExpression('CONTAINS({orders.name}, "ice")', resolveField)).toBe(true);
    expect(evalExpression('STARTSWITH({orders.name}, "Ali")', resolveField)).toBe(true);
    expect(evalExpression('ENDSWITH({orders.name}, "ams")', resolveField)).toBe(true);
    expect(evalExpression('CONTAINS({orders.name}, "Bob")', resolveField)).toBe(false);
  });
});
