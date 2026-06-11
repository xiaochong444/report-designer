/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { Designer } from '../components/Designer';
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

describe('Phase 10 ribbon tabs', () => {
  it('switches Home, Insert, Page Layout, Layout, and Preview tab groups', () => {
    render(<Designer template={createDefaultTemplate('Ribbon Tabs')} locale="en-US" />);

    const ribbonContent = screen.getByTestId('designer-ribbon-content');
    expect(screen.getByRole('button', { name: 'Home' })).toHaveClass('rd-ribbon-tab-active');
    expect(ribbonContent).toHaveTextContent('Clipboard');
    expect(ribbonContent).toHaveTextContent('Font');
    expect(ribbonContent).toHaveTextContent('Styles');
    expect(ribbonContent).not.toHaveTextContent('Distribute');
    expect(screen.getByText('Style Designer')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Insert' }));
    expect(screen.getByRole('button', { name: 'Insert' })).toHaveClass('rd-ribbon-tab-active');
    expect(ribbonContent).toHaveTextContent('Components');
    expect(ribbonContent).toHaveTextContent('Bands');
    expect(ribbonContent).not.toHaveTextContent('JSON');
    expect(ribbonContent).not.toHaveTextContent('Band wizard');
    expect(ribbonContent).not.toHaveTextContent('Group wizard');
    for (const name of ['Insert band', 'Text', 'Rich Text', 'Image', 'Table', 'Chart', 'Barcode', 'QR Code', 'Checkbox', 'Page #', 'Date/Time', 'Line', 'Shape', 'Panel']) {
      expect(screen.getByRole('button', { name })).toHaveTextContent('');
    }
    expect(screen.queryByRole('button', { name: 'Subreport' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Page Layout' }));
    expect(screen.getByRole('button', { name: 'Page Layout' })).toHaveClass('rd-ribbon-tab-active');
    expect(ribbonContent).toHaveTextContent('Page Setup');
    expect(ribbonContent).toHaveTextContent('Margins');
    expect(screen.queryByRole('button', { name: 'Add page' })).not.toBeInTheDocument();
    for (const name of ['Page settings', 'A4 Portrait', 'A4 Landscape', 'Normal', 'Narrow', 'Wide']) {
      expect(screen.getByRole('button', { name })).toHaveTextContent('');
    }

    fireEvent.click(screen.getByRole('button', { name: 'Layout' }));
    expect(screen.getByRole('button', { name: 'Layout' })).toHaveClass('rd-ribbon-tab-active');
    expect(ribbonContent).toHaveTextContent('Arrange');
    expect(ribbonContent).toHaveTextContent('Align');
    expect(ribbonContent).toHaveTextContent('Distribute');
    expect(ribbonContent).toHaveTextContent('Size');

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(screen.getByRole('button', { name: 'Preview' })).toHaveClass('rd-ribbon-tab-active');
    expect(ribbonContent).toHaveTextContent('Print Preview');
  }, 60000);

  it('exposes every toolbox component from Insert and inserts them from icon buttons', () => {
    render(<Designer template={createDefaultTemplate('Ribbon Insert Components')} locale="en-US" />);

    fireEvent.click(screen.getByRole('button', { name: 'Insert' }));
    const ribbonContent = screen.getByTestId('designer-ribbon-content');

    const componentButtons = [
      { label: 'Text', type: 'text' },
      { label: 'Rich Text', type: 'richtext' },
      { label: 'Image', type: 'image' },
      { label: 'Table', type: 'table' },
      { label: 'Chart', type: 'chart' },
      { label: 'Barcode', type: 'barcode' },
      { label: 'QR Code', type: 'qrcode' },
      { label: 'Checkbox', type: 'checkbox' },
      { label: 'Page #', type: 'pagenumber' },
      { label: 'Date/Time', type: 'datetime' },
      { label: 'Line', type: 'line' },
      { label: 'Shape', type: 'shape' },
      { label: 'Panel', type: 'panel' },
    ];

    expect(screen.getByTestId('ribbon-insert-band-button')).toHaveStyle({ minWidth: '52px' });

    const findRibbonButton = (label: string) => Array.from(ribbonContent.querySelectorAll<HTMLButtonElement>('button'))
      .find(button => button.getAttribute('aria-label') === label) as HTMLButtonElement | undefined;

    for (const { label } of componentButtons) {
      expect(findRibbonButton(label)).toHaveTextContent('');
    }

    for (const { label } of componentButtons) {
      const button = findRibbonButton(label);
      expect(button).toBeDefined();
      fireEvent.click(button!);
    }

    const insertedTypes = useDesignerStore.getState().template.pages
      .flatMap(page => page.bands)
      .flatMap(band => band.components)
      .map(component => component.type);

    expect(insertedTypes).toEqual(expect.arrayContaining(componentButtons.map(item => item.type)));
  }, 20000);
});
