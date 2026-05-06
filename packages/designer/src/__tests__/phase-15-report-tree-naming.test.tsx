/* @vitest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate, type ReportTemplate, type TextComponent, type ImageComponent, type ReportComponent } from '@report-designer/core';
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

function makeTreeTemplate(): ReportTemplate {
  const template = createDefaultTemplate('Tree Demo');
  const page = template.pages[0];
  const pageHeaderBand = page.bands.find((band) => band.type === 'pageHeader')!;
  const dataBand = page.bands.find((band) => band.type === 'data')!;

  const textComponent: TextComponent = {
    id: 'text-alpha',
    type: 'text',
    x: 0,
    y: 0,
    width: 40,
    height: 8,
    text: 'Alpha',
    font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
    textAlign: 'left',
    verticalAlign: 'middle',
    border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    canGrow: false,
    canShrink: false,
  };

  const imageComponent: ImageComponent = {
    id: 'image-alpha',
    type: 'image',
    x: 0,
    y: 0,
    width: 20,
    height: 20,
    src: '',
    fitMode: 'contain',
  };

  pageHeaderBand.components = [textComponent];
  dataBand.components = [imageComponent];
  return template;
}

describe('Phase 15 report tree naming and icons', () => {
  it('shows clean auto-generated component names and per-type icons in report tree', async () => {
    render(<Designer template={makeTreeTemplate()} />);

    expect(await screen.findByTestId('report-tree-root')).toHaveTextContent('Tree Demo');
    expect(await screen.findByText('Page1')).toBeInTheDocument();
    expect(within(await screen.findByTestId('report-tree-component-text-alpha')).getByText('Text1')).toBeInTheDocument();
    expect(within(await screen.findByTestId('report-tree-component-image-alpha')).getByText('Image1')).toBeInTheDocument();
    expect(screen.queryByText(/text - text-alpha/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('report-tree-icon-text')).toBeInTheDocument();
    expect(screen.getByTestId('report-tree-icon-image')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('搜索组件')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '添加带' })).not.toBeInTheDocument();
    expect(document.querySelector('.rd-report-tree-node-sub')).toBeNull();
    expect(document.querySelector('.rd-report-tree-actions')).toBeNull();
    expect(document.querySelector('.rd-report-tree-tree.ant-tree-show-line')).toBeNull();
  });

  it('continues auto numbering when a new unnamed component is inserted', async () => {
    const template = makeTreeTemplate();
    render(<Designer template={template} />);

    await screen.findByTestId('report-tree-component-text-alpha');

    const page = template.pages[0];
    const targetBand = page.bands.find((band) => band.type === 'data')!;

    act(() => {
      useDesignerStore.getState().addComponent(page.id, targetBand.id, {
        id: 'text-beta',
        type: 'text',
        x: 10,
        y: 10,
        width: 40,
        height: 8,
        text: 'Beta',
        font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
        textAlign: 'left',
        verticalAlign: 'middle',
        border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
        canGrow: false,
        canShrink: false,
      } as ReportComponent);
    });

    expect(within(await screen.findByTestId('report-tree-component-text-beta')).getByText('Text2')).toBeInTheDocument();
  });

  it('filters visible components by search term', async () => {
    render(<Designer template={makeTreeTemplate()} />);

    const searchInput = await screen.findByPlaceholderText('搜索组件');
    fireEvent.change(searchInput, { target: { value: 'Image1' } });

    const reportTree = screen.getByTestId('report-tree');
    expect(await screen.findByTestId('report-tree-component-image-alpha')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId('report-tree-component-text-alpha')).not.toBeInTheDocument();
    });
    expect(within(reportTree).getByText('DataBand1')).toBeInTheDocument();
  });

  it('selects a band from the report tree and clears component selection', async () => {
    render(<Designer template={makeTreeTemplate()} />);

    await screen.findByTestId('report-tree-component-text-alpha');

    act(() => {
      useDesignerStore.getState().selectComponents(['text-alpha']);
    });

    const page = useDesignerStore.getState().template.pages[0];
    const dataBand = page.bands.find((band) => band.type === 'data')!;
    fireEvent.click(screen.getByTestId(`report-tree-band-${dataBand.id}`));

    await waitFor(() => {
      const state = useDesignerStore.getState();
      expect(state.selectedComponentIds).toEqual([]);
      expect(state.selectedBandId).toBe(dataBand.id);
    });
  });
});
