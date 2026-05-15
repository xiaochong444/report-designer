/* @vitest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate, type PanelComponent, type ReportComponent } from '@report-designer/core';
import { Designer } from '../components/Designer';
import { PropertyEditor } from '../components/PropertyEditor';
import { DesignerI18nProvider } from '../i18n';
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

const defaultBorder = {
  style: 'solid' as const,
  width: 0.2,
  color: '#94a3b8',
  sides: { top: true, right: true, bottom: true, left: true },
};

function makeText(id: string, text: string, x: number, y: number): ReportComponent {
  return {
    id,
    type: 'text',
    x,
    y,
    width: 42,
    height: 8,
    text,
    font: { family: 'Arial', size: 9, bold: false, italic: false, underline: false, strikethrough: false, color: '#111827' },
    textAlign: 'left',
    verticalAlign: 'middle',
    border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    canGrow: false,
    canShrink: false,
  } as ReportComponent;
}

function makeTemplateWithPanel() {
  const template = createDefaultTemplate('Phase 22 Panel');
  const dataBand = template.pages[0].bands.find(band => band.type === 'data');
  if (!dataBand) throw new Error('Missing data band');
  dataBand.components = [{
    id: 'panel-summary',
    type: 'panel',
    name: 'Summary Panel',
    x: 10,
    y: 8,
    width: 95,
    height: 42,
    backgroundColor: '#f8fafc',
    border: defaultBorder,
    components: [
      makeText('panel-text-total', 'Panel Total', 4, 4),
      { id: 'panel-check', type: 'checkbox', x: 4, y: 16, width: 36, height: 8, checked: true, label: 'Approved' },
      { id: 'panel-subreport', type: 'subreport', x: 46, y: 14, width: 42, height: 18, templateUrl: 'common-components', parameters: {} },
    ],
  } as PanelComponent];
  return template;
}

function dataTransfer(data: Record<string, string>) {
  return {
    getData: (key: string) => data[key] ?? '',
    setData: () => {},
    effectAllowed: 'copy',
    dropEffect: 'copy',
  };
}

function mockPageRect() {
  const page = screen.getByTestId('designer-page-sheet');
  Object.defineProperty(page, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      left: 0,
      top: 0,
      width: 800,
      height: 1100,
      right: 800,
      bottom: 1100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  });
  return page;
}

describe('Phase 22 panel children and subreport designer configuration', () => {
  it('renders existing panel child components on the canvas and selects the parent panel from child content', async () => {
    render(<Designer template={makeTemplateWithPanel()} locale="en-US" />);

    expect(await screen.findByText('Panel Total')).toBeInTheDocument();
    expect(screen.getByTestId('designer-component-checkbox-content')).toHaveTextContent('Approved');
    expect(screen.getByText('Subreport: common-components')).toBeInTheDocument();

    const childContent = screen.getByText('Panel Total');
    const elementFromPoint = vi.fn(() => childContent);
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: elementFromPoint,
    });
    fireEvent.mouseDown(screen.getByTestId('designer-page-sheet'), { clientX: 80, clientY: 150, button: 0 });

    await waitFor(() => {
      expect(useDesignerStore.getState().selectedComponentIds).toEqual(['panel-summary']);
    });
  });

  it('drops palette components into an existing panel as panel children', async () => {
    render(<Designer template={makeTemplateWithPanel()} locale="en-US" />);
    await screen.findByTestId('designer-page-sheet');
    await screen.findByText('Panel Total');
    const page = mockPageRect();

    await act(async () => {
      const event = new Event('drop', { bubbles: true, cancelable: true }) as DragEvent & { dataTransfer: ReturnType<typeof dataTransfer> };
      Object.defineProperty(event, 'clientX', { value: 50 * 3.78 });
      Object.defineProperty(event, 'clientY', { value: 115 * 3.78 });
      Object.defineProperty(event, 'dataTransfer', { value: dataTransfer({ componentType: 'text' }) });
      page.dispatchEvent(event);
    });

    const dataBand = useDesignerStore.getState().template.pages[0].bands.find(band => band.type === 'data');
    const panel = dataBand?.components.find(component => component.id === 'panel-summary') as PanelComponent | undefined;
    const inserted = panel?.components.find(component => component.type === 'text' && component.id !== 'panel-text-total') as any;

    expect(dataBand?.components).toHaveLength(1);
    expect(inserted).toBeTruthy();
    expect(inserted.x).toBeCloseTo(20, 1);
    expect(inserted.y).toBeCloseTo(6, 1);
    expect(useDesignerStore.getState().selectedComponentIds).toEqual(['panel-summary']);
  });

  it('describes subreport template selection as a local template key in both locales', () => {
    const template = createDefaultTemplate('Phase 22 Subreport');
    const subreport = {
      id: 'subreport-1',
      type: 'subreport',
      x: 0,
      y: 0,
      width: 80,
      height: 30,
      templateUrl: 'common-components',
      parameters: {},
    } as ReportComponent;
    template.pages[0].bands.find(band => band.type === 'data')!.components = [subreport];

    act(() => {
      useDesignerStore.getState().loadTemplate(template);
      useDesignerStore.getState().selectComponents(['subreport-1']);
    });
    const { rerender } = render(
      <DesignerI18nProvider locale="zh-CN">
        <PropertyEditor />
      </DesignerI18nProvider>,
    );

    expect(screen.getByLabelText('本地模板键/名称')).toHaveValue('common-components');
    expect(screen.queryByText('模板地址')).not.toBeInTheDocument();

    rerender(
      <DesignerI18nProvider locale="en-US">
        <PropertyEditor />
      </DesignerI18nProvider>,
    );

    expect(screen.getByLabelText('Local template key/name')).toHaveValue('common-components');
    expect(screen.queryByText('Template URL')).not.toBeInTheDocument();
  });
});
