import {
  getDefaultTextStyle,
  getTextStyleById,
} from '@report-designer/core';
import type {
  BorderConfig,
  FontConfig,
  ReportStyle,
  TextFormatConfig,
  TextComponent,
} from '@report-designer/core';

export const TEXT_STYLE_BINDING_PATHS = [
  'font.family',
  'font.size',
  'font.bold',
  'font.italic',
  'font.underline',
  'font.strikethrough',
  'font.color',
  'backgroundColor',
  'textAlign',
  'verticalAlign',
  'border.style',
  'border.width',
  'border.color',
  'border.sides.top',
  'border.sides.right',
  'border.sides.bottom',
  'border.sides.left',
  'padding.top',
  'padding.right',
  'padding.bottom',
  'padding.left',
  'format.type',
  'format.pattern',
  'format.nullValue',
  'format.trueText',
  'format.falseText',
  'canGrow',
  'canShrink',
] as const;

export type TextStyleBindingPath = typeof TEXT_STYLE_BINDING_PATHS[number];

const FONT_BINDING_PATHS = [
  'font.family',
  'font.size',
  'font.bold',
  'font.italic',
  'font.underline',
  'font.strikethrough',
  'font.color',
] as const;

const BORDER_BINDING_PATHS = [
  'border.style',
  'border.width',
  'border.color',
  'border.sides.top',
  'border.sides.right',
  'border.sides.bottom',
  'border.sides.left',
] as const;

const PADDING_BINDING_PATHS = [
  'padding.top',
  'padding.right',
  'padding.bottom',
  'padding.left',
] as const;

const FORMAT_BINDING_PATHS = [
  'format.type',
  'format.pattern',
  'format.nullValue',
  'format.trueText',
  'format.falseText',
] as const;

const DEFAULT_STYLE_FONT: FontConfig = {
  family: 'Arial',
  size: 10,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  color: '#000000',
};

const DEFAULT_STYLE_BORDER: BorderConfig = {
  style: 'none',
  width: 0,
  color: '#000000',
  sides: { top: false, right: false, bottom: false, left: false },
};

const DEFAULT_STYLE_PADDING = { top: 0, right: 0, bottom: 0, left: 0 };

const DEFAULT_STYLE_FORMAT: Required<TextFormatConfig> = {
  type: 'none',
  pattern: '',
  nullValue: '',
  trueText: '',
  falseText: '',
};

function styleFont(style: ReportStyle): FontConfig {
  return {
    ...DEFAULT_STYLE_FONT,
    ...style.font,
  };
}

function styleBorder(style: ReportStyle): BorderConfig {
  return {
    ...DEFAULT_STYLE_BORDER,
    ...style.border,
    sides: {
      ...DEFAULT_STYLE_BORDER.sides,
      ...style.border?.sides,
    },
  };
}

function stylePadding(style: ReportStyle) {
  return {
    ...DEFAULT_STYLE_PADDING,
    ...style.padding,
  };
}

function styleFormat(style: ReportStyle): Required<TextFormatConfig> {
  return {
    ...DEFAULT_STYLE_FORMAT,
    ...style.format,
  };
}

const STYLE_VALUE_READERS: Record<TextStyleBindingPath, (style: ReportStyle) => unknown> = {
  'font.family': style => styleFont(style).family,
  'font.size': style => styleFont(style).size,
  'font.bold': style => styleFont(style).bold,
  'font.italic': style => styleFont(style).italic,
  'font.underline': style => styleFont(style).underline,
  'font.strikethrough': style => styleFont(style).strikethrough,
  'font.color': style => styleFont(style).color,
  backgroundColor: style => style.backgroundColor ?? 'transparent',
  textAlign: style => style.textAlign ?? 'left',
  verticalAlign: style => style.verticalAlign ?? 'top',
  'border.style': style => styleBorder(style).style,
  'border.width': style => styleBorder(style).width,
  'border.color': style => styleBorder(style).color,
  'border.sides.top': style => styleBorder(style).sides.top,
  'border.sides.right': style => styleBorder(style).sides.right,
  'border.sides.bottom': style => styleBorder(style).sides.bottom,
  'border.sides.left': style => styleBorder(style).sides.left,
  'padding.top': style => stylePadding(style).top,
  'padding.right': style => stylePadding(style).right,
  'padding.bottom': style => stylePadding(style).bottom,
  'padding.left': style => stylePadding(style).left,
  'format.type': style => styleFormat(style).type,
  'format.pattern': style => styleFormat(style).pattern,
  'format.nullValue': style => styleFormat(style).nullValue,
  'format.trueText': style => styleFormat(style).trueText,
  'format.falseText': style => styleFormat(style).falseText,
  canGrow: style => style.canGrow ?? false,
  canShrink: style => style.canShrink ?? false,
};

