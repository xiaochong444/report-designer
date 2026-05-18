# Phase 22 Output Parity and Container Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make designer preview, browser print, and PDF export produce the same visible result for common non-chart components, complete the first usable version of panel and subreport rendering, and add DataBand sorting configuration that sorts bound JSON table rows before band rendering. This phase keeps data sources JSON-only and excludes chart printing.

**Architecture:** Treat `RenderDocument` as the single output contract. The layout engine resolves report components into immutable render boxes once; DOM preview, print HTML, and PDF export consume that same render contract. Components that contain other components, such as panel and subreport, must resolve children through the same layout path with relative offsets.

**Tech Stack:** TypeScript, React, Ant Design 6, Vitest, Testing Library, Playwright, pdf-lib, JsBarcode for browser barcode preview, existing pnpm workspace.

---

## Current Gaps

- PDF export still has weaker drawing support than DOM preview and browser print for image, rich text, barcode, checkbox, line, shape, panel, and subreport.
- Panel can be represented as a component but does not yet behave as a real container across every output target.
- Subreport is currently a visible component shell, not a JSON-only template registry render flow.
- DataBand sorting exists in the core model but is not exposed as a clear designer workflow, and the sorting contract needs stronger stability and UI regression coverage.
- Left-side component, report tree, and data source panels do not yet share a consistent search box style and behavior.
- Some common components can be displayed in preview but do not yet have explicit cross-output parity tests.
- There is no single acceptance example that exercises text, formatting, images, rich text, barcode, checkbox, line, shape, panel, and subreport together.

## Out of Scope

- Chart rendering and chart printing.
- Remote data sources or remote subreport fetching.
- Full browser-grade HTML/CSS rich text layout inside PDF. PDF will support safe text extraction, basic inline spacing, font size/color inheritance, and visible fallback.
- Certified barcode standard validation. Browser preview continues using JsBarcode. PDF export gets deterministic printable bar rendering that is visually stable and testable.

---

## Acceptance Matrix

| Capability | Designer Canvas | Preview DOM | Browser Print | PDF Export | Automated Test |
| --- | --- | --- | --- | --- | --- |
| Text content expression | Same bounds and text alignment | Same | Same | Same text box | Core + viewer tests |
| Text format output | Same formatted value | Same | Same | Same formatted value | Existing format tests plus regression |
| Image by data URL | Shows real image | Shows real image | Shows real image | Embeds PNG/JPEG | Viewer PDF helper test |
| Image by URL | Shows URL image when browser can load it | Shows same | Shows same | Draws fallback frame | Viewer PDF fallback test |
| Rich text | Shows formatted rich text | Shows rich HTML | Shows rich HTML | Draws safe text fallback | Viewer PDF helper test |
| Barcode | Shows generated barcode | Shows generated barcode | Shows generated barcode | Draws deterministic bars | Viewer PDF helper test |
| Checkbox | Shows checked/unchecked state | Same | Same | Same box/check | Viewer render tests |
| Line | Shows coordinates and stroke style | Same | Same | Same vector line | Viewer PDF draw test |
| Shape | Shows rectangle/ellipse/polygon | Same | Same | Same vector shape | Viewer PDF draw test |
| Panel | Selectable and renders children | Children clipped/offset correctly | Same | Same | Core + viewer tests |
| Subreport | Shows resolved child report box | Same | Same | Same first-page content | Core + viewer tests |
| DataBand sorting | Band properties show source and sort rules | Rows appear sorted | Same sorted rows | Same sorted rows | Core + designer tests |
| Left panel search consistency | Component, report tree, and data source search boxes share one style | Not applicable | Not applicable | Not applicable | Designer tests |

Final acceptance commands:

```powershell
pnpm --filter @report-designer/core test -- __tests__/phase-22-output-parity-containers.test.ts __tests__/phase-6-regression-renderdocument.test.ts
pnpm --filter @report-designer/viewer test -- src/__tests__/phase-22-output-parity-containers.test.tsx src/__tests__/phase-4-print-frame.test.ts src/__tests__/phase-4-viewer-renderdocument.test.tsx
pnpm --filter @report-designer/designer test -- src/__tests__/phase-22-databand-sorting.test.tsx src/__tests__/phase-22-left-panel-search.test.tsx src/__tests__/phase-18-component-properties-and-drag.test.tsx
pnpm build
```

Manual acceptance:

```powershell
pnpm --filter example dev -- --host 127.0.0.1 --port 5180
```

Open `http://127.0.0.1:5180/`, enter the designer from the example list, open the common components example, then compare designer preview, print preview, and exported PDF visually.

