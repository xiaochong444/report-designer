# Event Log Operations Design

## Goal

Make the viewer event log panel usable for report script debugging by adding level filtering, clearing, and JSON export hooks.

## Scope

- Add an event level filter with `All`, `Info`, `Warning`, and `Error`.
- Export the currently filtered log entries through a host callback.
- Clear the current viewer log list through a host callback and immediately empty the panel.
- Keep the feature inside the viewer package. Event runtime semantics, script execution, and designer event editing stay unchanged.

## Data Flow

`Viewer` renders a `RenderDocument` and receives `document.eventLogs`. The panel owns only the filter state. `Viewer` owns a lightweight cleared flag so a clear action can hide derived render logs until the next rendered document is produced.

## API

`Viewer` accepts:

- `onEventLogsClear?: () => void`
- `onEventLogsExport?: (logs: EventLogEntry[]) => void`

`EventLogPanel` accepts matching optional callbacks:

- `onClear?: () => void`
- `onExport?: (logs: EventLogEntry[]) => void`

The export callback receives the filtered entries exactly as displayed.

## UI

The drawer keeps its existing title, log list, severity tags, and open-event button. A compact toolbar appears above the list with radio-button filters and icon buttons for export and clear. Export is disabled when the filtered list is empty; clear is disabled when no logs exist.

## Testing

The viewer event log panel test covers:

- Existing log rendering and error line location.
- Existing event navigation callback.
- Filtering to error logs.
- Exporting filtered entries.
- Clearing logs through the viewer callback.

## Self Review

- No placeholders remain.
- Scope is intentionally limited to viewer log operations.
- No event runtime behavior is changed.
- Ant Design 6 APIs are used without deprecated props.
