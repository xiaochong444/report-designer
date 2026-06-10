export type ReportEventName =
  | 'beforePreview'
  | 'beforePrint'
  | 'beforeRender'
  | 'afterRender'
  | 'beforeData'
  | 'afterData';

export type BandEventName = 'beforePrint' | 'afterPrint' | 'beforeRow' | 'afterRow';
export type ComponentEventName = 'getValue' | 'beforePrint' | 'afterPrint';
export type PageEventName = 'beforePrint' | 'afterPrint';

export interface EventScript {
  enabled: boolean;
  script: string;
}

export type EventMap<TName extends string> = Partial<Record<TName, EventScript>>;
export type EventMode = 'preview' | 'print' | 'pdf';
export type EventOwnerType = 'report' | 'page' | 'band' | 'component';
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
  timestamp: string;
  line?: number;
  column?: number;
  stackExcerpt?: string;
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
import type {
  EventBaseComponentFactory,
  EventBarcodeComponentFactory,
  EventCheckboxComponentFactory,
  EventImageComponentFactory,
  EventRichtextComponentFactory,
  EventQRCodeComponentFactory,
  EventTableComponentFactory,
  EventTextComponentFactory,
  EventTypedComponentFactory,
} from './event-component-handles';

export type EventComponentAccessor = EventBaseComponentFactory & Partial<ReportComponent>;

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
  component?: EventComponentAccessor;
  currentComponent?: ReportComponent;
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
  getComponent?: (name: string) => ReportComponent | undefined;
  setComponentProperty?: (name: string, path: string, value: unknown) => void;
  bindText?: (name: string, expression: string) => void;
  text?: EventTextComponentFactory;
  image?: EventImageComponentFactory;
  table?: EventTableComponentFactory;
  barcode?: EventBarcodeComponentFactory;
  qrcode?: EventQRCodeComponentFactory;
  checkbox?: EventCheckboxComponentFactory;
  richtext?: EventRichtextComponentFactory;
  chart?: EventTypedComponentFactory;
  line?: EventTypedComponentFactory;
  shape?: EventTypedComponentFactory;
  pageNumber?: EventTypedComponentFactory;
  dateTime?: EventTypedComponentFactory;
  panel?: EventTypedComponentFactory;
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
