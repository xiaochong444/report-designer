import type { PanelComponent, ReportComponent } from '@report-designer/core';
import { band, commonTextStyleIds, template, text } from './common';

const panelBorder = {
  style: 'solid' as const,
  width: 0.2,
  color: '#94a3b8',
  sides: { top: true, right: true, bottom: true, left: true },
};

const transparentBorder = {
  style: 'none' as const,
  width: 0,
  color: '#000000',
  sides: { top: false, right: false, bottom: false, left: false },
};

const sampleImage =
  'data:image/png;base64,' +
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lxwQ2wAAAABJRU5ErkJggg==';

const panelChildren: ReportComponent[] = [
  text('cc-panel-title', 'Panel child text', 4, 3, 54, 7, { style: commonTextStyleIds.header }),
  {
    id: 'cc-panel-image',
    type: 'image',
    x: 4,
    y: 13,
    width: 28,
    height: 18,
    src: sampleImage,
    fitMode: 'cover',
  },
  {
    id: 'cc-panel-line',
    type: 'line',
    x: 38,
    y: 14,
    width: 44,
    height: 4,
    startX: 0,
    startY: 2,
    endX: 44,
    endY: 2,
    lineColor: '#0f172a',
    lineWidth: 0.3,
    lineStyle: 'dashed',
  },
  {
    id: 'cc-panel-shape',
    type: 'shape',
    x: 38,
    y: 21,
    width: 18,
    height: 12,
    shapeType: 'roundRect',
    fillColor: '#dcfce7',
    borderColor: '#16a34a',
    borderWidth: 0.2,
    borderStyle: 'solid',
  },
  {
    id: 'cc-panel-checkbox',
    type: 'checkbox',
    x: 60,
    y: 21,
    width: 32,
    height: 8,
    checked: true,
    label: 'Ready',
  },
  {
    id: 'cc-panel-barcode',
    type: 'barcode',
    x: 4,
    y: 35,
    width: 42,
    height: 14,
    value: 'CC-1001',
    format: 'CODE128',
    showText: true,
  },
  {
    id: 'cc-panel-richtext',
    type: 'richtext',
    x: 52,
    y: 35,
    width: 38,
    height: 14,
    html: '<strong>Rich</strong> note',
  },
  {
    id: 'cc-panel-subreport',
    type: 'subreport',
    x: 4,
    y: 53,
    width: 86,
    height: 12,
    templateUrl: 'common-components-detail',
    parameters: { source: '"panel"' },
  },
];

const panel: PanelComponent = {
  id: 'cc-panel',
  type: 'panel',
  name: 'Common Components Panel',
  x: 6,
  y: 4,
  width: 98,
  height: 70,
  backgroundColor: '#f8fafc',
  border: panelBorder,
  components: panelChildren,
};

const standaloneSubreport: ReportComponent = {
  id: 'cc-subreport',
  type: 'subreport',
  name: 'Local Detail Template',
  x: 112,
  y: 22,
  width: 66,
  height: 28,
  templateUrl: 'common-components-detail',
  parameters: { orderNo: '{orderLines.orderNo}' },
};

export const commonComponentsTemplate = template('common-components', 'Common Components', [
  band('cc-title', 'reportTitle', 14, [
    text('cc-title-text', 'Common Components', 0, 2, 100, 8, { style: commonTextStyleIds.title }),
    text('cc-note', 'Panel and local subreport design sample', 108, 3, 72, 6, { style: commonTextStyleIds.pageHeader }),
  ]),
  band('cc-data', 'data', 82, [
    panel,
    standaloneSubreport,
    text('cc-subreport-label', 'Standalone subreport uses local template key:', 112, 10, 66, 6, { style: commonTextStyleIds.data }),
  ], {
    dataBand: { dataSourceId: 'orderLines' },
  }),
  band('cc-footer', 'pageFooter', 8, [
    text('cc-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footer, textAlign: 'center' }),
  ]),
]);

export const commonComponentsDetailTemplate = template('common-components-detail', 'Common Components Detail', [
  band('ccd-data', 'data', 20, [
    text('ccd-detail', 'Local detail template placeholder', 0, 3, 80, 6, {
      border: transparentBorder,
      style: commonTextStyleIds.data,
    }),
  ]),
]);
