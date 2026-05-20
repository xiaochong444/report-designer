import { describe, expect, it } from 'vitest';
import { renderReport } from '../src';
import { band, makeTemplate } from './phase-2-helpers';
import type { BorderConfig, ReportComponent } from '../src';

const border: BorderConfig = {
  style: 'solid',
  width: 0.3,
  color: '#2563eb',
  sides: { top: true, right: true, bottom: false, left: true },
};

const font = {
  family: 'Arial',
  size: 10,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  color: '#111827',
};

describe('Phase 28 component style rendering contract', () => {
  it('carries text padding into the render document style contract', () => {
    const template = makeTemplate([
      band('data', 'data', {
        dataBand: { dataSourceId: 'employees' },
        components: [{
          id: 'text-1',
          type: 'text',
          x: 0,
          y: 0,
          width: 60,
          height: 8,
          text: 'Padded',
          font,
          textAlign: 'left',
          verticalAlign: 'middle',
          border,
          backgroundColor: '#f8fafc',
          padding: { top: 1, right: 2, bottom: 3, left: 4 },
          canGrow: false,
          canShrink: false,
        }],
      }),
    ]);

    const component = renderReport(template, { employees: [{}] }).pages[0].items[0].components[0];

    expect(component.style).toMatchObject({
      backgroundColor: '#f8fafc',
      border,
      padding: { top: 1, right: 2, bottom: 3, left: 4 },
    });
  });

  it('carries common non-text background and border properties into the render document', () => {
    const styledBase = {
      x: 0,
      y: 0,
      width: 30,
      height: 10,
      backgroundColor: '#eff6ff',
      border,
    };
    const components: ReportComponent[] = [
      { ...styledBase, id: 'image-1', type: 'image', src: 'https://example.com/logo.png', fitMode: 'contain' } as ReportComponent,
      { ...styledBase, id: 'rich-1', type: 'richtext', html: '<p>Rich</p>' } as ReportComponent,
      { ...styledBase, id: 'barcode-1', type: 'barcode', value: 'ORD-1', format: 'CODE128', showText: true } as ReportComponent,
      { ...styledBase, id: 'check-1', type: 'checkbox', checked: 'true', label: 'Approved' } as ReportComponent,
    ];
    const template = makeTemplate([
      band('data', 'data', {
        dataBand: { dataSourceId: 'employees' },
        components,
      }),
    ]);

    const rendered = renderReport(template, { employees: [{}] }).pages[0].items[0].components;

    expect(rendered).toHaveLength(4);
    for (const component of rendered) {
      expect(component.style).toMatchObject({
        backgroundColor: '#eff6ff',
        border,
      });
    }
  });

  it('uses page number and date time vertical alignment from the template', () => {
    const template = makeTemplate([
      band('pageFooter', 'pageFooter', {
        components: [
          {
            id: 'page-number-1',
            type: 'pagenumber',
            x: 0,
            y: 0,
            width: 30,
            height: 8,
            format: '1/N',
            font,
            textAlign: 'center',
            verticalAlign: 'bottom',
          } as ReportComponent,
          {
            id: 'date-time-1',
            type: 'datetime',
            x: 40,
            y: 0,
            width: 40,
            height: 8,
            format: 'yyyy-MM-dd',
            font,
            textAlign: 'left',
            verticalAlign: 'top',
          } as ReportComponent,
        ],
      }),
    ]);

    const rendered = renderReport(template, {}).pages[0].items[0].components;

    expect(rendered[0].style?.verticalAlign).toBe('bottom');
    expect(rendered[1].style?.verticalAlign).toBe('top');
  });
});
