import { renderReport } from '../src/pagination/paginate';
import { createDefaultTemplate } from '../src/template-model/template';
import type { BarcodeComponent, CheckboxComponent, ImageComponent } from '../src/template-model/types';

const border = {
  style: 'dashed' as const,
  width: 0.4,
  color: '#445566',
  sides: { top: true, right: true, bottom: false, left: true },
};

const barcodeFont = {
  family: 'Consolas',
  size: 9,
  bold: true,
  italic: false,
  underline: false,
  strikethrough: false,
  color: '#123456',
};

const checkboxFont = {
  family: 'Arial',
  size: 11,
  bold: true,
  italic: false,
  underline: false,
  strikethrough: false,
  color: '#654321',
};

describe('phase 33 component properties', () => {
  it('carries image, barcode, and checkbox appearance properties into render document', () => {
    const template = createDefaultTemplate('Component Properties');
    const dataBand = template.pages[0].bands.find(band => band.type === 'data');
    if (!dataBand) throw new Error('Missing data band');
    dataBand.dataBand = { dataSourceId: 'orders' };
    dataBand.components = [
      {
        id: 'image-1',
        type: 'image',
        name: 'Image1',
        x: 0,
        y: 0,
        width: 20,
        height: 20,
        src: '',
        fitMode: 'cover',
        backgroundColor: '#fffbe6',
        border,
      } as ImageComponent,
      {
        id: 'barcode-1',
        type: 'barcode',
        name: 'Barcode1',
        x: 25,
        y: 0,
        width: 30,
        height: 12,
        value: 'A-100',
        format: 'CODE128',
        showText: true,
        foregroundColor: '#0088cc',
        font: barcodeFont,
        backgroundColor: '#f6ffed',
        border,
      } as BarcodeComponent,
      {
        id: 'checkbox-1',
        type: 'checkbox',
        name: 'Checkbox1',
        x: 60,
        y: 0,
        width: 30,
        height: 8,
        checked: 'true',
        label: 'Paid',
        foregroundColor: '#cc5500',
        font: checkboxFont,
        backgroundColor: '#e6f4ff',
        padding: { top: 1, right: 2, bottom: 1, left: 2 },
        border,
      } as CheckboxComponent,
    ];

    const document = renderReport(template, { orders: [{ id: 1 }] });
    const components = document.pages[0].items.flatMap(item => item.components);

    expect(components.find(component => component.id === 'image-1')?.style).toMatchObject({
      backgroundColor: '#fffbe6',
      border,
    });
    expect(components.find(component => component.id === 'barcode-1')?.style).toMatchObject({
      backgroundColor: '#f6ffed',
      border,
    });
    expect(components.find(component => component.id === 'barcode-1')).toMatchObject({
      foregroundColor: '#0088cc',
      font: barcodeFont,
    });
    expect(components.find(component => component.id === 'checkbox-1')?.style).toMatchObject({
      backgroundColor: '#e6f4ff',
      padding: { top: 1, right: 2, bottom: 1, left: 2 },
      border,
    });
    expect(components.find(component => component.id === 'checkbox-1')).toMatchObject({
      foregroundColor: '#cc5500',
      font: checkboxFont,
    });
  });
});
