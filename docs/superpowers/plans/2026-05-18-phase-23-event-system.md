# Phase 23 Event System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a synchronous report event system that can mutate report output at render time while preserving preview, print, and PDF parity.

**Architecture:** Events are stored on report, band, and component model objects, then executed by a focused core event engine during `renderReport`. The engine clones the template for the current render, exposes a constrained `ctx` facade, records recoverable logs, and feeds the mutated working template into the existing band planning and layout pipeline.

**Tech Stack:** TypeScript, Vitest, React 19, AntD 6, Zustand, existing core render pipeline.

---

## File Structure

Create these files:

- `packages/core/src/event-engine/types.ts` - event names, event script model, runtime state, context contracts, log types.
- `packages/core/src/event-engine/event-log.ts` - append-only log collector with typed severities.
- `packages/core/src/event-engine/event-runner.ts` - script validation and synchronous execution wrapper.
- `packages/core/src/event-engine/event-template.ts` - deep clone, component lookup, property mutation, and dynamic component append helpers.
- `packages/core/src/event-engine/event-context.ts` - report, band, component, and helper facade creation.
- `packages/core/src/event-engine/index.ts` - public exports for the event engine.
- `packages/core/__tests__/phase-23-event-engine.test.ts` - unit tests for runner, context helpers, cloning, mutation, dynamic components, and logs.
- `packages/core/__tests__/phase-23-render-events.test.ts` - integration tests through `renderReport`.
- `packages/designer/src/components/events/EventEditorDialog.tsx` - event editor modal.
- `packages/designer/src/components/events/event-editor-utils.ts` - event labels, insert snippets, validation helpers for designer UI.
- `packages/designer/src/__tests__/phase-23-event-editor.test.tsx` - designer event editor tests.
- `packages/viewer/src/__tests__/phase-23-event-render-modes.test.tsx` - viewer render mode and output tests.
- `packages/example/src/templates/event-logic.ts` - sample report showing event logic.

Modify these files:

- `packages/core/src/template-model/types.ts` - add event maps to report, band, and component interfaces.
- `packages/core/src/pagination/paginate.ts` - add render mode, clone working template, execute report and band events, pass event runtime into layout.
- `packages/core/src/layout-engine/layout-band.ts` - execute component events and skip hidden components.
- `packages/core/src/render-document/types.ts` - return event logs with the render document.
- `packages/core/src/index.ts` - export event types and helpers.
- `packages/viewer/src/components/Viewer.tsx` - render preview with `mode: 'preview'`; render print/PDF documents with the correct mode.
- `packages/viewer/src/export/index.ts` - keep export functions document-based and ensure callers pass event-mutated documents.
- `packages/designer/src/store/designer-store.ts` - add report, band, and component event update actions.
- `packages/designer/src/components/PropertyEditor.tsx` - add localized event property group.
- `packages/designer/src/components/panels/DesignerPropertyPanel.tsx` - route page-level selection to report events when no band/component is selected.
- `packages/designer/src/i18n/messages.ts` - add Chinese and English event labels.
- `packages/example/src/templates/index.ts` - export the event logic sample.

## Implementation Tasks

### Task 1: Core Event Model and Runner

**Files:**
- Create: `packages/core/src/event-engine/types.ts`
- Create: `packages/core/src/event-engine/event-log.ts`
- Create: `packages/core/src/event-engine/event-runner.ts`
- Create: `packages/core/src/event-engine/index.ts`
- Modify: `packages/core/src/template-model/types.ts`
- Modify: `packages/core/src/render-document/types.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/__tests__/phase-23-event-engine.test.ts`

- [ ] **Step 1: Write the failing runner tests**

Add `packages/core/__tests__/phase-23-event-engine.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createEventLogCollector, runEventScript, validateEventScript } from '../src/event-engine';
import type { EventRuntimeState } from '../src/event-engine';

function state(): EventRuntimeState {
  return {
    mode: 'preview',
    logs: createEventLogCollector(),
    eventCount: 0,
    maxEventCount: 100,
    parameters: {},
    variables: {},
    data: {},
  };
}

describe('event runner', () => {
  it('runs enabled scripts with only ctx', () => {
    const runtime = state();
    const ctx = { value: 1, log: runtime.logs.info };

    runEventScript({
      ownerType: 'report',
      ownerId: 'report-1',
      eventName: 'beforeRender',
      event: { enabled: true, script: 'ctx.value = ctx.value + 2; ctx.log("changed");' },
      ctx,
      state: runtime,
    });

    expect(ctx.value).toBe(3);
    expect(runtime.logs.entries).toEqual([
      expect.objectContaining({ level: 'info', message: 'changed' }),
    ]);
  });

  it('ignores disabled scripts', () => {
    const runtime = state();
    const ctx = { value: 1 };

    runEventScript({
      ownerType: 'report',
      ownerId: 'report-1',
      eventName: 'beforeRender',
      event: { enabled: false, script: 'ctx.value = 99;' },
      ctx,
      state: runtime,
    });

    expect(ctx.value).toBe(1);
    expect(runtime.logs.entries).toHaveLength(0);
  });

  it('rejects blocked tokens', () => {
    const result = validateEventScript('fetch("/api")');

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('fetch');
  });

  it('captures script exceptions in event logs', () => {
    const runtime = state();

    runEventScript({
      ownerType: 'component',
      ownerId: 'text-1',
      eventName: 'beforePrint',
      event: { enabled: true, script: 'throw new Error("bad script");' },
      ctx: {},
      state: runtime,
    });

    expect(runtime.logs.entries).toEqual([
      expect.objectContaining({
        level: 'error',
        ownerType: 'component',
        ownerId: 'text-1',
        eventName: 'beforePrint',
      }),
    ]);
  });

  it('stops after the configured event count limit', () => {
    const runtime = { ...state(), maxEventCount: 1 };

    runEventScript({
      ownerType: 'report',
      ownerId: 'report-1',
      eventName: 'beforeRender',
      event: { enabled: true, script: 'ctx.value = 1;' },
      ctx: {},
      state: runtime,
    });

    runEventScript({
      ownerType: 'report',
      ownerId: 'report-1',
      eventName: 'afterRender',
      event: { enabled: true, script: 'ctx.value = 2;' },
      ctx: {},
      state: runtime,
    });

    expect(runtime.logs.entries).toEqual([
      expect.objectContaining({ level: 'error', message: expect.stringContaining('event count') }),
    ]);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
pnpm --filter @report-designer/core test -- __tests__/phase-23-event-engine.test.ts
```

Expected: the test fails because `../src/event-engine` does not exist.

- [ ] **Step 3: Add event types**

Create `packages/core/src/event-engine/types.ts`:

