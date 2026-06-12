import React from 'react';
import { ColorPicker, Form, InputNumber, Switch } from 'antd';
import type { ChartPlotOptions, ChartType } from '@report-designer/core';
import { chartUiText, isBarLike, isLineLike, isPieLike, type ChartPanelT } from './chart-options';

export const ChartTypeStylePanel: React.FC<{
  chartType: ChartType;
  value: ChartPlotOptions;
  onChange: (value: ChartPlotOptions) => void;
  t: ChartPanelT;
}> = ({ chartType, onChange, t, value }) => {
  const ui = chartUiText(t);
  const updateBar = (updates: NonNullable<ChartPlotOptions['bar']>) => onChange({ ...value, bar: { ...(value.bar ?? {}), ...updates } });
  const updateLine = (updates: NonNullable<ChartPlotOptions['line']>) => onChange({ ...value, line: { ...(value.line ?? {}), ...updates } });
  const updatePie = (updates: NonNullable<ChartPlotOptions['pie']>) => onChange({ ...value, pie: { ...(value.pie ?? {}), ...updates } });
  const updateScatter = (updates: NonNullable<ChartPlotOptions['scatter']>) => onChange({ ...value, scatter: { ...(value.scatter ?? {}), ...updates } });
  const updateHeatmap = (updates: NonNullable<ChartPlotOptions['heatmap']>) => onChange({ ...value, heatmap: { ...(value.heatmap ?? {}), ...updates } });

  return (
    <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
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
            <ColorPicker aria-label={ui.heatmapStartColor} size="small" value={value.heatmap?.colorRange?.[0] ?? '#dbeafe'} onChange={color => updateHeatmap({ colorRange: [color.toHexString(), value.heatmap?.colorRange?.[1] ?? '#1d4ed8'] })} />
          </Form.Item>
          <Form.Item label={ui.heatmapEndColor}>
            <ColorPicker aria-label={ui.heatmapEndColor} size="small" value={value.heatmap?.colorRange?.[1] ?? '#1d4ed8'} onChange={color => updateHeatmap({ colorRange: [value.heatmap?.colorRange?.[0] ?? '#dbeafe', color.toHexString()] })} />
          </Form.Item>
        </>
      ) : null}
    </Form>
  );
};
