import type { BorderConfig, Padding, ReportStyle, TableCell, TableComponent, TableRow } from '@report-designer/core';
import { band, commonTextStyleIds, template, text } from './common';

const fullBorder: BorderConfig = {
  style: 'solid',
  width: 0.2,
  color: '#6b7280',
  sides: { top: true, right: true, bottom: true, left: true },
};

const detailBorder: BorderConfig = {
  style: 'solid',
  width: 0.2,
  color: '#9ca3af',
  sides: { top: false, right: true, bottom: true, left: true },
};

const cellPadding: Padding = { top: 1, right: 1, bottom: 1, left: 1 };
const designColumnWidths = [20, 40, 18, 18, undefined, 18, 18, 22] as const;

const groupedSizeStyles: ReportStyle[] = [
  {
    id: 'grouped-size-title',
    name: 'Grouped Size Title',
    category: 'text',
    font: { size: 16, bold: true, color: '#111827' },
    backgroundColor: 'transparent',
    verticalAlign: 'middle',
  },
  {
    id: 'grouped-size-meta',
    name: 'Grouped Size Meta',
    category: 'text',
    font: { size: 8, color: '#374151' },
    backgroundColor: 'transparent',
    verticalAlign: 'middle',
  },
  {
    id: 'grouped-size-group-label',
    name: 'Grouped Size Group Label',
    category: 'text',
    font: { size: 10, bold: true, color: '#1e40af' },
    backgroundColor: 'transparent',
    verticalAlign: 'middle',
  },
];

export const clothingOrderGroupedSizeData = {
  orderNo: 'CO-202606-032',
  customer: '上海锦绣服饰有限公司',
  season: '2026 秋冬',
  deliveryDate: '2026-09-15',
  remark: '备注：按尺码组分包发货，每组独立装箱。',
  sizeGroups: [
    {
      name: '常规尺码',
      sizes: [
        { field: 'S1', name: 'S' },
        { field: 'S2', name: 'M' },
        { field: 'S3', name: 'L' },
        { field: 'S4', name: 'XL' },
      ],
    },
    {
      name: '加大尺码',
      sizes: [
        { field: 'S1', name: '2XL' },
        { field: 'S2', name: '3XL' },
        { field: 'S3', name: '4XL' },
      ],
    },
    {
      name: '裤长',
      sizes: [
        { field: 'S1', name: '80' },
        { field: 'S2', name: '90' },
        { field: 'S3', name: '100' },
      ],
    },
  ],
  items: [
    {
      sizeGroupName: '常规尺码',
      styleNo: 'KZ-86021',
      productName: '特种绣花针织裤',
      tagPrice: 199,
      color: '藏青',
      S1: 12,
      S2: 18,
      S3: 15,
      S4: 10,
      totalQty: 55,
      unitPrice: 19.9,
      amount: 1094.5,
    },
    {
      sizeGroupName: '常规尺码',
      styleNo: 'KZ-86022',
      productName: '弹力修身休闲裤',
      tagPrice: 169,
      color: '米白',
      S1: 5,
      S2: 8,
      S3: 12,
      S4: 6,
      totalQty: 31,
      unitPrice: 18,
      amount: 558,
    },
    {
      sizeGroupName: '常规尺码',
      styleNo: 'KZ-86035',
      productName: '经典直筒牛仔裤',
      tagPrice: 229,
      color: '浅蓝',
      S1: 10,
      S2: 14,
      S3: 20,
      S4: 8,
      totalQty: 52,
      unitPrice: 22.9,
      amount: 1190.8,
    },
    {
      sizeGroupName: '加大尺码',
      styleNo: 'KZ-91001',
      productName: '宽松运动卫裤',
      tagPrice: 159,
      color: '黑色',
      S1: 20,
      S2: 15,
      S3: 10,
      totalQty: 45,
      unitPrice: 15.9,
      amount: 715.5,
    },
    {
      sizeGroupName: '加大尺码',
      styleNo: 'KZ-91002',
      productName: '加绒保暖棉裤',
      tagPrice: 259,
      color: '深灰',
      S1: 8,
      S2: 12,
      S3: 6,
      totalQty: 26,
      unitPrice: 25.9,
      amount: 673.4,
    },
    {
      sizeGroupName: '加大尺码',
      styleNo: 'KZ-91003',
      productName: '商务休闲西裤',
      tagPrice: 299,
      color: '藏蓝',
      S1: 6,
      S2: 10,
      S3: 4,
      totalQty: 20,
      unitPrice: 29.9,
      amount: 598,
    },
    {
      sizeGroupName: '裤长',
      styleNo: 'KZ-72001',
      productName: '定制裤长休闲裤',
      tagPrice: 189,
      color: '卡其',
      S1: 15,
      S2: 20,
      S3: 10,
      totalQty: 45,
      unitPrice: 18.9,
      amount: 850.5,
    },
    {
      sizeGroupName: '裤长',
      styleNo: 'KZ-72002',
      productName: '定制裤长牛仔裤',
      tagPrice: 219,
      color: '深蓝',
      S1: 12,
      S2: 18,
      S3: 8,
      totalQty: 38,
      unitPrice: 21.9,
      amount: 832.2,
    },
  ],
};

