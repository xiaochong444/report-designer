import type { ReportStyleV2 } from '@report-designer/core';
import { band, commonTextStyleIds, moneyExpression, template, text } from './common';

const masterDetailOrderStyles: ReportStyleV2[] = [
  {
    id: 'mdo-group-customer',
    name: 'Master Detail Customer',
    category: 'text',
    font: { bold: true, color: '#1f2937' },
    backgroundColor: 'transparent',
    verticalAlign: 'middle',
  },
  {
    id: 'mdo-total-emphasis',
    name: 'Master Detail Total Emphasis',
    category: 'text',
    font: { size: 9, color: '#1f2937', bold: true },
    backgroundColor: 'transparent',
    verticalAlign: 'middle',
  },
];

export const masterDetailOrdersTemplate = template('master-detail-orders', 'Master Detail Orders', [
  band('mdo-title', 'reportTitle', 12, [
    text('mdo-title-text', 'Order Lines by Order', 0, 1, 190, 8, { style: commonTextStyleIds.title, textAlign: 'center' }),
  ]),
  band('mdo-group-header', 'groupHeader', 12, [
    text('mdo-order', 'Order {orderLines.orderNo}', 0, 2, 45, 6, { style: commonTextStyleIds.group }),
    text('mdo-customer', '{orderLines.customer}', 48, 2, 75, 6, { style: 'mdo-group-customer' }),
    text('mdo-date', '{orderLines.orderDate}', 128, 2, 40, 6, { style: commonTextStyleIds.data }),
  ], { group: { name: 'orderNo', conditionExpression: '{orderLines.orderNo}' } }),
  band('mdo-data', 'data', 8, [
    text('mdo-sku', '{orderLines.sku}', 8, 1, 24, 5, { style: commonTextStyleIds.data }),
    text('mdo-name', '{orderLines.name}', 36, 1, 72, 5, { style: commonTextStyleIds.data }),
    text('mdo-qty', '{orderLines.qty}', 112, 1, 16, 5, { style: commonTextStyleIds.data, textAlign: 'right' }),
    text('mdo-line-total', moneyExpression('orderLines', 'lineTotal'), 136, 1, 34, 5, { style: commonTextStyleIds.data, textAlign: 'right' }),
  ], { dataBand: { dataSourceId: 'orderLines', sort: [{ field: 'orderNo', direction: 'asc' }] } }),
  band('mdo-group-footer', 'groupFooter', 9, [
    text('mdo-order-total', 'SUM("orderLines", "{orderLines.lineTotal}")', 90, 1, 80, 5, { style: commonTextStyleIds.footer, textAlign: 'right' }),
  ], { group: { name: 'orderNo' } }),
  band('mdo-footer', 'footer', 10, [
    text('mdo-report-total', 'SUM("orderLines", "{orderLines.lineTotal}")', 90, 2, 80, 5, { style: 'mdo-total-emphasis', textAlign: 'right' }),
  ]),
  band('mdo-page-footer', 'pageFooter', 8, [
    text('mdo-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footer, textAlign: 'center' }),
  ]),
], 297, masterDetailOrderStyles);
