import { describe, expect, it } from 'vitest';
import {
  cloneReportTemplate,
  createEventContext,
  createEventLogCollector,
  createEventRuntimeState,
  findComponentInTemplate,
  runEventScript,
  validateEventScript,
} from '../src/event-engine';
import type { EventContext } from '../src/event-engine';
import type {
  Band,
  BarcodeComponent,
  ImageComponent,
  PanelComponent,
  ReportComponent,
  ReportTemplate,
  TextComponent,
} from '../src/template-model/types';

function textComponent(overrides: Partial<TextComponent> = {}): TextComponent {
  return {
    id: 'text-1',
    name: 'AmountText',
    type: 'text',
    x: 0,
    y: 0,
    width: 40,
    height: 8,
    text: '{orders.Amount}',
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
    border: {
      style: 'none',
      width: 0,
      color: '#000000',
      sides: { top: false, right: false, bottom: false, left: false },
    },
    canGrow: true,
    canShrink: false,
    ...overrides,
  };
}

function eventTemplate(components: ReportComponent[] = [textComponent()]): ReportTemplate {
  return {
    id: 'report-1',
    name: 'Event Report',
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
            height: 20,
            components,
            dataBand: { dataSourceId: 'orders' },
          },
        ],
      },
    ],
    dataSources: [{ id: 'orders', name: 'Orders', type: 'json' }],
    styles: [],
    conditionalFormats: [],
    parameters: [],
  };
}

describe('phase 23 event engine', () => {
  it('runs enabled scripts only through ctx and records logs', () => {
    const eventLogs = createEventLogCollector();
    const ctx: EventContext = {
      mode: 'preview',
      data: { total: 1 },
      state: {},
      target: {
        ownerType: 'component',
        ownerId: 'text1',
        eventName: 'getValue',
      },
      log: eventLogs,
    };

    runEventScript({
      event: { enabled: true, script: "ctx.state.total = ctx.data.total + 1; ctx.log.info('updated');" },
      ctx,
      target: ctx.target,
      eventLogs,
    });

    expect(ctx.state.total).toBe(2);
    expect(eventLogs.entries).toEqual([
      expect.objectContaining({
        level: 'info',
        message: 'updated',
        ownerType: 'component',
        ownerId: 'text1',
        eventName: 'getValue',
      }),
    ]);
  });

  it('skips inactive scripts', () => {
    const eventLogs = createEventLogCollector();
    const ctx: EventContext = {
      mode: 'preview',
      data: {},
      state: { touched: false },
      target: {
        ownerType: 'report',
        ownerId: 'report1',
        eventName: 'beforePreview',
      },
      log: eventLogs,
    };

    runEventScript({
      event: { enabled: false, script: 'ctx.state.touched = true;' },
      ctx,
      target: ctx.target,
      eventLogs,
    });

    expect(ctx.state.touched).toBe(false);
    expect(eventLogs.entries).toHaveLength(0);
  });

  it('rejects blocked tokens during validation', () => {
    const result = validateEventScript('fetch("/api")');

    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('fetch');
  });

  it('does not reject blocked token text inside strings or comments', () => {
    const result = validateEventScript([
      'ctx.log.info("window fetch localStorage");',
      '// document constructor prototype should be plain documentation text',
      'ctx.state.message = "safe";',
    ].join('\n'));

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects constructor access during validation', () => {
    const result = validateEventScript('ctx.log.info.constructor.constructor("return 1")()');

    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('constructor');
  });

  it('rejects prototype mutation during validation', () => {
    const result = validateEventScript('ctx.state.__proto__ = {}');

    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('__proto__');
  });

  it('rejects prototype access during validation', () => {
    const result = validateEventScript('ctx.state.prototype = {}');

    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('prototype');
  });

  it('captures thrown errors into event logs without throwing', () => {
    const eventLogs = createEventLogCollector();
    const ctx: EventContext = {
      mode: 'print',
      data: {},
      state: {},
      target: {
        ownerType: 'band',
        ownerId: 'detail',
        eventName: 'beforePrint',
      },
      log: eventLogs,
    };

    expect(() =>
      runEventScript({
        event: { enabled: true, script: "throw new Error('boom');" },
        ctx,
        target: ctx.target,
        eventLogs,
      }),
    ).not.toThrow();

    expect(eventLogs.entries).toEqual([
      expect.objectContaining({
        level: 'error',
        message: expect.stringContaining('boom'),
        ownerType: 'band',
        ownerId: 'detail',
        eventName: 'beforePrint',
      }),
    ]);
  });

  it('records an error after max event count is exceeded', () => {
    const eventLogs = createEventLogCollector();
    const runtimeState = createEventRuntimeState({ maxEventCount: 1 });
    const ctx: EventContext = {
      mode: 'preview',
      data: {},
      state: { count: 0 },
      target: {
        ownerType: 'report',
        ownerId: 'report1',
        eventName: 'beforeRender',
      },
      log: eventLogs,
      runtime: runtimeState,
    };

    runEventScript({
      event: { enabled: true, script: 'ctx.state.count += 1;' },
      ctx,
      target: ctx.target,
      eventLogs,
      runtimeState,
    });
    runEventScript({
      event: { enabled: true, script: 'ctx.state.count += 1;' },
      ctx,
      target: ctx.target,
      eventLogs,
      runtimeState,
    });

    expect(ctx.state.count).toBe(1);
    expect(eventLogs.entries).toEqual([
      expect.objectContaining({
        level: 'error',
        message: expect.stringContaining('maxEventCount'),
      }),
    ]);
  });

  it('adds timestamps to event logs', () => {
    const eventLogs = createEventLogCollector();

    eventLogs.info('stable');
    eventLogs.push({
      level: 'warning',
      message: 'pushed',
      ownerType: 'report',
      ownerId: 'report1',
      eventName: 'beforeRender',
    });

    expect(eventLogs.entries).toEqual([
      expect.objectContaining({
        level: 'info',
        message: 'stable',
        ownerType: 'report',
        ownerId: '',
        eventName: '',
        timestamp: expect.any(String),
      }),
      expect.objectContaining({
        level: 'warning',
        message: 'pushed',
        ownerType: 'report',
        ownerId: 'report1',
        eventName: 'beforeRender',
        timestamp: expect.any(String),
      }),
    ]);
  });
});

