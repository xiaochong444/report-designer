# Designer

The Designer package provides the visual report editing interface. This guide covers its UI layout, component workflows, and key interactions.

## Designer Component

The `Designer` component is the top-level entry point:

```tsx
import { Designer } from '@report-designer/designer';
import type { ReportTemplate } from '@report-designer/core';

function App({ template, data }: { template: ReportTemplate; data: unknown }) {
  return (
    <Designer
      template={template}
      data={data}
      onTemplateChange={(updated) => { /* save or use updated template */ }}
    />
  );
}
```

### Props

| Prop | Type | Description |
| --- | --- | --- |
| `template` | `ReportTemplate` | The current report template. |
| `data` | `unknown` | Runtime JSON object or array. Fields and row sets are inferred automatically. |
| `onTemplateChange` | `(template: ReportTemplate) => void` | Called whenever the template is modified. |

### Composable Shell Components

For advanced layouts, you can compose the shell parts individually:

```tsx
import { DesignerShell, DesignerStatusBar, DesignerRibbon, DesignerLeftPanel, DesignerPropertyPanel, DesignerCanvasFrame } from '@report-designer/designer';
```

- `DesignerShell` — outer layout container.
- `DesignerRibbon` — top toolbar with tabs (Home, Insert, Data, View).
- `DesignerLeftPanel` — report tree and component palette.
- `DesignerPropertyPanel` — context-sensitive property editor.
- `DesignerCanvasFrame` — canvas with rulers, grid, and zoom controls.
- `DesignerStatusBar` — status bar with zoom, mode, and coordinates.

## UI Layout

### Ribbon Toolbar

The ribbon is organized into tabs:

- **Home** — font formatting (family, size, bold, italic, underline, alignment), borders, text styles, undo/redo, clipboard (copy/cut/paste).
- **Insert** — add components (text, image, table, chart, barcode, QR code, checkbox, page number, datetime, line, shape, subreport, panel, richtext).
- **Data** — JSON data dictionary inference from sample JSON.
- **View** — zoom controls, mode toggle (design/preview), page setup dialog.
- **Page** — page orientation, margins, size, watermark, border settings.

### Report Tree (Left Panel)

Displays the hierarchical structure:

```
Report
  └── Page 1
        ├── Report Title
        ├── Page Header
        ├── Header
        ├── Data Band (items)
        ├── Footer
        └── Page Footer
```

You can:

- Select bands or components to navigate the canvas.
- Drag to reorder bands.
- Right-click for context menu (add band, delete, duplicate).

### Band Types

Bands define when and how a horizontal section prints. A typical business document combines static bands for titles and page chrome with data bands for detail rows.

| Band | Purpose | Common content |
| --- | --- | --- |
| `reportTitle` | Prints once at the beginning of the report. | Document title, company name, form number, opening summary. |
| `pageHeader` | Repeats at the top of each page. | Logo, page title, print date, fixed column captions that must appear on every page. |
| `header` | Prints before a data section. | Section title, master record fields such as order number, customer, warehouse, operator. |
| `columnHeader` | Prints before multi-column or tabular detail content. | Table headers such as product, quantity, price, amount. |
| `groupHeader` | Prints when the configured group expression changes. | Customer group, category group, date group, warehouse group. |
| `data` | Iterates over a row set such as `root`, `items`, or `orders.items`. | Detail rows, repeated text fields, row tables, barcodes per item. |
| `hierarchicalData` | Iterates tree-like rows from an inferred array path and expands child rows by `childrenField`. | Organization trees, category trees, BOM structures. |
| `groupFooter` | Prints after each group. | Group subtotal, group count, group remarks. |
| `columnFooter` | Prints after a column/detail section. | Column totals or closing rows for a table-like section. |
| `footer` | Prints after a data section. | Section totals, signatures, approval notes. |
| `pageFooter` | Repeats at the bottom of each page. | Page number, print time, confidentiality notes. |
| `reportSummary` | Prints once at the end of the report. | Grand totals, final remarks, closing signatures. |
| `overlay` | Floats as page overlay content. | Watermark-like marks, preprinted-form references, background labels. |

