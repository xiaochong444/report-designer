import React, { useEffect, useRef, useState } from 'react';
import { sanitizeRichHtml, type RenderBarcode, type RenderChart, type RenderCheckbox, type RenderComponentBox, type RenderImage, type RenderLine, type RenderQRCode, type RenderRichText, type RenderShape, type RenderTable, type RenderText } from '@report-designer/core';
import { tableBorderStyle, tableCellBackgroundColor } from '../table-style';
import { buildVChartSpec } from '../chart/chart-spec';
import { printableBorderWidthPx } from '../border-width';
import { renderCodeSymbolSvg } from '../../code-symbols';

export const MM_TO_PX = 96 / 25.4;
type RenderTextStyle = NonNullable<RenderText['style']> & {
  padding?: { top: number; right: number; bottom: number; left: number };
};
type StyledRenderTableCell = RenderTable['rows'][number][number] & {
  style?: RenderTable['style'];
};

interface RenderComponentProps {
  component: RenderComponentBox;
  zoom: number;
  parentOriginX?: number;
  parentOriginY?: number;
}

export const RenderComponent: React.FC<RenderComponentProps> = ({ component, zoom, parentOriginX = 0, parentOriginY = 0 }) => {
  const scale = zoom / 100;
  const style = toAbsoluteStyle(component, scale, parentOriginX, parentOriginY);
  const dataProps = { 'data-report-component': component.id };

  switch (component.type) {
    case 'panel':
    case 'subreport':
      return (
        <div data-testid={`render-component-${component.type}`} {...dataProps} style={style}>
          {'children' in component ? component.children.map((child) => (
            <RenderComponent key={child.id} component={child} zoom={zoom} parentOriginX={component.x} parentOriginY={component.y} />
          )) : null}
        </div>
      );
    case 'text':
      return (
        <div data-testid="render-component-text" {...dataProps} style={{ ...style, ...textBoxStyle(component as RenderText, scale) }}>
          <div data-testid="render-component-text-content" style={textContentStyle(component as RenderText)}>
            {(component as RenderText).content}
          </div>
        </div>
      );
    case 'image':
      return <img data-testid="render-component-image" {...dataProps} src={(component as RenderImage).src} alt="" style={{ ...style, objectFit: imageFitMode(component as RenderImage) }} />;
    case 'chart':
      return <ChartComponent component={component as RenderChart} style={style} scale={scale} dataProps={dataProps} />;
    case 'richtext':
      return (
        <div
          data-testid="render-component-richtext"
          {...dataProps}
          style={{ ...style, overflow: 'hidden' }}
          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml((component as RenderRichText).html) }}
        />
      );
    case 'line':
      return <LineComponent component={component as RenderLine} style={style} dataProps={dataProps} />;
    case 'shape':
      return <ShapeComponent component={component as RenderShape} style={style} dataProps={dataProps} />;
    case 'checkbox':
      return <CheckboxComponent component={component as RenderCheckbox} style={style} scale={scale} dataProps={dataProps} />;
    case 'barcode':
      return <BarcodeComponent component={component as RenderBarcode} style={style} scale={scale} dataProps={dataProps} />;
    case 'qrcode':
      return <QRCodeComponent component={component as RenderQRCode} style={style} dataProps={dataProps} />;
    case 'table':
      return <TableComponent component={component as RenderTable} style={style} scale={scale} dataProps={dataProps} />;
    default:
      return <div data-testid="render-component-unknown" {...dataProps} style={style} />;
  }
};

const ChartComponent: React.FC<{ component: RenderChart; style: React.CSSProperties; scale: number; dataProps: Record<string, string> }> = ({ component, style, scale, dataProps }) => {
  const width = Math.max(1, Math.round(component.width * MM_TO_PX * scale));
  const height = Math.max(1, Math.round(component.height * MM_TO_PX * scale));
  if (component.imageDataUrl) {
    return <img data-testid="render-component-chart" {...dataProps} src={component.imageDataUrl} alt="" style={{ ...style, objectFit: 'contain' }} />;
  }
  if (component.data.length === 0) {
    return (
      <div data-testid="render-component-chart" {...dataProps} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8c8c8c', fontSize: 12 * scale, border: style.border ?? '1px dashed #d9d9d9' }}>
        {component.emptyMessage ?? 'No data'}
      </div>
    );
  }
  return (
    <div data-testid="render-component-chart" {...dataProps} style={{ ...style, overflow: 'hidden', backgroundColor: component.style?.backgroundColor ?? '#ffffff' }}>
      <AsyncVChart spec={buildVChartSpec(component, { width, height })} />
    </div>
  );
};

