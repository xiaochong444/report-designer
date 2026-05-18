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
}

export interface DynamicTextOptions {
  text?: string;
  visible?: boolean;
  style?: Record<string, unknown>;
}

export interface DynamicImageOptions {
  src?: string;
  visible?: boolean;
  fitMode?: 'fill' | 'contain' | 'cover' | 'stretch';
}

export interface DynamicBarcodeOptions {
  value?: string;
  visible?: boolean;
  format?: string;
  showText?: boolean;
}

export interface EventContext {
  mode: EventMode;
  data: Record<string, unknown>;
  state: Record<string, unknown>;
  target: EventTargetState;
  log: EventLogCollector;
  runtime?: EventRuntimeState;
  text?: DynamicTextOptions;
  image?: DynamicImageOptions;
  barcode?: DynamicBarcodeOptions;
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
