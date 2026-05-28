import type { DataField, TableComponent } from '@report-designer/core';
import { band, commonTextStyleIds, template, text } from './common';

const itemFields: DataField[] = [
  { id: 'orders.items.sku', name: 'sku', path: 'orders.items.sku', type: 'string', label: 'SKU' },
  { id: 'orders.items.name', name: 'name', path: 'orders.items.name', type: 'string', label: 'Item' },
  { id: 'orders.items.qty', name: 'qty', path: 'orders.items.qty', type: 'number', label: 'Qty' },
  { id: 'orders.items.unitPrice', name: 'unitPrice', path: 'orders.items.unitPrice', type: 'number', label: 'Unit' },
  { id: 'orders.items.lineTotal', name: 'lineTotal', path: 'orders.items.lineTotal', type: 'number', label: 'Total' },
];

const fullBorder = {
  style: 'solid' as const,
  width: 0.2,
  color: '#aeb8c4',
  sides: { top: true, right: true, bottom: true, left: true },
};

const table: TableComponent = {
  id: 'table-detail-items',
  name: 'ItemsTable',
  type: 'table',
  x: 0,
  y: 16,
  width: 182,
  height: 18,
  dataSource: '',
  binding: { mode: 'detail', dataSourceId: 'orders.items', arrayPath: 'items' },
  columns: [
    { id: 'sku', header: 'SKU', field: 'sku', width: 28, cellType: 'text' },
    { id: 'name', header: 'Item', field: 'name', width: 70, cellType: 'text' },
    { id: 'qty', header: 'Qty', field: 'qty', width: 18, cellType: 'text' },
    { id: 'unitPrice', header: 'Unit', field: 'unitPrice', width: 28, cellType: 'text' },
    { id: 'lineTotal', header: 'Total', field: 'lineTotal', width: 38, cellType: 'text' },
  ],
  rowCount: 2,
  columnCount: 5,
  headerRowsCount: 1,
  footerRowsCount: 0,
  headerHeight: 6,
  rowHeight: 6,
  canBreak: true,
  showBorder: true,
  cells: [
    { row: 1, column: 0, text: '{sku}', border: fullBorder, padding: { top: 1, right: 1, bottom: 1, left: 1 } },
    { row: 1, column: 1, text: '{name}', border: fullBorder, padding: { top: 1, right: 1, bottom: 1, left: 1 } },
    { row: 1, column: 2, text: '{qty}', textAlign: 'right', border: fullBorder, padding: { top: 1, right: 1, bottom: 1, left: 1 } },
    { row: 1, column: 3, text: '{unitPrice}', textAlign: 'right', format: { type: 'number', decimalDigits: 2 }, border: fullBorder, padding: { top: 1, right: 1, bottom: 1, left: 1 } },
    { row: 1, column: 4, text: '{lineTotal}', textAlign: 'right', format: { type: 'number', decimalDigits: 2 }, border: fullBorder, padding: { top: 1, right: 1, bottom: 1, left: 1 } },
  ],
};

export const tableDetailTemplate = template('table-detail', 'Table Detail', [
  band('table-detail-title', 'reportTitle', 12, [
    text('table-detail-title-text', 'Order Items Table', 0, 1, 190, 8, { style: commonTextStyleIds.title, textAlign: 'center' }),
  ]),
  band('table-detail-data', 'data', 38, [
    text('table-detail-order-no', 'Order: {orders.orderNo}', 0, 1, 48, 6, { style: commonTextStyleIds.group }),
    text('table-detail-customer', '{orders.customer}', 52, 1, 72, 6, { style: commonTextStyleIds.data }),
    text('table-detail-date', '{orders.orderDate}', 128, 1, 34, 6, { style: commonTextStyleIds.data }),
    text('table-detail-caption', 'Items are rendered by binding this table to orders.items.', 0, 8, 150, 5, { style: commonTextStyleIds.pageHeader }),
    table,
  ], { dataBand: { dataSourceId: 'orders', sort: [{ field: 'orderNo', direction: 'asc' }] } }),
  band('table-detail-page-footer', 'pageFooter', 8, [
    text('table-detail-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footer, textAlign: 'center' }),
  ]),
], 297);

tableDetailTemplate.dataSources.push(
  {
    id: 'orders',
    name: 'orders',
    type: 'json',
    path: 'orders',
    fields: [
      { id: 'orders.orderNo', name: 'orderNo', path: 'orders.orderNo', type: 'string', label: 'Order No' },
      { id: 'orders.customer', name: 'customer', path: 'orders.customer', type: 'string', label: 'Customer' },
      { id: 'orders.orderDate', name: 'orderDate', path: 'orders.orderDate', type: 'date', label: 'Order Date' },
    ],
  },
  {
    id: 'orders.items',
    name: 'items',
    type: 'json',
    path: 'orders.items',
    parentSourceId: 'orders',
    parentPath: 'orders',
    fields: itemFields,
  },
);