const AsyncVChart: React.FC<{ spec: ReturnType<typeof buildVChartSpec> }> = ({ spec }) => {
  const chartRef = useRef<{ release: () => void } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let canceled = false;
    const container = containerRef.current;
    if (!container) return undefined;
    setFailed(false);
    container.innerHTML = '';

    import('@visactor/vchart')
      .then(module => {
        if (canceled || !containerRef.current) return undefined;
        const VChart = module.default;
        const instance = new VChart(spec as any, { dom: containerRef.current });
        chartRef.current = instance;
        return instance.renderAsync();
      })
      .catch(() => {
        if (!canceled) {
          setFailed(true);
        }
      });
    return () => {
      canceled = true;
      chartRef.current?.release();
      chartRef.current = null;
      container.innerHTML = '';
    };
  }, [spec]);

  return (
    <div ref={containerRef} data-testid="render-component-chart-vchart" style={{ width: '100%', height: '100%' }}>
      {failed ? <div style={{ width: '100%', height: '100%' }} /> : null}
    </div>
  );
};

function imageFitMode(component: RenderImage): React.CSSProperties['objectFit'] {
  return component.fitMode === 'stretch' || component.fitMode === 'fill'
    ? 'fill'
    : component.fitMode ?? 'contain';
}

export function toAbsoluteStyle(component: RenderComponentBox, scale: number, parentOriginX = 0, parentOriginY = 0): React.CSSProperties {
  const border = component.type === 'table' ? undefined : component.style?.border;
  const padding = component.type === 'table' ? undefined : component.style?.padding;
  return {
    position: 'absolute',
    left: (component.x - parentOriginX) * MM_TO_PX * scale,
    top: (component.y - parentOriginY) * MM_TO_PX * scale,
    width: component.width * MM_TO_PX * scale,
    height: component.height * MM_TO_PX * scale,
    boxSizing: 'border-box',
    overflow: component.overflow ? 'hidden' : 'visible',
    backgroundColor: component.style?.backgroundColor,
    borderTop: border?.sides.top ? `${printableBorderWidthPx(border.width, scale)}px ${border.style} ${border.color}` : undefined,
    borderRight: border?.sides.right ? `${printableBorderWidthPx(border.width, scale)}px ${border.style} ${border.color}` : undefined,
    borderBottom: border?.sides.bottom ? `${printableBorderWidthPx(border.width, scale)}px ${border.style} ${border.color}` : undefined,
    borderLeft: border?.sides.left ? `${printableBorderWidthPx(border.width, scale)}px ${border.style} ${border.color}` : undefined,
    paddingTop: toPaddingPx(padding?.top, scale),
    paddingRight: toPaddingPx(padding?.right, scale),
    paddingBottom: toPaddingPx(padding?.bottom, scale),
    paddingLeft: toPaddingPx(padding?.left, scale),
  };
}

function textBoxStyle(component: RenderText, scale: number): React.CSSProperties {
  const style = component.style as RenderTextStyle | undefined;
  const font = style?.font;
  return {
    color: font?.color,
    fontFamily: font?.family,
    fontSize: (font?.size ?? 10) * 1.333 * scale,
    fontWeight: font?.bold ? 700 : 400,
    fontStyle: font?.italic ? 'italic' : undefined,
    textDecoration: textDecorationValue(font),
    display: 'flex',
    alignItems: verticalAlignToFlex(style?.verticalAlign),
    paddingTop: toPaddingPx(style?.padding?.top, scale),
    paddingRight: toPaddingPx(style?.padding?.right, scale),
    paddingBottom: toPaddingPx(style?.padding?.bottom, scale),
    paddingLeft: toPaddingPx(style?.padding?.left, scale),
    whiteSpace: 'pre-wrap',
  };
}

function textContentStyle(component: RenderText): React.CSSProperties {
  return {
    width: '100%',
    textAlign: component.style?.textAlign ?? 'left',
    whiteSpace: 'inherit',
  };
}

