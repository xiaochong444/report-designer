# Reference-Compatible Report Designer Design

> **Scope:** Rebuild the current report designer into a the reference report designer-style print report designer and viewer. Charts are intentionally out of scope. Runtime data sources are JSON only.

## Goal

The product should feel and behave like a practical subset of the reference report designer for print reports:

- A designer with a reference-style ribbon, toolbox, data dictionary, report tree, property grid, status bar, rulers, and banded canvas.
- A JSON-only data dictionary with schema inference, sample data, drag-to-bind fields, and nested-array support for master-detail reports.
- A band-driven render engine that understands data bands, headers, footers, group headers, group footers, page headers, page footers, report title/summary, child bands, and common column/empty/overlay behavior.
- A pagination model close to the reference designer: page bands repeat, data bands repeat for rows, group bands frame data, page footers sit at the bottom, and grows/keeps/breaks are handled before preview and print.
- Common print components: text, image, line, shape, checkbox, barcode, page number, date time, panel, table-as-band-helper, rich text, and subreport in the initial rebuild scope.
- Common grouping and aggregate behavior: sum, avg, min, max, count, count distinct, conditional count/sum, report/group/page/running scopes.

## Official Behavior Baseline

The compatibility target is based on the reference designer documentation:

- Standard bands include Report Title, Report Summary, Page Header, Page Footer, Group Header, Group Footer, Header, Footer, Column Header, Column Footer, Data, Hierarchical Data, Child, Empty Data, and Overlay.
- Band render order places page/report/list/data-associated bands into strict rendering roles; Header/Footer/Group/Column/Empty bands associate with a Data band.
- Groups require Group Header and usually Group Footer bands, and the Group Header is bound to a Data band by condition.
- Totals are either associated with bands during rendering or accessed through `Totals.*` functions.
- The designer uses a Ribbon with tabs such as Home, Insert, Page, Layout, and Preview, plus panels for Properties, Data Dictionary, Tree, and Toolbox.

Reference links:

- https://www.reference-designer.com/manuals/en/user-manual/report_internals_bands_band_types_standard_bands.htm
- https://www.reference-designer.com/manuals/en/user-manual/report_internals_bands_order_render.htm
- https://www.reference-designer.com/manuals/en/user-manual/report_internals_groups.htm
- https://www.reference-designer.com/manuals/en/user-manual/report_internals_groups_groupheaderband.htm
- https://www.reference-designer.com/manuals/en/user-manual/report_internals_functions_totals.htm
- https://www.reference-designer.com/manuals/en/user-manual/reports_designer.htm

## Current Codebase Assessment

The current project is a TypeScript monorepo:

- `packages/core` owns template types, expression parsing/evaluation, basic rendering, command handling, and pagination.
- `packages/designer` owns the React designer shell, canvas, panels, toolbar, property editor, expression editor, and Zustand store.
- `packages/viewer` owns preview, toolbar, print, and PDF export.
- `packages/example` hosts the demo app.

Important gaps:

- `core/src/render-engine/index.ts` renders only text/image/barcode semantics and treats group bands mostly as labels.
- `core/src/pagination/index.ts` splits by accumulated band height and does not reserve page footer space, position page footers at bottom, repeat group/page-related bands correctly, or handle grow/shrink/break rules.
- Aggregates in `expression-engine/evaluator.ts` are scalar argument functions, not report totals with band/group/page scopes.
- Designer layout is functional but visually rough and does not resemble the the reference designer ribbon/panel/canvas arrangement closely enough.
- Viewer and PDF export use different incomplete rendering behavior instead of a shared final render document.

## Architecture

The revised architecture centers on a platform-neutral render document.

```text
ReportTemplatecurrent model + JsonDataContext
  -> JsonDictionary
  -> TemplateValidator
  -> BandPlan
  -> GroupedDataPlan
  -> AggregateRuntime
  -> LogicalRenderItems
  -> LayoutPass
  -> PaginationPass
  -> RenderDocument
  -> Designer preview / Viewer DOM / Print iframe / PDF exporter
```

### Core Units

- `template-model/types.ts`: print-focused template schema with reference-style bands and component properties.
- `data-dictionary/json-dictionary.ts`: JSON schema inference and field path utilities.
- `band-planner/`: maps template bands to DataBand-owned render plans.
- `aggregate-engine/`: report/group/page/running aggregate runtime.
- `layout-engine/`: component measurement, can grow/shrink, band height calculation, and render item placement.
- `pagination/`: page breaking, page bands, footer bottom placement, repeated headers, and two-pass page-number calculation.
- `render-document/`: final cross-platform model consumed by viewer and PDF export.

