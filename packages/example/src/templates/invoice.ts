import { band, moneyExpression, template, text } from './common';

export const invoiceTemplate = template('invoice', 'Invoice', [
  band('inv-title', 'reportTitle', 14, [
    text('inv-title-text', 'Invoice SO-1008', 0, 1, 90, 8, { font: { size: 16, bold: true } }),
    text('inv-customer', 'Customer: Summit Education', 100, 2, 80, 6),
  ]),
  band('inv-header', 'header', 10, [
    text('inv-h-sku', 'SKU', 0, 2, 24, 5, { font: { bold: true } }),
    text('inv-h-name', 'Item', 28, 2, 68, 5, { font: { bold: true } }),
    text('inv-h-qty', 'Qty', 102, 2, 16, 5, { font: { bold: true }, textAlign: 'right' }),
    text('inv-h-unit', 'Unit', 124, 2, 24, 5, { font: { bold: true }, textAlign: 'right' }),
    text('inv-h-total', 'Total', 154, 2, 28, 5, { font: { bold: true }, textAlign: 'right' }),
  ]),
  band('inv-data', 'data', 9, [
    text('inv-sku', '{invoiceLines.sku}', 0, 1, 24, 5),
    text('inv-name', '{invoiceLines.name}', 28, 1, 68, 5),
    text('inv-qty', '{invoiceLines.qty}', 102, 1, 16, 5, { textAlign: 'right' }),
    text('inv-unit', moneyExpression('invoiceLines', 'unitPrice'), 124, 1, 24, 5, { textAlign: 'right' }),
    text('inv-total', moneyExpression('invoiceLines', 'lineTotal'), 154, 1, 28, 5, { textAlign: 'right' }),
  ], { dataBand: { dataSourceId: 'invoiceLines' } }),
  band('inv-footer', 'footer', 20, [
    text('inv-subtotal', 'SUM("invoiceLines", "{invoiceLines.lineTotal}")', 100, 1, 82, 5, { textAlign: 'right' }),
    text('inv-tax', 'SUM("invoiceLines", "{invoiceLines.lineTotal}") * 0.1', 100, 7, 82, 5, { textAlign: 'right' }),
    text('inv-grand', 'SUM("invoiceLines", "{invoiceLines.lineTotal}") * 1.1', 100, 13, 82, 5, { font: { bold: true }, textAlign: 'right' }),
  ]),
  band('inv-page-footer', 'pageFooter', 8, [
    text('inv-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { textAlign: 'center' }),
  ]),
], 120);
