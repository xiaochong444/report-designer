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
const tableWidths = [22, 38, 28, 15, 22, 18, 22, 25];

const salesOrderStyles: ReportStyle[] = [
  {
    id: 'sales-order-title',
    name: 'Sales Order Title',
    category: 'text',
    font: { size: 17, bold: true, color: '#111827' },
    backgroundColor: 'transparent',
    verticalAlign: 'middle',
  },
  {
    id: 'sales-order-stamp',
    name: 'Sales Order Approved Stamp',
    category: 'text',
    font: { size: 13, bold: true, color: '#dc2626' },
    backgroundColor: 'transparent',
    verticalAlign: 'middle',
  },
  {
    id: 'sales-order-table-header',
    name: 'Sales Order Table Header',
    category: 'text',
    font: { size: 9, bold: true, color: '#111827' },
    backgroundColor: '#f3f4f6',
    verticalAlign: 'middle',
  },
  {
    id: 'sales-order-total',
    name: 'Sales Order Total',
    category: 'text',
    font: { size: 10, bold: true, color: '#111827' },
    backgroundColor: '#f9fafb',
    verticalAlign: 'middle',
  },
];

const salesOrderItems = [
  {
    id: '1',
    product: { code: 'P-1001', name: '云服务年包', spec: '企业版/12个月', unit: '套', category: '软件服务', brand: 'Acme' },
    qty: 2,
    salesPrice: 5000,
    salesDiscount: 0.9,
    salesAmount: 9000,
    remark: '含实施支持',
  },
  {
    id: '2',
    product: { code: 'P-2002', name: '实施服务', spec: '标准实施', unit: '项', category: '专业服务', brand: 'Acme' },
    qty: 1,
    salesPrice: 3000,
    salesDiscount: 1,
    salesAmount: 3000,
    remark: '远程交付',
  },
  {
    id: '3',
    product: { code: 'P-3003', name: '培训服务', spec: '4小时', unit: '次', category: '培训', brand: 'Acme' },
    qty: 1,
    salesPrice: 1200,
    salesDiscount: 0.8,
    salesAmount: 960,
    remark: '线上培训',
  },
  ...Array.from({ length: 36 }, (_, index) => {
    const lineNo = index + 4;
    const qty = (index % 4) + 1;
    const salesPrice = 360 + (index % 6) * 95;
    const salesDiscount = [0.95, 0.9, 0.85, 1][index % 4];
    return {
      id: String(lineNo),
      product: {
        code: `P-${4000 + lineNo}`,
        name: `配套模块 ${String(index + 1).padStart(2, '0')}`,
        spec: ['标准版', '增强版', '专业版'][index % 3],
        unit: ['件', '套', '项'][index % 3],
        category: ['硬件配件', '软件模块', '服务包'][index % 3],
        brand: 'Acme',
      },
      qty,
      salesPrice,
      salesDiscount,
      salesAmount: Math.round(qty * salesPrice * salesDiscount * 100) / 100,
      remark: index % 3 === 0 ? '随主产品发货' : '',
    };
  }),
];

export const salesOrderPrintData = {
  orderNo: 'SO-202606-001',
  orderDate: '2026-06-05',
  orderType: '普通销售',
  status: '已审核',
  createdBy: '张三',
  createdAt: '2026-06-05 09:12:00',
  updatedBy: '李四',
  updatedAt: '2026-06-05 10:20:00',
  approvedBy: '王五',
  approvedAt: '2026-06-05 10:35:00',
  customer: {
    code: 'C-1008',
    name: '华东科技有限公司',
    phone: '13812345678',
    address: '软件大道 88 号 12 层',
    province: '江苏省',
    city: '南京市',
    district: '雨花台区',
    contact: '陈经理',
    taxNo: '91320100MA0000000X',
  },
  remark: '请按合同约定分批发货，随货附产品合格证。',
  items: salesOrderItems,
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
  return {
    id,
    height,
    role: 'normal',
    verticalAlign: 'middle',
    ...overrides,
    cells,
  };
}