/**
 * beforeData: 在渲染前将表头表和明细表的占位列（S1）扩展为所有尺码组中尺码数量的最大值。
 * 初始标签设为最大尺码组的名称，后续由 groupHeader 的 beforePrint 按分组覆盖。
 */
const beforeDataScript = `
const sizeGroups = ctx.data && typeof ctx.data === "object" && Array.isArray(ctx.data.sizeGroups)
  ? ctx.data.sizeGroups
  : [];
const headerTable = ctx.table?.("GroupSizeHeaderTable");
const detailTable = ctx.table?.("GroupSizeDetailTable");

if (headerTable && detailTable && sizeGroups.length > 0) {
  const headerPlaceholder = headerTable.findCellText("S1");
  const detailPlaceholder = detailTable.findCellText("{S1}");
  const sizeColumn = headerPlaceholder?.column ?? 4;
  const maxSizeCount = Math.max(1, ...sizeGroups.map(function (g) { return Array.isArray(g.sizes) ? g.sizes.length : 0; }));
  const largestGroup = sizeGroups.reduce(function (best, g) {
    let count = Array.isArray(g.sizes) ? g.sizes.length : 0;
    return count > (best ? Array.isArray(best.sizes) ? best.sizes.length : 0 : 0) ? g : best;
  }, null);
  let largestSizes = largestGroup && Array.isArray(largestGroup.sizes) ? largestGroup.sizes : [];

  // 插入额外的尺码列（S1 占位列已存在，再插入 maxSizeCount - 1 列）
  if (maxSizeCount > 1) {
    headerTable.insertColumnsAfter(sizeColumn, maxSizeCount - 1);
    detailTable.insertColumnsAfter(sizeColumn, maxSizeCount - 1);
  }

  // 设置初始表头标签（最大尺码组的名称）
  for (let offset = 0; offset < maxSizeCount; offset++) {
    let name = largestSizes[offset] ? largestSizes[offset].name : "";
    headerTable.setCellText(0, sizeColumn + offset, name);
    detailTable.setCellText(0, sizeColumn + offset, "{S" + (offset + 1) + "}");
  }
}
`.trim();

/**
 * beforePrint (groupHeader): 根据当前分组的尺码组信息更新表头标签。
 * ctx.row 是分组内第一条数据行，ctx.row.sizeGroupName 标识当前尺码组。
 * ctx.table 操作的是当前分组克隆后的表头表，以及模板级别的明细表（后续数据行克隆时会拾取修改）。
 */
const groupHeaderBeforePrintScript = `
let groupName = ctx.row && ctx.row.sizeGroupName ? String(ctx.row.sizeGroupName) : "";
let sizeGroups = ctx.data && Array.isArray(ctx.data.sizeGroups) ? ctx.data.sizeGroups : [];
let group = null;
for (let i = 0; i < sizeGroups.length; i++) {
  if (sizeGroups[i].name === groupName) { group = sizeGroups[i]; break; }
}
let sizes = group && Array.isArray(group.sizes) ? group.sizes : [];

let headerTable = ctx.table?.("GroupSizeHeaderTable");
let detailTable = ctx.table?.("GroupSizeDetailTable");

if (headerTable && detailTable) {
  let placeholder = headerTable.findCellText("S1");
  let col = placeholder != null ? placeholder.column : 4;
  // 用当前组的尺码名称覆盖表头；超出当前组尺码数的列清空
  let currentColumnCount = headerTable.columnCount - col - 3;
  for (let offset = 0; offset < currentColumnCount; offset++) {
    let name = sizes[offset] ? sizes[offset].name : "";
    headerTable.setCellText(0, col + offset, name);
    detailTable.setCellText(0, col + offset, "{S" + (offset + 1) + "}");
  }
}
`.trim();

function tableCell(textValue: string, columnIndex: number, overrides: Partial<TableCell> = {}): TableCell {
  const width = designColumnWidths[columnIndex];
  return {
    id: `cell_${columnIndex + 1}`,
    text: textValue,
    ...(width === undefined ? {} : { width }),
    padding: cellPadding,
    ...overrides,
  };
}

function tableRow(id: string, height: number, cells: TableCell[], overrides: Partial<TableRow> = {}): TableRow {
  return {
    id,
    height,
    verticalAlign: 'middle',
    ...overrides,
    cells,
  };
}

function orderTable(id: string, name: string, height: number, rows: TableRow[], border: BorderConfig): TableComponent {
  return {
    id,
    name,
    type: 'table',
    x: 0,
    y: 0,
    width: 190,
    height,
    rowCount: rows.length,
    columnCount: designColumnWidths.length,
    rows,
    border,
    padding: cellPadding,
    showBorder: true,
    canBreak: true,
  };
}

