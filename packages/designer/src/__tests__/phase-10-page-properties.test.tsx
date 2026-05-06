/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
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

describe('Phase 10 page properties', () => {
  it('shows page settings when no component or band is selected', () => {
    render(<Designer template={createDefaultTemplate('Page Properties')} />);

    const propertyGrid = screen.getByTestId('designer-property-grid');
    expect(within(propertyGrid).getByText('Page Settings')).toBeInTheDocument();

    const pageProperties = screen.getByTestId('designer-page-properties');
    expect(within(pageProperties).getByLabelText('Paper type')).toBeInTheDocument();
    expect(within(pageProperties).getByLabelText('Report unit')).toBeInTheDocument();
    expect(pageProperties).toHaveTextContent('Width');
    expect(pageProperties).toHaveTextContent('Height');
    expect(pageProperties).toHaveTextContent('Orientation');
    expect(pageProperties).toHaveTextContent('Top');
    expect(pageProperties).toHaveTextContent('Right');
    expect(pageProperties).toHaveTextContent('Bottom');
    expect(pageProperties).toHaveTextContent('Left');
    expect(pageProperties).toHaveTextContent('A4');
    expect(pageProperties).toHaveTextContent('Millimeter');
    expect(pageProperties).not.toHaveTextContent('(mm)');
  });
});
