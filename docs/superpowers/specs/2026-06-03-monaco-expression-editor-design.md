# Monaco Expression Editor Design

## Goal

Refactor the expression editor into a Monaco-based report expression workbench. The editor must expose the full set of currently supported report expression functions, provide field and function completion, validate expressions before preview/print surprises, and remain reusable from component properties, band properties, and table cell properties.

## Current State

`packages/designer/src/components/ExpressionEditor.tsx` currently uses `Input.TextArea` and locally hard-codes a small function list. It supports tree insertion for data fields, system variables, a few aggregate/logic/money helpers, and simple brace/parenthesis validation.

The runtime in `packages/core/src/expression-engine/evaluator.ts` already supports more functions than the editor exposes: `COALESCE`, `COUNTDISTINCT`, `SUMIF`, `COUNTIF`, `RUNNINGSUM`, `CEIL`, `FLOOR`, `ABS`, `CONCAT`, `LEN`, `UPPER`, `LOWER`, `CONTAINS`, `STARTSWITH`, `ENDSWITH`, `TRIM`, `SUBSTRING`, `TOSTRING`, `TONUMBER`, `ROWINDEX`, `YEAR`, `MONTH`, `DAY`, `DATEADD`, and `DATEDIFF`.

The project already uses `@monaco-editor/react` for event scripts through `EventScriptEditor`, so the new expression editor should reuse the same dependency and testing style instead of adding another editor package.

## Design Decisions

### Monaco Language

Register a dedicated Monaco language named `report-expression`. Do not use JavaScript mode because report expressions use `{DataSource.Field}` field references and report-specific functions, and JavaScript diagnostics would produce misleading errors.

The language will provide syntax coloring for:

- Field references: `{Orders.Amount}`
- Strings: `"day"`
- Numbers: `123`, `123.45`
- Operators: `+`, `-`, `*`, `/`, `%`, `=`, `!=`, `>`, `<`, `>=`, `<=`
- Logic keywords: `AND`, `OR`, `NOT`
- Function identifiers: `SUM`, `FORMAT`, `DATEADD`

### Function Catalog

Create `packages/designer/src/expression/function-catalog.ts` as the single designer-side function metadata source. This catalog must only include functions supported by `packages/core/src/expression-engine/evaluator.ts` in the first phase.

Each function entry contains:

- `name`
- `category`
- `description` by locale
- `signature`
- `insertText` as a Monaco snippet
- `detail`
- `examples`

Categories:

- `common`: `IF`, `FORMAT`, `SUM`, `TODAY`, `CONCAT`
- `aggregate`: `SUM`, `AVG`, `COUNT`, `COUNTDISTINCT`, `MIN`, `MAX`, `SUMIF`, `COUNTIF`, `RUNNINGSUM`
- `number`: `ROUND`, `CEIL`, `FLOOR`, `ABS`, `TONUMBER`
- `text`: `CONCAT`, `LEN`, `UPPER`, `LOWER`, `TRIM`, `SUBSTRING`, `CONTAINS`, `STARTSWITH`, `ENDSWITH`, `TOSTRING`
- `date`: `NOW`, `TODAY`, `YEAR`, `MONTH`, `DAY`, `DATEADD`, `DATEDIFF`
- `logic`: `IF`, `IIF`, `ISNULL`, `COALESCE`
- `report`: `PAGE`, `TOTALPAGES`, `ROWINDEX`
- `money`: `RMBUPPER`, `MONEYUPPER`, `CNYUPPER`, `CHINESEMONEY`
- `format`: `FORMAT` plus format pattern snippets

### Completion Model

Create `packages/designer/src/components/expression/expression-monaco.ts` to register the language, build completions, and compute diagnostics.

Completion sources:

- Functions from `function-catalog.ts`
- Data fields from `template.dataSources`
- System variables: `{Today}`, `{PageNumber}`, `{TotalPages}`, `{Line}`
- Format snippets: `FORMAT("N2", ${1:value})`, `FORMAT("C", ${1:value})`, `FORMAT("D", ${1:value})`

