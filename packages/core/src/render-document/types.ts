import type { BorderConfig, FontConfig, ReportFont } from '../template-model/types';
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
}

export interface RenderBarcode extends RenderComponentBase {
  type: 'barcode';
  value: string;
  format?: string;
  showText?: boolean;
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
  | RenderPanel
  | RenderSubreport
  | RenderComponentBase;
