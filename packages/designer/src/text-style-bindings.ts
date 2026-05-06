import {
  getDefaultTextStyle,
  getTextStyleById,
} from '@report-designer/core';
import type {
  ReportStyle,
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

const STYLE_VALUE_READERS: Record<TextStyleBindingPath, (style: ReportStyle) => unknown> = {
  'font.family': style => style.font.family,
  'font.size': style => style.font.size,
  'font.bold': style => style.font.bold,
  'font.italic': style => style.font.italic,
  'font.underline': style => style.font.underline,
  'font.strikethrough': style => style.font.strikethrough,
  'font.color': style => style.font.color,
  backgroundColor: style => style.backgroundColor,
  textAlign: style => style.textAlign,
  verticalAlign: style => style.verticalAlign,
  'border.style': style => style.border.style,
  'border.width': style => style.border.width,
  'border.color': style => style.border.color,
  'border.sides.top': style => style.border.sides.top,
  'border.sides.right': style => style.border.sides.right,
  'border.sides.bottom': style => style.border.sides.bottom,
  'border.sides.left': style => style.border.sides.left,
  'padding.top': style => style.padding?.top,
  'padding.right': style => style.padding?.right,
  'padding.bottom': style => style.padding?.bottom,
  'padding.left': style => style.padding?.left,
  'format.type': style => style.format?.type,
  'format.pattern': style => style.format?.pattern,
  'format.nullValue': style => style.format?.nullValue,
  'format.trueText': style => style.format?.trueText,
  'format.falseText': style => style.format?.falseText,
  canGrow: style => style.canGrow,
  canShrink: style => style.canShrink,
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
    next.border = {
      ...component.border,
      ...updates.border,
      sides: {
        ...component.border.sides,
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
  return TEXT_STYLE_BINDING_PATHS.filter(path => STYLE_VALUE_READERS[path](style) !== undefined);
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
  const existingBindings = component.styleBindings ?? [];
  const activeBindings = existingBindings.filter((path): path is TextStyleBindingPath => (
    isTextStyleBindingPath(path) && STYLE_VALUE_READERS[path](style) !== undefined
  ));
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

export function applyManualTextComponentUpdates(
  component: TextComponent,
  updates: Record<string, any>,
): TextComponent {
  const merged = mergeTextComponentUpdates(component, updates);
  const bindingsToOmit = getTextStyleBindingsToOmitForUpdates(component, updates);
  return omitTextStyleBindings(merged, bindingsToOmit);
}

export function normalizeManualTextComponentUpdates(
  component: TextComponent,
  updates: Record<string, any>,
): Record<string, any> {
  const bindingsToOmit = getTextStyleBindingsToOmitForUpdates(component, updates);
  if (bindingsToOmit.length === 0) {
    return updates;
  }

  const nextComponent = omitTextStyleBindings(component, bindingsToOmit);
  return {
    ...updates,
    styleBindings: nextComponent.styleBindings,
  };
}
