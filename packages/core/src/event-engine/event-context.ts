import type { Band, Page, ReportComponent, ReportTemplate, TextComponent } from '../template-model/types';
import {
  appendComponentToBand,
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
  let dynamicCounter = 0;

  const nextId = (kind: 'text' | 'image' | 'barcode') => {
    dynamicCounter += 1;
    return `dynamic-${kind}-${dynamicCounter}`;
  };

  const requireReport = (): ReportTemplate => {
    if (!report) {
      throw new Error('A report template is required to access components.');
    }
    return report;
  };

  const getComponent = (idOrName: string): ReportComponent | undefined => findComponentInTemplate(requireReport(), idOrName);

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
      const component = createDynamicText(options, nextId('text'));
      appendComponentToBand(ctx.band, component);
      return component;
    },
    createImage(options: DynamicImageOptions) {
      const component = createDynamicImage(options, nextId('image'));
      appendComponentToBand(ctx.band, component);
      return component;
    },
    createBarcode(options: DynamicBarcodeOptions) {
      const component = createDynamicBarcode(options, nextId('barcode'));
      appendComponentToBand(ctx.band, component);
      return component;
    },
  };

  return ctx;
}
