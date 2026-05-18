import type {
  BarcodeComponent,
  Band,
  ImageComponent,
  PanelComponent,
  ReportComponent,
  ReportTemplate,
  TextComponent,
} from '../template-model/types';
import type { DynamicBarcodeOptions, DynamicImageOptions, DynamicTextOptions, EventRuntimeState } from './types';

export function cloneReportTemplate(template: ReportTemplate): ReportTemplate {
  return JSON.parse(JSON.stringify(template)) as ReportTemplate;
}

export function findComponentInTemplate(template: ReportTemplate, idOrName: string): ReportComponent | undefined {
  for (const page of template.pages) {
    for (const band of page.bands) {
      const found = findComponentInList(band.components, idOrName);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

export function createDynamicComponentId(
  template: ReportTemplate,
  prefix: string,
  options: { extraComponents?: ReportComponent[]; runtime?: EventRuntimeState } = {},
): string {
  const usedIds = new Set<string>();
  for (const page of template.pages) {
    for (const band of page.bands) {
      collectComponentIds(band.components, usedIds);
    }
  }

  if (options.extraComponents) {
    collectComponentIds(options.extraComponents, usedIds);
  }

  const counters = options.runtime?.dynamicCounters ?? {};
  let index = (counters[prefix] ?? 0) + 1;
  while (usedIds.has(`${prefix}-${index}`)) {
    index += 1;
  }

  if (options.runtime) {
    options.runtime.dynamicCounters = {
      ...counters,
      [prefix]: index,
    };
  }

  return `${prefix}-${index}`;
}

export function setComponentProperty(component: ReportComponent, path: string, value: unknown): void {
  const segments = path.split('.').filter(Boolean);
  if (segments.length === 0) {
    throw new Error('Component property path is required.');
  }

  let target: unknown = component;
  for (const segment of segments.slice(0, -1)) {
    target = readPathSegment(target, segment, path);
  }

  if (!isRecord(target) && !Array.isArray(target)) {
    throw new Error(`Cannot set component property path: ${path}`);
  }

  writePathSegment(target, segments[segments.length - 1], value, path);
}

export function createDynamicText(options: DynamicTextOptions, id: string): TextComponent {
  return {
    id,
    name: options.name,
    type: 'text',
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    text: options.text,
    font: {
      family: 'Arial',
      size: 10,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      color: '#000000',
      ...options.font,
    },
    textAlign: 'left',
    verticalAlign: 'middle',
    border: {
      style: 'none',
      width: 0,
      color: '#000000',
      sides: {
        top: false,
        right: false,
        bottom: false,
        left: false,
      },
    },
    canGrow: true,
    canShrink: false,
  };
}

export function createDynamicImage(options: DynamicImageOptions, id: string): ImageComponent {
  return {
    id,
    name: options.name,
    type: 'image',
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    src: options.src,
    fitMode: options.fitMode ?? 'contain',
  };
}

export function createDynamicBarcode(options: DynamicBarcodeOptions, id: string): BarcodeComponent {
  return {
    id,
    name: options.name,
    type: 'barcode',
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    value: options.value,
    format: options.format ?? 'CODE128',
    showText: options.showText ?? true,
  };
}

export function appendComponentToBand(band: Band | undefined, component: ReportComponent): void {
  if (!band) {
    throw new Error('A current band is required to create dynamic components.');
  }

  band.components.push(component);
}

function findComponentInList(components: ReportComponent[], idOrName: string): ReportComponent | undefined {
  for (const component of components) {
    if (component.id === idOrName || component.name === idOrName) {
      return component;
    }

    if (isPanelComponent(component)) {
      const found = findComponentInList(component.components, idOrName);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

function collectComponentIds(components: ReportComponent[], usedIds: Set<string>): void {
  for (const component of components) {
    usedIds.add(component.id);
    if (isPanelComponent(component)) {
      collectComponentIds(component.components, usedIds);
    }
  }
}

function isPanelComponent(component: ReportComponent): component is PanelComponent {
  return component.type === 'panel';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readPathSegment(target: unknown, segment: string, fullPath: string): unknown {
  if (Array.isArray(target)) {
    const index = parseArrayIndex(segment);
    if (index === undefined || index >= target.length) {
      throw new Error(`Cannot set component property path: ${fullPath}`);
    }
    return target[index];
  }

  if (isRecord(target) && segment in target) {
    const next = target[segment];
    if (isRecord(next) || Array.isArray(next)) {
      return next;
    }
  }

  throw new Error(`Cannot set component property path: ${fullPath}`);
}

function writePathSegment(target: Record<string, unknown> | unknown[], segment: string, value: unknown, fullPath: string): void {
  if (Array.isArray(target)) {
    const index = parseArrayIndex(segment);
    if (index === undefined || index >= target.length) {
      throw new Error(`Cannot set component property path: ${fullPath}`);
    }
    target[index] = value;
    return;
  }

  target[segment] = value;
}

function parseArrayIndex(segment: string): number | undefined {
  if (!/^\d+$/.test(segment)) {
    return undefined;
  }

  return Number(segment);
}
