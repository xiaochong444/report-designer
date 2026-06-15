import React from 'react';
import { ColorPicker, Form, Input, InputNumber, Switch } from 'antd';
import type { ChartAxesConfig, ChartCapabilities, ChartType, ReportFontOption } from '@report-designer/core';
import { chartUiText, type ChartPanelT } from './chart-options';

const FORM_LABEL_COL = { span: 8 };
const FORM_WRAPPER_COL = { span: 16 };
const DEFAULT_AXIS_TITLE_COLOR = '#111827';
const DEFAULT_AXIS_LABEL_COLOR = '#4b5563';
const DEFAULT_AXIS_GRID_COLOR = '#e5e7eb';
const DEFAULT_AXIS_TITLE_FONT_SIZE = 12;
const DEFAULT_AXIS_LABEL_FONT_SIZE = 10;
const DEFAULT_AXIS: NonNullable<ChartAxesConfig['x']> = { visible: true, gridVisible: true };

export const ChartAxesPanel: React.FC<{
  chartType: ChartType;
  capabilities: ChartCapabilities;
  value: ChartAxesConfig;
  reportFontOptions: ReportFontOption[];
  onChange: (value: ChartAxesConfig) => void;
  t: ChartPanelT;
}> = React.memo(({ capabilities, onChange, t, value }) => {
  const ui = React.useMemo(() => chartUiText(t), [t]);
  const isRadial = capabilities.axes === 'radial';
  const showRightY = capabilities.axes === 'rightY';
  const x = value.x ?? DEFAULT_AXIS;
  const y = value.y ?? DEFAULT_AXIS;
  const updateX = React.useCallback((updates: Partial<NonNullable<ChartAxesConfig['x']>>) => onChange({ ...value, x: { ...x, ...updates } }), [onChange, value, x]);
  const updateY = React.useCallback((updates: Partial<NonNullable<ChartAxesConfig['y']>>) => onChange({ ...value, y: { ...y, ...updates } }), [onChange, value, y]);
  const updateXTitleFont = React.useCallback((updates: Partial<NonNullable<NonNullable<ChartAxesConfig['x']>['titleFont']>>) => updateX({ titleFont: { ...(x.titleFont ?? {}), ...updates } }), [updateX, x.titleFont]);
  const updateYTitleFont = React.useCallback((updates: Partial<NonNullable<NonNullable<ChartAxesConfig['y']>['titleFont']>>) => updateY({ titleFont: { ...(y.titleFont ?? {}), ...updates } }), [updateY, y.titleFont]);
  const updateXLabelFont = React.useCallback((updates: Partial<NonNullable<NonNullable<ChartAxesConfig['x']>['labelFont']>>) => updateX({ labelFont: { ...(x.labelFont ?? {}), ...updates } }), [updateX, x.labelFont]);
  const updateYLabelFont = React.useCallback((updates: Partial<NonNullable<NonNullable<ChartAxesConfig['y']>['labelFont']>>) => updateY({ labelFont: { ...(y.labelFont ?? {}), ...updates } }), [updateY, y.labelFont]);

  return (
    <Form size="small" labelCol={FORM_LABEL_COL} wrapperCol={FORM_WRAPPER_COL}>
      <Form.Item label={ui.xAxisVisible}>
        <Switch aria-label={ui.xAxisVisible} size="small" checked={x.visible} onChange={checked => updateX({ visible: checked })} disabled={false} />
      </Form.Item>
      <Form.Item label={ui.xAxisTitle}>
        <Input aria-label={ui.xAxisTitle} value={x.title ?? ''} onChange={event => updateX({ title: event.target.value })} size="small" disabled={false} />
      </Form.Item>
      <Form.Item label={ui.xTitleColor}>
        <ColorPicker aria-label={ui.xTitleColor} size="small" value={x.titleColor ?? x.titleFont?.color ?? DEFAULT_AXIS_TITLE_COLOR} onChange={color => updateX({ titleColor: color.toHexString() })} disabled={false} />
      </Form.Item>
      <Form.Item label={ui.xTitleFontSize}>
        <InputNumber aria-label={ui.xTitleFontSize} value={x.titleFont?.size ?? DEFAULT_AXIS_TITLE_FONT_SIZE} min={6} max={48} size="small" style={{ width: '100%' }} onChange={size => updateXTitleFont({ size: size ?? DEFAULT_AXIS_TITLE_FONT_SIZE })} disabled={false} />
      </Form.Item>
      <Form.Item label={ui.xLabelColor}>
        <ColorPicker aria-label={ui.xLabelColor} size="small" value={x.labelColor ?? DEFAULT_AXIS_LABEL_COLOR} onChange={color => updateX({ labelColor: color.toHexString() })} disabled={false} />
      </Form.Item>
      <Form.Item label={ui.xLabelFontSize}>
        <InputNumber aria-label={ui.xLabelFontSize} value={x.labelFont?.size ?? DEFAULT_AXIS_LABEL_FONT_SIZE} min={6} max={48} size="small" style={{ width: '100%' }} onChange={size => updateXLabelFont({ size: size ?? DEFAULT_AXIS_LABEL_FONT_SIZE })} disabled={false} />
      </Form.Item>
      <Form.Item label={ui.xGridVisible}>
        <Switch aria-label={ui.xGridVisible} size="small" checked={x.gridVisible ?? true} onChange={checked => updateX({ gridVisible: checked })} disabled={false} />
      </Form.Item>
      <Form.Item label={ui.xGridColor}>
        <ColorPicker aria-label={ui.xGridColor} size="small" value={x.gridColor ?? DEFAULT_AXIS_GRID_COLOR} onChange={color => updateX({ gridColor: color.toHexString() })} disabled={false} />
      </Form.Item>
      <Form.Item label={t('chartAxisLabelRotation')}>
        <InputNumber aria-label={t('chartAxisLabelRotation')} value={x.labelRotate ?? 0} min={-90} max={90} size="small" style={{ width: '100%' }} onChange={rotate => updateX({ labelRotate: rotate ?? 0 })} disabled={false} />
      </Form.Item>
      <Form.Item label={ui.yAxisVisible}>
        <Switch aria-label={ui.yAxisVisible} size="small" checked={y.visible} onChange={checked => updateY({ visible: checked })} disabled={false} />
      </Form.Item>
      <Form.Item label={ui.yAxisTitle}>
        <Input aria-label={ui.yAxisTitle} value={y.title ?? ''} onChange={event => updateY({ title: event.target.value })} size="small" disabled={false} />
      </Form.Item>
      <Form.Item label={ui.yTitleColor}>
        <ColorPicker aria-label={ui.yTitleColor} size="small" value={y.titleColor ?? y.titleFont?.color ?? DEFAULT_AXIS_TITLE_COLOR} onChange={color => updateY({ titleColor: color.toHexString() })} disabled={false} />
      </Form.Item>
      <Form.Item label={ui.yTitleFontSize}>
        <InputNumber aria-label={ui.yTitleFontSize} value={y.titleFont?.size ?? DEFAULT_AXIS_TITLE_FONT_SIZE} min={6} max={48} size="small" style={{ width: '100%' }} onChange={size => updateYTitleFont({ size: size ?? DEFAULT_AXIS_TITLE_FONT_SIZE })} disabled={false} />
      </Form.Item>
      <Form.Item label={ui.yLabelColor}>
        <ColorPicker aria-label={ui.yLabelColor} size="small" value={y.labelColor ?? DEFAULT_AXIS_LABEL_COLOR} onChange={color => updateY({ labelColor: color.toHexString() })} disabled={false} />
      </Form.Item>
      <Form.Item label={ui.yLabelFontSize}>
        <InputNumber aria-label={ui.yLabelFontSize} value={y.labelFont?.size ?? DEFAULT_AXIS_LABEL_FONT_SIZE} min={6} max={48} size="small" style={{ width: '100%' }} onChange={size => updateYLabelFont({ size: size ?? DEFAULT_AXIS_LABEL_FONT_SIZE })} disabled={false} />
      </Form.Item>
      <Form.Item label={ui.yGridVisible}>
        <Switch aria-label={ui.yGridVisible} size="small" checked={y.gridVisible ?? true} onChange={checked => updateY({ gridVisible: checked })} disabled={false} />
      </Form.Item>
      <Form.Item label={ui.yGridColor}>
        <ColorPicker aria-label={ui.yGridColor} size="small" value={y.gridColor ?? DEFAULT_AXIS_GRID_COLOR} onChange={color => updateY({ gridColor: color.toHexString() })} disabled={false} />
      </Form.Item>
      <Form.Item label="min">
        <InputNumber aria-label="Y axis min" value={y.min ?? undefined} size="small" style={{ width: '100%' }} placeholder="min" onChange={min => updateY({ min: min ?? undefined })} disabled={false} />
      </Form.Item>
      <Form.Item label="max">
        <InputNumber aria-label="Y axis max" value={y.max ?? undefined} size="small" style={{ width: '100%' }} placeholder="max" onChange={max => updateY({ max: max ?? undefined })} disabled={false} />
      </Form.Item>
      {showRightY ? (
        <>
          <Form.Item label={t('chartAxisTitleY')}>
            <Input aria-label={`${t('chartAxisTitleY')} right`} value={value.rightY?.title ?? ''} onChange={event => onChange({ ...value, rightY: { ...DEFAULT_AXIS, ...value.rightY, title: event.target.value } })} size="small" disabled={false} />
          </Form.Item>
          <Form.Item label={ui.yAxisVisible}>
            <Switch aria-label={`${ui.yAxisVisible} right`} size="small" checked={value.rightY?.visible ?? true} onChange={checked => onChange({ ...value, rightY: { ...DEFAULT_AXIS, ...value.rightY, visible: checked } })} disabled={false} />
          </Form.Item>
        </>
      ) : null}
    </Form>
  );
});