```ts
import type { Band, BarcodeComponent, ImageComponent, Page, ReportComponent, ReportTemplate, TextComponent } from '../template-model/types';

export type ReportEventName =
  | 'beforePreview'
  | 'beforePrint'
  | 'beforeRender'
  | 'afterRender'
  | 'beforeData'
  | 'afterData';

export type BandEventName = 'beforePrint' | 'afterPrint' | 'beforeRow' | 'afterRow';

export type ComponentEventName = 'getValue' | 'beforePrint' | 'afterPrint';

export interface EventScript {
  enabled: boolean;
  script: string;
}

export type EventMap<TName extends string> = Partial<Record<TName, EventScript>>;
export type EventMode = 'preview' | 'print' | 'pdf';
export type EventOwnerType = 'report' | 'band' | 'component';
export type EventLogLevel = 'info' | 'warning' | 'error';

export interface EventLogEntry {
  id: string;
  level: EventLogLevel;
  message: string;
  ownerType?: EventOwnerType;
  ownerId?: string;
  eventName?: string;
}

export interface EventLogCollector {
  entries: EventLogEntry[];
  info: (message: unknown, meta?: Partial<EventLogEntry>) => void;
  warning: (message: unknown, meta?: Partial<EventLogEntry>) => void;
  error: (message: unknown, meta?: Partial<EventLogEntry>) => void;
}

export interface EventRuntimeState {
  mode: EventMode;
  logs: EventLogCollector;
  eventCount: number;
  maxEventCount: number;
  parameters: Record<string, unknown>;
  variables: Record<string, unknown>;
  data: Record<string, Record<string, unknown>[]>;
  canceled?: boolean;
}

export interface EventTargetState {
  canceled: boolean;
  hidden: boolean;
  value?: unknown;
  hasValue: boolean;
}

export interface DynamicTextOptions {
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  font?: Partial<TextComponent['font']>;
}

export interface DynamicImageOptions {
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  fitMode?: ImageComponent['fitMode'];
}

export interface DynamicBarcodeOptions {
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  format?: BarcodeComponent['format'];
  showText?: boolean;
}

export interface EventContext {
  mode: EventMode;
  report: ReportTemplate;
  page?: Page;
  band?: Band;
  component?: ReportComponent;
  row?: Record<string, unknown>;
  rowIndex: number;
  dataSourceId?: string;
  data: Record<string, Record<string, unknown>[]>;
  parameters: Record<string, unknown>;
  variables: Record<string, unknown>;
  value?: unknown;
  cancel: () => void;
  hide: () => void;
  setValue: (value: unknown) => void;
  log: (message: unknown) => void;
  getComponent: (idOrName: string) => ReportComponent | undefined;
  setComponentProperty: (idOrName: string, path: string, value: unknown) => void;
  bindText: (idOrName: string, expression: string) => void;
  createText: (options: DynamicTextOptions) => ReportComponent;
  createImage: (options: DynamicImageOptions) => ReportComponent;
  createBarcode: (options: DynamicBarcodeOptions) => ReportComponent;
}
```

Modify `packages/core/src/template-model/types.ts` by importing event types and adding optional maps:

```ts
import type { BandEventName, ComponentEventName, EventMap, ReportEventName } from '../event-engine/types';
```

Add to `ReportComponent`:

```ts
events?: EventMap<ComponentEventName>;
```

Add to `Band`:

```ts
events?: EventMap<BandEventName>;
```

Add to `ReportTemplate`:

```ts
events?: EventMap<ReportEventName>;
```

Modify `packages/core/src/render-document/types.ts` by importing `EventLogEntry` and adding:

```ts
eventLogs?: EventLogEntry[];
```

to `RenderDocument`.

- [ ] **Step 4: Add event log and runner**

Create `packages/core/src/event-engine/event-log.ts`:

```ts
import type { EventLogCollector, EventLogEntry, EventLogLevel } from './types';

let nextLogId = 1;

function stringifyMessage(message: unknown): string {
  if (message instanceof Error) return message.message;
  if (typeof message === 'string') return message;
  try {
    return JSON.stringify(message);
  } catch {
    return String(message);
  }
}

export function createEventLogCollector(): EventLogCollector {
  const entries: EventLogEntry[] = [];
  const add = (level: EventLogLevel, message: unknown, meta: Partial<EventLogEntry> = {}) => {
    entries.push({
      id: `event-log-${nextLogId++}`,
      level,
      message: stringifyMessage(message),
      ...meta,
    });
  };

  return {
    entries,
    info: (message, meta) => add('info', message, meta),
    warning: (message, meta) => add('warning', message, meta),
    error: (message, meta) => add('error', message, meta),
  };
}
```

Create `packages/core/src/event-engine/event-runner.ts`:

```ts
import type { EventOwnerType, EventRuntimeState, EventScript } from './types';

const MAX_SCRIPT_LENGTH = 8 * 1024;
const BLOCKED_TOKENS = [
  'window',
  'document',
  'globalThis',
  'Function',
  'eval',
  'XMLHttpRequest',
  'fetch',
  'localStorage',
  'sessionStorage',
  'import',
  'require',
];

export interface RunEventScriptOptions {
  ownerType: EventOwnerType;
  ownerId: string;
  eventName: string;
  event?: EventScript;
  ctx: object;
  state: EventRuntimeState;
}

export function validateEventScript(script: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (script.length > MAX_SCRIPT_LENGTH) {
    errors.push(`Script is longer than ${MAX_SCRIPT_LENGTH} characters.`);
  }
  for (const token of BLOCKED_TOKENS) {
    const pattern = new RegExp(`\\b${token}\\b`);
    if (pattern.test(script)) {
      errors.push(`Blocked token: ${token}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function runEventScript(options: RunEventScriptOptions): void {
  const { event, state, ownerType, ownerId, eventName, ctx } = options;
  if (!event?.enabled || !event.script.trim()) return;

  if (state.eventCount >= state.maxEventCount) {
    state.logs.error('Maximum event count exceeded.', { ownerType, ownerId, eventName });
    return;
  }
  state.eventCount += 1;

  const validation = validateEventScript(event.script);
  if (!validation.valid) {
    for (const message of validation.errors) {
      state.logs.error(message, { ownerType, ownerId, eventName });
    }
    return;
  }

  try {
    const runner = new Function(
      'ctx',
      '"use strict";\n'
        + 'const window = undefined, document = undefined, globalThis = undefined, Function = undefined, eval = undefined;\n'
        + 'const XMLHttpRequest = undefined, fetch = undefined, localStorage = undefined, sessionStorage = undefined;\n'
        + event.script,
    );
    runner(ctx);
  } catch (error) {
    state.logs.error(error, { ownerType, ownerId, eventName });
  }
}
```

Create `packages/core/src/event-engine/index.ts`:

```ts
export * from './types';
export * from './event-log';
export * from './event-runner';
```

Modify `packages/core/src/index.ts`:

```ts
export * from './event-engine';
```

- [ ] **Step 5: Run runner tests and commit**

Run:

```bash
pnpm --filter @report-designer/core test -- __tests__/phase-23-event-engine.test.ts
pnpm --filter @report-designer/core build
```

Expected: both commands pass.

Commit:

```bash
git add packages/core/src packages/core/__tests__/phase-23-event-engine.test.ts
git commit -m "feat(events): 增加事件脚本运行器"
```

### Task 2: Event Template Mutation Helpers

**Files:**
- Create: `packages/core/src/event-engine/event-template.ts`
- Create: `packages/core/src/event-engine/event-context.ts`
- Modify: `packages/core/src/event-engine/index.ts`
- Test: `packages/core/__tests__/phase-23-event-engine.test.ts`

- [ ] **Step 1: Extend the failing helper tests**

Append these tests to `packages/core/__tests__/phase-23-event-engine.test.ts`:

```ts
import { createEventContext, cloneReportTemplate, findComponentInTemplate } from '../src/event-engine';
import type { ReportTemplate, TextComponent } from '../src/template-model/types';