function isTextStyleBindingPath(path: string): path is TextStyleBindingPath {
  return (TEXT_STYLE_BINDING_PATHS as readonly string[]).includes(path);
}

function assignNestedValue(target: Record<string, any>, path: string, value: unknown) {
  const segments = path.split('.');
  let cursor: Record<string, any> = target;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const existing = cursor[segment];
    cursor[segment] = existing && typeof existing === 'object' ? { ...existing } : {};
    cursor = cursor[segment];
  }

  cursor[segments[segments.length - 1]] = value;
}

function hasOwn(obj: object, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function mergeTextComponentUpdates(component: TextComponent, updates: Record<string, any>): TextComponent {
  const next: TextComponent = {
    ...component,
    ...updates,
  };

  if (hasOwn(updates, 'font') && updates.font && typeof updates.font === 'object') {
    next.font = { ...component.font, ...updates.font };
  }

  if (hasOwn(updates, 'border') && updates.border && typeof updates.border === 'object') {
    const currentBorder = {
      ...DEFAULT_STYLE_BORDER,
      ...component.border,
      sides: {
        ...DEFAULT_STYLE_BORDER.sides,
        ...component.border?.sides,
      },
    };
    next.border = {
      ...currentBorder,
      ...updates.border,
      sides: {
        ...currentBorder.sides,
        ...updates.border.sides,
      },
    };
  }

  if (hasOwn(updates, 'padding')) {
    next.padding = updates.padding && typeof updates.padding === 'object'
      ? { ...(component.padding ?? { top: 0, right: 0, bottom: 0, left: 0 }), ...updates.padding }
      : updates.padding;
  }

  if (hasOwn(updates, 'format')) {
    next.format = updates.format && typeof updates.format === 'object'
      ? { ...(component.format ?? { type: 'none' }), ...updates.format }
      : updates.format;
  }

  return next;
}

export function getTextStyleBindings(style: ReportStyle): TextStyleBindingPath[] {
  return [...TEXT_STYLE_BINDING_PATHS];
}

export function hasTextStyleBinding(
  component: { styleBindings?: string[] } | null | undefined,
  pathOrPrefix: string,
): boolean {
  if (!component?.styleBindings?.length) {
    return false;
  }

  return component.styleBindings.some(binding => (
    binding === pathOrPrefix || binding.startsWith(`${pathOrPrefix}.`)
  ));
}

export function applyTextStyleToComponent(component: TextComponent, style: ReportStyle): TextComponent {
  const bindings = getTextStyleBindings(style);
  const next: TextComponent = { ...component, style: style.id };

  for (const path of bindings) {
    assignNestedValue(next as Record<string, any>, path, STYLE_VALUE_READERS[path](style));
  }

  if (bindings.length > 0) {
    next.styleBindings = bindings;
  } else {
    delete next.styleBindings;
  }

  return next;
}

export function syncTextComponentStyle(component: TextComponent, style: ReportStyle): TextComponent {
  const activeBindings = getTextStyleBindings(style);
  const next: TextComponent = { ...component, style: style.id };

  for (const path of activeBindings) {
    assignNestedValue(next as Record<string, any>, path, STYLE_VALUE_READERS[path](style));
  }

  if (activeBindings.length > 0) {
    next.styleBindings = activeBindings;
  } else {
    delete next.styleBindings;
  }

  return next;
}

export function clearTextStyleReference(component: TextComponent): TextComponent {
  const { style, styleBindings, ...rest } = component;
  return rest as TextComponent;
}

export function applyDefaultTextStyle(component: TextComponent, styles: ReportStyle[]): TextComponent {
  const style = component.style
    ? getTextStyleById(styles, component.style)
    : getDefaultTextStyle(styles);

  if (!style) {
    return component;
  }

  return applyTextStyleToComponent(component, style);
}

export function omitTextStyleBindings(component: TextComponent, bindingsToOmit: string[]): TextComponent {
  if (!component.styleBindings?.length) {
    return component;
  }

  const omitted = new Set(bindingsToOmit);
  const styleBindings = component.styleBindings.filter(path => !omitted.has(path));

  if (styleBindings.length === 0) {
    const { styleBindings: _styleBindings, ...rest } = component;
    return rest as TextComponent;
  }

  return {
    ...component,
    styleBindings,
  };
}

export function getTextStyleBindingsToOmitForUpdates(
  component: TextComponent,
  updates: Record<string, any>,
): TextStyleBindingPath[] {
  const bindings = new Set<TextStyleBindingPath>();

  if (hasOwn(updates, 'backgroundColor') && updates.backgroundColor !== component.backgroundColor) {
    bindings.add('backgroundColor');
  }
  if (hasOwn(updates, 'textAlign') && updates.textAlign !== component.textAlign) {
    bindings.add('textAlign');
  }
  if (hasOwn(updates, 'verticalAlign') && updates.verticalAlign !== component.verticalAlign) {
    bindings.add('verticalAlign');
  }
  if (hasOwn(updates, 'canGrow') && updates.canGrow !== component.canGrow) {
    bindings.add('canGrow');
  }
  if (hasOwn(updates, 'canShrink') && updates.canShrink !== component.canShrink) {
    bindings.add('canShrink');
  }

  if (hasOwn(updates, 'font') && updates.font && typeof updates.font === 'object') {
    for (const path of FONT_BINDING_PATHS) {
      const key = path.slice('font.'.length) as keyof TextComponent['font'];
      if (hasOwn(updates.font, key) && updates.font[key] !== component.font[key]) {
        bindings.add(path);
      }
    }
  }

  if (hasOwn(updates, 'border') && updates.border && typeof updates.border === 'object') {
    if (hasOwn(updates.border, 'style') && updates.border.style !== component.border.style) {
      bindings.add('border.style');
    }
    if (hasOwn(updates.border, 'width') && updates.border.width !== component.border.width) {
      bindings.add('border.width');
    }
    if (hasOwn(updates.border, 'color') && updates.border.color !== component.border.color) {
      bindings.add('border.color');
    }
    if (updates.border.sides && typeof updates.border.sides === 'object') {
      for (const path of BORDER_BINDING_PATHS.filter(item => item.startsWith('border.sides.'))) {
        const side = path.slice('border.sides.'.length) as keyof TextComponent['border']['sides'];
        if (hasOwn(updates.border.sides, side) && updates.border.sides[side] !== component.border.sides[side]) {
          bindings.add(path);
        }
      }
    }
  }

  if (hasOwn(updates, 'padding')) {
    if (!updates.padding || typeof updates.padding !== 'object') {
      for (const path of PADDING_BINDING_PATHS) {
        bindings.add(path);
      }
    } else {
      const currentPadding = component.padding ?? { top: 0, right: 0, bottom: 0, left: 0 };
      for (const path of PADDING_BINDING_PATHS) {
        const side = path.slice('padding.'.length) as keyof NonNullable<TextComponent['padding']>;
        if (hasOwn(updates.padding, side) && updates.padding[side] !== currentPadding[side]) {
          bindings.add(path);
        }
      }
    }
  }

  if (hasOwn(updates, 'format')) {
    for (const path of FORMAT_BINDING_PATHS) {
      bindings.add(path);
    }
  }

  return [...bindings];
}

function filterLockedFontUpdates(component: TextComponent, fontUpdates: Record<string, any>) {
  const nextFont: Record<string, any> = {};
  for (const key of Object.keys(fontUpdates)) {
    const path = `font.${key}`;
    if (!hasTextStyleBinding(component, path)) {
      nextFont[key] = fontUpdates[key];
    }
  }
  return nextFont;
}

function filterLockedBorderUpdates(component: TextComponent, borderUpdates: Record<string, any>) {
  const nextBorder: Record<string, any> = {};

  for (const key of ['style', 'width', 'color']) {
    if (hasOwn(borderUpdates, key) && !hasTextStyleBinding(component, `border.${key}`)) {
      nextBorder[key] = borderUpdates[key];
    }
  }

  if (borderUpdates.sides && typeof borderUpdates.sides === 'object') {
    const nextSides: Record<string, any> = {};
    for (const side of ['top', 'right', 'bottom', 'left']) {
      if (hasOwn(borderUpdates.sides, side) && !hasTextStyleBinding(component, `border.sides.${side}`)) {
        nextSides[side] = borderUpdates.sides[side];
      }
    }
    if (Object.keys(nextSides).length > 0) {
      nextBorder.sides = nextSides;
    }
  }

  return nextBorder;
}

function filterLockedPaddingUpdates(component: TextComponent, paddingUpdates: Record<string, any>) {
  const nextPadding: Record<string, any> = {};
  for (const side of ['top', 'right', 'bottom', 'left']) {
    if (hasOwn(paddingUpdates, side) && !hasTextStyleBinding(component, `padding.${side}`)) {
      nextPadding[side] = paddingUpdates[side];
    }
  }
  return nextPadding;
}

function filterLockedFormatUpdates(component: TextComponent, formatUpdates: Record<string, any>) {
  const nextFormat: Record<string, any> = {};
  for (const key of ['type', 'pattern', 'nullValue', 'trueText', 'falseText']) {
    if (hasOwn(formatUpdates, key) && !hasTextStyleBinding(component, `format.${key}`)) {
      nextFormat[key] = formatUpdates[key];
    }
  }
  return nextFormat;
}

function filterLockedTextComponentUpdates(
  component: TextComponent,
  updates: Record<string, any>,
): Record<string, any> {
  if (!component.styleBindings?.length) {
    return updates;
  }

  const nextUpdates: Record<string, any> = {};

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'font' && value && typeof value === 'object') {
      const font = filterLockedFontUpdates(component, value);
      if (Object.keys(font).length > 0) {
        nextUpdates.font = font;
      }
      continue;
    }
    if (key === 'font' && hasTextStyleBinding(component, 'font')) {
      continue;
    }

    if (key === 'border' && value && typeof value === 'object') {
      const border = filterLockedBorderUpdates(component, value);
      if (Object.keys(border).length > 0) {
        nextUpdates.border = border;
      }
      continue;
    }
    if (key === 'border' && hasTextStyleBinding(component, 'border')) {
      continue;
    }

    if (key === 'padding' && value && typeof value === 'object') {
      const padding = filterLockedPaddingUpdates(component, value);
      if (Object.keys(padding).length > 0) {
        nextUpdates.padding = padding;
      }
      continue;
    }
    if (key === 'padding' && hasTextStyleBinding(component, 'padding')) {
      continue;
    }

    if (key === 'format' && value && typeof value === 'object') {
      const format = filterLockedFormatUpdates(component, value);
      if (Object.keys(format).length > 0) {
        nextUpdates.format = format;
      }
      continue;
    }
    if (key === 'format' && hasTextStyleBinding(component, 'format')) {
      continue;
    }

    if (isTextStyleBindingPath(key) && hasTextStyleBinding(component, key)) {
      continue;
    }

    nextUpdates[key] = value;
  }

  return nextUpdates;
}

export function applyManualTextComponentUpdates(
  component: TextComponent,
  updates: Record<string, any>,
): TextComponent {
  return mergeTextComponentUpdates(component, filterLockedTextComponentUpdates(component, updates));
}

export function normalizeManualTextComponentUpdates(
  component: TextComponent,
  updates: Record<string, any>,
): Record<string, any> {
  return filterLockedTextComponentUpdates(component, updates);
}
