# Phase 23 Event System Design

## Goal

Add a report event system that lets users attach synchronous JavaScript snippets to reports, bands, and components. Events must support complex conditional logic, dynamic field binding, component property mutation, conditional hiding, and dynamic component creation while preserving preview, print, and PDF output parity.

## Scope

Phase 23 focuses on print/render-time events. It does not add user-interaction events, network calls, asynchronous scripts, or browser DOM access.

Included:

- Report events: `beforePreview`, `beforePrint`, `beforeRender`, `afterRender`, `beforeData`, `afterData`
- Band events: `beforePrint`, `afterPrint`, `beforeRow`, `afterRow`
- Component events: `getValue`, `beforePrint`, `afterPrint`
- Synchronous JavaScript scripts with a constrained `ctx` API
- Event logging and recoverable script errors
- Designer event editor with Chinese and English labels
- Example report showing dynamic styles, dynamic binding, conditional hiding, and dynamic component creation

Deferred:

- Async events
- Network/file access from scripts
- DOM/browser API access
- Interactive mouse/keyboard events
- A full code editor dependency such as Monaco

## Event Model

Add reusable event script definitions:

```ts
export type ReportEventName =
  | 'beforePreview'
  | 'beforePrint'
  | 'beforeRender'
  | 'afterRender'
  | 'beforeData'
  | 'afterData';

export type BandEventName =
  | 'beforePrint'
  | 'afterPrint'
  | 'beforeRow'
  | 'afterRow';

export type ComponentEventName =
  | 'getValue'
  | 'beforePrint'
  | 'afterPrint';

export interface EventScript {
  enabled: boolean;
  script: string;
}

export type EventMap<TName extends string> = Partial<Record<TName, EventScript>>;
```

Add optional `events` to the template model:

```ts
ReportTemplate.events?: EventMap<ReportEventName>;
Band.events?: EventMap<BandEventName>;
ReportComponent.events?: EventMap<ComponentEventName>;
```

The persisted JSON should omit empty event maps. Normalization should fill missing values as `undefined`, not empty objects, to keep output compact.

## Execution Order

Rendering should use one shared event-aware pipeline so preview, print, and PDF consume the same `RenderDocument`.

```text
renderReport(template, data, options)
-> report.beforePreview or report.beforePrint, depending on mode
-> report.beforeRender
-> report.beforeData
-> data preparation and band plan execution
-> report.afterData
-> each logical band item:
   -> band.beforeRow, for data rows
   -> band.beforePrint
   -> each component:
      -> component.getValue, before expression formatting
      -> component.beforePrint
      -> layout component
      -> component.afterPrint
   -> band.afterPrint
   -> band.afterRow, for data rows
-> report.afterRender
-> RenderDocument returned
```

`beforePreview` runs only when `RenderReportOptions.mode === 'preview'`. `beforePrint` runs for `mode === 'print'` and `mode === 'pdf'`. If no mode is provided, use `preview`.

## Runtime Context

Each script receives only one variable: `ctx`.

```ts
export interface EventContext {
  mode: 'preview' | 'print' | 'pdf';
  report: ReportTemplateFacade;
  page?: PageFacade;
  band?: BandFacade;
  component?: ComponentFacade;
  row?: Record<string, unknown>;
  rowIndex: number;
  dataSourceId?: string;
  data: Record<string, Record<string, unknown>[]>;
  parameters: Record<string, unknown>;
  variables: Record<string, unknown>;
  cancel(): void;
  hide(): void;
  log(message: unknown): void;
  getComponent(idOrName: string): ComponentFacade | undefined;
  setComponentProperty(idOrName: string, path: string, value: unknown): void;
  bindText(idOrName: string, expression: string): void;
  createText(options: DynamicTextOptions): ComponentFacade;
  createImage(options: DynamicImageOptions): ComponentFacade;
  createBarcode(options: DynamicBarcodeOptions): ComponentFacade;
}
```

The facade objects should expose mutable report object copies, not the original template references. Mutations become part of the event working template for the current render only. Designer state must not be mutated by preview or print execution.

Examples:

```js
if (ctx.row.Amount > 10000) {
  ctx.component.font.color = '#ff0000';
  ctx.component.font.bold = true;
}
```

```js
if (!ctx.row.Description) {
  ctx.hide();
}
```

```js
ctx.bindText('DynamicAmount', '{orders.' + ctx.parameters.amountField + '}');
```

```js
if (ctx.row.IsVip) {
  ctx.createText({
    name: 'VipBadge',
    x: 120,
    y: 0,
    width: 30,
    height: 8,
    text: 'VIP',
    font: { bold: true, color: '#d97706' }
  });
}
```

## Mutation Rules

Scripts can modify:

- Component position and size
- Text content and expression
- Font, border, background, alignment, padding
- Image source and fit mode
- Barcode value and format
- Checkbox expression and label
- Visibility for the current render
- Dynamic components appended to the current band or panel

