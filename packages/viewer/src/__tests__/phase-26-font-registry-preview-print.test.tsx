/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import type { RenderDocument } from '@report-designer/core';
import { RenderDocumentView } from '../renderers/dom/RenderDocumentView';
import { buildPrintHtml } from '../print/print-frame';

function fontDocument(): RenderDocument {
  return {
    fonts: [
      {
        id: 'brand-song',
        name: 'Brand Song',
        family: 'BrandSong',
        fallback: 'serif',
        source: { url: '/fonts/brand-song.woff2', format: 'woff2' },
      },
    ],
    pages: [
      {
        id: 'page-1',
        pageNumber: 1,
        totalPages: 1,
        width: 210,
        height: 297,
        items: [
          {
            id: 'band-1',
            bandId: 'data-1',
            bandType: 'data',
            x: 20,
            y: 20,
            width: 170,
            height: 20,
            components: [
              {
                id: 'text-1',
                type: 'text',
                x: 20,
                y: 20,
                width: 80,
                height: 10,
                content: '字体预览',
                style: {
                  font: { family: 'BrandSong', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#111111' },
                  textAlign: 'left',
                  verticalAlign: 'top',
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

describe('phase 26 font registry preview and print parity', () => {
  it('injects report font-face CSS into the preview renderer', () => {
    const { container } = render(<RenderDocumentView document={fontDocument()} zoom={100} />);

    const style = container.querySelector('style[data-report-font-registry]');
    expect(style?.textContent).toContain('@font-face');
    expect(style?.textContent).toContain("font-family: 'BrandSong'");
    expect(style?.textContent).toContain("/fonts/brand-song.woff2");
    expect(screen.getByTestId('render-component-text')).toHaveStyle({ fontFamily: 'BrandSong' });
  });

  it('injects the same report font-face CSS into print html', () => {
    const html = buildPrintHtml(fontDocument());

    expect(html).toContain('@font-face');
    expect(html).toContain("font-family: 'BrandSong'");
    expect(html).toContain("/fonts/brand-song.woff2");
    expect(html).toContain('font-family:BrandSong');
  });
});
