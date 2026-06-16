# FAQ

Common questions about Report Designer.

## General

### Is Report Designer free?

Yes. Report Designer is open-source and available under its repository license.

### What browsers are supported?

The designer and viewer work in modern browsers: Chrome, Firefox, Safari, and Edge. Internet Explorer is not supported.

### Can I use Report Designer without React?

The `@report-designer/core` package is framework-agnostic and can be used in any JavaScript/TypeScript project, including server-side Node.js. The designer and viewer packages require React.

### Can I use Report Designer server-side?

Yes. `@report-designer/core` can run in Node.js for template validation, data processing, and server-side rendering. You would need to handle DOM rendering separately for the viewer.

## Data

### What data source types are supported?

Currently, only **JSON data sources** are supported. The data is passed as a JavaScript object at render time. Future versions may add REST API, SQL, and other data source types.

### Can I connect to a database directly?

Not directly. Load data from your database into a JSON object on the server, then pass it to the Viewer at render time.

### How do I handle large datasets?

For large datasets, consider:
- Filtering data server-side before passing to the renderer.
- Using pagination in your application and rendering one page at a time.
- Using server-side rendering instead of browser rendering.

### Can I use nested/hierarchical data?

Yes. Use hierarchical data bands (`hierarchicalData` band type) with a `childrenField` configuration, or bind normal data bands to inferred array paths such as `items` or `orders.items`.

## Styling

### How do I add custom fonts?

Define custom fonts in the template's `fonts` array:

```ts
template.fonts = [
  {
    id: 'font_001',
    name: 'Noto Sans SC',
    family: 'Noto Sans SC',
    source: {
      url: '/fonts/NotoSansSC-Regular.woff2',
      format: 'woff2',
    },
  },
];
```

### How do I use custom CSS?

The designer and viewer use Ant Design components. You can override styles using CSS custom properties or Ant Design's theme configuration.

## Printing

### Why does my Chinese text not show in PDF?

Chinese characters require embedded fonts in the PDF. Provide font bytes through the `PdfExportOptions.fontBytes` or `PdfExportOptions.fontBytesByFamily` options.

### Can I print without the browser dialog?

Yes, using the Chrome extension silent printing bridge. See the [Chrome Extension](./chrome-extension.md) and [Silent Printing](./silent-printing.md) guides.

### Why does my printed output look different from the preview?

Browser print rendering may differ slightly from screen rendering due to:
- Printer DPI vs. screen DPI differences.
- CSS print media query handling.
- Printer driver margins.

Ensure your printer settings match the template page size and margins.

## Performance

### How many pages can Report Designer handle?

Performance depends on:
- Number of components per page.
- Complexity of expressions and events.
- Data size.
- Browser capabilities.

For very large reports (hundreds of pages), consider server-side rendering.

### Why is the designer slow with many components?

Large numbers of components on a single page can slow down rendering. Consider:
- Splitting content across multiple pages.
- Using subreports for complex sections.
- Simplifying event scripts.

## Integration

### How do I save templates?

Templates are plain JSON. You can:
- Save to a database (recommended for production).
- Save to localStorage (for development/testing).
- Save as files on disk.

### How do I load templates from a server?

```ts
const response = await fetch('/api/templates/' + templateId);
const template: ReportTemplate = await response.json();
```

### Can I customize the designer UI?

Yes. The designer provides composable shell components (`DesignerShell`, `DesignerRibbon`, `DesignerLeftPanel`, `DesignerPropertyPanel`, `DesignerCanvasFrame`) that you can arrange in your own layout.

### Can I add custom components?

The current component types are fixed. However, you can:
- Use the `panel` component to nest components.
- Use events to dynamically modify component properties at render time.
- Extend the expression engine with custom functions.

## Troubleshooting

### My expression doesn't evaluate correctly

Check:
- Field references use braces, for example `{customer.name}` or `{items.amount}`.
- String literals use single or double quotes.
- Function names are case-insensitive but arguments are case-sensitive.
- Use the expression editor's validation to catch syntax errors.

### My data band shows no rows

Check:
- The band is bound to `root` or to an inferred array path such as `items`.
- The runtime JSON contains that array path.
- The array is not empty.
- Filter expressions are not excluding all rows.

### My chart doesn't render

Check:
- The chart has a valid `chartType`.
- The binding has a valid `dataSourceId`.
- The binding has at least one `dimension` and one `measure`.
- The inferred `root` field tree contains the referenced fields.

### The designer crashes on load

Check:
- The template JSON is valid.
- All required fields are present (use `normalizeTemplate` to fill defaults).
- There are no duplicate IDs in the template.
- Run `validateTemplate` to check for structural errors.
