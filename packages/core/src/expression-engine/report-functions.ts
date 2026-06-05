import type { BuiltinFunction, EvalContext } from './evaluator';
import { formatChineseRmbUppercase } from './chinese-money';

export function evaluateReportFunction(
  functionName: string,
  args: unknown[],
  ctx: EvalContext,
  scalarFallback: BuiltinFunction,
): unknown {
  const name = functionName.toUpperCase();

  if (name === 'PAGE') {
    return ctx.reportRuntime?.pageNumber ?? 1;
  }

  if (name === 'TOTALPAGES') {
    return ctx.reportRuntime?.totalPages ?? 1;
  }

  if (name === 'RMBUPPER' || name === 'MONEYUPPER' || name === 'CNYUPPER' || name === 'CHINESEMONEY') {
    return formatChineseRmbUppercase(args[0]);
  }

  if (ctx.reportRuntime && isAggregateFunction(name) && hasLegacySourceFirstSignature(name, args)) {
    throw new Error('Aggregate functions use field expressions, for example SUM({employees.Salary}).');
  }

  if (ctx.reportRuntime && shouldDelegateToReportRuntime(name, args)) {
    return ctx.reportRuntime.evaluateFunction(name, args, ctx);
  }

  return scalarFallback(args, ctx);
}

function shouldDelegateToReportRuntime(functionName: string, args: unknown[]): boolean {
  if (functionName === 'COUNTIF') {
    return args.length === 1 && typeof args[0] === 'string';
  }

  return isAggregateFunction(functionName)
    && args.length > 0
    && isAggregateExpressionArg(args[0]);
}

function isAggregateFunction(functionName: string): boolean {
  return ['SUM', 'AVG', 'MIN', 'MAX', 'COUNT', 'COUNTDISTINCT', 'SUMIF', 'COUNTIF', 'RUNNINGSUM'].includes(functionName);
}

function hasLegacySourceFirstSignature(functionName: string, args: unknown[]): boolean {
  if (functionName === 'COUNTIF') {
    return args.length > 1;
  }
  return typeof args[0] === 'string' && !isAggregateExpressionArg(args[0]);
}

function isAggregateExpressionArg(arg: unknown): boolean {
  return typeof arg === 'string' && /^\{[^}]+}$/.test(arg.trim());
}
