import type { ReportTemplate, Page, Band } from './types';

let idCounter = 0;
function uid(): string {
  return `id_${++idCounter}`;
}

const DEFAULT_BAND_HEIGHTS: Record<string, number> = {
  reportTitle: 40,
  reportSummary: 30,
  pageHeader: 20,
  pageFooter: 20,
  groupHeader: 25,
  groupFooter: 25,
  data: 20,
  child: 15,
};

export function createDefaultTemplate(name = '未命名报表'): ReportTemplate {
  const pageId = uid();
  const bands: Band[] = [
    { id: uid(), type: 'reportTitle', height: DEFAULT_BAND_HEIGHTS.reportTitle, components: [] },
    { id: uid(), type: 'pageHeader', height: DEFAULT_BAND_HEIGHTS.pageHeader, components: [] },
    { id: uid(), type: 'data', height: DEFAULT_BAND_HEIGHTS.data, components: [] },
    { id: uid(), type: 'pageFooter', height: DEFAULT_BAND_HEIGHTS.pageFooter, components: [] },
  ];

  const page: Page = {
    id: pageId,
    width: 210,
    height: 297,
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    orientation: 'portrait',
    bands,
  };

  return {
    id: uid(),
    name,
    version: '1.0',
    pages: [page],
    dataSources: [],
    styles: [],
    conditionalFormats: [],
  };
}
