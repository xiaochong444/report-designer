import type { TextComponent } from '../src';

export function textComponent(overrides: Partial<TextComponent> = {}): TextComponent {
  return {
    id: overrides.id ?? 'text-1',
    type: 'text',
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    width: overrides.width ?? 40,
    height: overrides.height ?? 8,
    text: overrides.text ?? 'Text',
    font: {
      family: 'Arial',
      size: overrides.font?.size ?? 10,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      color: '#000',
      ...overrides.font,
    },
    textAlign: overrides.textAlign ?? 'left',
    verticalAlign: overrides.verticalAlign ?? 'top',
    border: {
      style: 'none',
      width: 0,
      color: '#000',
      sides: { top: false, right: false, bottom: false, left: false },
      ...overrides.border,
    },
    canGrow: overrides.canGrow ?? true,
    canShrink: overrides.canShrink ?? false,
    ...overrides,
  };
}