---

## Data and Type Decisions

### Render contract

Add container-aware render component types in `packages/core/src/render-document/types.ts`:

```ts
export interface RenderPanel extends RenderBaseComponent {
  type: 'panel';
  components: RenderComponent[];
  clipContent?: boolean;
}

export interface RenderSubreport extends RenderBaseComponent {
  type: 'subreport';
  templateKey: string;
  components: RenderComponent[];
  missing?: boolean;
}
```

Keep image, rich text, barcode, checkbox, line, and shape fields already introduced in `RenderComponent`, and make sure each field has a default-safe value before entering viewer or PDF code.

### Subreport registry

Use JSON-only local registry lookup. No network fetch is performed. A subreport component identifies the nested template by key:

```ts
export interface RenderReportOptions {
  subreports?: Record<string, ReportTemplate>;
  maxSubreportDepth?: number;
}
```

`SubreportComponent.templateUrl` remains supported as the registry key to avoid breaking existing templates. A new alias `templateKey` can be added later in designer UI, but the renderer must normalize both values to one key internally.

### Panel coordinate model

Panel child components use coordinates relative to the panel content box. During layout, the engine offsets child render boxes by panel `x` and `y`. A panel may clip children in DOM and print; PDF clips where practical and otherwise draws only components whose boxes intersect the panel bounds.

### DataBand sorting model

Keep the existing `dataBand.sort` array as the canonical model:

```ts
export interface DataBandSortRule {
  field: string;
  direction: 'asc' | 'desc';
}

export interface DataBandOptions {
  dataSourceId?: string;
  filterExpression?: string;
  sort?: DataBandSortRule[];
}
```

The designer exposes sorting only for `data` and `hierarchicalData` bands with a bound JSON table. Sort fields come from the selected data source schema. The execution order is:

1. Load rows from `data[dataSourceId]`.
2. Apply `filterExpression`.
3. Apply stable multi-field sorting.
4. Render group/header/detail/footer logical band items.

Sort comparison rules:

- Empty values sort after non-empty values for ascending and before non-empty values for descending.
- Numeric fields compare as numbers.
- Date-like values compare by timestamp when both sides are valid dates.
- All other values compare by locale string.
- Equal keys keep original input order.

---

## Task 1: Add Test Scaffolding First

- [ ] Add `packages/core/src/__tests__/phase-22-output-parity-containers.test.ts`.
- [ ] Add `packages/viewer/src/__tests__/phase-22-output-parity-containers.test.tsx`.
- [ ] Add small PDF helper tests around pure functions instead of only asserting final PDF byte size.

Core test cases:

```ts
it('lays out panel children relative to the panel box', () => {
  const document = renderReport(templateWithPanel, jsonData);
  const panel = document.pages[0]?.components.find((component) => component.type === 'panel');
  expect(panel).toMatchObject({ x: 20, y: 30, width: 80, height: 40 });
  expect(panel?.components[0]).toMatchObject({ x: 25, y: 36, type: 'text' });
});

it('resolves a subreport from the local template registry', () => {
  const document = renderReport(parentTemplate, jsonData, {
    subreports: { employeeSubreport: childTemplate },
  });
  const subreport = document.pages[0]?.components.find((component) => component.type === 'subreport');
  expect(subreport).toMatchObject({ type: 'subreport', templateKey: 'employeeSubreport', missing: false });
  expect(subreport?.components.some((component) => component.type === 'text')).toBe(true);
});

it('renders a stable missing-subreport placeholder', () => {
  const document = renderReport(parentTemplate, jsonData, { subreports: {} });
  const subreport = document.pages[0]?.components.find((component) => component.type === 'subreport');
  expect(subreport).toMatchObject({ missing: true });
});

it('sorts DataBand rows before rendering details', () => {
  const document = renderReport(sortedEmployeesTemplate, {
    employees: [
      { name: 'Cora', department: 'Sales', salary: 900 },
      { name: 'Alice', department: 'Sales', salary: 1200 },
      { name: 'Ben', department: 'Admin', salary: 1200 },
    ],
  });
  const names = document.pages.flatMap(page => page.components)
    .filter(component => component.type === 'text')
    .map(component => component.text);
  expect(names).toEqual(['Ben', 'Alice', 'Cora']);
});
```

Viewer test cases:

