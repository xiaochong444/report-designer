import type { BorderConfig, Padding, ReportStyle, TableCell, TableComponent, TableRow } from '@report-designer/core';
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
const tableWidths = [22, 40, 16, 14, 16, 18, 22, 22];

const purchaseReceiptStyles: ReportStyle[] = [
  {
    id: 'purchase-receipt-title',
    name: 'Purchase Receipt Title',
    category: 'text',
    font: { size: 17, bold: true, color: '#111827' },
    backgroundColor: 'transparent',
    textAlign: 'center',
    verticalAlign: 'middle',
  },
];

export const purchaseReceiptData = {
  receiptNo: 'RK-202606-0088',
  receiptDate: '2026-06-10',
  warehouse: { code: 'WH-SH01', name: '上海总仓' },
  supplier: { code: 'SUP-2201', name: '杭州织造商贸有限公司', contact: '王经理', phone: '13912345678' },
  operator: '李仓管',
  remark: '夏装首批到货，请按颜色分区上架。',
  items: [
    { styleNo: 'KZ-86021', productName: '特种绣花针织裤', color: '藏青', size: 'M', qty: 120, unitPrice: 19.9, amount: 2388 },
    { styleNo: 'KZ-86021', productName: '特种绣花针织裤', color: '藏青', size: 'L', qty: 80, unitPrice: 19.9, amount: 1592 },
    { styleNo: 'KZ-86022', productName: '弹力修身休闲裤', color: '米白', size: 'S', qty: 60, unitPrice: 18, amount: 1080 },
    { styleNo: 'KZ-86022', productName: '弹力修身休闲裤', color: '米白', size: 'M', qty: 90, unitPrice: 18, amount: 1620 },
    { styleNo: 'KZ-86023', productName: '轻薄防晒外套', color: '浅蓝', size: 'L', qty: 45, unitPrice: 32.5, amount: 1462.5 },
    { styleNo: 'KZ-86024', productName: '纯棉圆领T恤', color: '黑色', size: 'XL', qty: 200, unitPrice: 12.8, amount: 2560 },
    { styleNo: 'KZ-86025', productName: '亚麻休闲衬衫', color: '卡其', size: 'M', qty: 75, unitPrice: 28, amount: 2100 },
    { styleNo: 'KZ-86026', productName: '运动束脚裤', color: '深灰', size: 'L', qty: 110, unitPrice: 22.5, amount: 2475 },
    { styleNo: 'KZ-86027', productName: '牛仔半身裙', color: '靛蓝', size: 'S', qty: 55, unitPrice: 35, amount: 1925 },
    { styleNo: 'KZ-86028', productName: '针织开衫', color: '杏色', size: 'M', qty: 68, unitPrice: 26.8, amount: 1822.4 },
    { styleNo: 'KZ-86029', productName: '连帽卫衣', color: '酒红', size: 'L', qty: 95, unitPrice: 29.9, amount: 2840.5 },
    { styleNo: 'KZ-86030', productName: '工装短裤', color: '军绿', size: 'M', qty: 80, unitPrice: 18.5, amount: 1480 },
    { styleNo: 'KZ-86031', productName: '雪纺连衣裙', color: '粉色', size: 'S', qty: 40, unitPrice: 42, amount: 1680 },
    { styleNo: 'KZ-86032', productName: '羊毛呢大衣', color: '驼色', size: 'L', qty: 25, unitPrice: 88, amount: 2200 },
    { styleNo: 'KZ-86033', productName: '羽绒马甲', color: '黑色', size: 'XL', qty: 35, unitPrice: 56, amount: 1960 },
    { styleNo: 'KZ-86034', productName: '格子围巾', color: '灰格', size: '均码', qty: 150, unitPrice: 8.5, amount: 1275 },
    { styleNo: 'KZ-86035', productName: '真皮腰带', color: '棕色', size: '均码', qty: 60, unitPrice: 15, amount: 900 },
    { styleNo: 'KZ-86036', productName: '棉麻阔腿裤', color: '白色', size: 'M', qty: 70, unitPrice: 24.5, amount: 1715 },
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

function receiptTable(id: string, y: number, height: number, rows: TableRow[], border: BorderConfig): TableComponent {
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

const headerTable = receiptTable('pr-header-table', 0, 8, [
  tableRow('pr-header-row', 8, [
    tableCell('款号', 0),
    tableCell('品名', 1),
    tableCell('颜色', 2),
    tableCell('尺码', 3),
    tableCell('数量', 4),
    tableCell('单价', 5),
    tableCell('金额', 6),
    tableCell('备注', 7),
  ], {
    font: { size: 9, bold: true, color: '#111827' },
    backgroundColor: '#f3f4f6',
    textAlign: 'center',
  }),
], fullBorder);

const detailTable = receiptTable('pr-detail-table', 0, 8, [
  tableRow('pr-detail-row', 8, [
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

const footerTable = receiptTable('pr-footer-table', 0, 16, [
  tableRow('pr-footer-total-row', 8, [
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
  tableRow('pr-footer-upper-row', 8, [
    tableCell('金额大写', 0, { textAlign: 'center' }),
    tableCell('RMBUPPER(SUM({items.amount}))', 1, { colSpan: 7 }),
    tableCell('', 2),
    tableCell('', 3),
    tableCell('', 4),
    tableCell('', 5),
    tableCell('', 6),
    tableCell('', 7),
  ], {
    font: { size: 9, color: '#111827' },
  }),
], fullBorder);

export const purchaseReceiptTemplate = template('purchase-receipt', '采购入库单', [
  band('pr-title', 'reportTitle', 48, [
    text('pr-title-text', '采购入库单', 0, 0, 130, 10, { style: 'purchase-receipt-title', textAlign: 'center' }),
    documentHeaderBarcode('pr-barcode', 'receiptNo'),
    text('pr-no-label', '入库单号', 0, 18, 20, 6, { style: commonTextStyleIds.header }),
    text('pr-no', '{receiptNo}', 22, 18, 42, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('pr-date-label', '入库日期', 68, 18, 20, 6, { style: commonTextStyleIds.header }),
    text('pr-date', 'FORMAT("CN_DATE", {receiptDate})', 90, 18, 34, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('pr-operator-label', '经办人', 128, 18, 18, 6, { style: commonTextStyleIds.header }),
    text('pr-operator', '{operator}', 148, 18, 32, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('pr-supplier-label', '供应商', 0, 27, 18, 6, { style: commonTextStyleIds.header }),
    text('pr-supplier', '{supplier.name}', 20, 27, 70, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('pr-contact-label', '联系人', 94, 27, 18, 6, { style: commonTextStyleIds.header }),
    text('pr-contact', '{supplier.contact}', 114, 27, 28, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('pr-phone-label', '电话', 146, 27, 14, 6, { style: commonTextStyleIds.header }),
    text('pr-phone', '{supplier.phone}', 162, 27, 28, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('pr-warehouse-label', '入库仓库', 0, 36, 20, 6, { style: commonTextStyleIds.header }),
    text('pr-warehouse', '{warehouse.name}', 22, 36, 60, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('pr-remark-label', '备注', 0, 44, 14, 6, { style: commonTextStyleIds.header }),
    text('pr-remark', '{remark}', 16, 44, 174, 6, { style: commonTextStyleIds.dataBottomBorder }),
  ]),
  band('pr-detail-header', 'header', 8, [headerTable]),
  band('pr-detail', 'data', 8, [detailTable], { dataBand: { dataSourceId: 'items' } }),
  band('pr-footer', 'footer', 24, [footerTable]),
  band('pr-page-footer', 'pageFooter', 8, [
    text('pr-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footerCenter }),
  ]),
], 297, purchaseReceiptStyles);

purchaseReceiptTemplate.dataSources = [];