Scripts cannot modify:

- Global browser state
- DOM
- Local storage
- Network state
- Files
- The persisted designer template during preview or print

`ctx.cancel()` cancels the current event target:

- Report event: aborts render and returns a one-page error document with event logs
- Band event: skips the current band instance
- Component event: skips the current component

`ctx.hide()` applies only to band and component events. For components it skips the component. For bands it skips the band instance.

## Script Safety

Phase 23 uses a restricted synchronous runner:

```ts
new Function('ctx', '"use strict";\n' + script)
```

The runner should:

- Pass only `ctx`
- Shadow common globals with `undefined` inside the wrapper where practical
- Reject scripts containing blocked tokens: `window`, `document`, `globalThis`, `Function`, `eval`, `XMLHttpRequest`, `fetch`, `localStorage`, `sessionStorage`, `import`, `require`
- Catch exceptions and add event log entries
- Enforce a maximum script length, initially 8 KB
- Enforce a maximum event count per render, initially 10,000

JavaScript cannot be reliably time-limited on the main thread without workers. Phase 23 therefore protects common risks with token blocking and event count limits, and documents that infinite loops are invalid script authoring. A later phase can move script execution into a worker.

## Core Architecture

Create a focused event engine in core:

```text
packages/core/src/event-engine/
  types.ts
  event-runner.ts
  event-context.ts
  event-template.ts
  event-log.ts
  index.ts
```

Responsibilities:

- `types.ts`: event names, script maps, log types, runtime options
- `event-runner.ts`: compile, validate, execute scripts
- `event-context.ts`: build facades and helper APIs
- `event-template.ts`: clone working templates and apply event mutations
- `event-log.ts`: collect warnings and errors

`renderReport` should return event logs in `RenderDocument`:

```ts
export interface RenderDocument {
  pages: RenderPage[];
  eventLogs?: EventLogEntry[];
}
```

Do not let event logs change layout unless render is aborted.

## Designer UX

Add an Events group to the right property panel.

Selection behavior:

- No component or band selected: show report events
- Band selected: show band events
- Component selected: show component events

The event editor opens as a modal:

```text
Left: event list
Center: script textarea
Right: insertable fields, components, parameters, helper API snippets
Footer: Validate, Apply, Cancel
Bottom area: validation result and recent event errors
```

The first implementation should use AntD 6 `Modal`, `Tabs`, `Button`, `Input.TextArea`, `Tree`, and `Alert`. It should not add Monaco or another large editor.

The field tree reuses the existing dictionary tree shape. The component tree reuses report tree naming and icons.

## Localization

Add Chinese and English labels for:

- Property group: Events / 事件
- Event names
- Validate / Apply / Cancel
- Script editor labels
- Error messages
- Helper snippets

All new visible designer text must come from the existing i18n message system.

## Output Parity

Preview, print, and PDF must use the same event-mutated `RenderDocument`.

The viewer accepts:

```ts
<Viewer template={template} data={data} renderMode="preview" />
```

Print and PDF should render with `mode: 'print'` and `mode: 'pdf'` respectively before output. If print/PDF start from an existing preview document, they must either reuse the same mode-independent document or explicitly render with the correct mode and document the difference.

For Phase 23, scripts should be authored so `beforePrint` and `beforePreview` can differ, but component layout events should behave identically across preview, print, and PDF.

## Tests

Core tests:

- Report `beforeRender` mutates a component property
- Report `beforePreview` runs only in preview mode
- Report `beforePrint` runs in print and PDF modes
- Component `getValue` overrides text content before formatting
- Component `beforePrint` changes style and can hide a component
- Band `beforePrint` can hide a band instance
- Dynamic text creation appears in `RenderDocument`
- Dynamic field binding resolves against current row
- Script errors are captured in `eventLogs`
- Blocked tokens are rejected
- Dynamic changes do not mutate the original template

Designer tests:

- Event group appears for report, band, and component selections
- Event editor opens and saves scripts
- Event editor validates scripts and shows blocked token errors
- Chinese and English labels render correctly
- Component tree and dictionary snippets insert into the script textarea

Viewer tests:

- Preview mode passes `mode: 'preview'`
- Print/PDF paths pass `mode: 'print'` and `mode: 'pdf'`
- Event-mutated `RenderDocument` remains identical between DOM preview and print when using the same mode

Example tests:

- Event Logic sample exists
- The sample has a component style event, a hidden component event, a dynamic binding event, and a dynamic component creation event

## Acceptance Criteria

- Users can attach JS snippets to report, band, and component events.
- Users can change component properties during render.
- Users can hide bands/components during render.
- Users can dynamically create text, image, and barcode components.
- Users can dynamically bind text expressions to fields.
- Event errors are visible and do not crash the designer.
- Preview, print, and PDF consume event-mutated render documents consistently.
- The feature is covered by focused tests in core, designer, viewer, and example packages.
- No old external product names or old version labels appear in code, docs, tests, or UI text.
