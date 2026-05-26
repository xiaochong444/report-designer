import { describe, expect, it } from 'vitest';
import { renderReport } from '../src';
import { normalizeTemplate } from '../src/template-model/normalize-template';
import type { ReportTemplate, TableComponent } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

function tableTemplate(overrides: Partial<TableComponent> = {}): ReportTemplate {
  const table = {
    id: 'table-1',
    type: 'table',
    x: 0,
    y: 0,
    width: 60,
    height: 24,
    dataSource: 'orders',
    columns: [{ id: 'c1', header: 'Name', field: 'Name', width: 60, cellType: 'text' }],
    rowCount: 2,
    columnCount: 1,
    headerRowsCount: 1,
    footerRowsCount: 0,
    headerHeight: 8,
    rowHeight: 8,
    showBorder: true,
    cells: [{ row: 1, column: 0, text: '{Name}' }],
    ...overrides,
  } as TableComponent;

  return makeTemplate([
    band('data', 'data', {
      height: 30,
      dataBand: { dataSourceId: 'orders' },
      components: [table],
    }),
  ]);
}

function renderedTable(document: ReturnType<typeof renderReport>) {
  const table = document.pages[0].items[0].components[0];
  if (table.type !== 'table') {
    throw new Error('Expected a rendered table');
  }
  return table;
}

describe('phase 40 table binding', () => {
  it('normalizes existing tables to fixed binding mode', () => {
    const normalized = normalizeTemplate(tableTemplate());
    const table = normalized.pages[0].bands[0].components[0];

    expect(table).toMatchObject({ type: 'table', binding: { mode: 'fixed' } });
  });

  it('keeps fixed tables from expanding current-row array fields', () => {
    const template = tableTemplate({
      binding: { mode: 'fixed' },
      cells: [{ row: 1, column: 0, text: '{Items.Name}' }],
    } as Partial<TableComponent>);

    const document = renderReport(template, {
      orders: [{ Items: [{ Name: 'A' }, { Name: 'B' }] }],
    });

    expect(renderedTable(document).rows).toHaveLength(2);
  });

  it('expands detail tables from a current-row array path', () => {
    const template = tableTemplate({
      binding: { mode: 'detail', arrayPath: 'Items' },
      cells: [{ row: 1, column: 0, text: '{Name}' }],
    } as Partial<TableComponent>);

    const document = renderReport(template, {
      orders: [{ Items: [{ Name: 'A' }, { Name: 'B' }] }],
    });

    expect(renderedTable(document).rows.map(row => row[0].content)).toEqual(['Name', 'A', 'B']);
  });

  it('expands detail tables from a top-level JSON data source', () => {
    const template = tableTemplate({
      binding: { mode: 'detail', dataSourceId: 'items' },
      dataSource: '',
      cells: [{ row: 1, column: 0, text: '{Name}' }],
    } as Partial<TableComponent>);
    template.dataSources.push({ id: 'items', name: 'Items', type: 'json', fields: [] });

    const document = renderReport(template, {
      orders: [{ Name: 'Order A' }],
      items: [{ Name: 'A' }, { Name: 'B' }],
    });

    expect(renderedTable(document).rows.map(row => row[0].content)).toEqual(['Name', 'A', 'B']);
  });
});
