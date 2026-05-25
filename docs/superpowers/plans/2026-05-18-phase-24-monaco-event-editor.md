# Phase 24 Monaco Event Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain event script text area with a lazy-loaded Monaco editor that provides typed `ctx` IntelliSense, localized snippets, and validation feedback without changing runtime event behavior.

**Architecture:** The core package owns the editor-facing event script contract so the type hints stay aligned with runtime helpers. The designer package owns the Monaco wrapper, completion registration, dialog layout, localization, and jsdom mocks. Existing event script storage, validation, preview, print, and PDF execution remain unchanged.

**Tech Stack:** TypeScript, React 19, Ant Design 6, Monaco Editor, @monaco-editor/react, Vitest/jsdom, existing core event engine.

---

## File Structure

Create these files:

- `packages/core/src/event-engine/event-editor-contract.ts` - public editor contract for the event script environment, helper descriptors, and context type mapping.
- `packages/core/__tests__/phase-24-event-editor-contract.test.ts` - contract coverage tests.
- `packages/designer/src/components/events/EventScriptEditor.tsx` - lazy Monaco React wrapper.
- `packages/designer/src/components/events/event-script-monaco.ts` - Monaco configuration, extra libraries, diagnostics, and completion helpers.
- `packages/designer/src/__tests__/phase-24-monaco-event-editor.test.tsx` - dialog integration tests with a mocked Monaco component.

Modify these files:

- `packages/core/src/event-engine/index.ts` - export the editor contract.
- `packages/core/src/index.ts` - expose the contract from the public package entry.
- `packages/designer/package.json` - add Monaco dependencies.
- `pnpm-lock.yaml` - update lockfile after installing dependencies.
- `packages/designer/src/components/events/EventEditorDialog.tsx` - replace `Input.TextArea` with `EventScriptEditor`, wire diagnostics, and improve helper search.
- `packages/designer/src/components/events/event-editor-utils.ts` - use core helper descriptors and localized snippet metadata.
- `packages/designer/src/i18n/messages.ts` - add Chinese and English editor/helper messages.
- `packages/designer/src/__tests__/phase-23-event-editor.test.tsx` - update existing tests for Monaco wrapper behavior.

## Implementation Tasks

### Task 1: Core Event Editor Contract

**Files:**
- Create: `packages/core/src/event-engine/event-editor-contract.ts`
- Modify: `packages/core/src/event-engine/index.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/__tests__/phase-24-event-editor-contract.test.ts`

- [ ] **Step 1: Write failing contract tests**

Create `packages/core/__tests__/phase-24-event-editor-contract.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  EVENT_SCRIPT_DTS,
  eventEditorContextTypeByEvent,
  eventEditorHelpers,
  getEventEditorContextType,
} from '../src/event-engine';

describe('phase 24 event editor contract', () => {
  it('declares the ctx script environment and all runtime helpers', () => {
    expect(EVENT_SCRIPT_DTS).toContain('declare const ctx: EventContext');
    expect(EVENT_SCRIPT_DTS).toContain('interface EventContext');
    expect(EVENT_SCRIPT_DTS).toContain('log: EventLogCollector');
    expect(EVENT_SCRIPT_DTS).toContain('setValue?: (value: unknown) => void');
    expect(EVENT_SCRIPT_DTS).toContain('createText?: (options: DynamicTextOptions) => TextComponent');
    expect(EVENT_SCRIPT_DTS).toContain('createImage?: (options: DynamicImageOptions) => ImageComponent');
    expect(EVENT_SCRIPT_DTS).toContain('createBarcode?: (options: DynamicBarcodeOptions) => BarcodeComponent');
  });

  it('provides narrow context names for target and event combinations', () => {
    expect(getEventEditorContextType('report', 'beforePreview')).toBe('ReportEventContext');
    expect(getEventEditorContextType('band', 'beforeRow')).toBe('BandEventContext');
    expect(getEventEditorContextType('component', 'beforePrint')).toBe('ComponentEventContext');
    expect(getEventEditorContextType('component', 'getValue')).toBe('ComponentGetValueEventContext');
    expect(eventEditorContextTypeByEvent.component.getValue).toBe('ComponentGetValueEventContext');
  });

  it('keeps helper descriptors aligned with declarations', () => {
    const helperIds = eventEditorHelpers.map(helper => helper.id);
    expect(helperIds).toEqual([
      'ctx.log.info',
      'ctx.log.warning',
      'ctx.log.error',
      'ctx.hide',
      'ctx.cancel',
      'ctx.setValue',
      'ctx.bindText',
      'ctx.getComponent',
      'ctx.setComponentProperty',
      'ctx.createText',
      'ctx.createImage',
      'ctx.createBarcode',
    ]);

    for (const helper of eventEditorHelpers) {
      const methodName = helper.id.split('.').at(-1);
      expect(EVENT_SCRIPT_DTS).toContain(`${methodName}`);
      expect(helper.snippet).toContain('ctx.');
      expect(helper.descriptionKey).toMatch(/^events\.helper\./);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @report-designer/core test -- __tests__/phase-24-event-editor-contract.test.ts
```