### Designer Units

- `components/shell/DesignerShell.tsx`: reference-style top-level layout.
- `components/ribbon/`: tabbed command ribbon: Home, Insert, Page, Layout, Preview.
- `components/panels/`: Toolbox, DataDictionaryPanel, ReportTreePanel, PropertyGrid.
- `components/canvas/`: ruler, page surface, band surface, selection, drag, resize, guides.
- `store/designer-store.ts`: template and UI state, migrated away from one-file UI concerns where practical.

### Viewer Units

- `renderers/dom/`: DOM renderers for all supported components.
- `print/print-frame.ts`: print iframe generated from RenderDocument.
- `export/pdf/`: PDF renderer generated from RenderDocument with Chinese font support.

## Reference-Style Designer Layout

The first visible redesign should follow this shape:

```text
+--------------------------------------------------------------------------------+
| Quick Access: New Open Save Undo Redo | Report Name                   Preview  |
+--------------------------------------------------------------------------------+
| Ribbon Tabs: Home | Insert | Page | Layout | Preview                            |
| Ribbon Commands: grouped icon buttons, selects, toggles, separators             |
+--------------------------------------------------------------------------------+
| Toolbox/Data/Tree | Horizontal Ruler + Designer Canvas            | Properties |
|                  | +--------------------------------------------+ |            |
| left tab rail    | | Page surface with colored band headers      | | grid-like  |
| resizable pane   | | ReportTitle                                | | inspector |
|                  | | PageHeader                                 | | grouped    |
|                  | | Header                                     | | sections   |
|                  | | GroupHeader                                | |            |
|                  | | DataBand rows/components                   | |            |
|                  | | GroupFooter                                | |            |
|                  | | Footer                                     | |            |
|                  | | PageFooter visually anchored at bottom     | |            |
|                  | +--------------------------------------------+ |            |
+--------------------------------------------------------------------------------+
| Status: page size, margins, selected item, x/y/w/h, zoom slider, snap/grid state |
+--------------------------------------------------------------------------------+
```

Visual direction:

- Quiet desktop tool, not a marketing page.
- Light neutral background, compact controls, crisp borders, 8px or smaller radius.
- reference-style color-coded band headers, thin rulers, grid background, status bar, and dense property grid.
- Icons for commands; text only where the command is not obvious.
- No decorative gradients, floating cards, oversized hero-style headings, or rounded card stacks.

## Phase Breakdown

### Phase 0: Reference Designer Shell

Make the product stop feeling like a generic rough React demo. This phase changes the shell, ribbon, panels, canvas chrome, and status bar without changing report semantics.

### Phase 1: Template Model current model and JSON Dictionary

Introduce a the reference designer-compatible template model and JSON-only data dictionary while keeping migration from the existing model possible.

### Phase 2: Band Plan, Grouping, and Aggregates

Build the semantic layer that binds headers, footers, groups, child bands, and totals to DataBand execution.

### Phase 3: Layout and Pagination

Replace height-only pagination with a page-aware layout engine supporting grow/shrink, page bands, repeated headers, bottom footers, and page-number passes.

### Phase 4: Viewer, Print, and PDF

Use one RenderDocument for preview, browser print, and PDF export. Implement common print components.

### Phase 5: Designer Workflows

Add reference-style authoring workflows: data source wizard, band wizard, group wizard, expression editor, property grid, and preview mode integration.

### Phase 6: Examples and Regression Suite

Build representative templates and tests that prevent regressions in pagination, grouping, aggregates, print, PDF, and designer workflows.

## Out of Scope

- Chart printing.
- Cross-tab in the first rebuild.
- SQL, Excel, REST, OData, or database connectors.
- Pixel-perfect compatibility with the reference designer template files.
- Importing or exporting `.mrt` files.

## Acceptance Criteria

- A user can create a JSON-backed grouped report with report title, page header, table-like header, data rows, group footer totals, report summary, page footer page numbers, and print/PDF it.
- Preview, browser print, and PDF use the same RenderDocument and show the same page breaks.
- The designer visually resembles a serious reference-style report designer, with ribbon, left panel, right property grid, rulers, colored bands, and status bar.
- The core engine has unit tests for band association, grouping, aggregates, and pagination edge cases.
- The example app includes at least invoice, grouped employee list, master-detail order list, and long-text pagination templates.