```ts
it('renders panel children in DOM preview', () => {
  render(<ReportViewer document={documentWithPanel} />);
  expect(screen.getByText('Inside panel')).toBeInTheDocument();
});

it('renders print HTML for common components without dropping content', () => {
  const html = buildPrintHtml(documentWithCommonComponents);
  expect(html).toContain('data-report-component="image"');
  expect(html).toContain('data-report-component="richText"');
  expect(html).toContain('data-report-component="checkbox"');
  expect(html).toContain('data-report-component="panel"');
});
```

Designer sorting test cases:

```ts
it('shows DataBand sort rules only after a JSON table is selected', () => {
  render(<Designer initialTemplate={templateWithEmployees} />);
  fireEvent.click(screen.getByTestId('report-tree-band-dataBand1'));
  expect(screen.getByLabelText('Data source')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add sort' })).toBeDisabled();
  fireEvent.mouseDown(screen.getByLabelText('Data source'));
  fireEvent.click(screen.getByText('employees'));
  expect(screen.getByRole('button', { name: 'Add sort' })).toBeEnabled();
});

it('persists field and direction into dataBand.sort', () => {
  render(<Designer initialTemplate={templateWithEmployees} />);
  fireEvent.click(screen.getByTestId('report-tree-band-dataBand1'));
  selectOption('Data source', 'employees');
  fireEvent.click(screen.getByRole('button', { name: 'Add sort' }));
  selectOption('Sort field', 'salary');
  selectOption('Sort direction', 'Descending');
  expect(getTemplate().pages[0].bands[0].dataBand?.sort).toEqual([
    { field: 'salary', direction: 'desc' },
  ]);
});
```

Left panel search test cases:

```ts
it('uses the shared panel search control for components, report tree, and dictionary', () => {
  render(<Designer initialTemplate={templateWithEmployees} />);
  const componentSearch = screen.getByPlaceholderText('Search components');
  const dictionarySearch = screen.getByPlaceholderText('Search data sources and fields');
  const reportSearch = screen.getByPlaceholderText('Search report tree');
  expect(componentSearch.closest('.rd-panel-search')).toBeTruthy();
  expect(dictionarySearch.closest('.rd-panel-search')).toBeTruthy();
  expect(reportSearch.closest('.rd-panel-search')).toBeTruthy();
});

it('filters report tree nodes by page, band, and component name', () => {
  render(<Designer initialTemplate={templateWithNamedComponents} />);
  fireEvent.change(screen.getByPlaceholderText('Search report tree'), { target: { value: 'DataBand1' } });
  expect(screen.getByText('DataBand1')).toBeInTheDocument();
  expect(screen.queryByText('PageFooterBand1')).not.toBeInTheDocument();
});

it('keeps dictionary field search behavior with the shared visual shell', () => {
  render(<Designer initialTemplate={templateWithEmployees} />);
  fireEvent.change(screen.getByPlaceholderText('Search data sources and fields'), { target: { value: 'salary' } });
  expect(screen.getByText('salary')).toBeInTheDocument();
  expect(screen.queryByText('department')).not.toBeInTheDocument();
});
```

PDF helper tests:

```ts
expect(parseDataImage('data:image/png;base64,iVBORw0KGgo=')).toMatchObject({ mime: 'image/png' });
expect(stripRichHtml('<p>Hello <strong>World</strong></p>')).toBe('Hello World');
expect(createBarcodeBars('ABC123')).toEqual(createBarcodeBars('ABC123'));
```

---

## Task 2: Extract Component Layout Helpers

- [ ] Create `packages/core/src/layout-engine/layout-component.ts`.
- [ ] Move common component-to-render-box logic out of `layout-band.ts`.
- [ ] Keep band pagination behavior unchanged.
- [ ] Add recursion guard for nested panels and subreports.

Required helper shape:

```ts
export interface LayoutComponentContext {
  data: Record<string, unknown>;
  offsetX: number;
  offsetY: number;
  subreports?: Record<string, ReportTemplate>;
  subreportDepth: number;
  maxSubreportDepth: number;
}

export function layoutComponent(component: ReportComponent, context: LayoutComponentContext): RenderComponent;
```

Rules:

- Text and formatted text keep using the existing expression and format pipeline.
- Image and rich text copy already-normalized properties into the render contract.
- Panel lays out its `components` array by calling `layoutComponent` with panel offsets.
- Subreport looks up `templateUrl` or `templateKey` in `context.subreports`, renders it with the same JSON data, and maps first-page components into the subreport box.
- Missing subreport returns `RenderSubreport` with `missing: true` and one visible placeholder text child.

---

## Task 3: Complete PDF Drawing for Common Components

