import React from 'react';
import { ColorPicker, Form, Input, InputNumber, Switch } from 'antd';
import type { ChartAxesConfig } from '@report-designer/core';
import { chartUiText, isPieLike, type ChartPanelT } from './chart-options';
import type { ChartType } from '@report-designer/core';

export const ChartAxesPanel: React.FC<{
  chartType: ChartType;
  value: ChartAxesConfig;
  onChange: (value: ChartAxesConfig) => void;
  t: ChartPanelT;
}> = ({ chartType, onChange, t, value }) => {
  const ui = chartUiText(t);
  const disabled = isPieLike(chartType);
  const x = value.x ?? { visible: true, gridVisible: true };
  const y = value.y ?? { visible: true, gridVisible: true };
  const updateX = (updates: Partial<NonNullable<ChartAxesConfig['x']>>) => onChange({ ...value, x: { ...x, ...updates } });
  const updateY = (updates: Partial<NonNullable<ChartAxesConfig['y']>>) => onChange({ ...value, y: { ...y, ...updates } });
  const updateXTitleFont = (updates: Partial<NonNullable<NonNullable<ChartAxesConfig['x']>['titleFont']>>) => updateX({ titleFont: { ...(x.titleFont ?? {}), ...updates } });
  const updateYTitleFont = (updates: Partial<NonNullable<NonNullable<ChartAxesConfig['y']>['titleFont']>>) => updateY({ titleFont: { ...(y.titleFont ?? {}), ...updates } });
  const updateXLabelFont = (updates: Partial<NonNullable<NonNullable<ChartAxesConfig['x']>['labelFont']>>) => updateX({ labelFont: { ...(x.labelFont ?? {}), ...updates } });
  const updateYLabelFont = (updates: Partial<NonNullable<NonNullable<ChartAxesConfig['y']>['labelFont']>>) => updateY({ labelFont: { ...(y.labelFont ?? {}), ...updates } });

  return (
    <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
      <Form.Item label={ui.xAxisVisible}>
        <Switch aria-label={ui.xAxisVisible} size="small" checked={x.visible} onChange={checked => updateX({ visible: checked })} disabled={disabled} />
      </Form.Item>
      <Form.Item label={ui.xAxisTitle}>
        <Input aria-label={ui.xAxisTitle} value={x.title ?? ''} onChange={event => updateX({ title: event.target.value })} size="small" disabled={disabled} />
      </Form.Item>
      <Form.Item label={ui.xTitleColor}>
        <ColorPicker aria-label={ui.xTitleColor} size="small" value={x.titleColor ?? x.titleFont?.color ?? '#111827'} onChange={color => updateX({ titleColor: color.toHexString() })} disabled={disabled} />
      </Form.Item>
      <Form.Item label={ui.xTitleFontSize}>
        <InputNumber aria-label={ui.xTitleFontSize} value={x.titleFont?.size ?? 12} min={6} max={48} size="small" style={{ width: '100%' }} onChange={size => updateXTitleFont({ size: size ?? 12 })} disabled={disabled} />
      </Form.Item>
      <Form.Item label={ui.xLabelColor}>
        <ColorPicker aria-label={ui.xLabelColor} size="small" value={x.labelColor ?? '#4b5563'} onChange={color => updateX({ labelColor: color.toHexString() })} disabled={disabled} />
      </Form.Item>
      <Form.Item label={ui.xLabelFontSize}>
        <InputNumber aria-label={ui.xLabelFontSize} value={x.labelFont?.size ?? 10} min={6} max={48} size="small" style={{ width: '100%' }} onChange={size => updateXLabelFont({ size: size ?? 10 })} disabled={disabled} />
      </Form.Item>
      <Form.Item label={ui.xGridVisible}>
        <Switch aria-label={ui.xGridVisible} size="small" checked={x.gridVisible ?? true} onChange={checked => updateX({ gridVisible: checked })} disabled={disabled} />
      </Form.Item>
      <Form.Item label={ui.xGridColor}>
        <ColorPicker aria-label={ui.xGridColor} size="small" value={x.gridColor ?? '#e5e7eb'} onChange={color => updateX({ gridColor: color.toHexString() })} disabled={disabled} />
      </Form.Item>
      <Form.Item label={ui.yAxisVisible}>
        <Switch aria-label={ui.yAxisVisible} size="small" checked={y.visible} onChange={checked => updateY({ visible: checked })} disabled={disabled} />
      </Form.Item>
      <Form.Item label={ui.yAxisTitle}>
        <Input aria-label={ui.yAxisTitle} value={y.title ?? ''} onChange={event => updateY({ title: event.target.value })} size="small" disabled={disabled} />
      </Form.Item>
      <Form.Item label={ui.yTitleColor}>
        <ColorPicker aria-label={ui.yTitleColor} size="small" value={y.titleColor ?? y.titleFont?.color ?? '#111827'} onChange={color => updateY({ titleColor: color.toHexString() })} disabled={disabled} />
      </Form.Item>
      <Form.Item label={ui.yTitleFontSize}>
        <InputNumber aria-label={ui.yTitleFontSize} value={y.titleFont?.size ?? 12} min={6} max={48} size="small" style={{ width: '100%' }} onChange={size => updateYTitleFont({ size: size ?? 12 })} disabled={disabled} />
      </Form.Item>
      <Form.Item label={ui.yLabelColor}>
        <ColorPicker aria-label={ui.yLabelColor} size="small" value={y.labelColor ?? '#4b5563'} onChange={color => updateY({ labelColor: color.toHexString() })} disabled={disabled} />
      </Form.Item>
      <Form.Item label={ui.yLabelFontSize}>
        <InputNumber aria-label={ui.yLabelFontSize} value={y.labelFont?.size ?? 10} min={6} max={48} size="small" style={{ width: '100%' }} onChange={size => updateYLabelFont({ size: size ?? 10 })} disabled={disabled} />
      </Form.Item>
      <Form.Item label={ui.yGridVisible}>
        <Switch aria-label={ui.yGridVisible} size="small" checked={y.gridVisible ?? true} onChange={checked => updateY({ gridVisible: checked })} disabled={disabled} />
      </Form.Item>
      <Form.Item label={ui.yGridColor}>
        <ColorPicker aria-label={ui.yGridColor} size="small" value={y.gridColor ?? '#e5e7eb'} onChange={color => updateY({ gridColor: color.toHexString() })} disabled={disabled} />
      </Form.Item>
    </Form>
  );
};
