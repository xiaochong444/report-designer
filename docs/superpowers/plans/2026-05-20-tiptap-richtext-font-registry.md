# Tiptap Rich Text And Font Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add report-level font registration and upgrade rich text to in-canvas Tiptap editing while keeping current HTML rendering compatible.

**Architecture:** Core owns font registry types, defaults, CSS generation, and rich HTML sanitization. Designer consumes the registry in text font controls and rich text edit mode. Viewer and print consume the same sanitizer and font CSS so canvas, preview, and print remain aligned.

**Tech Stack:** TypeScript, React 19, AntD 6, Tiptap 3.23.5, Vitest, Playwright.

---

## File Structure

- Modify `packages/core/src/template-model/types.ts`
  - Add `ReportFont`, `RichTextDocument`, `fonts` on `ReportTemplate`, and `document` on `RichtextComponent`.
- Modify `packages/core/src/template-model/normalize-template.ts`
  - Normalize missing `fonts`.
- Create `packages/core/src/fonts/index.ts`
  - Default font list, normalization, option generation, CSS generation.
- Create `packages/core/src/rich-text/index.ts`
  - Shared rich HTML sanitizer.
- Modify `packages/core/src/index.ts`
  - Export new font and rich text helpers.
- Create `packages/core/__tests__/phase-26-font-registry-richtext.test.ts`
  - Core tests for fonts and sanitizer.
- Modify `packages/designer/package.json`
  - Add Tiptap dependencies.
- Create `packages/designer/src/richtext/FontSize.ts`
  - Local Tiptap font size extension.
- Create `packages/designer/src/richtext/RichTextInlineEditor.tsx`
  - Tiptap editor and toolbar.
- Modify `packages/designer/src/components/Canvas.tsx`
  - Use rich text editor on double-click and shared sanitizer/font CSS.
- Modify `packages/designer/src/components/PropertyEditor.tsx`
  - Use report font registry in text font selector.
- Modify `packages/designer/src/components/panels/DesignerPropertyPanel.tsx`
  - Add report font registry property group.
- Create `packages/designer/src/__tests__/phase-26-tiptap-richtext-fonts.test.tsx`
  - Designer tests for font selectors and edit mode.
- Modify `packages/viewer/src/renderers/dom/renderComponent.tsx`
  - Use shared sanitizer.
- Modify `packages/viewer/src/print/print-frame.ts`
  - Use shared sanitizer and inject report font CSS.
- Create or extend viewer tests for sanitizer and font CSS.

---

## Task 1: Core Font Registry And Rich HTML Sanitizer

**Files:**
- Modify: `packages/core/src/template-model/types.ts`
- Modify: `packages/core/src/template-model/normalize-template.ts`
- Modify: `packages/core/src/index.ts`
- Create: `packages/core/src/fonts/index.ts`
- Create: `packages/core/src/rich-text/index.ts`
- Test: `packages/core/__tests__/phase-26-font-registry-richtext.test.ts`

- [ ] **Step 1: Write failing core tests**

Create `packages/core/__tests__/phase-26-font-registry-richtext.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  buildReportFontCss,
  DEFAULT_REPORT_FONTS,
  getReportFontOptions,
  normalizeReportFonts,
  normalizeTemplate,
  sanitizeRichHtml,
  type ReportTemplate,
} from '../src';

const template = {
  id: 'font-report',
  name: 'Font Report',
  version: '2.0',
  pages: [],
  dataSources: [],
  styles: [],
  conditionalFormats: [],
  parameters: [],
} as ReportTemplate;

describe('phase 26 font registry and rich text', () => {
  it('normalizes missing report fonts with Chinese built-in fonts', () => {
    const normalized = normalizeTemplate(template);

    expect(normalized.fonts.map(font => font.family)).toEqual(
      expect.arrayContaining(['Microsoft YaHei', 'SimSun', 'SimHei', 'KaiTi', 'FangSong']),
    );
    expect(normalized.fonts.every(font => font.id && font.name && font.family)).toBe(true);
  });

  it('keeps custom fonts and generates font-face CSS', () => {
    const fonts = normalizeReportFonts([
      ...DEFAULT_REPORT_FONTS,
      {
        id: 'brand-song',
        name: 'Brand Song',
        family: 'BrandSong',
        fallback: 'serif',
        source: { url: '/fonts/brand-song.woff2', format: 'woff2' },
      },
    ]);

    expect(getReportFontOptions(fonts)).toContainEqual({
      value: 'BrandSong',
      label: 'Brand Song',
      fontFamily: 'BrandSong, serif',
      builtin: false,
    });
    expect(buildReportFontCss(fonts)).toContain("@font-face");
    expect(buildReportFontCss(fonts)).toContain("font-family: 'BrandSong'");
    expect(buildReportFontCss(fonts)).toContain("url('/fonts/brand-song.woff2') format('woff2')");
  });

  it('sanitizes rich html while keeping supported inline styles', () => {
    const html = sanitizeRichHtml(
      '<p onclick="bad()" style="font-family:SimSun;font-size:14px;color:#123;background-color:#fff;text-align:center;position:absolute">Hello <script>alert(1)</script><a href="javascript:bad()">bad</a><a href="https://example.com">ok</a></p>',
    );

    expect(html).toContain('font-family: SimSun');
    expect(html).toContain('font-size: 14px');
    expect(html).toContain('color: #123');
    expect(html).toContain('background-color: #fff');
    expect(html).toContain('text-align: center');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('script');
    expect(html).not.toContain('position');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('href="https://example.com"');
  });
});
```

