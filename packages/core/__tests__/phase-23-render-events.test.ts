import { describe, expect, it } from 'vitest';
import { renderReport } from '../src';
import type { Band, ReportComponent, ReportTemplate, TextComponent } from '../src';

function textComponent(overrides: Partial<TextComponent> = {}): TextComponent {
  return {
    id: overrides.id ?? 'amount-text',
    name: overrides.name ?? 'AmountText',
    type: 'text',
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    width: overrides.width ?? 60,
    height: overrides.height ?? 8,
    text: overrides.text ?? '{orders.Amount}',
    font: {
      family: 'Arial',
      size: 10,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      color: '#000000',
      ...overrides.font,
    },
    textAlign: overrides.textAlign ?? 'left',
    verticalAlign: overrides.verticalAlign ?? 'middle',
    border: overrides.border ?? {
      style: 'none',
      width: 0,
      color: '#000000',
      sides: { top: false, right: false, bottom: false, left: false },
    },
    canGrow: overrides.canGrow ?? true,
    canShrink: overrides.canShrink ?? false,
    ...overrides,
  };
}

function reportTemplate(options: {
  reportEvents?: ReportTemplate['events'];
  bandEvents?: Band['events'];
  components?: ReportComponent[];
  bands?: Band[];
} = {}): ReportTemplate {
  const dataBand: Band = {
    id: 'orders-band',
    name: 'OrdersBand',
    type: 'data',
    height: 16,
    components: options.components ?? [textComponent()],
    dataBand: { dataSourceId: 'orders' },
    events: options.bandEvents,
  };

  return {
    id: 'event-report',
    name: 'Event Report',
    version: '2.0',
    pages: [
      {
        id: 'page-1',
        width: 210,
        height: 297,
        margins: { top: 10, right: 10, bottom: 10, left: 10 },
        orientation: 'portrait',
        bands: options.bands ?? [dataBand],
      },
    ],
    dataSources: [{ id: 'orders', name: 'Orders', type: 'json' }],
    styles: [],
    conditionalFormats: [],
    parameters: [],
    events: options.reportEvents,
  };
}

function textContents(template: ReportTemplate, mode?: 'preview' | 'print' | 'pdf'): string[] {
  const document = renderReport(template, { orders: [{ Amount: 1234.5, Label: 'Row label' }] }, mode ? { mode } : undefined);
  return document.pages.flatMap(page =>
    page.items.flatMap(item =>
      item.components
        .filter((component): component is typeof component & { type: 'text'; content: string } => component.type === 'text')
        .map(component => component.content),
    ),
  );
}

