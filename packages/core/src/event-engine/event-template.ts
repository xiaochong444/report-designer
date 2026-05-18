import type {
  BarcodeComponent,
  Band,
  ImageComponent,
  PanelComponent,
  ReportComponent,
  ReportTemplate,
  TextComponent,
} from '../template-model/types';
import type { DynamicBarcodeOptions, DynamicImageOptions, DynamicTextOptions } from './types';

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

export function setComponentProperty(component: ReportComponent, path: string, value: unknown): void {
  const segments = path.split('.').filter(Boolean);
  if (segments.length === 0) {
    throw new Error('Component property path is required.');
  }

  let target = component as unknown as Record<string, unknown>;
  for (const segment of segments.slice(0, -1)) {
    const next = target[segment];
    if (!isRecord(next)) {
      target[segment] = {};
    }
    target = target[segment] as Record<string, unknown>;
  }

  target[segments[segments.length - 1]] = value;
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

function isPanelComponent(component: ReportComponent): component is PanelComponent {
  return component.type === 'panel';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
