import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

describe('Phase 0 Stimulsoft designer shell', () => {
  it('renders Stimulsoft-style shell regions', () => {
    render(React.createElement(Designer));

    expect(screen.getByTestId('designer-quick-access')).toBeTruthy();
    expect(screen.getByTestId('designer-ribbon')).toBeTruthy();
    expect(screen.getByTestId('designer-left-panel')).toBeTruthy();
    expect(screen.getByTestId('designer-canvas-frame')).toBeTruthy();
    expect(screen.getByTestId('designer-property-grid')).toBeTruthy();
    expect(screen.getByTestId('designer-status-bar')).toBeTruthy();
  });
});
