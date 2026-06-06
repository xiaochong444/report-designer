import { evalExpression } from '../expression-engine/evaluator';
import type { BuiltinFunction } from '../expression-engine/evaluator';
import type { Band } from '../template-model/types';
import { isRepeatOnEveryPageBandType } from '../template-model/types';
import type { BandPlan, DataSectionPlan, LogicalBandItem, RenderContext } from './band-plan';

type BandLogicalItem = Extract<LogicalBandItem, { kind: 'band' }>;

export interface ExecuteBandPlanOptions {
  expressionVariables?: Record<string, unknown>;
  expressionFunctions?: Record<string, BuiltinFunction>;
}

export function executeBandPlan(plan: BandPlan, data: Record<string, Record<string, unknown>[]>, options: ExecuteBandPlanOptions = {}): LogicalBandItem[] {
  const items: LogicalBandItem[] = [];

  for (const band of plan.reportBands.reportTitle) {
    items.push(createBandItem(band, runtimeContext(options)));
  }

  for (const section of plan.dataSections) {
    executeDataSection(section, data, items, options);
  }

  for (const band of plan.reportBands.reportSummary) {
    items.push(createBandItem(band, runtimeContext(options)));
  }

  return items;
}

function executeDataSection(
  section: DataSectionPlan,
  data: Record<string, Record<string, unknown>[]>,
  items: LogicalBandItem[],
  options: ExecuteBandPlanOptions,
): void {
  const dataSourceId = section.dataBand.dataBand?.dataSourceId;
  const rows = prepareRows(dataSourceId ? data[dataSourceId] ?? [] : [], section, dataSourceId, options);

  if (rows.length === 0) {
    section.emptyDataBands.forEach((band) => items.push(createBandItem(band, { ...runtimeContext(options), dataSourceId })));
    return;
  }

  section.headers.forEach((band) => items.push(createBandItem(band, { ...runtimeContext(options), dataSourceId })));
  section.columnHeaders.forEach((band) => items.push(createBandItem(band, { ...runtimeContext(options), dataSourceId })));
  const repeatOnPageBreakBefore = repeatableSectionBands(section);

  if (section.groupPairs.length > 0) {
    executeGroupedRows(section, rows, dataSourceId, items, repeatOnPageBreakBefore, options);
  } else {
    rows.forEach((row, rowIndex) => {
      items.push(createSectionBandItem(section.dataBand, { ...runtimeContext(options), row, rowIndex, dataSourceId }, repeatOnPageBreakBefore));
      section.childBands.forEach((band) => items.push(createSectionBandItem(band, { ...runtimeContext(options), row, rowIndex, dataSourceId }, repeatOnPageBreakBefore)));
    });
  }

  section.columnFooters.forEach((band) => items.push(createBandItem(band, { ...runtimeContext(options), dataSourceId })));
  section.footers.forEach((band) => items.push(createBandItem(band, { ...runtimeContext(options), dataSourceId })));
}

function executeGroupedRows(
  section: DataSectionPlan,
  rows: Record<string, unknown>[],
  dataSourceId: string | undefined,
  items: LogicalBandItem[],
  repeatOnPageBreakBefore: Band[],
  options: ExecuteBandPlanOptions,
): void {
  const groupedRows = sortRowsForGroups(section, rows, dataSourceId, options);
  executeGroupDepth(section, groupedRows, dataSourceId, items, 0, {}, repeatOnPageBreakBefore, options);
}