const groupSizeHeaderTable = orderTable('grouped-size-header-table', 'GroupSizeHeaderTable', 7, [
  tableRow('grouped-size-header-row', 7, [
    tableCell('款号', 0),
    tableCell('品名', 1),
    tableCell('吊牌价', 2),
    tableCell('颜色', 3),
    tableCell('S1', 4),
    tableCell('总数量', 5),
    tableCell('价格', 6),
    tableCell('金额', 7),
  ], {
    font: { size: 9, bold: true, color: '#111827' },
    backgroundColor: '#eef2ff',
    textAlign: 'center',
  }),
], fullBorder);

const groupSizeDetailTable = orderTable('grouped-size-detail-table', 'GroupSizeDetailTable', 7, [
  tableRow('grouped-size-detail-row', 7, [
    tableCell('{styleNo}', 0),
    tableCell('{productName}', 1),
    tableCell('{tagPrice}', 2, { textAlign: 'right' }),
    tableCell('{color}', 3),
    tableCell('{S1}', 4, { textAlign: 'right' }),
    tableCell('{totalQty}', 5, { textAlign: 'right' }),
    tableCell('{unitPrice}', 6, { textAlign: 'right' }),
    tableCell('{amount}', 7, { textAlign: 'right' }),
  ], {
    font: { size: 9, color: '#111827' },
  }),
], detailBorder);

const orderSummaryTable = orderTable('grouped-size-summary-table', 'OrderSummaryTable', 24, [
  tableRow('grouped-size-summary-total-row', 8, [
    tableCell('合计', 0, { colSpan: 7, textAlign: 'center' }),
    tableCell('', 1),
    tableCell('', 2),
    tableCell('', 3),
    tableCell('', 4),
    tableCell('', 5),
    tableCell('', 6),
    tableCell('FORMAT("N2", SUM({items.amount}))', 7, { textAlign: 'right' }),
  ], {
    font: { size: 10, bold: true, color: '#111827' },
    backgroundColor: '#f9fafb',
  }),
  tableRow('grouped-size-summary-upper-row', 8, [
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
  tableRow('grouped-size-summary-remark-row', 8, [
    tableCell('备注', 0, { textAlign: 'center' }),
    tableCell('{remark}', 1, { colSpan: 7 }),
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

export const clothingOrderGroupedSizeTemplate = {
  ...template('clothing-order-grouped-size', '服装订单分组尺码打印', [
    band('grouped-size-title-band', 'reportTitle', 34, [
      text('grouped-size-title-text', '服装订单分组尺码打印', 0, 0, 190, 10, {
        style: 'grouped-size-title',
        textAlign: 'center',
      }),
      text('grouped-size-no-label', '订单号', 0, 15, 14, 6, { style: commonTextStyleIds.header }),
      text('grouped-size-no', '{orderNo}', 16, 15, 44, 6, { style: commonTextStyleIds.dataBottomBorder }),
      text('grouped-size-customer-label', '客户', 64, 15, 12, 6, { style: commonTextStyleIds.header }),
      text('grouped-size-customer', '{customer}', 78, 15, 66, 6, { style: commonTextStyleIds.dataBottomBorder }),
      text('grouped-size-season-label', '季节', 148, 15, 12, 6, { style: commonTextStyleIds.header }),
      text('grouped-size-season', '{season}', 162, 15, 28, 6, { style: commonTextStyleIds.dataBottomBorder }),
      text('grouped-size-note', '尺码列由 beforeData + groupHeader beforePrint 脚本动态生成', 0, 25, 190, 6, {
        style: 'grouped-size-meta',
      }),
    ]),
    band('grouped-size-group-header', 'groupHeader', 14, [
      text('grouped-size-group-label', '{sizeGroupName}', 0, 0, 50, 7, { style: 'grouped-size-group-label' }),
      groupSizeHeaderTable,
    ], {
      group: { conditionExpression: '{items.sizeGroupName}', sortDirection: 'asc' },
      behavior: {
        enabled: true,
        printOn: 'allPages',
        printIfEmpty: true,
        printOnAllPages: false,
        keepTogether: false,
        canBreak: false,
        printAtBottom: false,
        autoGrow: true,
        autoShrink: true,
      },
      events: {
        beforePrint: {
          enabled: true,
          script: groupHeaderBeforePrintScript,
        },
      },
    }),
    band('grouped-size-data', 'data', 7, [groupSizeDetailTable], {
      dataBand: { dataSourceId: 'items', sort: [{ field: 'sizeGroupName', direction: 'asc' }] },
    }),
    band('grouped-size-summary', 'reportSummary', 26, [orderSummaryTable]),
    band('grouped-size-page-footer', 'pageFooter', 8, [
      text('grouped-size-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footerCenter }),
    ]),
  ], 297, groupedSizeStyles),
  events: {
    beforeData: {
      enabled: true,
      script: beforeDataScript,
    },
  },
  dataSources: [],
};
