/* @vitest-environment jsdom */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { createDefaultTemplate } from '@report-designer/core';
import type { ReportComponent, ReportTemplate } from '@report-designer/core';
import { PropertyEditor } from '../components/PropertyEditor';
import { useDesignerStore } from '../store/designer-store';

function loadSelectedComponent(component: ReportComponent, prepare?: (template: ReportTemplate) => void) {
  const template = createDefaultTemplate('Phase 33 Property Matrix');
  prepare?.(template);
  const dataBand = template.pages[0].bands.find(band => band.type === 'data');
  if (!dataBand) throw new Error('Missing data band');
  dataBand.components = [component];

  act(() => {
    useDesignerStore.getState().loadTemplate(template);
    useDesignerStore.getState().selectComponents([component.id]);
  });
}

function expectVisible(...labels: string[]) {
  for (const label of labels) {
    expect(screen.getByText(label)).toBeInTheDocument();
  }
}

function expectHidden(...labels: string[]) {
  for (const label of labels) {
    expect(screen.queryByText(label)).not.toBeInTheDocument();
  }
}

function selectedComponent() {
  return useDesignerStore.getState().template.pages[0].bands.flatMap(band => band.components)[0] as any;
}

describe('phase 33 component property matrix', () => {
  it('shows text component content, text style, font, border, and appearance groups', () => {
    loadSelectedComponent({
      id: 'text-1',
      type: 'text',
      name: 'Text1',
      x: 0,
      y: 0,
      width: 60,
      height: 12,
      text: 'Hello',
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      textAlign: 'left',
      verticalAlign: 'top',
      border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
      canGrow: false,
      canShrink: false,
    } as ReportComponent);

    render(<PropertyEditor />);

    expect(screen.getByLabelText('文本内容')).toBeInTheDocument();
    expectVisible('字体', '边框', '外观', '行为');
    expectHidden('表格', '线条属性', '形状属性', '页码属性', '日期时间属性');
    expect((screen.getByLabelText('边框宽度') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('内边距上') as HTMLInputElement).value).toBe('');
    expect(screen.getByLabelText('上')).not.toBeChecked();
    expect(screen.getByLabelText('右')).not.toBeChecked();
    expect(screen.getByLabelText('下')).not.toBeChecked();
    expect(screen.getByLabelText('左')).not.toBeChecked();
  });

  it('shows image content controls with appearance styling but without font or table groups', () => {
    loadSelectedComponent({
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

    expect(screen.getByLabelText('图片地址/Base64')).toBeInTheDocument();
    expect(screen.getByLabelText('适应方式')).toBeInTheDocument();
    expectVisible('边框', '外观');
    expectHidden('字体', '表格', '线条属性', '形状属性', '页码属性', '日期时间属性');
  });

  it('shows barcode and checkbox foreground and font styling controls', () => {
    loadSelectedComponent({
      id: 'barcode-1',
      type: 'barcode',
      name: 'Barcode1',
      x: 0,
      y: 0,
      width: 40,
      height: 16,
      value: 'A-100',
      format: 'CODE128',
      showText: true,
    } as ReportComponent);
    render(<PropertyEditor />);

    expect(screen.getByLabelText('前景色')).toBeInTheDocument();
    expect(screen.getByLabelText('字体系列')).toBeInTheDocument();
    expectVisible('字体', '边框', '外观');
    expectHidden('表格', '线条属性', '形状属性');

    fireEvent.change(screen.getByLabelText('前景色'), { target: { value: '#123456' } });
    fireEvent.change(screen.getByLabelText('字号'), { target: { value: '16' } });
    fireEvent.click(screen.getByRole('button', { name: '加粗' }));
    expect(selectedComponent().foregroundColor).toBe('#123456');
    expect(selectedComponent().font).toMatchObject({ size: 16, bold: true });

    cleanup();
    loadSelectedComponent({
      id: 'checkbox-1',
      type: 'checkbox',
      name: 'Checkbox1',
      x: 0,
      y: 0,
      width: 40,
      height: 8,
      checked: 'true',
      label: 'Paid',
    } as ReportComponent);
    render(<PropertyEditor />);

    expect(screen.getByLabelText('前景色')).toBeInTheDocument();
    expect(screen.getByLabelText('字体系列')).toBeInTheDocument();
    expectVisible('字体', '边框', '外观');
    expectHidden('表格', '线条属性', '形状属性');

    fireEvent.change(screen.getByLabelText('前景色'), { target: { value: '#654321' } });
    fireEvent.change(screen.getByLabelText('字号'), { target: { value: '14' } });
    fireEvent.click(screen.getByRole('button', { name: '斜体' }));
    expect(selectedComponent().foregroundColor).toBe('#654321');
    expect(selectedComponent().font).toMatchObject({ size: 14, italic: true });
  });

  it('shows line and shape only with their own drawing groups', () => {
    loadSelectedComponent({
      id: 'line-1',
      type: 'line',
      name: 'Line1',
      x: 0,
      y: 0,
      width: 40,
      height: 10,
      startX: 0,
      startY: 0,
      endX: 40,
      endY: 0,
      lineColor: '#000000',
      lineWidth: 0.2,
      lineStyle: 'solid',
    } as ReportComponent);
    render(<PropertyEditor />);

    expectVisible('线条属性');
    expectHidden('字体', '边框', '外观', '表格', '形状属性');

    cleanup();
    loadSelectedComponent({
      id: 'shape-1',
      type: 'shape',
      name: 'Shape1',
      x: 0,
      y: 0,
      width: 30,
      height: 20,
      shapeType: 'rectangle',
      fillColor: '#ffffff',
      borderColor: '#000000',
      borderWidth: 0.2,
      borderStyle: 'solid',
    } as ReportComponent);
    render(<PropertyEditor />);

    expectVisible('形状属性');
    expectHidden('字体', '边框', '外观', '表格', '线条属性');
  });

  it('shows table group only for table components', () => {
    loadSelectedComponent({
      id: 'table-1',
      type: 'table',
      name: 'Table1',
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      rowCount: 1,
      columnCount: 3,
      rows: [{ id: 'row-1', height: 8, cells: [{ id: 'cell-1' }, { id: 'cell-2' }, { id: 'cell-3' }] }],
      showBorder: true,
    } as ReportComponent);

    render(<PropertyEditor />);

    expectVisible('表格');
    expect(screen.getByLabelText('列数')).toBeInTheDocument();
    expect(screen.getByLabelText('行数')).toBeInTheDocument();
    expect(screen.queryByLabelText('绑定数组属性')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('表格数据源')).not.toBeInTheDocument();
    expectHidden('字体', '线条属性', '形状属性', '页码属性', '日期时间属性');
  });

  it('shows font and format groups for page number and date time components', () => {
    loadSelectedComponent({
      id: 'page-1',
      type: 'pagenumber',
      name: 'PageNumber1',
      x: 0,
      y: 0,
      width: 30,
      height: 8,
      format: '1/N',
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      textAlign: 'center',
      verticalAlign: 'middle',
    } as ReportComponent);
    render(<PropertyEditor />);

    expectVisible('字体', '边框', '外观', '页码属性');
    expectHidden('表格', '线条属性', '形状属性');

    cleanup();
    loadSelectedComponent({
      id: 'date-1',
      type: 'datetime',
      name: 'DateTime1',
      x: 0,
      y: 0,
      width: 40,
      height: 8,
      format: 'yyyy-MM-dd',
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      textAlign: 'left',
      verticalAlign: 'middle',
    } as ReportComponent);
    render(<PropertyEditor />);

    expectVisible('字体', '边框', '外观', '日期时间属性');
    expectHidden('表格', '线条属性', '形状属性');
  });
});
