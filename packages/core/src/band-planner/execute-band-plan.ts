import { evalExpression } from '../expression-engine/evaluator';
import type { Band } from '../template-model/types';
import type { BandPlan, DataSectionPlan, LogicalBandItem, RenderContext } from './band-plan';

type BandLogicalItem = Extract<LogicalBandItem, { kind: 'band' }>;

export function executeBandPlan(plan: BandPlan, data: Record<string, Record<string, unknown>[]>): LogicalBandItem[] {
  const items: LogicalBandItem[] = [];

  for (const band of plan.reportBands.reportTitle) {
    items.push(createBandItem(band));
  }

  for (const section of plan.dataSections) {
    executeDataSection(section, data, items);
  }

  for (const band of plan.reportBands.reportSummary) {
    items.push(createBandItem(band));
  }

  return items;
}

function executeDataSection(
  section: DataSectionPlan,
  data: Record<string, Record<string, unknown>[]>,
  items: LogicalBandItem[],
): void {
  const dataSourceId = section.dataBand.dataBand?.dataSourceId;
  const rows = prepareRows(dataSourceId ? data[dataSourceId] ?? [] : [], section, dataSourceId);

  if (rows.length === 0) {
    section.emptyDataBands.forEach((band) => items.push(createBandItem(band, { dataSourceId })));
    return;
  }

  section.headers.forEach((band) => items.push(createBandItem(band, { dataSourceId })));
  section.columnHeaders.forEach((band) => items.push(createBandItem(band, { dataSourceId })));
  const repeatOnPageBreakBefore = repeatableSectionBands(section);

  if (section.groupPairs.length > 0) {
    executeGroupedRows(section, rows, dataSourceId, items, repeatOnPageBreakBefore);
  } else {
    rows.forEach((row, rowIndex) => {
      items.push(createSectionBandItem(section.dataBand, { row, rowIndex, dataSourceId }, repeatOnPageBreakBefore));
      section.childBands.forEach((band) => items.push(createSectionBandItem(band, { row, rowIndex, dataSourceId }, repeatOnPageBreakBefore)));
    });
  }

  section.columnFooters.forEach((band) => items.push(createBandItem(band, { dataSourceId })));
  section.footers.forEach((band) => items.push(createBandItem(band, { dataSourceId })));
}

function executeGroupedRows(
  section: DataSectionPlan,
  rows: Record<string, unknown>[],
  dataSourceId: string | undefined,
  items: LogicalBandItem[],
  repeatOnPageBreakBefore: Band[],
): void {
  executeGroupDepth(section, rows.map((row, rowIndex) => ({ row, rowIndex })), dataSourceId, items, 0, {}, repeatOnPageBreakBefore);
}

function executeGroupDepth(
  section: DataSectionPlan,
  rows: Array<{ row: Record<string, unknown>; rowIndex: number }>,
  dataSourceId: string | undefined,
  items: LogicalBandItem[],
  depth: number,
  parentGroupValues: Record<string, unknown>,
  repeatOnPageBreakBefore: Band[],
): void {
  const pair = section.groupPairs[depth];
  if (!pair) {
    rows.forEach(({ row, rowIndex }) => {
      items.push(createSectionBandItem(section.dataBand, { row, rowIndex, dataSourceId, groupValues: parentGroupValues }, repeatOnPageBreakBefore));
      section.childBands.forEach((band) => items.push(createSectionBandItem(band, { row, rowIndex, dataSourceId, groupValues: parentGroupValues }, repeatOnPageBreakBefore)));
    });
    return;
  }

  let currentKey: unknown = Symbol('no-group');
  let currentGroupRows: Array<{ row: Record<string, unknown>; rowIndex: number }> = [];

  const flush = () => {
    if (currentGroupRows.length === 0) {
      return;
    }

    const groupValues = pair.header.group?.name
      ? { ...parentGroupValues, [pair.header.group.name]: currentKey }
      : parentGroupValues;
    const rowsByBand = dataSourceId ? { [dataSourceId]: currentGroupRows.map(item => item.row) } : undefined;
    items.push(createBandItem(pair.header, { row: currentGroupRows[0].row, rowIndex: currentGroupRows[0].rowIndex, dataSourceId, groupValues, rowsByBand }));
    executeGroupDepth(section, currentGroupRows, dataSourceId, items, depth + 1, groupValues, repeatOnPageBreakBefore);
    if (pair.footer) {
      const last = currentGroupRows[currentGroupRows.length - 1];
      items.push(createBandItem(pair.footer, { row: last.row, rowIndex: last.rowIndex, dataSourceId, groupValues, rowsByBand }));
    }
    currentGroupRows = [];
  };

  rows.forEach((item) => {
    const key = evaluateRowExpression(pair.header.group?.conditionExpression, item.row, dataSourceId, item.rowIndex);
    if (currentGroupRows.length > 0 && key !== currentKey) {
      flush();
    }
    currentKey = key;
    currentGroupRows.push(item);
  });

  flush();
}

function repeatableSectionBands(section: DataSectionPlan): Band[] {
  return [...section.headers, ...section.columnHeaders].filter((band) => getBandBehavior(band).printOnAllPages);
}

function prepareRows(
  rows: Record<string, unknown>[],
  section: DataSectionPlan,
  dataSourceId: string | undefined,
): Record<string, unknown>[] {
  let result = [...rows];
  const filterExpression = section.dataBand.dataBand?.filterExpression;
  if (filterExpression) {
    result = result.filter((row, rowIndex) => Boolean(evaluateRowExpression(filterExpression, row, dataSourceId, rowIndex)));
  }

  const sort = section.dataBand.dataBand?.sort ?? [];
  for (const sortRule of [...sort].reverse()) {
    result.sort((a, b) => {
      const left = evaluateField(sortRule.field, a, dataSourceId);
      const right = evaluateField(sortRule.field, b, dataSourceId);
      const direction = sortRule.direction === 'desc' ? -1 : 1;
      return compareValues(left, right) * direction;
    });
  }

  return result;
}

function evaluateRowExpression(
  expression: string | undefined,
  row: Record<string, unknown>,
  dataSourceId: string | undefined,
  rowIndex: number,
): unknown {
  if (!expression) {
    return undefined;
  }

  return evalExpression(expression, (source, field) => resolveRowField(row, source || dataSourceId, field), rowIndex, { row });
}

function evaluateField(field: string, row: Record<string, unknown>, dataSourceId: string | undefined): unknown {
  if (field.startsWith('{') && field.endsWith('}')) {
    return evaluateRowExpression(field, row, dataSourceId, 0);
  }
  return resolveRowField(row, dataSourceId, field);
}

function compareValues(left: unknown, right: unknown): number {
  if (left === right) return 0;

  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber) && left !== '' && right !== '') {
    return leftNumber > rightNumber ? 1 : -1;
  }

  return String(left ?? '').localeCompare(String(right ?? ''));
}

function resolveRowField(row: Record<string, unknown>, source: string | undefined, field: string): unknown {
  const scoped = source ? row[source] : undefined;
  if (scoped && typeof scoped === 'object' && !Array.isArray(scoped)) {
    return (scoped as Record<string, unknown>)[field];
  }
  return row[field] ?? row[`${source}.${field}`];
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
    printOnAllPages: band.type === 'pageHeader' || band.type === 'pageFooter' || band.type === 'groupHeader',
    keepTogether: false,
    canBreak: band.type === 'data' || band.type === 'child',
    printAtBottom: band.type === 'pageFooter',
  };
}
