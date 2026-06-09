import { getComponentStyleById, getDefaultTextStyle, getTextStyleById, resolveComponentStyle, resolveTextStyle, supportsComponentStyle } from '@report-designer/core';
import type {
  BorderConfig,
  Padding,
  ReportComponent,
  ReportStyle,
  TextComponent,
  TextFormatConfig,
} from '@report-designer/core';

const DEFAULT_BORDER: BorderConfig = {
  style: 'none',
  width: 0,
  color: '#000000',
  sides: { top: false, right: false, bottom: false, left: false },
};

const DEFAULT_PADDING: Padding = { top: 0, right: 0, bottom: 0, left: 0 };

const STYLE_OWNED_ROOTS = new Set([
  'font',
  'backgroundColor',
  'textAlign',
  'verticalAlign',
  'border',
  'padding',
  'format',
  'canGrow',
  'canShrink',
]);

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
      ...DEFAULT_BORDER,
      ...component.border,
      sides: {
        ...DEFAULT_BORDER.sides,
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
      ? { ...DEFAULT_PADDING, ...(component.padding ?? {}), ...updates.padding }
      : updates.padding;
  }

  if (hasOwn(updates, 'format')) {
    next.format = updates.format && typeof updates.format === 'object'
      ? { ...(component.format ?? { type: 'none' } as TextFormatConfig), ...updates.format }
      : updates.format;
  }

  return next;
}

function copyResolvedStyleToComponent<T extends ReportComponent>(
  component: T,
  style: ReportStyle,
  keepStyleReference: boolean,
): T {
  const resolved = component.type === 'text'
    ? resolveTextStyle({ style: style.id }, [style])
    : resolveComponentStyle({ ...component, style: style.id }, [style]);
  const next: ReportComponent = {
    ...component,
  };

  for (const field of STYLE_OWNED_ROOTS) {
    if (field in resolved) {
      (next as any)[field] = (resolved as any)[field];
    } else {
      delete (next as any)[field];
    }
  }

  if (keepStyleReference) {
    next.style = style.id;
  } else {
    delete next.style;
  }

  return next as T;
}

function isStyleOwnedPath(pathOrPrefix: string): boolean {
  const [root] = pathOrPrefix.split('.');
  return STYLE_OWNED_ROOTS.has(root);
}

export function isTextStylePropertyLocked(
  component: Pick<ReportComponent, 'style'> | null | undefined,
  pathOrPrefix: string,
): boolean {
  return Boolean(component?.style && isStyleOwnedPath(pathOrPrefix));
}

export function applyTextStyleToComponent<T extends ReportComponent>(component: T, style: ReportStyle): T {
  return copyResolvedStyleToComponent(component, style, true);
}

export function syncTextComponentStyle<T extends ReportComponent>(component: T, style: ReportStyle): T {
  return copyResolvedStyleToComponent(component, style, true);
}

export function unbindTextStyleFromComponent<T extends ReportComponent>(component: T, styles: ReportStyle[]): T {
  const style = getComponentStyleById(styles, component.style);
  if (!style) {
    return clearTextStyleReference(component);
  }
  return copyResolvedStyleToComponent(component, style, false);
}

export function clearTextStyleReference<T extends ReportComponent>(component: T): T {
  const { style, ...rest } = component;
  return rest as T;
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

export function normalizeLocalTextComponentUpdates(
  component: Pick<ReportComponent, 'style'>,
  updates: Record<string, any>,
): Record<string, any> {
  if (!component.style) {
    return updates;
  }

  const nextUpdates: Record<string, any> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (!isStyleOwnedPath(key)) {
      nextUpdates[key] = value;
    }
  }
  return nextUpdates;
}

export function applyLocalTextComponentUpdates(
  component: TextComponent,
  updates: Record<string, any>,
): TextComponent {
  return mergeTextComponentUpdates(component, normalizeLocalTextComponentUpdates(component, updates));
}

export function canUseTextStyle(component: Pick<ReportComponent, 'type'>): boolean {
  return supportsComponentStyle(component);
}
