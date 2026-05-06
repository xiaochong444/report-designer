import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import type { RenderBarcode, RenderCheckbox, RenderComponentBox, RenderImage, RenderLine, RenderShape, RenderText } from '@report-designer/core';

export const MM_TO_PX = 96 / 25.4;

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
      return <img data-testid="render-component-image" src={(component as RenderImage).src} alt="" style={{ ...style, objectFit: 'contain' }} />;
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
  const font = component.style?.font;
  return {
    color: font?.color,
    fontFamily: font?.family,
    fontSize: (font?.size ?? 10) * 1.333 * scale,
    fontWeight: font?.bold ? 700 : 400,
    fontStyle: font?.italic ? 'italic' : undefined,
    textDecoration: font?.underline ? 'underline' : undefined,
    display: 'flex',
    alignItems: verticalAlignToFlex(component.style?.verticalAlign),
    padding: 2 * scale,
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

const LineComponent: React.FC<{ component: RenderLine; style: React.CSSProperties }> = ({ component, style }) => (
  <svg data-testid="render-component-line" style={style} viewBox="0 0 100 100" preserveAspectRatio="none">
    <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const ShapeComponent: React.FC<{ component: RenderShape; style: React.CSSProperties }> = ({ component, style }) => (
  <svg data-testid="render-component-shape" style={style} viewBox="0 0 100 100" preserveAspectRatio="none">
    <rect x="1" y="1" width="98" height="98" fill="transparent" stroke="currentColor" strokeWidth="2" />
  </svg>
);

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
        JsBarcode(ref.current, component.value, { displayValue: false, margin: 0 });
      } catch {
        // Keep an empty SVG if the value cannot be encoded by the selected format.
      }
    }
  }, [component.value]);

  return <svg data-testid="render-component-barcode" ref={ref} style={style} />;
};
