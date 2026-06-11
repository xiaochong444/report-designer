import type { BandEventName, ComponentEventName, EventOwnerType, PageEventName, ReportEventName } from './types';

export type EventEditorTargetType = EventOwnerType;

export type EventEditorContextType =
  | 'EventContext'
  | 'ReportEventContext'
  | 'PageEventContext'
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
type EventOwnerType = 'report' | 'page' | 'band' | 'component';
type EventLogLevel = 'info' | 'warning' | 'error';

interface EventTargetState {
  ownerType: EventOwnerType;
  ownerId: string;
  eventName: string;
}

interface EventLogEntry extends EventTargetState {
  level: EventLogLevel;
  message: string;
  timestamp: string;
  line?: number;
  column?: number;
  stackExcerpt?: string;
}

interface EventLogCollector {
  readonly entries: EventLogEntry[];
  info(message: string, target?: Partial<EventTargetState>): void;
  warning(message: string, target?: Partial<EventTargetState>): void;
  error(message: string, target?: Partial<EventTargetState>): void;
}

type ComponentType =
  | 'text'
  | 'image'
  | 'chart'
  | 'table'
  | 'barcode'
  | 'qrcode'
  | 'checkbox'
  | 'richtext'
  | 'subreport'
  | 'panel'
  | 'line'
  | 'shape'
  | 'pagenumber'
  | 'datetime';

interface ReportComponent {
  id: string;
  name?: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  visible?: unknown;
  events?: Record<string, unknown>;
}

interface TextComponent extends ReportComponent {
  type: 'text';
  text: string;
  font?: Record<string, unknown>;
  textAlign?: string;
  verticalAlign?: string;
}

interface ImageComponent extends ReportComponent {
  type: 'image';
  src: string;
  fitMode?: string;
}

interface ChartComponent extends ReportComponent {
  type: 'chart';
  chartType?: string;
  variant?: string;
  binding?: Record<string, unknown>;
}

interface TableCell {
  text?: string;
  rowSpan?: number;
  colSpan?: number;
  width?: number;
  [key: string]: unknown;
}

interface TableRow {
  id?: string;
  height?: number;
  cells: TableCell[];
  [key: string]: unknown;
}

interface TableComponent extends ReportComponent {
  type: 'table';
  rows?: TableRow[];
  rowCount?: number;
  columnCount?: number;
}

interface BarcodeComponent extends ReportComponent {
  type: 'barcode';
  value: string;
  format?: string;
  showText?: boolean;
}

interface QRCodeComponent extends ReportComponent {
  type: 'qrcode';
  value: string;
  format?: string;
}

interface CheckboxComponent extends ReportComponent {
  type: 'checkbox';
  checked: string | boolean;
  label?: string;
}

interface RichtextComponent extends ReportComponent {
  type: 'richtext';
  html: string;
}

interface PanelComponent extends ReportComponent {
  type: 'panel';
  components: ReportComponent[];
}

