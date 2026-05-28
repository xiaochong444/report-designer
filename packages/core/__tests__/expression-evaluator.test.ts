import { describe, it, expect } from 'vitest';
import { tokenize } from '../src/expression-engine/lexer';
import { parse } from '../src/expression-engine/parser';
import { evaluate, evalExpression, builtinFunctions } from '../src/expression-engine/evaluator';

const makeCtx = (data: Record<string, any>) => ({
  resolveField: (source: string, field: string) => {
    const key = source ? `${source}.${field}` : field;
    return data[key] ?? null;
  },
});

const evalExpr = (expr: string, data: Record<string, any> = {}) => {
  const tokens = tokenize(expr);
  const ast = parse(tokens);
  return evaluate(ast, makeCtx(data));
};

describe('Evaluator - Literals', () => {
  it('should evaluate string literals', () => {
    expect(evalExpr('"hello"')).toBe('hello');
  });

  it('should evaluate number literals', () => {
    expect(evalExpr('42')).toBe(42);
  });

  it('should evaluate boolean literals', () => {
    expect(evalExpr('true')).toBe(true);
    expect(evalExpr('false')).toBe(false);
  });
});

describe('Evaluator - Field References', () => {
  it('should resolve field references', () => {
    const data = { 'Employee.Name': 'John' };
    expect(evalExpr('{Employee.Name}', data)).toBe('John');
  });

  it('should resolve field references without source', () => {
    const data = { 'Name': 'Jane' };
    expect(evalExpr('{Name}', data)).toBe('Jane');
  });
});

describe('Evaluator - Arithmetic', () => {
  it('should evaluate addition', () => {
    expect(evalExpr('10 + 5')).toBe(15);
  });

  it('should evaluate subtraction', () => {
    expect(evalExpr('10 - 3')).toBe(7);
  });

  it('should evaluate multiplication', () => {
    expect(evalExpr('4 * 3')).toBe(12);
  });

  it('should evaluate division', () => {
    expect(evalExpr('10 / 2')).toBe(5);
  });

  it('should return null on division by zero', () => {
    expect(evalExpr('10 / 0')).toBe(null);
  });

  it('should evaluate modulo', () => {
    expect(evalExpr('10 % 3')).toBe(1);
  });

  it('should respect operator precedence', () => {
    expect(evalExpr('2 + 3 * 4')).toBe(14);
  });

  it('should respect parentheses', () => {
    expect(evalExpr('(2 + 3) * 4')).toBe(20);
  });

  it('should evaluate with field references', () => {
    const data = { 'A.X': 10, 'B.Y': 5 };
    expect(evalExpr('{A.X} + {B.Y}', data)).toBe(15);
  });
});

describe('Evaluator - Comparison', () => {
  it('should evaluate greater than', () => {
    expect(evalExpr('10 > 5')).toBe(true);
    expect(evalExpr('5 > 10')).toBe(false);
  });

  it('should evaluate equals', () => {
    expect(evalExpr('5 = 5')).toBe(true);
    expect(evalExpr('5 = 3')).toBe(false);
  });

  it('should evaluate not equals', () => {
    expect(evalExpr('5 != 3')).toBe(true);
    expect(evalExpr('5 != 5')).toBe(false);
  });

  it('should compare strings', () => {
    expect(evalExpr('"a" = "a"')).toBe(true);
    expect(evalExpr('"a" != "b"')).toBe(true);
  });
});

describe('Evaluator - Logical', () => {
  it('should evaluate AND', () => {
    expect(evalExpr('true AND true')).toBe(true);
    expect(evalExpr('true AND false')).toBe(false);
  });

  it('should evaluate OR', () => {
    expect(evalExpr('false OR true')).toBe(true);
    expect(evalExpr('false OR false')).toBe(false);
  });

  it('should evaluate NOT', () => {
    expect(evalExpr('NOT true')).toBe(false);
    expect(evalExpr('NOT false')).toBe(true);
  });
});

