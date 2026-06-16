# Getting Started

This guide walks you through installing Report Designer, understanding its core concepts, and rendering your first report.

## What is Report Designer?

Report Designer is an embeddable React toolkit for building, previewing, and printing business documents. It consists of three npm packages:

| Package | Purpose |
| --- | --- |
| `@report-designer/core` | Template model, expression engine, pagination, layout, rendering, events, and shared runtime. Framework-agnostic — can run server-side or in the browser. |
| `@report-designer/designer` | React visual designer UI — canvas, ribbon toolbar, property panels, component palette, and report tree. |
| `@report-designer/viewer` | React preview component — DOM rendering, pagination display, browser print, PDF export, and Chrome silent-print bridge. |

## Prerequisites

- Node.js 18+ and pnpm
- React 19+ (for designer and viewer)
- Ant Design 6+ (for designer and viewer UI)
- Zustand 5+ (for designer state management)

### Peer Dependencies

The designer and viewer packages declare React, React DOM, Ant Design, and Zustand as peer dependencies. They are **not bundled** into the packages, so you must install them in your application:

```bash
pnpm add @report-designer/core @report-designer/designer @report-designer/viewer
pnpm add react react-dom antd zustand
```

If you only need the `core` package (e.g., for server-side report rendering), you do not need Ant Design or Zustand.

| Package | Required peer dependencies |
| --- | --- |
| `@report-designer/core` | — |
| `@report-designer/designer` | `react`, `react-dom`, `antd@^6`, `zustand@^5` |
| `@report-designer/viewer` | `react`, `react-dom`, `antd@^6` |

## Core Concepts

### Template

A `ReportTemplate` is the JSON representation of your report. It contains:

- **Pages** — each page has dimensions, margins, orientation, and bands.
- **Bands** — horizontal sections of a page (header, footer, data band, etc.).
- **Components** — visual elements placed inside bands (text, table, chart, barcode, etc.).
- **Data Sources** — automatically inferred JSON fields and array paths.
- **Styles** — reusable text style definitions.
- **Conditional Formats** — rule-based appearance changes.
- **Parameters** — input values that can be passed at render time.
- **Events** — scripts that run during the rendering lifecycle.

### Band System

Bands are the fundamental layout units. Each band has a type:

| Band Type | Purpose |
| --- | --- |
| `reportTitle` | Appears once at the start of the report. |
| `reportSummary` | Appears once at the end of the report. |
| `pageHeader` | Repeats at the top of every page (or based on `printOn` settings). |
| `pageFooter` | Repeats at the bottom of every page. |
| `header` | Section header — prints before a data band. |
| `footer` | Section footer — prints after a data band. |
| `groupHeader` | Group header — prints when a group key changes. |
| `groupFooter` | Group footer — prints at the end of a group. |
| `columnHeader` | Column header for multi-column layouts. |
| `columnFooter` | Column footer for multi-column layouts. |
| `data` | Iterates over data source rows. |
| `hierarchicalData` | Recursive data band for tree/hierarchical data. |
| `overlay` | Free-floating overlay band. |

### Component Types

Components are the visual building blocks:

| Type | Description |
| --- | --- |
| `text` | Single-line or multi-line text with formatting. |
| `richtext` | Rich text content (HTML/Tiptap format). |
| `image` | Image loaded from URL or data URI. |
| `table` | Structured table with rows, columns, and cell styling. |
| `chart` | Data visualization (line, bar, pie, scatter, radar, funnel, etc.). |
| `barcode` | Barcode (CODE128, EAN13, EAN8, UPC, CODE39, ITF14). |
| `qrcode` | QR code. |
| `checkbox` | Checkbox with optional label. |
| `pagenumber` | Page number display (`1`, `1/N`, `Page 1 of N`, etc.). |
| `datetime` | Current date/time display. |
| `subreport` | Embedded sub-report. |
| `panel` | Container for nested components. |
| `line` | Decorative line. |
| `shape` | Rectangle, ellipse, round rect, triangle. |

### Expressions

Expressions are string-based formulas used to compute values dynamically. They support:

- Field references: `{field.path}`
- Arithmetic: `+`, `-`, `*`, `/`
- Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Logical: `&&`, `||`, `!`
- Built-in functions: `IF()`, `SUM()`, `AVG()`, `COUNT()`, `ROUND()`, `FORMAT()`, etc.

See the [Expressions](./expressions.md) guide for the full reference.

## Quick Start

### 1. Install Dependencies

```bash
pnpm add @report-designer/core @report-designer/designer @report-designer/viewer
pnpm add react react-dom antd zustand
```

### 2. Create a Report Template

```ts
import { createDefaultTemplate, type ReportTemplate } from '@report-designer/core';

const template: ReportTemplate = createDefaultTemplate('My First Report');

// Data sources are inferred from the data prop at design/render time.
// You can keep template.dataSources empty for a new template.
template.dataSources = [];
```

### 3. Use the Designer

```tsx
import { useState } from 'react';
import type { ReportTemplate } from '@report-designer/core';
import { Designer } from '@report-designer/designer';

function MyDesigner({ template, data }: { template: ReportTemplate; data: unknown }) {
  const [currentTemplate, setCurrentTemplate] = useState(template);

  return (
    <Designer
      template={currentTemplate}
      data={data}
      onTemplateChange={setCurrentTemplate}
    />
  );
}
```

### 4. Use the Viewer

```tsx
import { Viewer } from '@report-designer/viewer';
import type { ReportTemplate } from '@report-designer/core';

function MyViewer({ template, data }: { template: ReportTemplate; data: unknown }) {
  return <Viewer template={template} data={data} />;
}
```

### 5. Full Workspace

```tsx
import { useState } from 'react';
import { Button, Tabs } from 'antd';
import type { ReportTemplate } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { Designer } from '@report-designer/designer';
import { Viewer } from '@report-designer/viewer';

const sampleData = {
  orderNo: 'ORD-001',
  customer: { name: 'Alice' },
  items: [
    { product: { name: 'Cloud Service' }, amount: 1200, orderDate: '2026-01-15' },
    { product: { name: 'Implementation' }, amount: 850, orderDate: '2026-01-16' },
  ],
};

function ReportWorkspace() {
  const [template, setTemplate] = useState<ReportTemplate>(() => createDefaultTemplate('Sample Report'));
  const [mode, setMode] = useState<'preview' | 'designer'>('preview');

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px', display: 'flex', gap: '8px' }}>
        <Button onClick={() => setMode('designer')}>Designer</Button>
        <Button onClick={() => setMode('preview')}>Preview</Button>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {mode === 'designer' ? (
          <Designer template={template} data={sampleData} onTemplateChange={setTemplate} />
        ) : (
          <Viewer template={template} data={sampleData} />
        )}
      </div>
    </div>
  );
}
```

## Next Steps

- Learn about the [Designer](./designer.md) interface and workflow.
- Understand [Data Binding](./data-binding.md) to connect your reports to real data.
- Explore [Expressions](./expressions.md) for dynamic calculations.
- Set up [Events](./events.md) for custom rendering logic.
- Learn about [Preview and Print](./preview-and-print.md) workflows.
