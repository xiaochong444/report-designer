import type { BorderConfig, FontConfig } from '../template-model/types';

export interface RenderDocument {
  pages: RenderPage[];
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

export interface RenderText extends RenderComponentBase {
  type: 'text';
  content: string;
}

export interface RenderImage extends RenderComponentBase {
  type: 'image';
  src: string;
}

export interface RenderLine extends RenderComponentBase {
  type: 'line';
}

export interface RenderShape extends RenderComponentBase {
  type: 'shape';
}

export interface RenderCheckbox extends RenderComponentBase {
  type: 'checkbox';
  checked: boolean;
  label?: string;
}

export interface RenderBarcode extends RenderComponentBase {
  type: 'barcode';
  value: string;
}

export type RenderComponentBox =
  | RenderText
  | RenderImage
  | RenderLine
  | RenderShape
  | RenderCheckbox
  | RenderBarcode
  | RenderComponentBase;