function salesTable(id: string, y: number, height: number, rows: TableRow[], border: BorderConfig): TableComponent {
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

const salesHeaderTable = salesTable('sop-header-table', 0, 8, [
  tableRow('sop-header-row', 8, [
    tableCell('产品编号', 0),
    tableCell('产品名称', 1),
    tableCell('规格', 2),
    tableCell('数量', 3),
    tableCell('单价', 4),
    tableCell('折扣', 5),
    tableCell('折扣额', 6),
    tableCell('金额', 7),
  ], {
    font: { size: 9, bold: true, color: '#111827' },
    backgroundColor: '#f3f4f6',
    textAlign: 'center',
  }),
], fullBorder);

const salesDetailTable = salesTable('sop-detail-table', 0, 8, [
  tableRow('sop-detail-row', 8, [
    tableCell('{items.product.code}', 0),
    tableCell('{items.product.name}', 1),
    tableCell('{items.product.spec}', 2),
    tableCell('{items.qty}', 3, { textAlign: 'right' }),
    tableCell('FORMAT("N2", {items.salesPrice})', 4, { textAlign: 'right' }),
    tableCell('FORMAT("P", {items.salesDiscount})', 5, { textAlign: 'right' }),
    tableCell('FORMAT("N2", DISCOUNT({items.salesPrice} * {items.qty}, 1 - {items.salesDiscount}))', 6, { textAlign: 'right' }),
    tableCell('FORMAT("N2", {items.salesAmount})', 7, { textAlign: 'right' }),
  ], {
    font: { size: 9, color: '#111827' },
  }),
], detailBorder);

const salesFooterTable = salesTable('sop-footer-table', 0, 16, [
  tableRow('sop-footer-total-row', 8, [
    tableCell('合计', 0, { colSpan: 7, textAlign: 'center' }),
    tableCell('', 1),
    tableCell('', 2),
    tableCell('', 3),
    tableCell('', 4),
    tableCell('', 5),
    tableCell('', 6),
    tableCell('FORMAT("N2", SUM({items.salesAmount}))', 7, { textAlign: 'right' }),
  ], {
    font: { size: 10, bold: true, color: '#111827' },
    backgroundColor: '#f9fafb',
  }),
  tableRow('sop-footer-upper-row', 8, [
    tableCell('金额大写', 0, { textAlign: 'center' }),
    tableCell('RMBUPPER(SUM({items.salesAmount}))', 1, { colSpan: 7 }),
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

export const salesOrderPrintTemplate = template('sales-order-print', '销售订单打印', [
  band('sop-title', 'reportTitle', 56, [
    text('sop-title-text', '销售订单', 0, 0, 130, 10, { style: 'sales-order-title', textAlign: 'center' }),
    documentHeaderBarcode('sop-barcode', 'orderNo'),
    text('sop-approved', '已审核', 151, 1, 28, 8, {
      style: 'sales-order-stamp',
      textAlign: 'center',
      border: { ...fullBorder, color: '#dc2626' },
      visible: '{status} = "已审核"',
    }),
    text('sop-no-label', '销售单号', 0, 14, 20, 6, { style: commonTextStyleIds.header }),
    text('sop-no', '{orderNo}', 22, 14, 42, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('sop-date-label', '销售日期', 68, 14, 20, 6, { style: commonTextStyleIds.header }),
    text('sop-date', 'FORMAT("CN_DATE", {orderDate})', 90, 14, 34, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('sop-type-label', '销售类型', 128, 14, 20, 6, { style: commonTextStyleIds.header }),
    text('sop-type', '{orderType}', 150, 14, 30, 6, { style: commonTextStyleIds.dataBottomBorder }),

    text('sop-customer-label', '客户', 0, 23, 14, 6, { style: commonTextStyleIds.header }),
    text('sop-customer', '{customer.name}', 16, 23, 70, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('sop-phone-label', '电话', 90, 23, 14, 6, { style: commonTextStyleIds.header }),
    text('sop-phone', 'MASKPHONE({customer.phone})', 106, 23, 36, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('sop-region-label', '省市区', 146, 23, 18, 6, { style: commonTextStyleIds.header }),
    text('sop-region', 'CONCAT({customer.province}, {customer.city}, {customer.district})', 166, 23, 28, 6, { style: commonTextStyleIds.dataBottomBorder }),

    text('sop-address-label', '地址', 0, 32, 14, 6, { style: commonTextStyleIds.header }),
    text('sop-address', '{customer.address}', 16, 32, 88, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('sop-contact-label', '联系人', 108, 32, 18, 6, { style: commonTextStyleIds.header }),
    text('sop-contact', '{customer.contact}', 128, 32, 26, 6, { style: commonTextStyleIds.dataBottomBorder }),
    text('sop-tax-label', '税号', 158, 32, 14, 6, { style: commonTextStyleIds.header }),
    text('sop-tax', '{customer.taxNo}', 174, 32, 20, 6, { style: commonTextStyleIds.dataBottomBorder }),

    text('sop-audit', '创建：{createdBy} {createdAt}    修改：{updatedBy} {updatedAt}    审核：{approvedBy} {approvedAt}', 0, 43, 190, 6, {
      style: commonTextStyleIds.pageHeader,
    }),
    text('sop-remark-label', '备注', 0, 50, 14, 6, { style: commonTextStyleIds.header }),
    text('sop-remark', '{remark}', 16, 50, 174, 6, { style: commonTextStyleIds.dataBottomBorder }),
  ]),

  band('sop-detail-header', 'header', 8, [salesHeaderTable]),

  band('sop-detail', 'data', 8, [salesDetailTable], { dataBand: { dataSourceId: 'items' } }),

  band('sop-detail-footer', 'footer', 24, [salesFooterTable]),

  band('sop-page-footer', 'pageFooter', 8, [
    text('sop-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footerCenter }),
  ]),
], 297, salesOrderStyles);

salesOrderPrintTemplate.dataSources = [];
