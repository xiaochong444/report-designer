import type { TextComponent } from '../template-model/types';

export interface MeasuredBox {
  width: number;
  height: number;
  lineCount: number;
  overflow: boolean;
}

export function measureTextBox(component: TextComponent, content: string): MeasuredBox {
  const fontSizePt = component.font?.size ?? 10;
  const averageCharWidthMm = fontSizePt * 0.3528 * 0.52;
  const lineHeightMm = fontSizePt * 0.3528 * 1.2;
  const charsPerLine = Math.max(1, Math.floor(component.width / averageCharWidthMm));
  const normalized = content.length > 0 ? content : ' ';
  const lineCount = normalized
    .split(/\r?\n/)
    .reduce((count, line) => count + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
  const measuredHeight = roundMm(lineCount * lineHeightMm);

  if (measuredHeight > component.height) {
    return {
      width: component.width,
      height: component.canGrow ? measuredHeight : component.height,
      lineCount,
      overflow: !component.canGrow,
    };
  }

  if (component.canShrink && measuredHeight < component.height) {
    return {
      width: component.width,
      height: measuredHeight,
      lineCount,
      overflow: false,
    };
  }

  return {
    width: component.width,
    height: component.height,
    lineCount,
    overflow: false,
  };
}

export function roundMm(value: number): number {
  return Math.round(value * 1000) / 1000;
}
