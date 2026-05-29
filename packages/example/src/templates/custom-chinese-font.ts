import type { ReportFont } from '@report-designer/core';
import { band, text } from './common';
import { template } from './common';

export const customChineseReportFont: ReportFont = {
  id: 'example-custom-chinese',
  name: '示例自定义中文字体',
  family: 'Microsoft YaHei UI',
  fallback: 'Microsoft YaHei, SimHei, sans-serif',
};

export const customChineseFontTemplate = {
  ...template('custom-chinese-font', 'Custom Chinese Font', [
    band('custom-chinese-title', 'reportTitle', 34, [
      text('custom-chinese-title-text', '自定义中文字体示例', 0, 4, 190, 12, {
        font: {
          family: customChineseReportFont.family,
          size: 20,
          bold: true,
          color: '#111827',
        },
        textAlign: 'center',
        verticalAlign: 'middle',
      }),
      text('custom-chinese-title-note', '字体由模板代码注册，页面设置中只读展示，不在界面里新增或删除。', 0, 20, 190, 8, {
        font: {
          family: customChineseReportFont.family,
          size: 10,
          color: '#4b5563',
        },
        textAlign: 'center',
        verticalAlign: 'middle',
      }),
    ]),
    band('custom-chinese-data', 'data', 56, [
      text('custom-chinese-body-1', '报表级字体注册：customChineseReportFont', 8, 6, 174, 9, {
        font: {
          family: customChineseReportFont.family,
          size: 12,
          color: '#1f2937',
        },
      }),
      text('custom-chinese-body-2', '中文内容：采购入库单、供应商、仓库、明细合计、页小计。', 8, 20, 174, 9, {
        font: {
          family: customChineseReportFont.family,
          size: 12,
          color: '#1f2937',
        },
      }),
      text('custom-chinese-body-3', '打开设计器后，选中文本组件，在字体下拉中可以看到“示例自定义中文字体”。', 8, 34, 174, 9, {
        font: {
          family: customChineseReportFont.family,
          size: 11,
          color: '#0f4c9c',
        },
      }),
    ]),
  ]),
  fonts: [customChineseReportFont],
};
