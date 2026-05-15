import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import type { RenderBarcode, RenderCheckbox, RenderComponentBox, RenderImage, RenderLine, RenderRichText, RenderShape, RenderText } from '@report-designer/core';

export const MM_TO_PX = 96 / 25.4;
type RenderTextStyle = NonNullable<RenderText['style']> & {
  padding?: { top: number; right: number; bottom: number; left: number };
};

interface RenderComponentProps {
  component: RenderComponentBox;
  zoom: number;
}

export const RenderComponent: React.FC<RenderComponentProps> = ({ component, zoom }) => {
  const scale = zoom / 100;
  const style = toAbsoluteStyle(component, scale);

  switch (component.type) {
    case 'text':
      return (
        <div data-testid="render-component-text" style={{ ...style, ...textBoxStyle(component as RenderText, scale) }}>
          <div data-testid="render-component-text-content" style={textContentStyle(component as RenderText)}>
            {(component as RenderText).content}
          </div>
        </div>
      );
    case 'image':
      return <img data-testid="render-component-image" src={(component as RenderImage).src} alt="" style={{ ...style, objectFit: imageFitMode(component as RenderImage) }} />;
    case 'richtext':
      return (
        <div
          data-testid="render-component-richtext"
          style={{ ...style, overflow: 'hidden' }}
          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml((component as RenderRichText).html) }}
        />
      );
    case 'line':
      return <LineComponent component={component as RenderLine} style={style} />;
    case 'shape':
      return <ShapeComponent component={component as RenderShape} style={style} />;
    case 'checkbox':
      return <CheckboxComponent component={component as RenderCheckbox} style={style} scale={scale} />;
    case 'barcode':
      return <BarcodeComponent component={component as RenderBarcode} style={style} />;
    default:
      return <div data-testid="render-component-unknown" style={style} />;
  }
};

function imageFitMode(component: RenderImage): React.CSSProperties['objectFit'] {
  return component.fitMode === 'stretch' || component.fitMode === 'fill'
    ? 'fill'
    : component.fitMode ?? 'contain';
}

export function toAbsoluteStyle(component: RenderComponentBox, scale: number): React.CSSProperties {
  const border = component.style?.border;
  return {
    position: 'absolute',
    left: component.x * MM_TO_PX * scale,
    top: component.y * MM_TO_PX * scale,
    width: component.width * MM_TO_PX * scale,
    height: component.height * MM_TO_PX * scale,
    boxSizing: 'border-box',
    overflow: component.overflow ? 'hidden' : 'visible',
    backgroundColor: component.style?.backgroundColor,
    borderTop: border?.sides.top ? `${Math.max(1, border.width * MM_TO_PX * scale)}px ${border.style} ${border.color}` : undefined,
    borderRight: border?.sides.right ? `${Math.max(1, border.width * MM_TO_PX * scale)}px ${border.style} ${border.color}` : undefined,
    borderBottom: border?.sides.bottom ? `${Math.max(1, border.width * MM_TO_PX * scale)}px ${border.style} ${border.color}` : undefined,
    borderLeft: border?.sides.left ? `${Math.max(1, border.width * MM_TO_PX * scale)}px ${border.style} ${border.color}` : undefined,
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

function sanitizeRichHtml(value: string): string {
  return value.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
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

const LineComponent: React.FC<{ component: RenderLine; style: React.CSSProperties }> = ({ component, style }) => (
  <svg data-testid="render-component-line" style={{ ...style, color: component.lineColor ?? '#000000' }} viewBox={`0 0 ${Math.max(1, component.width)} ${Math.max(1, component.height)}`} preserveAspectRatio="none">
    <line
      x1={component.startX ?? 0}
      y1={component.startY ?? component.height / 2}
      x2={component.endX ?? component.width}
      y2={component.endY ?? component.height / 2}
      stroke="currentColor"
      strokeWidth={Math.max(1, (component.lineWidth ?? 0.2) * MM_TO_PX)}
      strokeDasharray={lineDashArray(component.lineStyle)}
    />
  </svg>
);

const ShapeComponent: React.FC<{ component: RenderShape; style: React.CSSProperties }> = ({ component, style }) => {
  const strokeWidth = Math.max(1, (component.borderWidth ?? 0.2) * MM_TO_PX);
  const stroke = component.borderColor ?? '#000000';
  const fill = component.fillColor ?? 'transparent';
  const dash = lineDashArray(component.borderStyle);
  const viewBox = `0 0 ${Math.max(1, component.width)} ${Math.max(1, component.height)}`;
  const common = { fill, stroke, strokeWidth, strokeDasharray: dash };

  return (
    <svg data-testid="render-component-shape" style={style} viewBox={viewBox} preserveAspectRatio="none">
      {component.shapeType === 'ellipse'
        ? <ellipse cx={component.width / 2} cy={component.height / 2} rx={Math.max(0, component.width / 2 - strokeWidth / 2)} ry={Math.max(0, component.height / 2 - strokeWidth / 2)} {...common} />
        : component.shapeType === 'triangle'
          ? <polygon points={`${component.width / 2},${strokeWidth / 2} ${component.width - strokeWidth / 2},${component.height - strokeWidth / 2} ${strokeWidth / 2},${component.height - strokeWidth / 2}`} {...common} />
          : <rect x={strokeWidth / 2} y={strokeWidth / 2} width={Math.max(0, component.width - strokeWidth)} height={Math.max(0, component.height - strokeWidth)} rx={component.shapeType === 'roundRect' ? 3 : 0} {...common} />}
    </svg>
  );
};

const CheckboxComponent: React.FC<{ component: RenderCheckbox; style: React.CSSProperties; scale: number }> = ({ component, style, scale }) => (
  <div data-testid="render-component-checkbox" style={{ ...style, display: 'flex', alignItems: 'center', gap: 4 * scale }}>
    <span style={{ width: 12 * scale, height: 12 * scale, border: '1px solid #333', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {component.checked ? '✓' : ''}
    </span>
    {component.label}
  </div>
);

const BarcodeComponent: React.FC<{ component: RenderBarcode; style: React.CSSProperties }> = ({ component, style }) => {
  const ref = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    if (ref.current) {
      try {
        JsBarcode(ref.current, component.value, { format: component.format ?? 'CODE128', displayValue: false, margin: 0 });
      } catch {
        // Keep an empty SVG if the value cannot be encoded by the selected format.
      }
    }
  }, [component.format, component.value]);

  return (
    <div data-testid="render-component-barcode" style={{ ...style, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <svg ref={ref} style={{ width: '100%', height: component.showText ? '75%' : '100%' }} />
      {component.showText ? <div style={{ fontSize: 10, lineHeight: '1.1', textAlign: 'center' }}>{component.value}</div> : null}
    </div>
  );
};

function lineDashArray(style?: 'solid' | 'dashed' | 'dotted'): string | undefined {
  if (style === 'dashed') return '6 4';
  if (style === 'dotted') return '1 3';
  return undefined;
}
