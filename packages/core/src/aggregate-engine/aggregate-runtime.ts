import { evalExpression } from '../expression-engine/evaluator';
import type { EvalContext } from '../expression-engine/evaluator';
import type { AggregateFunctionName, AggregateRuntimeContract, AggregateRuntimeOptions } from './aggregate-types';

export class AggregateRuntime implements AggregateRuntimeContract {
  readonly pageNumber: number;
  readonly totalPages: number;

  constructor(private readonly options: AggregateRuntimeOptions) {
    this.pageNumber = options.pageNumber ?? 1;
    this.totalPages = options.totalPages ?? 1;
  }

  calculate(functionName: AggregateFunctionName | string, bandName: string, expression?: string, condition?: string): unknown {
    const rows = this.options.rowsByBand[bandName] ?? [];
    return this.calculateRows(normalizeFunctionName(functionName), rows, expression, condition);
  }

  evaluateFunction(functionName: string, args: unknown[], ctx: EvalContext): unknown {
    const fnName = normalizeFunctionName(functionName);

    if (fnName === 'PAGE') return this.pageNumber;
    if (fnName === 'TOTALPAGES') return this.totalPages;

    const [bandName, expression, condition] = normalizeAggregateArgs(
      fnName,
      args,
      this.defaultBandName(),
      new Set(Object.keys(this.options.rowsByBand)),
    );

    if (fnName === 'RUNNINGSUM') {
      const rows = (this.options.rowsByBand[bandName] ?? []).slice(0, (ctx.rowIndex ?? 0) + 1);
      return this.calculateRows('SUM', rows, expression);
    }

    return this.calculateRows(fnName, this.options.rowsByBand[bandName] ?? [], expression, condition);
  }

  private calculateRows(functionName: string, rows: Array<Record<string, unknown>>, expression?: string, condition?: string): unknown {
    const filteredRows = condition
      ? rows.filter((row, rowIndex) => Boolean(this.evaluateRowExpression(condition, row, rowIndex)))
      : rows;

    switch (functionName) {
      case 'COUNT':
        return filteredRows.length;
      case 'COUNTIF':
        return filteredRows.length;
      case 'COUNTDISTINCT':
        return new Set(filteredRows.map((row, rowIndex) => this.evaluateRowExpression(expression, row, rowIndex))).size;
      case 'SUM':
      case 'SUMIF':
        return filteredRows.reduce((sum, row, rowIndex) => sum + toNumber(this.evaluateRowExpression(expression, row, rowIndex)), 0);
      case 'AVG':
        return filteredRows.length === 0
          ? 0
          : filteredRows.reduce((sum, row, rowIndex) => sum + toNumber(this.evaluateRowExpression(expression, row, rowIndex)), 0) / filteredRows.length;
      case 'MIN': {
        const values = filteredRows.map((row, rowIndex) => toNumber(this.evaluateRowExpression(expression, row, rowIndex)));
        return values.length > 0 ? Math.min(...values) : null;
      }
      case 'MAX': {
        const values = filteredRows.map((row, rowIndex) => toNumber(this.evaluateRowExpression(expression, row, rowIndex)));
        return values.length > 0 ? Math.max(...values) : null;
      }
      default:
        throw new Error(`Unsupported aggregate function: ${functionName}`);
    }
  }

  private evaluateRowExpression(expression: string | undefined, row: Record<string, unknown>, rowIndex: number): unknown {
    if (!expression) {
      return null;
    }

    return evalExpression(expression, (source, field) => resolveRowField(row, source, field), rowIndex, { row }, this);
  }

  private defaultBandName(): string {
    return this.options.defaultDataSourceId ?? Object.keys(this.options.rowsByBand)[0] ?? '';
  }
}

function normalizeFunctionName(functionName: string): string {
  return functionName.replace(/\s+/g, '').toUpperCase();
}

function normalizeAggregateArgs(functionName: string, args: unknown[], fallbackBandName: string, sourceIds: Set<string>): [string, string | undefined, string | undefined] {
  const first = typeof args[0] === 'string' ? args[0] : undefined;
  const second = typeof args[1] === 'string' ? args[1] : undefined;

  if (functionName === 'COUNTIF') {
    return [extractSourceName(first, sourceIds) ?? fallbackBandName, undefined, first];
  }

  if (functionName === 'SUMIF') {
    return [extractSourceName(first, sourceIds) ?? extractSourceName(second, sourceIds) ?? fallbackBandName, first, second];
  }

  return [extractSourceName(first, sourceIds) ?? fallbackBandName, first, undefined];
}

function extractSourceName(expression: string | undefined, sourceIds: Set<string>): string | undefined {
  const match = expression?.match(/\{([A-Za-z0-9_.-]+)\.[^}]+}/);
  const candidate = match?.[1];
  return candidate && sourceIds.has(candidate) ? candidate : undefined;
}

function resolveRowField(row: Record<string, unknown>, source: string, field: string): unknown {
  const scoped = row[source];
  if (scoped && typeof scoped === 'object' && !Array.isArray(scoped)) {
    return (scoped as Record<string, unknown>)[field];
  }
  return row[field] ?? row[`${source}.${field}`];
}

function toNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? 0 : numberValue;
}
