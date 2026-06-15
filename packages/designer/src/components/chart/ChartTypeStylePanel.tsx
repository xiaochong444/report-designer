import React from 'react';
import { ColorPicker, Form, InputNumber, Select, Switch } from 'antd';
import type { ChartCapabilities, ChartPlotOptions, ChartType } from '@report-designer/core';
import { chartUiText, isBarLike, isLineLike, isPieLike, type ChartPanelT } from './chart-options';

const FORM_LABEL_COL = { span: 8 };
const FORM_WRAPPER_COL = { span: 16 };
const DEFAULT_HEATMAP_START_COLOR = '#dbeafe';
const DEFAULT_HEATMAP_END_COLOR = '#1d4ed8';

export const ChartTypeStylePanel: React.FC<{
  chartType: ChartType;
  capabilities: ChartCapabilities;
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
  const updateRadar = React.useCallback((updates: NonNullable<ChartPlotOptions['radar']>) => onChange({ ...value, radar: { ...(value.radar ?? {}), ...updates } }), [onChange, value]);
  const updateFunnel = React.useCallback((updates: NonNullable<ChartPlotOptions['funnel']>) => onChange({ ...value, funnel: { ...(value.funnel ?? {}), ...updates } }), [onChange, value]);
  const updateDualAxis = React.useCallback((updates: NonNullable<ChartPlotOptions['dualAxis']>) => onChange({ ...value, dualAxis: { ...(value.dualAxis ?? {}), ...updates } }), [onChange, value]);

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
      {chartType === 'radar' ? (
        <>
          <Form.Item label={t('chartRadarShape')}>
            <Select
              aria-label={t('chartRadarShape')}
              size="small"
              value={value.radar?.shape ?? 'polygon'}
              onChange={(shape: NonNullable<ChartPlotOptions['radar']>['shape']) => updateRadar({ shape })}
              options={[
                { value: 'polygon', label: t('chartRadarPolygon') },
                { value: 'circle', label: t('chartRadarCircle') },
              ]}
            />
          </Form.Item>
          <Form.Item label={t('chartShowRadarArea')}>
            <Switch aria-label={t('chartShowRadarArea')} size="small" checked={value.radar?.showArea ?? true} onChange={showArea => updateRadar({ showArea })} />
          </Form.Item>
          <Form.Item label={t('chartRadarAreaOpacity')}>
            <InputNumber aria-label={t('chartRadarAreaOpacity')} value={value.radar?.areaOpacity ?? 0.3} min={0} max={1} step={0.05} size="small" style={{ width: '100%' }} onChange={areaOpacity => updateRadar({ areaOpacity: areaOpacity ?? 0.3 })} />
          </Form.Item>
          <Form.Item label={ui.lineWidth}>
            <InputNumber aria-label={ui.lineWidth} value={value.radar?.lineWidth ?? 2} min={0} max={20} size="small" style={{ width: '100%' }} onChange={lineWidth => updateRadar({ lineWidth: lineWidth ?? 2 })} />
          </Form.Item>
          <Form.Item label={t('chartShowPoint')}>
            <Switch aria-label={t('chartShowPoint')} size="small" checked={value.radar?.showPoint ?? true} onChange={showPoint => updateRadar({ showPoint })} />
          </Form.Item>
          <Form.Item label={t('chartPointSize')}>
            <InputNumber aria-label={t('chartPointSize')} value={value.radar?.pointSize ?? 4} min={0} max={30} size="small" style={{ width: '100%' }} onChange={pointSize => updateRadar({ pointSize: pointSize ?? 4 })} />
          </Form.Item>
        </>
      ) : null}
      {chartType === 'funnel' ? (
        <>
          <Form.Item label={t('chartFunnelDirection')}>
            <Select
              aria-label={t('chartFunnelDirection')}
              size="small"
              value={value.funnel?.direction ?? 'vertical'}
              onChange={(direction: NonNullable<ChartPlotOptions['funnel']>['direction']) => updateFunnel({ direction })}
              options={[
                { value: 'vertical', label: t('chartVertical') },
                { value: 'horizontal', label: t('chartHorizontal') },
              ]}
            />
          </Form.Item>
          <Form.Item label={t('chartFunnelShape')}>
            <Select
              aria-label={t('chartFunnelShape')}
              size="small"
              value={value.funnel?.shape ?? 'trapezoid'}
              onChange={(shape: NonNullable<ChartPlotOptions['funnel']>['shape']) => updateFunnel({ shape })}
              options={[
                { value: 'trapezoid', label: t('chartFunnelTrapezoid') },
                { value: 'triangle', label: t('chartFunnelTriangle') },
                { value: 'rect', label: t('chartFunnelRect') },
              ]}
            />
          </Form.Item>
          <Form.Item label={t('chartShowConversionRate')}>
            <Switch aria-label={t('chartShowConversionRate')} size="small" checked={value.funnel?.showConversionRate ?? false} onChange={showConversionRate => updateFunnel({ showConversionRate })} />
          </Form.Item>
          <Form.Item label={ui.heatmapCellGap}>
            <InputNumber aria-label={ui.heatmapCellGap} value={value.funnel?.gap ?? 0} min={0} max={40} size="small" style={{ width: '100%' }} onChange={gap => updateFunnel({ gap: gap ?? 0 })} />
          </Form.Item>
        </>
      ) : null}
      {chartType === 'dualAxis' ? (
        <>
          <Form.Item label={t('chartTypeColumn')}>
            <Select
              aria-label={t('chartTypeColumn')}
              size="small"
              value={value.dualAxis?.primaryType ?? 'bar'}
              onChange={(primaryType: NonNullable<ChartPlotOptions['dualAxis']>['primaryType']) => updateDualAxis({ primaryType })}
              options={[
                { value: 'bar', label: t('chartTypeColumn') },
                { value: 'line', label: t('chartTypeLine') },
              ]}
            />
          </Form.Item>
          <Form.Item label={t('chartTypeLine')}>
            <Select
              aria-label={t('chartTypeLine')}
              size="small"
              value={value.dualAxis?.secondaryType ?? 'line'}
              onChange={(secondaryType: NonNullable<ChartPlotOptions['dualAxis']>['secondaryType']) => updateDualAxis({ secondaryType })}
              options={[
                { value: 'bar', label: t('chartTypeColumn') },
                { value: 'line', label: t('chartTypeLine') },
              ]}
            />
          </Form.Item>
        </>
      ) : null}
    </Form>
  );
});
