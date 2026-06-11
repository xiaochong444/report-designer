/* @vitest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { ReportComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { LeftPanel } from '../components/LeftPanel';
import { PropertyEditor } from '../components/PropertyEditor';
import { useDesignerStore } from '../store/designer-store';

function loadText() {
  const component = {
    id: 'text-1',
    type: 'text',
    x: 10,
    y: 10,
    width: 40,
    height: 8,
    text: 'Name',
    font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
    textAlign: 'left',
    verticalAlign: 'top',
    border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    canGrow: false,
    canShrink: false,
  } as ReportComponent;
  const template = createDefaultTemplate('Phase 9 Designer');
  template.dataSources = [{ id: 'root', name: 'root', type: 'json', schema: [{ name: 'employees.Salary', type: 'number' }] }];
  template.styles = [{
    id: 'total-style',
    name: 'Total',
    font: { family: 'Arial', size: 12, bold: true, italic: false, underline: false, strikethrough: false, color: '#ff0000' },
    border: { style: 'solid', width: 0.2, color: '#ff0000', sides: { top: true, right: false, bottom: true, left: false } },
    backgroundColor: '#fff7e6',
  }];
  template.pages[0].bands.find(band => band.type === 'data')!.components.push(component);
  useDesignerStore.getState().loadTemplate(template);
  useDesignerStore.getState().selectComponents([component.id]);
}

function selectedText() {
  return useDesignerStore.getState().template.pages[0].bands.flatMap(band => band.components)[0] as any;
}

function setupDropSurface() {
  const page = document.createElement('div');
  page.setAttribute('data-page', '');
  Object.defineProperty(page, 'getBoundingClientRect', {
    value: () => ({
      left: 0,
      top: 0,
      width: 400,
      height: 200,
      right: 400,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  });

  const band = document.createElement('div');
  band.setAttribute('data-band-id', useDesignerStore.getState().template.pages[0].bands.find(item => item.type === 'data')!.id);
  Object.defineProperty(band, 'getBoundingClientRect', {
    value: () => ({
      left: 0,
      top: 0,
      width: 400,
      height: 200,
      right: 400,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  });

  page.appendChild(band);
  document.body.appendChild(page);

  return () => {
    page.remove();
  };
}

function textComponents() {
  return useDesignerStore.getState().template.pages[0].bands
    .flatMap(band => band.components)
    .filter((component: any) => component.type === 'text') as any[];
}

describe('Phase 9 text binding and style UI', () => {
  it('stores text binding as a single text content expression in the property panel', async () => {
    loadText();
    render(<PropertyEditor />);

    fireEvent.change(screen.getByLabelText('文本内容'), {
      target: { value: '{employees.Salary}' },
    });

    expect(selectedText().text).toBe('{employees.Salary}');
    expect(selectedText().dataSource).toBeUndefined();
    expect(screen.queryByLabelText('绑定字段')).not.toBeInTheDocument();
    expect(screen.queryByText('数据绑定')).not.toBeInTheDocument();
  });

  it('applies a named style set and locks style-managed format properties in the property panel', async () => {
    loadText();
    render(<PropertyEditor />);

    fireEvent.mouseDown(screen.getByLabelText('文本样式'));
    fireEvent.click(await screen.findByText('Total'));

    await waitFor(() => expect(selectedText().style).toBe('total-style'));
    expect(selectedText().font.bold).toBe(true);
    expect(selectedText().backgroundColor).toBe('#fff7e6');
    expect(selectedText().format).toBeUndefined();
    expect(screen.getByLabelText('格式类型')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByLabelText('格式模式')).not.toBeInTheDocument();
  });

  it('keeps the resolved style values when unbinding a selected text style', async () => {
    loadText();
    useDesignerStore.getState().applySelectedStyle('total-style');

    expect(selectedText().style).toBe('total-style');

    useDesignerStore.getState().unbindSelectedStyle();

    expect(selectedText().style).toBeUndefined();
    expect(selectedText().font.bold).toBe(true);
    expect(selectedText().backgroundColor).toBe('#fff7e6');
  });

  it('keeps default style formatting locked when dropping fields into a styled text template', async () => {
    const template = createDefaultTemplate('Phase 9 Field Drop');
    template.dataSources = [{
      id: 'root',
      name: 'root',
      type: 'json',
      schema: [
        { name: 'employees.Salary', type: 'number' },
        { name: 'employees.HireDate', type: 'date' },
      ],
    }];
    template.styles = [{
      id: 'default-style',
      name: 'Default',
      category: 'text',
      isDefault: true,
      font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
      backgroundColor: '#fafafa',
      textAlign: 'center',
      verticalAlign: 'middle',
      format: { type: 'currency', pattern: 'C2', nullValue: 'n/a' },
      canGrow: false,
      canShrink: false,
    }];
    useDesignerStore.getState().loadTemplate(template);

    const cleanupSurface = setupDropSurface();
    render(<LeftPanel />);
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /组件/ }));
    });

    const dropTarget = screen.getByText('将常用报表组件拖入选中的带区。').parentElement as HTMLElement;
    const makeTransfer = (fieldName: string, fieldType: string) => ({
      getData: (key: string) => key === 'fieldBinding' ? JSON.stringify({ dataSourceId: 'root', fieldName: `employees.${fieldName}`, fieldType }) : '',
      effectAllowed: 'copy',
      dropEffect: 'copy',
      setData: () => {},
    });

    await act(async () => {
      fireEvent.drop(dropTarget, { clientX: 20, clientY: 20, dataTransfer: makeTransfer('Salary', 'number') });
      fireEvent.drop(dropTarget, { clientX: 40, clientY: 40, dataTransfer: makeTransfer('HireDate', 'date') });
    });

    const [salaryText, hireDateText] = textComponents();

    expect(salaryText.text).toBe('{employees.Salary}');
    expect(hireDateText.text).toBe('{employees.HireDate}');
    expect(salaryText.style).toBe('default-style');
    expect(salaryText.textAlign).toBe('center');
    expect(salaryText.format).toMatchObject({ type: 'currency', pattern: 'C2', nullValue: 'n/a' });

    expect(hireDateText.style).toBe('default-style');
    expect(hireDateText.format).toMatchObject({ type: 'currency', pattern: 'C2', nullValue: 'n/a' });

    await act(async () => {
      useDesignerStore.getState().updateTextStyle('default-style', {
        ...template.styles[0],
        textAlign: 'left',
        format: { type: 'percent', pattern: 'P2', nullValue: '--' },
      });
    });

    expect(textComponents()[0].textAlign).toBe('left');
    expect(textComponents()[0].format).toMatchObject({ type: 'percent', pattern: 'P2', nullValue: '--' });
    expect(textComponents()[1].format).toMatchObject({ type: 'percent', pattern: 'P2', nullValue: '--' });

    cleanupSurface();
  });
});
