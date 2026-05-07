import type { Band, ReportTemplate } from '../src';

export function makeTemplate(bands: Band[]): ReportTemplate {
  return {
    id: 'template',
    name: 'Template',
    version: '2.0',
    pages: [
      {
        id: 'page-1',
        width: 210,
        height: 297,
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        orientation: 'portrait',
        bands,
      },
    ],
    dataSources: [
      {
        id: 'employees',
        name: 'Employees',
        type: 'json',
        path: 'employees',
        fields: [],
      },
    ],
    styles: [],
    conditionalFormats: [],
    parameters: [],
  };
}

export function band(
  id: string,
  type: Band['type'],
  overrides: Partial<Band> = {},
): Band {
  return {
    id,
    type,
    height: 10,
    components: [],
    behavior: {
      enabled: true,
      printOn: 'allPages',
      printIfEmpty: true,
      printOnAllPages: false,
      keepTogether: false,
      canBreak: true,
      printAtBottom: false,
    },
    ...overrides,
  };
}
