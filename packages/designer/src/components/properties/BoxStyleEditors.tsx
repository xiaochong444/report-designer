import React from 'react';
import { Checkbox, ColorPicker, Form, InputNumber, Select } from 'antd';
import type { BorderConfig, Padding } from '@report-designer/core';

type Side = keyof BorderConfig['sides'];

const SIDE_ORDER: Side[] = ['top', 'right', 'bottom', 'left'];

export interface BoxSideLabels {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export interface BorderEditorLabels {
  style: string;
  none: string;
  solid: string;
  dashed: string;
  dotted: string;
  double: string;
  width: string;
  color: string;
  sides: string;
  sideLabels: BoxSideLabels;
  sideAriaLabels?: BoxSideLabels;
}

export interface PaddingEditorLabels {
  title: string;
  top: string;
  right: string;
  bottom: string;
  left: string;
  ariaTop: string;
  ariaRight: string;
  ariaBottom: string;
  ariaLeft: string;
}

export const DEFAULT_BOX_BORDER: BorderConfig = {
  style: 'none',
  width: 0,
  color: '#000000',
  sides: { top: false, right: false, bottom: false, left: false },
};

export const DEFAULT_BOX_PADDING: Padding = { top: 0, right: 0, bottom: 0, left: 0 };

export function mergeBorderValue(value?: BorderConfig): BorderConfig {
  return {
    ...DEFAULT_BOX_BORDER,
    ...value,
    sides: { ...DEFAULT_BOX_BORDER.sides, ...(value?.sides ?? {}) },
  };
}

export function mergePaddingValue(value?: Padding): Padding {
  return { ...DEFAULT_BOX_PADDING, ...(value ?? {}) };
}

export const BorderEditor: React.FC<{
  value?: BorderConfig;
  labels: BorderEditorLabels;
  onChange: (value: BorderConfig) => void;
  disabled?: (path: string) => boolean;
  formatWidth?: (value: number) => number | string;
  parseWidth?: (value: number | string | null | undefined, fallback: number) => number;
  minWidth?: number | string;
  maxWidth?: number | string;
  step?: number | string;
}> = ({
  value,
  labels,
  onChange,
  disabled,
  formatWidth = value => value,
  parseWidth = (next, fallback) => Number(next ?? fallback),
  minWidth = 0,
  maxWidth,
  step = 0.1,
}) => {
  const border = mergeBorderValue(value);
  const selectedSides = SIDE_ORDER.filter(side => value?.sides?.[side]);
  const updateBorder = (updates: Partial<BorderConfig>) => {
    onChange({
      ...border,
      ...updates,
      sides: { ...border.sides, ...(updates.sides ?? {}) },
    });
  };

  return (
    <>
      <Form.Item label={labels.style}>
        <Select
          aria-label={labels.style}
          value={value?.style}
          onChange={style => updateBorder({ style })}
          size="small"
          disabled={disabled?.('border.style')}
          style={{ width: '100%' }}
          options={[
            { value: 'none', label: labels.none },
            { value: 'solid', label: labels.solid },
            { value: 'dashed', label: labels.dashed },
            { value: 'dotted', label: labels.dotted },
            { value: 'double', label: labels.double },
          ]}
        />
      </Form.Item>
      <Form.Item label={labels.width}>
        <InputNumber
          aria-label={labels.width}
          value={value?.width == null ? undefined : formatWidth(value.width)}
          onChange={next => updateBorder({ width: parseWidth(next, border.width) })}
          size="small"
          disabled={disabled?.('border.width')}
          style={{ width: '100%' }}
          min={minWidth}
          max={maxWidth}
          step={step}
        />
      </Form.Item>
      <Form.Item label={labels.color}>
        <ColorPicker
          aria-label={labels.color}
          size="small"
          value={value?.color}
          onChange={color => updateBorder({ color: color.toHexString() })}
          disabled={disabled?.('border.color')}
        />
      </Form.Item>
      <Form.Item label={labels.sides}>
        <Checkbox.Group
          value={selectedSides}
          onChange={(values) => {
            const selected = new Set(values as string[]);
            updateBorder({
              sides: {
                top: selected.has('top'),
                right: selected.has('right'),
                bottom: selected.has('bottom'),
                left: selected.has('left'),
              },
            });
          }}
        >
          <div
            data-testid="border-editor-sides"
            style={{
              display: 'flex',
              flexWrap: 'nowrap',
              gap: 8,
              alignItems: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            {SIDE_ORDER.map(side => (
              <span key={side} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Checkbox value={side} aria-label={labels.sideAriaLabels?.[side] ?? labels.sideLabels[side]} disabled={disabled?.(`border.sides.${side}`)} />
                <span aria-hidden="true">{labels.sideLabels[side]}</span>
              </span>
            ))}
          </div>
        </Checkbox.Group>
      </Form.Item>
      <div style={{ ...borderPreviewStyle(border), width: 60, height: 40, margin: '8px auto 0' }} />
    </>
  );
};

export const PaddingEditor: React.FC<{
  value?: Padding;
  labels: PaddingEditorLabels;
  onChange: (value: Padding) => void;
  disabled?: (path: string) => boolean;
  formatValue?: (value: number) => number | string;
  parseValue?: (value: number | string | null | undefined, fallback: number) => number;
  min?: number | string;
  step?: number | string;
}> = ({
  value,
  labels,
  onChange,
  disabled,
  formatValue = value => value,
  parseValue = (next, fallback) => Number(next ?? fallback),
  min = 0,
  step = 0.1,
}) => {
  const padding = mergePaddingValue(value);
  const updateField = (field: keyof Padding, next: number | string | null | undefined) => {
    onChange({ ...padding, [field]: parseValue(next, padding[field]) });
  };

  return (
    <>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{labels.title}</div>
      <Form.Item label={labels.top}>
        <InputNumber
          aria-label={labels.ariaTop}
          value={value?.top == null ? undefined : formatValue(value.top)}
          onChange={next => updateField('top', next)}
          size="small"
          disabled={disabled?.('padding.top')}
          style={{ width: '100%' }}
          min={min}
          step={step}
        />
      </Form.Item>
      <Form.Item label={labels.right}>
        <InputNumber
          aria-label={labels.ariaRight}
          value={value?.right == null ? undefined : formatValue(value.right)}
          onChange={next => updateField('right', next)}
          size="small"
          disabled={disabled?.('padding.right')}
          style={{ width: '100%' }}
          min={min}
          step={step}
        />
      </Form.Item>
      <Form.Item label={labels.bottom}>
        <InputNumber
          aria-label={labels.ariaBottom}
          value={value?.bottom == null ? undefined : formatValue(value.bottom)}
          onChange={next => updateField('bottom', next)}
          size="small"
          disabled={disabled?.('padding.bottom')}
          style={{ width: '100%' }}
          min={min}
          step={step}
        />
      </Form.Item>
      <Form.Item label={labels.left}>
        <InputNumber
          aria-label={labels.ariaLeft}
          value={value?.left == null ? undefined : formatValue(value.left)}
          onChange={next => updateField('left', next)}
          size="small"
          disabled={disabled?.('padding.left')}
          style={{ width: '100%' }}
          min={min}
          step={step}
        />
      </Form.Item>
    </>
  );
};

function borderPreviewStyle(border: BorderConfig): React.CSSProperties {
  const value = border.style !== 'none' && border.width > 0
    ? `${border.width}mm ${border.style} ${border.color}`
    : '1px solid #eee';
  return {
    borderTop: border.sides.top ? value : '1px solid #eee',
    borderRight: border.sides.right ? value : '1px solid #eee',
    borderBottom: border.sides.bottom ? value : '1px solid #eee',
    borderLeft: border.sides.left ? value : '1px solid #eee',
  };
}
