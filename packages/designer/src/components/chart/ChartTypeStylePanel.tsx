import React from 'react';
import { ColorPicker, Form, InputNumber, Switch } from 'antd';
import type { ChartPlotOptions, ChartType } from '@report-designer/core';
import { chartUiText, isBarLike, isLineLike, isPieLike, type ChartPanelT } from './chart-options';

const FORM_LABEL_COL = { span: 8 };
const FORM_WRAPPER_COL = { span: 16 };
const DEFAULT_HEATMAP_START_COLOR = '#dbeafe';
const DEFAULT_HEATMAP_END_COLOR = '#1d4ed8';

export const ChartTypeStylePanel: React.FC<{
  chartType: ChartType;
  value: ChartPlotOptions;
  onChange: (value: ChartPlotOptions) => void;
  t: ChartPanelT;
}> = React.memo(({ chartType, onChange, t, value }) => {
  const ui = React.useMemo(() => chartUiText(t), [t]);
  const updateBar = React.useCallback((updates: NonNullable<ChartPlotOptions['bar']>) => onChange({ ...value, bar: { ...(value.bar ?? {}), ...updates } }), [onChange, value]);
  const updateLine = React.useCallback((updates: NonNullable<ChartPlotOptions['line']>) => onChange({ ...value, line: { ...(value.line ?? {}), ...updates } }), [onChange, value]);
  const updatePie = React.useCallback((updates: NonNullable<ChartPlotOptions['pie']>) => onChange({ ...value, pie: { ...(value.pie ?? {}), ...updates } }), [onChange, value]);
  const updateScatter = React.useCallback((updates: NonNullable<ChartPlotOptions['scatter']>) => onChange({ ...value, scatter: { ...(value.scatter ?? {}), ...updates } }), [onChange, value]);
  const updateHeatmap = React.useCallback((updates: NonNullable<ChartPlotOptions['heatmap']>) => onChange({ ...value, heatmap: { ...(value.heatmap ?? {}), ...updates } }), [onChange, value]);

  return (
    <Form size="small" labelCol={FORM_LABEL_COL} wrapperCol={FORM_WRAPPER_COL}>
      {isBarLike(chartType) ? (
        <>
          <Form.Item label={t('chartCornerRadius')}>
            <InputNumber aria-label={t('chartCornerRadius')} value={value.bar?.cornerRadius ?? 0} min={0} max={50} size="small" style={{ width: '100%' }} onChange={cornerRadius => updateBar({ cornerRadius: cornerRadius ?? 0 })} />
          </Form.Item>
          <Form.Item label={t('chartFillOpacity')}>
            <InputNumber aria-label={t('chartFillOpacity')} value={value.bar?.fillOpacity ?? 1} min={0} max={1} step={0.05} size="small" style={{ width: '100%' }} onChange={fillOpacity => updateBar({ fillOpacity: fillOpacity ?? 1 })} />
          </Form.Item>
        </>
      ) : null}
      {isLineLike(chartType) ? (
        <>
          <Form.Item label={ui.lineWidth}>
            <InputNumber aria-label={ui.lineWidth} value={value.line?.lineWidth ?? 2} min={0} max={20} size="small" style={{ width: '100%' }} onChange={lineWidth => updateLine({ lineWidth: lineWidth ?? 2 })} />
          </Form.Item>
          <Form.Item label={t('chartShowPoint')}>
            <Switch aria-label={t('chartShowPoint')} size="small" checked={value.line?.showPoint ?? true} onChange={showPoint => updateLine({ showPoint })} />
          </Form.Item>
        </>
      ) : null}
      {isPieLike(chartType) ? (
        <Form.Item label={t('chartInnerRadius')}>
          <InputNumber aria-label={t('chartInnerRadius')} value={value.pie?.innerRadius ?? (chartType === 'donut' ? 0.55 : 0)} min={0} max={1} step={0.05} size="small" style={{ width: '100%' }} onChange={innerRadius => updatePie({ innerRadius: innerRadius ?? 0 })} />
        </Form.Item>
      ) : null}
      {chartType === 'scatter' ? (
        <Form.Item label={t('chartPointSize')}>
          <InputNumber aria-label={t('chartPointSize')} value={value.scatter?.pointSize ?? 4} min={0} max={30} size="small" style={{ width: '100%' }} onChange={pointSize => updateScatter({ pointSize: pointSize ?? 4 })} />
        </Form.Item>
      ) : null}
      {chartType === 'heatmap' ? (
        <>
          <Form.Item label={ui.heatmapCellGap}>
            <InputNumber aria-label={ui.heatmapCellGap} value={value.heatmap?.cellGap ?? 2} min={0} max={20} size="small" style={{ width: '100%' }} onChange={cellGap => updateHeatmap({ cellGap: cellGap ?? 2 })} />
          </Form.Item>
          <Form.Item label={ui.heatmapStartColor}>
            <ColorPicker aria-label={ui.heatmapStartColor} size="small" value={value.heatmap?.colorRange?.[0] ?? DEFAULT_HEATMAP_START_COLOR} onChange={color => updateHeatmap({ colorRange: [color.toHexString(), value.heatmap?.colorRange?.[1] ?? DEFAULT_HEATMAP_END_COLOR] })} />
          </Form.Item>
          <Form.Item label={ui.heatmapEndColor}>
            <ColorPicker aria-label={ui.heatmapEndColor} size="small" value={value.heatmap?.colorRange?.[1] ?? DEFAULT_HEATMAP_END_COLOR} onChange={color => updateHeatmap({ colorRange: [value.heatmap?.colorRange?.[0] ?? DEFAULT_HEATMAP_START_COLOR, color.toHexString()] })} />
          </Form.Item>
        </>
      ) : null}
    </Form>
  );
});
