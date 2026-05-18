import type { Band, Page, PanelComponent, ReportComponent, ReportTemplate, TextComponent } from '../template-model/types';
import {
  appendComponentToBand,
  createDynamicComponentId,
  createDynamicBarcode,
  createDynamicImage,
  createDynamicText,
  findComponentInTemplate,
  setComponentProperty as setTemplateComponentProperty,
} from './event-template';
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

  const getComponent = (idOrName: string): ReportComponent | undefined => (
    findComponentInComponents(options.band?.components ?? [], idOrName)
    ?? findComponentInTemplate(requireReport(), idOrName)
  );

  const ctx: EventContext = {
    mode: options.mode ?? 'preview',
    report,
    page: options.page,
    band: options.band,
    component: options.component,
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
    setComponentProperty(idOrName: string, path: string, value: unknown) {
      const found = getComponent(idOrName);
      if (!found) {
        throw new Error(`Component "${idOrName}" was not found.`);
      }
      setTemplateComponentProperty(found, path, value);
    },
    bindText(idOrName: string, expression: string) {
      const found = getComponent(idOrName);
      if (!found) {
        throw new Error(`Component "${idOrName}" was not found.`);
      }
      if (found.type !== 'text') {
        throw new Error(`Component "${idOrName}" is not a text component.`);
      }
      (found as TextComponent).text = expression;
    },
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

function findComponentInComponents(components: ReportComponent[], idOrName: string): ReportComponent | undefined {
  for (const component of components) {
    if (component.id === idOrName || component.name === idOrName) {
      return component;
    }

    if (isPanelComponent(component)) {
      const found = findComponentInComponents(component.components, idOrName);
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
