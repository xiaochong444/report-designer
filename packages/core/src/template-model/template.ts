import type { Band, ReportStyle, ReportTemplate, Page } from './types';

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

const DEFAULT_FONT = {
  family: 'Arial',
  size: 10,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  color: '#000000',
} as const;

const DEFAULT_BORDER = {
  style: 'none',
  width: 0,
  color: '#000000',
  sides: {
    top: false,
    right: false,
    bottom: false,
    left: false,
  },
} as const;

const DEFAULT_PADDING = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as const;

function createDefaultTextStyles(): ReportStyle[] {
  return [
    {
      id: 'text-normal',
      name: 'Normal',
      category: 'text',
      font: { ...DEFAULT_FONT },
      border: { ...DEFAULT_BORDER, sides: { ...DEFAULT_BORDER.sides } },
      backgroundColor: 'transparent',
      textAlign: 'left',
      verticalAlign: 'top',
      padding: { ...DEFAULT_PADDING },
      canGrow: false,
      canShrink: false,
      isDefault: true,
    },
    {
      id: 'text-title',
      name: 'Title',
      category: 'text',
      font: { ...DEFAULT_FONT, size: 18, bold: true },
      border: { ...DEFAULT_BORDER, sides: { ...DEFAULT_BORDER.sides } },
      backgroundColor: 'transparent',
      textAlign: 'left',
      verticalAlign: 'middle',
      padding: { ...DEFAULT_PADDING },
      canGrow: false,
      canShrink: false,
    },
    {
      id: 'text-header',
      name: 'Header',
      category: 'text',
      font: { ...DEFAULT_FONT, bold: true },
      border: { ...DEFAULT_BORDER, style: 'solid', sides: { ...DEFAULT_BORDER.sides, bottom: true }, width: 0.2 },
      backgroundColor: '#f5f5f5',
      textAlign: 'left',
      verticalAlign: 'middle',
      padding: { top: 1, right: 1, bottom: 1, left: 1 },
      canGrow: false,
      canShrink: false,
    },
    {
      id: 'text-data',
      name: 'Data',
      category: 'text',
      font: { ...DEFAULT_FONT },
      border: { ...DEFAULT_BORDER, sides: { ...DEFAULT_BORDER.sides } },
      backgroundColor: 'transparent',
      textAlign: 'left',
      verticalAlign: 'top',
      padding: { ...DEFAULT_PADDING },
      canGrow: true,
      canShrink: false,
    },
    {
      id: 'text-footer',
      name: 'Footer',
      category: 'text',
      font: { ...DEFAULT_FONT, size: 9, italic: true, color: '#444444' },
      border: { ...DEFAULT_BORDER, style: 'solid', sides: { ...DEFAULT_BORDER.sides, top: true }, width: 0.2 },
      backgroundColor: 'transparent',
      textAlign: 'left',
      verticalAlign: 'middle',
      padding: { top: 1, right: 0, bottom: 0, left: 0 },
      canGrow: false,
      canShrink: false,
    },
    {
      id: 'text-group',
      name: 'Group',
      category: 'text',
      font: { ...DEFAULT_FONT, bold: true, color: '#222222' },
      border: { ...DEFAULT_BORDER, sides: { ...DEFAULT_BORDER.sides } },
      backgroundColor: '#eeeeee',
      textAlign: 'left',
      verticalAlign: 'middle',
      padding: { top: 1, right: 1, bottom: 1, left: 1 },
      canGrow: false,
      canShrink: false,
    },
  ];
}

function createBandBehavior(type: Band['type']): Band['behavior'] {
  return {
    enabled: true,
    printOn: 'allPages',
    printIfEmpty: true,
    printOnAllPages: type === 'pageHeader' || type === 'pageFooter' || type === 'groupHeader',
    keepTogether: false,
    canBreak: type === 'data' || type === 'child',
    printAtBottom: type === 'pageFooter',
  };
}

export function createDefaultTemplate(name = '未命名报表'): ReportTemplate {
  const pageId = uid();
  const bands: Band[] = [
    { id: uid(), type: 'reportTitle', height: DEFAULT_BAND_HEIGHTS.reportTitle, components: [], behavior: createBandBehavior('reportTitle') },
    { id: uid(), type: 'pageHeader', height: DEFAULT_BAND_HEIGHTS.pageHeader, components: [], behavior: createBandBehavior('pageHeader') },
    { id: uid(), type: 'data', height: DEFAULT_BAND_HEIGHTS.data, components: [], behavior: createBandBehavior('data'), dataBand: {} },
    { id: uid(), type: 'pageFooter', height: DEFAULT_BAND_HEIGHTS.pageFooter, components: [], behavior: createBandBehavior('pageFooter') },
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
    version: '2.0',
    pages: [page],
    dataSources: [],
    styles: createDefaultTextStyles(),
    conditionalFormats: [],
    parameters: [],
  };
}
