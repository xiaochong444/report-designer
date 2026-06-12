import type { BorderConfig, Padding, TableCell, TableComponent, TableRow } from '@report-designer/core';
import { band, commonTextStyleIds, documentHeaderBarcode, moneyExpression, template, text } from './common';

export const storeDailySalesData = {
  reportNo: 'RB-20260610-SH',
  reportDate: '2026-06-10',
  region: '华东大区',
  lines: [
    { storeName: '南京新街口店', styleNo: 'KZ-86021', productName: '特种绣花针织裤', color: '藏青', size: 'M', qty: 3, unitPrice: 199, lineAmount: 597 },
    { storeName: '南京新街口店', styleNo: 'KZ-86022', productName: '弹力修身休闲裤', color: '米白', size: 'L', qty: 2, unitPrice: 169, lineAmount: 338 },
    { storeName: '南京新街口店', styleNo: 'KZ-86024', productName: '纯棉圆领T恤', color: '黑色', size: 'XL', qty: 5, unitPrice: 89, lineAmount: 445 },
    { storeName: '南京新街口店', styleNo: 'KZ-86028', productName: '针织开衫', color: '杏色', size: 'M', qty: 1, unitPrice: 159, lineAmount: 159 },
    { storeName: '南京新街口店', styleNo: 'KZ-86029', productName: '连帽卫衣', color: '酒红', size: 'L', qty: 2, unitPrice: 189, lineAmount: 378 },
    { storeName: '南京新街口店', styleNo: 'KZ-86031', productName: '雪纺连衣裙', color: '粉色', size: 'S', qty: 1, unitPrice: 259, lineAmount: 259 },
    { storeName: '南京新街口店', styleNo: 'KZ-86033', productName: '羽绒马甲', color: '黑色', size: 'XL', qty: 1, unitPrice: 299, lineAmount: 299 },
    { storeName: '南京新街口店', styleNo: 'KZ-86035', productName: '真皮腰带', color: '棕色', size: '均码', qty: 2, unitPrice: 79, lineAmount: 158 },
    { storeName: '上海淮海路店', styleNo: 'KZ-86021', productName: '特种绣花针织裤', color: '藏青', size: 'L', qty: 4, unitPrice: 199, lineAmount: 796 },
    { storeName: '上海淮海路店', styleNo: 'KZ-86023', productName: '轻薄防晒外套', color: '浅蓝', size: 'M', qty: 3, unitPrice: 229, lineAmount: 687 },
    { storeName: '上海淮海路店', styleNo: 'KZ-86025', productName: '亚麻休闲衬衫', color: '卡其', size: 'L', qty: 2, unitPrice: 179, lineAmount: 358 },
    { storeName: '上海淮海路店', styleNo: 'KZ-86026', productName: '运动束脚裤', color: '深灰', size: 'M', qty: 3, unitPrice: 149, lineAmount: 447 },
    { storeName: '上海淮海路店', styleNo: 'KZ-86027', productName: '牛仔半身裙', color: '靛蓝', size: 'S', qty: 2, unitPrice: 199, lineAmount: 398 },
    { storeName: '上海淮海路店', styleNo: 'KZ-86030', productName: '工装短裤', color: '军绿', size: 'L', qty: 1, unitPrice: 129, lineAmount: 129 },
    { storeName: '上海淮海路店', styleNo: 'KZ-86032', productName: '羊毛呢大衣', color: '驼色', size: 'M', qty: 1, unitPrice: 599, lineAmount: 599 },
    { storeName: '上海淮海路店', styleNo: 'KZ-86034', productName: '格子围巾', color: '灰格', size: '均码', qty: 4, unitPrice: 59, lineAmount: 236 },
    { storeName: '杭州武林店', styleNo: 'KZ-86022', productName: '弹力修身休闲裤', color: '米白', size: 'S', qty: 2, unitPrice: 169, lineAmount: 338 },
    { storeName: '杭州武林店', styleNo: 'KZ-86024', productName: '纯棉圆领T恤', color: '白色', size: 'M', qty: 6, unitPrice: 89, lineAmount: 534 },
    { storeName: '杭州武林店', styleNo: 'KZ-86028', productName: '针织开衫', color: '杏色', size: 'L', qty: 2, unitPrice: 159, lineAmount: 318 },
    { storeName: '杭州武林店', styleNo: 'KZ-86029', productName: '连帽卫衣', color: '酒红', size: 'XL', qty: 1, unitPrice: 189, lineAmount: 189 },
    { storeName: '杭州武林店', styleNo: 'KZ-86031', productName: '雪纺连衣裙', color: '粉色', size: 'M', qty: 2, unitPrice: 259, lineAmount: 518 },
    { storeName: '杭州武林店', styleNo: 'KZ-86033', productName: '羽绒马甲', color: '黑色', size: 'L', qty: 1, unitPrice: 299, lineAmount: 299 },
    { storeName: '杭州武林店', styleNo: 'KZ-86036', productName: '棉麻阔腿裤', color: '白色', size: 'M', qty: 3, unitPrice: 169, lineAmount: 507 },
    { storeName: '杭州武林店', styleNo: 'KZ-86035', productName: '真皮腰带', color: '棕色', size: '均码', qty: 1, unitPrice: 79, lineAmount: 79 },
  ],
};