Expected: FAIL because `event-editor-contract.ts` and its exports do not exist yet.

- [ ] **Step 3: Add the editor contract implementation**

Create `packages/core/src/event-engine/event-editor-contract.ts`:

```ts
import type { BandEventName, ComponentEventName, EventOwnerType, ReportEventName } from './types';

export type EventEditorTargetType = EventOwnerType;
export type EventEditorContextType =
  | 'EventContext'
  | 'ReportEventContext'
  | 'BandEventContext'
  | 'ComponentEventContext'
  | 'ComponentGetValueEventContext';

export interface EventEditorHelperDescriptor {
  id: string;
  snippet: string;
  descriptionKey: string;
  group: 'log' | 'flow' | 'value' | 'mutation' | 'dynamic';
}

export const EVENT_SCRIPT_DTS = `
declare const ctx: EventContext;

interface EventTargetState {
  ownerType: 'report' | 'band' | 'component';
  ownerId: string;
  eventName: string;
}

interface EventLogCollector {
  readonly entries: EventLogEntry[];
  info(message: string): void;
  warning(message: string): void;
  error(message: string): void;
}

interface EventLogEntry extends EventTargetState {
  level: 'info' | 'warning' | 'error';
  message: string;
}

interface ReportComponent {
  id: string;
  name?: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible?: boolean;
  [key: string]: unknown;
}

interface TextComponent extends ReportComponent {
  type: 'text';
  text: string;
  font?: {
    family?: string;
    size?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    color?: string;
  };
}

interface ImageComponent extends ReportComponent {
  type: 'image';
  src: string;
  fitMode?: 'contain' | 'cover' | 'stretch';
}

interface BarcodeComponent extends ReportComponent {
  type: 'barcode';
  value: string;
  format?: string;
  showText?: boolean;
}

interface DynamicTextOptions {
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  font?: Partial<NonNullable<TextComponent['font']>>;
}

interface DynamicImageOptions {
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  fitMode?: ImageComponent['fitMode'];
}

interface DynamicBarcodeOptions {
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  format?: string;
  showText?: boolean;
}

interface EventContext {
  mode: 'preview' | 'print' | 'pdf';
  target: EventTargetState;
  row?: Record<string, unknown>;
  rowIndex?: number;
  dataSourceId?: string;
  data: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  state: Record<string, unknown>;
  log: EventLogCollector;
  value?: unknown;
  cancel?: () => void;
  hide?: () => void;
  setValue?: (value: unknown) => void;
  getComponent?: (idOrName: string) => ReportComponent | undefined;
  setComponentProperty?: (idOrName: string, path: string, value: unknown) => void;
  bindText?: (idOrName: string, expression: string) => void;
  createText?: (options: DynamicTextOptions) => TextComponent;
  createImage?: (options: DynamicImageOptions) => ImageComponent;
  createBarcode?: (options: DynamicBarcodeOptions) => BarcodeComponent;
}

interface ReportEventContext extends EventContext {
  target: EventTargetState & { ownerType: 'report' };
}

interface BandEventContext extends EventContext {
  target: EventTargetState & { ownerType: 'band' };
  row: Record<string, unknown>;
  rowIndex: number;
  dataSourceId: string;
}

interface ComponentEventContext extends EventContext {
  target: EventTargetState & { ownerType: 'component' };
  component: ReportComponent;
}

