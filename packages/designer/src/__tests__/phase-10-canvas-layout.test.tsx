/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
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
    render(<Designer template={createDefaultTemplate('Canvas Layout')} />);

    expect(screen.getByTestId('designer-ruler-horizontal')).toHaveTextContent('0');
    expect(screen.getByTestId('designer-ruler-horizontal')).toHaveTextContent('10');
    expect(screen.getByTestId('designer-ruler-horizontal')).toHaveTextContent('20');
    expect(screen.getByTestId('designer-ruler-horizontal')).toHaveTextContent('100');
    expect(screen.getByTestId('designer-ruler-horizontal')).not.toHaveTextContent('200');
    expect(within(screen.getByTestId('designer-band-frame-pageHeader')).getByText('PageHeaderBand1')).toBeInTheDocument();
    expect(within(screen.getByTestId('designer-band-frame-data')).getByText('DataBand1')).toBeInTheDocument();
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
});
