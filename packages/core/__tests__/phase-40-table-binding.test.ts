import { describe, expect, it } from 'vitest';
import { renderReport } from '../src';
import { normalizeTemplate } from '../src/template-model/normalize-template';
import type { ReportComponent, ReportTemplate } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

function rowTable(text: string, id = 'table-1'): ReportComponent {
  return {
    id,
    type: 'table',
    x: 0,
    y: 0,
    width: 60,
    height: 8,
    rowCount: 1,
    columnCount: 1,
    rows: [{
      id: `${id}-row`,
      height: 8,
      cells: [{ id: `${id}-cell`, text, width: 60 }],
    }],
    showBorder: true,
  } as ReportComponent;
}

function tableTemplate(component: ReportComponent): ReportTemplate {
  return makeTemplate([
    band('data', 'data', {
      height: 8,
      dataBand: { dataSourceId: 'orders' },
      components: [component],
    }),
  ]);
}

function renderedTables(document: ReturnType<typeof renderReport>) {
  return document.pages.flatMap(page => page.items).flatMap(item => item.components).filter(component => component.type === 'table') as any[];
}

describe('phase 40 table binding removal', () => {
  it('normalizes table binding fields away', () => {
    const normalized = normalizeTemplate(tableTemplate({
      ...rowTable('{orders.Name}'),
      dataSource: 'orders',
      binding: { mode: 'detail', dataSourceId: 'items', arrayPath: 'Items' },
    } as ReportComponent));
    const table = normalized.pages[0].bands[0].components[0] as any;

    expect(table.binding).toBeUndefined();
    expect(table.dataSource).toBeUndefined();
  });

  it('does not expand rows from obsolete table binding settings', () => {
    const template = tableTemplate({
      ...rowTable('{orders.Name}'),
      binding: { mode: 'detail', arrayPath: 'Items' },
    } as ReportComponent);

    const document = renderReport(template, {
      orders: [{ Name: 'Order A', Items: [{ Name: 'A' }, { Name: 'B' }] }],
    });

    expect(renderedTables(document).map(table => table.rows[0][0].content)).toEqual(['Order A']);
  });

  it('repeats a row-cell table through its data band data source', () => {
    const template = makeTemplate([
      band('data', 'data', {
        height: 8,
        dataBand: { dataSourceId: 'items' },
        components: [rowTable('{items.Name}')],
      }),
    ]);

    const document = renderReport(template, {
      items: [{ Name: 'A' }, { Name: 'B' }],
    });

    expect(renderedTables(document).map(table => table.rows[0][0].content)).toEqual(['A', 'B']);
  });
});
