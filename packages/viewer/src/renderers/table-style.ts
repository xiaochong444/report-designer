import type { BorderConfig, RenderTableCell } from '@report-designer/core';
import { printableBorderWidthMm, printableBorderWidthPx } from './border-width';

type BorderSide = keyof BorderConfig['sides'];

const BORDER_SIDE_CSS: Record<BorderSide, keyof TableBorderStyle> = {
  top: 'borderTop',
  right: 'borderRight',
  bottom: 'borderBottom',
  left: 'borderLeft',
};

export interface TableBorderStyle {
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
}

export function tableCellBackgroundColor(cell: Pick<RenderTableCell, 'isHeader' | 'isFooter' | 'style'>): string | undefined {
  return cell.style?.backgroundColor ?? (cell.isHeader ? '#f0f5ff' : cell.isFooter ? '#fff7e6' : undefined);
}

export function tableBorderStyle(border: BorderConfig | undefined, scale: number): TableBorderStyle {
  const value = tableBorderCssValue(border, { target: 'preview', scale });
  if (!value || !border) return {};
  return borderSidesToStyle(border, value);
}

export function tablePrintBorderDeclarations(border: BorderConfig | undefined): string[] {
  const value = tableBorderCssValue(border, { target: 'print' });
  if (!value || !border) return [];
  return (Object.keys(border.sides) as BorderSide[])
    .filter(side => border.sides[side])
    .map(side => `${kebabCase(BORDER_SIDE_CSS[side])}:${value}`);
}

function tableBorderCssValue(border: BorderConfig | undefined, options: { target: 'preview'; scale: number } | { target: 'print' }): string | undefined {
  if (!border || border.style === 'none' || border.width <= 0) return undefined;
  const width = options.target === 'preview'
    ? `${roundCss(printableBorderWidthPx(border.width, options.scale))}px`
    : `${roundCss(printableBorderWidthMm(border.width))}mm`;
  return `${width} ${border.style} ${border.color}`;
}

function borderSidesToStyle(border: BorderConfig, value: string): TableBorderStyle {
  return (Object.keys(border.sides) as BorderSide[]).reduce<TableBorderStyle>((style, side) => {
    if (border.sides[side]) {
      style[BORDER_SIDE_CSS[side]] = value;
    }
    return style;
  }, {});
}

function kebabCase(value: string): string {
  return value.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
}

function roundCss(value: number): string {
  return Number(value.toFixed(4)).toString();
}
