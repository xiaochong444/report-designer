import { band, moneyExpression, template, text } from './common';

export const masterDetailOrdersTemplate = template('master-detail-orders', 'Master Detail Orders', [
  band('mdo-title', 'reportTitle', 12, [
    text('mdo-title-text', 'Order Lines by Order', 0, 1, 190, 8, { font: { size: 15, bold: true }, textAlign: 'center' }),
  ]),
  band('mdo-group-header', 'groupHeader', 12, [
    text('mdo-order', 'Order {orderLines.orderNo}', 0, 2, 45, 6, { font: { bold: true, color: '#0f4c9c' } }),
    text('mdo-customer', '{orderLines.customer}', 48, 2, 75, 6, { font: { bold: true } }),
    text('mdo-date', '{orderLines.orderDate}', 128, 2, 40, 6),
  ], { group: { name: 'orderNo', conditionExpression: '{orderLines.orderNo}' } }),
  band('mdo-data', 'data', 8, [
    text('mdo-sku', '{orderLines.sku}', 8, 1, 24, 5),
    text('mdo-name', '{orderLines.name}', 36, 1, 72, 5),
    text('mdo-qty', '{orderLines.qty}', 112, 1, 16, 5, { textAlign: 'right' }),
    text('mdo-line-total', moneyExpression('orderLines', 'lineTotal'), 136, 1, 34, 5, { textAlign: 'right' }),
  ], { dataBand: { dataSourceId: 'orderLines', sort: [{ field: 'orderNo', direction: 'asc' }] } }),
  band('mdo-group-footer', 'groupFooter', 9, [
    text('mdo-order-total', 'SUM("orderLines", "{orderLines.lineTotal}")', 90, 1, 80, 5, { textAlign: 'right' }),
  ], { group: { name: 'orderNo' } }),
  band('mdo-footer', 'footer', 10, [
    text('mdo-report-total', 'SUM("orderLines", "{orderLines.lineTotal}")', 90, 2, 80, 5, { font: { bold: true }, textAlign: 'right' }),
  ]),
  band('mdo-page-footer', 'pageFooter', 8, [
    text('mdo-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { textAlign: 'center' }),
  ]),
], 95);
