/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate, type ReportTemplate } from '@report-designer/core';
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

function makeTemplate(name = '页面外观'): ReportTemplate {
  return createDefaultTemplate(name);
}

describe('Phase 32 designer page appearance', () => {
  it('shows page appearance controls when no component is selected', () => {
    render(<Designer template={makeTemplate()} />);

    const pageProperties = screen.getByTestId('designer-page-properties');
    expect(within(pageProperties).getByText('页面外观')).toBeInTheDocument();
    expect(within(pageProperties).getByLabelText('启用水印')).toBeInTheDocument();
    expect(within(pageProperties).getByLabelText('启用页面边框')).toBeInTheDocument();
  });

  it('edits the page watermark from the page properties and renders it on the canvas', () => {
    render(<Designer template={makeTemplate('水印编辑')} />);

    const pageProperties = screen.getByTestId('designer-page-properties');
    fireEvent.click(within(pageProperties).getByLabelText('启用水印'));
    fireEvent.change(within(pageProperties).getByLabelText('水印文本'), { target: { value: '内部资料' } });
    fireEvent.change(within(pageProperties).getByLabelText('水印角度'), { target: { value: '-25' } });
    fireEvent.change(within(pageProperties).getByLabelText('水印透明度'), { target: { value: '0.35' } });

    const watermark = screen.getByTestId('designer-page-watermark');
    expect(watermark).toHaveTextContent('内部资料');
    expect(watermark).toHaveStyle({ opacity: '0.35' });
    expect(watermark.firstElementChild).toHaveStyle({ transform: 'rotate(-25deg)' });
  });

  it('edits the page border from the page properties and renders it on the canvas', () => {
    render(<Designer template={makeTemplate('边框编辑')} />);

    const pageProperties = screen.getByTestId('designer-page-properties');
    fireEvent.click(within(pageProperties).getByLabelText('启用页面边框'));
    fireEvent.click(within(pageProperties).getByRole('radio', { name: '虚线' }));
    fireEvent.change(within(pageProperties).getByLabelText('边框颜色'), { target: { value: '#1677ff' } });
    fireEvent.change(within(pageProperties).getByLabelText('边框宽度'), { target: { value: '0.6' } });
    fireEvent.click(within(pageProperties).getByLabelText('右'));

    const border = screen.getByTestId('designer-page-border');
    expect(border).toHaveStyle({
      borderTop: '0.6mm dashed #1677ff',
      borderRight: 'none',
      borderBottom: '0.6mm dashed #1677ff',
      borderLeft: '0.6mm dashed #1677ff',
    });
  });

  it('applies page setup dialog watermark and border edits to the store and canvas', async () => {
    const onTemplateChange = vi.fn();
    render(<Designer template={makeTemplate('弹窗外观')} onTemplateChange={onTemplateChange} />);

    fireEvent.click(screen.getByRole('button', { name: '页面布局' }));
    fireEvent.click(screen.getByRole('button', { name: /页面设置/ }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByLabelText('启用水印'));
    fireEvent.change(within(dialog).getByLabelText('水印文本'), { target: { value: '草稿' } });
    fireEvent.click(within(dialog).getByLabelText('启用页面边框'));
    fireEvent.change(within(dialog).getByLabelText('边框颜色'), { target: { value: '#ff4d4f' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /应\s*用/ }));

    expect(screen.getByTestId('designer-page-watermark')).toHaveTextContent('草稿');
    expect(screen.getByTestId('designer-page-border')).toHaveStyle({ borderTopColor: '#ff4d4f' });

    await waitFor(() => {
      const latest = onTemplateChange.mock.calls.at(-1)?.[0] as ReportTemplate | undefined;
      expect(latest?.pages[0].watermark?.text).toBe('草稿');
      expect(latest?.pages[0].pageBorder?.color).toBe('#ff4d4f');
    });
  });

  it('localizes page appearance labels to English', () => {
    render(<Designer template={makeTemplate('Page appearance')} locale="en-US" />);

    const pageProperties = screen.getByTestId('designer-page-properties');
    expect(within(pageProperties).getByText('Page appearance')).toBeInTheDocument();
    expect(within(pageProperties).getByLabelText('Enable watermark')).toBeInTheDocument();
    expect(within(pageProperties).getByLabelText('Watermark text')).toBeInTheDocument();
    expect(within(pageProperties).getByLabelText('Enable page border')).toBeInTheDocument();
    expect(within(pageProperties).queryByText('页面外观')).not.toBeInTheDocument();
  });
});
