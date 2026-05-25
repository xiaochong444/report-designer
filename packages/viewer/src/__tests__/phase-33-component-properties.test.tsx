/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import type { RenderDocument } from '@report-designer/core';
import { buildPrintHtml } from '../print/print-frame';
import { RenderDocumentView } from '../renderers/dom/RenderDocumentView';

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
                id: 'checkbox-1',
                type: 'checkbox',
                x: 32,
                y: 8,
                width: 30,
                height: 8,
                checked: true,
                label: 'Paid',
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
  it('renders image and checkbox appearance in DOM preview', () => {
    render(<RenderDocumentView document={makeDocument()} zoom={100} />);

    expect(screen.getByTestId('render-component-image')).toHaveStyle({
      backgroundColor: '#fffbe6',
      objectFit: 'cover',
    });
    expect(screen.getByTestId('render-component-checkbox')).toHaveStyle({
      backgroundColor: '#e6f4ff',
    });
  });

  it('emits print HTML with image and checkbox appearance', () => {
    const html = buildPrintHtml(makeDocument());

    expect(html).toContain('background-color:#fffbe6');
    expect(html).toContain('object-fit:cover');
    expect(html).toContain('border-top:0.4mm dashed #445566');
    expect(html).toContain('background-color:#e6f4ff');
    expect(html).toContain('padding:1mm 2mm 1mm 2mm');
    expect(html).toContain('border-top:0.2mm solid #1677ff');
  });
});
