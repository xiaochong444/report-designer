import type { ReportComponent, TableComponent } from '@report-designer/core';
import { nanoid } from 'nanoid';
import { formatDataFieldExpression } from './data-source-fields';

const DEFAULT_FONT = {
  family: 'Arial',
  size: 12,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  color: '#000000',
};

const DEFAULT_BORDER = {
  style: 'none' as const,
  width: 0,
  color: '#000000',
  sides: { top: false, right: false, bottom: false, left: false },
};

function defaultFont() {
  return { ...DEFAULT_FONT };
}

function defaultBorder() {
  return { ...DEFAULT_BORDER, sides: { ...DEFAULT_BORDER.sides } };
}

function roundMm(value: number) {
  return Math.round(value * 10) / 10;
}

export function createDefaultComponent(type: string, xMm: number, yMm: number): ReportComponent {
  const id = `comp_${type}_${nanoid(6)}`;
  const x = roundMm(xMm);
  const y = roundMm(yMm);

  switch (type) {
    case 'text':
      return {
        id, type: 'text', x, y, width: 40, height: 8,
        text: '',
        font: defaultFont(),
        textAlign: 'left',
        verticalAlign: 'middle',
        border: defaultBorder(),
        canGrow: false,
        canShrink: false,
      } as ReportComponent;
    case 'image':
      return { id, type: 'image', x, y, width: 30, height: 30, src: '', fitMode: 'contain' } as ReportComponent;
    case 'chart':
      return {
        id,
        type: 'chart',
        x,
        y,
        width: 80,
        height: 50,
        chartType: 'column',
        binding: {
          dataSourceId: '',
          dimensions: [],
          measures: [],
          seriesField: '',
          labelField: '',
          sort: [],
          aggregate: 'none',
        },
        appearance: {
          title: '',
          subtitle: '',
          showLegend: true,
          legendPosition: 'bottom',
          showAxes: true,
          showGrid: true,
          showLabels: false,
          theme: { baseTheme: 'light' },
          axisTitleX: '',
          axisTitleY: '',
        },
      } as ReportComponent;
    case 'barcode':
      return { id, type: 'barcode', x, y, width: 50, height: 16, value: '1234567890', format: 'CODE128', showText: true } as ReportComponent;
    case 'qrcode':
      return { id, type: 'qrcode', x, y, width: 24, height: 24, value: 'https://example.com', format: 'QR_CODE' } as ReportComponent;
    case 'table':
      return {
        id,
        type: 'table',
        x,
        y,
        width: 90,
        height: 8,
        showBorder: true,
        border: { style: 'solid', width: 0.2, color: '#8c8c8c', sides: { top: true, right: true, bottom: true, left: true } },
        rows: [{
          id: 'row_1',
          height: 8,
          cells: [
            { id: 'cell_1_1' },
            { id: 'cell_1_2' },
            { id: 'cell_1_3' },
          ],
        }],
      } as TableComponent;
    case 'checkbox':
      return { id, type: 'checkbox', x, y, width: 15, height: 15, checked: '', label: '' } as ReportComponent;
    case 'richtext':
      return { id, type: 'richtext', x, y, width: 60, height: 20, html: '' } as ReportComponent;
    case 'subreport':
      return { id, type: 'subreport', x, y, width: 80, height: 60, templateUrl: '', parameters: {} } as ReportComponent;
    case 'panel':
      return { id, type: 'panel', x, y, width: 60, height: 40, components: [], border: defaultBorder() } as ReportComponent;
    case 'line':
      return { id, type: 'line', x, y, width: 50, height: 10, startX: 0, startY: 0, endX: 50, endY: 0, lineColor: '#000000', lineWidth: 0.2, lineStyle: 'solid' } as ReportComponent;
    case 'shape':
      return { id, type: 'shape', x, y, width: 30, height: 30, shapeType: 'rectangle', fillColor: 'transparent', borderColor: '#000000', borderWidth: 0.2, borderStyle: 'solid' } as ReportComponent;
    case 'pagenumber':
      return { id, type: 'pagenumber', x, y, width: 30, height: 15, format: '1/N', font: defaultFont(), textAlign: 'center', verticalAlign: 'middle' } as ReportComponent;
    case 'datetime':
      return { id, type: 'datetime', x, y, width: 50, height: 15, format: 'yyyy-MM-dd', font: defaultFont(), textAlign: 'left', verticalAlign: 'middle' } as ReportComponent;
    default:
      return createDefaultComponent('text', x, y);
  }
}

export function createFieldExpressionComponent(
  field: { dataSourceId: string; fieldName: string; fieldType: string },
  xMm: number,
  yMm: number,
): ReportComponent {
  if (field.fieldType === 'boolean') {
    return {
      ...createDefaultComponent('checkbox', xMm, yMm),
      checked: formatDataFieldExpression(field.dataSourceId, field.fieldName),
    } as ReportComponent;
  }

  const component = createDefaultComponent('text', xMm, yMm) as any;
  component.text = formatDataFieldExpression(field.dataSourceId, field.fieldName);
  if (field.fieldType === 'number') {
    component.textAlign = 'right';
    component.format = { type: 'number', decimalDigits: 2, useGroupSeparator: true };
  } else if (field.fieldType === 'date') {
    component.format = { type: 'date', dateFormat: 'yyyy-MM-dd' };
  }
  return component;
}

export function createTextExpressionComponent(expression: string, xMm: number, yMm: number): ReportComponent {
  const component = createDefaultComponent('text', xMm, yMm) as any;
  component.text = expression;
  return component;
}
