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
const designColumnWidths = [20, 40, 18, 18, 18, 18, 18, 22];

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
        { field: 'S5', name: '80' },
        { field: 'S6', name: '90' },
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
      S5: 9,
      S6: 7,
      totalQty: 55,
      unitPrice: 19.9,
      amount: 1095,
    },
    {
      styleNo: 'KZ-86022',
      productName: '弹力修身休闲裤',
      tagPrice: 169,
      color: '米白',
      S1: 8,
      S2: 16,
      S3: 14,
      S4: 6,
      S5: 5,
      S6: 4,
      totalQty: 44,
      unitPrice: 18,
      amount: 792,
    },
  ],
};

const beforeDataScript = `
/**
 * @typedef {{ field?: string, name?: string }} SizeOption
 * @typedef {{ name?: string, sizes?: SizeOption[] }} SizeGroup
 * @typedef {{ id?: string, text?: string, width?: number, textAlign?: string, rowSpan?: number, colSpan?: number, [key: string]: unknown }} ScriptCell
 * @typedef {{ id?: string, height?: number, cells?: ScriptCell[], [key: string]: unknown }} ScriptRow
 * @typedef {{ width?: number, height?: number, rowCount?: number, columnCount?: number, rows?: ScriptRow[] }} ScriptTableComponent
 * @typedef {{ column?: number }} ScriptCellLookup
 * @typedef {{ component: ScriptTableComponent, findCellText: (text: string) => ScriptCellLookup | undefined }} ScriptTableHandle
 * @typedef {{ height?: number, components?: Array<{ name?: string }> }} ScriptBand
 * @typedef {{ bands?: ScriptBand[] }} ScriptPage
 * @typedef {{ pages?: ScriptPage[] }} ScriptReport
 */
const directOrder = ctx.data && typeof ctx.data === "object" && Array.isArray(ctx.data.sizeGroups)
  ? ctx.data
  : undefined;
/** @type {{ sizeGroups?: SizeGroup[] }} */
const order = directOrder ?? {};
const sizeGroups = Array.isArray(order.sizeGroups) ? order.sizeGroups : [];
/** @type {ScriptTableHandle | undefined} */
const headerTable = /** @type {ScriptTableHandle | undefined} */ (ctx.table?.("OrderSizeHeaderTable"));
/** @type {ScriptTableHandle | undefined} */
const detailTable = /** @type {ScriptTableHandle | undefined} */ (ctx.table?.("OrderSizeDetailTable"));

if (headerTable && detailTable && Array.isArray(sizeGroups) && sizeGroups.length > 0) {
  const placeholder = headerTable.findCellText("S1") ?? detailTable.findCellText("{S1}");
  const sizeColumn = placeholder?.column ?? 4;
  const groupCount = Math.max(1, sizeGroups.length);
  const groupedSizes = sizeGroups.map(group => Array.isArray(group.sizes) ? group.sizes : []);
  const allSizes = groupedSizes.flat();
  const sizeCount = Math.max(1, allSizes.length);
  const rowHeight = 7;
  const fixedBefore = [
    { text: "款号", width: 20 },
    { text: "品名", width: 40 },
    { text: "吊牌价", width: 18 },
    { text: "颜色", width: 18 },
  ];
  const fixedAfter = [
    { text: "总数量", width: 18 },
    { text: "价格", width: 18 },
    { text: "金额", width: 22 },
  ];
  const fixedWidth = [...fixedBefore, ...fixedAfter].reduce((sum, column) => sum + column.width, 0);
  const sizeWidth = Math.max(8, Math.round(((headerTable.component.width || 190) - fixedWidth) / sizeCount * 10) / 10);
  const columnWidths = [
    ...fixedBefore.map(column => column.width),
    ...Array.from({ length: sizeCount }, () => sizeWidth),
    ...fixedAfter.map(column => column.width),
  ];
  const totalColumnCount = columnWidths.length;
  const headerSeedRow = headerTable.component.rows?.[0] ?? { height: rowHeight, cells: [] };
  const headerSeedCells = headerSeedRow.cells ?? [];
  const detailSeedRow = detailTable.component.rows?.[0] ?? { height: rowHeight, cells: [] };
  const detailSeedCells = detailSeedRow.cells ?? [];

  /**
   * @param {ScriptCell | undefined} seed
   * @param {string} id
   * @param {string} text
   * @param {number} width
   * @param {string} textAlign
   * @param {number} [rowSpan]
   * @returns {ScriptCell}
   */
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
    let groupStart = 0;
    for (let index = 0; index < row; index += 1) {
      groupStart += groupedSizes[index]?.length ?? 0;
    }
    const sizes = groupedSizes[row] ?? [];
    const cells = [];

    fixedBefore.forEach((column, index) => {
      cells.push(copyCell(
        headerSeedCells[index],
        "dynamic_size_header_cell_" + (row + 1) + "_" + (cells.length + 1),
        row === 0 ? column.text : "",
        column.width,
        "center",
        row === 0 ? groupCount : 1,
      ));
    });

    for (let offset = 0; offset < sizeCount; offset += 1) {
      const name = offset >= groupStart && offset < groupStart + sizes.length
        ? sizes[offset - groupStart]?.name ?? ""
        : "";
      cells.push(copyCell(
        headerSeedCells[sizeColumn],
        "dynamic_size_header_cell_" + (row + 1) + "_" + (cells.length + 1),
        name,
        sizeWidth,
        "center",
      ));
    }

    fixedAfter.forEach((column, offset) => {
      cells.push(copyCell(
        headerSeedCells[sizeColumn + 1 + offset],
        "dynamic_size_header_cell_" + (row + 1) + "_" + (cells.length + 1),
        row === 0 ? column.text : "",
        column.width,
        "center",
        row === 0 ? groupCount : 1,
      ));
    });

    return {
      ...headerSeedRow,
      id: "dynamic_size_header_row_" + (row + 1),
      height: rowHeight,
      cells,
    };
  });

  const detailExpressions = ["{styleNo}", "{productName}", "{tagPrice}", "{color}"];
  const detailCells = fixedBefore.map((column, index) => copyCell(
    detailSeedCells[index],
    "dynamic_size_detail_cell_" + (index + 1),
    detailExpressions[index],
    column.width,
    index === 1 || index === 3 ? "left" : "right",
  ));

  for (let offset = 0; offset < sizeCount; offset += 1) {
    const field = allSizes[offset]?.field ?? "S" + (offset + 1);
    detailCells.push(copyCell(
      detailSeedCells[sizeColumn],
      "dynamic_size_detail_cell_" + (detailCells.length + 1),
      "{" + field + "}",
      sizeWidth,
      "right",
    ));
  }

  ["{totalQty}", "{unitPrice}", "{amount}"].forEach((expression, offset) => {
    detailCells.push(copyCell(
      detailSeedCells[sizeColumn + 1 + offset],
      "dynamic_size_detail_cell_" + (detailCells.length + 1),
      expression,
      fixedAfter[offset].width,
      "right",
    ));
  });

  detailTable.component.rows = [{
    ...detailSeedRow,
    id: "dynamic_size_detail_row",
    height: rowHeight,
    cells: detailCells,
  }];

  const headerHeight = rowHeight * groupCount;
  headerTable.component.rowCount = groupCount;
  headerTable.component.columnCount = totalColumnCount;
  headerTable.component.height = headerHeight;
  detailTable.component.rowCount = 1;
  detailTable.component.columnCount = totalColumnCount;
  detailTable.component.height = rowHeight;

  const report = /** @type {ScriptReport | undefined} */ (ctx.report);
  for (const page of report?.pages ?? []) {
    for (const band of page.bands ?? []) {
      if (band.components?.some(component => component.name === "OrderSizeHeaderTable")) {
        band.height = Math.max(band.height ?? 0, headerHeight);
      }
    }
  }
}
`.trim();

function tableCell(textValue: string, columnIndex: number, overrides: Partial<TableCell> = {}): TableCell {
  return {
    id: `cell_${columnIndex + 1}`,
    text: textValue,
    width: designColumnWidths[columnIndex],
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
