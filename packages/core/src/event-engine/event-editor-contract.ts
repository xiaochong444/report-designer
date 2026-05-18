import type { BandEventName, ComponentEventName, EventOwnerType, ReportEventName } from './types';

export type EventEditorTargetType = EventOwnerType;

export type EventEditorContextType =
  | 'EventContext'
  | 'ReportEventContext'
  | 'BandEventContext'
  | 'ComponentEventContext'
  | 'ComponentGetValueEventContext';

export type EventEditorHelperGroup = 'log' | 'flow' | 'value' | 'mutation' | 'dynamic';

export interface EventEditorHelperDescriptor {
  id: string;
  snippet: string;
  descriptionKey: string;
  group: EventEditorHelperGroup;
}

export const EVENT_SCRIPT_DTS = `
type EventMode = 'preview' | 'print' | 'pdf';
type EventOwnerType = 'report' | 'band' | 'component';
type EventLogLevel = 'info' | 'warning' | 'error';

interface EventTargetState {
  ownerType: EventOwnerType;
  ownerId: string;
  eventName: string;
}

interface EventLogEntry extends EventTargetState {
  level: EventLogLevel;
  message: string;
}

interface EventLogCollector {
  readonly entries: EventLogEntry[];
  info(message: string, target?: Partial<EventTargetState>): void;
  warning(message: string, target?: Partial<EventTargetState>): void;
  error(message: string, target?: Partial<EventTargetState>): void;
}

interface ReportComponent {
  id: string;
  name?: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TextComponent extends ReportComponent {
  type: 'text';
  text: string;
}

interface ImageComponent extends ReportComponent {
  type: 'image';
  src: string;
  fitMode?: string;
}

interface BarcodeComponent extends ReportComponent {
  type: 'barcode';
  value: string;
  format?: string;
  showText?: boolean;
}

interface DynamicTextOptions {
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  font?: Record<string, unknown>;
}

interface DynamicImageOptions {
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  fitMode?: string;
}

interface DynamicBarcodeOptions {
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  format?: string;
  showText?: boolean;
}

interface EventContext {
  mode: EventMode;
  report?: unknown;
  page?: unknown;
  band?: unknown;
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
  value?: unknown;
  cancel(): void;
  hide(): void;
  setValue(value: unknown): void;
  getComponent(idOrName: string): ReportComponent | undefined;
  setComponentProperty(idOrName: string, path: string, value: unknown): void;
  bindText(idOrName: string, expression: string): void;
  createText(options: DynamicTextOptions): TextComponent;
  createImage(options: DynamicImageOptions): ImageComponent;
  createBarcode(options: DynamicBarcodeOptions): BarcodeComponent;
}

interface ReportEventContext extends EventContext {
  report: unknown;
  target: EventTargetState & { ownerType: 'report' };
}

interface BandEventContext extends EventContext {
  band: unknown;
  row?: Record<string, unknown>;
  rowIndex: number;
  target: EventTargetState & { ownerType: 'band' };
}

interface ComponentEventContext extends EventContext {
  component: ReportComponent;
  target: EventTargetState & { ownerType: 'component' };
}

interface ComponentGetValueEventContext extends ComponentEventContext {
  setValue(value: unknown): void;
}

declare const ctx: EventContext;
`;

export const eventEditorContextTypeByEvent = {
  report: {
    beforePreview: 'ReportEventContext',
    beforePrint: 'ReportEventContext',
    beforeRender: 'ReportEventContext',
    afterRender: 'ReportEventContext',
    beforeData: 'ReportEventContext',
    afterData: 'ReportEventContext',
  },
  band: {
    beforePrint: 'BandEventContext',
    afterPrint: 'BandEventContext',
    beforeRow: 'BandEventContext',
    afterRow: 'BandEventContext',
  },
  component: {
    getValue: 'ComponentGetValueEventContext',
    beforePrint: 'ComponentEventContext',
    afterPrint: 'ComponentEventContext',
  },
} as const satisfies {
  report: Record<ReportEventName, EventEditorContextType>;
  band: Record<BandEventName, EventEditorContextType>;
  component: Record<ComponentEventName, EventEditorContextType>;
};

export const eventEditorHelpers: readonly EventEditorHelperDescriptor[] = [
  {
    id: 'ctx.log.info',
    snippet: 'ctx.log.info(${1:message});',
    descriptionKey: 'events.helper.log.info',
    group: 'log',
  },
  {
    id: 'ctx.log.warning',
    snippet: 'ctx.log.warning(${1:message});',
    descriptionKey: 'events.helper.log.warning',
    group: 'log',
  },
  {
    id: 'ctx.log.error',
    snippet: 'ctx.log.error(${1:message});',
    descriptionKey: 'events.helper.log.error',
    group: 'log',
  },
  {
    id: 'ctx.hide',
    snippet: 'ctx.hide();',
    descriptionKey: 'events.helper.flow.hide',
    group: 'flow',
  },
  {
    id: 'ctx.cancel',
    snippet: 'ctx.cancel();',
    descriptionKey: 'events.helper.flow.cancel',
    group: 'flow',
  },
  {
    id: 'ctx.setValue',
    snippet: 'ctx.setValue(${1:value});',
    descriptionKey: 'events.helper.value.setValue',
    group: 'value',
  },
  {
    id: 'ctx.bindText',
    snippet: 'ctx.bindText(${1:idOrName}, ${2:expression});',
    descriptionKey: 'events.helper.mutation.bindText',
    group: 'mutation',
  },
  {
    id: 'ctx.getComponent',
    snippet: 'ctx.getComponent(${1:idOrName});',
    descriptionKey: 'events.helper.mutation.getComponent',
    group: 'mutation',
  },
  {
    id: 'ctx.setComponentProperty',
    snippet: 'ctx.setComponentProperty(${1:idOrName}, ${2:path}, ${3:value});',
    descriptionKey: 'events.helper.mutation.setComponentProperty',
    group: 'mutation',
  },
  {
    id: 'ctx.createText',
    snippet: 'ctx.createText({ x: ${1:0}, y: ${2:0}, width: ${3:40}, height: ${4:8}, text: ${5:text} });',
    descriptionKey: 'events.helper.dynamic.createText',
    group: 'dynamic',
  },
  {
    id: 'ctx.createImage',
    snippet: 'ctx.createImage({ x: ${1:0}, y: ${2:0}, width: ${3:40}, height: ${4:30}, src: ${5:src} });',
    descriptionKey: 'events.helper.dynamic.createImage',
    group: 'dynamic',
  },
  {
    id: 'ctx.createBarcode',
    snippet: 'ctx.createBarcode({ x: ${1:0}, y: ${2:0}, width: ${3:40}, height: ${4:16}, value: ${5:value} });',
    descriptionKey: 'events.helper.dynamic.createBarcode',
    group: 'dynamic',
  },
];

export function getEventEditorContextType(
  targetType: EventEditorTargetType,
  eventName: string,
): EventEditorContextType {
  const targetEvents = eventEditorContextTypeByEvent[targetType] as Partial<Record<string, EventEditorContextType>>;
  const contextType = targetEvents[eventName];
  if (contextType) {
    return contextType;
  }

  if (targetType === 'report') {
    return 'ReportEventContext';
  }

  if (targetType === 'band') {
    return 'BandEventContext';
  }

  return 'ComponentEventContext';
}
