# Templates

Templates are the JSON definition of a report. This guide covers template structure, versioning, validation, serialization, and management patterns.

## Template Structure

A `ReportTemplate` is the root object:

```ts
interface ReportTemplate {
  id: string;                        // Unique template identifier
  name: string;                      // Display name
  version: '2.0';                    // Template schema version
  pages: Page[];                     // Pages in the report
  dataSources: DataSource[];         // Data source definitions
  styles: ReportStyle[];             // Text style library
  conditionalFormats: ConditionalFormat[]; // Conditional format rules
  parameters: ReportParameter[];     // Input parameters
  fonts?: ReportFont[];              // Custom font definitions
  events?: EventMap<ReportEventName>; // Report-level event scripts
}
```

## Creating Templates

### Using the Default Template Factory

```ts
import { createDefaultTemplate } from '@report-designer/core';

const template = createDefaultTemplate('Sales Report');
```

This creates a template with:
- A single A4 portrait page.
- Default bands: `reportTitle`, `pageHeader`, `data`, `pageFooter`.
- Default text styles (Normal, Title, Header, Data, Footer, Group).
- Default fonts.

### Building from Scratch

```ts
import type { ReportTemplate, Page, Band } from '@report-designer/core';

const template: ReportTemplate = {
  id: 'template_001',
  name: 'Custom Report',
  version: '2.0',
  pages: [{
    id: 'page_001',
    name: 'Page 1',
    width: 210,
    height: 297,
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    orientation: 'portrait',
    bands: [],
  }],
  dataSources: [],
  styles: [],
  conditionalFormats: [],
  parameters: [],
};
```

## Template Version

The current schema version is `'2.0'`:

```ts
template.version = '2.0';
```

When loading a template JSON from storage, use `normalizeTemplate()` to fill runtime defaults before editing or rendering:

```ts
import { normalizeTemplate } from '@report-designer/core';

const normalized = normalizeTemplate(loadedTemplate);
```

## Template Validation

Validate a template before saving or rendering:

```ts
import { validateTemplate } from '@report-designer/core';

const result = validateTemplate(template, { strictPrintableArea: true });

if (!result.valid) {
  for (const error of result.errors) {
    console.error(`${error.path}: ${error.message}`);
  }
}
```

### Validation Rules

| Rule | Description |
| --- | --- |
| At least one page | Template must have a page. |
| Unique IDs | All IDs (template, pages, bands, components, data sources, styles, formats, parameters) must be unique. |
| Valid dimensions | Page width/height must be positive. Component dimensions must be non-negative. |
| Printable area | Components must fit within the page margins and band height (when `strictPrintableArea` is enabled). |
| Data band references | Data bands must reference a valid data source. |
| Group header/footer pairing | Group footers must have a preceding matching group header. |
| Group header expression | Group headers must have a `conditionExpression`. |

## Serialization

### Save Template

Templates are plain JSON objects. Serialize them for storage:

```ts
// Save to localStorage
localStorage.setItem('report-template', JSON.stringify(template));

// Save to server
await fetch('/api/templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(template),
});
```

### Load Template

```ts
// Load from localStorage
const saved = localStorage.getItem('report-template');
const template: ReportTemplate = JSON.parse(saved);

// Normalize to ensure runtime defaults are filled
const normalized = normalizeTemplate(template);
```

## Template Management Patterns

### Template Catalog

Maintain a catalog of available templates:

```ts
interface TemplateCatalog {
  id: string;
  name: string;
  description: string;
  category: string;
  template: ReportTemplate;
  thumbnail?: string;
}
```

### Template Parameters

Parameters allow runtime customization:

```ts
template.parameters = [
  { id: 'p1', name: 'startDate', type: 'date', defaultValue: '2026-01-01' },
  { id: 'p2', name: 'endDate', type: 'date', defaultValue: '2026-12-31' },
  { id: 'p3', name: 'companyName', type: 'string', defaultValue: 'Acme Corp' },
];
```

Parameters are accessible in expressions as `parameters.companyName` and passed to the Viewer at render time:

```tsx
<Viewer
  template={template}
  data={runtimeData}
  parameters={{ startDate: '2026-01-01', endDate: '2026-06-30', companyName: 'Acme Corp' }}
/>
```

### Subreports

Embed one template inside another:

```ts
const subreportComponent: SubreportComponent = {
  id: 'subreport_001',
  type: 'subreport',
  templateUrl: '/api/templates/invoice-detail',
  parameters: {
    invoiceId: 'currentInvoice.id',
  },
  x: 0, y: 0, width: 170, height: 50,
};
```

## Page Setup

### Page Dimensions

Common page sizes (in mm):

| Size | Width | Height |
| --- | --- | --- |
| A4 | 210 | 297 |
| A3 | 297 | 420 |
| Letter | 215.9 | 279.4 |
| Legal | 215.9 | 355.6 |
| A5 | 148 | 210 |

### Page Orientation

```ts
page.orientation = 'portrait';  // width < height
page.orientation = 'landscape'; // width > height
```

### Watermark

```ts
page.watermark = {
  enabled: true,
  text: 'CONFIDENTIAL',
  fontFamily: 'Arial',
  fontSize: 48,
  color: '#8c8c8c',
  opacity: 0.18,
  angle: -35,
  horizontalAlign: 'center',
  verticalAlign: 'middle',
  showBehind: true,
};
```

### Page Border

```ts
page.pageBorder = {
  enabled: true,
  style: 'solid',
  width: 0.2,
  color: '#000000',
  sides: { top: true, right: true, bottom: true, left: true },
  offset: 0,
};
```

## Multi-Page Reports

Add multiple pages to a template:

```ts
template.pages = [
  { /* Cover page */ },
  { /* Data pages */ },
  { /* Summary page */ },
];
```

Each page can have different dimensions, orientations, and band configurations.