- [ ] **Step 2: Run core test and verify RED**

Run:

```powershell
pnpm --filter @report-designer/core test -- __tests__/phase-26-font-registry-richtext.test.ts
```

Expected: fail because font helpers and sanitizer are not exported.

- [ ] **Step 3: Add core types**

In `packages/core/src/template-model/types.ts`, add:

```ts
export interface ReportFont {
  id: string;
  name: string;
  family: string;
  fallback?: string;
  source?: {
    url?: string;
    dataUrl?: string;
    format?: 'woff2' | 'woff' | 'truetype' | 'opentype';
  };
  builtin?: boolean;
}

export type RichTextDocument = Record<string, unknown>;
```

Update `RichtextComponent`:

```ts
export interface RichtextComponent extends ReportComponent {
  type: 'richtext';
  html: Expression;
  document?: RichTextDocument;
}
```

Update `ReportTemplate`:

```ts
fonts: ReportFont[];
```

- [ ] **Step 4: Implement font helpers**

Create `packages/core/src/fonts/index.ts` with `DEFAULT_REPORT_FONTS`, `normalizeReportFonts`, `getReportFontOptions`, and `buildReportFontCss`.

- [ ] **Step 5: Implement shared sanitizer**

Create `packages/core/src/rich-text/index.ts` with `sanitizeRichHtml`. Use `DOMParser` when available and a conservative string fallback for non-DOM environments.

- [ ] **Step 6: Wire normalization and exports**

Update `normalizeTemplate` so missing `fonts` becomes `normalizeReportFonts(template.fonts)`.

Update `packages/core/src/index.ts`:

```ts
export * from './fonts';
export * from './rich-text';
```

- [ ] **Step 7: Run core verification**

Run:

```powershell
pnpm --filter @report-designer/core test -- __tests__/phase-26-font-registry-richtext.test.ts
pnpm --filter @report-designer/core build
```

Expected: tests pass and build succeeds.

- [ ] **Step 8: Commit**

```powershell
git add packages/core/src packages/core/__tests__/phase-26-font-registry-richtext.test.ts
git commit -m "feat(core): 增加报表字体注册与富文本清洗"
```

---

## Task 2: Designer Font Registry Controls

**Files:**
- Modify: `packages/designer/src/components/PropertyEditor.tsx`
- Modify: `packages/designer/src/components/panels/DesignerPropertyPanel.tsx`
- Test: `packages/designer/src/__tests__/phase-26-tiptap-richtext-fonts.test.tsx`

- [ ] **Step 1: Write failing designer font tests**

Create a test that loads a template with custom `fonts`, renders `PropertyEditor`, and expects the text font selector to show built-in Chinese fonts and the custom font. Add a second test for `DesignerPropertyPanel` that shows a font registry group and permits adding a font row.

- [ ] **Step 2: Verify RED**

Run:

```powershell
pnpm --filter @report-designer/designer test -- src/__tests__/phase-26-tiptap-richtext-fonts.test.tsx
```

Expected: fail because selectors still use hardcoded font options and the page panel has no font group.

- [ ] **Step 3: Use report font options in `PropertyEditor.tsx`**

Read `template.fonts`, call `getReportFontOptions`, and replace the hardcoded font list with these options.

- [ ] **Step 4: Add report font group in page properties**

Add a `fonts` collapse section to `PageProperties`. Use `updateTemplate` to add or remove non-built-in fonts. Built-in fonts render disabled delete buttons.

- [ ] **Step 5: Run designer verification**

Run:

```powershell
pnpm --filter @report-designer/designer test -- src/__tests__/phase-26-tiptap-richtext-fonts.test.tsx
pnpm --filter @report-designer/designer build
```

Expected: tests pass and build succeeds.

- [ ] **Step 6: Commit**

```powershell
git add packages/designer/src
git commit -m "feat(designer): 增加报表字体注册属性"
```

---

## Task 3: Tiptap Rich Text Inline Editor

**Files:**
- Modify: `packages/designer/package.json`
- Create: `packages/designer/src/richtext/FontSize.ts`
- Create: `packages/designer/src/richtext/RichTextInlineEditor.tsx`
- Modify: `packages/designer/src/components/Canvas.tsx`
- Test: `packages/designer/src/__tests__/phase-26-tiptap-richtext-fonts.test.tsx`

- [ ] **Step 1: Install dependencies**

Run:

```powershell
pnpm --filter @report-designer/designer add @tiptap/react@3.23.5 @tiptap/starter-kit@3.23.5 @tiptap/extension-text-style@3.23.5 @tiptap/extension-color@3.23.5 @tiptap/extension-font-family@3.23.5 @tiptap/extension-text-align@3.23.5 @tiptap/extension-underline@3.23.5 @tiptap/extension-link@3.23.5 @tiptap/extension-placeholder@3.23.5
```

