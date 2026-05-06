# Phase 16 Implementation Plan

1. Update report-tree selection semantics so band selection clears component selection.
2. Add canvas-level band click selection and preserve component interactions.
3. Rebuild the `Dictionary` tab as a compact searchable explorer tree.
4. Rebuild `ExpressionEditor` into a three-column searchable shell.
5. Add regression tests for:
   - band selection from the report tree
   - dictionary search filtering
   - expression editor category rail and insertions
6. Run:
   - `pnpm --filter @report-designer/designer build`
   - `pnpm --filter @report-designer/designer test`
   - `pnpm --filter @report-designer/example test`
   - `pnpm --filter @report-designer/example build`
7. Verify in the running example app that:
   - dictionary search works
   - clicking a band shows `Band` properties
