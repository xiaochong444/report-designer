# Component Property Model Design

## Goal

Tighten the designer property model so common components expose the right editable fields, use one expression-style content entry instead of scattered binding fields, and share the report-level font registry wherever the component renders text.

## Scope

- Text-like content is edited as a single content expression:
  - text: `text`
  - image: `src`
  - barcode: `value`
  - checkbox: `checked` and `label`
  - rich text: `html`
- Expression editing uses the existing expression dialog instead of introducing a second binding UI.
- Font properties are shown only for components that actually render text through a `font` object: text, page number, and date/time.
- Page number and date/time font selectors use the same report-level font registry as text components.
- Line, shape, image, barcode, checkbox, rich text, subreport, panel, and table keep their own content-specific controls.

## Non-Goals

- This phase does not add new component types.
- This phase does not redesign the whole property panel layout.
- This phase does not change the render engine output format.

## Acceptance

- A selected barcode can open the expression dialog from its content field and save `{Orders.No}` back to `value`.
- A selected checkbox can open the expression dialog for both checked state and label text.
- A selected rich text component uses the label "Rich Text Content" / "富文本内容" instead of exposing implementation wording as the primary label.
- Selecting an image, line, shape, panel, subreport, barcode, checkbox, or rich text component does not show irrelevant font controls.
- Selecting page number or date/time shows font controls populated from the report font registry.
- Existing property, drag, rich text, and font tests continue to pass.
