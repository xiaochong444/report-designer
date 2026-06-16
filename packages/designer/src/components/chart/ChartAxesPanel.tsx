import React from 'react';
import { ColorPicker, Form, Input, InputNumber, Select, Switch } from 'antd';
import type { ChartAxesConfig, ChartCapabilities, ChartType, ReportFontOption } from '@report-designer/core';
import { chartUiText, type ChartPanelT } from './chart-options';
import { FontEditor } from '../properties/FontEditor';
import { TextFormatEditor } from '../TextFormatEditor';

const FORM_LABEL_COL = { span: 8 };
const FORM_WRAPPER_COL = { span: 16 };
const DEFAULT_AXIS_TITLE_COLOR = '#111827';
const DEFAULT_AXIS_LABEL_COLOR = '#4b5563';
const DEFAULT_AXIS_GRID_COLOR = '#e5e7eb';
const DEFAULT_AXIS: NonNullable<ChartAxesConfig['x']> = { visible: true, gridVisible: true };

type AxisKey = 'x' | 'y' | 'rightY';

function mergeAxis(value: ChartAxesConfig, key: AxisKey, updates: Partial<NonNullable<ChartAxesConfig[AxisKey]>>): ChartAxesConfig {
  const current = value[key] ?? DEFAULT_AXIS;
  return { ...value, [key]: { ...DEFAULT_AXIS, ...current, ...updates } };
}