function executeGroupDepth(
  section: DataSectionPlan,
  rows: Array<{ row: Record<string, unknown>; rowIndex: number }>,
  dataSourceId: string | undefined,
  items: LogicalBandItem[],
  depth: number,
  parentGroupValues: Record<string, unknown>,
  repeatOnPageBreakBefore: Band[],
  options: ExecuteBandPlanOptions,
): void {
  const pair = section.groupPairs[depth];
  if (!pair) {
    rows.forEach(({ row, rowIndex }) => {
      items.push(createSectionBandItem(section.dataBand, { ...runtimeContext(options), row, rowIndex, dataSourceId, groupValues: parentGroupValues }, repeatOnPageBreakBefore));
      section.childBands.forEach((band) => items.push(createSectionBandItem(band, { ...runtimeContext(options), row, rowIndex, dataSourceId, groupValues: parentGroupValues }, repeatOnPageBreakBefore)));
    });
    return;
  }

  let currentKey: unknown = Symbol('no-group');
  let currentGroupRows: Array<{ row: Record<string, unknown>; rowIndex: number }> = [];

  const flush = () => {
    if (currentGroupRows.length === 0) {
      return;
    }

    const groupValues = { ...parentGroupValues, [groupValueKey(pair.header)]: currentKey };
    const rowsByBand = dataSourceId ? { [dataSourceId]: currentGroupRows.map(item => item.row) } : undefined;
    items.push(createBandItem(pair.header, { ...runtimeContext(options), row: currentGroupRows[0].row, rowIndex: currentGroupRows[0].rowIndex, dataSourceId, groupValues, rowsByBand }));
    executeGroupDepth(section, currentGroupRows, dataSourceId, items, depth + 1, groupValues, repeatOnPageBreakBefore, options);
    if (pair.footer) {
      const last = currentGroupRows[currentGroupRows.length - 1];
      items.push(createBandItem(pair.footer, { ...runtimeContext(options), row: last.row, rowIndex: last.rowIndex, dataSourceId, groupValues, rowsByBand }));
    }
    currentGroupRows = [];
  };

  rows.forEach((item) => {
    const key = evaluateRowExpression(pair.header.group?.conditionExpression, item.row, dataSourceId, item.rowIndex, options);
    if (currentGroupRows.length > 0 && key !== currentKey) {
      flush();
    }
    currentKey = key;
    currentGroupRows.push(item);
  });

  flush();
}

function sortRowsForGroups(
  section: DataSectionPlan,
  rows: Record<string, unknown>[],
  dataSourceId: string | undefined,
  options: ExecuteBandPlanOptions,
): Array<{ row: Record<string, unknown>; rowIndex: number }> {
  const indexedRows = rows.map((row, rowIndex) => ({ row, rowIndex }));
  const sortGroups = section.groupPairs.filter(pair => pair.header.group?.sortDirection && pair.header.group.sortDirection !== 'none');
  if (sortGroups.length === 0) {
    return indexedRows;
  }

  return [...indexedRows].sort((left, right) => {
    for (const pair of sortGroups) {
      const direction = pair.header.group?.sortDirection === 'desc' ? -1 : 1;
      const leftValue = evaluateRowExpression(pair.header.group?.conditionExpression, left.row, dataSourceId, left.rowIndex, options);
      const rightValue = evaluateRowExpression(pair.header.group?.conditionExpression, right.row, dataSourceId, right.rowIndex, options);
      const compared = compareValues(leftValue, rightValue) * direction;
      if (compared !== 0) {
        return compared;
      }
    }
    return left.rowIndex - right.rowIndex;
  });
}

function groupValueKey(header: Band): string {
  const expression = header.group?.conditionExpression?.trim();
  const match = expression?.match(/^\{\s*(?:(?:[\w-]+)\.)?([\w-]+)\s*\}$/);
  return match?.[1] ?? header.id;
}

function repeatableSectionBands(section: DataSectionPlan): Band[] {
  return [...section.headers, ...section.columnHeaders].filter((band) => getBandBehavior(band).printOnAllPages);
}

function prepareRows(
  rows: Record<string, unknown>[],
  section: DataSectionPlan,
  dataSourceId: string | undefined,
  options: ExecuteBandPlanOptions,
): Record<string, unknown>[] {
  let result = [...rows];
  const filterExpression = section.dataBand.dataBand?.filterExpression;
  if (filterExpression) {
    result = result.filter((row, rowIndex) => Boolean(evaluateRowExpression(filterExpression, row, dataSourceId, rowIndex, options)));
  }

  const sort = section.dataBand.dataBand?.sort ?? [];
  if (sort.length > 0) {
    result = result
      .map((row, originalIndex) => ({ row, originalIndex }))
      .sort((a, b) => {
        for (const sortRule of sort) {
          const left = evaluateField(sortRule.field, a.row, dataSourceId, a.originalIndex, options);
          const right = evaluateField(sortRule.field, b.row, dataSourceId, b.originalIndex, options);
          const direction = sortRule.direction === 'desc' ? -1 : 1;
          const compared = compareValues(left, right) * direction;
          if (compared !== 0) {
            return compared;
          }
        }
        return a.originalIndex - b.originalIndex;
      })
      .map(item => item.row);
  }

  return result;
}

