import type { BandEventName, ComponentEventName, EventMap, ReportEventName } from '../event-engine/types';

export type Expression = string;

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface FontConfig {
  family: string;
  size: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  color: string;
}

export interface ReportFont {
  id: string;
  name: string;
  family: string;
  fallback?: string;
  source?: {
    url?: string;
    dataUrl?: string;
    format?: 'woff2' | 'woff' | 'truetype' | 'opentype';
  };
  builtin?: boolean;
}

export type RichTextDocument = Record<string, unknown>;

export interface BorderConfig {
  style: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  width: number;
  color: string;
  sides: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
}

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ConditionRule {
  id: string;
  expression: Expression;
  conditionType?: 'expression' | 'value';
  enabled?: boolean;
  breakIfTrue?: boolean;
  dataType?: 'string' | 'number' | 'date' | 'boolean' | 'expression';
  field?: Expression;
  operator?:
    | 'equalTo'
    | 'notEqualTo'
    | 'between'
    | 'notBetween'
    | 'greaterThan'
    | 'greaterThanOrEqualTo'
    | 'lessThan'
    | 'lessThanOrEqualTo'
    | 'containing'
    | 'notContaining'
    | 'beginningWith'
    | 'endingWith';
  value?: string | number | boolean;
  valueTo?: string | number | boolean;
  overrides: Record<string, any>;
}

export type TextFormatType = 'none' | 'text' | 'number' | 'currency' | 'date' | 'time' | 'dateTime' | 'percent' | 'boolean' | 'custom';
export type TextFormatNegativePattern = 'minus' | 'parentheses';
export type TextFormatPositivePattern = 'plain' | 'plus';
export type TextFormatSymbolPosition = 'prefix' | 'suffix';
export type TextFormatTextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

export interface TextFormatConfig {
  type: TextFormatType;
  pattern?: string;
  nullValue?: string;
  trueText?: string;
  falseText?: string;
  decimalDigits?: number;
  decimalSeparator?: string;
  useGroupSeparator?: boolean;
  groupSeparator?: string;
  groupSize?: number;
  useAbbreviation?: boolean;
  positivePattern?: TextFormatPositivePattern;
  negativePattern?: TextFormatNegativePattern;
  currencySymbol?: string;
  currencySymbolPosition?: TextFormatSymbolPosition;
  currencySpace?: boolean;
  percentMultiplier?: 1 | 100;
  percentSymbol?: string;
  percentSymbolPosition?: TextFormatSymbolPosition;
  percentSpace?: boolean;
  dateFormat?: string;
  timeFormat?: string;
  textTransform?: TextFormatTextTransform;
  trimText?: boolean;
  trueValues?: string[];
  falseValues?: string[];
}

export type TextAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';

export interface ReportStyle {
  id: string;
  name: string;
  category?: 'text';
  font: Partial<FontConfig>;
  border: Partial<BorderConfig>;
  backgroundColor: string;
  textAlign?: TextAlign;
  verticalAlign?: VerticalAlign;
  padding?: Partial<Padding>;
  format?: TextFormatConfig;
  canGrow?: boolean;
  canShrink?: boolean;
  isDefault?: boolean;
}

export interface ConditionalFormat {
  id: string;
  name: string;
  rules: ConditionRule[];
  applyTo: string[];
}

export type JsonFieldType = 'null' | 'boolean' | 'number' | 'date' | 'string';

export interface DataField {
  id?: string;
  name: string;
  path?: string;
  type: JsonFieldType;
  label?: string;
  nullable?: boolean;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'json';
  path?: string;
  fields?: DataField[];
  schema?: DataField[];
  data?: Record<string, any>[];
  parentSourceId?: string;
  parentPath?: string;
}

export type ComponentType =
  | 'text'
  | 'image'
  | 'table'
  | 'barcode'
  | 'checkbox'
  | 'richtext'
  | 'subreport'
  | 'panel'
  | 'line'
  | 'shape'
  | 'pagenumber'
  | 'datetime';

export interface ReportComponent {
  id: string;
  name?: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  zOrder?: number;
  backgroundColor?: string;
  padding?: Padding;
  style?: string;
  conditionalFormat?: string;
  visible?: Expression;
  printableExpression?: Expression;
  conditions?: ConditionRule[];
  events?: EventMap<ComponentEventName>;
  anchor?: string;
}

export interface TextComponent extends ReportComponent {
  type: 'text';
  text: Expression;
  format?: TextFormatConfig;
  font: FontConfig;
  textAlign: TextAlign;
  verticalAlign: VerticalAlign;
  border: BorderConfig;
  canGrow: boolean;
  canShrink: boolean;
  styleBindings?: string[];
}

export interface ImageComponent extends ReportComponent {
  type: 'image';
  src: Expression;
  fitMode: 'fill' | 'contain' | 'cover' | 'stretch';
}

export interface TableColumn {
  id: string;
  header: string;
  field: string;
  width: number;
  cellType: 'text' | 'image' | 'barcode' | 'checkbox';
}

export interface TableCell {
  row: number;
  column: number;
  text?: Expression;
  rowSpan?: number;
  colSpan?: number;
}

