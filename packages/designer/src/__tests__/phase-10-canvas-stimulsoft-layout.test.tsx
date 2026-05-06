/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
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

describe('Phase 10 Stimulsoft canvas layout', () => {
  it('shows screenshot-like ruler labels and horizontal band title strips', () => {
    render(<Designer template={createDefaultTemplate('Canvas Layout')} />);

    expect(screen.getByTestId('designer-ruler-horizontal')).toHaveTextContent('0');
    expect(screen.getByTestId('designer-ruler-horizontal')).toHaveTextContent('100');
    expect(screen.getByTestId('designer-ruler-horizontal')).toHaveTextContent('200');
    expect(screen.getByTestId('designer-ruler-horizontal')).toHaveTextContent('300');
    expect(screen.getByText('PageHeaderBand1')).toBeInTheDocument();
    expect(screen.getByText('DataBand1')).toBeInTheDocument();
  });
});
