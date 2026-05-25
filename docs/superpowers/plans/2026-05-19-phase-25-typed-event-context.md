# Phase 25 Typed Event Context IntelliSense Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate template-aware Monaco types and completions so event scripts can author `ctx.row`, `ctx.data`, and `ctx.parameters` with field-level IntelliSense.

**Architecture:** Core owns deterministic `.d.ts` generation from `DataSource[]` and `ReportParameter[]`. Designer resolves the active event data scope from report, band, or selected component context, passes it through `EventEditorDialog` and `EventScriptEditor`, and adds data-aware completions without changing runtime event execution.

**Tech Stack:** TypeScript, React 19, Ant Design 6, Monaco Editor, Vitest/jsdom, existing event editor and template model.

---

## File Structure

Create these files:

- `packages/core/src/event-engine/event-editor-data-contract.ts` - typed data context generator.
- `packages/core/__tests__/phase-25-event-editor-data-contract.test.ts` - core generator tests.

Modify these files:

- `packages/core/src/event-engine/index.ts` - export the data contract.
- `packages/designer/src/components/events/event-script-monaco.ts` - append generated data DTS and add data-aware completions.
- `packages/designer/src/components/events/EventScriptEditor.tsx` - accept and forward typed data context.
- `packages/designer/src/components/events/EventEditorDialog.tsx` - accept typed data context and pass it through.
- `packages/designer/src/components/events/event-editor-utils.ts` - add scope resolver and completion metadata helpers.
- `packages/designer/src/components/PropertyEditor.tsx` - pass component-containing DataBand scope.
- `packages/designer/src/components/properties/BandPropertyGrid.tsx` - pass selected band scope.
- `packages/designer/src/components/panels/DesignerPropertyPanel.tsx` - pass report-level scope.
- `packages/designer/src/__tests__/phase-24-monaco-event-editor.test.tsx` - update Monaco tests for typed data context.
- `packages/designer/src/__tests__/phase-25-typed-event-context.test.tsx` - designer scope and dialog integration tests.

## Implementation Tasks

### Task 1: Core Data DTS Generator

**Files:**
- Create: `packages/core/src/event-engine/event-editor-data-contract.ts`
- Modify: `packages/core/src/event-engine/index.ts`
- Test: `packages/core/__tests__/phase-25-event-editor-data-contract.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/core/__tests__/phase-25-event-editor-data-contract.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  buildEventEditorDataDts,
  toEventEditorPropertyName,
  toEventEditorTypeName,
} from '../src/event-engine';

describe('phase 25 event editor data contract', () => {
  it('generates typed data rows and narrows ctx.row for the active data source', () => {
    const dts = buildEventEditorDataDts({
      activeDataSourceId: 'employees',
      dataSources: [{
        id: 'employees',
        name: 'employees',
        type: 'json',
        fields: [
          { name: 'name', type: 'string' },
          { name: 'salary', type: 'number' },
          { name: 'active', type: 'boolean' },
          { name: 'hireDate', type: 'date' },
          { name: 'note', type: 'string', nullable: true },
        ],
      }],
      parameters: [],
    });

    expect(dts).toContain('interface EventDataSource_employees');
    expect(dts).toContain('name: string;');
    expect(dts).toContain('salary: number;');
    expect(dts).toContain('active: boolean;');
    expect(dts).toContain('hireDate: string;');
    expect(dts).toContain('note: string | null;');
    expect(dts).toContain('employees: EventDataSource_employees[];');
    expect(dts).toContain('row?: EventDataSource_employees;');
  });

  it('supports invalid identifier names through quoted properties', () => {
    const dts = buildEventEditorDataDts({
      activeDataSourceId: 'order-lines',
      dataSources: [{
        id: 'order-lines',
        name: 'order-lines',
        type: 'json',
        fields: [{ name: 'unit-price', type: 'number' }],
      }],
      parameters: [],
    });

    expect(dts).toContain('interface EventDataSource_order_lines');
    expect(dts).toContain('"unit-price": number;');
    expect(dts).toContain('"order-lines": EventDataSource_order_lines[];');
    expect(toEventEditorTypeName('order-lines')).toBe('EventDataSource_order_lines');
    expect(toEventEditorPropertyName('unit-price')).toBe('"unit-price"');
  });

  it('generates parameter types and keeps row generic without an active data source', () => {
    const dts = buildEventEditorDataDts({
      dataSources: [],
      parameters: [
        { id: 'amountField', name: 'amountField', type: 'string' },
        { id: 'showDetails', name: 'showDetails', type: 'boolean' },
      ],
    });

    expect(dts).toContain('amountField?: string;');
    expect(dts).toContain('showDetails?: boolean;');
    expect(dts).toContain('row?: Record<string, unknown>;');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @report-designer/core test -- __tests__/phase-25-event-editor-data-contract.test.ts
```

