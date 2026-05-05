import { tokenize } from './lexer';
import { parse } from './parser';
import type { ASTNode, LiteralNode, FieldRefNode, BinaryOpNode, UnaryOpNode, FunctionCallNode } from './ast';
import { ASTNodeType } from './ast';
import type { DataContext } from '../template-model/types';
import { evaluateReportFunction } from './report-functions';

/** Evaluation context extends DataContext with current row data */
export interface EvalContext {
  /** Field value resolver: given source.field path, return the value */
  resolveField: (source: string, field: string) => any;
  /** Current row index (0-based) */
  rowIndex?: number;
  /** Optional variables map */
  variables?: Record<string, any>;
  /** Optional report runtime for Stimulsoft-style aggregate and page functions */
  reportRuntime?: ReportFunctionRuntime;
}

/** Built-in function registry */
export type BuiltinFunction = (args: any[], ctx: EvalContext) => any;
export const builtinFunctions: Record<string, BuiltinFunction> = {};

export interface ReportFunctionRuntime {
  pageNumber?: number;
  totalPages?: number;
  evaluateFunction: (functionName: string, args: any[], ctx: EvalContext) => any;
}

function reg(name: string, fn: BuiltinFunction) {
  builtinFunctions[name.toUpperCase()] = fn;
}

// ---- Utility functions ----

