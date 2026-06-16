# Events

Events allow you to execute custom JavaScript logic at specific points in the report rendering lifecycle. This guide covers the event system, event types, event context, and how to write event scripts.

## Event Lifecycle

Events fire at specific points during report rendering. The event system operates in three modes:

- **preview** — Events fire during browser preview.
- **print** — Events fire during browser print.
- **pdf** — Events fire during PDF export.

## Event Types by Owner

### Report-Level Events

| Event | When it fires |
| --- | --- |
| `beforePreview` | Before the report preview begins rendering. |
| `beforePrint` | Before the report print job begins. |
| `beforeRender` | Before the report rendering starts (both preview and print). |
| `afterRender` | After the report rendering completes. |
| `beforeData` | Before data processing begins. |
| `afterData` | After data processing completes. |

### Page-Level Events

| Event | When it fires |
| --- | --- |
| `beforePrint` | Before a specific page is printed. |
| `afterPrint` | After a specific page is printed. |

### Band-Level Events

| Event | When it fires |
| --- | --- |
| `beforePrint` | Before a band is rendered on a page. |
| `afterPrint` | After a band is rendered on a page. |
| `beforeRow` | Before a data row is processed in a data band. |
| `afterRow` | After a data row is processed in a data band. |

### Component-Level Events

| Event | When it fires |
| --- | --- |
| `getValue` | When the component's value is evaluated. |
| `beforePrint` | Before the component is rendered. |
| `afterPrint` | After the component is rendered. |

## Event Scripts

An event script is a JavaScript string executed in the event context:

```ts
interface EventScript {
  enabled: boolean;
  script: string;
}
```

### Setting Events in the Template

Events are stored in the template's `events` property at each level:

```ts
// Report-level events
template.events = {
  beforeRender: {
    enabled: true,
    script: 'log("Report rendering started");',
  },
  afterRender: {
    enabled: true,
    script: 'log("Report rendering completed. Total pages: " + TOTALPAGES());',
  },
};

// Band-level events
band.events = {
  beforePrint: {
    enabled: true,
    script: 'if (rowIndex % 2 === 0) { band.backgroundColor = "#f5f5f5"; }',
  },
  afterRow: {
    enabled: true,
    script: 'log("Row " + rowIndex + " processed");',
  },
};

// Component-level events
textComponent.events = {
  getValue: {
    enabled: true,
    script: 'value = row.amount > 1000 ? "VIP Customer" : "Standard Customer";',
  },
};
```

## Event Context

Event scripts run with an `EventContext` object that provides access to the report state:

| Property | Type | Description |
| --- | --- | --- |
| `mode` | `'preview' \| 'print' \| 'pdf'` | Current rendering mode. |
| `report` | `ReportTemplate` | The full report template. |
| `page` | `Page` | The current page being rendered. |
| `band` | `Band` | The current band being rendered. |
| `component` | `EventComponentAccessor` | Access to the current component. |
| `currentComponent` | `ReportComponent` | The component being processed. |
| `row` | `Record<string, unknown>` | The current data row (in a data band). |
| `rowIndex` | `number` | Current row index (0-based). |
| `dataSourceId` | `string` | ID of the active data source. |
| `data` | `Record<string, unknown>` | Current data context. |
| `parameters` | `Record<string, unknown>` | Report parameters. |
| `variables` | `Record<string, unknown>` | Custom variables you can read/write. |
| `state` | `Record<string, unknown>` | Persistent state across events. |
| `target` | `EventTargetState` | Event target metadata. |
| `log` | `EventLogCollector` | Event logging interface. |

## Event Context Methods

| Method | Description |
| --- | --- |
| `cancel()` | Cancel the current rendering operation. |
| `hide()` | Hide the current element (band/component). |
| `setValue(value)` | Set the value of the current component. |
| `getComponent(name)` | Get a component by name. |
| `setComponentProperty(name, path, value)` | Modify a component property dynamically. |
| `bindText(name, expression)` | Bind text content of a component. |

## Dynamic Component Creation

Events can dynamically create components during rendering:

```ts
// In a beforePrint event script:
createText({
  x: 10,
  y: 5,
  width: 100,
  height: 10,
  text: 'Dynamic text added via event',
  font: { size: 12, bold: true },
});

createImage({
  x: 10,
  y: 20,
  width: 50,
  height: 50,
  src: 'https://example.com/logo.png',
});

createBarcode({
  x: 10,
  y: 80,
  width: 60,
  height: 20,
  value: row.orderNumber,
  format: 'CODE128',
  showText: true,
});
```

## Event Logging

Use the `log` object to record information during event execution:

```ts
log.info("Processing row " + rowIndex);
log.warning("Field 'discount' is missing for row " + rowIndex);
log.error("Invalid amount value: " + row.amount);
```

Log entries appear in the `EventLogPanel` in the viewer, which helps debug event scripts.

## Event Editor

The designer provides a full Monaco-based event script editor:

- Syntax highlighting for JavaScript.
- Access to the event catalog and available properties.
- Validation of event scripts.
- Navigation from errors back to the event source.

### Opening the Event Editor

1. Select a band or component in the designer.
2. In the property panel, find the **Events** section.
3. Click the event you want to edit.
4. The editor opens with the current script content.

## Common Event Patterns

### Alternating Row Colors

```ts
// Band beforeRow event
band.backgroundColor = (rowIndex % 2 === 0) ? '#ffffff' : '#f5f5f5';
```

### Conditional Visibility

```ts
// Component beforePrint event
if (row.status !== 'completed') {
  hide();
}
```

### Dynamic Value Computation

```ts
// Text component getValue event
value = row.discount > 0
  ? FORMAT(row.amount * (1 - row.discount), '0.00')
  : FORMAT(row.amount, '0.00');
```

### Data Validation

```ts
// Band beforeRow event
if (!row.orderNumber) {
  log.error("Missing order number at row " + rowIndex);
  cancel();
}
```

### Page Header with Dynamic Content

```ts
// Page beforePrint event
setComponentProperty('pageTitle', 'text', 'Report: ' + parameters.reportName);
```

## Event Execution Limits

The event system has built-in protection against infinite loops:

- `maxEventCount` limits the total number of events that can fire during a single render.
- `dynamicCounters` track per-event-type firing counts.
- Exceeding the limit triggers an error in the event log.
