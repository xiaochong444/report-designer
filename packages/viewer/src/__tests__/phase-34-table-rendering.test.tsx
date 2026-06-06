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
    pages: [{
      id: 'page-1',
      pageNumber: 1,
      totalPages: 1,
      width: 100,
      height: 80,
      items: [{
        id: 'band-1',
        bandId: 'band-1',
        bandType: 'data',
        x: 5,
        y: 5,
        width: 90,
        height: 30,
        components: [{
          id: 'table-1',
          type: 'table',
          x: 8,
          y: 8,
          width: 60,
          height: 18,
          showBorder: true,
          columns: [{ id: 'amount', header: 'Amount', field: 'amount', width: 60, cellType: 'text' }],
          rows: [[{
            row: 0,
            column: 0,
            content: '$1,234.50',
            rowSpan: 1,
            colSpan: 1,
            height: 8,
            style: {
              backgroundColor: '#fffbe6',
              padding: { top: 1, right: 2, bottom: 1, left: 2 },
              textAlign: 'right',
              verticalAlign: 'middle',
              font: {
                family: 'Arial',
                size: 11,
                bold: true,
                italic: true,
                underline: true,
                strikethrough: true,
                color: '#1677ff',
              },
              border: { style: 'solid', width: 0.2, color: '#1677ff', sides: { top: true, right: true, bottom: true, left: true } },
            },
          }]],
        }],
      }],
    }],
  };
}

describe('phase 34 table rendering viewer', () => {
  it('renders table cell style in DOM preview', () => {
    render(<RenderDocumentView document={makeDocument()} zoom={100} />);

    const cell = screen.getByText('$1,234.50');
    expect(cell).toHaveStyle({
      backgroundColor: '#fffbe6',
      textAlign: 'right',
      borderTopColor: '#1677ff',
      fontFamily: 'Arial',
      fontSize: '14.663px',
      fontWeight: '700',
      fontStyle: 'italic',
      textDecoration: 'underline line-through',
      color: '#1677ff',
    });
  });

  it('emits table cell style in print HTML', () => {
    const html = buildPrintHtml(makeDocument());

    expect(html).toContain('background-color:#fffbe6');
    expect(html).toContain('padding:1mm 2mm 1mm 2mm');
    expect(html).toContain('text-align:right');
    expect(html).toContain('border-top:0.3mm solid #1677ff');
    expect(html).toContain('font-family:Arial');
    expect(html).toContain('font-size:14.663px');
    expect(html).toContain('font-weight:700');
    expect(html).toContain('font-style:italic');
    expect(html).toContain('text-decoration:underline line-through');
    expect(html).toContain('color:#1677ff');
  });

  it('does not draw a separate table container border when cell borders are present', () => {
    render(<RenderDocumentView document={makeDocument()} zoom={100} />);

    const table = screen.getByTestId('render-component-table');

    expect(table).not.toHaveStyle({ borderTopColor: '#8c8c8c' });
    expect(table).toHaveStyle({ backgroundColor: '#ffffff' });
    expect(screen.getByText('$1,234.50')).toHaveStyle({
      borderTopColor: '#1677ff',
      borderRightColor: '#1677ff',
      borderBottomColor: '#1677ff',
      borderLeftColor: '#1677ff',
    });
  });

  it('does not emit fallback showBorder table lines in print HTML', () => {
    const html = buildPrintHtml(makeDocument());

    expect(html).not.toContain('border:0.2mm solid #8c8c8c');
    expect(html).not.toContain('border:0.2mm dashed #d9d9d9');
    expect(html).toContain('border-top:0.3mm solid #1677ff');
    expect(html).toContain('border-right:0.3mm solid #1677ff');
    expect(html).not.toContain('rd-print-table-border-line');
  });
});
