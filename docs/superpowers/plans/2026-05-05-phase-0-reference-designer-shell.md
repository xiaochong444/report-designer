# Phase 0 Reference Designer Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the rough designer shell with a reference-style desktop report designer layout.

**Architecture:** This phase changes only designer presentation and UI state. It introduces a shell/ribbon/panel/canvas/status structure while preserving the existing template model and store actions.

**Tech Stack:** React 19, Ant Design 6, Zustand, TypeScript, existing `@report-designer/designer` package.

---

## File Structure

- Create: `packages/designer/src/components/shell/DesignerShell.tsx`
- Create: `packages/designer/src/components/shell/DesignerStatusBar.tsx`
- Create: `packages/designer/src/components/ribbon/the reference designerRibbon.tsx`
- Create: `packages/designer/src/components/panels/the reference designerLeftPanel.tsx`
- Create: `packages/designer/src/components/panels/the reference designerPropertyGrid.tsx`
- Create: `packages/designer/src/components/canvas/DesignerCanvasFrame.tsx`
- Create: `packages/designer/src/styles/designer-shell.css`
- Modify: `packages/designer/src/components/Designer.tsx`
- Modify: `packages/designer/src/index.ts`
- Test: `packages/designer/src/__tests__/phase-0-designer-shell.test.tsx`

## Tasks

### Task 1: Lock the Existing Designer Contract

- [ ] **Step 1: Write the shell contract test**

Create `packages/designer/src/__tests__/phase-0-designer-shell.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Designer } from '../components/Designer';

describe('Phase 0 the reference designer designer shell', () => {
  it('renders reference-style shell regions', () => {
    render(<Designer />);

    expect(screen.getByTestId('designer-quick-access')).toBeTruthy();
    expect(screen.getByTestId('designer-ribbon')).toBeTruthy();
    expect(screen.getByTestId('designer-left-panel')).toBeTruthy();
    expect(screen.getByTestId('designer-canvas-frame')).toBeTruthy();
    expect(screen.getByTestId('designer-property-grid')).toBeTruthy();
    expect(screen.getByTestId('designer-status-bar')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `pnpm --filter @report-designer/designer test -- phase-0-designer-shell.test.tsx`

Expected: FAIL because the new test ids do not exist.

### Task 2: Add the Shell Components

- [ ] **Step 1: Create `DesignerShell.tsx`**

Create a component with five regions: quick access, ribbon, left panel, canvas, property grid, status bar. Use CSS classes rather than inline layout for the shell.

- [ ] **Step 2: Create `the reference designerRibbon.tsx`**

Implement tab-like command groups: Home, Insert, Page, Layout, Preview. For this phase commands call existing toolbar/store operations where available. Commands whose backing capability belongs to Phase 1 through Phase 6 must be visible with disabled state and a tooltip naming the required phase, for example `Requires Phase 3 pagination`.

- [ ] **Step 3: Create `the reference designerLeftPanel.tsx`**

Wrap existing Palette, Data Dictionary, and Report Tree behavior into a left tab rail. Preserve existing drag/drop behavior from `LeftPanel.tsx`.

- [ ] **Step 4: Create `the reference designerPropertyGrid.tsx`**

Wrap existing `PropertyEditor` in a property-grid surface with compact section styling and a header that shows the selected object type.

- [ ] **Step 5: Create `DesignerCanvasFrame.tsx`**

Wrap existing `Canvas` in a reference-style canvas frame: horizontal ruler slot, vertical ruler slot, neutral workspace, page shadow, and bottom zoom/status affordance.

### Task 3: Wire the New Shell

- [ ] **Step 1: Modify `Designer.tsx`**

Replace the current Ant Design layout with `DesignerShell`, passing the current template/data behavior through unchanged.

- [ ] **Step 2: Compose existing components without deleting them**

Do not delete `RibbonToolbar.tsx`, `LeftPanel.tsx`, `PropertyEditor.tsx`, or `Canvas.tsx` in this phase. The new shell composes them through wrapper components, and Phase 5 replaces the wrappers with workflow-specific panels.

### Task 4: Add Visual Styling

- [ ] **Step 1: Create `designer-shell.css`**

Use a desktop-tool palette:

```css
:root {
  --rd-bg: #eef1f5;
  --rd-surface: #ffffff;
  --rd-border: #cfd6df;
  --rd-border-strong: #aeb8c5;
  --rd-command-bg: #f8fafc;
  --rd-command-hover: #e8f1ff;
  --rd-accent: #2f78d4;
  --rd-text: #20242a;
  --rd-muted: #6b7280;
}
```

Layout requirements:

- Quick access height: 30px.
- Ribbon height: 92px.
- Left panel width: 270px.
- Property grid width: 310px.
- Status bar height: 26px.
- Canvas workspace fills the remaining space.

- [ ] **Step 2: Import the stylesheet**

Import `../styles/designer-shell.css` from `DesignerShell.tsx` or `Designer.tsx`.

### Task 5: Verify

- [ ] **Step 1: Run designer tests**

Run: `pnpm --filter @report-designer/designer test -- phase-0-designer-shell.test.tsx`

Expected: PASS.

- [ ] **Step 2: Run type check**

Run: `pnpm --filter @report-designer/designer build`

Expected: PASS.

- [ ] **Step 3: Browser smoke check**

Run: `pnpm --filter @report-designer/example dev`

Open the local Vite URL. Confirm the first screen is the designer itself with ribbon, left panel, central canvas, right properties, and status bar. No hero page, card-heavy layout, or marketing UI should appear.

- [ ] **Step 4: Commit**

```bash
git add packages/designer/src
git commit -m "feat(designer): 调整为reference-designer风格设计器壳层"
```
