/* @vitest-environment jsdom */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { ReportComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { Canvas } from '../components/Canvas';
import { Designer } from '../components/Designer';
import { PropertyEditor } from '../components/PropertyEditor';
import { useDesignerStore } from '../store/designer-store';

function textComponent(overrides: Partial<ReportComponent> = {}) {
  return {
    id: 'text-1',
    type: 'text',
    name: 'Text1',
    x: 10,
    y: 10,
    width: 50,
    height: 12,
    text: 'Plain text',
    font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
    textAlign: 'left',
    verticalAlign: 'top',
    border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    canGrow: false,
    canShrink: false,
    ...overrides,
  } as ReportComponent;
}

function loadSingleComponent(component: ReportComponent) {
  const template = createDefaultTemplate('Phase 18 Properties');
  template.pages[0].bands.find(band => band.type === 'data')!.components = [component];
  act(() => {
    useDesignerStore.getState().loadTemplate(template);
    useDesignerStore.getState().selectComponents([component.id]);
  });
  return template;
}

function dataTransfer(data: Record<string, string>) {
  return {
    types: Object.keys(data),
    getData: (key: string) => data[key] ?? '',
    setData: () => {},
    effectAllowed: 'copy',
    dropEffect: 'copy',
  };
}

function dispatchDragOver(target: HTMLElement, data: Record<string, string>) {
  const event = new Event('dragover', { bubbles: true, cancelable: true }) as DragEvent & { dataTransfer: ReturnType<typeof dataTransfer> };
  Object.defineProperty(event, 'dataTransfer', { value: dataTransfer(data) });
  target.dispatchEvent(event);
  return event;
}

function mockCanvasRects() {
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

  const dataBand = screen.getByTestId('designer-band-frame-data');
  Object.defineProperty(dataBand, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      left: 0,
      top: 100,
      width: 800,
      height: 120,
      right: 800,
      bottom: 220,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    }),
  });
}

function componentBand(type: string) {
  return useDesignerStore.getState().template.pages[0].bands.find(band => band.type === type)!;
}

function components() {
  return useDesignerStore.getState().template.pages[0].bands.flatMap(band => band.components) as any[];
}