Expected: FAIL because the data contract module is missing.

- [ ] **Step 3: Implement the generator**

Create `packages/core/src/event-engine/event-editor-data-contract.ts`:

```ts
import type { DataField, DataSource, ReportParameter } from '../template-model/types';

export interface EventEditorDataContractInput {
  dataSources: Pick<DataSource, 'id' | 'name' | 'fields' | 'schema'>[];
  parameters: Pick<ReportParameter, 'id' | 'name' | 'type'>[];
  activeDataSourceId?: string;
}

export function buildEventEditorDataDts(input: EventEditorDataContractInput): string {
  const dataSources = input.dataSources ?? [];
  const rowType = input.activeDataSourceId
    ? toEventEditorTypeName(input.activeDataSourceId)
    : 'Record<string, unknown>';

  const sourceInterfaces = dataSources.map(source => {
    const fields = getFields(source).map(field => `  ${toEventEditorPropertyName(field.name)}: ${toTsType(field)};`);
    return `interface ${toEventEditorTypeName(source.id)} {\n${fields.join('\n') || '  [key: string]: unknown;'}\n}`;
  });

  const dataRows = dataSources.map(source => (
    `  ${toEventEditorPropertyName(source.id)}: ${toEventEditorTypeName(source.id)}[];`
  ));

  const parameters = (input.parameters ?? []).map(parameter => (
    `  ${toEventEditorPropertyName(parameter.name || parameter.id)}?: ${mapJsonType(parameter.type)};`
  ));

  return [
    ...sourceInterfaces,
    `interface EventEditorDataRows {\n${dataRows.join('\n') || '  [key: string]: unknown;'}\n}`,
    `interface EventEditorParameters {\n${parameters.join('\n') || '  [key: string]: unknown;'}\n}`,
    'interface EventEditorVariables {\n  rowIndex?: number;\n  row?: Record<string, unknown>;\n  [key: string]: unknown;\n}',
    `interface EventEditorTypedContext {\n  data: EventEditorDataRows;\n  parameters?: EventEditorParameters;\n  variables?: EventEditorVariables;\n  row?: ${rowType};\n}`,
  ].join('\n\n');
}

export function toEventEditorTypeName(id: string): string {
  const safe = id.replace(/[^A-Za-z0-9_]/g, '_').replace(/^(\d)/, '_$1');
  return `EventDataSource_${safe || 'DataSource'}`;
}

export function toEventEditorPropertyName(name: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : JSON.stringify(name);
}

function getFields(source: Pick<DataSource, 'fields' | 'schema'>): DataField[] {
  return [...(source.schema ?? source.fields ?? [])];
}

function toTsType(field: Pick<DataField, 'type' | 'nullable'>): string {
  const base = mapJsonType(field.type);
  return field.nullable ? `${base} | null` : base;
}

function mapJsonType(type: string | undefined): string {
  if (type === 'number') return 'number';
  if (type === 'boolean') return 'boolean';
  if (type === 'date') return 'string';
  if (type === 'string') return 'string';
  if (type === 'null') return 'null';
  return 'unknown';
}
```

Modify `packages/core/src/event-engine/index.ts`:

```ts
export * from './event-data-contract';
```

Use the actual file name `event-editor-data-contract`:

```ts
export * from './event-editor-data-contract';
```

- [ ] **Step 4: Run tests and build**

Run:

```bash
pnpm --filter @report-designer/core test -- __tests__/phase-25-event-editor-data-contract.test.ts __tests__/phase-24-event-editor-contract.test.ts
pnpm --filter @report-designer/core build
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add packages/core/src/event-engine/event-editor-data-contract.ts packages/core/src/event-engine/index.ts packages/core/__tests__/phase-25-event-editor-data-contract.test.ts
git commit -m "feat(events): 增加事件数据类型提示契约"
```

### Task 2: Monaco Extra Lib and Data Completions

**Files:**
- Modify: `packages/designer/src/components/events/event-script-monaco.ts`
- Modify: `packages/designer/src/components/events/EventScriptEditor.tsx`
- Test: `packages/designer/src/__tests__/phase-24-monaco-event-editor.test.tsx`

- [ ] **Step 1: Add failing tests for typed extra lib and completions**

Extend `packages/designer/src/__tests__/phase-24-monaco-event-editor.test.tsx`:

```tsx
it('appends typed data declarations to the event editor extra lib', () => {
  const extraLib = buildEventEditorExtraLib('component', 'getValue', {
    activeDataSourceId: 'employees',
    dataSources: [{
      id: 'employees',
      name: 'employees',
      type: 'json',
      fields: [{ name: 'salary', type: 'number' }],
    }],
    parameters: [{ id: 'amountField', name: 'amountField', type: 'string' }],
  });

  expect(extraLib).toContain('declare const ctx: ComponentGetValueEventContext & EventEditorTypedContext');
  expect(extraLib).toContain('salary: number;');
  expect(extraLib).toContain('amountField?: string;');
});

it('builds row, data, and parameter completions from typed context', () => {
  const items = buildEventScriptCompletions({
    dataContext: {
      activeDataSourceId: 'employees',
      dataSources: [{
        id: 'employees',
        name: 'employees',
        type: 'json',
        fields: [
          { name: 'salary', type: 'number' },
          { name: 'unit-price', type: 'number' },
        ],
      }],
      parameters: [{ id: 'amountField', name: 'amountField', type: 'string' }],
    },
  }, monaco);

  expect(items).toEqual(expect.arrayContaining([
    expect.objectContaining({ label: 'ctx.row.salary', insertText: 'ctx.row?.salary' }),
    expect.objectContaining({ label: 'ctx.row["unit-price"]', insertText: 'ctx.row?.["unit-price"]' }),
    expect.objectContaining({ label: 'ctx.data.employees', insertText: 'ctx.data.employees' }),
    expect.objectContaining({ label: 'ctx.parameters.amountField', insertText: 'ctx.parameters?.amountField' }),
  ]));
});
```

- [ ] **Step 2: Run designer test to verify it fails**

Run:

```bash
pnpm --filter @report-designer/designer test -- src/__tests__/phase-24-monaco-event-editor.test.tsx
```

Expected: FAIL because dataContext is not supported yet.

- [ ] **Step 3: Implement data-aware extra lib and completions**

Modify `packages/designer/src/components/events/event-script-monaco.ts`:

```ts
import {
  EVENT_SCRIPT_DTS,
  buildEventEditorDataDts,
  eventEditorHelpers,
  getEventEditorContextType,
  toEventEditorPropertyName,
  type EventEditorDataContractInput,
  type EventEditorTargetType,
} from '@report-designer/core';

export interface EventCompletionInput {
  helperItems?: EventCompletionTextItem[];
  dictionaryItems?: EventCompletionTreeItem[];
  componentItems?: EventCompletionTreeItem[];
  exampleItems?: EventCompletionTextItem[];
  dataContext?: EventEditorDataContractInput;
}

export function buildEventEditorExtraLib(
  targetType: EventEditorTargetType,
  eventName: string,
  dataContext?: EventEditorDataContractInput,
): string {
  const contextType = getEventEditorContextType(targetType, eventName);
  const typedContext = dataContext ? `${contextType} & EventEditorTypedContext` : contextType;
  const ctxDeclaration = `declare const ctx: ${typedContext};`;
  const ctxDeclarationPattern = /declare\s+const\s+ctx\s*:\s*[^;]+;/;
  const base = ctxDeclarationPattern.test(EVENT_SCRIPT_DTS)
    ? EVENT_SCRIPT_DTS.replace(ctxDeclarationPattern, ctxDeclaration)
    : `${EVENT_SCRIPT_DTS.trimEnd()}\n\n${ctxDeclaration}\n`;
  return dataContext ? `${base}\n\n${buildEventEditorDataDts(dataContext)}` : base;
}

function buildDataContextCompletions(dataContext: EventEditorDataContractInput | undefined, constants: Required<MonacoCompletionConstants>): EventCompletionItem[] {
  if (!dataContext) return [];
  const activeSource = dataContext.dataSources.find(source => source.id === dataContext.activeDataSourceId);
  const rowCompletions = (activeSource?.schema ?? activeSource?.fields ?? []).map(field => {
    const valid = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(field.name);
    return {
      label: valid ? `ctx.row.${field.name}` : `ctx.row[${JSON.stringify(field.name)}]`,
      detail: `${activeSource?.id}.${field.name}`,
      kind: constants.CompletionItemKind.Field,
      insertText: valid ? `ctx.row?.${field.name}` : `ctx.row?.[${JSON.stringify(field.name)}]`,
    };
  });
  const dataCompletions = dataContext.dataSources.map(source => ({
    label: `ctx.data.${source.id}`,
    detail: source.name || source.id,
    kind: constants.CompletionItemKind.Variable,
    insertText: /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(source.id)
      ? `ctx.data.${source.id}`
      : `ctx.data[${JSON.stringify(source.id)}]`,
  }));
  const parameterCompletions = dataContext.parameters.map(parameter => ({
    label: `ctx.parameters.${parameter.name || parameter.id}`,
    detail: parameter.type,
    kind: constants.CompletionItemKind.Variable,
    insertText: /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(parameter.name || parameter.id)
      ? `ctx.parameters?.${parameter.name || parameter.id}`
      : `ctx.parameters?.[${JSON.stringify(parameter.name || parameter.id)}]`,
  }));
  return [...rowCompletions, ...dataCompletions, ...parameterCompletions];
}
```

