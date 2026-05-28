export type ViewerLocale = 'zh-CN' | 'en-US';

export interface ViewerMessages {
  print: string;
  exportPdf: string;
  previousPage: string;
  nextPage: string;
  currentPage: string;
  zoomOut: string;
  zoomIn: string;
  fullscreen: string;
  eventLogs: string;
  eventLogsEmpty: string;
  eventLogsExport: string;
  eventLogsClear: string;
  eventLogsOpen: string;
  eventLogsAll: string;
  eventLogsInfo: string;
  eventLogsWarning: string;
  eventLogsError: string;
  ownerReport: string;
  ownerPage: string;
  ownerBand: string;
  ownerComponent: string;
  line: string;
}

export const viewerMessages: Record<ViewerLocale, ViewerMessages> = {
  'en-US': {
    print: 'Print',
    exportPdf: 'Export PDF',
    previousPage: 'Previous Page',
    nextPage: 'Next Page',
    currentPage: 'Current Page',
    zoomOut: 'Zoom Out',
    zoomIn: 'Zoom In',
    fullscreen: 'Fullscreen',
    eventLogs: 'Event Logs',
    eventLogsEmpty: 'No event logs',
    eventLogsExport: 'Export Event Logs',
    eventLogsClear: 'Clear Event Logs',
    eventLogsOpen: 'Open Event',
    eventLogsAll: 'All',
    eventLogsInfo: 'Info',
    eventLogsWarning: 'Warning',
    eventLogsError: 'Error',
    ownerReport: 'Report',
    ownerPage: 'Page',
    ownerBand: 'Band',
    ownerComponent: 'Component',
    line: 'Line',
  },
  'zh-CN': {
    print: '打印',
    exportPdf: '导出 PDF',
    previousPage: '上一页',
    nextPage: '下一页',
    currentPage: '当前页',
    zoomOut: '缩小',
    zoomIn: '放大',
    fullscreen: '全屏',
    eventLogs: '事件日志',
    eventLogsEmpty: '暂无事件日志',
    eventLogsExport: '导出事件日志',
    eventLogsClear: '清空事件日志',
    eventLogsOpen: '打开事件',
    eventLogsAll: '全部',
    eventLogsInfo: '信息',
    eventLogsWarning: '警告',
    eventLogsError: '错误',
    ownerReport: '报表',
    ownerPage: '页面',
    ownerBand: '带区',
    ownerComponent: '组件',
    line: '行',
  },
};

export function getViewerMessages(locale: ViewerLocale = 'en-US'): ViewerMessages {
  return viewerMessages[locale] ?? viewerMessages['en-US'];
}