const textComponent: TextComponent = {
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
};

function eventTemplate(): ReportTemplate {
  return {
    id: 'report-1',
    name: 'Event Report',
    version: '2.0',
    pages: [{
      id: 'page-1',
      width: 210,
      height: 297,
      margins: { top: 10, right: 10, bottom: 10, left: 10 },
      orientation: 'portrait',
      bands: [{
        id: 'band-1',
        type: 'data',
        height: 20,
        components: [textComponent],
        dataBand: { dataSourceId: 'orders' },
      }],
    }],
    dataSources: [{ id: 'orders', name: 'Orders', type: 'json' }],
    styles: [],
    conditionalFormats: [],
    parameters: [],
  };
}

describe('event template helpers', () => {
  it('clones templates before mutation', () => {
    const original = eventTemplate();
    const cloned = cloneReportTemplate(original);
    const component = findComponentInTemplate(cloned, 'AmountText') as TextComponent;

    component.text = 'Changed';

    expect((findComponentInTemplate(original, 'AmountText') as TextComponent).text).toBe('{orders.Amount}');
    expect((findComponentInTemplate(cloned, 'AmountText') as TextComponent).text).toBe('Changed');
  });

  it('mutates component properties and text bindings through ctx', () => {
    const template = cloneReportTemplate(eventTemplate());
    const runtime = state();
    const band = template.pages[0].bands[0];
    const component = band.components[0];
    const target = { canceled: false, hidden: false, hasValue: false };
    const ctx = createEventContext({
      template,
      runtime,
      page: template.pages[0],
      band,
      component,
      row: { Amount: 120 },
      rowIndex: 0,
      dataSourceId: 'orders',
      target,
    });

    ctx.setComponentProperty('AmountText', 'font.bold', true);
    ctx.bindText('AmountText', '{orders.Total}');
    ctx.hide();

    const changed = findComponentInTemplate(template, 'AmountText') as TextComponent;
    expect(changed.font.bold).toBe(true);
    expect(changed.text).toBe('{orders.Total}');
    expect(target.hidden).toBe(true);
  });

  it('creates dynamic text, image, and barcode components on the current band', () => {
    const template = cloneReportTemplate(eventTemplate());
    const runtime = state();
    const band = template.pages[0].bands[0];
    const target = { canceled: false, hidden: false, hasValue: false };
    const ctx = createEventContext({
      template,
      runtime,
      page: template.pages[0],
      band,
      row: { IsVip: true },
      rowIndex: 0,
      dataSourceId: 'orders',
      target,
    });

    ctx.createText({ name: 'VipBadge', x: 42, y: 0, width: 20, height: 8, text: 'VIP', font: { bold: true } });
    ctx.createImage({ name: 'Logo', x: 0, y: 10, width: 12, height: 12, src: 'data:image/png;base64,a' });
    ctx.createBarcode({ name: 'Code', x: 20, y: 10, width: 30, height: 12, value: '{orders.Code}', format: 'CODE128' });

    expect(band.components.map(item => item.name)).toEqual(['AmountText', 'VipBadge', 'Logo', 'Code']);
  });
});
```

- [ ] **Step 2: Run the failing helper tests**

Run:

```bash
pnpm --filter @report-designer/core test -- __tests__/phase-23-event-engine.test.ts
```

Expected: the test fails because template helper exports do not exist.

- [ ] **Step 3: Implement cloning and component mutation helpers**

Create `packages/core/src/event-engine/event-template.ts`:

```ts
import type { BarcodeComponent, Band, ImageComponent, PanelComponent, ReportComponent, ReportTemplate, TextComponent } from '../template-model/types';
import type { DynamicBarcodeOptions, DynamicImageOptions, DynamicTextOptions } from './types';

let nextDynamicId = 1;

export function cloneReportTemplate(template: ReportTemplate): ReportTemplate {
  return structuredClone(template);
}

export function findComponentInTemplate(template: ReportTemplate, idOrName: string): ReportComponent | undefined {
  for (const page of template.pages) {
    for (const band of page.bands) {
      const found = findComponentInList(band.components, idOrName);
      if (found) return found;
    }
  }
  return undefined;
}

export function findComponentInList(components: ReportComponent[], idOrName: string): ReportComponent | undefined {
  for (const component of components) {
    if (component.id === idOrName || component.name === idOrName) return component;
    if (component.type === 'panel') {
      const found = findComponentInList((component as PanelComponent).components, idOrName);
      if (found) return found;
    }
  }
  return undefined;
}

export function setComponentProperty(component: ReportComponent, path: string, value: unknown): void {
  const segments = path.split('.').filter(Boolean);
  if (segments.length === 0) return;
  let target: Record<string, unknown> = component as unknown as Record<string, unknown>;
  for (const segment of segments.slice(0, -1)) {
    const current = target[segment];
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      target[segment] = {};
    }
    target = target[segment] as Record<string, unknown>;
  }
  target[segments[segments.length - 1]] = value;
}