function toNumber(v: any): number {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function toString(v: any): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

function isNumeric(v: any): boolean {
  return !Number.isNaN(Number(v)) && v !== null && v !== undefined && v !== '';
}

function coerceCompare(a: any, b: any): [any, any] {
  if (isNumeric(a) && isNumeric(b)) return [toNumber(a), toNumber(b)];
  return [toString(a), toString(b)];
}

function evalArg(arg: ASTNode, ctx: EvalContext): any {
  return evaluate(arg, ctx);
}

function evalNumericArg(arg: ASTNode, ctx: EvalContext): number {
  return toNumber(evalArg(arg, ctx));
}

// ---- Built-in Functions ----

reg('IF', (args, ctx) => {
  if (args.length !== 3) throw new Error('IF requires exactly 3 arguments');
  return args[0] ? args[1] : args[2];
});

reg('IIF', (args, ctx) => {
  if (args.length !== 3) throw new Error('IIF requires exactly 3 arguments');
  return args[0] ? args[1] : args[2];
});

reg('ISNULL', (args, ctx) => {
  if (args.length < 1) throw new Error('ISNULL requires at least 1 argument');
  return args[0] === null || args[0] === undefined;
});

reg('COALESCE', (args, ctx) => {
  for (const arg of args) {
    if (arg !== null && arg !== undefined) return arg;
  }
  return null;
});

reg('SUM', (args, ctx) => {
  return evaluateReportFunction('SUM', args, ctx, (scalarArgs) => scalarArgs.reduce((acc, v) => acc + toNumber(v), 0));
});

reg('AVG', (args, ctx) => {
  return evaluateReportFunction('AVG', args, ctx, (scalarArgs) => {
    if (scalarArgs.length === 0) return 0;
    return scalarArgs.reduce((acc, v) => acc + toNumber(v), 0) / scalarArgs.length;
  });
});

reg('MIN', (args, ctx) => {
  return evaluateReportFunction('MIN', args, ctx, (scalarArgs) => {
    if (scalarArgs.length === 0) return null;
    return Math.min(...scalarArgs.map(toNumber));
  });
});

reg('MAX', (args, ctx) => {
  return evaluateReportFunction('MAX', args, ctx, (scalarArgs) => {
    if (scalarArgs.length === 0) return null;
    return Math.max(...scalarArgs.map(toNumber));
  });
});

reg('COUNT', (args, ctx) => {
  return evaluateReportFunction('COUNT', args, ctx, (scalarArgs) => scalarArgs.filter(v => v !== null && v !== undefined).length);
});

reg('COUNTDISTINCT', (args, ctx) => {
  return evaluateReportFunction('COUNTDISTINCT', args, ctx, (scalarArgs) => new Set(scalarArgs.filter(v => v !== null && v !== undefined)).size);
});

reg('SUMIF', (args, ctx) => {
  return evaluateReportFunction('SUMIF', args, ctx, () => 0);
});

reg('COUNTIF', (args, ctx) => {
  return evaluateReportFunction('COUNTIF', args, ctx, () => 0);
});

reg('RUNNINGSUM', (args, ctx) => {
  return evaluateReportFunction('RUNNINGSUM', args, ctx, () => 0);
});

reg('TOTALS.SUM', (args, ctx) => {
  return evaluateReportFunction('TOTALS.SUM', args, ctx, () => 0);
});

reg('PAGE', (args, ctx) => {
  return evaluateReportFunction('PAGE', args, ctx, () => 1);
});

reg('TOTALPAGES', (args, ctx) => {
  return evaluateReportFunction('TOTALPAGES', args, ctx, () => 1);
});

reg('ROUND', (args, ctx) => {
  const v = toNumber(args[0]);
  const d = args.length > 1 ? toNumber(args[1]) : 0;
  const factor = Math.pow(10, d);
  return Math.round(v * factor) / factor;
});

reg('CEIL', (args, ctx) => {
  return Math.ceil(toNumber(args[0]));
});

reg('FLOOR', (args, ctx) => {
  return Math.floor(toNumber(args[0]));
});

reg('ABS', (args, ctx) => {
  return Math.abs(toNumber(args[0]));
});

reg('CONCAT', (args, ctx) => {
  return args.map(toString).join('');
});

reg('LEN', (args, ctx) => {
  return toString(args[0]).length;
});

reg('UPPER', (args, ctx) => {
  return toString(args[0]).toUpperCase();
});

reg('LOWER', (args, ctx) => {
  return toString(args[0]).toLowerCase();
});

reg('TRIM', (args, ctx) => {
  return toString(args[0]).trim();
});

reg('SUBSTRING', (args, ctx) => {
  const str = toString(args[0]);
  const start = toNumber(args[1]);
  if (args.length > 2) {
    const len = toNumber(args[2]);
    return str.substring(start, start + len);
  }
  return str.substring(start);
});

reg('FORMAT', (args, ctx) => {
  const pattern = toString(args[0]);
  const value = args[1];
  if (pattern.toUpperCase().startsWith('N')) {
    const decimals = parseInt(pattern.substring(1), 10) || 2;
    return Number(value).toFixed(decimals);
  }
  if (pattern.toUpperCase() === 'C') {
    return '$' + Number(value).toFixed(2);
  }
  if (pattern.toUpperCase() === 'P') {
    return (Number(value) * 100).toFixed(1) + '%';
  }
  if (pattern.toUpperCase() === 'D') {
    return new Date(value).toLocaleDateString();
  }
  if (pattern.toUpperCase() === 'T') {
    return new Date(value).toLocaleTimeString();
  }
  return toString(value);
});

reg('TOSTRING', (args, ctx) => {
  return toString(args[0]);
});

reg('TONUMBER', (args, ctx) => {
  return toNumber(args[0]);
});

reg('NOW', (args, ctx) => {
  return new Date();
});

reg('TODAY', (args, ctx) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
});

reg('YEAR', (args, ctx) => {
  return new Date(args[0]).getFullYear();
});

reg('MONTH', (args, ctx) => {
  return new Date(args[0]).getMonth() + 1;
});

reg('DAY', (args, ctx) => {
  return new Date(args[0]).getDate();
});

reg('DATEADD', (args, ctx) => {
  const date = new Date(args[0]);
  const unit = toString(args[1]).toLowerCase();
  const amount = toNumber(args[2]);
  switch (unit) {
    case 'year': date.setFullYear(date.getFullYear() + amount); break;
    case 'month': date.setMonth(date.getMonth() + amount); break;
    case 'day': date.setDate(date.getDate() + amount); break;
    case 'hour': date.setHours(date.getHours() + amount); break;
    case 'minute': date.setMinutes(date.getMinutes() + amount); break;
    case 'second': date.setSeconds(date.getSeconds() + amount); break;
    default: throw new Error(`Unknown date unit: ${unit}`);
  }
  return date;
});

