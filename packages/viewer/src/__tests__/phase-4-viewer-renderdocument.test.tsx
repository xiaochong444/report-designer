/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { Viewer } from '../components/Viewer';
import { RenderDocumentView } from '../renderers/dom/RenderDocumentView';
import { makeRenderDocument, makeViewerTemplate } from './phase-4-helpers';

describe('Phase 4 RenderDocument viewer', () => {
  it('renders RenderDocument pages through the viewer', () => {
    const { template, data } = makeViewerTemplate(4);

    render(<Viewer template={template} data={data} />);

    expect(screen.getAllByTestId('render-document-page')).toHaveLength(2);
    expect(screen.getAllByText('Employees')).toHaveLength(2);
    expect(screen.getByText('Employee 1')).toBeInTheDocument();
  });

  it('renders core component types in the DOM renderer', () => {
    render(<RenderDocumentView document={makeRenderDocument()} zoom={100} />);

    expect(screen.getByTestId('render-document-page')).toBeInTheDocument();
    expect(screen.getByText('Hello PDF')).toBeInTheDocument();
  });

  it('renders rich text html and image sources in the DOM renderer', () => {
    const document = makeRenderDocument();
    document.pages[0].items[0].components.push(
      {
        id: 'rich1',
        type: 'richtext',
        x: 80,
        y: 80,
        width: 160,
        height: 32,
        html: '<strong>Rich Text</strong>',
        style: {},
      },
      {
        id: 'image1',
        type: 'image',
        x: 250,
        y: 80,
        width: 48,
        height: 32,
        src: 'data:image/png;base64,ZmFrZQ==',
        style: {},
      },
    );

    render(<RenderDocumentView document={document} zoom={100} />);

    expect(screen.getByTestId('render-component-richtext')).toContainHTML('<strong>Rich Text</strong>');
    expect(screen.getByTestId('render-component-image')).toHaveAttribute('src', 'data:image/png;base64,ZmFrZQ==');
  });

  it('renders common non-text components in the DOM renderer', () => {
    const document = makeRenderDocument();
    document.pages[0].items[0].components.push(
      { id: 'barcode1', type: 'barcode', x: 80, y: 80, width: 80, height: 24, value: 'ORD-1001', format: 'CODE128', showText: true, style: {} },
      { id: 'check1', type: 'checkbox', x: 80, y: 110, width: 60, height: 10, checked: true, label: 'Paid', style: {} },
      { id: 'line1', type: 'line', x: 80, y: 130, width: 60, height: 10, startX: 0, startY: 0, endX: 60, endY: 10, lineColor: '#ff0000', lineWidth: 0.3, lineStyle: 'dotted', style: {} },
      { id: 'shape1', type: 'shape', x: 80, y: 150, width: 30, height: 20, shapeType: 'ellipse', fillColor: '#eeeeee', borderColor: '#333333', borderWidth: 0.4, borderStyle: 'solid', style: {} },
    );

    render(<RenderDocumentView document={document} zoom={100} />);

    expect(screen.getByTestId('render-component-barcode')).toBeInTheDocument();
    expect(screen.getByTestId('render-component-checkbox')).toHaveTextContent('Paid');
    expect(screen.getByTestId('render-component-line')).toBeInTheDocument();
    expect(screen.getByTestId('render-component-shape')).toBeInTheDocument();
  });

  it('applies text alignment to the inner text content instead of only the absolute box', () => {
    const document = makeRenderDocument();
    const textComponent = document.pages[0].items[0].components[0];
    if (textComponent.type === 'text') {
      textComponent.content = 'Centered Title';
      textComponent.width = 170;
      textComponent.style = {
        ...textComponent.style,
        textAlign: 'center',
      };
    }

    render(<RenderDocumentView document={document} zoom={100} />);

    const textBox = screen.getByTestId('render-component-text');
    const content = screen.getByTestId('render-component-text-content');
    expect(textBox).toHaveStyle({ display: 'flex' });
    expect(content).toHaveStyle({ width: '100%', textAlign: 'center' });
    expect(content).toHaveTextContent('Centered Title');
  });
});