interface ComponentGetValueEventContext extends ComponentEventContext {
  setValue: (value: unknown) => void;
}
`;

export const eventEditorContextTypeByEvent = {
  report: {
    beforePreview: 'ReportEventContext',
    beforePrint: 'ReportEventContext',
    beforeRender: 'ReportEventContext',
    afterRender: 'ReportEventContext',
    beforeData: 'ReportEventContext',
    afterData: 'ReportEventContext',
  },
  band: {
    beforePrint: 'BandEventContext',
    afterPrint: 'BandEventContext',
    beforeRow: 'BandEventContext',
    afterRow: 'BandEventContext',
  },
  component: {
    getValue: 'ComponentGetValueEventContext',
    beforePrint: 'ComponentEventContext',
    afterPrint: 'ComponentEventContext',
  },
} satisfies {
  report: Record<ReportEventName, EventEditorContextType>;
  band: Record<BandEventName, EventEditorContextType>;
  component: Record<ComponentEventName, EventEditorContextType>;
};

export const eventEditorHelpers: EventEditorHelperDescriptor[] = [
  { id: 'ctx.log.info', snippet: 'ctx.log.info("message");', descriptionKey: 'events.helper.logInfo', group: 'log' },
  { id: 'ctx.log.warning', snippet: 'ctx.log.warning("message");', descriptionKey: 'events.helper.logWarning', group: 'log' },
  { id: 'ctx.log.error', snippet: 'ctx.log.error("message");', descriptionKey: 'events.helper.logError', group: 'log' },
  { id: 'ctx.hide', snippet: 'ctx.hide?.();', descriptionKey: 'events.helper.hide', group: 'flow' },
  { id: 'ctx.cancel', snippet: 'ctx.cancel?.();', descriptionKey: 'events.helper.cancel', group: 'flow' },
  { id: 'ctx.setValue', snippet: 'ctx.setValue?.("");', descriptionKey: 'events.helper.setValue', group: 'value' },
  { id: 'ctx.bindText', snippet: 'ctx.bindText?.("Text1", "{Data.Field}");', descriptionKey: 'events.helper.bindText', group: 'mutation' },
  { id: 'ctx.getComponent', snippet: 'const component = ctx.getComponent?.("Text1");', descriptionKey: 'events.helper.getComponent', group: 'mutation' },
  { id: 'ctx.setComponentProperty', snippet: 'ctx.setComponentProperty?.("Text1", "font.bold", true);', descriptionKey: 'events.helper.setComponentProperty', group: 'mutation' },
  { id: 'ctx.createText', snippet: 'ctx.createText?.({ name: "DynamicText", x: 0, y: 0, width: 30, height: 8, text: "New" });', descriptionKey: 'events.helper.createText', group: 'dynamic' },
  { id: 'ctx.createImage', snippet: 'ctx.createImage?.({ name: "DynamicImage", x: 0, y: 0, width: 30, height: 20, src: "" });', descriptionKey: 'events.helper.createImage', group: 'dynamic' },
  { id: 'ctx.createBarcode', snippet: 'ctx.createBarcode?.({ name: "DynamicBarcode", x: 0, y: 0, width: 40, height: 12, value: "123456" });', descriptionKey: 'events.helper.createBarcode', group: 'dynamic' },
];

export function getEventEditorContextType(
  targetType: EventEditorTargetType,
  eventName: string,
): EventEditorContextType {
  if (targetType === 'report') return eventEditorContextTypeByEvent.report[eventName as ReportEventName] ?? 'ReportEventContext';
  if (targetType === 'band') return eventEditorContextTypeByEvent.band[eventName as BandEventName] ?? 'BandEventContext';
  return eventEditorContextTypeByEvent.component[eventName as ComponentEventName] ?? 'ComponentEventContext';
}
```

Modify `packages/core/src/event-engine/index.ts`:

```ts
export * from './event-context';
export * from './event-editor-contract';
export * from './event-log';
export * from './event-runner';
export * from './event-template';
export * from './types';
```

Confirm `packages/core/src/index.ts` already exports `event-engine`; if not, add:

```ts
export * from './event-engine';
```

- [ ] **Step 4: Run contract tests and build**

Run:

```bash
pnpm --filter @report-designer/core test -- __tests__/phase-24-event-editor-contract.test.ts
pnpm --filter @report-designer/core build
```

Expected: both commands PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add packages/core/src/event-engine/event-editor-contract.ts packages/core/src/event-engine/index.ts packages/core/src/index.ts packages/core/__tests__/phase-24-event-editor-contract.test.ts
git commit -m "feat(events): 增加事件编辑器类型契约"
```

### Task 2: Monaco Dependency and Editor Utilities

**Files:**
- Modify: `packages/designer/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `packages/designer/src/components/events/event-script-monaco.ts`
- Test: `packages/designer/src/__tests__/phase-24-monaco-event-editor.test.tsx`

- [ ] **Step 1: Install Monaco packages**

Run:

```bash
pnpm --filter @report-designer/designer add @monaco-editor/react monaco-editor
```

Expected: `packages/designer/package.json` includes `@monaco-editor/react` and `monaco-editor`, and `pnpm-lock.yaml` is updated.

- [ ] **Step 2: Write failing utility tests**

Create `packages/designer/src/__tests__/phase-24-monaco-event-editor.test.tsx` with the utility-only tests first:

```tsx
/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import {
  buildEventEditorExtraLib,
  buildEventScriptCompletions,
  getEventScriptModelPath,
  splitDiagnostics,
} from '../components/events/event-script-monaco';

describe('phase 24 Monaco event editor utilities', () => {
  it('builds a virtual model path for every target and event', () => {
    expect(getEventScriptModelPath('component', 'getValue')).toBe('inmemory://event-scripts/component/getValue.js');
  });

  it('injects the narrow ctx type into the extra lib without changing user script text', () => {
    const lib = buildEventEditorExtraLib('component', 'getValue');
    expect(lib).toContain('declare const ctx: ComponentGetValueEventContext');
    expect(lib).toContain('interface ComponentGetValueEventContext');
  });

  it('builds helper, field, component, and example completions', () => {
    const completions = buildEventScriptCompletions({
      helperItems: [{ label: 'ctx.hide', insertText: 'ctx.hide?.();', detail: 'Hide current component' }],
      dictionaryItems: [{ key: 'Orders.Amount', title: 'Orders.Amount' }],
      componentItems: [{ key: 'TitleText', title: 'TitleText' }],
      exampleItems: [{ label: 'Set value', insertText: 'ctx.setValue?.(ctx.row.Amount);', detail: 'Override value' }],
    }, {
      CompletionItemKind: { Function: 1, Field: 2, Variable: 3, Snippet: 4 },
      CompletionItemInsertTextRule: { InsertAsSnippet: 4 },
    });

    expect(completions.map(item => item.label)).toEqual(['ctx.hide', 'Orders.Amount', 'TitleText', 'Set value']);
    expect(completions.find(item => item.label === 'Orders.Amount')?.insertText).toBe('{Orders.Amount}');
  });

  it('separates syntax errors from non-blocking warnings', () => {
    const result = splitDiagnostics([
      { message: 'Unexpected token', severity: 8, startLineNumber: 2 },
      { message: 'Unknown property', severity: 4, startLineNumber: 4 },
    ]);

    expect(result.blocking).toEqual(['Line 2: Unexpected token']);
    expect(result.warnings).toEqual(['Line 4: Unknown property']);
  });
});
```

