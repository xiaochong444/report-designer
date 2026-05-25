/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
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

describe('Phase 10 page properties', () => {
  it('shows page settings when no component or band is selected', () => {
    render(<Designer template={createDefaultTemplate('Page Properties')} locale="en-US" />);

    const propertyGrid = screen.getByTestId('designer-property-grid');
    expect(within(propertyGrid).getByText('Page Settings')).toBeInTheDocument();

    const pageProperties = screen.getByTestId('designer-page-properties');
    expect(within(pageProperties).getByLabelText('Paper type')).toBeInTheDocument();
    expect(within(pageProperties).getByLabelText('Report unit')).toBeInTheDocument();
    expect(pageProperties).toHaveTextContent('Width');
    expect(pageProperties).toHaveTextContent('Height');
    expect(pageProperties).toHaveTextContent('Orientation');
    expect(pageProperties).toHaveTextContent('Page appearance');
    expect(pageProperties).toHaveTextContent('Top');
    expect(pageProperties).toHaveTextContent('Right');
    expect(pageProperties).toHaveTextContent('Bottom');
    expect(pageProperties).toHaveTextContent('Left');
    expect(pageProperties).toHaveTextContent('A4');
    expect(pageProperties).toHaveTextContent('Millimeter');
    expect(pageProperties).not.toHaveTextContent('(mm)');
  });

  it('localizes page properties to Chinese by default', () => {
    render(<Designer template={createDefaultTemplate('页面属性')} />);

    const propertyGrid = screen.getByTestId('designer-property-grid');
    expect(within(propertyGrid).getByText('页面设置')).toBeInTheDocument();
    expect(within(propertyGrid).queryByText('Page Settings')).not.toBeInTheDocument();

    const pageProperties = screen.getByTestId('designer-page-properties');
    expect(within(pageProperties).getByLabelText('纸张类型')).toBeInTheDocument();
    expect(within(pageProperties).getByLabelText('报表单位')).toBeInTheDocument();
    expect(pageProperties).toHaveTextContent('宽度');
    expect(pageProperties).toHaveTextContent('高度');
    expect(pageProperties).toHaveTextContent('方向');
    expect(pageProperties).toHaveTextContent('页边距');
    expect(pageProperties).toHaveTextContent('页面外观');
    expect(pageProperties).toHaveTextContent('毫米');
    expect(pageProperties).not.toHaveTextContent('Paper type');
    expect(pageProperties).not.toHaveTextContent('Millimeter');
  });

  it('shows page background color and applies it to the design canvas', () => {
    const template = createDefaultTemplate('页面背景');
    template.pages[0].backgroundColor = '#fff7e6';

    render(<Designer template={template} />);

    const pageProperties = screen.getByTestId('designer-page-properties');
    expect(within(pageProperties).getByLabelText('背景色')).toBeInTheDocument();
    expect(screen.getByTestId('designer-page-sheet')).toHaveStyle({ backgroundColor: '#fff7e6' });
  });

  it('edits the page display name and reflects it in the report tree', () => {
    render(<Designer template={createDefaultTemplate('页面名称')} />);

    const pageProperties = screen.getByTestId('designer-page-properties');
    const nameInput = within(pageProperties).getByLabelText('页面名称');
    fireEvent.change(nameInput, { target: { value: '封面页' } });

    expect(within(screen.getByTestId('designer-left-panel')).getByText('封面页')).toBeInTheDocument();
  });

  it('localizes the page setup dialog to Chinese by default', async () => {
    render(<Designer template={createDefaultTemplate('页面设置弹窗')} />);

    fireEvent.click(screen.getByRole('button', { name: '页面布局' }));
    fireEvent.click(screen.getByRole('button', { name: /页面设置/ }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('页面设置')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('纸张类型')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('报表单位')).toBeInTheDocument();
    expect(within(dialog).getByText('页面外观')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('启用水印')).toBeInTheDocument();
    expect(within(dialog).getByText('纵向')).toBeInTheDocument();
    expect(within(dialog).getByText('横向')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /应\s*用/ })).toBeInTheDocument();
    expect(within(dialog).queryByText('Page Setup')).not.toBeInTheDocument();
  });

  it('edits page name and background from the page setup dialog', async () => {
    render(<Designer template={createDefaultTemplate('页面设置弹窗编辑')} />);

    fireEvent.click(screen.getByRole('button', { name: '页面布局' }));
    fireEvent.click(screen.getByRole('button', { name: /页面设置/ }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('页面名称'), { target: { value: '明细页' } });
    fireEvent.change(within(dialog).getByLabelText('背景色'), { target: { value: '#fff7e6' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /应\s*用/ }));

    expect(within(screen.getByTestId('designer-left-panel')).getByText('明细页')).toBeInTheDocument();
    expect(screen.getByTestId('designer-page-sheet')).toHaveStyle({ backgroundColor: '#fff7e6' });
  });
});
