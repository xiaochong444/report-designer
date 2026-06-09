import { describe, expect, it } from 'vitest';
import { expandJsonDataBySources, inferJsonDictionary, renderReport } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

const textBase = {
  font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
  textAlign: 'left' as const,
  verticalAlign: 'top' as const,
  border: { style: 'none' as const, width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
  canGrow: false,
  canShrink: false,
};

describe('phase 46 automatic data sources', () => {
  it('infers master and detail data sources for a single JSON object', () => {
    const data = {
      orderNo: 'SO-202606-001',
      customer: { name: '华东客户' },
      items: [{ product: { name: '云服务年包' }, salesAmount: 1000 }],
    };

    const dataSources = inferJsonDictionary(data).dataSources;
    const expanded = expandJsonDataBySources(data, dataSources);

    expect(dataSources.map(source => source.id)).toEqual(['root', 'items']);
    expect(dataSources.find(source => source.id === 'root')?.fields?.map(field => field.name)).toEqual(
      expect.arrayContaining(['orderNo', 'customer.name']),
    );
    expect(dataSources.find(source => source.id === 'items')?.fields?.map(field => field.name)).toEqual(
      expect.arrayContaining(['product.name', 'salesAmount']),
    );
    expect(expanded.root[0]).toMatchObject({
      orderNo: 'SO-202606-001',
      'customer.name': '华东客户',
    });
    expect(expanded.items[0]).toMatchObject({
      'product.name': '云服务年包',
      salesAmount: 1000,
    });
  });

  it('infers JSON data sources and resolves current-row field expressions', () => {
    const template = makeTemplate([
      band('order', 'data', {
        dataBand: { dataSourceId: 'root' },
        components: [{
          id: 'customer',
          type: 'text',
          x: 0,
          y: 0,
          width: 80,
          height: 8,
          text: '{customer.name}',
          ...textBase,
        }],
      }),
      band('detail', 'data', {
        dataBand: { dataSourceId: 'items' },
        components: [{
          id: 'product',
          type: 'text',
          x: 0,
          y: 0,
          width: 80,
          height: 8,
          text: '{items.product.name}',
          ...textBase,
        }],
      }),
      band('detail-footer', 'footer', {
        components: [{
          id: 'total',
          type: 'text',
          x: 0,
          y: 0,
          width: 80,
          height: 8,
          text: 'SUM({items.salesAmount})',
          ...textBase,
        }],
      }),
    ]);
    template.dataSources = [];

    const document = renderReport(template, {
      orderNo: 'SO-202606-001',
      customer: { name: '华东客户' },
      items: [
        { product: { name: '云服务年包' }, salesAmount: 1000 },
        { product: { name: '实施服务' }, salesAmount: 500 },
      ],
    } as any);

    const content = document.pages.flatMap(page => page.items).flatMap(item => item.components).map(component => (component as any).content);
    expect(content).toEqual(expect.arrayContaining(['华东客户', '云服务年包', '实施服务', '1500']));
  });

  it('resolves root object fields from static report title bands', () => {
    const template = makeTemplate([
      band('title', 'reportTitle', {
        components: [
          {
            id: 'orderNo',
            type: 'text',
            x: 0,
            y: 0,
            width: 80,
            height: 8,
            text: '{orderNo}',
            ...textBase,
          },
          {
            id: 'customer',
            type: 'text',
            x: 0,
            y: 8,
            width: 80,
            height: 8,
            text: '{customer.name}',
            ...textBase,
          },
        ],
      }),
    ]);
    template.dataSources = [];

    const document = renderReport(template, {
      orderNo: 'SO-202606-001',
      customer: { name: '华东客户' },
      items: [{ product: { name: '云服务年包' }, salesAmount: 1000 }],
    } as any);

    const content = document.pages.flatMap(page => page.items).flatMap(item => item.components).map(component => (component as any).content);
    expect(content).toEqual(expect.arrayContaining(['SO-202606-001', '华东客户']));
  });
});