Typing `{` should surface field references. General completion should include functions and system variables. Function insertions use Monaco snippets so users can tab through arguments.

### UI Layout

Keep the existing modal entry points and `ExpressionEditor` API:

```ts
open: boolean;
value: string;
onChange: (value: string) => void;
onClose: () => void;
```

Replace the textarea with `ExpressionMonacoEditor`.

The modal layout remains three columns:

- Left rail: categories such as expression, data, system, aggregate, number, text, date, logic, report, money, format
- Center: Monaco editor plus diagnostics/result footer
- Right: searchable browser tree for mouse insertion

Right-side tree insertion should call Monaco editor insertion when the editor is mounted. If Monaco is not mounted in a test/mock environment, update the controlled value directly.

### Validation

Create `packages/designer/src/expression/expression-validation.ts`.

Validation checks:

- Matching braces
- Matching parentheses
- Closed string literals
- Parser compatibility through core `tokenize` and `parse`
- Unknown function names by comparing parsed function calls against `function-catalog.ts`
- Missing field references by comparing `{Source.Field}` references against `template.dataSources`

Validation returns structured diagnostics:

```ts
interface ExpressionDiagnostic {
  severity: 'error' | 'warning';
  message: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}
```

Monaco markers and the editor footer both render these diagnostics. Saving is allowed with warnings but not blocked by this dialog unless future callers explicitly ask for blocking behavior.

### Preview Evaluation

Create `packages/designer/src/expression/expression-preview.ts`.

The first implementation will provide a "Test" button that evaluates the expression with a best-effort sample context:

- For each JSON data source, use the first object from `sampleRows` when available.
- If no runtime row data is configured, build a sample row from schema field type defaults: number `0`, boolean `false`, date current ISO date, string empty string.
- Resolve `{Source.Field}` from this sample context.
- Use `evalExpression` from `@report-designer/core`.

The preview result is displayed as a compact success/error alert in the footer. This is only a design-time helper and does not change runtime rendering.

### Internationalization

All new visible labels must be added to `packages/designer/src/i18n/messages.ts` for `zh-CN` and `en-US`.

New labels include category names, function browser headings, "Test", "Result", "No diagnostics", and validation messages.

### Testing

Designer tests must mock `@monaco-editor/react` the same way event editor tests do.

Required test coverage:

- Function catalog exposes date, number, text, aggregate, logic, report, and money functions.
- Monaco editor is configured with `report-expression`.
- Completions include functions, fields, system variables, and snippets.
- Selecting a tree function inserts its snippet.
- Selecting a tree field inserts `{Source.Field}`.
- Unknown functions produce diagnostics.
- Missing fields produce diagnostics.
- The test button evaluates a simple expression.
- Existing callers still open the editor and receive `onChange` values.

## Non-Goals

- Do not add new runtime functions in the first phase.
- Do not replace event script Monaco behavior.
- Do not change the expression grammar in core.
- Do not block saving expressions from the dialog in this phase.

## Acceptance Criteria

- The expression modal uses Monaco instead of `Input.TextArea`.
- The editor uses a dedicated `report-expression` language.
- Common runtime-supported functions are searchable, visible by category, and available in Monaco completion.
- Function snippets include argument placeholders.
- Data fields complete and insert as `{DataSource.Field}`.
- Diagnostics identify unknown functions and missing fields.
- A design-time test button can evaluate simple expressions using sample data.
- `pnpm --filter @report-designer/designer test` passes.
- `pnpm --filter @report-designer/designer build` passes.

## Self-Review

- No placeholder requirements remain.
- The scope is limited to designer expression editor behavior and does not introduce new core runtime functions.
- The UI and completion design aligns with the existing event editor Monaco dependency.
- The function list is explicitly constrained to current runtime support to avoid editor/runtime mismatch.
