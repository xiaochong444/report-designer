import { describe, expect, it } from 'vitest';
import { renderReport } from '@report-designer/core';
import { sampleReports } from '../templates';
import {
  clothingOrderDynamicSizeData,
  clothingOrderDynamicSizeTemplate,
} from '../templates/clothing-order-dynamic-size';

function allTemplateComponents() {
  return clothingOrderDynamicSizeTemplate.pages.flatMap(page => page.bands.flatMap(band => band.components));
}

function renderedText(document: any): string[] {
  return document.pages
    .flatMap((page: any) => page.items)
    .flatMap((item: any) => item.components)
    .flatMap((component: any) => {
      if (component.type === 'table') {
        return component.rows.flatMap((row: any[]) => row.map(cell => cell.content));
      }
      return [component.content];
    })
    .filter((value: unknown): value is string => value !== undefined && value !== null)
    .map(value => String(value));
}

describe('phase 45 clothing order dynamic size example', () => {
  it('declares named header and detail tables for event scripts', () => {
    const tables = allTemplateComponents().filter(component => component.type === 'table');

    expect(tables.map(table => table.name)).toEqual(expect.arrayContaining([
      'OrderSizeHeaderTable',
      'OrderSizeDetailTable',
    ]));
  });

  it('uses beforeData to look up the dynamic size tables by name', () => {
    const script = clothingOrderDynamicSizeTemplate.events?.beforeData?.script ?? '';

    expect(script).toContain('ctx.table?.("OrderSizeHeaderTable")');
    expect(script).toContain('ctx.table?.("OrderSizeDetailTable")');
  });

  it('bundles sizeGroups metadata and S1 quantity data', () => {
    expect(clothingOrderDynamicSizeData.clothingOrder.sizeGroups[0]?.sizes[0]).toMatchObject({
      field: 'S1',
      name: 'S',
    });
    expect(clothingOrderDynamicSizeData.clothingOrder.items[0]).toHaveProperty('S1');
    expect(JSON.stringify(clothingOrderDynamicSizeTemplate.dataSources)).toContain('sizeGroups');
  });

  it('registers the bundled sample report', () => {
    const sample = sampleReports.find(report => report.key === 'clothingOrderDynamicSize');

    expect(sample?.label).toBe('服装订单动态尺码打印');
    expect(sample?.template).toBe(clothingOrderDynamicSizeTemplate);
    expect(sample?.data).toBe(clothingOrderDynamicSizeData);
  });

  it('renders sample order values and dynamic size quantities', () => {
    const document = renderReport(clothingOrderDynamicSizeTemplate, clothingOrderDynamicSizeData as any);
    const content = renderedText(document);

    expect(content).toEqual(expect.arrayContaining([
      'CO-202606-018',
      '杭州织造商贸有限公司',
      '2026 夏',
      '80',
      '90',
      '特种绣花针织裤',
      '1095',
    ]));
  });
});
