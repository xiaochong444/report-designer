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

describe('Phase 14 canvas zoom layout', () => {
  it('keeps ruler, paper, printable area, and zoom controls aligned at 200%', () => {
    render(<Designer template={createDefaultTemplate('Zoom Layout')} />);

    fireEvent.click(screen.getByTitle('200%'));

    const zoomBar = screen.getByTestId('designer-zoom-bar');
    const pageStack = screen.getByTestId('designer-canvas-page-stack');
    const canvasViewport = pageStack.parentElement;
    const page = screen.getByTestId('designer-page-sheet');
    const contentArea = screen.getByTestId('designer-page-content-area');
    const horizontalRuler = screen.getByTestId('designer-ruler-horizontal');
    const verticalRuler = screen.getByTestId('designer-ruler-vertical');

    expect(canvasViewport).toHaveStyle({ overflowX: 'auto' });
    expect(zoomBar.parentElement).toBe(canvasViewport?.parentElement);
    expect(zoomBar).toHaveStyle({
      position: 'absolute',
      right: '16px',
      bottom: '16px',
    });
    expect(pageStack.getAttribute('style')).toContain('width: 1612px');
    expect(page.getAttribute('style')).toContain('width: 794px');
    expect(page.getAttribute('style')).toContain('height: 1123px');
    expect(page.getAttribute('style')).toContain('transform: scale(2)');
    expect(contentArea.getAttribute('style')).toContain('left: 76px');
    expect(contentArea.getAttribute('style')).toContain('top: 76px');
    expect(contentArea.getAttribute('style')).toContain('width: 643px');
    expect(contentArea.getAttribute('style')).toContain('height: 971px');
    expect(horizontalRuler.getAttribute('style')).toContain('width: 1588px');
    expect(horizontalRuler).toHaveAttribute('data-printable-offset-px', '152');
    expect(verticalRuler.getAttribute('style')).toContain('height: 2246px');
    expect(verticalRuler).toHaveAttribute('data-printable-offset-px', '152');
  });
});
