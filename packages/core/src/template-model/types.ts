/** 表达式类型 — 简化字符串表达式 */
export type Expression = string;

/** 页边距 */
export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** 字体配置 */
export interface FontConfig {
  family: string;
  size: number;        // pt
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  color: string;       // CSS 颜色
}

/** 边框配置 */
export interface BorderConfig {
  style: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  width: number;       // mm
  color: string;       // CSS 颜色
  sides: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
}

/** 条件规则 */
export interface ConditionRule {
  id: string;
  expression: Expression;
  overrides: Record<string, any>;
}

/** 报表样式 */
export interface ReportStyle {
  id: string;
  name: string;
  font: FontConfig;
  border: BorderConfig;
  backgroundColor: string;
}

/** 条件格式 */
export interface ConditionalFormat {
  id: string;
  name: string;
  rules: ConditionRule[];
  applyTo: string[];
}

/** 数据字段 */
export interface DataField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  label?: string;
}

/** 数据源 */
export interface DataSource {
  id: string;
  name: string;
  type: 'json' | 'static';
  schema: DataField[];
  data?: Record<string, any>[];
}

/** 组件类型枚举 */
export type ComponentType = 'text' | 'image' | 'table' | 'barcode' | 'checkbox' | 'richtext' | 'subreport' | 'panel';

/** 组件基类 */
export interface ReportComponent {
  id: string;
  name?: string;     // 组件名称
  type: ComponentType;
  x: number;          // mm
  y: number;          // mm
  width: number;      // mm
  height: number;     // mm
  zOrder?: number;    // stacking order
  backgroundColor?: string; // 背景色
  padding?: { top: number; right: number; bottom: number; left: number }; // mm
  style?: string;     // 引用 styles 中的 ID
  conditions?: ConditionRule[];
  anchor?: string;
}

/** 文本组件 */
export interface TextComponent extends ReportComponent {
  type: 'text';
  text: Expression;
  font: FontConfig;
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  border: BorderConfig;
  canGrow: boolean;
  canShrink: boolean;
}

/** 图片组件 */
export interface ImageComponent extends ReportComponent {
  type: 'image';
  src: Expression;
  fitMode: 'fill' | 'contain' | 'cover' | 'stretch';
}

/** 表格列 */
export interface TableColumn {
  id: string;
  header: string;
  field: string;
  width: number;          // mm
  cellType: 'text' | 'image' | 'barcode' | 'checkbox';
}

/** 表格组件 */
export interface TableComponent extends ReportComponent {
  type: 'table';
  dataSource: string;
  columns: TableColumn[];
  headerHeight: number;
  rowHeight: number;
  alternateRowStyle?: string;
  showBorder: boolean;
}

/** 条码类型 */
export type BarcodeFormat = 'QR_CODE' | 'CODE128' | 'EAN13' | 'EAN8' | 'UPC' | 'CODE39' | 'ITF14';

/** 条码组件 */
export interface BarcodeComponent extends ReportComponent {
  type: 'barcode';
  value: Expression;
  format: BarcodeFormat;
  showText: boolean;
}

/** 复选框组件 */
export interface CheckboxComponent extends ReportComponent {
  type: 'checkbox';
  checked: Expression;
  label?: Expression;
}

/** 富文本组件 */
export interface RichtextComponent extends ReportComponent {
  type: 'richtext';
  html: Expression;
}

/** 子报表组件 */
export interface SubreportComponent extends ReportComponent {
  type: 'subreport';
  templateUrl: string;
  parameters: Record<string, Expression>;
}

/** 面板组件 */
export interface PanelComponent extends ReportComponent {
  type: 'panel';
  components: ReportComponent[];
  backgroundColor?: string;
  border: BorderConfig;
}

/** 带类型 */
export type BandType = 'reportTitle' | 'reportSummary' | 'pageHeader' | 'pageFooter' | 'groupHeader' | 'groupFooter' | 'data' | 'child';

/** 带 */
export interface Band {
  id: string;
  type: BandType;
  height: number;
  components: ReportComponent[];
  dataSource?: string;
  groupField?: string;
  visible?: Expression;
}

/** 页面方向 */
export type PageOrientation = 'portrait' | 'landscape';

/** 页面 */
export interface Page {
  id: string;
  width: number;         // mm
  height: number;        // mm
  margins: Margins;
  orientation: PageOrientation;
  bands: Band[];
}

/** 报表模板根 */
export interface ReportTemplate {
  id: string;
  name: string;
  version: '1.0';
  pages: Page[];
  dataSources: DataSource[];
  styles: ReportStyle[];
  conditionalFormats: ConditionalFormat[];
}

/** 所有组件类型联合 */
export type ReportComponentUnion =
  | TextComponent
  | ImageComponent
  | TableComponent
  | BarcodeComponent
  | CheckboxComponent
  | RichtextComponent
  | SubreportComponent
  | PanelComponent;

/** 数据上下文 */
export type DataContext = Record<string, Record<string, any>[] | Record<string, any>>;

/** 校验结果 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
