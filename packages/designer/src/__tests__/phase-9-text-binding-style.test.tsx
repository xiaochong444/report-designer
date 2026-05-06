/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { ReportComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
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
  template.dataSources = [{ id: 'employees', name: 'employees', type: 'json', schema: [{ name: 'Salary', type: 'number' }] }];
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

describe('Phase 9 text binding and style UI', () => {
  it('binds selected text to a data field from the property panel', async () => {
    loadText();
    render(<PropertyEditor />);

    fireEvent.mouseDown(screen.getByLabelText('绑定字段'));
    fireEvent.click(await screen.findByText('Salary'));

    expect(selectedText().text).toBe('{employees.Salary}');
    expect(selectedText().dataSource).toBe('employees');
  });

  it('applies a named style set and text format from the property panel', async () => {
    loadText();
    render(<PropertyEditor />);

    fireEvent.mouseDown(screen.getByLabelText('文本样式'));
    fireEvent.click(await screen.findByText('Total'));
    fireEvent.mouseDown(screen.getByLabelText('格式类型'));
    fireEvent.click(await screen.findByText('数字'));
    fireEvent.change(screen.getByLabelText('格式模式'), { target: { value: '#,##0.00' } });

    await waitFor(() => expect(selectedText().style).toBe('total-style'));
    expect(selectedText().font.bold).toBe(true);
    expect(selectedText().backgroundColor).toBe('#fff7e6');
    expect(selectedText().format).toEqual({ type: 'number', pattern: '#,##0.00' });
  });
});
