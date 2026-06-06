/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { Designer } from '../components/Designer';
import { ExpressionEditor } from '../components/ExpressionEditor';
import { DesignerI18nProvider } from '../i18n';
import { useDesignerStore } from '../store/designer-store';

vi.mock('@monaco-editor/react', () => ({
  default: () => <textarea aria-label="表达式" />,
}));

const viewerSpy = vi.fn();

vi.mock('@report-designer/viewer', () => ({
  Viewer: (props: Record<string, unknown>) => {
    viewerSpy(props);
    return <div data-testid="mock-viewer" />;
  },
}));

describe('phase 46 automatic designer data sources', () => {
  it('loads inferred JSON data sources from the data prop when the template does not define them', async () => {
    const template = createDefaultTemplate('Auto Data Sources');
    template.dataSources = [];

    render(
      <Designer
        template={template}
        data={{
          orderNo: 'SO-202606-001',
          customer: { name: '华东客户', phone: '13812345678' },
          items: [
            { product: { code: 'P-100', name: '云服务年包' }, salesAmount: 1000 },
          ],
        } as any}
      />,
    );

    await waitFor(() => {
      const sources = useDesignerStore.getState().template.dataSources;
      expect(sources.map(source => source.id)).toEqual(expect.arrayContaining(['root', 'items']));
      expect(sources.find(source => source.id === 'root')?.fields?.map(field => field.name)).toEqual(
        expect.arrayContaining(['orderNo', 'customer.name', 'customer.phone']),
      );
      expect(sources.find(source => source.id === 'items')?.fields?.map(field => field.name)).toEqual(
        expect.arrayContaining(['product.code', 'product.name', 'salesAmount']),
      );
    });
  });

  it('passes custom expression functions into the designer preview viewer', async () => {
    const template = createDefaultTemplate('Designer Preview Functions');
    template.dataSources = [];
    useDesignerStore.getState().setMode('preview');

    render(
      <Designer
        template={template}
        data={{
          items: [
            { salesPrice: 5000, qty: 2, salesDiscount: 0.9 },
          ],
        } as any}
        expressionExtensions={{
          functions: [{
            name: 'DISCOUNT',
            category: 'number',
            signature: 'DISCOUNT(price, rate)',
            detail: 'DISCOUNT(price, rate)',
            insertText: 'DISCOUNT(${1:price}, ${2:rate})',
            description: {
              'zh-CN': '按折扣率计算折后金额。',
              'en-US': 'Calculates a discounted amount by rate.',
            },
            examples: ['DISCOUNT({items.salesAmount}, 0.9)'],
            evaluate: ([price, rate]) => Number(price) * Number(rate),
          }],
        }}
      />,
    );

    await waitFor(() => {
      expect(viewerSpy).toHaveBeenCalledWith(expect.objectContaining({
        expressionFunctions: expect.objectContaining({
          DISCOUNT: expect.any(Function),
        }),
      }));
    });
  });

  it('inserts fully qualified nested item fields from the expression editor tree', async () => {
    const template = createDefaultTemplate('Nested Expression Tree');
    template.dataSources = [{
      id: 'items',
      name: 'items',
      type: 'json',
      fields: [
        { name: 'product.name', type: 'string' },
        { name: 'qty', type: 'number' },
      ],
    }] as any;
    useDesignerStore.getState().loadTemplate(template);
    let value = '';

    render(
      <DesignerI18nProvider locale="en-US">
        <ExpressionEditor
          open
          value=""
          onChange={(next) => { value = next; }}
          onClose={() => undefined}
        />
      </DesignerI18nProvider>,
    );

    fireEvent.click(await screen.findByText('product'));
    fireEvent.click(await screen.findByText('name'));
    fireEvent.click(screen.getByText('OK'));

    expect(value).toBe('{items.product.name}');
  });
});
