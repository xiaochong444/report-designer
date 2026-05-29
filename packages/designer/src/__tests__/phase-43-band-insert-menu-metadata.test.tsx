/* @vitest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate, type BandType } from '@report-designer/core';
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

const SUPPORTED_INSERT_BANDS: Array<{ type: BandType; label: string; color: string; glyph: string }> = [
  { type: 'reportTitle', label: 'ReportTitleBand', color: '#8b4513', glyph: 'report-title' },
  { type: 'pageHeader', label: 'PageHeaderBand', color: '#2e7d32', glyph: 'page-header' },
  { type: 'header', label: 'HeaderBand', color: '#374151', glyph: 'header' },
  { type: 'columnHeader', label: 'ColumnHeaderBand', color: '#c2410c', glyph: 'column-header' },
  { type: 'groupHeader', label: 'GroupHeaderBand', color: '#00838f', glyph: 'group-header' },
  { type: 'data', label: 'DataBand', color: '#6a1b9a', glyph: 'data' },
  { type: 'hierarchicalData', label: 'HierarchicalDataBand', color: '#4f46e5', glyph: 'hierarchical-data' },
  { type: 'child', label: 'ChildBand', color: '#ad1457', glyph: 'child' },
  { type: 'emptyData', label: 'EmptyDataBand', color: '#558b2f', glyph: 'empty-data' },
  { type: 'groupFooter', label: 'GroupFooterBand', color: '#4527a0', glyph: 'group-footer' },
  { type: 'columnFooter', label: 'ColumnFooterBand', color: '#b45309', glyph: 'column-footer' },
  { type: 'footer', label: 'FooterBand', color: '#2563eb', glyph: 'footer' },
  { type: 'pageFooter', label: 'PageFooterBand', color: '#1565c0', glyph: 'page-footer' },
  { type: 'reportSummary', label: 'ReportSummaryBand', color: '#6b4423', glyph: 'report-summary' },
  { type: 'overlay', label: 'OverlayBand', color: '#7e22ce', glyph: 'overlay' },
];

describe('Phase 43 band insert menu metadata', () => {
  it('shows only supported band types with canvas-matched color and distinct glyphs', async () => {
    render(<Designer template={createDefaultTemplate('Band menu metadata')} locale="en-US" />);

    fireEvent.click(screen.getByRole('button', { name: 'Insert' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Insert band' }));
    });

    const menu = screen.getByRole('menu');
    const menuItems = within(menu).getAllByRole('menuitem');
    expect(menuItems.map(item => item.textContent)).toEqual(SUPPORTED_INSERT_BANDS.map(item => item.label));

    const glyphIds = new Set<string>();
    for (const band of SUPPORTED_INSERT_BANDS) {
      const item = screen.getByRole('menuitem', { name: band.label });
      const glyph = within(item).getByTestId(`band-menu-glyph-${band.type}`);
      expect(glyph).toHaveAttribute('data-band-color', band.color);
      expect(glyph).toHaveStyle({ borderColor: band.color });
      expect(glyph).toHaveAttribute('data-band-glyph', band.glyph);
      glyphIds.add(glyph.getAttribute('data-band-glyph') ?? '');
    }

    expect(glyphIds.size).toBe(SUPPORTED_INSERT_BANDS.length);
  });
});
