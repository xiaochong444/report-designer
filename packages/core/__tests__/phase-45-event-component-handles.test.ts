import { describe, expect, it } from 'vitest';
import { createEventContext, createEventLogCollector } from '../src/event-engine';
import type {
  Band,
  BorderConfig,
  PanelComponent,
  ReportComponent,
  ReportTemplate,
  TableComponent,
  TextComponent,
} from '../src/template-model/types';

function border(): BorderConfig {
  return {
    style: 'none',
    width: 0,
    color: '#000000',
    sides: { top: false, right: false, bottom: false, left: false },
  };
}

function textComponent(overrides: Partial<TextComponent> = {}): TextComponent {
  return {
    id: 'text-internal-id',
    name: 'OrderTitleText',
    type: 'text',
    x: 0,
    y: 0,
    width: 40,
    height: 8,
    text: 'Order',
    font: {
      family: 'Arial',
      size: 10,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      color: '#000000',
    },
    textAlign: 'left',
    verticalAlign: 'middle',
    border: border(),
    canGrow: true,
    canShrink: false,
    ...overrides,
  };
}

function tableComponent(overrides: Partial<TableComponent> = {}): TableComponent {
  return {
    id: 'table-internal-id',
    name: 'OrderSizeHeaderTable',
    type: 'table',
    x: 0,
    y: 10,
    width: 120,
    height: 16,
    rowCount: 2,
    columnCount: 3,
    rows: [
      {
        id: 'row-1',
        height: 8,
        cells: [
          { id: 'cell-1-1', text: 'SKU', width: 20 },
          { id: 'cell-1-2', text: 'Size', width: 30 },
          { id: 'cell-1-3', text: 'Qty', width: 40 },
        ],
      },
      {
        id: 'row-2',
        height: 8,
        cells: [
          { id: 'cell-2-1', text: '{sku}', width: 20 },
          { id: 'cell-2-2', text: '{size}', width: 30 },
          { id: 'cell-2-3', text: '{qty}', width: 40 },
        ],
      },
    ],
    ...overrides,
  };
}

function template(components: ReportComponent[]): ReportTemplate {
  return {
    id: 'report-1',
    name: 'Handle Report',
    version: '2.0',
    pages: [
      {
        id: 'page-1',
        width: 210,
        height: 297,
        margins: { top: 10, right: 10, bottom: 10, left: 10 },
        orientation: 'portrait',
        bands: [
          {
            id: 'band-1',
            name: 'DetailBand',
            type: 'data',
            height: 30,
            components,
          },
        ],
      },
    ],
    dataSources: [],
    styles: [],
    conditionalFormats: [],
    parameters: [],
  };
}

function createCtx(report: ReportTemplate, band?: Band) {
  return createEventContext({
    report,
    band: band ?? report.pages[0].bands[0],
    log: createEventLogCollector(),
    target: { ownerType: 'band', ownerId: 'band-1', eventName: 'beforePrint' },
  });
}