const PanelGroup: React.FC<React.PropsWithChildren<{ title: string; nested?: boolean }>> = ({ children, nested = false, title }) => (
  <div style={{ borderTop: nested ? '1px dashed #f0f0f0' : '1px solid #f0f0f0', paddingTop: 8, marginTop: 8 }}>
    <div style={{ color: nested ? '#6b7280' : '#4b5563', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{title}</div>
    {children}
  </div>
);

function AxisGroup({
  axisKey,
  axisLabel,
  axis,
  onChange,
  reportFontOptions,
  t,
}: {
  axisKey: AxisKey;
  axisLabel: string;
  axis: NonNullable<ChartAxesConfig[AxisKey]>;
  onChange: (updates: Partial<NonNullable<ChartAxesConfig[AxisKey]>>) => void;
  reportFontOptions: ReportFontOption[];
  t: ChartPanelT;
}) {
  const ui = React.useMemo(() => chartUiText(t), [t]);
  const fontLabels = React.useMemo(() => ({
    fontFamily: t('fontFamily'),
    fontSize: axisKey === 'x' ? ui.xTitleFontSize : ui.yTitleFontSize,
    textColor: axisKey === 'x' ? ui.xTitleColor : ui.yTitleColor,
    bold: t('bold'),
    italic: t('italic'),
    underline: t('underline'),
    strike: t('strike'),
  }), [axisKey, t, ui]);
  const labelFontLabels = React.useMemo(() => ({
    fontFamily: t('fontFamily'),
    fontSize: axisKey === 'x' ? ui.xLabelFontSize : ui.yLabelFontSize,
    textColor: axisKey === 'x' ? ui.xLabelColor : ui.yLabelColor,
    bold: t('bold'),
    italic: t('italic'),
    underline: t('underline'),
    strike: t('strike'),
  }), [axisKey, t, ui]);
  const visibleLabel = axisKey === 'x' ? ui.xAxisVisible : ui.yAxisVisible;
  const titleLabel = axisKey === 'x' ? ui.xAxisTitle : ui.yAxisTitle;
  const gridVisibleLabel = axisKey === 'x' ? ui.xGridVisible : ui.yGridVisible;
  const gridColorLabel = axisKey === 'x' ? ui.xGridColor : ui.yGridColor;
  const axisGroupTitle = axisKey === 'x' ? ui.xAxisGroup : axisKey === 'y' ? ui.yAxisGroup : ui.rightYAxisGroup;
  const shortFontLabels = React.useMemo(() => ({
    fontFamily: ui.familyShort,
    fontSize: ui.sizeShort,
    textColor: ui.colorShort,
    bold: t('bold'),
    italic: t('italic'),
    underline: t('underline'),
    strike: t('strike'),
  }), [t, ui]);

  return (
    <PanelGroup title={axisGroupTitle}>
      <Form.Item label={ui.visibleShort}>
        <Switch aria-label={`${axisLabel} visible`} size="small" checked={axis.visible} onChange={checked => onChange({ visible: checked })} />
      </Form.Item>
      <PanelGroup title={ui.axisTitleGroup} nested>
        <Form.Item label={ui.textShort}>
          <Input aria-label={titleLabel} value={axis.title ?? ''} onChange={event => onChange({ title: event.target.value })} size="small" />
        </Form.Item>
        <FontEditor
          value={{ ...(axis.titleFont ?? {}), color: axis.titleColor ?? axis.titleFont?.color ?? DEFAULT_AXIS_TITLE_COLOR }}
          onChange={next => onChange({ titleColor: next.color, titleFont: { ...(axis.titleFont ?? {}), ...next } })}
          reportFontOptions={reportFontOptions}
          fields={['size', 'color', 'bold']}
          sizeRange={[6, 48]}
          labels={shortFontLabels}
          ariaLabels={fontLabels}
        />
      </PanelGroup>
      <PanelGroup title={ui.axisLabelGroup} nested>
        <FontEditor
          value={{ ...(axis.labelFont ?? {}), color: axis.labelColor ?? axis.labelFont?.color ?? DEFAULT_AXIS_LABEL_COLOR }}
          onChange={next => onChange({ labelColor: next.color, labelFont: { ...(axis.labelFont ?? {}), ...next } })}
          reportFontOptions={reportFontOptions}
          fields={['size', 'color', 'bold']}
          sizeRange={[6, 48]}
          labels={shortFontLabels}
          ariaLabels={labelFontLabels}
        />
        <Form.Item label={ui.rotateShort}>
          <InputNumber
            aria-label={t('chartAxisLabelRotation')}
            value={axis.labelRotate ?? 0}
            min={-90}
            max={90}
            size="small"
            style={{ width: '100%' }}
            onChange={rotate => onChange({ labelRotate: rotate ?? 0 })}
          />
        </Form.Item>
      </PanelGroup>
      <PanelGroup title={ui.axisGridGroup} nested>
        <Form.Item label={ui.visibleShort}>
          <Switch aria-label={gridVisibleLabel} size="small" checked={axis.gridVisible ?? true} onChange={checked => onChange({ gridVisible: checked })} />
        </Form.Item>
        <Form.Item label={ui.colorShort}>
          <ColorPicker
            aria-label={gridColorLabel}
            size="small"
            value={axis.gridColor ?? DEFAULT_AXIS_GRID_COLOR}
            onChange={color => onChange({ gridColor: color.toHexString() })}
          />
        </Form.Item>
      </PanelGroup>
      <PanelGroup title={ui.axisScaleGroup} nested>
        <Form.Item label={ui.minShort}>
          <InputNumber aria-label={`${axisLabel} min`} value={axis.min ?? undefined} size="small" style={{ width: '100%' }} onChange={min => onChange({ min: min ?? undefined })} />
        </Form.Item>
        <Form.Item label={ui.maxShort}>
          <InputNumber aria-label={`${axisLabel} max`} value={axis.max ?? undefined} size="small" style={{ width: '100%' }} onChange={max => onChange({ max: max ?? undefined })} />
        </Form.Item>
      </PanelGroup>
      <PanelGroup title={ui.axisFormatGroup} nested>
        <TextFormatEditor
          value={axis.format}
          onChange={format => onChange({ format })}
          labelWidth={76}
          size="small"
        />
      </PanelGroup>
    </PanelGroup>
  );
}

function RadialAxisGroup({
  axis,
  onChange,
  t,
}: {
  axis: NonNullable<ChartAxesConfig['x']>;
  onChange: (updates: Partial<NonNullable<ChartAxesConfig['x']>>) => void;
  t: ChartPanelT;
}) {
  const ui = React.useMemo(() => chartUiText(t), [t]);
  return (
    <>
      <Form.Item label={ui.radarAxisCount}>
        <InputNumber aria-label="radar axis count" value={axis.axisCount ?? 5} min={3} max={12} size="small" style={{ width: '100%' }} onChange={axisCount => onChange({ axisCount: axisCount ?? 5 })} />
      </Form.Item>
      <Form.Item label={ui.radarAxisShape}>
        <Select
          aria-label="radar axis shape"
          value={axis.shape ?? 'polygon'}
          size="small"
          options={[
            { value: 'polygon', label: t('chartRadarPolygon') },
            { value: 'circle', label: t('chartRadarCircle') },
          ]}
          onChange={shape => onChange({ shape })}
        />
      </Form.Item>
    </>
  );
}

export const ChartAxesPanel: React.FC<{
  chartType: ChartType;
  capabilities: ChartCapabilities;
  value: ChartAxesConfig;
  reportFontOptions: ReportFontOption[];
  onChange: (value: ChartAxesConfig) => void;
  t: ChartPanelT;
}> = React.memo(({ capabilities, onChange, reportFontOptions, t, value }) => {
  const ui = React.useMemo(() => chartUiText(t), [t]);
  const x = value.x ?? DEFAULT_AXIS;
  const y = value.y ?? DEFAULT_AXIS;
  const rightY = value.rightY ?? DEFAULT_AXIS;
  const updateX = React.useCallback((updates: Partial<NonNullable<ChartAxesConfig['x']>>) => onChange(mergeAxis(value, 'x', updates)), [onChange, value]);
  const updateY = React.useCallback((updates: Partial<NonNullable<ChartAxesConfig['y']>>) => onChange(mergeAxis(value, 'y', updates)), [onChange, value]);
  const updateRightY = React.useCallback((updates: Partial<NonNullable<ChartAxesConfig['rightY']>>) => onChange(mergeAxis(value, 'rightY', updates)), [onChange, value]);

  return (
    <Form size="small" labelCol={FORM_LABEL_COL} wrapperCol={FORM_WRAPPER_COL}>
      {capabilities.axes === 'radial' ? (
        <>
          <RadialAxisGroup axis={x} onChange={updateX} t={t} />
          <Form.Item label={ui.radarVisible}>
            <Switch aria-label="radar visible" size="small" checked={x.visible} onChange={checked => updateX({ visible: checked })} />
          </Form.Item>
        </>
      ) : (
        <>
          <AxisGroup axisKey="x" axis={x} onChange={updateX} reportFontOptions={reportFontOptions} t={t} axisLabel="X" />
          <AxisGroup axisKey="y" axis={y} onChange={updateY} reportFontOptions={reportFontOptions} t={t} axisLabel="Y" />
        </>
      )}
      {capabilities.axes === 'rightY' ? (
        <AxisGroup axisKey="rightY" axis={rightY} onChange={updateRightY} reportFontOptions={reportFontOptions} t={t} axisLabel="Right Y" />
      ) : null}
    </Form>
  );
});
