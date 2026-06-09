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

  it('deletes the selected band with Delete', () => {
    render(<Designer template={createDefaultTemplate('Band Delete')} locale="en-US" />);

    fireEvent.mouseDown(screen.getByTestId('designer-band-frame-pageHeader'));
    expect(useDesignerStore.getState().selectedBandId).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Delete' });

    const bandTypes = useDesignerStore.getState().template.pages[0].bands.map(band => band.type);
    expect(bandTypes).toEqual(['reportTitle', 'data', 'pageFooter']);
    expect(useDesignerStore.getState().selectedBandId).toBeNull();
    expect(screen.queryByTestId('designer-band-frame-pageHeader')).not.toBeInTheDocument();
  });

  it('copies and deletes bands from the band context menu', () => {
    render(<Designer template={createDefaultTemplate('Band Context Menu')} locale="en-US" />);

    fireEvent.contextMenu(screen.getByTestId('designer-band-frame-pageHeader'), { clientX: 120, clientY: 120 });
    expect(screen.getByTestId('designer-band-context-menu')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Copy Band'));

    let bands = useDesignerStore.getState().template.pages[0].bands;
    expect(bands.map(band => band.type)).toEqual(['reportTitle', 'pageHeader', 'pageHeader', 'data', 'pageFooter']);
    expect(useDesignerStore.getState().selectedBandId).toBe(bands[2].id);
    expect(within(screen.getAllByTestId('designer-band-frame-pageHeader')[1]).getByText('PageHeaderBand2')).toBeInTheDocument();

    fireEvent.contextMenu(screen.getAllByTestId('designer-band-frame-pageHeader')[1], { clientX: 120, clientY: 150 });
    fireEvent.click(screen.getByText('Delete Band'));

    bands = useDesignerStore.getState().template.pages[0].bands;
    expect(bands.map(band => band.type)).toEqual(['reportTitle', 'pageHeader', 'data', 'pageFooter']);
    expect(useDesignerStore.getState().selectedBandId).toBeNull();
  });

  it('reorders bands by dragging a band title on the canvas', () => {
    render(<Designer template={createDefaultTemplate('Band Drag Reorder')} locale="en-US" />);

    const pageHeaderTitle = screen.getByTestId('designer-band-title-pageHeader');
    fireEvent.mouseDown(pageHeaderTitle, { clientY: 40 });
    fireEvent.mouseMove(window, { clientY: 560 });
    const dragPreview = screen.getByTestId('designer-band-drag-preview');
    expect(dragPreview).toHaveTextContent('PageHeaderBand1');
    const previewTop = dragPreview.style.top;
    fireEvent.mouseMove(window, { clientY: 620 });
    expect(screen.getByTestId('designer-band-drag-preview').style.top).not.toBe(previewTop);
    fireEvent.mouseUp(window, { clientY: 560 });

    const bands = useDesignerStore.getState().template.pages[0].bands;
    expect(bands.map(band => band.type)).toEqual(['reportTitle', 'data', 'pageFooter', 'pageHeader']);
    expect(useDesignerStore.getState().selectedBandId).toBe(bands[3].id);
    expect(screen.queryByTestId('designer-band-drag-preview')).not.toBeInTheDocument();
  });
});