describe('phase 45 event component handles', () => {
  it('finds components by name only through ctx.getComponent', () => {
    const report = template([textComponent()]);
    const ctx = createCtx(report);

    expect(ctx.getComponent?.('OrderTitleText')?.id).toBe('text-internal-id');
    expect(ctx.getComponent?.('text-internal-id')).toBeUndefined();
  });

  it('chains text handle mutations onto the runtime component', () => {
    const title = textComponent();
    const report = template([title]);
    const ctx = createCtx(report);

    const handle = ctx.text?.('OrderTitleText').setText('服装订单').setBounds({ width: 80 });

    expect(handle?.component).toBe(title);
    expect(title.text).toBe('服装订单');
    expect(title.width).toBe(80);
    expect(title.height).toBe(8);
  });

  it('returns a base handle through ctx.component and mutates the runtime component', () => {
    const title = textComponent();
    const report = template([title]);
    const ctx = createCtx(report);

    const handle = ctx.component?.('OrderTitleText')
      .setBounds({ x: 12, width: 80 })
      .setProperty('font.bold', true);

    expect(handle?.component).toBe(title);
    expect(title.x).toBe(12);
    expect(title.width).toBe(80);
    expect(title.font.bold).toBe(true);
  });

  it('keeps ctx.component current component fields compatible with callable lookup', () => {
    const title = textComponent();
    const report = template([title]);
    const ctx = createEventContext({
      report,
      band: report.pages[0].bands[0],
      component: title,
      log: createEventLogCollector(),
      target: { ownerType: 'component', ownerId: title.id, eventName: 'beforePrint' },
    });

    expect(ctx.component?.name).toBe('OrderTitleText');

    ctx.component!.name = 'ChangedName';

    expect(title.name).toBe('ChangedName');
    expect(ctx.component?.name).toBe('ChangedName');
    expect(ctx.component?.('ChangedName').component).toBe(title);
  });

  it('does not fall back to function properties for missing current component fields', () => {
    const title = textComponent({ name: undefined });
    delete title.name;
    const report = template([title]);
    const ctx = createEventContext({
      report,
      band: report.pages[0].bands[0],
      component: title,
      log: createEventLogCollector(),
      target: { ownerType: 'component', ownerId: title.id, eventName: 'beforePrint' },
    });

    expect(ctx.component?.name).toBeUndefined();
  });

  it('supports table handle structure operations and mutates the underlying table', () => {
    const table = tableComponent();
    const report = template([table]);
    const ctx = createCtx(report);

    const tableHandle = ctx.table?.('OrderSizeHeaderTable');
    expect(tableHandle?.findCellText('Size')).toMatchObject({ row: 0, column: 1 });

    tableHandle
      ?.insertColumnsAfter(0, 1)
      .insertRowsAfter(0, 1)
      .setCellText(0, 1, 'Color')
      .setCell(1, 1, { text: '{color}' })
      .mergeCells(0, 1, 2, 2)
      .setColumnWidth(1, 24)
      .distributeColumns(2, 2);

    expect(table.rowCount).toBe(3);
    expect(table.columnCount).toBe(4);
    expect(table.rows?.[0].cells.map(cell => cell.text)).toEqual(['SKU', 'Color', 'Size', 'Qty']);
    expect(table.rows?.[0].cells[1]).toMatchObject({ text: 'Color', rowSpan: 2, colSpan: 2, width: 24 });
    expect(table.rows?.[1].cells[1]).toMatchObject({ text: '{color}', width: 24 });
    expect(table.rows?.map(row => row.cells[1].width)).toEqual([24, 24, 24]);
    expect(table.rows?.[0].cells[2].width).toBeUndefined();
    expect(table.rows?.[0].cells[3].width).toBeUndefined();
  });

  it('throws on invalid table merge spans without mutating the table', () => {
    const table = tableComponent();
    const beforeRows = JSON.parse(JSON.stringify(table.rows));
    const report = template([table]);
    const ctx = createCtx(report);
    const tableHandle = ctx.table?.('OrderSizeHeaderTable');

    expect(() => tableHandle?.mergeCells(0, 0, 0, 1)).toThrow('Table cell merge span must be positive.');
    expect(() => tableHandle?.mergeCells(0, 0, -1, 1)).toThrow('Table cell merge span must be positive.');
    expect(() => tableHandle?.mergeCells(0, 0, Number.POSITIVE_INFINITY, 1)).toThrow(
      'Table cell merge span must be positive.',
    );
    expect(table.rows).toEqual(beforeRows);
  });

  it('finds panel child components by name', () => {
    const nested = textComponent({ id: 'panel-child-id', name: 'PanelChildText', text: 'Inside' });
    const panel: PanelComponent = {
      id: 'panel-id',
      name: 'OrderPanel',
      type: 'panel',
      x: 0,
      y: 0,
      width: 100,
      height: 20,
      border: border(),
      components: [nested],
    };
    const report = template([panel]);
    const ctx = createCtx(report);

    ctx.text?.('PanelChildText').setText('Nested');

    expect(nested.text).toBe('Nested');
  });

  it('throws a clear error when a type helper targets another component type', () => {
    const report = template([textComponent(), tableComponent()]);
    const ctx = createCtx(report);

    expect(() => ctx.table?.('OrderTitleText')).toThrow(
      'Component "OrderTitleText" is type "text", expected "table".',
    );
  });
});
