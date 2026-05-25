/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import type { RenderDocument, RenderText } from '@report-designer/core';
import { RenderDocumentView } from '../renderers/dom/RenderDocumentView';
import { buildPrintHtml } from '../print/print-frame';
import { MM_TO_PX } from '../renderers/dom/renderComponent';
import { makeRenderDocument } from './phase-4-helpers';

function makeStyledTextDocument(): RenderDocument {
  const document = makeRenderDocument();
  const component = document.pages[0].items[0].components[0] as RenderText & {
    textAlign?: 'left' | 'center' | 'right';
    font?: { family?: string };
    styleBindings?: string[];
  };

  component.content = 'Parity Text';
  component.style = {
    ...component.style,
    font: {
      family: 'Fira Sans',
      size: 12,
      bold: true,
      italic: true,
      underline: true,
      strikethrough: true,
      color: '#112233',
    },
    backgroundColor: '#ffeecc',
    textAlign: 'right',
    verticalAlign: 'bottom',
    border: {
      style: 'dashed',
      width: 0.4,
      color: '#445566',
      sides: { top: true, right: false, bottom: true, left: true },
    },
    padding: { top: 1, right: 2, bottom: 3, left: 4 },
  } as RenderText['style'] & {
    padding: { top: number; right: number; bottom: number; left: number };
  };

  component.textAlign = 'center';
  component.font = { family: 'Previous Style' };
  component.styleBindings = ['textAlign', 'font.family'];

  return document;
}

describe('Phase 17 text style parity', () => {
  it('renders preview text alignment from the final synced component style payload', () => {
    render(<RenderDocumentView document={makeStyledTextDocument()} zoom={100} />);

    const textBox = screen.getByTestId('render-component-text');
    const content = screen.getByTestId('render-component-text-content');

    expect(textBox).toHaveStyle({ alignItems: 'flex-end' });
    expect(content).toHaveStyle({ textAlign: 'right' });
  });

  it('prefers released explicit final component values over stale style-controlled fields in preview', () => {
    render(<RenderDocumentView document={makeStyledTextDocument()} zoom={100} />);

    const textBox = screen.getByTestId('render-component-text');
    const content = screen.getByTestId('render-component-text-content');

    expect(textBox).toHaveStyle({
      fontFamily: 'Fira Sans',
      fontWeight: '700',
      fontStyle: 'italic',
      textDecoration: 'underline line-through',
      color: 'rgb(17, 34, 51)',
    });
    expect(content).toHaveStyle({ textAlign: 'right' });
    expect(Number.parseFloat(textBox.style.paddingTop)).toBeCloseTo(MM_TO_PX, 3);
    expect(Number.parseFloat(textBox.style.paddingRight)).toBeCloseTo(2 * MM_TO_PX, 3);
    expect(Number.parseFloat(textBox.style.paddingBottom)).toBeCloseTo(3 * MM_TO_PX, 3);
    expect(Number.parseFloat(textBox.style.paddingLeft)).toBeCloseTo(4 * MM_TO_PX, 3);
  });

  it('emits print HTML with the same final font, alignment, background, border, and padding values as preview', () => {
    const html = buildPrintHtml(makeStyledTextDocument());

    expect(html).toContain('background-color:#ffeecc');
    expect(html).toContain('border-top:0.4mm dashed #445566');
    expect(html).toContain('border-bottom:0.4mm dashed #445566');
    expect(html).toContain('border-left:0.4mm dashed #445566');
    expect(html).not.toContain('border-right:0.4mm dashed #445566');
    expect(html).toContain('font-family:Fira Sans');
    expect(html).toContain('font-size:15.996px');
    expect(html).toContain('font-weight:700');
    expect(html).toContain('font-style:italic');
    expect(html).toContain('text-decoration:underline line-through');
    expect(html).toContain('color:#112233');
    expect(html).toContain('align-items:flex-end');
    expect(html).toContain('text-align:right');
    expect(html).toContain('padding:1mm 2mm 3mm 4mm');
  });
});
