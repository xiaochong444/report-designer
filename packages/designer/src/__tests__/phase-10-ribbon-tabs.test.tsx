/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { Designer } from '../components/Designer';

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
  it('switches Home, Insert, Page Layout, and Preview tab groups', () => {
    render(<Designer template={createDefaultTemplate('Ribbon Tabs')} locale="en-US" />);

    const ribbonContent = screen.getByTestId('designer-ribbon-content');
    expect(screen.getByRole('button', { name: 'Home' })).toHaveClass('rd-ribbon-tab-active');
    expect(ribbonContent).toHaveTextContent('Clipboard');
    expect(ribbonContent).toHaveTextContent('Font');
    expect(ribbonContent).toHaveTextContent('Styles');
    expect(screen.getByText('Style Designer')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Insert' }));
    expect(screen.getByRole('button', { name: 'Insert' })).toHaveClass('rd-ribbon-tab-active');
    expect(ribbonContent).toHaveTextContent('Components');
    expect(ribbonContent).toHaveTextContent('Bands');

    fireEvent.click(screen.getByRole('button', { name: 'Page Layout' }));
    expect(screen.getByRole('button', { name: 'Page Layout' })).toHaveClass('rd-ribbon-tab-active');
    expect(ribbonContent).toHaveTextContent('Page Setup');
    expect(ribbonContent).toHaveTextContent('Margins');

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(screen.getByRole('button', { name: 'Preview' })).toHaveClass('rd-ribbon-tab-active');
    expect(ribbonContent).toHaveTextContent('Print Preview');
  }, 10000);
});
