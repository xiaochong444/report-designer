import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Designer } from '../components/Designer';
import { DesignerI18nProvider } from '../i18n';

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

describe('Phase 0 designer shell', () => {
  it('renders shell regions', () => {
    render(React.createElement(Designer));

    expect(screen.getByTestId('designer-quick-access')).toBeTruthy();
    expect(screen.getByTestId('designer-ribbon')).toBeTruthy();
    expect(screen.getByTestId('designer-left-panel')).toBeTruthy();
    expect(screen.getByTestId('designer-canvas-frame')).toBeTruthy();
    expect(screen.getByTestId('designer-property-grid')).toBeTruthy();
    expect(screen.getByTestId('designer-status-bar')).toBeTruthy();
  });

  it('localizes status bar copy to Chinese', () => {
    render(React.createElement(
      DesignerI18nProvider,
      { locale: 'zh-CN' },
      React.createElement(Designer),
    ));

    expect(screen.getByText('无选择')).toBeTruthy();
    expect(screen.getByText(/第 1 页，共 1 页/)).toBeTruthy();
    expect(screen.getAllByText(/边距/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/网格/).length).toBeGreaterThan(0);
    expect(screen.getByText('吸附开启')).toBeTruthy();
  });
});