describe('phase 23 event template helpers', () => {
  it('clones templates before mutation', () => {
    const original = eventTemplate();
    const cloned = cloneReportTemplate(original);
    const clonedComponent = findComponentInTemplate(cloned, 'AmountText') as TextComponent;

    clonedComponent.text = 'Changed';

    expect((findComponentInTemplate(original, 'AmountText') as TextComponent).text).toBe('{orders.Amount}');
    expect((findComponentInTemplate(cloned, 'AmountText') as TextComponent).text).toBe('Changed');
  });

  it('finds components by id or name including nested panel components', () => {
    const nested = textComponent({ id: 'nested-text', name: 'NestedAmount' });
    const panel: PanelComponent = {
      id: 'panel-1',
      name: 'TotalsPanel',
      type: 'panel',
      x: 0,
      y: 8,
      width: 50,
      height: 12,
      border: {
        style: 'none',
        width: 0,
        color: '#000000',
        sides: { top: false, right: false, bottom: false, left: false },
      },
      components: [nested],
    };
    const template = eventTemplate([textComponent(), panel]);

    expect(findComponentInTemplate(template, 'text-1')?.name).toBe('AmountText');
    expect(findComponentInTemplate(template, 'AmountText')?.id).toBe('text-1');
    expect(findComponentInTemplate(template, 'nested-text')?.name).toBe('NestedAmount');
    expect(findComponentInTemplate(template, 'NestedAmount')?.id).toBe('nested-text');
  });

  it('mutates component properties, text bindings, and execution state through ctx', () => {
    const template = cloneReportTemplate(eventTemplate());
    const eventLogs = createEventLogCollector();
    const runtime = createEventRuntimeState();
    const page = template.pages[0];
    const band = page.bands[0];
    const component = band.components[0];
    const execution = { canceled: false, hidden: false, hasValue: false };
    const ctx = createEventContext({
      mode: 'preview',
      report: template,
      page,
      band,
      component,
      row: { Amount: 120 },
      rowIndex: 0,
      dataSourceId: 'orders',
      data: { orders: [{ Amount: 120 }] },
      parameters: { currency: 'CNY' },
      variables: { total: 120 },
      state: { touched: true },
      log: eventLogs,
      target: {
        ownerType: 'component',
        ownerId: component.id,
        eventName: 'beforePrint',
      },
      runtime,
      execution,
    });

    ctx.setComponentProperty('AmountText', 'font.bold', true);
    ctx.bindText('AmountText', '{orders.Total}');
    ctx.hide();
    ctx.cancel();
    ctx.setValue(123);

    const changed = findComponentInTemplate(template, 'AmountText') as TextComponent;
    expect(changed.font.bold).toBe(true);
    expect(changed.text).toBe('{orders.Total}');
    expect(execution.hidden).toBe(true);
    expect(execution.canceled).toBe(true);
    expect(execution.value).toBe(123);
    expect(execution.hasValue).toBe(true);
    expect(ctx.value).toBe(123);
    expect(ctx.state).toEqual({ touched: true });
    expect(ctx.log).toBe(eventLogs);
  });

  it('creates dynamic text, image, and barcode components on the current band', () => {
    const template = cloneReportTemplate(eventTemplate());
    const ctx = createEventContext({
      report: template,
      band: template.pages[0].bands[0],
      log: createEventLogCollector(),
      target: { ownerType: 'band', ownerId: 'band-1', eventName: 'beforePrint' },
      execution: { canceled: false, hidden: false, hasValue: false },
    });

    const dynamicText = ctx.createText({
      name: 'VipBadge',
      x: 42,
      y: 0,
      width: 20,
      height: 8,
      text: 'VIP',
      font: { bold: true, color: '#d97706' },
    }) as TextComponent;
    const dynamicImage = ctx.createImage({
      name: 'Logo',
      x: 0,
      y: 10,
      width: 12,
      height: 12,
      src: 'data:image/png;base64,a',
    }) as ImageComponent;
    const dynamicBarcode = ctx.createBarcode({
      name: 'Code',
      x: 20,
      y: 10,
      width: 30,
      height: 12,
      value: '{orders.Code}',
    }) as BarcodeComponent;

    expect((template.pages[0].bands[0] as Band).components.map((item) => item.name)).toEqual([
      'AmountText',
      'VipBadge',
      'Logo',
      'Code',
    ]);
    expect(dynamicText).toMatchObject({
      type: 'text',
      text: 'VIP',
      font: { family: 'Arial', size: 10, bold: true, italic: false, color: '#d97706' },
      textAlign: 'left',
      verticalAlign: 'middle',
      canGrow: true,
      canShrink: false,
    });
    expect(dynamicText.id).toMatch(/^dynamic-text-\d+$/);
    expect(dynamicImage).toMatchObject({
      type: 'image',
      src: 'data:image/png;base64,a',
      fitMode: 'contain',
    });
    expect(dynamicImage.id).toMatch(/^dynamic-image-\d+$/);
    expect(dynamicBarcode).toMatchObject({
      type: 'barcode',
      value: '{orders.Code}',
      format: 'CODE128',
      showText: true,
    });
    expect(dynamicBarcode.id).toMatch(/^dynamic-barcode-\d+$/);
    expect(new Set([dynamicText.id, dynamicImage.id, dynamicBarcode.id]).size).toBe(3);
  });

  it('keeps dynamic component ids unique across contexts for the same template', () => {
    const template = cloneReportTemplate(eventTemplate());
    const band = template.pages[0].bands[0];
    const firstCtx = createEventContext({
      report: template,
      band,
      log: createEventLogCollector(),
      target: { ownerType: 'band', ownerId: 'band-1', eventName: 'beforePrint' },
    });
    const secondCtx = createEventContext({
      report: template,
      band,
      log: createEventLogCollector(),
      target: { ownerType: 'band', ownerId: 'band-1', eventName: 'beforePrint' },
    });

    const first = firstCtx.createText({ x: 0, y: 0, width: 10, height: 5, text: 'First' });
    const second = secondCtx.createText({ x: 12, y: 0, width: 10, height: 5, text: 'Second' });

    expect(first.id).toMatch(/^dynamic-text-\d+$/);
    expect(second.id).toMatch(/^dynamic-text-\d+$/);
    expect(first.id).not.toBe(second.id);
    expect(band.components.map((item) => item.id)).toEqual(expect.arrayContaining([first.id, second.id]));
  });

  it('sets component properties through existing array path segments', () => {
    const template = cloneReportTemplate(
      eventTemplate([
        textComponent({
          conditions: [{ id: 'c1', expression: 'true', overrides: {} }],
        }),
      ]),
    );
    const ctx = createEventContext({
      report: template,
      band: template.pages[0].bands[0],
      log: createEventLogCollector(),
      target: { ownerType: 'component', ownerId: 'text-1', eventName: 'beforePrint' },
    });

    ctx.setComponentProperty('AmountText', 'conditions.0.overrides.backgroundColor', '#fef3c7');

    expect((findComponentInTemplate(template, 'AmountText') as TextComponent).conditions?.[0].overrides).toEqual({
      backgroundColor: '#fef3c7',
    });
  });

  it('throws when component property paths cross missing array elements', () => {
    const template = cloneReportTemplate(
      eventTemplate([
        textComponent({
          conditions: [{ id: 'c1', expression: 'true', overrides: {} }],
        }),
      ]),
    );
    const ctx = createEventContext({
      report: template,
      band: template.pages[0].bands[0],
      log: createEventLogCollector(),
      target: { ownerType: 'component', ownerId: 'text-1', eventName: 'beforePrint' },
    });

    expect(() =>
      ctx.setComponentProperty('AmountText', 'conditions.1.overrides.backgroundColor', '#fef3c7'),
    ).toThrow('Cannot set component property path: conditions.1.overrides.backgroundColor');
  });

  it('throws a clear error when creating dynamic components without a current band', () => {
    const ctx = createEventContext({
      report: eventTemplate(),
      log: createEventLogCollector(),
      target: { ownerType: 'report', ownerId: 'report-1', eventName: 'beforeRender' },
      execution: { canceled: false, hidden: false, hasValue: false },
    });

    expect(() => ctx.createText({ x: 0, y: 0, width: 10, height: 5, text: 'Missing' })).toThrow(
      'current band is required',
    );
  });
});
