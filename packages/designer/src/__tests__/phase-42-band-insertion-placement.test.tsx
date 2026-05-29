/* @vitest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
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

describe('Phase 42 band insertion placement', () => {
  it('starts band placement from the Insert ribbon and inserts the selected band below the clicked band', async () => {
    render(<Designer template={createDefaultTemplate('Band Insert Placement')} locale="en-US" />);

    fireEvent.click(screen.getByRole('button', { name: 'Insert' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Insert band' }));
    });

    expect(screen.getByRole('menuitem', { name: 'ReportSummaryBand' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'EmptyDataBand' })).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'ReportSummaryBand' }));
    });
    expect(screen.getByTestId('designer-band-insert-cursor')).toHaveTextContent('ReportSummaryBand');

    fireEvent.mouseDown(screen.getByTestId('designer-band-frame-pageHeader'));

    const bands = useDesignerStore.getState().template.pages[0].bands;
    const bandTypes = bands.map(band => band.type);
    expect(bandTypes).toEqual(['reportTitle', 'pageHeader', 'reportSummary', 'data', 'pageFooter']);
    expect(useDesignerStore.getState().pendingBandInsertType).toBeNull();
    expect(useDesignerStore.getState().selectedBandId).toBe(bands[2].id);
    expect(within(screen.getByTestId('designer-band-frame-reportSummary')).getByText('ReportSummaryBand1')).toBeInTheDocument();
  });
});