Most document templates follow this shape: `reportTitle` for the title, `header` for master fields, `data` or `hierarchicalData` for rows, `footer` for totals, and `pageFooter` for page numbers. Use page-level bands only for content that must repeat on every page.

### Canvas

The canvas is the central editing surface:

- Components are positioned with x/y coordinates (in mm).
- Bands are shown as horizontal strips.
- Rulers along the top and left edges show measurements.
- Zoom in/out with the mouse wheel or zoom controls.
- Selected components show resize handles.
- Multi-select with Shift+click or drag rectangle.

### Property Panel

The right-side property panel shows editable properties for the current selection:

- **Band properties** — height, visibility, print-on settings, data binding, behavior options.
- **Component properties** — position, size, font, border, background, text content, formatting, events.
- **Table properties** — row/column count, cell editing, binding mode, border settings.
- **Chart properties** — chart type, data binding, title, legend, axes, labels, theme.

## Component Palette

The palette lists available component types, organized by category:

- **Text Components** — Text, Rich Text, Page Number, DateTime
- **Visual Components** — Image, Barcode, QR Code, Checkbox
- **Layout Components** — Panel, Line, Shape
- **Data Components** — Table, Chart
- **Advanced** — Subreport

Drag a component from the palette onto the canvas, or use the Insert ribbon to add at the center of the current band.

## Design Workflow

### 1. Set Up Page

1. Open the **Page Setup** dialog from the View tab.
2. Configure paper size (A4, Letter, custom), orientation (portrait/landscape), and margins.
3. Optionally set a watermark and page border.

### 2. Provide Sample Data

1. Pass representative JSON through the `data` prop.
2. Or go to the **Data** tab → **Data Dictionary** and paste sample JSON.
3. The designer infers the `root` field tree and nested array paths automatically.

### 3. Add Bands

1. Use the Insert ribbon → **Band** → select a band type.
2. Click on the band after which the new band should be inserted.
3. Common layout: `reportTitle` → `pageHeader` → `header` → `data` → `footer` → `pageFooter`.

### 4. Add Components

1. Select the target band on the canvas or in the report tree.
2. Drag a component from the palette or use Insert → component type.
3. Position and resize the component on the canvas.
4. Set its properties in the property panel.

### 5. Bind Data to Components

- **Text component**: Set the `text` property to an expression like `{customer.name}` or `{items.product.name}`.
- **Table component**: Set the binding mode to `detail`, choose an array path such as `items`, and map columns to fields.
- **Chart component**: Configure dimensions and measures against an inferred row set such as `items`.

### 6. Apply Styles

- Select a text component, then choose a style from the **Text Style Library**.
- Create custom styles via the library dialog.
- Styles control font, color, alignment, border, and background.

### 7. Preview

Switch to preview mode to see the rendered output with your data. The pagination, grouping, and expressions are all evaluated.

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+C` | Copy selected components |
| `Ctrl+X` | Cut selected components |
| `Ctrl+V` | Paste clipboard |
| `Delete` | Delete selected components or band |
| `Arrow keys` | Nudge selected components (1px) |
| `Shift+Arrow keys` | Nudge selected components (10px) |
| `Ctrl+D` | Duplicate selected components |
| `Ctrl+B` | Toggle bold on selected text |
| `Ctrl+I` | Toggle italic on selected text |
| `Ctrl+U` | Toggle underline on selected text |

## Text Style Library

The text style library (opened via the ribbon toolbar) lets you:

- Create, edit, duplicate, rename, and delete text styles.
- Set one style as the **default** (new text components use it automatically).
- See how many components reference each style.
- Apply styles to selected components.
- Unbind styles from components.

## Conditional Format Library

The conditional format library (opened via the ribbon toolbar) lets you:

- Create named conditional format rules.
- Define rules with expressions, operators, and style overrides.
- Apply formats to selected components.
- Manage format scope and priority.

## I18n / Localization

The designer supports Chinese and English UI. Use `DesignerI18nProvider` to configure the locale:

```tsx
import { DesignerI18nProvider, useDesignerI18n } from '@report-designer/designer';

<DesignerI18nProvider locale="en">
  <Designer ... />
</DesignerI18nProvider>
```
