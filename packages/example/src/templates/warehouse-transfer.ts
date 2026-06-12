import type { BorderConfig, Padding, TableCell, TableComponent, TableRow } from '@report-designer/core';
import { band, commonTextStyleIds, documentHeaderBarcode, template, text } from './common';

const fullBorder: BorderConfig = {
  style: 'solid',
  width: 0.2,
  color: '#9ca3af',
  sides: { top: true, right: true, bottom: true, left: true },
};

const detailBorder: BorderConfig = {
  style: 'solid',
  width: 0.2,
  color: '#9ca3af',
  sides: { top: false, right: true, bottom: true, left: true },
};

const cellPadding: Padding = { top: 1, right: 1.2, bottom: 1, left: 1.2 };
const tableWidths = [24, 42, 16, 14, 16, 18, 22, 22];

export const warehouseTransferData = {
  transferNo: 'DB-202606-0033',
  transferDate: '2026-06-11',
  fromWarehouse: { code: 'WH-SH01', name: '上海总仓' },
  toWarehouse: { code: 'WH-NJ02', name: '南京区域仓' },
  operator: '张调度',
  remark: '夏装补货调拨，请核对款色码。',
  items: [
    { styleNo: 'KZ-86021', productName: '特种绣花针织裤', color: '藏青', size: 'M', qty: 30, unitPrice: 19.9, amount: 597 },
    { styleNo: 'KZ-86021', productName: '特种绣花针织裤', color: '藏青', size: 'L', qty: 20, unitPrice: 19.9, amount: 398 },
    { styleNo: 'KZ-86022', productName: '弹力修身休闲裤', color: '米白', size: 'S', qty: 15, unitPrice: 18, amount: 270 },
    { styleNo: 'KZ-86024', productName: '纯棉圆领T恤', color: '黑色', size: 'XL', qty: 50, unitPrice: 12.8, amount: 640 },
    { styleNo: 'KZ-86028', productName: '针织开衫', color: '杏色', size: 'M', qty: 18, unitPrice: 26.8, amount: 482.4 },
    { styleNo: 'KZ-86029', productName: '连帽卫衣', color: '酒红', size: 'L', qty: 25, unitPrice: 29.9, amount: 747.5 },
    { styleNo: 'KZ-86031', productName: '雪纺连衣裙', color: '粉色', size: 'S', qty: 10, unitPrice: 42, amount: 420 },
    { styleNo: 'KZ-86033', productName: '羽绒马甲', color: '黑色', size: 'XL', qty: 8, unitPrice: 56, amount: 448 },
    { styleNo: 'KZ-86035', productName: '真皮腰带', color: '棕色', size: '均码', qty: 20, unitPrice: 15, amount: 300 },
    { styleNo: 'KZ-86036', productName: '棉麻阔腿裤', color: '白色', size: 'M', qty: 22, unitPrice: 24.5, amount: 539 },
  ],
};

function tableCell(textValue: string, columnIndex: number, overrides: Partial<TableCell> = {}): TableCell {
  return {
    id: `cell_${columnIndex + 1}`,
    text: textValue,
    width: tableWidths[columnIndex],
    padding: cellPadding,
    ...overrides,
  };
}

function tableRow(id: string, height: number, cells: TableCell[], overrides: Partial<TableRow> = {}): TableRow {
  return { id, height, role: 'normal', verticalAlign: 'middle', ...overrides, cells };
}

function transferTable(id: string, y: number, height: number, rows: TableRow[], border: BorderConfig): TableComponent {
  return {
    id,
    name: id,
    type: 'table',
    x: 0,
    y,
    width: 190,
    height,
    rowCount: rows.length,
    columnCount: tableWidths.length,
    rows,
    border,
    padding: cellPadding,
    showBorder: true,
    canBreak: true,
  };
}

const headerTable = transferTable('wt-header-table', 0, 8, [
  tableRow('wt-header-row', 8, [
    tableCell('款号', 0),
    tableCell('品名', 1),
    tableCell('颜色', 2),
    tableCell('尺码', 3),
    tableCell('调拨数', 4),
    tableCell('单价', 5),
    tableCell('金额', 6),
    tableCell('备注', 7),
  ], {
    font: { size: 9, bold: true, color: '#111827' },
    backgroundColor: '#f3f4f6',
    textAlign: 'center',
  }),
], fullBorder);

const detailTable = transferTable('wt-detail-table', 0, 8, [
  tableRow('wt-detail-row', 8, [
    tableCell('{items.styleNo}', 0),
    tableCell('{items.productName}', 1),
    tableCell('{items.color}', 2),
    tableCell('{items.size}', 3),
    tableCell('{items.qty}', 4, { textAlign: 'right' }),
    tableCell('FORMAT("N2", {items.unitPrice})', 5, { textAlign: 'right' }),
    tableCell('FORMAT("N2", {items.amount})', 6, { textAlign: 'right' }),
    tableCell('', 7),
  ], {
    font: { size: 9, color: '#111827' },
  }),
], detailBorder);

const footerTable = transferTable('wt-footer-table', 0, 8, [
  tableRow('wt-footer-total-row', 8, [
    tableCell('合计', 0, { colSpan: 6, textAlign: 'center' }),
    tableCell('', 1),
    tableCell('', 2),
    tableCell('', 3),
    tableCell('', 4),
    tableCell('', 5),
    tableCell('FORMAT("N2", SUM({items.amount}))', 6, { textAlign: 'right' }),
    tableCell('', 7),
  ], {
    font: { size: 10, bold: true, color: '#111827' },
    backgroundColor: '#f9fafb',
  }),
], fullBorder);

export const warehouseTransferTemplate = template('warehouse-transfer', '仓库调拨单', [
  band('wt-title', 'reportTitle', 44, [
    text('wt-title-text', '仓库调拨单', 0, 0, 130, 10, { style: commonTextStyleIds.title, textAlign: 'center' }),
    documentHeaderBarcode('wt-barcode', 'transferNo'),
    text('wt-no-label', '调拨单号', 0, 16, 20, 6, { style: commonTextStyleIds.header }),
    text('wt-no', '{transferNo}', 22, 16, 50, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('wt-date-label', '调拨日期', 76, 16, 20, 6, { style: commonTextStyleIds.header }),
    text('wt-date', 'FORMAT("CN_DATE", {transferDate})', 98, 16, 34, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('wt-operator-label', '经办人', 136, 16, 18, 6, { style: commonTextStyleIds.header }),
    text('wt-operator', '{operator}', 156, 16, 26, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('wt-from-label', '调出仓库', 0, 25, 20, 6, { style: commonTextStyleIds.header }),
    text('wt-from', '{fromWarehouse.name}', 22, 25, 60, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('wt-to-label', '调入仓库', 86, 25, 20, 6, { style: commonTextStyleIds.header }),
    text('wt-to', '{toWarehouse.name}', 108, 25, 60, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('wt-remark-label', '备注', 0, 34, 14, 6, { style: commonTextStyleIds.header }),
    text('wt-remark', '{remark}', 16, 34, 174, 6, { style: commonTextStyleIds.dataBottomBorder }),
  ]),
  band('wt-detail-header', 'header', 8, [headerTable]),
  band('wt-detail', 'data', 8, [detailTable], { dataBand: { dataSourceId: 'items' } }),
  band('wt-footer', 'footer', 16, [footerTable]),
  band('wt-page-footer', 'pageFooter', 8, [
    text('wt-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footerCenter }),
  ]),
]);

warehouseTransferTemplate.dataSources = [];
