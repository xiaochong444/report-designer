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

  it('splits tall tables across pages and repeats header rows', () => {
    const template = createDefaultTemplate('Table Header Repeat');
    const page = template.pages[0];
    page.height = 70;
    page.margins = { top: 5, right: 5, bottom: 5, left: 5 };
    page.bands = [{
      id: 'report-table-band',
      type: 'reportTitle',
      height: 60,
      components: [{
        id: 'table-1',
        type: 'table',
        x: 0,
        y: 0,
        width: 80,
        height: 60,
        dataSource: '',
        columns: [{ id: 'name', header: 'Name', field: 'name', width: 80, cellType: 'text' }],
        rowCount: 7,
        columnCount: 1,
        headerRowsCount: 1,
        footerRowsCount: 0,
        headerHeight: 8,
        rowHeight: 10,
        showBorder: true,
        canBreak: true,
        cells: Array.from({ length: 6 }, (_, index) => ({
          row: index + 1,
          column: 0,
          text: `Row ${index + 1}`,
        })),
      } as TableComponent],
    }];

    const document = renderReport(template, {});
    const firstPageTable = document.pages[0].items[0].components.find(component => component.id === 'table-1');
    const secondPageTable = document.pages[1].items[0].components.find(component => component.id === 'table-1');

    expect(document.pages.length).toBe(2);
    expect(firstPageTable).toMatchObject({
      type: 'table',
      rows: [
        [{ content: 'Name', isHeader: true }],
        [{ content: 'Row 1' }],
        [{ content: 'Row 2' }],
        [{ content: 'Row 3' }],
        [{ content: 'Row 4' }],
        [{ content: 'Row 5' }],
      ],
      height: 58,
    });
    expect(secondPageTable).toMatchObject({
      type: 'table',
      rows: [
        [{ content: 'Name', row: 0, isHeader: true }],
        [{ content: 'Row 6', row: 1 }],
      ],
      height: 18,
    });
  });

  it('keeps table footer rows only on the final split page', () => {
    const template = createDefaultTemplate('Table Footer Split');
    const page = template.pages[0];
    page.height = 70;
    page.margins = { top: 5, right: 5, bottom: 5, left: 5 };
    page.bands = [{
      id: 'report-table-band',
      type: 'reportTitle',
      height: 60,
      components: [{
        id: 'table-1',
        type: 'table',
        x: 0,
        y: 0,
        width: 80,
        height: 60,
        dataSource: '',
        columns: [{ id: 'name', header: 'Name', field: 'name', width: 80, cellType: 'text' }],
        rowCount: 8,
        columnCount: 1,
        headerRowsCount: 1,
        footerRowsCount: 1,
        headerHeight: 8,
        rowHeight: 10,
        showBorder: true,
        canBreak: true,
        cells: [
          ...Array.from({ length: 6 }, (_, index) => ({
            row: index + 1,
            column: 0,
            text: `Row ${index + 1}`,
          })),
          { row: 7, column: 0, text: 'Grand Total' },
        ],
      } as TableComponent],
    }];

    const document = renderReport(template, {});
    const firstPageRows = document.pages[0].items[0].components
      .find(component => component.id === 'table-1' && component.type === 'table')?.rows;
    const lastPageRows = document.pages[document.pages.length - 1].items[0].components
      .find(component => component.id === 'table-1' && component.type === 'table')?.rows;

    expect(firstPageRows?.flat().map(cell => cell.content)).not.toContain('Grand Total');
    expect(lastPageRows?.flat().map(cell => cell.content)).toContain('Grand Total');
    expect(lastPageRows?.flat().map(cell => cell.row)).toEqual([0, 1, 2]);
  });

  it('places split table chunks after repeated page headers', () => {
    const template = createDefaultTemplate('Table With Page Header');
    const page = template.pages[0];
    page.height = 70;
    page.margins = { top: 5, right: 5, bottom: 5, left: 5 };
    page.bands = [
      {
        id: 'page-header',
        type: 'pageHeader',
        height: 10,
        components: [{ id: 'header-text', type: 'text', x: 0, y: 0, width: 50, height: 6, text: 'Header', font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' }, textAlign: 'left', verticalAlign: 'top', border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } }, canGrow: false, canShrink: false }],
        behavior: { enabled: true, printOn: 'allPages', printIfEmpty: true, printOnAllPages: true, keepTogether: false, canBreak: false, printAtBottom: false },
      },
      {
        id: 'report-table-band',
        type: 'reportTitle',
        height: 60,
        components: [{
          id: 'table-1',
          type: 'table',
          x: 0,
          y: 0,
          width: 80,
          height: 60,
          dataSource: '',
          columns: [{ id: 'name', header: 'Name', field: 'name', width: 80, cellType: 'text' }],
          rowCount: 7,
          columnCount: 1,
          headerRowsCount: 1,
          footerRowsCount: 0,
          headerHeight: 8,
          rowHeight: 10,
          showBorder: true,
          canBreak: true,
          cells: Array.from({ length: 6 }, (_, index) => ({
            row: index + 1,
            column: 0,
            text: `Row ${index + 1}`,
          })),
        } as TableComponent],
      },
    ];

    const document = renderReport(template, {});
    const secondPageTableBand = document.pages[1].items.find(item => item.bandId === 'report-table-band');

    expect(document.pages[1].items[0]).toMatchObject({ bandId: 'page-header', y: 5, height: 10 });
    expect(secondPageTableBand).toMatchObject({ y: 15 });
    expect((secondPageTableBand?.y ?? 0) + (secondPageTableBand?.height ?? 0)).toBeLessThanOrEqual(65);
  });

  it('keeps a tall table together when table breaking is disabled', () => {
    const template = createDefaultTemplate('Table No Break');
    const page = template.pages[0];
    page.height = 70;
    page.margins = { top: 5, right: 5, bottom: 5, left: 5 };
    page.bands = [{
      id: 'report-table-band',
      type: 'reportTitle',
      height: 60,
      components: [{
        id: 'table-1',
        type: 'table',
        x: 0,
        y: 0,
        width: 80,
        height: 60,
        dataSource: '',
        columns: [{ id: 'name', header: 'Name', field: 'name', width: 80, cellType: 'text' }],
        rowCount: 7,
        columnCount: 1,
        headerRowsCount: 1,
        footerRowsCount: 0,
        headerHeight: 8,
        rowHeight: 10,
        showBorder: true,
        canBreak: false,
        cells: Array.from({ length: 6 }, (_, index) => ({
          row: index + 1,
          column: 0,
          text: `Row ${index + 1}`,
        })),
      } as TableComponent],
    }];

    const document = renderReport(template, {});
    const table = document.pages[0].items[0].components.find(component => component.id === 'table-1');

    expect(document.pages.length).toBe(1);
    expect(table).toMatchObject({
      type: 'table',
      rows: [
        [{ content: 'Name', isHeader: true }],
        [{ content: 'Row 1' }],
        [{ content: 'Row 2' }],
        [{ content: 'Row 3' }],
        [{ content: 'Row 4' }],
        [{ content: 'Row 5' }],
        [{ content: 'Row 6' }],
      ],
      height: 60,
    });
  });
});