- [ ] **Step 3: Run the utility tests to verify they fail**

Run:

```bash
pnpm --filter @report-designer/designer test -- src/__tests__/phase-24-monaco-event-editor.test.tsx
```

Expected: FAIL because `event-script-monaco.ts` does not exist.

- [ ] **Step 4: Implement Monaco utility module**

Create `packages/designer/src/components/events/event-script-monaco.ts`:

```ts
import { EVENT_SCRIPT_DTS, eventEditorHelpers, getEventEditorContextType } from '@report-designer/core';
import type { EventTreeItem } from './EventEditorDialog';
import type { DesignerEventName, EventTargetType } from './event-editor-utils';

export interface EventCompletionInput {
  helperItems: Array<{ label: string; insertText: string; detail: string }>;
  dictionaryItems: EventTreeItem[];
  componentItems: EventTreeItem[];
  exampleItems: Array<{ label: string; insertText: string; detail: string }>;
}

export interface MonacoCompletionConstants {
  CompletionItemKind: Record<string, number>;
  CompletionItemInsertTextRule: Record<string, number>;
}

export interface MonacoDiagnostic {
  message: string;
  severity: number;
  startLineNumber: number;
}

export function getEventScriptModelPath(targetType: EventTargetType, eventName: DesignerEventName): string {
  return `inmemory://event-scripts/${targetType}/${eventName}.js`;
}

export function buildEventEditorExtraLib(targetType: EventTargetType, eventName: DesignerEventName): string {
  const contextType = getEventEditorContextType(targetType, eventName);
  return `${EVENT_SCRIPT_DTS}\ndeclare const ctx: ${contextType};`;
}

function flattenTree(items: EventTreeItem[] = []): EventTreeItem[] {
  return items.flatMap(item => [item, ...flattenTree(item.children ?? [])]);
}

export function buildEventScriptCompletions(input: EventCompletionInput, monaco: MonacoCompletionConstants) {
  const helperCompletions = input.helperItems.map(item => ({
    label: item.label,
    kind: monaco.CompletionItemKind.Function,
    detail: item.detail,
    insertText: item.insertText,
    insertTextRules: monaco.CompletionItemInsertTextRule.InsertAsSnippet,
  }));

  const fieldCompletions = flattenTree(input.dictionaryItems)
    .filter(item => item.key.includes('.'))
    .map(item => ({
      label: item.title,
      kind: monaco.CompletionItemKind.Field,
      detail: item.key,
      insertText: `{${item.key}}`,
    }));

  const componentCompletions = flattenTree(input.componentItems)
    .filter(item => item.key)
    .map(item => ({
      label: item.title,
      kind: monaco.CompletionItemKind.Variable,
      detail: item.key,
      insertText: item.key,
    }));

  const exampleCompletions = input.exampleItems.map(item => ({
    label: item.label,
    kind: monaco.CompletionItemKind.Snippet,
    detail: item.detail,
    insertText: item.insertText,
    insertTextRules: monaco.CompletionItemInsertTextRule.InsertAsSnippet,
  }));

  return [...helperCompletions, ...fieldCompletions, ...componentCompletions, ...exampleCompletions];
}

export function splitDiagnostics(markers: MonacoDiagnostic[]) {
  const format = (marker: MonacoDiagnostic) => `Line ${marker.startLineNumber}: ${marker.message}`;
  return {
    blocking: markers.filter(marker => marker.severity >= 8).map(format),
    warnings: markers.filter(marker => marker.severity < 8).map(format),
  };
}

export function getDefaultHelperCompletionItems(t: (key: string) => string) {
  return eventEditorHelpers.map(helper => ({
    label: helper.id,
    insertText: helper.snippet,
    detail: t(helper.descriptionKey),
  }));
}
```

- [ ] **Step 5: Run utility tests**

Run:

```bash
pnpm --filter @report-designer/designer test -- src/__tests__/phase-24-monaco-event-editor.test.tsx
```

Expected: PASS for the utility tests.

- [ ] **Step 6: Commit Task 2**

```bash
git add packages/designer/package.json pnpm-lock.yaml packages/designer/src/components/events/event-script-monaco.ts packages/designer/src/__tests__/phase-24-monaco-event-editor.test.tsx
git commit -m "feat(designer): 增加事件脚本编辑器工具"
```

### Task 3: Lazy Monaco React Wrapper

**Files:**
- Create: `packages/designer/src/components/events/EventScriptEditor.tsx`
- Modify: `packages/designer/src/__tests__/phase-24-monaco-event-editor.test.tsx`

- [ ] **Step 1: Add a mocked Monaco integration test**

Append to `packages/designer/src/__tests__/phase-24-monaco-event-editor.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { EventScriptEditor } from '../components/events/EventScriptEditor';

vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange, loading, 'aria-label': ariaLabel }: {
    value: string;
    onChange: (value?: string) => void;
    loading: React.ReactNode;
    'aria-label': string;
  }) => (
    <div>
      <div data-testid="monaco-loading">{loading}</div>
      <textarea aria-label={ariaLabel} value={value} onChange={event => onChange(event.target.value)} />
    </div>
  ),
}));

describe('phase 24 EventScriptEditor', () => {
  it('renders the lazy Monaco editor and forwards script changes', () => {
    let value = '';
    render(
      <EventScriptEditor
        ariaLabel="Script"
        value="ctx.log.info('hello');"
        targetType="report"
        eventName="beforePreview"
        helperItems={[]}
        dictionaryItems={[]}
        componentItems={[]}
        exampleItems={[]}
        loadingText="Loading editor"
        onChange={(next) => { value = next; }}
        onDiagnostics={() => undefined}
      />,
    );

    expect(screen.getByTestId('monaco-loading')).toHaveTextContent('Loading editor');
    fireEvent.change(screen.getByLabelText('Script'), { target: { value: 'ctx.hide?.();' } });
    expect(value).toBe('ctx.hide?.();');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @report-designer/designer test -- src/__tests__/phase-24-monaco-event-editor.test.tsx
```

Expected: FAIL because `EventScriptEditor.tsx` does not exist.

- [ ] **Step 3: Implement EventScriptEditor**

Create `packages/designer/src/components/events/EventScriptEditor.tsx`:

```tsx
import React, { useMemo } from 'react';
import MonacoEditor from '@monaco-editor/react';
import {
  buildEventEditorExtraLib,
  buildEventScriptCompletions,
  getEventScriptModelPath,
  splitDiagnostics,
  type MonacoDiagnostic,
} from './event-script-monaco';
import type { EventTreeItem } from './EventEditorDialog';
import type { DesignerEventName, EventTargetType } from './event-editor-utils';

interface EventScriptEditorProps {
  ariaLabel: string;
  value: string;
  targetType: EventTargetType;
  eventName: DesignerEventName;
  helperItems: Array<{ label: string; insertText: string; detail: string }>;
  dictionaryItems: EventTreeItem[];
  componentItems: EventTreeItem[];
  exampleItems: Array<{ label: string; insertText: string; detail: string }>;
  loadingText: string;
  onChange: (value: string) => void;
  onDiagnostics: (diagnostics: { blocking: string[]; warnings: string[] }) => void;
}

export const EventScriptEditor: React.FC<EventScriptEditorProps> = ({
  ariaLabel,
  componentItems,
  dictionaryItems,
  eventName,
  exampleItems,
  helperItems,
  loadingText,
  onChange,
  onDiagnostics,
  targetType,
  value,
}) => {
  const path = useMemo(() => getEventScriptModelPath(targetType, eventName), [eventName, targetType]);

  return (
    <MonacoEditor
      aria-label={ariaLabel}
      height="420px"
      language="javascript"
      path={path}
      theme="vs"
      value={value}
      loading={<span>{loadingText}</span>}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
        tabSize: 2,
      }}
      beforeMount={(monaco) => {
        const extraLib = buildEventEditorExtraLib(targetType, eventName);
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
          allowNonTsExtensions: true,
          checkJs: true,
          noEmit: true,
          target: monaco.languages.typescript.ScriptTarget.ES2020,
        });
        monaco.languages.typescript.javascriptDefaults.addExtraLib(extraLib, 'inmemory://event-scripts/event-api.d.ts');
      }}
      onMount={(_editor, monaco) => {
        monaco.languages.registerCompletionItemProvider('javascript', {
          provideCompletionItems: () => ({
            suggestions: buildEventScriptCompletions({
              componentItems,
              dictionaryItems,
              exampleItems,
              helperItems,
            }, monaco.languages),
          }),
        });
      }}
      onChange={(nextValue) => onChange(nextValue ?? '')}
      onValidate={(markers) => onDiagnostics(splitDiagnostics(markers as MonacoDiagnostic[]))}
    />
  );
};
```

- [ ] **Step 4: Run the wrapper tests**

Run:

```bash
pnpm --filter @report-designer/designer test -- src/__tests__/phase-24-monaco-event-editor.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add packages/designer/src/components/events/EventScriptEditor.tsx packages/designer/src/__tests__/phase-24-monaco-event-editor.test.tsx
git commit -m "feat(designer): 集成 Monaco 事件脚本编辑器"
```

### Task 4: Event Dialog Integration and Localization

**Files:**
- Modify: `packages/designer/src/components/events/EventEditorDialog.tsx`
- Modify: `packages/designer/src/components/events/event-editor-utils.ts`
- Modify: `packages/designer/src/i18n/messages.ts`
- Modify: `packages/designer/src/__tests__/phase-23-event-editor.test.tsx`
- Modify: `packages/designer/src/__tests__/phase-24-monaco-event-editor.test.tsx`

- [ ] **Step 1: Add failing dialog integration tests**

Update `packages/designer/src/__tests__/phase-23-event-editor.test.tsx` so it no longer expects a plain text area implementation. Keep using `getByLabelText('Script')` because the wrapper still exposes that label:

```tsx
expect(screen.getByText('Context helpers')).toBeInTheDocument();
fireEvent.change(screen.getByLabelText('Script'), { target: { value: 'ctx.log.info("saved");' } });
fireEvent.click(screen.getByText('Apply'));
```

Append a new test to `packages/designer/src/__tests__/phase-24-monaco-event-editor.test.tsx`:

```tsx
import { DesignerI18nProvider } from '../i18n';
import { EventEditorDialog } from '../components/events/EventEditorDialog';