const tableWidths = [26, 46, 20, 16, 18, 24, 40];
const cellPadding: Padding = { top: 1, right: 1.5, bottom: 1, left: 1.5 };
const fullBorder: BorderConfig = {
  style: 'solid',
  width: 0.2,
  color: '#9ca3af',
  sides: { top: true, right: true, bottom: true, left: true },
};
const detailBorder: BorderConfig = {
  style: 'solid',
  width: 0.2,
  color: '#d1d5db',
  sides: { top: false, right: true, bottom: true, left: true },
};

function tableCell(textValue: string, columnIndex: number, overrides: Partial<TableCell> = {}): TableCell {
  return {
    id: `sds_cell_${columnIndex + 1}`,
    column: columnIndex,
    text: textValue,
    width: tableWidths[columnIndex],
    padding: cellPadding,
    ...overrides,
  };
}

function tableRow(id: string, height: number, cells: TableCell[], overrides: Partial<TableRow> = {}): TableRow {
  return { id, height, role: 'normal', verticalAlign: 'middle', ...overrides, cells };
}

function salesTable(id: string, height: number, rows: TableRow[], border: BorderConfig): TableComponent {
  return {
    id,
    name: id,
    type: 'table',
    x: 0,
    y: 0,
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

const headerTable = salesTable('sds-header-table', 8, [
  tableRow('sds-header-row', 8, [
    tableCell('款号', 0),
    tableCell('品名', 1),
    tableCell('颜色', 2),
    tableCell('尺码', 3),
    tableCell('数量', 4),
    tableCell('零售价', 5),
    tableCell('金额', 6),
  ], {
    font: { size: 9, bold: true, color: '#111827' },
    backgroundColor: '#f3f4f6',
    textAlign: 'center',
  }),
], fullBorder);

const detailTable = salesTable('sds-detail-table', 8, [
  tableRow('sds-detail-row', 8, [
    tableCell('{lines.styleNo}', 0),
    tableCell('{lines.productName}', 1),
    tableCell('{lines.color}', 2),
    tableCell('{lines.size}', 3),
    tableCell('{lines.qty}', 4, { textAlign: 'right' }),
    tableCell(moneyExpression('lines', 'unitPrice'), 5, { textAlign: 'right' }),
    tableCell(moneyExpression('lines', 'lineAmount'), 6, { textAlign: 'right' }),
  ], {
    font: { size: 9, color: '#111827' },
  }),
], detailBorder);

const groupFooterTable = salesTable('sds-group-footer-table', 8, [
  tableRow('sds-group-footer-row', 8, [
    tableCell('门店小计', 0, { colSpan: 4, textAlign: 'center' }),
    tableCell('笔数：COUNT({lines.styleNo})', 4, { colSpan: 2, textAlign: 'right' }),
    tableCell('小计：FORMAT("N2", SUM({lines.lineAmount}))', 6, { textAlign: 'right' }),
  ], {
    font: { size: 9, bold: true, color: '#111827' },
    backgroundColor: '#f9fafb',
  }),
], fullBorder);

const footerTable = salesTable('sds-footer-table', 8, [
  tableRow('sds-footer-row', 8, [
    tableCell('合计', 0, { colSpan: 4, textAlign: 'center' }),
    tableCell('总笔数：COUNT({lines.styleNo})', 4, { colSpan: 2, textAlign: 'right' }),
    tableCell('合计：FORMAT("N2", SUM({lines.lineAmount}))', 6, { textAlign: 'right' }),
  ], {
    font: { size: 10, bold: true, color: '#111827' },
    backgroundColor: '#eef2ff',
  }),
], fullBorder);

export const storeDailySalesTemplate = template('store-daily-sales', '门店销售日报', [
  band('sds-title', 'reportTitle', 36, [
    text('sds-title-text', '门店销售日报', 0, 0, 130, 10, { style: commonTextStyleIds.title, textAlign: 'center' }),
    documentHeaderBarcode('sds-barcode', 'reportNo'),
    text('sds-no-label', '日报编号', 0, 14, 20, 6, { style: commonTextStyleIds.header }),
    text('sds-no', '{reportNo}', 22, 14, 50, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('sds-date-label', '报表日期', 76, 14, 20, 6, { style: commonTextStyleIds.header }),
    text('sds-date', 'FORMAT("CN_DATE", {reportDate})', 98, 14, 34, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('sds-region-label', '区域', 136, 14, 14, 6, { style: commonTextStyleIds.header }),
    text('sds-region', '{region}', 152, 14, 30, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('sds-note', '按门店分组汇总当日 SKU 销售明细', 0, 24, 130, 6, { style: commonTextStyleIds.pageHeader }),
  ]),
  band('sds-header', 'header', 8, [headerTable]),
  band('sds-group-header', 'groupHeader', 10, [
    text('sds-group-name', '门店：{lines.storeName}', 0, 2, 120, 6, { style: commonTextStyleIds.group }),
  ], { group: { conditionExpression: '{lines.storeName}', sortDirection: 'asc' } }),
  band('sds-data', 'data', 8, [detailTable], { dataBand: { dataSourceId: 'lines', sort: [{ field: 'storeName', direction: 'asc' }] } }),
  band('sds-group-footer', 'groupFooter', 8, [groupFooterTable]),
  band('sds-footer', 'footer', 8, [footerTable]),
  band('sds-page-footer', 'pageFooter', 8, [
    text('sds-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footerCenter }),
  ]),
]);
