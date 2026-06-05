import { describe, expect, it } from 'vitest';
import { AggregateRuntime, evalExpression } from '../src';

const rows = [
  { Name: 'Alice', Department: 'Engineering', Salary: 100 },
  { Name: 'Bob', Department: 'Engineering', Salary: 200 },
  { Name: 'Cara', Department: 'Sales', Salary: 150 },
];

describe('Phase 2 aggregates', () => {
  it('calculates common report aggregates over json rows', () => {
    const runtime = new AggregateRuntime({ rowsByBand: { employees: rows } });

    expect(runtime.calculate('SUM', 'employees', '{employees.Salary}')).toBe(450);
    expect(runtime.calculate('AVG', 'employees', '{employees.Salary}')).toBe(150);
    expect(runtime.calculate('COUNT', 'employees')).toBe(3);
    expect(runtime.calculate('COUNTDISTINCT', 'employees', '{employees.Department}')).toBe(2);
    expect(runtime.calculate('SUMIF', 'employees', '{employees.Salary}', '{employees.Department} = "Engineering"')).toBe(300);
  });

  it('supports running totals by current data row', () => {
    const runtime = new AggregateRuntime({ rowsByBand: { employees: rows } });
    const result = runtime.evaluateFunction('RUNNINGSUM', ['{employees.Salary}'], {
      resolveField: () => null,
      rowIndex: 1,
    });

    expect(result).toBe(300);
  });

  it('delegates single-field aggregate expressions to the report runtime while preserving scalar calls', () => {
    const runtime = new AggregateRuntime({ rowsByBand: { employees: rows }, pageNumber: 2, totalPages: 5 });

    expect(evalExpression('SUM(1, 2, 3)', () => null)).toBe(6);
    expect(evalExpression('SUM({employees.Salary})', () => null, 0, {}, runtime)).toBe(450);
    expect(evalExpression('AVG({employees.Salary})', () => null, 0, {}, runtime)).toBe(150);
    expect(evalExpression('COUNT({employees.Salary})', () => null, 0, {}, runtime)).toBe(3);
    expect(evalExpression('COUNTDISTINCT({employees.Department})', () => null, 0, {}, runtime)).toBe(2);
    expect(evalExpression('SUMIF({employees.Salary}, "{employees.Department} = \\"Engineering\\"")', () => null, 0, {}, runtime)).toBe(300);
    expect(evalExpression('COUNTIF("{employees.Department} = \\"Engineering\\"")', () => null, 0, {}, runtime)).toBe(2);
    expect(evalExpression('RUNNINGSUM({employees.Salary})', () => null, 1, {}, runtime)).toBe(300);
    expect(evalExpression('PAGE()', () => null, 0, {}, runtime)).toBe(2);
    expect(evalExpression('TOTALPAGES()', () => null, 0, {}, runtime)).toBe(5);
  });

  it('rejects legacy source-first aggregate signatures when a report runtime is present', () => {
    const runtime = new AggregateRuntime({ rowsByBand: { employees: rows } });

    expect(() => evalExpression('SUM("employees", "{employees.Salary}")', () => null, 0, {}, runtime)).toThrow(
      'Aggregate functions use field expressions, for example SUM({employees.Salary}).',
    );
    expect(() => evalExpression('COUNT("employees")', () => null, 0, {}, runtime)).toThrow(
      'Aggregate functions use field expressions, for example SUM({employees.Salary}).',
    );
  });
});
