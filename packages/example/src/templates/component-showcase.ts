import type { PanelComponent, ReportComponentUnion, ReportFont } from '@report-designer/core';
import { band, barcode, commonTextStyleIds, qrcode, template, text } from './common';

export const commonChineseReportFonts: ReportFont[] = [
  { id: 'example-microsoft-yahei', name: '微软雅黑', family: 'Microsoft YaHei', fallback: 'sans-serif' },
  { id: 'example-simsun', name: '宋体', family: 'SimSun', fallback: 'serif' },
  { id: 'example-simhei', name: '黑体', family: 'SimHei', fallback: 'sans-serif' },
  { id: 'example-kaiti', name: '楷体', family: 'KaiTi', fallback: 'serif' },
  { id: 'example-fangsong', name: '仿宋', family: 'FangSong', fallback: 'serif' },
];

const [microsoftYaHei, simsun, simhei] = commonChineseReportFonts;

const panelBorder = {
  style: 'solid' as const,
  width: 0.2,
  color: '#94a3b8',
  sides: { top: true, right: true, bottom: true, left: true },
};

const sampleImage =
  'data:image/png;base64,' +
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lxwQ2wAAAABJRU5ErkJggg==';

const panelChildren: ReportComponentUnion[] = [
  text('cs-panel-title', 'Panel 子组件', 4, 3, 54, 7, { style: commonTextStyleIds.header }),
  {
    id: 'cs-panel-image',
    type: 'image',
    x: 4,
    y: 13,
    width: 28,
    height: 18,
    src: sampleImage,
    fitMode: 'cover',
  },
  {
    id: 'cs-panel-line',
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
    id: 'cs-panel-shape',
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
    id: 'cs-panel-checkbox',
    type: 'checkbox',
    x: 60,
    y: 21,
    width: 32,
    height: 8,
    checked: true,
    label: '已审核',
  },
  barcode('cs-panel-barcode', 'CS-DEMO-001', 4, 35, 42, 12),
  qrcode('cs-panel-qrcode', 'https://example.test/showcase', 48, 34, 16, 16),
  {
    id: 'cs-panel-richtext',
    type: 'richtext',
    x: 68,
    y: 35,
    width: 22,
    height: 14,
    html: '<strong>富文本</strong> 示例',
  },
];

const panel: PanelComponent = {
  id: 'cs-panel',
  type: 'panel',
  name: 'Component Showcase Panel',
  x: 6,
  y: 4,
  width: 98,
  height: 52,
  backgroundColor: '#f8fafc',
  border: panelBorder,
  components: panelChildren,
};

const base = template('component-showcase', '组件能力全景', [
  band('cs-title', 'reportTitle', 14, [
    text('cs-title-text', '组件能力全景', 0, 2, 190, 8, {
      font: { family: microsoftYaHei.family, size: 16, bold: true, color: '#111827' },
      textAlign: 'center',
    }),
    text('cs-note', '全组件速查 + 中文字体注册', 0, 11, 190, 5, {
      font: { family: simsun.family, size: 9, color: '#6b7280' },
      textAlign: 'center',
    }),
  ]),
  band('cs-body', 'data', 90, [
    panel,
    text('cs-font-demo', '黑体表头示例', 112, 4, 66, 7, {
      font: { family: simhei.family, size: 11, bold: true, color: '#0f4c9c' },
    }),
    {
      id: 'cs-pagenumber',
      type: 'pagenumber',
      x: 112,
      y: 16,
      width: 40,
      height: 8,
      format: '1/N',
      font: { family: simsun.family, size: 9, color: '#374151' },
      textAlign: 'left',
    },
    {
      id: 'cs-datetime',
      type: 'datetime',
      x: 112,
      y: 28,
      width: 66,
      height: 8,
      format: 'yyyy-MM-dd HH:mm',
      font: { family: simsun.family, size: 9, color: '#374151' },
      textAlign: 'left',
    },
    text('cs-standalone-barcode-label', '独立条码', 112, 42, 30, 6, { style: commonTextStyleIds.pageHeader }),
    barcode('cs-standalone-barcode', 'SHOWCASE-2026', 112, 50, 50, 14),
    text('cs-standalone-qrcode-label', '独立二维码', 112, 68, 30, 6, { style: commonTextStyleIds.pageHeader }),
    qrcode('cs-standalone-qrcode', 'SHOWCASE', 112, 76, 16, 16),
  ]),
  band('cs-footer', 'pageFooter', 8, [
    text('cs-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footerCenter }),
  ]),
]);

export const componentShowcaseTemplate = {
  ...base,
  fonts: commonChineseReportFonts,
};