function verticalAlignToFlex(value?: 'top' | 'middle' | 'bottom'): React.CSSProperties['alignItems'] {
  if (value === 'middle') return 'center';
  if (value === 'bottom') return 'flex-end';
  return 'flex-start';
}

function textDecorationValue(font?: RenderTextStyle['font']): React.CSSProperties['textDecoration'] {
  const values = [font?.underline ? 'underline' : null, font?.strikethrough ? 'line-through' : null].filter(Boolean);
  return values.length > 0 ? values.join(' ') : undefined;
}

function toPaddingPx(value = 0, scale: number): number {
  return value * MM_TO_PX * scale;
}

const LineComponent: React.FC<{ component: RenderLine; style: React.CSSProperties; dataProps: Record<string, string> }> = ({ component, style, dataProps }) => (
  <svg data-testid="render-component-line" {...dataProps} style={{ ...style, color: component.lineColor ?? '#000000' }} viewBox={`0 0 ${Math.max(1, component.width)} ${Math.max(1, component.height)}`} preserveAspectRatio="none">
    <line
      x1={component.startX ?? 0}
      y1={component.startY ?? component.height / 2}
      x2={component.endX ?? component.width}
      y2={component.endY ?? component.height / 2}
      stroke="currentColor"
      strokeWidth={printableBorderWidthPx(component.lineWidth ?? 0.2, 1)}
      strokeDasharray={lineDashArray(component.lineStyle)}
    />
  </svg>
);

const ShapeComponent: React.FC<{ component: RenderShape; style: React.CSSProperties; dataProps: Record<string, string> }> = ({ component, style, dataProps }) => {
  const strokeWidth = printableBorderWidthPx(component.borderWidth ?? 0.2, 1);
  const stroke = component.borderColor ?? '#000000';
  const fill = component.fillColor ?? 'transparent';
  const dash = lineDashArray(component.borderStyle);
  const viewBox = `0 0 ${Math.max(1, component.width)} ${Math.max(1, component.height)}`;
  const common = { fill, stroke, strokeWidth, strokeDasharray: dash };

  return (
    <svg data-testid="render-component-shape" {...dataProps} style={style} viewBox={viewBox} preserveAspectRatio="none">
      {component.shapeType === 'ellipse'
        ? <ellipse cx={component.width / 2} cy={component.height / 2} rx={Math.max(0, component.width / 2 - strokeWidth / 2)} ry={Math.max(0, component.height / 2 - strokeWidth / 2)} {...common} />
        : component.shapeType === 'triangle'
          ? <polygon points={`${component.width / 2},${strokeWidth / 2} ${component.width - strokeWidth / 2},${component.height - strokeWidth / 2} ${strokeWidth / 2},${component.height - strokeWidth / 2}`} {...common} />
          : <rect x={strokeWidth / 2} y={strokeWidth / 2} width={Math.max(0, component.width - strokeWidth)} height={Math.max(0, component.height - strokeWidth)} rx={component.shapeType === 'roundRect' ? 3 : 0} {...common} />}
    </svg>
  );
};

