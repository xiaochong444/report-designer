import { describe, expect, it } from 'vitest';
import { expandJsonDataBySources, mergeInferredDataSources, renderReport } from '@report-designer/core';
import { performanceContractData, performanceContractTemplate } from '../templates/performance-contract';

function renderedContent(document: ReturnType<typeof renderReport>): string[] {
  return document.pages
    .flatMap(page => page.items)
    .flatMap(item => item.components)
    .flatMap(component => {
      if (component.type === 'table') {
        return component.rows.flatMap(row => row.map(cell => cell.content));
      }
      return 'content' in component ? [component.content] : [];
    })
    .filter((value): value is string => value !== undefined && value !== null && value !== '');
}

describe('performance contract example', () => {
  it('renders Feng.Admin performance contract print data in the viewer path', () => {
    const document = renderReport(performanceContractTemplate, performanceContractData);
    const content = renderedContent(document);

    expect(content).toEqual(expect.arrayContaining([
      '绩效合约',
      'PC20260001',
      '信息部',
      '信息主管',
      '张三',
      '总部',
      '销售额',
      '达成度',
      '合计',
      '2项',
    ]));
  });

  it('keeps direct viewer data and designer-expanded data output in sync', () => {
    const direct = renderedContent(renderReport(performanceContractTemplate, performanceContractData));
    const runtimeTemplate = mergeInferredDataSources(performanceContractTemplate, performanceContractData);
    const designerData = expandJsonDataBySources(performanceContractData, runtimeTemplate.dataSources);
    const fromDesignerShape = renderedContent(renderReport(runtimeTemplate, designerData));

    expect(fromDesignerShape).toEqual(direct);
  });
});