reg('DATEDIFF', (args, ctx) => {
  const d1 = new Date(args[0]).getTime();
  const d2 = new Date(args[1]).getTime();
  const unit = toString(args[2]).toLowerCase();
  const diffMs = Math.abs(d2 - d1);
  switch (unit) {
    case 'day': return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    case 'hour': return Math.floor(diffMs / (1000 * 60 * 60));
    case 'minute': return Math.floor(diffMs / (1000 * 60));
    case 'second': return Math.floor(diffMs / 1000);
    default: throw new Error(`Unknown date unit: ${unit}`);
  }
});

// ---- Core Evaluator ----

export function evaluate(node: ASTNode, ctx: EvalContext): any {
  switch (node.type) {
    case ASTNodeType.Literal:
      return (node as LiteralNode).value;

    case ASTNodeType.FieldRef: {
      const fr = node as FieldRefNode;
      return ctx.resolveField(fr.source, fr.field);
    }

    case ASTNodeType.BinaryOp: {
      const bin = node as BinaryOpNode;
      const left = evalArg(bin.left, ctx);
      const right = evalArg(bin.right, ctx);
      return evalBinaryOp(bin.operator, left, right);
    }

    case ASTNodeType.UnaryOp: {
      const un = node as UnaryOpNode;
      const val = evalArg(un.operand, ctx);
      return evalUnaryOp(un.operator, val);
    }

    case ASTNodeType.FunctionCall: {
      const fn = node as FunctionCallNode;
      const args = fn.args.map(a => evalArg(a, ctx));
      const fnName = fn.name.toUpperCase();
      const fnImpl = builtinFunctions[fnName];
      if (!fnImpl) {
        throw new Error(`Unknown function: ${fn.name}`);
      }
      return fnImpl(args, ctx);
    }

    default:
      throw new Error(`Unknown AST node type: ${(node as any).type}`);
  }
}

function evalBinaryOp(op: string, left: any, right: any): any {
  // Arithmetic operators
  if (op === '+') return toNumber(left) + toNumber(right);
  if (op === '-') return toNumber(left) - toNumber(right);
  if (op === '*') return toNumber(left) * toNumber(right);
  if (op === '/') {
    const r = toNumber(right);
    if (r === 0) return null;
    return toNumber(left) / r;
  }
  if (op === '%') {
    const r = toNumber(right);
    if (r === 0) return null;
    return toNumber(left) % r;
  }

  // Comparison operators
  if (op === '=' || op === '==') {
    const [a, b] = coerceCompare(left, right);
    return a === b;
  }
  if (op === '!=') {
    const [a, b] = coerceCompare(left, right);
    return a !== b;
  }
  if (op === '>') {
    const [a, b] = coerceCompare(left, right);
    return a > b;
  }
  if (op === '<') {
    const [a, b] = coerceCompare(left, right);
    return a < b;
  }
  if (op === '>=') {
    const [a, b] = coerceCompare(left, right);
    return a >= b;
  }
  if (op === '<=') {
    const [a, b] = coerceCompare(left, right);
    return a <= b;
  }

  // Logical operators
  if (op === 'AND') return Boolean(left) && Boolean(right);
  if (op === 'OR') return Boolean(left) || Boolean(right);

  throw new Error(`Unknown binary operator: ${op}`);
}

function evalUnaryOp(op: string, val: any): any {
  if (op === 'NOT') return !Boolean(val);
  if (op === '-') return -toNumber(val);
  if (op === '+') return +toNumber(val);
  throw new Error(`Unknown unary operator: ${op}`);
}

/** Convenience: tokenize + parse + evaluate */
export function evalExpression(
  expression: string,
  resolveField: (source: string, field: string) => any,
  rowIndex?: number,
  variables?: Record<string, any>,
  reportRuntime?: ReportFunctionRuntime,
): any {
  const tokens = tokenize(expression);
  const ast = parse(tokens);
  return evaluate(ast, { resolveField, rowIndex, variables, reportRuntime });
}
