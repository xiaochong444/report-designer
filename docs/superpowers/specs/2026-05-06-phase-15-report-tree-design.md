# Phase 15 Report Tree Design

## Context

The current report tree works functionally, but it still feels much rougher than the Stimulsoft report explorer:

- component rows expose raw `type - id` strings instead of readable names
- new components do not get designer-friendly default names
- the tree does not visually distinguish text, image, table, barcode, and other component types
- the overall left-side structure reads as a generic tree instead of a compact report explorer

The user wants the tree to feel closer to Stimulsoft: cleaner rows, automatic naming, and recognizable per-type visuals.

## Goals

1. Automatically generate readable default names when a component is inserted without a custom name.
2. Normalize existing unnamed template components so the explorer never falls back to raw ids.
3. Show only the component name in the report tree.
4. Give different component types different icons so the tree can be scanned quickly.
5. Keep the tree expanded when the real template loads and when new components are added.
6. Preserve band actions and band height hints that are already useful in the simplified explorer.

## Non-goals

- no changes to report rendering, pagination, or printing
- no changes to data dictionary structure
- no schema migration for persisted templates
- no chart-specific explorer work

## Design

### 1. Component naming model

Component names remain optional in the persisted schema, but the designer surface will normalize unnamed components into Stimulsoft-style defaults:

- `Text1`, `Text2`, ...
- `Image1`, `Image2`, ...
- `Table1`, `Table2`, ...
- `CheckBox1`, `BarCode1`, `SubReport1`, and so on

This must happen in three places:

- when loading a template into the designer
- when dragging or inserting a new component
- when pasting or duplicating a component that still uses an auto-name seed

User-defined names are never overwritten.

### 2. Report tree presentation

The report tree keeps the existing hierarchy:

- Report
- Page
- Band
- Component

But component rows become name-only rows with a compact icon on the left. Band rows keep a small color swatch, height hint, and move/delete actions.

### 3. Expansion behavior

`defaultExpandAll` is not sufficient because the designer loads the actual template after the first render. The tree must therefore use controlled `expandedKeys` and automatically merge in new page and band keys as the template changes.

That keeps the explorer stable when:

- the initial template is loaded
- a new band is inserted
- a component is added into an already expanded band

### 4. Regression coverage

Add tests that lock:

- unnamed template components render as `Text1`, `Image1`, etc.
- per-type icons are rendered in the tree
- inserting a second unnamed text component continues numbering as `Text2`
- existing canvas tests do not confuse tree labels with canvas band labels

## Validation

- report tree shows report name, `Page1`, band names, and clean component names
- no component row shows raw `type - id`
- adding a new unnamed component increments the correct type counter
- full designer test suite remains green
- example package tests and build remain green
