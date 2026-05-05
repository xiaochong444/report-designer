# Stimulsoft Report Designer Roadmap

This roadmap ties the phase plans together.

## Execution Order

1. `2026-05-05-phase-0-stimulsoft-designer-shell.md`
2. `2026-05-05-phase-1-template-model-json-dictionary.md`
3. `2026-05-05-phase-2-band-plan-grouping-aggregates.md`
4. `2026-05-05-phase-3-layout-pagination-render-document.md`
5. `2026-05-05-phase-4-viewer-print-pdf.md`
6. `2026-05-05-phase-5-designer-workflows.md`
7. `2026-05-05-phase-6-examples-regression-suite.md`

## Why Phase 0 Comes First

The current UI does not visually communicate a professional print report designer. Phase 0 fixes the visible shell first: ribbon, panels, canvas frame, rulers, and status bar. It deliberately avoids engine changes so it can be completed quickly and reviewed visually.

## Why Core Engine Work Comes Before Deep Designer Workflows

Stimulsoft-style authoring depends on DataBand ownership, group scopes, aggregates, and pagination. Without those semantics, wizards and property panels would only collect settings the engine cannot honor.

## Minimum Useful Milestone

The first milestone worth demoing to users is Phase 0 + Phase 1 + Phase 2 + a small slice of Phase 3:

- Designer looks like a real report designer.
- JSON data sources can be inferred.
- DataBand, GroupHeader, GroupFooter, and aggregates have semantics.
- Basic paginated RenderDocument exists.

## First Production-Like Milestone

The first milestone worth using for real print reports is Phase 0 through Phase 4:

- Preview, print, and PDF share one RenderDocument.
- Common print components render.
- Grouped reports and page footers work.

## Full Initial Scope

Phase 0 through Phase 6 completes the initial rebuild:

- Stimulsoft-style designer shell and workflows.
- JSON-only dictionary.
- Band-driven render engine.
- Grouping and aggregates.
- Pagination.
- Viewer, print, and PDF.
- Example templates and regression coverage.
