import type { BorderConfig, FontConfig, Padding, PageBorder, PageWatermark, ReportFont, TableColumn } from '../template-model/types';
import type { EventLogEntry } from '../event-engine/types';

export interface RenderDocument {
  pages: RenderPage[];
  fonts?: ReportFont[];
  eventLogs?: EventLogEntry[];
}

export interface RenderPage {
  id: string;
  pageNumber: number;
  totalPages: number;
  width: number;
  height: number;
  backgroundColor?: string;
  watermark?: PageWatermark;
  pageBorder?: PageBorder;
  items: RenderBandBox[];
}

export interface RenderBandBox {
  id: string;
  bandId: string;
  bandType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  components: RenderComponentBox[];
  overflow?: boolean;
}

export interface RenderStyle {
  font?: FontConfig;
  border?: BorderConfig;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  padding?: Padding;
}

export interface RenderComponentBase {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style?: RenderStyle;
  overflow?: boolean;
}

export interface RenderContainerBase extends RenderComponentBase {
  children: RenderComponentBox[];
}

export interface RenderText extends RenderComponentBase {
  type: 'text';
  content: string;
}

export interface RenderImage extends RenderComponentBase {
  type: 'image';
  src: string;
  fitMode?: 'fill' | 'contain' | 'cover' | 'stretch';
}

export interface RenderRichText extends RenderComponentBase {
  type: 'richtext';
  html: string;
}

export interface RenderLine extends RenderComponentBase {
  type: 'line';
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  lineColor?: string;
  lineWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface RenderShape extends RenderComponentBase {
  type: 'shape';
  shapeType?: 'rectangle' | 'ellipse' | 'roundRect' | 'triangle';
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface RenderCheckbox extends RenderComponentBase {
  type: 'checkbox';
  checked: boolean;
  label?: string;
  foregroundColor?: string;
  font?: FontConfig;
}

export interface RenderBarcode extends RenderComponentBase {
  type: 'barcode';
  value: string;
  format?: string;
  showText?: boolean;
  foregroundColor?: string;
  font?: FontConfig;
}

export interface RenderTableCell {
  row: number;
  column: number;
  content: string;
  field?: string;
  rowSpan: number;
  colSpan: number;
  height: number;
  isHeader?: boolean;
  isFooter?: boolean;
  style?: RenderStyle;
}

export interface RenderTable extends RenderComponentBase {
  type: 'table';
  columns: TableColumn[];
  rows: RenderTableCell[][];
  showBorder: boolean;
}

export interface RenderPanel extends RenderContainerBase {
  type: 'panel';
}

export interface RenderSubreport extends RenderContainerBase {
  type: 'subreport';
  templateUrl: string;
  missing: boolean;
}

export type RenderComponentBox =
  | RenderText
  | RenderImage
  | RenderRichText
  | RenderLine
  | RenderShape
  | RenderCheckbox
  | RenderBarcode
  | RenderTable
  | RenderPanel
  | RenderSubreport
  | RenderComponentBase;