export function createDynamicText(options: DynamicTextOptions): TextComponent {
  return {
    id: `dynamic-text-${nextDynamicId++}`,
    name: options.name,
    type: 'text',
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    text: options.text,
    font: {
      family: 'Arial',
      size: 10,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      color: '#000000',
      ...options.font,
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
  };
}

export function createDynamicImage(options: DynamicImageOptions): ImageComponent {
  return {
    id: `dynamic-image-${nextDynamicId++}`,
    name: options.name,
    type: 'image',
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    src: options.src,
    fitMode: options.fitMode ?? 'contain',
  };
}

export function createDynamicBarcode(options: DynamicBarcodeOptions): BarcodeComponent {
  return {
    id: `dynamic-barcode-${nextDynamicId++}`,
    name: options.name,
    type: 'barcode',
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    value: options.value,
    format: options.format ?? 'CODE128',
    showText: options.showText ?? true,
  };
}

export function appendComponentToBand(band: Band, component: ReportComponent): ReportComponent {
  band.components.push(component);
  return component;
}
```

- [ ] **Step 4: Implement context facade**

Create `packages/core/src/event-engine/event-context.ts`:

```ts
import type { Band, Page, ReportComponent, ReportTemplate, TextComponent } from '../template-model/types';
import {
  appendComponentToBand,
  createDynamicBarcode,
  createDynamicImage,
  createDynamicText,
  findComponentInTemplate,
  setComponentProperty as setProperty,
} from './event-template';
import type { EventContext, EventRuntimeState, EventTargetState } from './types';

export interface CreateEventContextOptions {
  template: ReportTemplate;
  runtime: EventRuntimeState;
  page?: Page;
  band?: Band;
  component?: ReportComponent;
  row?: Record<string, unknown>;
  rowIndex?: number;
  dataSourceId?: string;
  target: EventTargetState;
}

export function createEventContext(options: CreateEventContextOptions): EventContext {
  const { template, runtime, target, page, band, component, row, dataSourceId } = options;
  const rowIndex = options.rowIndex ?? 0;

  return {
    mode: runtime.mode,
    report: template,
    page,
    band,
    component,
    row,
    rowIndex,
    dataSourceId,
    data: runtime.data,
    parameters: runtime.parameters,
    variables: runtime.variables,
    get value() {
      return target.value;
    },
    set value(value: unknown) {
      target.value = value;
      target.hasValue = true;
    },
    cancel: () => {
      target.canceled = true;
    },
    hide: () => {
      target.hidden = true;
    },
    setValue: (value: unknown) => {
      target.value = value;
      target.hasValue = true;
    },
    log: (message: unknown) => runtime.logs.info(message),
    getComponent: (idOrName: string) => findComponentInTemplate(template, idOrName),
    setComponentProperty: (idOrName: string, path: string, value: unknown) => {
      const targetComponent = findComponentInTemplate(template, idOrName);
      if (targetComponent) setProperty(targetComponent, path, value);
    },
    bindText: (idOrName: string, expression: string) => {
      const targetComponent = findComponentInTemplate(template, idOrName);
      if (targetComponent?.type === 'text') {
        (targetComponent as TextComponent).text = expression;
      }
    },
    createText: (dynamicOptions) => appendComponentToBand(requiredBand(band), createDynamicText(dynamicOptions)),
    createImage: (dynamicOptions) => appendComponentToBand(requiredBand(band), createDynamicImage(dynamicOptions)),
    createBarcode: (dynamicOptions) => appendComponentToBand(requiredBand(band), createDynamicBarcode(dynamicOptions)),
  };
}

function requiredBand(band?: Band): Band {
  if (!band) {
    throw new Error('Dynamic components require a current band.');
  }
  return band;
}
```

Modify `packages/core/src/event-engine/index.ts`:

```ts
export * from './types';
export * from './event-log';
export * from './event-runner';
export * from './event-template';
export * from './event-context';
```

- [ ] **Step 5: Run helper tests and commit**

Run:

```bash
pnpm --filter @report-designer/core test -- __tests__/phase-23-event-engine.test.ts
pnpm --filter @report-designer/core build
```

Expected: both commands pass.

Commit:

```bash
git add packages/core/src packages/core/__tests__/phase-23-event-engine.test.ts
git commit -m "feat(events): 增加事件模板变更上下文"
```

### Task 3: Wire Events Into Rendering

**Files:**
- Modify: `packages/core/src/pagination/paginate.ts`
- Modify: `packages/core/src/layout-engine/layout-band.ts`
- Modify: `packages/core/src/band-planner/band-plan.ts`
- Test: `packages/core/__tests__/phase-23-render-events.test.ts`

- [ ] **Step 1: Write failing render integration tests**

Add `packages/core/__tests__/phase-23-render-events.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { renderReport } from '../src';
import type { ReportTemplate, TextComponent } from '../src/template-model/types';

function baseText(overrides: Partial<TextComponent> = {}): TextComponent {
  return {
    id: 'text-1',
    name: 'AmountText',
    type: 'text',
    x: 0,
    y: 0,
    width: 50,
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

function template(text = baseText()): ReportTemplate {
  return {
    id: 'report-1',
    name: 'Render Events',
    version: '2.0',
    pages: [{
      id: 'page-1',
      width: 210,
      height: 297,
      margins: { top: 10, right: 10, bottom: 10, left: 10 },
      orientation: 'portrait',
      bands: [{
        id: 'data-band',
        name: 'DataBand',
        type: 'data',
        height: 14,
        dataBand: { dataSourceId: 'orders' },
        components: [text],
      }],
    }],
    dataSources: [{ id: 'orders', name: 'Orders', type: 'json' }],
    styles: [],
    conditionalFormats: [],
    parameters: [],
  };
}

function firstTextContent(document: ReturnType<typeof renderReport>): string {
  const item = document.pages[0].items.flatMap(band => band.components).find(component => component.type === 'text');
  return String(item && 'content' in item ? item.content : '');
}

describe('render events', () => {
  it('runs report beforePreview only in preview mode', () => {
    const report = template();
    report.events = {
      beforePreview: { enabled: true, script: 'ctx.bindText("AmountText", "Preview");' },
      beforePrint: { enabled: true, script: 'ctx.bindText("AmountText", "Print");' },
    };

    expect(firstTextContent(renderReport(report, { orders: [{ Amount: 1 }] }, { mode: 'preview' }))).toBe('Preview');
    expect(firstTextContent(renderReport(report, { orders: [{ Amount: 1 }] }, { mode: 'print' }))).toBe('Print');
    expect(firstTextContent(renderReport(report, { orders: [{ Amount: 1 }] }, { mode: 'pdf' }))).toBe('Print');
  });

  it('runs component getValue before formatting', () => {
    const report = template(baseText({
      format: { type: 'number', decimalDigits: 2, useGroupSeparator: true },
      events: { getValue: { enabled: true, script: 'ctx.setValue(1234.5);' } },
    }));

    expect(firstTextContent(renderReport(report, { orders: [{ Amount: 1 }] }))).toBe('1,234.50');
  });

  it('lets component beforePrint change style and hide output', () => {
    const report = template(baseText({
      events: { beforePrint: { enabled: true, script: 'if (ctx.row.Amount < 10) ctx.hide();' } },
    }));

    const document = renderReport(report, { orders: [{ Amount: 1 }] });

    expect(document.pages[0].items.flatMap(band => band.components)).toHaveLength(0);
  });

  it('lets band beforePrint hide a band instance', () => {
    const report = template();
    report.pages[0].bands[0].events = {
      beforePrint: { enabled: true, script: 'if (ctx.row.Amount < 10) ctx.hide();' },
    };

    const document = renderReport(report, { orders: [{ Amount: 1 }, { Amount: 20 }] });

    expect(document.pages[0].items).toHaveLength(1);
    expect(firstTextContent(document)).toBe('20');
  });

  it('adds dynamic text during band rendering without mutating the source template', () => {
    const report = template();
    report.pages[0].bands[0].events = {
      beforePrint: {
        enabled: true,
        script: 'if (ctx.row.IsVip) ctx.createText({ name: "VipBadge", x: 60, y: 0, width: 20, height: 8, text: "VIP" });',
      },
    };

    const document = renderReport(report, { orders: [{ Amount: 20, IsVip: true }] });
    const contents = document.pages[0].items.flatMap(band => band.components).map(component => 'content' in component ? component.content : '');

    expect(contents).toEqual(['20', 'VIP']);
    expect(report.pages[0].bands[0].components).toHaveLength(1);
  });

  it('captures event errors in the render document', () => {
    const report = template(baseText({
      events: { beforePrint: { enabled: true, script: 'throw new Error("broken");' } },
    }));

    const document = renderReport(report, { orders: [{ Amount: 20 }] });

    expect(document.eventLogs).toEqual([
      expect.objectContaining({ level: 'error', message: 'broken' }),
    ]);
  });
});
```

- [ ] **Step 2: Run failing render integration tests**

Run:

```bash
pnpm --filter @report-designer/core test -- __tests__/phase-23-render-events.test.ts
```

Expected: the test fails because render options and event execution are not wired.

- [ ] **Step 3: Add event runtime to render options**

Modify `packages/core/src/pagination/paginate.ts`:

```ts
import {
  cloneReportTemplate,
  createEventContext,
  createEventLogCollector,
  runEventScript,
  type EventMode,
  type EventRuntimeState,
  type EventTargetState,
} from '../event-engine';
```

Extend `RenderReportOptions`:

```ts
mode?: EventMode;
```

Extend `InternalRenderReportOptions`:

```ts
eventRuntime?: EventRuntimeState;
```

Update `renderReportInternal` to clone the template once per top-level render:

```ts
const workingTemplate = options.subreportDepth ? normalizeTemplate(template) : normalizeTemplate(cloneReportTemplate(template));
const runtime = options.eventRuntime ?? {
  mode: options.mode ?? 'preview',
  logs: createEventLogCollector(),
  eventCount: 0,
  maxEventCount: 10000,
  parameters: options.parameters ?? {},
  variables: {},
  data,
};
const templatePage = workingTemplate.pages[0];

runReportEvent(workingTemplate, runtime.mode === 'preview' ? 'beforePreview' : 'beforePrint', runtime);
runReportEvent(workingTemplate, 'beforeRender', runtime);
runReportEvent(workingTemplate, 'beforeData', runtime);

const plan = buildBandPlan(workingTemplate);
const logicalItems = executeBandPlan(plan, data);

runReportEvent(workingTemplate, 'afterData', runtime);

const pages = paginate(templatePage, plan.pageBands, logicalItems, data, workingTemplate.styles, { ...options, eventRuntime: runtime, mode: runtime.mode });
const document = applyPageNumberPass({ pages, eventLogs: runtime.logs.entries });

runReportEvent(workingTemplate, 'afterRender', runtime);
return { ...document, eventLogs: runtime.logs.entries };
```

Add helper:

```ts
function runReportEvent(template: ReportTemplate, eventName: ReportEventName, runtime: EventRuntimeState): EventTargetState {
  const target = { canceled: false, hidden: false, hasValue: false };
  runEventScript({
    ownerType: 'report',
    ownerId: template.id,
    eventName,
    event: template.events?.[eventName],
    ctx: createEventContext({ template, runtime, page: template.pages[0], rowIndex: 0, target }),
    state: runtime,
  });
  if (target.canceled) runtime.canceled = true;
  return target;
}
```

- [ ] **Step 4: Add band event context to the planner context**

Modify `packages/core/src/band-planner/band-plan.ts` so `RenderContext` includes:

```ts
rowsByBand?: Record<string, Record<string, unknown>[]>;
dataSourceId?: string;
```

Ensure `executeBandPlan` sets `dataSourceId` on data row contexts. If it already has the field, keep the existing implementation and only align the type.

- [ ] **Step 5: Execute band events in pagination**

In `packages/core/src/pagination/paginate.ts`, before measuring or placing a band inside `placeBand`, create a band target and run `beforeRow` and `beforePrint`:

```ts
const runBandEvents = (band: Band, eventContext: RenderContext): EventTargetState => {
  const target = { canceled: false, hidden: false, hasValue: false };
  const runtime = options.eventRuntime;
  if (!runtime) return target;
  const ctxOptions = {
    template: normalizedTemplate,
    runtime,
    page: templatePage,
    band,
    row: eventContext.row,
    rowIndex: eventContext.rowIndex,
    dataSourceId: eventContext.dataSourceId,
    target,
  };
  if (eventContext.row) {
    runEventScript({ ownerType: 'band', ownerId: band.id, eventName: 'beforeRow', event: band.events?.beforeRow, ctx: createEventContext(ctxOptions), state: runtime });
  }
  runEventScript({ ownerType: 'band', ownerId: band.id, eventName: 'beforePrint', event: band.events?.beforePrint, ctx: createEventContext(ctxOptions), state: runtime });
  return target;
};
```

If `target.hidden` or `target.canceled` is true, return an empty band box without pushing it to `currentPage.items`. After pushing a rendered band, run `afterPrint` and `afterRow`.

- [ ] **Step 6: Execute component events in layout**

Modify `packages/core/src/layout-engine/layout-band.ts`:

```ts
import { createEventContext, runEventScript, type EventRuntimeState } from '../event-engine';
```

Add to `LayoutBandOptions`:

```ts
template?: ReportTemplate;
page?: Page;
eventRuntime?: EventRuntimeState;
```

At the top of `layoutComponent`, run `getValue` and `beforePrint`:

```ts
const target = { canceled: false, hidden: false, hasValue: false };
if (options.eventRuntime && options.template) {
  const ctx = createEventContext({
    template: options.template,
    runtime: options.eventRuntime,
    page: options.page,
    band,
    component,
    row: options.context.row,
    rowIndex: options.context.rowIndex,
    dataSourceId: options.context.dataSourceId,
    target,
  });
  runEventScript({ ownerType: 'component', ownerId: component.id, eventName: 'getValue', event: component.events?.getValue, ctx, state: options.eventRuntime });
  runEventScript({ ownerType: 'component', ownerId: component.id, eventName: 'beforePrint', event: component.events?.beforePrint, ctx, state: options.eventRuntime });
}
if (target.hidden || target.canceled) return undefined;
```

Change `layoutComponent` return type to `RenderComponentBox | undefined`, then filter components in `layoutBand`:

```ts
const components = band.components
  .map((component) => layoutComponent(component, band, options))
  .filter((component): component is RenderComponentBox => Boolean(component));
```

For text components, pass `target.hasValue ? target.value : undefined` into `resolveText`. Update `resolveText` signature:

```ts
function resolveText(component: TextComponent, context: RenderContext, rowsByBand: ..., pageRowsByBand: ..., eventValue?: unknown): string
```

At the start of `resolveText`:

```ts
if (eventValue !== undefined) {
  return formatValue(eventValue, component.format);
}
```

Run `afterPrint` after creating the render box:

```ts
runEventScript({ ownerType: 'component', ownerId: component.id, eventName: 'afterPrint', event: component.events?.afterPrint, ctx, state: options.eventRuntime });
```

- [ ] **Step 7: Run render tests and commit**

Run:

```bash
pnpm --filter @report-designer/core test -- __tests__/phase-23-event-engine.test.ts __tests__/phase-23-render-events.test.ts
pnpm --filter @report-designer/core build
```

Expected: all tests pass.

Commit:

```bash
git add packages/core/src packages/core/__tests__/phase-23-event-engine.test.ts packages/core/__tests__/phase-23-render-events.test.ts
git commit -m "feat(events): 接入报表渲染事件"
```

### Task 4: Viewer Render Modes and Output Parity

**Files:**
- Modify: `packages/viewer/src/components/Viewer.tsx`
- Modify: `packages/viewer/src/export/index.ts`
- Test: `packages/viewer/src/__tests__/phase-23-event-render-modes.test.tsx`

- [ ] **Step 1: Write failing viewer tests**

Add `packages/viewer/src/__tests__/phase-23-event-render-modes.test.tsx`:

```tsx
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Viewer } from '../components/Viewer';
import type { ReportTemplate } from '@report-designer/core';

vi.mock('../export', () => ({
  exportToPDF: vi.fn(),
  printReport: vi.fn(),
}));

function template(): ReportTemplate {
  return {
    id: 'report-1',
    name: 'Event Viewer',
    version: '2.0',
    events: {
      beforePreview: { enabled: true, script: 'ctx.bindText("Title", "Preview Title");' },
      beforePrint: { enabled: true, script: 'ctx.bindText("Title", "Print Title");' },
    },
    pages: [{
      id: 'page-1',
      width: 210,
      height: 297,
      margins: { top: 10, right: 10, bottom: 10, left: 10 },
      orientation: 'portrait',
      bands: [{
        id: 'title-band',
        type: 'reportTitle',
        height: 20,
        components: [{
          id: 'title',
          name: 'Title',
          type: 'text',
          x: 0,
          y: 0,
          width: 80,
          height: 10,
          text: 'Original',
          font: { family: 'Arial', size: 12, bold: true, italic: false, underline: false, strikethrough: false, color: '#000000' },
          textAlign: 'left',
          verticalAlign: 'middle',
          border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
          canGrow: true,
          canShrink: false,
        }],
      }],
    }],
    dataSources: [],
    styles: [],
    conditionalFormats: [],
    parameters: [],
  };
}

describe('viewer event render modes', () => {
  it('renders preview with preview mode', () => {
    render(<Viewer template={template()} data={{}} />);

    expect(screen.getByText('Preview Title')).toBeInTheDocument();
    expect(screen.queryByText('Print Title')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run failing viewer tests**

Run:

```bash
pnpm --filter @report-designer/viewer test -- src/__tests__/phase-23-event-render-modes.test.tsx
```

Expected: the test fails until viewer passes `mode: 'preview'` or the core default is active.

- [ ] **Step 3: Wire viewer modes**

Modify `packages/viewer/src/components/Viewer.tsx`:

```tsx
const document = useMemo(
  () => renderReport(template, data, { subreports, mode: 'preview' }),
  [template, data, subreports],
);
```

For the print action:

```tsx
const printDocument = renderReport(template, data, { subreports, mode: 'print' });
printReport(printDocument);
```

For the PDF action:

```tsx
const pdfDocument = renderReport(template, data, { subreports, mode: 'pdf' });
exportToPDF(pdfDocument);
```

Keep `packages/viewer/src/export/index.ts` document-based. If it creates render documents internally, remove that internal rendering and require callers to pass a `RenderDocument`.

- [ ] **Step 4: Add print/PDF interaction checks**

Extend `packages/viewer/src/__tests__/phase-23-event-render-modes.test.tsx` to click viewer buttons according to the existing button labels. Assert mocked `printReport` receives a document whose first text content is `Print Title`, and mocked `exportToPDF` receives a document rendered in PDF mode.

Use this helper in the test:

```ts
function firstTextContent(document: any): string {
  return document.pages[0].items.flatMap((band: any) => band.components).find((component: any) => component.type === 'text')?.content;
}
```

- [ ] **Step 5: Run viewer tests and commit**

Run:

```bash
pnpm --filter @report-designer/viewer test -- src/__tests__/phase-23-event-render-modes.test.tsx src/__tests__/phase-4-viewer-renderdocument.test.tsx src/__tests__/phase-4-print-frame.test.ts
pnpm --filter @report-designer/viewer build
```

Expected: all tests pass.

Commit:

```bash
git add packages/viewer/src
git commit -m "feat(viewer): 区分事件预览和输出模式"
```

### Task 5: Designer Event Editor

**Files:**
- Create: `packages/designer/src/components/events/EventEditorDialog.tsx`
- Create: `packages/designer/src/components/events/event-editor-utils.ts`
- Modify: `packages/designer/src/store/designer-store.ts`
- Modify: `packages/designer/src/components/PropertyEditor.tsx`
- Modify: `packages/designer/src/components/panels/DesignerPropertyPanel.tsx`
- Modify: `packages/designer/src/i18n/messages.ts`
- Test: `packages/designer/src/__tests__/phase-23-event-editor.test.tsx`

- [ ] **Step 1: Write failing designer tests**

Add `packages/designer/src/__tests__/phase-23-event-editor.test.tsx`:

```tsx
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EventEditorDialog } from '../components/events/EventEditorDialog';
import { I18nProvider } from '../i18n/I18nProvider';

describe('event editor dialog', () => {
  it('shows localized report events and saves a script', () => {
    let saved: any;
    render(
      <I18nProvider locale="en">
        <EventEditorDialog
          open
          targetType="report"
          events={{ beforeRender: { enabled: true, script: 'ctx.log("hello");' } }}
          dictionaryItems={[{ key: 'orders.Amount', title: 'orders.Amount' }]}
          componentItems={[{ key: 'Title', title: 'Title' }]}
          onCancel={() => {}}
          onSave={(events) => { saved = events; }}
        />
      </I18nProvider>,
    );

    expect(screen.getByText('Before Render')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Script'), { target: { value: 'ctx.log("saved");' } });
    fireEvent.click(screen.getByText('Apply'));

    expect(saved.beforeRender).toEqual({ enabled: true, script: 'ctx.log("saved");' });
  });

  it('validates blocked script tokens', () => {
    render(
      <I18nProvider locale="en">
        <EventEditorDialog
          open
          targetType="component"
          events={{ beforePrint: { enabled: true, script: 'fetch("/api")' } }}
          dictionaryItems={[]}
          componentItems={[]}
          onCancel={() => {}}
          onSave={() => {}}
        />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByText('Validate'));

    expect(screen.getByText(/Blocked token: fetch/)).toBeInTheDocument();
  });

  it('renders Chinese labels', () => {
    render(
      <I18nProvider locale="zh-CN">
        <EventEditorDialog
          open
          targetType="band"
          events={{}}
          dictionaryItems={[]}
          componentItems={[]}
          onCancel={() => {}}
          onSave={() => {}}
        />
      </I18nProvider>,
    );

    expect(screen.getByText('事件')).toBeInTheDocument();
    expect(screen.getByText('打印前')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run failing designer tests**

Run:

```bash
pnpm --filter @report-designer/designer test -- src/__tests__/phase-23-event-editor.test.tsx
```

Expected: the test fails because the event editor component does not exist.

- [ ] **Step 3: Add designer event utility labels and snippets**

Create `packages/designer/src/components/events/event-editor-utils.ts`:

```ts
import type { BandEventName, ComponentEventName, EventMap, ReportEventName, EventScript } from '@report-designer/core';
import { validateEventScript } from '@report-designer/core';

export type EventTargetType = 'report' | 'band' | 'component';
export type DesignerEventName = ReportEventName | BandEventName | ComponentEventName;

export const eventNamesByTarget: Record<EventTargetType, DesignerEventName[]> = {
  report: ['beforePreview', 'beforePrint', 'beforeRender', 'afterRender', 'beforeData', 'afterData'],
  band: ['beforePrint', 'afterPrint', 'beforeRow', 'afterRow'],
  component: ['getValue', 'beforePrint', 'afterPrint'],
};

export function normalizeEvent(event?: EventScript): EventScript {
  return { enabled: event?.enabled ?? true, script: event?.script ?? '' };
}

export function updateEventMap<TName extends string>(events: EventMap<TName> | undefined, name: TName, event: EventScript): EventMap<TName> {
  const next = { ...(events ?? {}), [name]: event };
  for (const key of Object.keys(next)) {
    const item = next[key as TName];
    if (!item?.enabled && !item.script.trim()) {
      delete next[key as TName];
    }
  }
  return next;
}

export function validateDesignerScript(script: string): string[] {
  return validateEventScript(script).errors;
}

export const helperSnippets = [
  { key: 'ctx.log', title: 'ctx.log(message)', snippet: 'ctx.log("message");' },
  { key: 'ctx.hide', title: 'ctx.hide()', snippet: 'ctx.hide();' },
  { key: 'ctx.setValue', title: 'ctx.setValue(value)', snippet: 'ctx.setValue("");' },
  { key: 'ctx.bindText', title: 'ctx.bindText(name, expression)', snippet: 'ctx.bindText("Text1", "{Data.Field}");' },
  { key: 'ctx.createText', title: 'ctx.createText(options)', snippet: 'ctx.createText({ name: "DynamicText", x: 0, y: 0, width: 30, height: 8, text: "New" });' },
];
```

- [ ] **Step 4: Add localized messages**

Modify `packages/designer/src/i18n/messages.ts` with keys:

```ts
events: {
  title: 'Events',
  script: 'Script',
  validate: 'Validate',
  apply: 'Apply',
  cancel: 'Cancel',
  enabled: 'Enabled',
  helper: 'Helpers',
  fields: 'Fields',
  components: 'Components',
  validationPassed: 'Validation passed',
  beforePreview: 'Before Preview',
  beforePrint: 'Before Print',
  beforeRender: 'Before Render',
  afterRender: 'After Render',
  beforeData: 'Before Data',
  afterData: 'After Data',
  beforeRow: 'Before Row',
  afterRow: 'After Row',
  getValue: 'Get Value',
  afterPrint: 'After Print',
}
```

Add matching Chinese values:

```ts
events: {
  title: '事件',
  script: '脚本',
  validate: '校验',
  apply: '应用',
  cancel: '取消',
  enabled: '启用',
  helper: '辅助',
  fields: '字段',
  components: '组件',
  validationPassed: '校验通过',
  beforePreview: '预览前',
  beforePrint: '打印前',
  beforeRender: '渲染前',
  afterRender: '渲染后',
  beforeData: '取数前',
  afterData: '取数后',
  beforeRow: '行前',
  afterRow: '行后',
  getValue: '取值',
  afterPrint: '打印后',
}
```

- [ ] **Step 5: Implement EventEditorDialog with AntD 6 components**

Create `packages/designer/src/components/events/EventEditorDialog.tsx`:

```tsx
import { Alert, Button, Input, Modal, Switch, Tree } from 'antd';
import type { EventMap, EventScript } from '@report-designer/core';
import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n/useI18n';
import { eventNamesByTarget, helperSnippets, normalizeEvent, updateEventMap, validateDesignerScript, type DesignerEventName, type EventTargetType } from './event-editor-utils';

interface TreeItem {
  key: string;
  title: string;
  children?: TreeItem[];
}

interface EventEditorDialogProps {
  open: boolean;
  targetType: EventTargetType;
  events?: EventMap<string>;
  dictionaryItems: TreeItem[];
  componentItems: TreeItem[];
  onCancel: () => void;
  onSave: (events: EventMap<string>) => void;
}

export function EventEditorDialog(props: EventEditorDialogProps) {
  const { t } = useI18n();
  const names = eventNamesByTarget[props.targetType];
  const [active, setActive] = useState<DesignerEventName>(names[0]);
  const [draft, setDraft] = useState<EventScript>(() => normalizeEvent(props.events?.[names[0]]));
  const [errors, setErrors] = useState<string[]>([]);

  const eventItems = useMemo(() => names.map(name => ({
    key: name,
    title: t(`events.${name}`),
  })), [names, t]);

  const selectEvent = (name: DesignerEventName) => {
    setActive(name);
    setDraft(normalizeEvent(props.events?.[name]));
    setErrors([]);
  };

  const validate = () => {
    const nextErrors = validateDesignerScript(draft.script);
    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const apply = () => {
    if (!validate()) return;
    props.onSave(updateEventMap(props.events, active, draft));
  };

  const insertSnippet = (snippet: string) => {
    setDraft(current => ({ ...current, script: current.script ? `${current.script}\n${snippet}` : snippet }));
  };

  return (
    <Modal
      open={props.open}
      title={t('events.title')}
      width={860}
      onCancel={props.onCancel}
      footer={[
        <Button key="validate" onClick={validate}>{t('events.validate')}</Button>,
        <Button key="cancel" onClick={props.onCancel}>{t('events.cancel')}</Button>,
        <Button key="apply" type="primary" onClick={apply}>{t('events.apply')}</Button>,
      ]}
    >
      <div className="rd-event-editor">
        <Tree selectedKeys={[active]} treeData={eventItems} onSelect={(keys) => selectEvent(String(keys[0]) as DesignerEventName)} />
        <div className="rd-event-editor__script">
          <Switch checked={draft.enabled} onChange={(enabled) => setDraft(current => ({ ...current, enabled }))} />
          <Input.TextArea
            aria-label={t('events.script')}
            value={draft.script}
            rows={14}
            onChange={(event) => setDraft(current => ({ ...current, script: event.target.value }))}
          />
          {errors.length === 0 ? <Alert type="success" message={t('events.validationPassed')} /> : <Alert type="error" message={errors.join('\n')} />}
        </div>
        <div className="rd-event-editor__side">
          <Tree treeData={[{ key: 'fields', title: t('events.fields'), children: props.dictionaryItems }]} onSelect={(keys) => insertSnippet(`{${keys[0]}}`)} />
          <Tree treeData={[{ key: 'components', title: t('events.components'), children: props.componentItems }]} onSelect={(keys) => insertSnippet(String(keys[0]))} />
          <Tree treeData={[{ key: 'helpers', title: t('events.helper'), children: helperSnippets }]} onSelect={(keys) => {
            const found = helperSnippets.find(item => item.key === keys[0]);
            if (found) insertSnippet(found.snippet);
          }} />
        </div>
      </div>
    </Modal>
  );
}
```

Add CSS near the existing designer stylesheet:

```css
.rd-event-editor {
  display: grid;
  grid-template-columns: 180px minmax(320px, 1fr) 220px;
  gap: 12px;
  min-height: 440px;
}

.rd-event-editor__script,
.rd-event-editor__side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}
```

- [ ] **Step 6: Add store actions and property group**

Modify `packages/designer/src/store/designer-store.ts` with actions:

```ts
updateReportEvent: (eventName: ReportEventName, event: EventScript) => void;
updateBandEvent: (pageId: string, bandId: string, eventName: BandEventName, event: EventScript) => void;
updateComponentEvent: (pageId: string, bandId: string, componentId: string, eventName: ComponentEventName, event: EventScript) => void;
```

Each action updates only the corresponding `events` map, removes an event when `enabled === false` and `script.trim() === ''`, and leaves all other template data untouched.

Modify `packages/designer/src/components/PropertyEditor.tsx`:

- Add an `Events` section below the existing behavior/style groups.
- When a component is selected, pass `targetType="component"` and component events to `EventEditorDialog`.
- When a band is selected, pass `targetType="band"` and band events.
- When nothing is selected, pass `targetType="report"` and template events.
- Use existing dictionary and report tree data to populate field and component trees.
- Use AntD 6 `Button`, `Collapse`, `Badge`, and `Modal` APIs without removed props.

- [ ] **Step 7: Run designer tests and commit**

Run:

```bash
pnpm --filter @report-designer/designer test -- src/__tests__/phase-23-event-editor.test.tsx src/__tests__/phase-22-panel-subreport.test.tsx
pnpm --filter @report-designer/designer build
```

Expected: all tests pass.

Commit:

```bash
git add packages/designer/src
git commit -m "feat(designer): 增加事件编辑器"
```

### Task 6: Event Logic Example

**Files:**
- Create: `packages/example/src/templates/event-logic.ts`
- Modify: `packages/example/src/templates/index.ts`
- Test: `packages/example/src/__tests__/sample-paper-defaults.test.ts`

- [ ] **Step 1: Add failing example assertions**

Modify `packages/example/src/__tests__/sample-paper-defaults.test.ts`:

```ts
import { eventLogicTemplate } from '../templates/event-logic';

it('event logic sample contains the required event categories', () => {
  const dataBand = eventLogicTemplate.pages[0].bands.find(band => band.type === 'data');
  const textComponents = eventLogicTemplate.pages[0].bands.flatMap(band => band.components).filter(component => component.type === 'text');

  expect(eventLogicTemplate.events?.beforePreview?.script).toContain('ctx.log');
  expect(dataBand?.events?.beforePrint?.script).toContain('ctx.createText');
  expect(textComponents.some(component => component.events?.getValue)).toBe(true);
  expect(textComponents.some(component => component.events?.beforePrint?.script.includes('ctx.hide'))).toBe(true);
});
```

- [ ] **Step 2: Run failing example test**

Run:

```bash
pnpm --filter @report-designer/example test -- src/__tests__/sample-paper-defaults.test.ts
```

Expected: the test fails because the sample template does not exist.

- [ ] **Step 3: Add the event sample template**

Create `packages/example/src/templates/event-logic.ts` by following the existing sample template style and adding:

- Report `beforePreview` event: `ctx.log("Preview event sample");`
- Data band `beforePrint` event: creates a `VIP` text badge when `ctx.row.IsVip` is true.
- Text `getValue` event: dynamically selects `ctx.row[ctx.parameters.amountField || "Amount"]`.
- Text `beforePrint` event: hides the description text when the row has no `Description`.
- A data source named `orders` with fields `Customer`, `Amount`, `Description`, and `IsVip`.

Use this event script for the amount text:

```js
const field = ctx.parameters.amountField || "Amount";
ctx.setValue(ctx.row[field]);
```

Use this data band script:

```js
if (ctx.row.IsVip) {
  ctx.createText({ name: "VipBadge", x: 150, y: 0, width: 20, height: 8, text: "VIP", font: { bold: true, color: "#d97706" } });
}
```

Use this description script:

```js
if (!ctx.row.Description) {
  ctx.hide();
}
```

Modify `packages/example/src/templates/index.ts`:

```ts
export { eventLogicTemplate } from './event-logic';
```

- [ ] **Step 4: Run example tests and commit**

Run:

```bash
pnpm --filter @report-designer/example test -- src/__tests__/sample-paper-defaults.test.ts src/__tests__/sample-designer-toggle.test.tsx
pnpm --filter @report-designer/example build
```

Expected: all tests pass.

Commit:

```bash
git add packages/example/src
git commit -m "feat(example): 增加事件逻辑示例"
```

### Task 7: Full Verification

**Files:**
- No new files.

- [ ] **Step 1: Run focused core regression tests**

Run:

```bash
pnpm --filter @report-designer/core test -- __tests__/phase-23-event-engine.test.ts __tests__/phase-23-render-events.test.ts __tests__/phase-22-output-parity-containers.test.ts
```

Expected: all tests pass.

- [ ] **Step 2: Run viewer regression tests**

Run:

```bash
pnpm --filter @report-designer/viewer test -- src/__tests__/phase-23-event-render-modes.test.tsx src/__tests__/phase-4-viewer-renderdocument.test.tsx src/__tests__/phase-4-print-frame.test.ts
```

Expected: all tests pass.

- [ ] **Step 3: Run designer regression tests**

Run:

```bash
pnpm --filter @report-designer/designer test -- src/__tests__/phase-23-event-editor.test.tsx src/__tests__/phase-22-panel-subreport.test.tsx
```

Expected: all tests pass.

- [ ] **Step 4: Run example regression tests**

Run:

```bash
pnpm --filter @report-designer/example test -- src/__tests__/sample-paper-defaults.test.ts src/__tests__/sample-designer-toggle.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Build all packages**

Run:

```bash
pnpm build
```

Expected: build passes.

- [ ] **Step 6: Scan for old names and old labels without spelling them in docs**

Run:

```bash
node -e "const fs=require('fs'); const path=require('path'); const terms=['Stimul'+'soft','stimul'+'soft','Stimult'+'soft','stimult'+'soft','V'+'1','V'+'2','v'+'1-','v'+'2-','leg'+'acy']; const roots=['docs','packages']; const skip=new Set(['node_modules','dist']); const hits=[]; const walk=(dir)=>{ for (const entry of fs.readdirSync(dir,{withFileTypes:true})) { const file=path.join(dir,entry.name); if (entry.isDirectory()) { if (!skip.has(entry.name)) walk(file); continue; } const text=fs.readFileSync(file,'utf8'); for (const term of terms) { const index=text.indexOf(term); if (index>=0) hits.push(file+': '+term); } } }; roots.forEach(walk); if (hits.length) { console.error(hits.join('\n')); process.exit(1); }"
```

Expected: no matches.

- [ ] **Step 7: Check worktree**

Run:

```bash
git status --short
```

Expected: only files from this phase are changed before the final commit, or the tree is clean after all task commits.

- [ ] **Step 8: Final phase commit when any verification-only fixes were required**

If Step 1 through Step 7 required additional fixes after Task 6, commit them:

```bash
git add packages docs
git commit -m "fix(events): 完善事件机制验证问题"
```

Expected: the final working tree is clean.

## Self-Review

- Spec coverage: report, band, component events are represented in the model, executed in core, edited in designer, rendered through viewer modes, shown in example templates, and verified by focused tests.
- Output parity: preview, print, and PDF all call `renderReport` with an explicit mode and consume the returned `RenderDocument`.
- Template safety: the source template is cloned before event mutation and covered by tests.
- Script safety: blocked tokens, disabled scripts, script exceptions, and event count limits are covered by tests.
- Localization: all new designer labels are routed through `packages/designer/src/i18n/messages.ts`.
- Scope control: asynchronous scripts, network calls, browser DOM access, and a full code editor dependency are not included in this phase.