- [ ] **Step 2: Write failing rich text edit test**

Extend `phase-26-tiptap-richtext-fonts.test.tsx`:

```ts
it('opens rich text inline edit mode and saves html plus document', async () => {
  // render Canvas with a richtext component
  // double click the richtext content
  // type text through the editor surface
  // trigger save
  // expect updateComponent payload to include html and document
});
```

Expected initial failure: no Tiptap editor surface exists.

- [ ] **Step 3: Add `FontSize` extension**

Create `packages/designer/src/richtext/FontSize.ts` with a TextStyle global attribute named `fontSize`.

- [ ] **Step 4: Add `RichTextInlineEditor`**

Create a component with:

- `valueHtml`
- `valueDocument`
- `fonts`
- `onSave`
- `onCancel`

Use Tiptap extensions listed in the spec, toolbar buttons, and `sanitizeRichHtml(editor.getHTML())` before save.

- [ ] **Step 5: Wire Canvas double-click**

Change `Canvas.tsx` so `component.type === 'richtext'` double-click starts rich text edit mode. Save calls `onUpdateComponent(currentPageId, band.id, comp.id, { html, document }, previousSnapshot)`.

- [ ] **Step 6: Run designer verification**

Run:

```powershell
pnpm --filter @report-designer/designer test -- src/__tests__/phase-26-tiptap-richtext-fonts.test.tsx src/__tests__/phase-18-component-properties-and-drag.test.tsx
pnpm --filter @report-designer/designer build
```

Expected: tests pass and build succeeds.

- [ ] **Step 7: Commit**

```powershell
git add packages/designer package.json pnpm-lock.yaml
git commit -m "feat(designer): 增加 Tiptap 富文本就地编辑"
```

---

## Task 4: Viewer And Print Font Parity

**Files:**
- Modify: `packages/viewer/src/renderers/dom/renderComponent.tsx`
- Modify: `packages/viewer/src/print/print-frame.ts`
- Test: viewer rich text and print tests

- [ ] **Step 1: Write failing viewer/print tests**

Extend existing rich text tests so unsafe HTML is sanitized consistently and print frame includes custom `@font-face` CSS from `template.fonts`.

- [ ] **Step 2: Verify RED**

Run:

```powershell
pnpm --filter @report-designer/viewer test -- src/__tests__/phase-4-viewer-renderdocument.test.tsx src/__tests__/phase-4-print-frame.test.ts
```

Expected: fail because viewer and print still use local sanitizer and print has no font CSS.

- [ ] **Step 3: Use core sanitizer and font CSS**

Replace local sanitizer calls with `sanitizeRichHtml` from core. Add `buildReportFontCss(template.fonts)` output to print frame document style.

- [ ] **Step 4: Run viewer verification**

Run:

```powershell
pnpm --filter @report-designer/viewer test -- src/__tests__/phase-4-viewer-renderdocument.test.tsx src/__tests__/phase-4-print-frame.test.ts
pnpm --filter @report-designer/viewer build
```

Expected: tests pass and build succeeds.

- [ ] **Step 5: Commit**

```powershell
git add packages/viewer/src
git commit -m "feat(viewer): 统一富文本清洗与字体样式"
```

---

## Task 5: End-To-End Verification

**Files:**
- No production files unless verification reveals bugs.

- [ ] **Step 1: Run focused tests**

```powershell
pnpm --filter @report-designer/core test -- __tests__/phase-26-font-registry-richtext.test.ts
pnpm --filter @report-designer/designer test -- src/__tests__/phase-26-tiptap-richtext-fonts.test.tsx src/__tests__/phase-18-component-properties-and-drag.test.tsx
pnpm --filter @report-designer/viewer test -- src/__tests__/phase-4-viewer-renderdocument.test.tsx src/__tests__/phase-4-print-frame.test.ts
```

- [ ] **Step 2: Run builds**

```powershell
pnpm --filter @report-designer/core build
pnpm --filter @report-designer/designer build
pnpm --filter @report-designer/viewer build
pnpm build
```

If `pnpm build` changes `packages/example/dist/index.html`, restore it:

```powershell
git restore -- packages/example/dist/index.html
```

- [ ] **Step 3: Run forbidden text scan**

```powershell
$pattern = @('competitor-product-name', '\bV' + '1\b', '\bV' + '2\b', 'v' + '1-', 'v' + '2-', 'leg' + 'acy') -join '|'
rg -n $pattern docs packages --glob "!**/node_modules/**" --glob "!**/dist/**"
```

Expected: exit code 1 and no matches.

- [ ] **Step 4: Browser smoke**

Start the example:

```powershell
pnpm --filter @report-designer/example dev -- --host 127.0.0.1 --port 5181
```

Use Playwright to open `http://127.0.0.1:5181/`, open designer, select or add a rich text component, double-click it, apply a Chinese font, set color, save, return to preview, and verify the rendered rich text remains visible.

- [ ] **Step 5: Final status**

Run:

```powershell
git status --short
```

Expected: clean working tree.
