import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { expandJsonDataBySources, mergeInferredDataSources } from '../src/data-dictionary';
import { renderReport } from '../src/pagination/paginate';
import type { ReportTemplate, TextComponent } from '../src/template-model/types';

const baseText: Omit<TextComponent, 'id' | 'name' | 'x' | 'y' | 'width' | 'height' | 'text'> = {
  type: 'text',
  font: { family: 'Microsoft YaHei', size: 9, bold: false, italic: false, underline: false, strikethrough: false, color: '#111827' },
  textAlign: 'left',
  verticalAlign: 'middle',
  border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
  canGrow: false,
  canShrink: false,
};

function text(id: string, y: number, value: string): TextComponent {
  return {
    ...baseText,
    id,
    name: id,
    x: 0,
    y,
    width: 80,
    height: 6,
    text: value,
  };
}

function template(): ReportTemplate {
  return {
    id: 'performance-contract-print',
    name: '绩效合约打印',
    version: '2.0',
    pages: [{
      id: 'page-1',
      name: '页面 1',
      width: 210,
      height: 297,
      margins: { top: 8, right: 10, bottom: 8, left: 10 },
      orientation: 'portrait',
      bands: [{
        id: 'title',
        type: 'reportTitle',
        height: 32,
        components: [
          text('department', 0, '{DepartmentName}'),
          text('position', 8, '{PositionName}'),
          text('employee', 16, '{EmployeeName}'),
        ],
      }],
    }],
    dataSources: [],
    styles: [],
    conditionalFormats: [],
    parameters: [],
  };
}

const printData = {
  Code: 'PC20260001',
  DepartmentName: '信息部',
  PositionName: '信息主管',
  EmployeeName: '张三',
  Items: [
    { Id: 'item-1', IndicatorName: '销售额', Weight: 0.5 },
  ],
};

function textContents(report: ReturnType<typeof renderReport>): string[] {
  return report.pages.flatMap(page => page.items.flatMap(item => item.components))
    .filter((component): component is Extract<typeof component, { type: 'text' }> => component.type === 'text')
    .map(component => component.content);
}

describe('performance contract preview parity', () => {
  it('resolves PascalCase root fields from raw WebAPI print data', () => {
    expect(textContents(renderReport(template(), printData))).toEqual(['信息部', '信息主管', '张三']);
  });

  it('resolves the same fields from the designer-expanded data shape', () => {
    const runtimeTemplate = mergeInferredDataSources(template(), printData);
    const designerExpandedData = expandJsonDataBySources(printData, runtimeTemplate.dataSources);

    expect(textContents(renderReport(runtimeTemplate, designerExpandedData))).toEqual(['信息部', '信息主管', '张三']);
  });

  it('renders the real performance contract template consistently when provided through JSON', () => {
    const templatePath = process.env.PERFORMANCE_CONTRACT_TEMPLATE_JSON;
    if (!templatePath) {
      return;
    }

    const realTemplate = JSON.parse(readFileSync(templatePath, 'utf8')) as ReportTemplate;
    const runtimeTemplate = mergeInferredDataSources(realTemplate, printData);
    const designerExpandedData = expandJsonDataBySources(printData, runtimeTemplate.dataSources);
    const directContents = textContents(renderReport(realTemplate, printData));
    const designerContents = textContents(renderReport(runtimeTemplate, designerExpandedData));

    expect(directContents).toContain('信息主管');
    expect(directContents).toContain('张三');
    expect(designerContents).toContain('信息主管');
    expect(designerContents).toContain('张三');
    expect(directContents).toEqual(designerContents);
  });
});