export interface TableComponent extends ReportComponent {
  type: 'table';
  dataSource: string;
  columns: TableColumn[];
  rowCount?: number;
  columnCount?: number;
  headerRowsCount?: number;
  footerRowsCount?: number;
  canBreak?: boolean;
  cells?: TableCell[];
  headerHeight: number;
  rowHeight: number;
  alternateRowStyle?: string;
  showBorder: boolean;
}

export type BarcodeFormat = 'QR_CODE' | 'CODE128' | 'EAN13' | 'EAN8' | 'UPC' | 'CODE39' | 'ITF14';

export interface BarcodeComponent extends ReportComponent {
  type: 'barcode';
  value: Expression;
  format: BarcodeFormat;
  showText: boolean;
}

export interface CheckboxComponent extends ReportComponent {
  type: 'checkbox';
  checked: Expression;
  label?: Expression;
}

export interface RichtextComponent extends ReportComponent {
  type: 'richtext';
  html: Expression;
  document?: RichTextDocument;
}

export interface SubreportComponent extends ReportComponent {
  type: 'subreport';
  templateUrl: string;
  parameters: Record<string, Expression>;
}

export interface PanelComponent extends ReportComponent {
  type: 'panel';
  components: ReportComponent[];
  backgroundColor?: string;
  border: BorderConfig;
}

export interface LineComponent extends ReportComponent {
  type: 'line';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  lineColor: string;
  lineWidth: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
}

export interface ShapeComponent extends ReportComponent {
  type: 'shape';
  shapeType: 'rectangle' | 'ellipse' | 'roundRect' | 'triangle';
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';
}

export interface PageNumberComponent extends ReportComponent {
  type: 'pagenumber';
  format: '1' | '1/N' | 'Page 1 of N' | 'Page 1';
  font: FontConfig;
  textAlign: TextAlign;
  verticalAlign?: VerticalAlign;
}

export interface DateTimeComponent extends ReportComponent {
  type: 'datetime';
  format: string;
  font: FontConfig;
  textAlign: TextAlign;
  verticalAlign?: VerticalAlign;
}

export type ReportComponentUnion =
  | TextComponent
  | ImageComponent
  | TableComponent
  | BarcodeComponent
  | CheckboxComponent
  | RichtextComponent
  | SubreportComponent
  | PanelComponent
  | LineComponent
  | ShapeComponent
  | PageNumberComponent
  | DateTimeComponent;

export const STANDARD_BAND_TYPES = [
  'reportTitle',
  'reportSummary',
  'pageHeader',
  'pageFooter',
  'header',
  'footer',
  'groupHeader',
  'groupFooter',
  'columnHeader',
  'columnFooter',
  'data',
  'hierarchicalData',
  'child',
  'emptyData',
  'overlay',
] as const;

export type StandardBandType = typeof STANDARD_BAND_TYPES[number];
export type BandType = StandardBandType;
export type BandPrintOn = 'allPages' | 'firstPage' | 'exceptFirstPage' | 'lastPage' | 'oddPages' | 'evenPages';

export interface BandBehavior {
  enabled: boolean;
  visibleExpression?: string;
  printOn: BandPrintOn;
  printIfEmpty: boolean;
  printOnAllPages: boolean;
  keepTogether: boolean;
  canBreak: boolean;
  breakIfLessThan?: number;
  printAtBottom: boolean;
}

export interface DataBandOptions {
  dataSourceId?: string;
  filterExpression?: string;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  columns?: { count: number; gap: number; direction: 'downThenAcross' | 'acrossThenDown' };
}

export interface GroupBandOptions {
  name?: string;
  conditionExpression?: string;
  groupHeaderId?: string;
}

export interface Band {
  id: string;
  type: StandardBandType;
  name?: string;
  height: number;
  components: ReportComponent[];
  behavior?: BandBehavior;
  dataBand?: DataBandOptions;
  group?: GroupBandOptions;
  dataSource?: string;
  groupField?: string;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  visible?: Expression;
  events?: EventMap<BandEventName>;
}

export type PageOrientation = 'portrait' | 'landscape';

export interface Page {
  id: string;
  width: number;
  height: number;
  margins: Margins;
  orientation: PageOrientation;
  bands: Band[];
}

export interface ReportParameter {
  id: string;
  name: string;
  type: JsonFieldType;
  defaultValue?: unknown;
}

export interface ReportTemplate {
  id: string;
  name: string;
  version: '2.0';
  pages: Page[];
  dataSources: DataSource[];
  styles: ReportStyle[];
  conditionalFormats: ConditionalFormat[];
  parameters: ReportParameter[];
  fonts?: ReportFont[];
  events?: EventMap<ReportEventName>;
}

export interface JsonDictionary {
  dataSources: DataSource[];
}

export interface ValidationResult<TError = string> {
  valid: boolean;
  errors: TError[];
}

export type DataContext = Record<string, Record<string, any>[] | Record<string, any>>;

export function mapDataField(source: Pick<DataSource, 'id'>, field: Pick<DataField, 'name' | 'type' | 'label'>): DataField {
  return {
    id: `${source.id}.${field.name}`,
    name: field.name,
    path: `${source.id}.${field.name}`,
    type: field.type,
    label: field.label,
    nullable: false,
  };
}
