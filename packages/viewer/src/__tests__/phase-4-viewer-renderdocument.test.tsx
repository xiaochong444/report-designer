/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

  it('scrolls the preview workspace to the selected page when paging from the toolbar', async () => {
    const { template, data } = makeViewerTemplate(4);
    const scrollIntoView = vi.fn();
    const scrollTo = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    });

    render(<Viewer template={template} data={data} />);
    scrollIntoView.mockClear();
    scrollTo.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Next Page' }));

    expect(screen.getByTestId('viewer-preview-scroll')).toBeInTheDocument();
    await waitFor(() => expect(scrollTo).toHaveBeenCalledTimes(1));
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('passes local subreport registry entries into preview rendering', () => {
    const { template, data } = makeViewerTemplate(1);
    template.pages[0].bands[0].components = [{
      id: 'local-subreport',
      type: 'subreport',
      x: 0,
      y: 0,
      width: 80,
      height: 20,
      templateUrl: 'detail-template',
      parameters: {},
    }];
    const detail = makeViewerTemplate(1).template;
    detail.pages[0].bands[0].components = [{
      id: 'detail-text',
      type: 'text',
      x: 0,
      y: 0,
      width: 60,
      height: 8,
      text: 'Local detail rendered',
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      textAlign: 'left',
      verticalAlign: 'top',
      border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
      canGrow: false,
      canShrink: false,
    }];

    render(<Viewer template={template} data={data} subreports={{ 'detail-template': detail }} />);

    expect(screen.getAllByText('Local detail rendered').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Missing subreport/)).not.toBeInTheDocument();
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

  it('renders table components in the DOM renderer', () => {
    const document = makeRenderDocument();
    document.pages[0].items[0].components.push({
      id: 'table1',
      type: 'table',
      x: 80,
      y: 80,
      width: 80,
      height: 24,
      columns: [
        { id: 'name', header: 'Name', field: 'name', width: 50, cellType: 'text' },
        { id: 'salary', header: 'Salary', field: 'salary', width: 30, cellType: 'text' },
      ],
      rows: [
        [
          { row: 0, column: 0, content: 'Name', isHeader: true, height: 8, rowSpan: 1, colSpan: 1 },
          { row: 0, column: 1, content: 'Salary', isHeader: true, height: 8, rowSpan: 1, colSpan: 1 },
        ],
        [
          { row: 1, column: 0, content: 'Alice', field: 'name', height: 8, rowSpan: 1, colSpan: 1 },
          { row: 1, column: 1, content: '98000', field: 'salary', height: 8, rowSpan: 1, colSpan: 1 },
        ],
      ],
      showBorder: true,
      style: {},
    } as any);

    render(<RenderDocumentView document={document} zoom={100} />);

    expect(screen.getByTestId('render-component-table')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('98000')).toBeInTheDocument();
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

  it('renders panel and subreport children without applying band or container offsets twice', () => {
    const document = makeRenderDocument();
    document.pages[0].items[0].components.push({
      id: 'panel-1',
      type: 'panel',
      x: 30,
      y: 30,
      width: 80,
      height: 40,
      style: { backgroundColor: '#ffffff' },
      children: [
        {
          id: 'panel-text-1',
          type: 'text',
          x: 35,
          y: 36,
          width: 30,
          height: 8,
          content: 'Panel child',
          style: {},
        },
      ],
    });
    document.pages[0].items[0].components.push({
      id: 'subreport-1',
      type: 'subreport',
      x: 120,
      y: 30,
      width: 60,
      height: 30,
      templateUrl: 'child-report.json',
      missing: false,
      style: {},
      children: [
        {
          id: 'subreport-text-1',
          type: 'text',
          x: 125,
          y: 35,
          width: 30,
          height: 8,
          content: 'Sub child',
          style: {},
        },
      ],
    });

    const { container } = render(<RenderDocumentView document={document} zoom={100} />);

    const panel = container.querySelector('[data-report-component="panel-1"]') as HTMLElement;
    const panelChild = container.querySelector('[data-report-component="panel-text-1"]') as HTMLElement;
    const subreport = container.querySelector('[data-report-component="subreport-1"]') as HTMLElement;
    const subreportChild = container.querySelector('[data-report-component="subreport-text-1"]') as HTMLElement;

    expect(panel).toHaveStyle({ left: `${10 * 96 / 25.4}px`, top: `${10 * 96 / 25.4}px` });
    expect(panelChild).toHaveStyle({ left: `${5 * 96 / 25.4}px`, top: `${6 * 96 / 25.4}px` });
    expect(subreport).toHaveStyle({ left: `${100 * 96 / 25.4}px`, top: `${10 * 96 / 25.4}px` });
    expect(subreportChild).toHaveStyle({ left: `${5 * 96 / 25.4}px`, top: `${5 * 96 / 25.4}px` });
  });
});
