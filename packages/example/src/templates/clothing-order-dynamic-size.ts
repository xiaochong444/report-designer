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

const clothingOrderStyles: ReportStyle[] = [
  {
    id: 'clothing-order-title',
    name: 'Clothing Order Title',
    category: 'text',
    font: { size: 16, bold: true, color: '#111827' },
    backgroundColor: 'transparent',
    verticalAlign: 'middle',
  },
  {
    id: 'clothing-order-meta',
    name: 'Clothing Order Meta',
    category: 'text',
    font: { size: 8, color: '#374151' },
    backgroundColor: 'transparent',
    verticalAlign: 'middle',
  },
];

export const clothingOrderDynamicSizeData = {
  orderNo: 'CO-202606-018',
  customer: '杭州织造商贸有限公司',
  season: '2026 夏',
  remark: '备注：请按颜色分包，尾箱随货附尺码明细。',
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
      name: '裤长',
      sizes: [
        { field: 'S1', name: '80' },
        { field: 'S2', name: '90' },
      ],
    },
  ],
  items: [
    {
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
      amount: 1095,
    },
    {
      styleNo: 'KZ-86022',
      productName: '弹力修身休闲裤',
      tagPrice: 169,
      color: '米白',
      S1: 5,
      S2: 4,
      S3: '',
      S4: '',
      totalQty: 44,
      unitPrice: 18,
      amount: 792,
    },
  ],
};

