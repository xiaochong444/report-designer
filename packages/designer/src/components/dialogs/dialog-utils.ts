import type { BorderConfig, FontConfig, TextComponent } from '@report-designer/core';

export function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const defaultFont: FontConfig = {
  family: 'Arial',
  size: 10,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  color: '#1f2937',
};

export const defaultBorder: BorderConfig = {
  style: 'none',
  width: 0,
  color: '#d9d9d9',
  sides: { top: false, right: false, bottom: false, left: false },
};

export function createTextComponent(text: string, x: number, y: number, width: number, height: number, name?: string): TextComponent {
  return {
    id: uid('text'),
    name,
    type: 'text',
    text,
    x,
    y,
    width,
    height,
    font: defaultFont,
    textAlign: 'left',
    verticalAlign: 'middle',
    border: defaultBorder,
    canGrow: true,
    canShrink: false,
  };
}