function evaluateRowExpression(
  expression: string | undefined,
  row: Record<string, unknown>,
  dataSourceId: string | undefined,
  rowIndex: number,
  options: ExecuteBandPlanOptions,
): unknown {
  if (!expression) {
    return undefined;
  }

  return evalExpression(
    expression,
    (source, field) => resolveRowField(row, source || dataSourceId, field, options),
    rowIndex,
    { row, ...(options.expressionVariables ?? {}) },
    undefined,
    options.expressionFunctions,
  );
}

function evaluateField(field: string, row: Record<string, unknown>, dataSourceId: string | undefined, rowIndex: number, options: ExecuteBandPlanOptions): unknown {
  if (field.startsWith('{') && field.endsWith('}')) {
    return evaluateRowExpression(field, row, dataSourceId, rowIndex, options);
  }
  if (field.includes('(')) {
    return evaluateRowExpression(field, row, dataSourceId, rowIndex, options);
  }
  return resolveRowField(row, dataSourceId, field, options);
}

function compareValues(left: unknown, right: unknown): number {
  if (left === right) return 0;

  const leftEmpty = isEmptySortValue(left);
  const rightEmpty = isEmptySortValue(right);
  if (leftEmpty || rightEmpty) {
    if (leftEmpty && rightEmpty) return 0;
    return leftEmpty ? 1 : -1;
  }

  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    if (leftNumber === rightNumber) return 0;
    return leftNumber > rightNumber ? 1 : -1;
  }

  const leftTime = toSortableTime(left);
  const rightTime = toSortableTime(right);
  if (leftTime !== undefined && rightTime !== undefined) {
    if (leftTime === rightTime) return 0;
    return leftTime > rightTime ? 1 : -1;
  }

  return String(left ?? '').localeCompare(String(right ?? ''));
}

function isEmptySortValue(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

function toSortableTime(value: unknown): number | undefined {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? undefined : time;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const time = Date.parse(value);
  return Number.isNaN(time) ? undefined : time;
}

function resolveRowField(row: Record<string, unknown>, source: string | undefined, field: string, options: ExecuteBandPlanOptions = {}): unknown {
  if (!source && options.expressionVariables && field in options.expressionVariables) {
    return options.expressionVariables[field];
  }
  const scoped = source ? row[source] : undefined;
  if (scoped && typeof scoped === 'object' && !Array.isArray(scoped)) {
    return (scoped as Record<string, unknown>)[field];
  }
  return row[field] ?? row[`${source}.${field}`];
}

function runtimeContext(options: ExecuteBandPlanOptions): Partial<RenderContext> {
  return {
    expressionVariables: options.expressionVariables,
    expressionFunctions: options.expressionFunctions,
  };
}

function createBandItem(
  band: Band,
  overrides: Partial<RenderContext> = {},
): BandLogicalItem {
  return {
    kind: 'band',
    band,
    context: {
      rowIndex: overrides.rowIndex ?? 0,
      groupValues: overrides.groupValues ?? {},
      ...overrides,
    },
  };
}

function createSectionBandItem(
  band: Band,
  overrides: Partial<RenderContext>,
  repeatOnPageBreakBefore: Band[],
): BandLogicalItem {
  return {
    ...createBandItem(band, overrides),
    repeatOnPageBreakBefore,
  };
}

function getBandBehavior(band: Band): NonNullable<Band['behavior']> {
  return band.behavior ?? {
    enabled: true,
    printOn: 'allPages',
    printIfEmpty: true,
    printOnAllPages: isRepeatOnEveryPageBandType(band.type),
    keepTogether: false,
    canBreak: band.type === 'data' || band.type === 'child',
    printAtBottom: band.type === 'pageFooter',
    autoGrow: true,
    autoShrink: false,
  };
}