const CheckboxComponent: React.FC<{ component: RenderCheckbox; style: React.CSSProperties; scale: number; dataProps: Record<string, string> }> = ({ component, style, scale, dataProps }) => {
  const foregroundColor = component.foregroundColor ?? '#333333';
  const labelColor = component.font?.color ?? foregroundColor;
  return (
    <div data-testid="render-component-checkbox" {...dataProps} style={{ ...style, display: 'flex', alignItems: 'center', gap: 4 * scale }}>
      <span style={{ width: 12 * scale, height: 12 * scale, border: `1px solid ${foregroundColor}`, color: foregroundColor, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', fontSize: 3 * MM_TO_PX * scale, fontWeight: 400, fontStyle: 'normal', lineHeight: 1, textDecoration: 'none' }}>
        {component.checked ? '✓' : ''}
      </span>
      {component.label ? <span style={fontStyle(component.font, labelColor, scale)}>{component.label}</span> : null}
    </div>
  );
};

const BarcodeComponent: React.FC<{ component: RenderBarcode; style: React.CSSProperties; scale: number; dataProps: Record<string, string> }> = ({ component, style, scale, dataProps }) => {
  const foregroundColor = component.foregroundColor ?? '#000000';
  const textColor = component.font?.color ?? foregroundColor;
  const symbol = renderCodeSymbolSvg({ type: 'barcode', value: component.value, format: component.format ?? 'CODE128', foregroundColor });

  return (
    <div data-testid="render-component-barcode" {...dataProps} style={{ ...style, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ width: '100%', height: component.showText ? '75%' : '100%', minHeight: 0 }} dangerouslySetInnerHTML={{ __html: symbol.svg }} />
      {component.showText ? <div style={{ ...fontStyle(component.font, textColor, scale, 10), lineHeight: '1.1', textAlign: 'center' }}>{component.value}</div> : null}
    </div>
  );
};

const QRCodeComponent: React.FC<{ component: RenderQRCode; style: React.CSSProperties; dataProps: Record<string, string> }> = ({ component, style, dataProps }) => {
  const symbol = renderCodeSymbolSvg({ type: 'qrcode', value: component.value, format: component.format ?? 'QR_CODE', foregroundColor: component.foregroundColor });
  return (
    <div data-testid="render-component-qrcode" {...dataProps} style={{ ...style, overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: symbol.svg }} />
  );
};

function fontStyle(
  font: RenderBarcode['font'] | RenderCheckbox['font'] | undefined,
  color: string,
  scale: number,
  defaultSize = 10,
): React.CSSProperties {
  return {
    color,
    fontFamily: font?.family,
    fontSize: (font?.size ?? defaultSize) * 1.333 * scale,
    fontWeight: font?.bold ? 700 : 400,
    fontStyle: font?.italic ? 'italic' : undefined,
    textDecoration: textDecorationValue(font),
  };
}

const TableComponent: React.FC<{ component: RenderTable; style: React.CSSProperties; scale: number; dataProps: Record<string, string> }> = ({ component, style, scale, dataProps }) => {
  const rows = component.rows ?? [];
  return (
    <div
      data-testid="render-component-table"
      {...dataProps}
      style={{
        ...style,
        display: 'grid',
        gridTemplateColumns: component.columns.map(column => `${(column.width ?? 0) * MM_TO_PX * scale}px`).join(' '),
        gridTemplateRows: rows.map(row => `${(row[0]?.height ?? 8) * MM_TO_PX * scale}px`).join(' '),
        overflow: 'hidden',
        backgroundColor: style.backgroundColor ?? '#fff',
      }}
    >
      {rows.flatMap(row => row.map(cell => (
        <div
          key={`${cell.row}-${cell.column}`}
          style={tableCellStyle(cell, scale)}
        >
          {cell.content}
        </div>
      )))}
    </div>
  );
};

function tableCellStyle(cell: StyledRenderTableCell, scale: number): React.CSSProperties {
  const border = cell.style?.border;
  const font = cell.style?.font;
  return {
    gridColumn: cell.colSpan > 1 ? `span ${cell.colSpan}` : undefined,
    gridRow: cell.rowSpan > 1 ? `span ${cell.rowSpan}` : undefined,
    ...tableBorderStyle(border, scale),
    backgroundColor: tableCellBackgroundColor(cell),
    color: font?.color ?? '#111',
    fontFamily: font?.family,
    fontSize: (font?.size ?? 10) * 1.333 * scale,
    fontWeight: font?.bold ? 700 : 400,
    fontStyle: font?.italic ? 'italic' : undefined,
    textDecoration: textDecorationValue(font),
    lineHeight: 1.2,
    paddingTop: `${(cell.style?.padding?.top ?? 1) * MM_TO_PX * scale}px`,
    paddingRight: `${(cell.style?.padding?.right ?? 1.5) * MM_TO_PX * scale}px`,
    paddingBottom: `${(cell.style?.padding?.bottom ?? 1) * MM_TO_PX * scale}px`,
    paddingLeft: `${(cell.style?.padding?.left ?? 1.5) * MM_TO_PX * scale}px`,
    textAlign: cell.style?.textAlign,
    alignContent: verticalAlignToContent(cell.style?.verticalAlign),
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    boxSizing: 'border-box',
  };
}

function verticalAlignToContent(value?: 'top' | 'middle' | 'bottom'): React.CSSProperties['alignContent'] {
  if (value === 'middle') return 'center';
  if (value === 'bottom') return 'end';
  return undefined;
}

function lineDashArray(style?: 'solid' | 'dashed' | 'dotted'): string | undefined {
  if (style === 'dashed') return '6 4';
  if (style === 'dotted') return '1 3';
  return undefined;
}