describe('Evaluator - Functions', () => {
  it('should evaluate IF', () => {
    expect(evalExpr('IF(true, "yes", "no")')).toBe('yes');
    expect(evalExpr('IF(false, "yes", "no")')).toBe('no');
  });

  it('should evaluate ISNULL', () => {
    expect(evalExpr('ISNULL(null)')).toBe(true);
    expect(evalExpr('ISNULL(1)')).toBe(false);
  });

  it('should evaluate COALESCE', () => {
    expect(evalExpr('COALESCE(null, null, 42)')).toBe(42);
  });

  it('should evaluate SUM', () => {
    expect(evalExpr('SUM(1, 2, 3)')).toBe(6);
  });

  it('should evaluate AVG', () => {
    expect(evalExpr('AVG(1, 2, 3)')).toBe(2);
  });

  it('should evaluate MIN/MAX', () => {
    expect(evalExpr('MIN(1, 5, 3)')).toBe(1);
    expect(evalExpr('MAX(1, 5, 3)')).toBe(5);
  });

  it('should evaluate ROUND', () => {
    expect(evalExpr('ROUND(3.14159, 2)')).toBe(3.14);
  });

  it('should evaluate CEIL/FLOOR', () => {
    expect(evalExpr('CEIL(3.1)')).toBe(4);
    expect(evalExpr('FLOOR(3.9)')).toBe(3);
  });

  it('should evaluate ABS', () => {
    expect(evalExpr('ABS(-5)')).toBe(5);
  });

  it('should evaluate CONCAT', () => {
    expect(evalExpr('CONCAT("Hello", " ", "World")')).toBe('Hello World');
  });

  it('should evaluate LEN', () => {
    expect(evalExpr('LEN("hello")')).toBe(5);
  });

  it('should evaluate UPPER/LOWER', () => {
    expect(evalExpr('UPPER("hello")')).toBe('HELLO');
    expect(evalExpr('LOWER("HELLO")')).toBe('hello');
  });

  it('should evaluate TRIM', () => {
    expect(evalExpr('TRIM("  hello  ")')).toBe('hello');
  });

  it('should evaluate SUBSTRING', () => {
    expect(evalExpr('SUBSTRING("hello", 1, 3)')).toBe('ell');
  });

  it('should evaluate FORMAT', () => {
    expect(evalExpr('FORMAT("N2", 3.14159)')).toBe('3.14');
    expect(evalExpr('FORMAT("C", 99.9)')).toBe('$99.90');
  });

  it('should convert currency amounts to Chinese uppercase RMB text', () => {
    expect(evalExpr('RMBUPPER(1234.56)')).toBe('壹仟贰佰叁拾肆元伍角陆分');
    expect(evalExpr('MONEYUPPER(100100000.01)')).toBe('壹亿零壹拾万元零壹分');
    expect(evalExpr('CNYUPPER(0)')).toBe('零元整');
    expect(evalExpr('RMBUPPER(-12.3)')).toBe('负壹拾贰元叁角');
  });

  it('should evaluate TOSTRING/TONUMBER', () => {
    expect(evalExpr('TOSTRING(42)')).toBe('42');
    expect(evalExpr('TONUMBER("42")')).toBe(42);
  });

  it('should evaluate NOW/TODAY', () => {
    const now = evalExpr('NOW()');
    expect(now instanceof Date).toBe(true);
    const today = evalExpr('TODAY()');
    expect(today instanceof Date).toBe(true);
    expect(today.getHours()).toBe(0);
  });
});

describe('Evaluator - Complex Expressions', () => {
  it('should evaluate nested IF with comparison', () => {
    const data = { 'Employee.Salary': 5000 };
    const result = evalExpr('IF({Employee.Salary} > 3000, "high", "low")', data);
    expect(result).toBe('high');
  });

  it('should evaluate logical combination', () => {
    const data = { 'A.X': 15, 'B.Y': 8 };
    const result = evalExpr('{A.X} > 10 AND {B.Y} < 10', data);
    expect(result).toBe(true);
  });
});

describe('Evaluator - Function Registry', () => {
  it('should have at least 25 built-in functions', () => {
    expect(Object.keys(builtinFunctions).length).toBeGreaterThanOrEqual(25);
  });
});
