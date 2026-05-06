/* @vitest-environment jsdom */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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

describe('example sample designer toggle', () => {
  it('opens the designer for the selected sample template', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    expect(document.body.textContent).toContain('Grouped Employees');
    expect(document.querySelector('[data-testid="designer-quick-access"]')).toBeNull();

    const openDesigner = Array.from(document.querySelectorAll('button'))
      .find(button => button.textContent?.includes('打开设计器'));
    expect(openDesigner).toBeTruthy();

    await act(async () => {
      openDesigner!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(document.querySelector('[data-testid="designer-quick-access"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="designer-canvas-frame"]')).toBeTruthy();
    expect(document.body.textContent).toContain('Grouped Employees');
  });
});