describe('phase 23 render events', () => {
  it('runs report mode events with preview as the default mode', () => {
    const template = reportTemplate({
      components: [textComponent({ text: 'Initial' })],
      reportEvents: {
        beforePreview: { enabled: true, script: 'ctx.bindText("AmountText", "Preview Title");' },
        beforePrint: { enabled: true, script: 'ctx.bindText("AmountText", "Print Title");' },
      },
    });

    expect(textContents(template)).toEqual(['Preview Title']);
    expect(textContents(template, 'preview')).toEqual(['Preview Title']);
    expect(textContents(template, 'print')).toEqual(['Print Title']);
    expect(textContents(template, 'pdf')).toEqual(['Print Title']);
  });

  it('records report runtime errors without throwing', () => {
    const template = reportTemplate({
      reportEvents: {
        beforeRender: { enabled: true, script: 'throw new Error("render problem");' },
        beforeData: { enabled: true, script: 'throw new Error("data problem");' },
        afterData: { enabled: true, script: 'throw new Error("after data problem");' },
        afterRender: { enabled: true, script: 'throw new Error("after render problem");' },
      },
    });

    const document = renderReport(template, { orders: [{ Amount: 10 }] });

    expect(document.pages[0].items[0].components[0]).toMatchObject({ type: 'text', content: '10' });
    expect(document.eventLogs).toEqual([
      expect.objectContaining({ level: 'error', ownerType: 'report', eventName: 'beforeRender', message: 'render problem' }),
      expect.objectContaining({ level: 'error', ownerType: 'report', eventName: 'beforeData', message: 'data problem' }),
      expect.objectContaining({ level: 'error', ownerType: 'report', eventName: 'afterData', message: 'after data problem' }),
      expect.objectContaining({ level: 'error', ownerType: 'report', eventName: 'afterRender', message: 'after render problem' }),
    ]);
  });

  it('uses component getValue before text formatting', () => {
    const template = reportTemplate({
      components: [
        textComponent({
          text: '{orders.Amount}',
          format: { type: 'number', pattern: '#,##0.00' },
          events: {
            getValue: { enabled: true, script: 'ctx.setValue(2345.6);' },
          },
        }),
      ],
    });

    expect(textContents(template)).toEqual(['2,345.60']);
  });

  it('lets component beforePrint hide the component', () => {
    const template = reportTemplate({
      components: [
        textComponent({
          text: 'Hidden',
          events: {
            beforePrint: { enabled: true, script: 'ctx.hide();' },
          },
        }),
        textComponent({ id: 'visible-text', name: 'VisibleText', y: 8, text: 'Visible' }),
      ],
    });

    expect(textContents(template)).toEqual(['Visible']);
  });

  it('lets component beforePrint cancel the component', () => {
    const template = reportTemplate({
      components: [
        textComponent({
          text: 'Canceled',
          events: {
            beforePrint: { enabled: true, script: 'ctx.cancel();' },
          },
        }),
        textComponent({ id: 'visible-text', name: 'VisibleText', y: 8, text: 'Visible' }),
      ],
    });

    expect(textContents(template)).toEqual(['Visible']);
  });

  it('lets band beforePrint hide the current band instance', () => {
    const template = reportTemplate({
      bandEvents: {
        beforePrint: { enabled: true, script: 'if (ctx.row.Amount > 100) ctx.hide();' },
      },
    });

    const document = renderReport(template, { orders: [{ Amount: 50 }, { Amount: 150 }] });

    expect(document.pages.flatMap(page => page.items)).toHaveLength(1);
    expect(textContentsFromDocument(document)).toEqual(['50']);
  });

  it('runs row events only for data band rows', () => {
    const titleBand: Band = {
      id: 'title-band',
      type: 'reportTitle',
      height: 12,
      components: [textComponent({ id: 'title-text', name: 'TitleText', text: 'Title' })],
      events: {
        beforeRow: { enabled: true, script: 'ctx.log.info("title row");' },
      },
    };
    const dataBand: Band = {
      id: 'orders-band',
      type: 'data',
      height: 12,
      components: [textComponent()],
      dataBand: { dataSourceId: 'orders' },
      events: {
        beforeRow: { enabled: true, script: 'ctx.log.info("before " + ctx.row.Amount + " " + ctx.rowIndex);' },
        afterRow: { enabled: true, script: 'ctx.log.info("after " + ctx.row.Amount + " " + ctx.rowIndex);' },
      },
    };
    const template = reportTemplate({ bands: [titleBand, dataBand] });

    const document = renderReport(template, { orders: [{ Amount: 1 }, { Amount: 2 }] });

    expect(document.eventLogs?.map(entry => entry.message)).toEqual(['before 1 0', 'after 1 0', 'before 2 1', 'after 2 1']);
  });

  it('renders dynamic band text and keeps the source template unchanged', () => {
    const template = reportTemplate({
      bandEvents: {
        beforePrint: {
          enabled: true,
          script: 'ctx.createText({ name: "DynamicLabel", x: 70, y: 0, width: 60, height: 8, text: "Dynamic " + ctx.row.Amount });',
        },
      },
    });

    const document = renderReport(template, { orders: [{ Amount: 7 }] });

    expect(textContentsFromDocument(document)).toEqual(['7', 'Dynamic 7']);
    expect(template.pages[0].bands[0].components.map(component => component.name)).toEqual(['AmountText']);
  });

  it('keeps multiple dynamic components unique within one band instance', () => {
    const template = reportTemplate({
      bandEvents: {
        beforePrint: {
          enabled: true,
          script: [
            'ctx.createText({ name: "DynamicA", x: 70, y: 0, width: 30, height: 8, text: "A" });',
            'ctx.createText({ name: "DynamicB", x: 100, y: 0, width: 30, height: 8, text: "B" });',
          ].join(''),
        },
      },
    });

    const document = renderReport(template, { orders: [{ Amount: 7 }] });
    const dynamicText = document.pages[0].items[0].components.filter(component => (
      component.type === 'text' && component.id.startsWith('dynamic-text-')
    ));

    expect(textContentsFromDocument(document)).toEqual(['7', 'A', 'B']);
    expect(dynamicText).toHaveLength(2);
    expect(new Set(dynamicText.map(component => component.id)).size).toBe(2);
  });

  it('keeps dynamic component ids unique across data rows', () => {
    const template = reportTemplate({
      bandEvents: {
        beforePrint: {
          enabled: true,
          script: 'ctx.createText({ name: "DynamicLabel", x: 70, y: 0, width: 60, height: 8, text: "Dynamic " + ctx.row.Amount });',
        },
      },
    });

    const document = renderReport(template, { orders: [{ Amount: 7 }, { Amount: 8 }] });
    const dynamicText = document.pages.flatMap(page => page.items).flatMap(item => item.components).filter(component => (
      component.type === 'text' && component.id.startsWith('dynamic-text-')
    ));

    expect(textContentsFromDocument(document)).toEqual(['7', 'Dynamic 7', '8', 'Dynamic 8']);
    expect(dynamicText).toHaveLength(2);
    expect(new Set(dynamicText.map(component => component.id)).size).toBe(2);
  });

  it('binds dynamic text expressions to the current row', () => {
    const template = reportTemplate({
      bandEvents: {
        beforePrint: {
          enabled: true,
          script: 'ctx.createText({ name: "DynamicLabel", x: 70, y: 0, width: 60, height: 8, text: "" }); ctx.bindText("DynamicLabel", "{orders.Label}");',
        },
      },
    });

    const document = renderReport(template, { orders: [{ Amount: 1, Label: 'First' }, { Amount: 2, Label: 'Second' }] });

    expect(textContentsFromDocument(document)).toEqual(['1', 'First', '2', 'Second']);
  });

  it('returns event logs when component scripts throw', () => {
    const template = reportTemplate({
      components: [
        textComponent({
          text: 'Still rendered',
          events: {
            beforePrint: { enabled: true, script: 'throw new Error("component problem");' },
          },
        }),
      ],
    });

    const document = renderReport(template, { orders: [{ Amount: 1 }] });

    expect(textContentsFromDocument(document)).toEqual(['Still rendered']);
    expect(document.eventLogs).toEqual([
      expect.objectContaining({ level: 'error', ownerType: 'component', ownerId: 'amount-text', eventName: 'beforePrint', message: 'component problem' }),
    ]);
  });
});

function textContentsFromDocument(document: ReturnType<typeof renderReport>): string[] {
  return document.pages.flatMap(page =>
    page.items.flatMap(item =>
      item.components
        .filter((component): component is typeof component & { type: 'text'; content: string } => component.type === 'text')
        .map(component => component.content),
    ),
  );
}
