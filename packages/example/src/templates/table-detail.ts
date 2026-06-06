import type { BorderConfig, Padding, TableCell, TableComponent, TableRow } from '@report-designer/core';
import { band, commonTextStyleIds, template, text } from './common';

const fullBorder: BorderConfig = {
  style: 'solid',
  width: 0.2,
  color: '#aeb8c4',
  sides: { top: true, right: true, bottom: true, left: true },
};

const detailBorder: BorderConfig = {
  style: 'solid',
  width: 0.2,
  color: '#aeb8c4',
  sides: { top: false, right: true, bottom: true, left: true },
};

const padding: Padding = { top: 1, right: 1, bottom: 1, left: 1 };
const widths = [28, 44, 20, 42, 18, 30];

function cell(textValue: string, columnIndex: number, overrides: Partial<TableCell> = {}): TableCell {
  return {
    id: `cell_${columnIndex + 1}`,
    text: textValue,
    width: widths[columnIndex],
    padding,
    ...overrides,
  };
}

function row(id: string, cells: TableCell[], overrides: Partial<TableRow> = {}): TableRow {
  return {
    id,
    height: 7,
    role: 'normal',
    verticalAlign: 'middle',
    ...overrides,
    cells,
  };
}

function table(id: string, y: number, rows: TableRow[], border: BorderConfig): TableComponent {
  return {
    id,
    name: id,
    type: 'table',
    x: 0,
    y,
    width: 182,
    height: rows.reduce((sum, item) => sum + (item.height ?? 7), 0),
    rowCount: rows.length,
    columnCount: widths.length,
    rows,
    border,
    padding,
    showBorder: true,
    canBreak: true,
  };
}

const headerTable = table('table-detail-header-table', 0, [
  row('table-detail-header-row', [
    cell('Order', 0),
    cell('Customer', 1),
    cell('SKU', 2),
    cell('Item', 3),
    cell('Qty', 4),
    cell('Total', 5),
  ], {
    role: 'header',
    backgroundColor: '#eef2f7',
    font: { size: 9, bold: true, color: '#172033' },
    textAlign: 'center',
  }),
], fullBorder);

const detailTable = table('table-detail-line-table', 0, [
  row('table-detail-line-row', [
    cell('{orderLines.orderNo}', 0),
    cell('{orderLines.customer}', 1),
    cell('{orderLines.sku}', 2),
    cell('{orderLines.name}', 3),
    cell('{orderLines.qty}', 4, { textAlign: 'right' }),
    cell('FORMAT("N2", {orderLines.lineTotal})', 5, { textAlign: 'right' }),
  ], {
    font: { size: 9, color: '#172033' },
  }),
], detailBorder);

export const tableDetailTemplate = template('table-detail', 'Table Detail', [
  band('table-detail-title', 'reportTitle', 12, [
    text('table-detail-title-text', 'Order Items Table', 0, 1, 190, 8, { style: commonTextStyleIds.title, textAlign: 'center' }),
  ]),
  band('table-detail-header', 'header', 12, [
    text('table-detail-caption', 'Items are rendered by an orderLines data band with a row/cell table.', 0, 1, 150, 5, { style: commonTextStyleIds.pageHeader }),
    headerTable,
  ]),
  band('table-detail-data', 'data', 7, [
    detailTable,
  ], { dataBand: { dataSourceId: 'orderLines', sort: [{ field: 'orderNo', direction: 'asc' }] } }),
  band('table-detail-page-footer', 'pageFooter', 8, [
    text('table-detail-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footer, textAlign: 'center' }),
  ]),
], 297);
