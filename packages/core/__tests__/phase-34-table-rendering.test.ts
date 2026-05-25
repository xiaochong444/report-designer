import { renderReport } from '../src/pagination/paginate';
import { createDefaultTemplate } from '../src/template-model/template';
import type { TableComponent } from '../src/template-model/types';

describe('phase 34 table rendering', () => {
  it('carries table cell expression, format, and style into the render document', () => {
    const template = createDefaultTemplate('Table Cell Rendering');
    template.dataSources = [{
      id: 'orders',
      name: 'orders',
      type: 'json',
      schema: [{ name: 'amount', type: 'number' }],
    }];
    const dataBand = template.pages[0].bands.find(band => band.type === 'data');
    if (!dataBand) throw new Error('Missing data band');
    dataBand.dataBand = { dataSourceId: 'orders' };
    dataBand.components = [{
      id: 'table-1',
      type: 'table',
      x: 0,
      y: 0,
      width: 80,
      height: 20,
      dataSource: 'orders',
      columns: [{ id: 'amount', header: 'Amount', field: 'amount', width: 80, cellType: 'text' }],
      rowCount: 2,
      columnCount: 1,
      headerRowsCount: 1,
      footerRowsCount: 0,
      headerHeight: 8,
      rowHeight: 8,
      showBorder: true,
      cells: [{
        row: 1,
        column: 0,
        text: '{orders.amount}',
        backgroundColor: '#fffbe6',
        padding: { top: 1, right: 2, bottom: 1, left: 2 },
        textAlign: 'right',
        verticalAlign: 'middle',
        border: { style: 'solid', width: 0.2, color: '#1677ff', sides: { top: true, right: true, bottom: true, left: true } },
        format: { type: 'currency', currencySymbol: '$', decimalDigits: 2 },
      }],
    } as TableComponent];

    const document = renderReport(template, { orders: [{ amount: 1234.5 }] });
    const table = document.pages[0].items.flatMap(item => item.components).find(component => component.id === 'table-1');

    expect(table).toMatchObject({
      type: 'table',
      rows: [
        [{ content: 'Amount', isHeader: true }],
        [{
          content: '$1,234.50',
          style: {
            backgroundColor: '#fffbe6',
            padding: { top: 1, right: 2, bottom: 1, left: 2 },
            textAlign: 'right',
            verticalAlign: 'middle',
            border: { style: 'solid', width: 0.2, color: '#1677ff', sides: { top: true, right: true, bottom: true, left: true } },
          },
        }],
      ],
    });
  });
});
