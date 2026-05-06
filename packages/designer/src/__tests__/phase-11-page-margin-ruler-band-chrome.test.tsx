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

describe('Phase 11 page margin ruler and band chrome', () => {
  it('renders paper margins, printable-area rulers, printable grid, and band chrome outside body height', () => {
    render(<Designer template={createDefaultTemplate('Margin Canvas')} />);

    const pageStack = screen.getByTestId('designer-canvas-page-stack');
    const page = screen.getByTestId('designer-page-sheet');
    const contentArea = screen.getByTestId('designer-page-content-area');
    const horizontalRuler = screen.getByTestId('designer-ruler-horizontal');
    const verticalRuler = screen.getByTestId('designer-ruler-vertical');
    const dataBandBody = screen.getByTestId('designer-band-body-data');
    const dataBandFrame = dataBandBody.parentElement;

    expect(page.getAttribute('style')).not.toContain('linear-gradient');
    expect(contentArea.getAttribute('style')).toContain('linear-gradient');

    const contentStyle = contentArea.getAttribute('style') ?? '';
    expect(contentStyle).toContain('left: 76px');
    expect(contentStyle).toContain('top: 76px');
    expect(contentStyle).toContain('width: 643px');
    expect(contentStyle).toContain('height: 971px');

    const pageStackStyle = pageStack.getAttribute('style') ?? '';
    const horizontalStyle = horizontalRuler.getAttribute('style') ?? '';
    const verticalStyle = verticalRuler.getAttribute('style') ?? '';
    expect(pageStackStyle).toContain('margin: 0px');
    expect(horizontalStyle).toContain('left: 24px');
    expect(horizontalStyle).toContain('width: 794px');
    expect(horizontalRuler).toHaveAttribute('data-printable-offset-px', '76');
    expect(verticalStyle).toContain('top: 24px');
    expect(verticalStyle).toContain('height: 1123px');
    expect(verticalRuler).toHaveAttribute('data-printable-offset-px', '76');
    expect(horizontalRuler).toHaveTextContent('0');
    expect(horizontalRuler).toHaveTextContent('10');
    expect(horizontalRuler).toHaveTextContent('20');
    expect(horizontalRuler).not.toHaveTextContent('200');

    const frameStyle = dataBandFrame?.getAttribute('style') ?? '';
    const bodyStyle = dataBandBody.getAttribute('style') ?? '';
    expect(frameStyle).toContain('height: 102px');
    expect(bodyStyle).toContain('top: 26px');
    expect(bodyStyle).toContain('height: 76px');
  });
});
