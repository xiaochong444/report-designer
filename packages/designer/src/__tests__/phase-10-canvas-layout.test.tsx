/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate, type ReportComponent } from '@report-designer/core';
import { Designer } from '../components/Designer';
import { Canvas } from '../components/Canvas';
import { DesignerI18nProvider } from '../i18n';
import { useDesignerStore } from '../store/designer-store';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

describe('Phase 10 canvas layout', () => {
  it('shows screenshot-like ruler labels and horizontal band title strips', () => {
    const template = createDefaultTemplate('Canvas Layout');
    template.dataSources = [{ id: 'Customers', name: 'Customers', type: 'json', schema: [] }];
    template.pages[0].bands.find(band => band.type === 'data')!.dataBand = {
      dataSourceId: 'Customers',
      oddRowBackgroundColor: '#fff7e6',
      evenRowBackgroundColor: '#e6f4ff',
    };

    render(<Designer template={template} locale="en-US" />);

    expect(screen.getByTestId('designer-ruler-horizontal')).toHaveTextContent('0');
    expect(screen.getByTestId('designer-ruler-horizontal')).toHaveTextContent('10');
    expect(screen.getByTestId('designer-ruler-horizontal')).toHaveTextContent('20');
    expect(screen.getByTestId('designer-ruler-horizontal')).toHaveTextContent('100');
    expect(screen.getByTestId('designer-ruler-horizontal')).not.toHaveTextContent('200');
    expect(within(screen.getByTestId('designer-band-frame-pageHeader')).getByText('PageHeaderBand1')).toBeInTheDocument();
    expect(within(screen.getByTestId('designer-band-frame-data')).getByText('DataBand1; 数据源: Customers')).toBeInTheDocument();
    expect(screen.getByTestId('designer-band-body-data')).not.toHaveStyle({ backgroundColor: '#fff7e6' });
    expect(screen.getByTestId('designer-band-body-data').style.backgroundImage).toBe('');
  });

  it('localizes canvas empty state and zoom controls', () => {
    const template = createDefaultTemplate('Canvas English');
    template.pages = [];
    useDesignerStore.getState().loadTemplate(template);

    const emptyCanvas = render(
      <DesignerI18nProvider locale="en-US">
        <Canvas />
      </DesignerI18nProvider>,
    );

    expect(screen.getByText('No page selected')).toBeInTheDocument();
    emptyCanvas.unmount();

    useDesignerStore.getState().loadTemplate(createDefaultTemplate('Canvas English Zoom'));
    const canvasWithPage = render(
      <DesignerI18nProvider locale="en-US">
        <Canvas />
      </DesignerI18nProvider>,
    );

    expect(within(canvasWithPage.container).getByTitle('Zoom out')).toBeInTheDocument();
    expect(within(canvasWithPage.container).getByTitle('Reset to 100%')).toBeInTheDocument();
    expect(within(canvasWithPage.container).getByTitle('Zoom in')).toBeInTheDocument();
  });

  it('does not add designer-only border or padding around component borders', () => {
    const template = createDefaultTemplate('Canvas Component Border');
    const text: ReportComponent = {
      id: 'border-text',
      type: 'text',
      x: 0,
      y: 0,
      width: 40,
      height: 8,
      text: 'Cell',
      font: { family: 'Arial', size: 9, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      textAlign: 'left',
      verticalAlign: 'middle',
      border: { style: 'solid', width: 0.2, color: '#9ca3af', sides: { top: true, right: true, bottom: true, left: true } },
      canGrow: false,
      canShrink: false,
    } as ReportComponent;
    template.pages[0].bands.find(band => band.type === 'data')!.components = [text];
    useDesignerStore.getState().loadTemplate(template);

    render(
      <DesignerI18nProvider locale="en-US">
        <Canvas />
      </DesignerI18nProvider>,
    );

    const componentNode = document.querySelector('[data-component-id="border-text"]') as HTMLElement;
    expect(componentNode).toBeInTheDocument();
    expect(componentNode.parentElement).not.toHaveStyle({ border: '2px solid transparent' });
    expect(componentNode).toHaveStyle({ padding: '0px' });
  });

  it('renders component borders in an overlay above adjacent component backgrounds', () => {
    const template = createDefaultTemplate('Canvas Border Overlay');
    const first: ReportComponent = {
      id: 'left-cell',
      type: 'text',
      x: 0,
      y: 0,
      width: 20,
      height: 8,
      text: '数量',
      font: { family: 'Arial', size: 9, bold: true, italic: false, underline: false, strikethrough: false, color: '#000000' },
      textAlign: 'center',
      verticalAlign: 'middle',
      backgroundColor: '#f3f4f6',
      border: { style: 'solid', width: 0.2, color: '#9ca3af', sides: { top: true, right: true, bottom: true, left: false } },
      canGrow: false,
      canShrink: false,
    } as ReportComponent;
    const second: ReportComponent = {
      ...first,
      id: 'right-cell',
      x: 20,
      text: '单价',
      border: { style: 'solid', width: 0.2, color: '#9ca3af', sides: { top: true, right: true, bottom: true, left: false } },
    } as ReportComponent;
    template.pages[0].bands.find(band => band.type === 'data')!.components = [first, second];
    useDesignerStore.getState().loadTemplate(template);

    render(
      <DesignerI18nProvider locale="en-US">
        <Canvas />
      </DesignerI18nProvider>,
    );

    const leftContent = document.querySelector('[data-component-id="left-cell"]') as HTMLElement;
    const rightContent = document.querySelector('[data-component-id="right-cell"]') as HTMLElement;
    const leftBorder = document.querySelector('[data-component-border-id="left-cell"]') as HTMLElement;

    expect(leftContent).toHaveStyle({ backgroundColor: '#f3f4f6' });
    expect(rightContent).toHaveStyle({ backgroundColor: '#f3f4f6' });
    expect(leftContent.style.borderRight).toBe('');
    expect(leftBorder).toHaveStyle({ borderRight: '0.2mm solid #9ca3af' });
    expect(Number(leftBorder.style.zIndex)).toBeGreaterThan(Number(rightContent.style.zIndex));
  });

  it('keeps the band resize handle above components so band height can be dragged', () => {
    const template = createDefaultTemplate('Band Resize Hit Layer');
    const dataBand = template.pages[0].bands.find(band => band.type === 'data')!;
    dataBand.components = [{
      id: 'bottom-cover',
      type: 'text',
      x: 0,
      y: dataBand.height - 4,
      width: 160,
      height: 8,
      text: 'Near band edge',
    } as ReportComponent];
    useDesignerStore.getState().loadTemplate(template);

    render(
      <DesignerI18nProvider locale="en-US">
        <Canvas />
      </DesignerI18nProvider>,
    );

    const bandResizeHandle = document.querySelector('[data-band-resize][data-band-id="' + dataBand.id + '"]') as HTMLElement;
    const componentNode = document.querySelector('[data-component-id="bottom-cover"]') as HTMLElement;

    expect(bandResizeHandle).toBeInTheDocument();
    expect(componentNode).toBeInTheDocument();
    expect(Number(bandResizeHandle.style.zIndex)).toBeGreaterThan(Number(componentNode.style.zIndex));
    expect(Number(bandResizeHandle.style.zIndex)).toBeGreaterThan(200);
    expect(bandResizeHandle).toHaveStyle({ cursor: 'ns-resize' });
  });

  it('drags a band resize handle to update the band height', () => {
    const template = createDefaultTemplate('Band Resize Drag');
    const dataBand = template.pages[0].bands.find(band => band.type === 'data')!;
    const originalHeight = dataBand.height;
    useDesignerStore.getState().loadTemplate(template);

    render(
      <DesignerI18nProvider locale="en-US">
        <Canvas />
      </DesignerI18nProvider>,
    );

    const pageSheet = screen.getByTestId('designer-page-sheet');
    const bandResizeHandle = document.querySelector('[data-band-resize][data-band-id="' + dataBand.id + '"]') as HTMLElement;
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => bandResizeHandle),
    });

    fireEvent.mouseDown(pageSheet, { button: 0, clientX: 100, clientY: 200 });
    fireEvent.mouseMove(window, { clientX: 100, clientY: 238 });
    fireEvent.mouseUp(window, { clientX: 100, clientY: 238 });

    const nextDataBand = useDesignerStore.getState().template.pages[0].bands.find(band => band.id === dataBand.id)!;
    expect(nextDataBand.height).toBeGreaterThan(originalHeight);
  });
});