- [ ] Create `packages/viewer/src/export/pdf/pdf-component-rendering.ts`.
- [ ] Update `packages/viewer/src/export/pdf/pdf-draw-component.ts` to call testable helpers.
- [ ] Make the PDF draw path async so images can be embedded through pdf-lib.
- [ ] Keep PDF export layout driven only by `RenderDocument`, not by original report template.

Helper functions:

```ts
export function parseDataImage(src: string): { mime: 'image/png' | 'image/jpeg'; bytes: Uint8Array } | null;
export function stripRichHtml(html: string): string;
export function createBarcodeBars(value: string): number[];
export function normalizePdfStroke(style?: string): { dash?: number[]; width: number };
```

Drawing rules:

- Image:
  - PNG and JPEG data URLs are embedded.
  - Unknown or remote images draw a border frame and the component name.
- Rich text:
  - HTML is sanitized to plain text.
  - Text uses component font size, color, and alignment where available.
- Barcode:
  - Draw bars from `createBarcodeBars`.
  - Draw human-readable text when the render component requests it.
- Checkbox:
  - Draw square border and check mark when checked.
- Line:
  - Draw vector line using component stroke, width, and dash.
- Shape:
  - Draw rectangle and ellipse. Polygon can draw its bounding box if no point list is available.
- Panel and subreport:
  - Draw container background and border.
  - Recursively draw child components with the same page coordinate transform.

---

## Task 4: Complete DOM Preview and Print HTML Container Rendering

- [ ] Update `packages/viewer/src/renderers/dom/renderComponent.tsx`.
- [ ] Update `packages/viewer/src/print/print-frame.ts`.
- [ ] Ensure `data-report-component` attributes are present for image, rich text, barcode, checkbox, line, shape, panel, and subreport.

DOM rules:

- Panel renders as an absolutely positioned container.
- Panel children render inside that container with relative offsets.
- Subreport renders as a container with child render boxes.
- Missing subreport renders a visible placeholder in preview and print.
- Existing page scaling must not change component coordinates.

Print rules:

- Print HTML must use the same millimeter dimensions as preview.
- Image, rich text, barcode, checkbox, line, shape, panel, and subreport must be emitted by the same helper path where possible.
- No component may be silently dropped from print output.

---

## Task 5: Designer Canvas and Property Alignment

- [ ] Update `packages/designer/src/components/Canvas.tsx` so panel and subreport render children on the canvas.
- [ ] Make panel selectable as a normal component and keep its selection border outside child hit zones.
- [ ] Update `packages/designer/src/components/PropertyEditor.tsx` with clear panel and subreport fields.
- [ ] Keep the text component model simplified: text content is the expression/string source; no separate data source and field controls.

Designer rules:

- Dragging common components onto a band must still work.
- Dragging panel onto a band creates a named panel component.
- Dragging components into a selected panel is allowed when the pointer lands inside the panel content box.
- Subreport property exposes a local template key selector or text input; it does not expose remote fetching.
- All labels use the existing Chinese/English i18n system.

---

## Task 6: Add Common Components Acceptance Example

- [ ] Add or update an example report in `packages/example/src`.
- [ ] Include one page with all non-chart common components.
- [ ] Include one panel with nested text, image, and checkbox.
- [ ] Include one subreport resolved from a local registry.
- [ ] Set every example page to A4 by default.

Example content must cover:

- Plain text
- Expression text
- Number/date formatting
- Image data URL
- Rich text
- Barcode
- Checkbox
- Horizontal and vertical lines
- Rectangle and ellipse
- Panel children
- Local subreport
- DataBand sorted by one text field and one numeric field

---

## Task 7: DataBand Sorting Designer and Rendering Contract

- [ ] Strengthen the existing core sorting tests in `packages/core/src/__tests__/phase-22-output-parity-containers.test.ts`.
- [ ] Add `packages/designer/src/__tests__/phase-22-databand-sorting.test.tsx`.
- [ ] Update `packages/designer/src/components/properties/BandPropertyGrid.tsx` to expose DataBand sorting.
- [ ] Add missing i18n keys in `packages/designer/src/i18n/messages.ts`.
- [ ] Preserve `dataBand.sort` during template normalization and migration.

Core implementation rules:

- `prepareRows` remains the only place where DataBand rows are filtered and sorted before render.
- Sorting must be stable by carrying original row indexes through comparison and using the index as the final tie-breaker.
- Multi-field sort order must follow the UI order from top to bottom.
- Expression-style fields such as `{employees.salary}` continue to work for compatibility, but the designer writes plain field names from the selected table schema.

Designer UI rules:

- When no band is selected, the page property panel is shown as today.
- When a non-data band is selected, no sort controls are shown.
- When a DataBand has no data source, show the data source selector and a disabled add-sort button.
- When a DataBand has a data source, show:
  - Data source select.
  - Sort rule list.
  - Add sort button.
  - Field select populated from `schema` or `fields`.
  - Direction segmented control with ascending and descending icons.
  - Delete sort rule icon button.
  - Move up/down icon buttons when more than one rule exists.
- Sort controls use compact rows and icon buttons so the property panel remains scannable.
- All UI labels use the existing Chinese/English dictionary.

DataBand property layout:

```tsx
<PropertySection title={t('band.data')}>
  <Select aria-label={t('band.dataSource')} />
</PropertySection>
<PropertySection title={t('band.sorting')}>
  <Button aria-label={t('band.addSort')} />
  {sortRules.map((rule, index) => (
    <SortRuleRow
      key={`${rule.field}-${index}`}
      fieldOptions={fieldOptions}
      direction={rule.direction}
      onMoveUp={...}
      onMoveDown={...}
      onDelete={...}
    />
  ))}
</PropertySection>
```

Preview and output rules:

- Designer canvas preview, report viewer preview, browser print, and PDF export must all receive sorted logical rows from the same core render pipeline.
- No viewer-side renderer may sort rows again.
- Changing the sort configuration should immediately affect preview output.

---

## Task 8: Left Panel Search Consistency

- [ ] Add `packages/designer/src/__tests__/phase-22-left-panel-search.test.tsx`.
- [ ] Add a shared search control for left-side panels, either as `packages/designer/src/components/panels/PanelSearchBox.tsx` or a local exported component if the current file structure is simpler.
- [ ] Replace component palette search with the shared control.
- [ ] Add report tree search with the shared control.
- [ ] Replace data source and field search with the shared control.
- [ ] Add missing i18n keys for report tree search in Chinese and English.
- [ ] Keep existing component palette and dictionary filtering behavior unchanged.

Shared search control rules:

- Use Ant Design 6 `Input.Search`.
- Use one class name: `rd-panel-search`.
- Full panel width.
- Same height, border radius, suffix search icon position, and clear behavior across all three panels.
- Placeholder text comes only from i18n keys.
- Search is case-insensitive and trims whitespace.
- Empty search restores the full tree/list.

Report tree search rules:

- Match page names, band names, component names, and component type labels.
- When a child matches, keep its ancestors visible so the hierarchy is understandable.
- Do not show action buttons in tree rows.
- Keep compact row height and icon alignment from the existing simplified tree.

Data source search rules:

- Keep the current tree-style dictionary structure.
- Match data source names, field names, system variables, functions, and resources.
- When a field matches, keep the data source ancestor visible.
- Dragging a matched field still creates the same expression text component as today.

---

## Task 9: Verification and Regression Pass

- [ ] Run core tests:

```powershell
pnpm --filter @report-designer/core test -- __tests__/phase-22-output-parity-containers.test.ts __tests__/phase-6-regression-renderdocument.test.ts
```

- [ ] Run viewer tests:

```powershell
pnpm --filter @report-designer/viewer test -- src/__tests__/phase-22-output-parity-containers.test.tsx src/__tests__/phase-4-print-frame.test.ts src/__tests__/phase-4-viewer-renderdocument.test.tsx
```

- [ ] Run designer drag/property regression:

```powershell
pnpm --filter @report-designer/designer test -- src/__tests__/phase-22-databand-sorting.test.tsx src/__tests__/phase-22-left-panel-search.test.tsx src/__tests__/phase-18-component-properties-and-drag.test.tsx
```

- [ ] Run full build:

```powershell
pnpm build
```

- [ ] Start example and perform Playwright smoke:

```powershell
pnpm --filter example dev -- --host 127.0.0.1 --port 5180
```

Playwright smoke requirements:

- Open the example index.
- Open designer from an example.
- Confirm palette is visible.
- Confirm panel, rich text, image, barcode, and checkbox entries are visible.
- Confirm component, report tree, and data source search boxes use the same width, height, icon position, clear behavior, and localized placeholder style.
- Confirm canvas renders without console errors.
- Open preview and print/export entry points.
- Confirm preview and print contain the same visible component count for the common components example.

---

## Done Criteria

- All tests listed in the verification section pass.
- `pnpm build` passes.
- The forbidden product-name and old-version terminology scan across `docs` and `packages` returns no matches.
- Common components example opens at `http://127.0.0.1:5180/`.
- Designer preview, browser print, and PDF export are driven by the same `RenderDocument`.
- No common non-chart component is silently dropped in preview, print, or PDF.
