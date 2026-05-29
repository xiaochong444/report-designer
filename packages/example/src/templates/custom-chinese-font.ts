import type { ReportFont } from '@report-designer/core';
import { band, text } from './common';
import { template } from './common';

export const commonChineseReportFonts: ReportFont[] = [
  { id: 'example-microsoft-yahei', name: '微软雅黑', family: 'Microsoft YaHei', fallback: 'sans-serif' },
  { id: 'example-simsun', name: '宋体', family: 'SimSun', fallback: 'serif' },
  { id: 'example-simhei', name: '黑体', family: 'SimHei', fallback: 'sans-serif' },
  { id: 'example-kaiti', name: '楷体', family: 'KaiTi', fallback: 'serif' },
  { id: 'example-fangsong', name: '仿宋', family: 'FangSong', fallback: 'serif' },
];

const [microsoftYaHei, simsun, simhei, kaiti, fangsong] = commonChineseReportFonts;

export const customChineseFontTemplate = {
  ...template('custom-chinese-font', 'Custom Chinese Font', [
    band('custom-chinese-title', 'reportTitle', 38, [
      text('custom-chinese-title-text', '常见中文字体代码注册示例', 0, 4, 190, 12, {
        font: {
          family: microsoftYaHei.family,
          size: 20,
          bold: true,
          color: '#111827',
        },
        textAlign: 'center',
        verticalAlign: 'middle',
      }),
      text('custom-chinese-title-note', '字体由模板代码注册：微软雅黑、宋体、黑体、楷体、仿宋。', 0, 21, 190, 8, {
        font: {
          family: simsun.family,
          size: 10,
          color: '#4b5563',
        },
        textAlign: 'center',
        verticalAlign: 'middle',
      }),
    ]),
    band('custom-chinese-data', 'data', 70, [
      text('custom-chinese-body-1', '微软雅黑：采购入库单、供应商、仓库、明细合计。', 8, 6, 174, 9, {
        font: {
          family: microsoftYaHei.family,
          size: 12,
          color: '#1f2937',
        },
      }),
      text('custom-chinese-body-2', '宋体：本页小计、报表总计、分组小计。', 8, 19, 174, 9, {
        font: {
          family: simsun.family,
          size: 12,
          color: '#1f2937',
        },
      }),
      text('custom-chinese-body-3', '黑体：标题、表头、重点字段可使用更醒目的字体。', 8, 32, 174, 9, {
        font: {
          family: simhei.family,
          size: 11,
          color: '#0f4c9c',
        },
      }),
      text('custom-chinese-body-4', '楷体：备注、说明、签名等内容可使用楷体。', 8, 45, 174, 9, {
        font: {
          family: kaiti.family,
          size: 11,
          color: '#1f2937',
        },
      }),
      text('custom-chinese-body-5', '仿宋：合同、正式单据中的说明文字可使用仿宋。', 8, 58, 174, 9, {
        font: {
          family: fangsong.family,
          size: 11,
          color: '#1f2937',
        },
      }),
    ]),
  ]),
  fonts: commonChineseReportFonts,
};
