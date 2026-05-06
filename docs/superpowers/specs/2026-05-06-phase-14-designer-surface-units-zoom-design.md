# Phase 14 Designer Surface Units Zoom Design

## Context

The current designer shell is close to the Stimulsoft-style surface, but a few workflow-level issues still make it feel off:

- the left sidebar shows duplicated structure and reads as cluttered
- page settings do not expose paper presets or report units
- property labels still leak raw `(mm)` suffixes
- zoom controls overlap the property panel
- zoom currently double-scales the paper and breaks ruler alignment
- example templates still use short custom page heights instead of default A4

The user wants this phase to improve the shell and editing experience without changing the core pagination and band rendering model.

## Goals

1. Make the left sidebar read like one coherent explorer instead of two stacked navigators.
2. Add paper preset selection with `Custom` width and height editing.
3. Add a report unit selector with `Millimeter` and `Centimeter`.
4. Remove `(mm)` suffixes from property labels while keeping numeric editing usable.
5. Make zoom controls live inside the canvas area and stop covering the property panel.
6. Fix zoomed ruler, paper, and printable-area alignment.
7. Make all example templates default to A4 paper.

## Non-goals

- no change to viewer pagination rules
- no change to print renderer semantics
- no chart work
- no redesign of report template persistence format

## Design

### 1. Internal measurement model

All persisted page, margin, band, and component coordinates remain stored in millimeters. The new unit selector is a designer-surface preference only. UI inputs convert between display units and stored millimeters.

This keeps pagination, band layout, preview, and print logic stable while still matching the report-designer workflow users expect.

### 2. Paper preset model

Paper type is derived from current page width and height instead of being persisted as a new template field. The surface recognizes common presets:

- `A5`
- `A4`
- `A3`
- `Letter`
- `Legal`
- `Custom`

When a preset is selected, width and height update based on current orientation. When orientation changes, the selected preset keeps the same sheet family and swaps width and height. Width and height inputs are only editable for `Custom`.

### 3. Sidebar cleanup

The standalone report-tree strip above the tabbed left panel will be removed. The left side becomes a single explorer area with:

- `Components`
- `Dictionary`
- `Report`

The report tab continues to own band ordering and band add/remove actions so users keep one clear place for report structure editing.

### 4. Zoom and ruler geometry

The canvas must treat raw paper size and scaled paper size separately.

- raw paper and printable-area dimensions stay in unscaled pixels
- the paper sheet uses `transform: scale(zoom)`
- the page-stack wrapper and rulers use scaled dimensions so scroll space and tick marks match the visual paper
- ruler offsets are computed from scaled margins

This removes the existing double-scale bug.

### 5. Example defaults

The example template helper will default to A4 height, and the sample templates will stop overriding the page height unless they truly need a different sheet family.

## Validation

- designer page properties show paper type and report unit
- no property labels contain `(mm)`
- zoom bar is no longer fixed over the right panel
- at 200% zoom the ruler offsets still match page margins
- sample templates report `210 x 297` A4 pages
