import { describe, expect, it } from 'vitest';
import { createDefaultTemplate, renderReport } from '../src/index';

describe('phase 21 rich text and image rendering', () => {
  it('resolves rich text html and image source from JSON data in the render document', () => {
    const template = createDefaultTemplate('Rich Text Image Report');
    template.pages[0].bands = [
      {
        id: 'dataBand1',
        type: 'data',
        name: 'data',
        y: 0,
        height: 40,
        dataBand: { dataSourceId: 'employees' },
        components: [
          {
            id: 'rich1',
            type: 'richtext',
            name: 'rich1',
            x: 0,
            y: 0,
            width: 180,
            height: 24,
            html: '<strong>{employees.Name}</strong>',
          },
          {
            id: 'image1',
            type: 'image',
            name: 'image1',
            x: 190,
            y: 0,
            width: 40,
            height: 24,
            src: '{employees.Photo}',
            fitMode: 'contain',
          },
        ],
      },
    ];

    const document = renderReport(template, {
      employees: [{ Name: 'Alice', Photo: 'data:image/png;base64,ZmFrZQ==' }],
    });

    const band = document.pages[0].items[0];
    expect(band.components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'rich1',
          type: 'richtext',
          html: '<strong>Alice</strong>',
        }),
        expect.objectContaining({
          id: 'image1',
          type: 'image',
          src: 'data:image/png;base64,ZmFrZQ==',
        }),
      ]),
    );
  });

  it('resolves common non-text components into the render document', () => {
    const template = createDefaultTemplate('Common Component Report');
    template.pages[0].bands = [
      {
        id: 'dataBand1',
        type: 'data',
        name: 'data',
        y: 0,
        height: 60,
        dataBand: { dataSourceId: 'orders' },
        components: [
          { id: 'barcode1', type: 'barcode', name: 'barcode1', x: 0, y: 0, width: 40, height: 12, value: '{orders.Code}', format: 'CODE128', showText: true },
          { id: 'check1', type: 'checkbox', name: 'check1', x: 0, y: 14, width: 40, height: 8, checked: '{orders.Paid}', label: '{orders.Label}' },
          { id: 'line1', type: 'line', name: 'line1', x: 0, y: 24, width: 40, height: 5, startX: 0, startY: 0, endX: 40, endY: 5, lineColor: '#ff0000', lineWidth: 0.3, lineStyle: 'dashed' },
          { id: 'shape1', type: 'shape', name: 'shape1', x: 0, y: 32, width: 20, height: 12, shapeType: 'roundRect', fillColor: '#eeeeee', borderColor: '#333333', borderWidth: 0.4, borderStyle: 'solid' },
          { id: 'page1', type: 'pagenumber', name: 'page1', x: 50, y: 0, width: 20, height: 8, format: '1/N', font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' }, textAlign: 'center' },
          { id: 'date1', type: 'datetime', name: 'date1', x: 50, y: 10, width: 30, height: 8, format: 'yyyy-MM-dd', font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' }, textAlign: 'left' },
        ],
      },
    ];

    const document = renderReport(template, {
      orders: [{ Code: 'ORD-1001', Paid: true, Label: 'Paid' }],
    });

    const components = document.pages[0].items[0].components;
    expect(components).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'barcode1', type: 'barcode', value: 'ORD-1001', format: 'CODE128', showText: true }),
      expect.objectContaining({ id: 'check1', type: 'checkbox', checked: true, label: 'Paid' }),
      expect.objectContaining({ id: 'line1', type: 'line', startX: 0, startY: 0, endX: 40, endY: 5, lineColor: '#ff0000', lineWidth: 0.3, lineStyle: 'dashed' }),
      expect.objectContaining({ id: 'shape1', type: 'shape', shapeType: 'roundRect' }),
      expect.objectContaining({ id: 'page1', type: 'text', content: '1/1' }),
    ]));
    const date = components.find(component => component.id === 'date1');
    expect(date).toEqual(expect.objectContaining({ type: 'text' }));
    expect((date as any).content).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
