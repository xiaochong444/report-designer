import type { BorderConfig, FontConfig, ReportBandV2, ReportTemplateV2, TextComponentV2 } from '@report-designer/core';

type TextOptions = Omit<Partial<TextComponentV2>, 'font' | 'border'> & {
  font?: Partial<FontConfig>;
  border?: BorderConfig;
};

export const dataFields = {
  employees: [
    field('employees.id', 'id', 'number'),
    field('employees.name', 'name', 'string'),
    field('employees.department', 'department', 'string'),
    field('employees.salary', 'salary', 'number'),
    field('employees.hireDate', 'hireDate', 'date'),
  ],
  invoiceLines: [
    field('invoiceLines.sku', 'sku', 'string'),
    field('invoiceLines.name', 'name', 'string'),
    field('invoiceLines.qty', 'qty', 'number'),
    field('invoiceLines.unitPrice', 'unitPrice', 'number'),
    field('invoiceLines.lineTotal', 'lineTotal', 'number'),
  ],
  orderLines: [
    field('orderLines.orderNo', 'orderNo', 'string'),
    field('orderLines.customer', 'customer', 'string'),
    field('orderLines.orderDate', 'orderDate', 'date'),
    field('orderLines.sku', 'sku', 'string'),
    field('orderLines.name', 'name', 'string'),
    field('orderLines.qty', 'qty', 'number'),
    field('orderLines.unitPrice', 'unitPrice', 'number'),
    field('orderLines.lineTotal', 'lineTotal', 'number'),
  ],
};

export function template(id: string, name: string, bands: ReportBandV2[], height = 297): ReportTemplateV2 {
  return {
    id,
    name,
    version: '2.0',
    pages: [
      {
        id: `${id}-page`,
        width: 210,
        height,
        margins: { top: 8, right: 10, bottom: 8, left: 10 },
        orientation: 'portrait',
        bands,
      },
    ],
    dataSources: [
      { id: 'employees', name: 'employees', type: 'json', path: 'employees', fields: dataFields.employees },
      { id: 'invoiceLines', name: 'invoiceLines', type: 'json', path: 'invoiceLines', fields: dataFields.invoiceLines },
      { id: 'orderLines', name: 'orderLines', type: 'json', path: 'orderLines', fields: dataFields.orderLines },
    ],
    styles: [],
    conditionalFormats: [],
    parameters: [],
  };
}

export function band(id: string, type: ReportBandV2['type'], height: number, components: TextComponentV2[] = [], overrides: Partial<ReportBandV2> = {}): ReportBandV2 {
  return {
    id,
    type,
    height,
    components,
    behavior: {
      enabled: true,
      printOn: 'allPages',
      printIfEmpty: true,
      printOnAllPages: type === 'pageHeader' || type === 'pageFooter' || type === 'groupHeader',
      keepTogether: false,
      canBreak: type === 'data' || type === 'child',
      printAtBottom: type === 'pageFooter',
    },
    ...overrides,
  };
}

export function text(id: string, content: string, x: number, y: number, width: number, height: number, options: TextOptions = {}): TextComponentV2 {
  return {
    id,
    type: 'text',
    x,
    y,
    width,
    height,
    text: content,
    font: {
      family: 'Arial',
      size: 9,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      color: '#1f2937',
      ...options.font,
    },
    textAlign: options.textAlign ?? 'left',
    verticalAlign: options.verticalAlign ?? 'middle',
    border: options.border ?? {
      style: 'none',
      width: 0,
      color: '#cfd6df',
      sides: { top: false, right: false, bottom: false, left: false },
    },
    canGrow: options.canGrow ?? false,
    canShrink: options.canShrink ?? false,
    ...options,
  };
}

export function moneyExpression(source: string, fieldName: string): string {
  return `FORMAT("N2", {${source}.${fieldName}})`;
}

function field(id: string, name: string, type: 'string' | 'number' | 'date' | 'boolean') {
  return { id, name, path: id, type, nullable: false };
}