interface LineComponent extends ReportComponent {
  type: 'line';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface ShapeComponent extends ReportComponent {
  type: 'shape';
  shapeType?: string;
}

interface PageNumberComponent extends ReportComponent {
  type: 'pagenumber';
  format?: string;
}

interface DateTimeComponent extends ReportComponent {
  type: 'datetime';
  format?: string;
}

type EventComponentBounds = Partial<Pick<ReportComponent, 'x' | 'y' | 'width' | 'height'>>;

interface EventComponentHandle<TComponent extends ReportComponent = ReportComponent> {
  readonly component: TComponent;
  readonly id: string;
  readonly name: string | undefined;
  readonly type: TComponent['type'];
  setProperty(path: string, value: unknown): this;
  getProperty(path: string): unknown;
  setBounds(bounds: EventComponentBounds): this;
  show(): this;
  hide(): this;
}

interface EventTextHandle extends EventComponentHandle<TextComponent> {
  setText(text: string): this;
  bindText(expression: string): this;
}

interface EventImageHandle extends EventComponentHandle<ImageComponent> {
  setSource(src: string): this;
}

interface EventBarcodeHandle extends EventComponentHandle<BarcodeComponent> {
  setValue(value: string): this;
  setFormat(format: string): this;
}

interface EventQRCodeHandle extends EventComponentHandle<QRCodeComponent> {
  setValue(value: string): this;
}

interface EventCheckboxHandle extends EventComponentHandle<CheckboxComponent> {
  setChecked(checked: string | boolean): this;
  setLabel(label: string): this;
}

interface EventRichtextHandle extends EventComponentHandle<RichtextComponent> {
  setHtml(html: string): this;
}

interface EventTableCellMatch {
  row: number;
  column: number;
  cell: TableCell;
}

interface EventTableHandle extends EventComponentHandle<TableComponent> {
  readonly rowCount: number;
  readonly columnCount: number;
  findCellText(text: string): EventTableCellMatch | undefined;
  ensureColumnCount(columnCount: number): this;
  ensureRowCount(rowCount: number): this;
  insertColumnsAfter(afterColumn: number, count?: number): this;
  insertRowsAfter(afterRow: number, count?: number): this;
  setCellText(row: number, column: number, text: string): this;
  setCell(row: number, column: number, cell: Partial<TableCell>): this;
  mergeCells(row: number, column: number, rowSpan: number, colSpan: number): this;
  setColumnWidth(column: number, width: number | undefined): this;
  distributeColumns(startColumn?: number, count?: number): this;
}

type EventTableComponentHandle = EventTableHandle;
type EventBaseComponentFactory = (name: string) => EventComponentHandle;
type EventTextComponentFactory = (name: string) => EventTextHandle;
type EventImageComponentFactory = (name: string) => EventImageHandle;
type EventTableComponentFactory = (name: string) => EventTableHandle;
type EventBarcodeComponentFactory = (name: string) => EventBarcodeHandle;
type EventQRCodeComponentFactory = (name: string) => EventQRCodeHandle;
type EventCheckboxComponentFactory = (name: string) => EventCheckboxHandle;
type EventRichtextComponentFactory = (name: string) => EventRichtextHandle;
type EventTypedComponentFactory = (name: string) => EventComponentHandle;
type EventComponentAccessor = EventBaseComponentFactory & Partial<ReportComponent>;

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
  value?: unknown;
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

interface ReportEventContext extends EventContext {
  report: unknown;
  target: EventTargetState & { ownerType: 'report' };
}

interface PageEventContext extends EventContext {
  page: unknown;
  target: EventTargetState & { ownerType: 'page' };
}

interface BandEventContext extends EventContext {
  band: unknown;
  row?: Record<string, unknown>;
  rowIndex: number;
  target: EventTargetState & { ownerType: 'band' };
}

interface ComponentEventContext extends EventContext {
  component: EventComponentAccessor;
  currentComponent: ReportComponent;
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
  page: {
    beforePrint: 'PageEventContext',
    afterPrint: 'PageEventContext',
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
  page: Record<PageEventName, EventEditorContextType>;
  band: Record<BandEventName, EventEditorContextType>;
  component: Record<ComponentEventName, EventEditorContextType>;
};

export const eventEditorHelpers: readonly EventEditorHelperDescriptor[] = [
  {
    id: 'ctx.log.info',
    snippet: 'ctx.log.info("${1:message}");',
    descriptionKey: 'events.helper.log.info',
    group: 'log',
  },
  {
    id: 'ctx.log.warning',
    snippet: 'ctx.log.warning("${1:message}");',
    descriptionKey: 'events.helper.log.warning',
    group: 'log',
  },
  {
    id: 'ctx.log.error',
    snippet: 'ctx.log.error("${1:message}");',
    descriptionKey: 'events.helper.log.error',
    group: 'log',
  },
  {
    id: 'ctx.hide',
    snippet: 'ctx.hide?.();',
    descriptionKey: 'events.helper.flow.hide',
    group: 'flow',
  },
  {
    id: 'ctx.cancel',
    snippet: 'ctx.cancel?.();',
    descriptionKey: 'events.helper.flow.cancel',
    group: 'flow',
  },
  {
    id: 'ctx.setValue',
    snippet: 'ctx.setValue?.("${1:value}");',
    descriptionKey: 'events.helper.value.setValue',
    group: 'value',
  },
  {
    id: 'ctx.bindText',
    snippet: 'ctx.bindText?.("${1:Text1}", "${2:{Data.Field}}");',
    descriptionKey: 'events.helper.mutation.bindText',
    group: 'mutation',
  },
  {
    id: 'ctx.getComponent',
    snippet: 'ctx.getComponent?.("${1:Text1}");',
    descriptionKey: 'events.helper.mutation.getComponent',
    group: 'mutation',
  },
  {
    id: 'ctx.setComponentProperty',
    snippet: 'ctx.setComponentProperty?.("${1:Text1}", "${2:text}", "${3:value}");',
    descriptionKey: 'events.helper.mutation.setComponentProperty',
    group: 'mutation',
  },
  {
    id: 'ctx.createText',
    snippet: 'ctx.createText?.({ x: ${1:0}, y: ${2:0}, width: ${3:40}, height: ${4:8}, text: "${5:New text}" });',
    descriptionKey: 'events.helper.dynamic.createText',
    group: 'dynamic',
  },
  {
    id: 'ctx.createImage',
    snippet: 'ctx.createImage?.({ x: ${1:0}, y: ${2:0}, width: ${3:40}, height: ${4:30}, src: "${5:image.png}" });',
    descriptionKey: 'events.helper.dynamic.createImage',
    group: 'dynamic',
  },
  {
    id: 'ctx.createBarcode',
    snippet: 'ctx.createBarcode?.({ x: ${1:0}, y: ${2:0}, width: ${3:40}, height: ${4:16}, value: "${5:123456}" });',
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

  if (targetType === 'page') {
    return 'PageEventContext';
  }

  if (targetType === 'band') {
    return 'BandEventContext';
  }

  return 'ComponentEventContext';
}