Add the data completions into `buildEventScriptCompletions` after helpers and before expression fields.

- [ ] **Step 4: Pass dataContext through EventScriptEditor**

Modify `packages/designer/src/components/events/EventScriptEditor.tsx`:

```ts
import type { EventEditorDataContractInput, EventEditorTargetType } from '@report-designer/core';
```

Add prop:

```ts
dataContext?: EventEditorDataContractInput;
```

Include it in `completionInputRef` and `buildEventEditorExtraLib(targetType, eventName, dataContext)`.

- [ ] **Step 5: Run tests and build**

Run:

```bash
pnpm --filter @report-designer/designer test -- src/__tests__/phase-24-monaco-event-editor.test.tsx
pnpm --filter @report-designer/designer build
```

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add packages/designer/src/components/events/event-script-monaco.ts packages/designer/src/components/events/EventScriptEditor.tsx packages/designer/src/__tests__/phase-24-monaco-event-editor.test.tsx
git commit -m "feat(designer): 增加事件数据上下文补全"
```

### Task 3: Designer Scope Resolution

**Files:**
- Modify: `packages/designer/src/components/events/event-editor-utils.ts`
- Modify: `packages/designer/src/components/events/EventEditorDialog.tsx`
- Modify: `packages/designer/src/components/PropertyEditor.tsx`
- Modify: `packages/designer/src/components/properties/BandPropertyGrid.tsx`
- Modify: `packages/designer/src/components/panels/DesignerPropertyPanel.tsx`
- Test: `packages/designer/src/__tests__/phase-25-typed-event-context.test.tsx`

- [ ] **Step 1: Write failing scope tests**

Create `packages/designer/src/__tests__/phase-25-typed-event-context.test.tsx`:

```tsx
/* @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { buildEventEditorDataContext } from '../components/events/event-editor-utils';

const template = {
  dataSources: [{
    id: 'employees',
    name: 'employees',
    type: 'json' as const,
    fields: [{ name: 'salary', type: 'number' as const }],
  }],
  parameters: [{ id: 'amountField', name: 'amountField', type: 'string' as const }],
  pages: [{
    id: 'page1',
    width: 210,
    height: 297,
    margins: { top: 8, right: 8, bottom: 8, left: 8 },
    orientation: 'portrait' as const,
    bands: [{
      id: 'data-band',
      type: 'data' as const,
      height: 10,
      dataBand: { dataSourceId: 'employees' },
      components: [{ id: 'text-1', type: 'text' as const, x: 0, y: 0, width: 10, height: 5 }],
    }],
  }],
  styles: [],
  conditionalFormats: [],
  version: '2.0' as const,
  id: 'r',
  name: 'Report',
};

describe('phase 25 typed event context scope', () => {
  it('uses selected band data source for band events', () => {
    expect(buildEventEditorDataContext(template, { targetType: 'band', bandId: 'data-band' })).toMatchObject({
      activeDataSourceId: 'employees',
    });
  });

  it('uses containing band data source for component events', () => {
    expect(buildEventEditorDataContext(template, { targetType: 'component', componentId: 'text-1' })).toMatchObject({
      activeDataSourceId: 'employees',
    });
  });

  it('does not narrow row for report events', () => {
    expect(buildEventEditorDataContext(template, { targetType: 'report' })?.activeDataSourceId).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @report-designer/designer test -- src/__tests__/phase-25-typed-event-context.test.tsx
```

Expected: FAIL because `buildEventEditorDataContext` is missing.

- [ ] **Step 3: Implement scope resolver**

Modify `packages/designer/src/components/events/event-editor-utils.ts`:

```ts
import type { ReportTemplate } from '@report-designer/core';
import type { EventEditorDataContractInput } from '@report-designer/core';

export interface EventEditorScope {
  targetType: EventTargetType;
  bandId?: string;
  componentId?: string;
}

export function buildEventEditorDataContext(
  template: Pick<ReportTemplate, 'dataSources' | 'parameters' | 'pages'>,
  scope: EventEditorScope,
): EventEditorDataContractInput {
  return {
    dataSources: template.dataSources,
    parameters: template.parameters ?? [],
    activeDataSourceId: resolveActiveDataSourceId(template, scope),
  };
}

function resolveActiveDataSourceId(template: Pick<ReportTemplate, 'pages'>, scope: EventEditorScope): string | undefined {
  if (scope.targetType === 'report') return undefined;
  for (const page of template.pages) {
    for (const band of page.bands) {
      if (scope.targetType === 'band' && band.id === scope.bandId) {
        return band.dataBand?.dataSourceId ?? band.dataSource;
      }
      if (scope.targetType === 'component' && band.components.some(component => component.id === scope.componentId)) {
        return band.dataBand?.dataSourceId ?? band.dataSource;
      }
    }
  }
  return undefined;
}
```

- [ ] **Step 4: Pass dataContext to dialogs and editor**

Modify `EventEditorDialog` props:

```ts
dataContext?: EventEditorDataContractInput;
```

Pass it into `EventScriptEditor`.

At call sites:

- `PropertyEditor.tsx`: `dataContext={buildEventEditorDataContext(template, { targetType: 'component', componentId: component.id })}`
- `BandPropertyGrid.tsx`: `dataContext={buildEventEditorDataContext(template, { targetType: 'band', bandId: band.id })}`
- `DesignerPropertyPanel.tsx`: `dataContext={buildEventEditorDataContext(template, { targetType: 'report' })}`

- [ ] **Step 5: Run tests and build**

Run:

```bash
pnpm --filter @report-designer/designer test -- src/__tests__/phase-25-typed-event-context.test.tsx src/__tests__/phase-24-monaco-event-editor.test.tsx src/__tests__/phase-23-event-editor.test.tsx
pnpm --filter @report-designer/designer build
```

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

```bash
git add packages/designer/src/components/events/event-editor-utils.ts packages/designer/src/components/events/EventEditorDialog.tsx packages/designer/src/components/PropertyEditor.tsx packages/designer/src/components/properties/BandPropertyGrid.tsx packages/designer/src/components/panels/DesignerPropertyPanel.tsx packages/designer/src/__tests__/phase-25-typed-event-context.test.tsx
git commit -m "feat(designer): 传递事件编辑器数据作用域"
```

### Task 4: Verification and Browser Smoke

**Files:**
- No source files expected unless verification exposes defects.

- [ ] **Step 1: Run focused tests**

```bash
pnpm --filter @report-designer/core test -- __tests__/phase-25-event-editor-data-contract.test.ts __tests__/phase-24-event-editor-contract.test.ts
pnpm --filter @report-designer/designer test -- src/__tests__/phase-25-typed-event-context.test.tsx src/__tests__/phase-24-monaco-event-editor.test.tsx src/__tests__/phase-23-event-editor.test.tsx
pnpm --filter @report-designer/example test -- src/__tests__/sample-designer-toggle.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run builds**

```bash
pnpm --filter @report-designer/core build
pnpm --filter @report-designer/designer build
pnpm build
```

Expected: PASS. Restore `packages/example/dist/index.html` if only Vite asset hash changes.

- [ ] **Step 3: Run forbidden terminology scan**

```powershell
$pattern = @($blockedProductName, $blockedProductName.ToLowerInvariant(), $blockedTypoName, $blockedTypoName.ToLowerInvariant(), 'version-one-marker', 'version-two-marker', 'version-one-prefix', 'version-two-prefix', 'old-marker') -join '|'
rg -n $pattern docs packages --glob "!**/node_modules/**" --glob "!**/dist/**"
```

Expected: no matches.

- [ ] **Step 4: Browser smoke**

Start the example app:

```bash
pnpm --filter @report-designer/example dev -- --host 127.0.0.1 --port 5181
```

Use Playwright or the browser to verify:

- Open `http://127.0.0.1:5181/`.
- Open designer.
- Select a component inside a DataBand.
- Open event editor.
- Type `ctx.row.` and confirm row fields appear in Monaco suggestions.
- Type `ctx.parameters.` in the event logic sample and confirm `amountField` appears.

- [ ] **Step 5: Commit fixes if needed**

If verification required source fixes:

```bash
git add <changed-files>
git commit -m "fix(events): 修正 typed ctx 验证问题"
```

If no source files changed, do not create a verification-only commit.

## Plan Self-Review

- Spec coverage: data DTS generation, active data source scoping, Monaco extra lib, completions, invalid identifiers, tests, and browser smoke are covered.
- Placeholder scan: no placeholders remain.
- Type consistency: `EventEditorDataContractInput` is defined in core and reused by designer props and completions.
- Scope: runtime event execution is deliberately unchanged.

