import { evalExpression } from '../expression-engine/evaluator';
import type { ReportBandV2 } from '../template-model/v2-types';
import type { BandPlan, DataSectionPlan, LogicalBandItem, RenderContextV2 } from './band-plan';

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

  if (section.groupPairs.length > 0) {
    executeGroupedRows(section, rows, dataSourceId, items);
  } else {
    rows.forEach((row, rowIndex) => {
      items.push(createBandItem(section.dataBand, { row, rowIndex, dataSourceId }));
      section.childBands.forEach((band) => items.push(createBandItem(band, { row, rowIndex, dataSourceId })));
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
): void {
  const pair = section.groupPairs[0];
  let currentKey: unknown = Symbol('no-group');
  let currentGroupRows: Array<{ row: Record<string, unknown>; rowIndex: number }> = [];

  const flush = () => {
    if (currentGroupRows.length === 0) {
      return;
    }

    const groupValues = pair.header.group?.name ? { [pair.header.group.name]: currentKey } : {};
    const rowsByBand = dataSourceId ? { [dataSourceId]: currentGroupRows.map(item => item.row) } : undefined;
    items.push(createBandItem(pair.header, { row: currentGroupRows[0].row, rowIndex: currentGroupRows[0].rowIndex, dataSourceId, groupValues, rowsByBand }));
    currentGroupRows.forEach(({ row, rowIndex }) => {
      items.push(createBandItem(section.dataBand, { row, rowIndex, dataSourceId, groupValues }));
      section.childBands.forEach((band) => items.push(createBandItem(band, { row, rowIndex, dataSourceId, groupValues })));
    });
    if (pair.footer) {
      const last = currentGroupRows[currentGroupRows.length - 1];
      items.push(createBandItem(pair.footer, { row: last.row, rowIndex: last.rowIndex, dataSourceId, groupValues, rowsByBand }));
    }
    currentGroupRows = [];
  };

  rows.forEach((row, rowIndex) => {
    const key = evaluateRowExpression(pair.header.group?.conditionExpression, row, dataSourceId, rowIndex);
    if (currentGroupRows.length > 0 && key !== currentKey) {
      flush();
    }
    currentKey = key;
    currentGroupRows.push({ row, rowIndex });
  });

  flush();
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
  band: ReportBandV2,
  overrides: Partial<RenderContextV2> = {},
): LogicalBandItem {
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