describe('phase 24 EventEditorDialog Monaco integration', () => {
  it('shows localized helpers and inserts snippets from the helper tree', () => {
    render(
      <DesignerI18nProvider locale="en-US">
        <EventEditorDialog
          open
          targetType="component"
          events={{ getValue: { enabled: true, script: '' } }}
          dictionaryItems={[{ key: 'Orders.Amount', title: 'Orders.Amount' }]}
          componentItems={[{ key: 'TitleText', title: 'TitleText' }]}
          onCancel={() => undefined}
          onSave={() => undefined}
        />
      </DesignerI18nProvider>,
    );

    expect(screen.getByText('Context helpers')).toBeInTheDocument();
    expect(screen.getByText('Set event value')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Set event value'));
    expect(screen.getByLabelText('Script')).toHaveValue('ctx.setValue?.("");');
  });

  it('renders helper labels in Chinese', () => {
    render(
      <DesignerI18nProvider locale="zh-CN">
        <EventEditorDialog
          open
          targetType="component"
          events={{ getValue: { enabled: true, script: '' } }}
          onCancel={() => undefined}
          onSave={() => undefined}
        />
      </DesignerI18nProvider>,
    );

    expect(screen.getByText('上下文辅助')).toBeInTheDocument();
    expect(screen.getByText('设置事件值')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the dialog tests to verify they fail**

Run:

```bash
pnpm --filter @report-designer/designer test -- src/__tests__/phase-23-event-editor.test.tsx src/__tests__/phase-24-monaco-event-editor.test.tsx
```

Expected: FAIL because the dialog still renders old helper labels and the text area.

- [ ] **Step 3: Update helper utilities**

Modify `packages/designer/src/components/events/event-editor-utils.ts`:

```ts
import type { BandEventName, ComponentEventName, EventMap, EventScript, ReportEventName } from '@report-designer/core';
import { eventEditorHelpers, validateEventScript } from '@report-designer/core';

export type EventTargetType = 'report' | 'band' | 'component';
export type DesignerEventName = ReportEventName | BandEventName | ComponentEventName;

export const eventNamesByTarget: Record<EventTargetType, DesignerEventName[]> = {
  report: ['beforePreview', 'beforePrint', 'beforeRender', 'afterRender', 'beforeData', 'afterData'],
  band: ['beforeRow', 'beforePrint', 'afterPrint', 'afterRow'],
  component: ['getValue', 'beforePrint', 'afterPrint'],
};

export function normalizeEvent(event?: EventScript): EventScript {
  return { enabled: event?.enabled ?? true, script: event?.script ?? '' };
}

export function chooseInitialEvent(targetType: EventTargetType, events?: EventMap<string>): DesignerEventName {
  const names = eventNamesByTarget[targetType];
  return names.find(name => Boolean(events?.[name]?.script)) ?? names[0];
}

export function updateEventMap<TName extends string>(
  events: EventMap<TName> | undefined,
  name: TName,
  event: EventScript,
): EventMap<TName> {
  const next: EventMap<TName> = { ...(events ?? {}), [name]: event };
  for (const key of Object.keys(next) as TName[]) {
    const item = next[key];
    if (item && !item.enabled && !item.script.trim()) delete next[key];
  }
  return next;
}

export function validateDesignerScript(script: string): string[] {
  return validateEventScript(script).errors;
}

export function getLocalizedHelperItems(t: (key: string) => string) {
  return eventEditorHelpers.map(helper => ({
    key: helper.id,
    title: t(helper.descriptionKey),
    label: helper.id,
    insertText: helper.snippet,
    detail: t(helper.descriptionKey),
  }));
}

export function getEventExampleItems(targetType: EventTargetType, eventName: DesignerEventName, t: (key: string) => string) {
  const common = [
    { key: 'example.hide', title: t('events.example.hide'), label: t('events.example.hide'), insertText: 'ctx.hide?.();', detail: t('events.example.hide') },
    { key: 'example.createText', title: t('events.example.createText'), label: t('events.example.createText'), insertText: 'ctx.createText?.({ name: "DynamicText", x: 0, y: 0, width: 30, height: 8, text: "New" });', detail: t('events.example.createText') },
  ];
  if (targetType === 'component' && eventName === 'getValue') {
    return [
      { key: 'example.setValue', title: t('events.example.setValue'), label: t('events.example.setValue'), insertText: 'ctx.setValue?.("");', detail: t('events.example.setValue') },
      ...common,
    ];
  }
  return common;
}
```

- [ ] **Step 4: Update localized message keys**

Add these keys to `DesignerMessageKey` in `packages/designer/src/i18n/messages.ts`:

```ts
  | 'events.editorLoading'
  | 'events.contextHelpers'
  | 'events.examples'
  | 'events.typeWarnings'
  | 'events.helper.logInfo'
  | 'events.helper.logWarning'
  | 'events.helper.logError'
  | 'events.helper.hide'
  | 'events.helper.cancel'
  | 'events.helper.setValue'
  | 'events.helper.bindText'
  | 'events.helper.getComponent'
  | 'events.helper.setComponentProperty'
  | 'events.helper.createText'
  | 'events.helper.createImage'
  | 'events.helper.createBarcode'
  | 'events.example.hide'
  | 'events.example.createText'
  | 'events.example.setValue'
```

Add Chinese messages:

```ts
    'events.editorLoading': '正在加载脚本编辑器...',
    'events.contextHelpers': '上下文辅助',
    'events.examples': '示例',
    'events.typeWarnings': '类型提示',
    'events.helper.logInfo': '记录普通日志',
    'events.helper.logWarning': '记录警告日志',
    'events.helper.logError': '记录错误日志',
    'events.helper.hide': '隐藏当前对象',
    'events.helper.cancel': '取消当前事件输出',
    'events.helper.setValue': '设置事件值',
    'events.helper.bindText': '动态绑定文本表达式',
    'events.helper.getComponent': '按名称或 ID 获取组件',
    'events.helper.setComponentProperty': '动态设置组件属性',
    'events.helper.createText': '动态创建文本组件',
    'events.helper.createImage': '动态创建图片组件',
    'events.helper.createBarcode': '动态创建条码组件',
    'events.example.hide': '隐藏当前组件',
    'events.example.createText': '创建动态文本',
    'events.example.setValue': '设置事件值',
```

Add English messages:

```ts
    'events.editorLoading': 'Loading script editor...',
    'events.contextHelpers': 'Context helpers',
    'events.examples': 'Examples',
    'events.typeWarnings': 'Type hints',
    'events.helper.logInfo': 'Write an info log entry',
    'events.helper.logWarning': 'Write a warning log entry',
    'events.helper.logError': 'Write an error log entry',
    'events.helper.hide': 'Hide the current object',
    'events.helper.cancel': 'Cancel the current event output',
    'events.helper.setValue': 'Set event value',
    'events.helper.bindText': 'Bind a text expression dynamically',
    'events.helper.getComponent': 'Get a component by name or ID',
    'events.helper.setComponentProperty': 'Set a component property dynamically',
    'events.helper.createText': 'Create a dynamic text component',
    'events.helper.createImage': 'Create a dynamic image component',
    'events.helper.createBarcode': 'Create a dynamic barcode component',
    'events.example.hide': 'Hide current component',
    'events.example.createText': 'Create dynamic text',
    'events.example.setValue': 'Set event value',
```

- [ ] **Step 5: Integrate EventScriptEditor in the dialog**

Modify `packages/designer/src/components/events/EventEditorDialog.tsx`:

```tsx
import React, { useMemo, useState } from 'react';
import { Alert, Button, Input, Modal, Space, Switch, Tree, Typography } from 'antd';
import type { EventMap, EventScript } from '@report-designer/core';
import { useDesignerI18n } from '../../i18n';
import { EventScriptEditor } from './EventScriptEditor';
import {
  chooseInitialEvent,
  eventNamesByTarget,
  getEventExampleItems,
  getLocalizedHelperItems,
  normalizeEvent,
  updateEventMap,
  validateDesignerScript,
  type DesignerEventName,
  type EventTargetType,
} from './event-editor-utils';
```

Inside the component, add:

```tsx
  const [monacoDiagnostics, setMonacoDiagnostics] = useState<{ blocking: string[]; warnings: string[] }>({ blocking: [], warnings: [] });
  const helperItems = useMemo(() => getLocalizedHelperItems(t), [t]);
  const exampleItems = useMemo(() => getEventExampleItems(targetType, active, t), [active, t, targetType]);
```

Replace the current text area with:

```tsx
          <EventScriptEditor
            ariaLabel={t('events.script')}
            value={activeDraft.script}
            targetType={targetType}
            eventName={active}
            helperItems={helperItems}
            dictionaryItems={dictionaryItems}
            componentItems={componentItems}
            exampleItems={exampleItems}
            loadingText={t('events.editorLoading')}
            onChange={(script) => updateDraft({ ...activeDraft, script })}
            onDiagnostics={setMonacoDiagnostics}
          />
```

Update `sideTree`:

```tsx
  const sideTree = [
    { key: 'fields', title: t('events.fields'), children: dictionaryItems },
    { key: 'components', title: t('events.components'), children: componentItems },
    { key: 'helpers', title: t('events.contextHelpers'), children: helperItems.map(item => ({ key: item.key, title: item.title })) },
    { key: 'examples', title: t('events.examples'), children: exampleItems.map(item => ({ key: item.key, title: item.title })) },
  ];
```

Update selection:

```tsx
              const helper = helperItems.find(item => item.key === key);
              const example = exampleItems.find(item => item.key === key);
              if (helper) appendSnippet(helper.insertText);
              else if (example) appendSnippet(example.insertText);
              else if (key && !['fields', 'components', 'helpers', 'examples'].includes(key)) {
                appendSnippet(key.includes('.') ? `{${key}}` : key);
              }
```

Update validation to include Monaco blocking diagnostics:

```tsx
  const validate = () => {
    const nextErrors = [...validateDesignerScript(activeDraft.script), ...monacoDiagnostics.blocking];
    setErrors(nextErrors);
    return nextErrors.length === 0;
  };
```

Render type warnings below the error/success alert:

```tsx
          {monacoDiagnostics.warnings.length > 0 ? (
            <Alert type="warning" title={`${t('events.typeWarnings')}: ${monacoDiagnostics.warnings.join('\n')}`} />
          ) : null}
```

- [ ] **Step 6: Run dialog tests**

Run:

```bash
pnpm --filter @report-designer/designer test -- src/__tests__/phase-23-event-editor.test.tsx src/__tests__/phase-24-monaco-event-editor.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit Task 4**

```bash
git add packages/designer/src/components/events/EventEditorDialog.tsx packages/designer/src/components/events/event-editor-utils.ts packages/designer/src/i18n/messages.ts packages/designer/src/__tests__/phase-23-event-editor.test.tsx packages/designer/src/__tests__/phase-24-monaco-event-editor.test.tsx
git commit -m "feat(designer): 完善事件编辑器提示与本地化"
```

### Task 5: Verification, Build, and Browser Smoke Check

**Files:**
- No source files expected unless verification exposes a bug.

- [ ] **Step 1: Run focused tests**

Run:

```bash
pnpm --filter @report-designer/core test -- __tests__/phase-24-event-editor-contract.test.ts __tests__/phase-23-event-engine.test.ts __tests__/phase-23-render-events.test.ts
pnpm --filter @report-designer/designer test -- src/__tests__/phase-23-event-editor.test.tsx src/__tests__/phase-24-monaco-event-editor.test.tsx src/__tests__/phase-10-page-properties.test.tsx
pnpm --filter @report-designer/viewer test -- src/__tests__/phase-23-event-render-modes.test.tsx
pnpm --filter @report-designer/example test -- src/__tests__/sample-designer-toggle.test.tsx
```

Expected: all commands PASS.

- [ ] **Step 2: Run package builds**

Run:

```bash
pnpm --filter @report-designer/core build
pnpm --filter @report-designer/designer build
pnpm --filter @report-designer/example build
pnpm build
```

Expected: all commands PASS. If `packages/example/dist/index.html` changes only because Vite rewrote an asset hash, restore that generated file before committing.

- [ ] **Step 3: Run forbidden terminology scan**

Run:

```powershell
$pattern = @($blockedProductName, $blockedProductName.ToLowerInvariant(), $blockedTypoName, $blockedTypoName.ToLowerInvariant(), 'version-one-marker', 'version-two-marker', 'version-one-prefix', 'version-two-prefix', 'old-marker') -join '|'
rg -n $pattern docs packages --glob "!**/node_modules/**" --glob "!**/dist/**"
```

Expected: exit code 1 with no matches.

- [ ] **Step 4: Browser smoke check**

Start the example app on a free port:

```bash
pnpm --filter @report-designer/example dev -- --host 127.0.0.1 --port 5180
```

Open:

```text
http://127.0.0.1:5180/
```

Expected manual smoke result:

- The example page opens.
- Opening a sample designer still works.
- Opening an event editor shows Monaco instead of a plain text area.
- Typing `ctx.` shows helper completions.
- Applying a script stores the script and does not break preview.

- [ ] **Step 5: Commit verification fixes if any**

If no source files changed, do not create a verification-only commit. If small fixes were required, commit them:

```bash
git add <changed-files>
git commit -m "fix(events): 修正 Monaco 事件编辑器验证问题"
```

## Plan Self-Review

- Spec coverage: covered lazy Monaco loading, typed `ctx`, target/event narrowing, helper snippets, dictionary/component insertion, validation, localization, extensibility, and safety.
- Placeholder scan: no placeholder tasks remain; every task has concrete files, code, commands, and expected results.
- Type consistency: target type names match existing `EventTargetType`; event names reuse `DesignerEventName`; core context mapping uses current report, band, and component event names.
- Risk: the exact Monaco package types may require small signature adjustments in `EventScriptEditor.tsx`. Those changes should stay inside Task 3 and must not alter event runtime behavior.
