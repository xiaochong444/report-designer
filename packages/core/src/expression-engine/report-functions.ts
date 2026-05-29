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

  if (ctx.reportRuntime && shouldDelegateToReportRuntime(name, args)) {
    return ctx.reportRuntime.evaluateFunction(name, args, ctx);
  }

  return scalarFallback(args, ctx);
}

function shouldDelegateToReportRuntime(functionName: string, args: unknown[]): boolean {
  if (['SUM', 'AVG', 'MIN', 'MAX', 'COUNT', 'COUNTDISTINCT', 'SUMIF', 'COUNTIF', 'RUNNINGSUM'].includes(functionName) && (
    args.length === 0 || typeof args[0] === 'string'
  )) {
    return true;
  }

  return typeof args[0] === 'string' && typeof args[1] === 'string';
}