describe('Phase 18 component properties and canvas drag drop', () => {
  it('renders a compact grouped component toolbox for dragging components', async () => {
    const template = createDefaultTemplate('Phase 18 Palette');
    render(<Designer template={template} locale="zh-CN" />);

    fireEvent.click(screen.getByRole('button', { name: '组件' }));

    expect(screen.getByTestId('component-palette')).toBeInTheDocument();
    expect(screen.getByTestId('component-palette-group-common')).toBeInTheDocument();
    expect(screen.getByTestId('component-palette-group-data')).toBeInTheDocument();
    expect(screen.getByTestId('component-palette-item-richtext')).toHaveAttribute('draggable', 'true');
    expect(screen.getByTestId('component-palette-item-image')).toHaveTextContent('图片');
  });

  it('drops a palette component directly on the canvas sheet', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const template = createDefaultTemplate('Phase 18 Canvas Drop');
    render(<Designer template={template} locale="zh-CN" />);

    await waitFor(() => expect(screen.getByTestId('designer-page-sheet')).toBeInTheDocument());
    mockCanvasRects();

    await act(async () => {
      fireEvent.drop(screen.getByTestId('designer-page-sheet'), {
        clientX: 30,
        clientY: 130,
        dataTransfer: dataTransfer({ componentType: 'text' }),
      });
    });

    const inserted = components().find(component => component.type === 'text');
    expect(inserted).toBeTruthy();
    expect(inserted.text).toBe('');
    expect(inserted.dataSource).toBeUndefined();
    expect(useDesignerStore.getState().selectedComponentIds).toEqual([inserted.id]);
    expect(errorSpy.mock.calls.some(call => call.some(arg => String(arg).includes('NaN')))).toBe(false);
    errorSpy.mockRestore();
  });

  it('allows real browser palette drags whose data transfer types are lowercased', async () => {
    const template = createDefaultTemplate('Phase 18 Browser Drag');
    render(<Designer template={template} locale="zh-CN" />);

    await waitFor(() => expect(screen.getByTestId('designer-page-sheet')).toBeInTheDocument());
    const event = dispatchDragOver(screen.getByTestId('designer-page-sheet'), { componenttype: 'text' });

    expect(event.defaultPrevented).toBe(true);
    expect(event.dataTransfer.dropEffect).toBe('copy');
  });

  it('drops a dictionary field as a single text expression without component dataSource metadata', async () => {
    const template = createDefaultTemplate('Phase 18 Field Drop');
    template.dataSources = [{
      id: 'employees',
      name: 'Employees',
      type: 'json',
      schema: [{ name: 'Salary', type: 'number' }],
    }];
    template.styles = [];
    render(<Designer template={template} locale="zh-CN" />);

    await waitFor(() => expect(screen.getByTestId('designer-page-sheet')).toBeInTheDocument());
    mockCanvasRects();

    await act(async () => {
      fireEvent.drop(screen.getByTestId('designer-page-sheet'), {
        clientX: 40,
        clientY: 135,
        dataTransfer: dataTransfer({
          fieldBinding: JSON.stringify({ dataSourceId: 'employees', fieldName: 'Salary', fieldType: 'number' }),
        }),
      });
    });

    const inserted = components().find(component => component.type === 'text');
    expect(inserted.text).toBe('{employees.Salary}');
    expect(inserted.dataSource).toBeUndefined();
    expect(inserted.format).toMatchObject({ type: 'number' });
  });

  it('drops dictionary system variables and functions as text expressions', async () => {
    const template = createDefaultTemplate('Phase 18 Expression Drop');
    render(<Designer template={template} locale="zh-CN" />);

    await waitFor(() => expect(screen.getByTestId('designer-page-sheet')).toBeInTheDocument());
    mockCanvasRects();

    await act(async () => {
      fireEvent.drop(screen.getByTestId('designer-page-sheet'), {
        clientX: 40,
        clientY: 135,
        dataTransfer: dataTransfer({ expressionBinding: '{PageNumber}' }),
      });
    });

    const inserted = components().find(component => component.type === 'text');
    expect(inserted.text).toBe('{PageNumber}');
    expect(inserted.dataSource).toBeUndefined();
  });

  it('moves a dragged component to the band under its final position and shows the target band hint', async () => {
    const component = textComponent({ id: 'text-drag', y: 5 });
    const template = createDefaultTemplate('Phase 18 Cross Band Move');
    template.pages[0].bands.find(band => band.type === 'data')!.components = [component];
    useDesignerStore.getState().loadTemplate(template);

    render(<Canvas />);

    const componentElement = document.querySelector('[data-component-id="text-drag"]') as HTMLElement;
    expect(componentElement).toBeTruthy();
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => componentElement),
    });

    fireEvent.mouseDown(componentElement, { button: 0, clientX: 40, clientY: 240 });
    fireEvent.mouseMove(window, { clientX: 40, clientY: 30 });

    expect(screen.getByTestId('designer-component-move-band-target')).toHaveTextContent('报表标题带');

    fireEvent.mouseUp(window, { clientX: 40, clientY: 30 });

    const reportTitleBand = componentBand('reportTitle');
    const dataBand = componentBand('data');
    expect(reportTitleBand.components.map(item => item.id)).toContain('text-drag');
    expect(dataBand.components.map(item => item.id)).not.toContain('text-drag');

    act(() => {
      useDesignerStore.getState().undo();
    });

    expect(componentBand('data').components.map(item => item.id)).toContain('text-drag');
    expect(componentBand('reportTitle').components.map(item => item.id)).not.toContain('text-drag');
  });

  it('shows text content as the only binding entry for text components', () => {
    loadSingleComponent(textComponent());
    render(<PropertyEditor />);

    const textContent = screen.getByLabelText('文本内容');
    fireEvent.change(textContent, { target: { value: 'Total: {Sum(employees.Salary)}' } });

    expect(components()[0].text).toBe('Total: {Sum(employees.Salary)}');
    expect(screen.queryByLabelText('绑定字段')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('数据源')).not.toBeInTheDocument();
    expect(screen.queryByText('数据绑定')).not.toBeInTheDocument();
  });

  it('edits image source as a direct URL and uploads image files as base64 data URLs', async () => {
    loadSingleComponent({
      id: 'image-1',
      type: 'image',
      name: 'Image1',
      x: 0,
      y: 0,
      width: 30,
      height: 30,
      src: '',
      fitMode: 'contain',
    } as ReportComponent);
    render(<PropertyEditor />);

    fireEvent.change(screen.getByLabelText('图片地址/Base64'), {
      target: { value: 'https://example.com/logo.png' },
    });
    expect(components()[0].src).toBe('https://example.com/logo.png');

    class MockFileReader {
      result: string | ArrayBuffer | null = null;
      onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
      onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
      readAsDataURL() {
        this.result = 'data:image/png;base64,ZmFrZQ==';
        this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>);
      }
    }
    vi.stubGlobal('FileReader', MockFileReader);

    const fileInput = screen.getByLabelText('上传图片') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(['fake'], 'logo.png', { type: 'image/png' })] },
    });

    await waitFor(() => expect(components()[0].src).toBe('data:image/png;base64,ZmFrZQ=='));
    vi.unstubAllGlobals();
  });

  it('renders rich text html on the design canvas', async () => {
    const template = createDefaultTemplate('Phase 18 Rich Text Canvas');
    template.pages[0].bands.find(band => band.type === 'data')!.components = [{
      id: 'rich-1',
      type: 'richtext',
      name: 'Rich1',
      x: 10,
      y: 10,
      width: 70,
      height: 14,
      html: '<strong>Rich note</strong>',
    } as ReportComponent];

    render(<Designer template={template} locale="zh-CN" />);

    await waitFor(() => expect(screen.getByText('Rich note')).toBeInTheDocument());
  });

  it('renders common non-text components with meaningful canvas previews', async () => {
    const template = createDefaultTemplate('Phase 18 Common Component Canvas');
    template.pages[0].bands.find(band => band.type === 'data')!.components = [
      { id: 'barcode-1', type: 'barcode', name: 'Barcode1', x: 0, y: 0, width: 40, height: 16, value: 'ORD-1001', format: 'CODE128', showText: true },
      { id: 'qrcode-1', type: 'qrcode', name: 'QRCode1', x: 48, y: 0, width: 18, height: 18, value: 'https://example.test/order/ORD-1001', format: 'QR_CODE' } as any,
      { id: 'checkbox-1', type: 'checkbox', name: 'Check1', x: 0, y: 18, width: 40, height: 8, checked: 'true', label: 'Paid' },
      { id: 'page-1', type: 'pagenumber', name: 'PageNumber1', x: 0, y: 28, width: 30, height: 8, format: 'Page 1 of N', font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' }, textAlign: 'center' },
      { id: 'date-1', type: 'datetime', name: 'DateTime1', x: 0, y: 38, width: 40, height: 8, format: 'yyyy-MM-dd', font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' }, textAlign: 'left' },
    ] as unknown as ReportComponent[];

    render(<Designer template={template} locale="zh-CN" />);

    await waitFor(() => expect(screen.getByTestId('designer-component-barcode-content')).toHaveTextContent('ORD-1001'));
    expect(screen.getByTestId('designer-component-qrcode-content')).toBeInTheDocument();
    expect(screen.getByTestId('designer-component-checkbox-content')).toHaveTextContent('✓');
    expect(screen.getByTestId('designer-component-checkbox-content')).toHaveTextContent('Paid');
    expect(screen.getByTestId('designer-component-pagenumber-content')).toHaveTextContent('Page 1 of 1');
    expect(screen.getByTestId('designer-component-datetime-content')).toHaveTextContent(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('shows component-specific content properties for common non-text components', () => {
    const cases: Array<{ component: ReportComponent; expectedLabels: string[] }> = [
      { component: { id: 'image-1', type: 'image', name: 'Image1', x: 0, y: 0, width: 30, height: 30, src: '{Products.Photo}', fitMode: 'contain' } as ReportComponent, expectedLabels: ['图片地址/Base64', '适应方式'] },
      { component: { id: 'barcode-1', type: 'barcode', name: 'Barcode1', x: 0, y: 0, width: 30, height: 20, value: '{Order.No}', format: 'CODE128', showText: true } as ReportComponent, expectedLabels: ['条码内容', '条码类型', '显示文本'] },
      { component: { id: 'qrcode-1', type: 'qrcode', name: 'QRCode1', x: 0, y: 0, width: 24, height: 24, value: '{Order.Url}', format: 'QR_CODE' } as ReportComponent, expectedLabels: ['二维码内容', '二维码类型'] },
      { component: { id: 'checkbox-1', type: 'checkbox', name: 'Check1', x: 0, y: 0, width: 15, height: 15, checked: '{Paid}', label: 'Paid' } as ReportComponent, expectedLabels: ['选中表达式', '标签文本'] },
      { component: { id: 'rich-1', type: 'richtext', name: 'Rich1', x: 0, y: 0, width: 60, height: 20, html: '<b>{Note}</b>' } as ReportComponent, expectedLabels: ['富文本内容'] },
      { component: { id: 'line-1', type: 'line', name: 'Line1', x: 0, y: 0, width: 40, height: 10, startX: 0, startY: 0, endX: 40, endY: 0, lineColor: '#000000', lineWidth: 0.2, lineStyle: 'solid' } as ReportComponent, expectedLabels: ['颜色', '起点 X', '终点 Y'] },
      { component: { id: 'shape-1', type: 'shape', name: 'Shape1', x: 0, y: 0, width: 30, height: 20, shapeType: 'rectangle', fillColor: '#ffffff', borderColor: '#000000', borderWidth: 0.2, borderStyle: 'solid' } as ReportComponent, expectedLabels: ['形状类型', '填充色', '边框色'] },
      { component: { id: 'page-1', type: 'pagenumber', name: 'PageNumber1', x: 0, y: 0, width: 30, height: 8, format: '1/N', font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' }, textAlign: 'center' } as ReportComponent, expectedLabels: ['格式', '水平对齐', '垂直对齐'] },
      { component: { id: 'date-1', type: 'datetime', name: 'DateTime1', x: 0, y: 0, width: 40, height: 8, format: 'yyyy-MM-dd', font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' }, textAlign: 'left' } as ReportComponent, expectedLabels: ['格式', '水平对齐', '垂直对齐'] },
    ];

    for (const item of cases) {
      cleanup();
      loadSingleComponent(item.component);
      render(<PropertyEditor />);
      for (const label of item.expectedLabels) {
        expect(screen.queryByLabelText(label) ?? screen.getByText(label)).toBeInTheDocument();
      }
    }
  });
});
