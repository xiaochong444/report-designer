export type ReportEventName =
  | 'beforePreview'
  | 'beforePrint'
  | 'beforeRender'
  | 'afterRender'
  | 'beforeData'
  | 'afterData';

export type BandEventName = 'beforePrint' | 'afterPrint' | 'beforeRow' | 'afterRow';
export type ComponentEventName = 'getValue' | 'beforePrint' | 'afterPrint';

export interface EventScript {
  enabled: boolean;
  script: string;
}

export type EventMap<TName extends string> = Partial<Record<TName, EventScript>>;
export type EventMode = 'preview' | 'print' | 'pdf';
export type EventOwnerType = 'report' | 'band' | 'component';
export type EventLogLevel = 'info' | 'warning' | 'error';

export interface EventTargetState {
  ownerType: EventOwnerType;
  ownerId: string;
  eventName: string;
}

export interface EventExecutionState {
  canceled: boolean;
  hidden: boolean;
  value?: unknown;
  hasValue: boolean;
}

export interface EventLogEntry extends EventTargetState {
  level: EventLogLevel;
  message: string;
}

export interface EventLogCollector {
  readonly entries: EventLogEntry[];
  info(message: string, target?: Partial<EventTargetState>): void;
  warning(message: string, target?: Partial<EventTargetState>): void;
  error(message: string, target?: Partial<EventTargetState>): void;
  push(entry: EventLogEntry): void;
}

export interface EventRuntimeState {
  eventCount: number;
  maxEventCount: number;
  dynamicCounters?: Record<string, number>;
}

import type {
  Band,
  BarcodeComponent,
  ImageComponent,
  Page,
  ReportComponent,
  ReportTemplate,
  TextComponent,
} from '../template-model/types';

export interface DynamicTextOptions {
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  font?: Partial<TextComponent['font']>;
}

export interface DynamicImageOptions {
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  fitMode?: ImageComponent['fitMode'];
}

export interface DynamicBarcodeOptions {
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  format?: BarcodeComponent['format'];
  showText?: boolean;
}

export interface EventContext {
  mode: EventMode;
  report?: ReportTemplate;
  page?: Page;
  band?: Band;
  component?: ReportComponent;
  row?: Record<string, unknown>;
  rowIndex?: number;
  dataSourceId?: string;
  data: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  state: Record<string, unknown>;
  target: EventTargetState;
  log: EventLogCollector;
  runtime?: EventRuntimeState;
  value?: unknown;
  execution?: EventExecutionState;
  cancel?: () => void;
  hide?: () => void;
  setValue?: (value: unknown) => void;
  getComponent?: (idOrName: string) => ReportComponent | undefined;
  setComponentProperty?: (idOrName: string, path: string, value: unknown) => void;
  bindText?: (idOrName: string, expression: string) => void;
  createText?: (options: DynamicTextOptions) => TextComponent;
  createImage?: (options: DynamicImageOptions) => ImageComponent;
  createBarcode?: (options: DynamicBarcodeOptions) => BarcodeComponent;
}

export interface EventScriptValidationResult {
  valid: boolean;
  errors: string[];
}

export interface RunEventScriptOptions {
  event?: EventScript;
  ctx: EventContext;
  target: EventTargetState;
  eventLogs?: EventLogCollector;
  runtimeState?: EventRuntimeState;
  maxEventCount?: number;
}
