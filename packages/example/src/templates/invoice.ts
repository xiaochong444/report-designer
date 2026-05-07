import type { ReportStyleV2 } from '@report-designer/core';
import { band, commonTextStyleIds, moneyExpression, template, text } from './common';

const invoiceStyles: ReportStyleV2[] = [
  {
    id: 'invoice-title',
    name: 'Invoice Title',
    category: 'text',
    font: { size: 16, bold: true },
    backgroundColor: 'transparent',
    verticalAlign: 'middle',
  },
  {
    id: 'invoice-total-emphasis',
    name: 'Invoice Total Emphasis',
    category: 'text',
    font: { size: 9, color: '#1f2937', bold: true },
    backgroundColor: 'transparent',
    verticalAlign: 'middle',
  },
];

export const invoiceTemplate = template('invoice', 'Invoice', [
  band('inv-title', 'reportTitle', 14, [
    text('inv-title-text', 'Invoice SO-1008', 0, 1, 90, 8, { style: 'invoice-title' }),
    text('inv-customer', 'Customer: Summit Education', 100, 2, 80, 6, { style: commonTextStyleIds.data }),
  ]),
  band('inv-header', 'header', 10, [
    text('inv-h-sku', 'SKU', 0, 2, 24, 5, { style: commonTextStyleIds.header }),
    text('inv-h-name', 'Item', 28, 2, 68, 5, { style: commonTextStyleIds.header }),
    text('inv-h-qty', 'Qty', 102, 2, 16, 5, { style: commonTextStyleIds.header, textAlign: 'right' }),
    text('inv-h-unit', 'Unit', 124, 2, 24, 5, { style: commonTextStyleIds.header, textAlign: 'right' }),
    text('inv-h-total', 'Total', 154, 2, 28, 5, { style: commonTextStyleIds.header, textAlign: 'right' }),
  ]),
  band('inv-data', 'data', 9, [
    text('inv-sku', '{invoiceLines.sku}', 0, 1, 24, 5, { style: commonTextStyleIds.data }),
    text('inv-name', '{invoiceLines.name}', 28, 1, 68, 5, { style: commonTextStyleIds.data }),
    text('inv-qty', '{invoiceLines.qty}', 102, 1, 16, 5, { style: commonTextStyleIds.data, textAlign: 'right' }),
    text('inv-unit', moneyExpression('invoiceLines', 'unitPrice'), 124, 1, 24, 5, { style: commonTextStyleIds.data, textAlign: 'right' }),
    text('inv-total', moneyExpression('invoiceLines', 'lineTotal'), 154, 1, 28, 5, { style: commonTextStyleIds.data, textAlign: 'right' }),
  ], { dataBand: { dataSourceId: 'invoiceLines' } }),
  band('inv-footer', 'footer', 20, [
    text('inv-subtotal', 'SUM("invoiceLines", "{invoiceLines.lineTotal}")', 100, 1, 82, 5, { style: commonTextStyleIds.footer, textAlign: 'right' }),
    text('inv-tax', 'SUM("invoiceLines", "{invoiceLines.lineTotal}") * 0.1', 100, 7, 82, 5, { style: commonTextStyleIds.footer, textAlign: 'right' }),
    text('inv-grand', 'SUM("invoiceLines", "{invoiceLines.lineTotal}") * 1.1', 100, 13, 82, 5, { style: 'invoice-total-emphasis', textAlign: 'right' }),
  ]),
  band('inv-page-footer', 'pageFooter', 8, [
    text('inv-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footer, textAlign: 'center' }),
  ]),
], 297, invoiceStyles);
