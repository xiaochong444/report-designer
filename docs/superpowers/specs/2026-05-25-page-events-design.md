# Page Events Design

## Goal

Add page-level event support so report pages can run script logic during render and can be edited from the page property panel.

## Scope

- Add `beforePrint` and `afterPrint` events to pages.
- Run page events for every emitted render page.
- Add page owner metadata to event logs.
- Add a page event editor entry in the page property panel.
- Keep report, Band, and component event behavior unchanged.

## Runtime Behavior

Each new render page runs `beforePrint` with `ctx.page` and target owner `{ ownerType: 'page', ownerId: page.id }`. After overlay and footer bands have been appended for the page, `afterPrint` runs with the same page context.

Page events currently log and mutate through the existing event context. Canceling or hiding a page is not treated as a pagination control in this stage because page skipping requires a larger pagination contract.

## Designer Behavior

The page property panel exposes two clear event actions:

- `Edit Page Events`
- `Edit Report Events`

The shared event editor receives `targetType="page"` for page events and stores scripts on `Page.events`.

## Testing

- Core test verifies page `beforePrint` and `afterPrint` scripts run and write page-owned event logs.
- Designer test verifies the page property panel opens the page event editor and persists a page event script.

## Self Review

- No placeholders remain.
- Page events are deliberately limited to print lifecycle events.
- Existing report, Band, and component event APIs remain compatible.
- Ant Design 6 deprecated props are avoided.
