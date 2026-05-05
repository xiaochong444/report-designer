import type { BuiltinFunction, EvalContext } from './evaluator';

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

  if (ctx.reportRuntime && shouldDelegateToReportRuntime(name, args)) {
    return ctx.reportRuntime.evaluateFunction(name, args, ctx);
  }

  return scalarFallback(args, ctx);
}

function shouldDelegateToReportRuntime(functionName: string, args: unknown[]): boolean {
  if (functionName.startsWith('TOTALS.')) {
    return true;
  }

  if (functionName === 'COUNT' && args.length === 1 && typeof args[0] === 'string') {
    return true;
  }

  return typeof args[0] === 'string' && typeof args[1] === 'string';
}
