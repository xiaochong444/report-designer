# Tiptap Rich Text And Font Registry Design

## Goal

Upgrade the report rich text component from raw HTML textarea editing to an in-canvas Tiptap editor, and introduce a report-level font registry that is shared by text controls, rich text controls, canvas rendering, preview, and print output.

## Current State

- `richtext` components store only `html`.
- The property panel edits rich text through `Input.TextArea`.
- Canvas, viewer, and print output render rich HTML through `dangerouslySetInnerHTML`.
- HTML cleanup only removes `<script>` tags, so designer/viewer/print do not have a single rich HTML safety boundary.
- Text font choices are hardcoded in `PropertyEditor.tsx`, and are not controlled by the report template.

## Data Model

Add report-level font definitions:

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
```

Add `fonts: ReportFont[]` to `ReportTemplate`.

Normalize missing `fonts` with a built-in default set:

- Microsoft YaHei
- SimSun
- SimHei
- KaiTi
- FangSong
- Source Han Sans
- Source Han Serif
- Arial
- Times New Roman
- Courier New

Extend rich text components:

```ts
export interface RichtextComponent extends ReportComponent {
  type: 'richtext';
  html: Expression;
  document?: unknown;
}
```

`html` remains the compatibility and render output field. `document` stores the Tiptap JSON document for future edits. When `document` is missing, the editor initializes from `html`.

## Designer Behavior

### In-Canvas Editing

- Double-clicking a rich text component enters rich text edit mode.
- Edit mode renders a Tiptap editor over the component content area.
- Existing component drag and resize interactions are suspended while editing.
- Save actions:
  - `Ctrl+Enter` saves.
  - Clicking outside saves.
- Cancel action:
  - `Escape` cancels and restores the previous `html` and `document`.
- The editor layer scales with the canvas zoom so the edited text remains aligned with the component bounds.

### Toolbar

The first version ships a compact toolbar with:

- Font family
- Font size
- Text color
- Background color
- Bold
- Italic
- Underline
- Strikethrough
- Align left, center, right, justify
- Bullet list
- Ordered list
- Clear format

The toolbar reads font options from the report-level font registry.

### Property Panel

- Rich text keeps an advanced HTML textarea for users who need direct source editing.
- Normal font selectors in text properties use the report-level font registry instead of local hardcoded options.
- The page/report property area gains a font registry section:
  - View current fonts.
  - Add a font with name, CSS family, fallback, URL, or data URL.
  - Remove non-built-in fonts.
  - Built-in fonts cannot be removed.

## Shared Font Rendering

Create one font utility module that:

- Returns normalized report fonts.
- Generates `@font-face` CSS for custom URL/data URL fonts.
- Generates a `font-family` option list for property controls and Tiptap.
- Generates CSS injected into designer canvas, viewer DOM, and print iframe.

The same registered font family must render in:

- Design canvas.
- Rich text edit mode.
- Preview viewer.
- Print iframe.

PDF font embedding is out of scope for this phase. PDF continues using existing plain text fallback behavior for rich text.

## Rich HTML Safety

Create one shared rich HTML sanitizer in core and replace duplicated local cleanup in designer and viewer.

Allowed first-version tags:

- `p`, `br`, `span`, `strong`, `b`, `em`, `i`, `u`, `s`
- `ul`, `ol`, `li`
- `a`

Allowed style properties:

- `font-family`
- `font-size`
- `color`
- `background-color`
- `text-align`
- `font-weight`
- `font-style`
- `text-decoration`

Disallow scriptable content and event attributes. Links keep only safe `http`, `https`, `mailto`, and relative URLs.

## Tiptap Integration

Use:

- `@tiptap/react`
- `@tiptap/starter-kit`
- `@tiptap/extension-text-style`
- `@tiptap/extension-color`
- `@tiptap/extension-font-family`
- `@tiptap/extension-text-align`
- `@tiptap/extension-underline`
- `@tiptap/extension-link`
- `@tiptap/extension-placeholder`

Add a local `FontSize` extension using Tiptap global attributes on `textStyle`.

Tiptap output rules:

- On save, write `editor.getJSON()` to `document`.
- On save, write sanitized `editor.getHTML()` to `html`.
- If `document` cannot be loaded, fall back to current sanitized `html`.

## Testing

### Unit Tests

- Template normalization adds default report fonts.
- Font CSS generation emits `@font-face` for custom fonts.
- Font option generation includes Chinese built-in fonts.
- Rich HTML sanitizer removes scripts and event handlers.
- Rich HTML sanitizer keeps supported inline style attributes.

### Designer Tests

- Rich text property panel still shows advanced HTML editing.
- Text component font selector reads the report font registry.
- Double-clicking a rich text component opens an editor surface.
- Saving edit mode updates `html` and `document`.
- Pressing Escape cancels rich text edits.

### Viewer And Print Tests

- Viewer uses the shared sanitizer for rich text.
- Print frame uses the shared sanitizer for rich text.
- Print frame includes registered font CSS.

### Browser Smoke

- Open the example designer.
- Add or select a rich text component.
- Double-click to edit.
- Pick a Chinese font, size, and color.
- Save and verify the canvas displays the updated HTML.
- Return to preview and verify the same rich text appears.

## Out Of Scope

- PDF rich HTML rendering parity.
- Rich text tables.
- Rich text images.
- Field chips as custom Tiptap nodes.
- Collaborative editing.
