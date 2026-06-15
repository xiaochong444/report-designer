import React from 'react';
import { Form, InputNumber, Select, Switch } from 'antd';
import type { ChartCapabilities, ChartLegendConfig, ChartType, ReportFontOption } from '@report-designer/core';
import { chartUiText, type ChartPanelT } from './chart-options';
import { FontEditor } from '../properties/FontEditor';

const FORM_LABEL_COL = { span: 8 };
const FORM_WRAPPER_COL = { span: 16 };
const DEFAULT_LEGEND_FONT: ChartLegendConfig['font'] = { size: 12, color: '#374151' };

export const ChartLegendPanel: React.FC<{
  chartType: ChartType;
  capabilities: ChartCapabilities;
  value: ChartLegendConfig;
  reportFontOptions: ReportFontOption[];
  onChange: (value: ChartLegendConfig) => void;
  t: ChartPanelT;
}> = React.memo(({ capabilities, onChange, reportFontOptions, t, value }) => {
  const ui = React.useMemo(() => chartUiText(t), [t]);
  const isContinuous = capabilities.legend === 'continuous';
  const update = React.useCallback((updates: Partial<ChartLegendConfig>) => onChange({ ...value, ...updates }), [onChange, value]);
  const updateFont = React.useCallback((next: ChartLegendConfig['font']) => update({ font: next }), [update]);
  const positionOptions = React.useMemo(() => ['top', 'right', 'bottom', 'left'].map(position => ({
    value: position,
    label: t(position),
  })), [t]);
  const markerShapeOptions = React.useMemo(() => {
    const isEn = t('chartType') === 'Chart type';
    const labels: Record<string, string> = isEn
      ? { circle: 'Circle', square: 'Square', rect: 'Rectangle', line: 'Line', diamond: 'Diamond' }
      : { circle: '圆形', square: '方形', rect: '矩形', line: '线条', diamond: '菱形' };
    return (['circle', 'square', 'rect', 'line', 'diamond'] as const).map(shape => ({ value: shape, label: labels[shape] }));
  }, [t]);
  const layoutOptions = React.useMemo(() => {
    const isEn = t('chartType') === 'Chart type';
    return (['horizontal', 'vertical'] as const).map(layout => ({
      value: layout,
      label: isEn ? (layout === 'horizontal' ? 'Horizontal' : 'Vertical') : (layout === 'horizontal' ? '水平' : '垂直'),
    }));
  }, [t]);

  const fontLabels = React.useMemo(() => ({
    fontFamily: t('fontFamily'),
    fontSize: ui.sizeShort,
    textColor: ui.colorShort,
    bold: t('bold'),
    italic: t('italic'),
    underline: t('underline'),
    strike: t('strike'),
  }), [t, ui]);
  const fontAriaLabels = React.useMemo(() => ({
    ...fontLabels,
    fontSize: ui.legendFontSize,
    textColor: ui.legendColor,
  }), [fontLabels, ui]);

  return (
    <Form size="small" labelCol={FORM_LABEL_COL} wrapperCol={FORM_WRAPPER_COL}>
      <Form.Item label={ui.visible}>
        <Switch aria-label={ui.legendVisible} size="small" checked={value.visible} onChange={checked => update({ visible: checked })} />
      </Form.Item>
      <Form.Item label={ui.legendPositionShort}>
        <Select
          aria-label={ui.legendPositionShort}
          value={value.position}
          onChange={position => update({ position })}
          size="small"
          virtual={false}
          options={positionOptions}
        />
      </Form.Item>
      {isContinuous ? (
        <Form.Item label={ui.legendLayout}>
          <Select
            aria-label={ui.legendLayout}
            size="small"
            value={value.layout ?? 'vertical'}
            onChange={(layout: 'horizontal' | 'vertical') => update({ layout })}
            options={layoutOptions}
          />
        </Form.Item>
      ) : (
        <>
          <Form.Item label={ui.legendMarkerShape}>
            <Select
              aria-label={ui.legendMarkerShape}
              size="small"
              value={value.markerShape ?? 'square'}
              onChange={(markerShape: NonNullable<ChartLegendConfig['markerShape']>) => update({ markerShape })}
              options={markerShapeOptions}
            />
          </Form.Item>
          <Form.Item label={ui.legendLayout}>
            <Select
              aria-label={ui.legendLayout}
              size="small"
              value={value.layout ?? 'horizontal'}
              onChange={(layout: 'horizontal' | 'vertical') => update({ layout })}
              options={layoutOptions}
            />
          </Form.Item>
        </>
      )}
      <Form.Item label={ui.legendMaxRows}>
        <InputNumber
          aria-label={ui.legendMaxRows}
          size="small"
          value={value.maxRows}
          min={1}
          max={20}
          style={{ width: '100%' }}
          onChange={maxRows => update({ maxRows: maxRows ?? undefined })}
        />
      </Form.Item>
      <Form.Item label={ui.legendMaxColumns}>
        <InputNumber
          aria-label={ui.legendMaxColumns}
          size="small"
          value={value.maxColumns}
          min={1}
          max={20}
          style={{ width: '100%' }}
          onChange={maxColumns => update({ maxColumns: maxColumns ?? undefined })}
        />
      </Form.Item>
      <FontEditor
        value={{ ...DEFAULT_LEGEND_FONT, ...value.font, color: value.color ?? value.font?.color }}
        onChange={next => updateFont({ ...next, color: next.color })}
        reportFontOptions={reportFontOptions}
        fields={['size', 'color']}
        sizeRange={[6, 48]}
        labels={fontLabels}
        ariaLabels={fontAriaLabels}
      />
    </Form>
  );
});
