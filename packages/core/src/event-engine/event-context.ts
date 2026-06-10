import type { Band, Page, PanelComponent, ReportComponent, ReportTemplate, TextComponent } from '../template-model/types';
import {
  appendComponentToBand,
  createDynamicComponentId,
  createDynamicBarcode,
  createDynamicImage,
  createDynamicText,
  setComponentProperty as setTemplateComponentProperty,
} from './event-template';
import { createEventComponentHelpers } from './event-component-handles';
import type { EventBaseComponentFactory } from './event-component-handles';
import type {
  DynamicBarcodeOptions,
  DynamicImageOptions,
  DynamicTextOptions,
  EventContext,
  EventExecutionState,
  EventLogCollector,
  EventMode,
  EventRuntimeState,
  EventTargetState,
} from './types';

const reportComponentPropertyKeys = new Set<PropertyKey>([
  'id',
  'name',
  'type',
  'x',
  'y',
  'width',
  'height',
  'zOrder',
  'backgroundColor',
  'border',
  'padding',
  'style',
  'conditionalFormat',
  'visible',
  'printableExpression',
  'enabledExpression',
  'conditions',
  'events',
  'anchor',
]);

export interface CreateEventContextOptions {
  mode?: EventMode;
  report?: ReportTemplate;
  template?: ReportTemplate;
  page?: Page;
  band?: Band;
  component?: ReportComponent;
  row?: Record<string, unknown>;
  rowIndex?: number;
  dataSourceId?: string;
  data?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  state?: Record<string, unknown>;
  log: EventLogCollector;
  target: EventTargetState;
  runtime?: EventRuntimeState;
  execution?: EventExecutionState;
}

export function createEventContext(options: CreateEventContextOptions): EventContext {
  const report = options.report ?? options.template;
  const execution = options.execution ?? { canceled: false, hidden: false, hasValue: false };

  const requireReport = (): ReportTemplate => {
    if (!report) {
      throw new Error('A report template is required to access components.');
    }
    return report;
  };

  const getComponent = (name: string): ReportComponent | undefined => (
    findComponentInComponents(options.band?.components ?? [], name)
    ?? (report ? findComponentInTemplateByName(report, name) : undefined)
  );
  const componentHelpers = createEventComponentHelpers({ getComponentByName: getComponent });
  const componentAccessor = createComponentAccessor(componentHelpers.component, options.component);

  const ctx: EventContext = {
    mode: options.mode ?? 'preview',
    report,
    page: options.page,
    band: options.band,
    component: componentAccessor,
    currentComponent: options.component,
    row: options.row,
    rowIndex: options.rowIndex ?? -1,
    dataSourceId: options.dataSourceId,
    data: options.data ?? {},
    parameters: options.parameters ?? {},
    variables: options.variables ?? {},
    state: options.state ?? {},
    target: options.target,
    log: options.log,
    runtime: options.runtime,
    execution,
    get value() {
      return execution.value;
    },
    set value(value: unknown) {
      execution.value = value;
      execution.hasValue = true;
    },
    cancel() {
      execution.canceled = true;
    },
    hide() {
      execution.hidden = true;
    },
    setValue(value: unknown) {
      execution.value = value;
      execution.hasValue = true;
    },
    getComponent,
    setComponentProperty(name: string, path: string, value: unknown) {
      const found = getComponent(name);
      if (!found) {
        throw new Error(`Component "${name}" was not found.`);
      }
      setTemplateComponentProperty(found, path, value);
    },
    bindText(name: string, expression: string) {
      const found = getComponent(name);
      if (!found) {
        throw new Error(`Component "${name}" was not found.`);
      }
      if (found.type !== 'text') {
        throw new Error(`Component "${name}" is not a text component.`);
      }
      (found as TextComponent).text = expression;
    },
    text: componentHelpers.text,
    image: componentHelpers.image,
    table: componentHelpers.table,
    barcode: componentHelpers.barcode,
    qrcode: componentHelpers.qrcode,
    checkbox: componentHelpers.checkbox,
    richtext: componentHelpers.richtext,
    chart: componentHelpers.chart,
    line: componentHelpers.line,
    shape: componentHelpers.shape,
    pageNumber: componentHelpers.pageNumber,
    dateTime: componentHelpers.dateTime,
    panel: componentHelpers.panel,
    createText(options: DynamicTextOptions) {
      const component = createDynamicText(
        options,
        createDynamicComponentId(requireReport(), 'dynamic-text', {
          extraComponents: ctx.band?.components,
          runtime: ctx.runtime,
        }),
      );
      appendComponentToBand(ctx.band, component);
      return component;
    },
    createImage(options: DynamicImageOptions) {
      const component = createDynamicImage(
        options,
        createDynamicComponentId(requireReport(), 'dynamic-image', {
          extraComponents: ctx.band?.components,
          runtime: ctx.runtime,
        }),
      );
      appendComponentToBand(ctx.band, component);
      return component;
    },
    createBarcode(options: DynamicBarcodeOptions) {
      const component = createDynamicBarcode(
        options,
        createDynamicComponentId(requireReport(), 'dynamic-barcode', {
          extraComponents: ctx.band?.components,
          runtime: ctx.runtime,
        }),
      );
      appendComponentToBand(ctx.band, component);
      return component;
    },
  };

  return ctx;
}

function findComponentInTemplateByName(template: ReportTemplate, name: string): ReportComponent | undefined {
  for (const page of template.pages) {
    for (const band of page.bands) {
      const found = findComponentInComponents(band.components, name);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

function findComponentInComponents(components: ReportComponent[], name: string): ReportComponent | undefined {
  for (const component of components) {
    if (component.name === name) {
      return component;
    }

    if (isPanelComponent(component)) {
      const found = findComponentInComponents(component.components, name);
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

function createComponentAccessor(
  factory: EventBaseComponentFactory,
  currentComponent: ReportComponent | undefined,
): EventContext['component'] {
  if (!currentComponent) {
    return factory;
  }

  return new Proxy(factory, {
    get(target, property, receiver) {
      if (reportComponentPropertyKeys.has(property)) {
        return (currentComponent as unknown as Record<PropertyKey, unknown>)[property];
      }
      if (property in currentComponent) {
        return (currentComponent as unknown as Record<PropertyKey, unknown>)[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(_target, property, value) {
      (currentComponent as unknown as Record<PropertyKey, unknown>)[property] = value;
      return true;
    },
    has(target, property) {
      if (reportComponentPropertyKeys.has(property)) {
        return property in currentComponent;
      }
      return property in currentComponent || property in target;
    },
  }) as EventContext['component'];
}
