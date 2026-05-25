/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import type { RenderDocument } from '@report-designer/core';
import { buildPrintHtml } from '../print/print-frame';
import { RenderDocumentView } from '../renderers/dom/RenderDocumentView';

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

const largeCheckboxFont = {
  family: 'Georgia',
  size: 28,
  bold: true,
  italic: true,
  underline: true,
  strikethrough: false,
  color: '#224466',
};

function expectInlineFontSize(element: HTMLElement, expected: number): void {
  expect(parseFloat(element.style.fontSize)).toBeCloseTo(expected, 3);
}

function makeDocument(): RenderDocument {
  return {
    pages: [
      {
        id: 'page-1',
        pageNumber: 1,
        totalPages: 1,
        width: 100,
        height: 80,
        items: [
          {
            id: 'band-1',
            bandId: 'band-1',
            bandType: 'data',
            x: 5,
            y: 5,
            width: 90,
            height: 40,
            components: [
              {
                id: 'image-1',
                type: 'image',
                x: 8,
                y: 8,
                width: 20,
                height: 20,
                src: 'data:image/png;base64,ZmFrZQ==',
                fitMode: 'cover',
                style: {
                  backgroundColor: '#fffbe6',
                  border: { style: 'dashed', width: 0.4, color: '#445566', sides: { top: true, right: true, bottom: false, left: true } },
                },
              },
              {
                id: 'barcode-1',
                type: 'barcode',
                x: 8,
                y: 32,
                width: 42,
                height: 12,
                value: 'A-100',
                format: 'CODE128',
                showText: true,
                foregroundColor: '#0088cc',
                font: barcodeFont,
              } as RenderDocument['pages'][number]['items'][number]['components'][number],
              {
                id: 'checkbox-1',
                type: 'checkbox',
                x: 32,
                y: 8,
                width: 30,
                height: 8,
                checked: true,
                label: 'Paid',
                foregroundColor: '#cc5500',
                font: checkboxFont,
                style: {
                  backgroundColor: '#e6f4ff',
                  padding: { top: 1, right: 2, bottom: 1, left: 2 },
                  border: { style: 'solid', width: 0.2, color: '#1677ff', sides: { top: true, right: true, bottom: true, left: true } },
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

describe('phase 33 component properties viewer', () => {
  it('renders image, barcode, and checkbox appearance in DOM preview', () => {
    render(<RenderDocumentView document={makeDocument()} zoom={100} />);

    expect(screen.getByTestId('render-component-image')).toHaveStyle({
      backgroundColor: '#fffbe6',
      objectFit: 'cover',
    });
    expect(screen.getByText('A-100')).toHaveStyle({
      color: '#123456',
      fontFamily: 'Consolas',
      fontWeight: '700',
    });
    expectInlineFontSize(screen.getByText('A-100'), 11.997);
    expect(screen.getByTestId('render-component-checkbox')).toHaveStyle({
      backgroundColor: '#e6f4ff',
    });
    expect(screen.getByText('Paid')).toHaveStyle({
      color: '#654321',
      fontFamily: 'Arial',
      fontWeight: '700',
    });
    expectInlineFontSize(screen.getByText('Paid'), 14.663);
    expect(screen.getByText('✓')).toHaveStyle({
      borderColor: '#cc5500',
      color: '#cc5500',
    });
  });

  it('keeps checkbox checkmark typography fixed when label uses custom font', () => {
    const document = makeDocument();
    const checkbox = document.pages[0].items[0].components.find(component => component.id === 'checkbox-1');
    if (!checkbox || checkbox.type !== 'checkbox') throw new Error('checkbox fixture missing');
    checkbox.font = largeCheckboxFont;
    checkbox.label = 'Large label';
    checkbox.foregroundColor = '#aa3300';

    render(<RenderDocumentView document={document} zoom={100} />);

    const label = screen.getByText('Large label');
    expect(label.tagName).toBe('SPAN');
    expect(label).toHaveStyle({
      color: '#224466',
      fontFamily: 'Georgia',
      fontWeight: '700',
      fontStyle: 'italic',
      textDecoration: 'underline',
    });
    expectInlineFontSize(label, 37.324);

    const checkmark = screen.getByText('✓');
    expect(checkmark).toHaveStyle({
      color: '#aa3300',
      fontFamily: 'Arial, sans-serif',
      fontWeight: '400',
      lineHeight: '1',
      textDecoration: 'none',
    });
    expectInlineFontSize(checkmark, 11.339);
  });

  it('emits print HTML with image, barcode, and checkbox appearance', () => {
    const html = buildPrintHtml(makeDocument());

    expect(html).toContain('background-color:#fffbe6');
    expect(html).toContain('object-fit:cover');
    expect(html).toContain('border-top:0.4mm dashed #445566');
    expect(html).toContain('background-color:#e6f4ff');
    expect(html).toContain('padding:1mm 2mm 1mm 2mm');
    expect(html).toContain('border-top:0.2mm solid #1677ff');
    expect(html).toContain('repeating-linear-gradient(90deg,#0088cc 0 1px,#fff 1px 3px)');
    expect(html).toContain('color:#123456');
    expect(html).toContain('font-family:Consolas');
    expect(html).toContain('font-size:11.997px');
    expect(html).toContain('border:0.2mm solid #cc5500');
    expect(html).toContain('font-family:Arial, sans-serif;font-size:3mm;font-weight:400;font-style:normal;line-height:1;text-decoration:none');
    expect(html).toContain('color:#654321');
    expect(html).toContain('font-family:Arial');
    expect(html).toContain('font-size:14.663px');
  });
});
