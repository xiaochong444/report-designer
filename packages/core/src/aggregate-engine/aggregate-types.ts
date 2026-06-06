import type { EvalContext, ReportFunctionRuntime } from '../expression-engine/evaluator';

export type AggregateFunctionName =
  | 'SUM'
  | 'AVG'
  | 'MIN'
  | 'MAX'
  | 'COUNT'
  | 'COUNTDISTINCT'
  | 'SUMIF'
  | 'COUNTIF'
  | 'RUNNINGSUM';

export interface AggregateRuntimeOptions {
  rowsByBand: Record<string, Array<Record<string, unknown>>>;
  pageRowsByBand?: Record<string, Array<Record<string, unknown>>>;
  defaultDataSourceId?: string;
  pageNumber?: number;
  totalPages?: number;
}

export interface AggregateRuntimeContract extends ReportFunctionRuntime {
  calculate(functionName: AggregateFunctionName | string, bandName: string, expression?: string, condition?: string): unknown;
  evaluateFunction(functionName: string, args: unknown[], ctx: EvalContext): unknown;
}