const beforeDataScript = `
const sizeGroups = ctx.data && typeof ctx.data === "object" && Array.isArray(ctx.data.sizeGroups)
  ? ctx.data.sizeGroups
  : [];
const headerTable = ctx.table?.("OrderSizeHeaderTable");
const detailTable = ctx.table?.("OrderSizeDetailTable");

if (headerTable && detailTable && Array.isArray(sizeGroups) && sizeGroups.length > 0) {
  // S1 是设计时的尺码占位列，脚本会把这一列扩展成当前订单需要的尺码列。
  const placeholder = headerTable.findCellText("S1") ?? detailTable.findCellText("{S1}");
  const sizeColumn = placeholder?.column ?? 4;
  const groupCount = Math.max(1, sizeGroups.length);
  const groupedSizes = sizeGroups.map(group => Array.isArray(group.sizes) ? group.sizes : []);
  // 尺码列数量取所有尺码组里尺码数量的最大值，不把多个尺码组累加。
  // 例如服装用 S1-S4，裤长也从 S1/S2 开始，它们共享同一组渲染列。
  const sizeCount = Math.max(1, ...groupedSizes.map(sizes => sizes.length));
  const headerSeedRow = headerTable.component.rows?.[0] ?? { height: 7, cells: [] };
  const headerSeedCells = headerSeedRow.cells ?? [];
  const detailSeedRow = detailTable.component.rows?.[0] ?? { height: headerSeedRow.height ?? 7, cells: [] };
  const detailSeedCells = detailSeedRow.cells ?? [];
  const headerRowHeight = headerSeedRow.height ?? 7;
  const detailRowHeight = detailSeedRow.height ?? headerRowHeight;
  // 读取占位列左侧和右侧的模板单元格，固定列的文本、宽度和样式都沿用模板配置。
  const headerBefore = headerSeedCells.slice(0, sizeColumn);
  const headerAfter = headerSeedCells.slice(sizeColumn + 1);
  const detailBefore = detailSeedCells.slice(0, sizeColumn);
  const detailAfter = detailSeedCells.slice(sizeColumn + 1);
  const totalColumnCount = headerBefore.length + sizeCount + headerAfter.length;

  const copyCell = (seed, id, text, width, textAlign, rowSpan = 1) => ({
    ...seed,
    id,
    text,
    width,
    textAlign,
    rowSpan,
    colSpan: 1,
  });

  headerTable.component.rows = Array.from({ length: groupCount }, (_unused, row) => {
    const sizes = groupedSizes[row] ?? [];
    const cells = [];

    headerBefore.forEach((cell, index) => {
      cells.push(copyCell(
        cell,
        "dynamic_size_header_cell_" + (row + 1) + "_" + (cells.length + 1),
        row === 0 ? cell.text ?? "" : "",
        cell.width,
        cell.textAlign ?? "center",
        row === 0 ? groupCount : 1,
      ));
    });

    for (let offset = 0; offset < sizeCount; offset += 1) {
      // 每个尺码组占一行，并且都从第一列尺码列开始；短的尺码组右侧留空。
      const name = sizes[offset]?.name ?? "";
      cells.push(copyCell(
        headerSeedCells[sizeColumn],
        "dynamic_size_header_cell_" + (row + 1) + "_" + (cells.length + 1),
        name,
        undefined,
        "center",
      ));
    }

    headerAfter.forEach((cell) => {
      cells.push(copyCell(
        cell,
        "dynamic_size_header_cell_" + (row + 1) + "_" + (cells.length + 1),
        row === 0 ? cell.text ?? "" : "",
        cell.width,
        cell.textAlign ?? "center",
        row === 0 ? groupCount : 1,
      ));
    });

    return {
      ...headerSeedRow,
      id: "dynamic_size_header_row_" + (row + 1),
      height: headerRowHeight,
      cells,
    };
  });

  const detailCells = detailBefore.map((cell, index) => copyCell(
    cell,
    "dynamic_size_detail_cell_" + (index + 1),
    cell.text ?? "",
    cell.width,
    cell.textAlign ?? "left",
  ));

  for (let offset = 0; offset < sizeCount; offset += 1) {
    // 明细单元格直接绑定 S1...S(最大尺码列数)。某行不用的尺码字段在数据里保持为空。
    const field = "S" + (offset + 1);
    detailCells.push(copyCell(
      detailSeedCells[sizeColumn],
      "dynamic_size_detail_cell_" + (detailCells.length + 1),
      "{" + field + "}",
      undefined,
      "right",
    ));
  }

  detailAfter.forEach((cell) => {
    detailCells.push(copyCell(
      cell,
      "dynamic_size_detail_cell_" + (detailCells.length + 1),
      cell.text ?? "",
      cell.width,
      cell.textAlign ?? "right",
    ));
  });

  detailTable.component.rows = [{
    ...detailSeedRow,
    id: "dynamic_size_detail_row",
    height: detailRowHeight,
    cells: detailCells,
  }];

  const headerHeight = headerRowHeight * groupCount;
  headerTable.component.rowCount = groupCount;
  headerTable.component.columnCount = totalColumnCount;
  headerTable.component.height = headerHeight;
  detailTable.component.rowCount = 1;
  detailTable.component.columnCount = totalColumnCount;
  detailTable.component.height = detailRowHeight;
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

const orderSizeHeaderTable = orderTable('clothing-size-header-table', 'OrderSizeHeaderTable', 7, [
  tableRow('clothing-size-header-row', 7, [
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

const orderSizeDetailTable = orderTable('clothing-size-detail-table', 'OrderSizeDetailTable', 7, [
  tableRow('clothing-size-detail-row', 7, [
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

const orderSummaryTable = orderTable('clothing-order-summary-table', 'OrderSummaryTable', 24, [
  tableRow('clothing-order-summary-total-row', 8, [
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
  tableRow('clothing-order-summary-upper-row', 8, [
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
  tableRow('clothing-order-summary-remark-row', 8, [
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

export const clothingOrderDynamicSizeTemplate = {
  ...template('clothing-order-dynamic-size', '服装订单动态尺码打印', [
    band('clothing-order-title-band', 'reportTitle', 34, [
      text('clothing-order-title-text', '服装订单动态尺码打印', 0, 0, 190, 10, {
        style: 'clothing-order-title',
        textAlign: 'center',
      }),
      text('clothing-order-no-label', '订单号', 0, 15, 14, 6, { style: commonTextStyleIds.header }),
      text('clothing-order-no', '{orderNo}', 16, 15, 44, 6, { style: commonTextStyleIds.dataBottomBorder }),
      text('clothing-order-customer-label', '客户', 64, 15, 12, 6, { style: commonTextStyleIds.header }),
      text('clothing-order-customer', '{customer}', 78, 15, 66, 6, { style: commonTextStyleIds.dataBottomBorder }),
      text('clothing-order-season-label', '季节', 148, 15, 12, 6, { style: commonTextStyleIds.header }),
      text('clothing-order-season', '{season}', 162, 15, 28, 6, { style: commonTextStyleIds.dataBottomBorder }),
      text('clothing-order-note', '尺码列由 beforeData 脚本根据 sizeGroups 动态生成', 0, 25, 190, 6, {
        style: 'clothing-order-meta',
      }),
    ]),
    band('clothing-order-size-header-band', 'header', 14, [orderSizeHeaderTable]),
    band('clothing-order-size-detail-band', 'data', 7, [orderSizeDetailTable], {
      dataBand: { dataSourceId: 'items' },
    }),
    band('clothing-order-summary-band', 'reportSummary', 26, [orderSummaryTable]),
    band('clothing-order-page-footer', 'pageFooter', 8, [
      text('clothing-order-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footerCenter }),
    ]),
  ], 297, clothingOrderStyles),
  events: {
    beforeData: {
      enabled: true,
      script: beforeDataScript,
    },
  },
  dataSources: [],
};
