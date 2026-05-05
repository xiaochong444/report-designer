import type { RenderDocument, ReportBandV2, ReportTemplateV2, TextComponentV2 } from '@report-designer/core';

export function makeViewerTemplate(rowCount = 2): { template: ReportTemplateV2; data: Record<string, Record<string, unknown>[]> } {
  const data = {
    employees: Array.from({ length: rowCount }, (_, index) => ({ name: `Employee ${index + 1}` })),
  };
  const template: ReportTemplateV2 = {
    id: 'template',
    name: 'Viewer Template',
    version: '2.0',
    pages: [
      {
        id: 'page-1',
        width: 210,
        height: 70,
        margins: { top: 5, right: 5, bottom: 5, left: 5 },
        orientation: 'portrait',
        bands: [
          band('header', 'pageHeader', 8, [text('header-text', 'Employees')]),
          band('data', 'data', 20, [text('name', '{employees.name}')], { dataBand: { dataSourceId: 'employees' } }),
          band('footer', 'pageFooter', 10, [text('page-number', '{PageNumber}/{TotalPages}')]),
        ],
      },
    ],
    dataSources: [],
    styles: [],
    conditionalFormats: [],
    parameters: [],
  };
  return { template, data };
}

export function makeRenderDocument(): RenderDocument {
  return {
    pages: [
      {
        id: 'page-1',
        pageNumber: 1,
        totalPages: 1,
        width: 210,
        height: 297,
        items: [
          {
            id: 'band-1',
            bandId: 'band-1',
            bandType: 'data',
            x: 20,
            y: 20,
            width: 170,
            height: 20,
            components: [
              {
                id: 'text-1',
                type: 'text',
                x: 25,
                y: 25,
                width: 80,
                height: 8,
                content: 'Hello PDF',
                style: {
                  font: { family: 'Arial', size: 11, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
                  border: { style: 'solid', width: 0.2, color: '#000000', sides: { top: true, right: true, bottom: true, left: true } },
                  backgroundColor: '#f5f5f5',
                  textAlign: 'left',
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

function band(
  id: string,
  type: ReportBandV2['type'],
  height: number,
  components: TextComponentV2[],
  overrides: Partial<ReportBandV2> = {},
): ReportBandV2 {
  return {
    id,
    type,
    height,
    components,
    behavior: {
      enabled: true,
      printOn: 'allPages',
      printIfEmpty: true,
      printOnAllPages: type === 'pageHeader' || type === 'pageFooter',
      keepTogether: false,
      canBreak: true,
      printAtBottom: type === 'pageFooter',
    },
    ...overrides,
  };
}

function text(id: string, content: string): TextComponentV2 {
  return {
    id,
    type: 'text',
    x: 0,
    y: 0,
    width: 70,
    height: 8,
    text: content,
    font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
    textAlign: 'left',
    verticalAlign: 'top',
    border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    canGrow: false,
    canShrink: false,
  };
}
