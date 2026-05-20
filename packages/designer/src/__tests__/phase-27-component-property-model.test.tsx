/* @vitest-environment jsdom */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import type { ReportComponent, ReportTemplate } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { PropertyEditor } from '../components/PropertyEditor';
import { useDesignerStore } from '../store/designer-store';

function loadSelectedComponent(component: ReportComponent, prepare?: (template: ReportTemplate) => void) {
  const template = createDefaultTemplate('Phase 27 Property Model');
  prepare?.(template);
  const dataBand = template.pages[0].bands.find(band => band.type === 'data');
  if (!dataBand) throw new Error('Missing data band');
  dataBand.components = [component];

  act(() => {
    useDesignerStore.getState().loadTemplate(template);
    useDesignerStore.getState().selectComponents([component.id]);
  });
}

function selectedComponent() {
  return useDesignerStore.getState().template.pages[0].bands.flatMap(band => band.components)[0] as any;
}

async function editExpression(buttonName: string, nextValue: string) {
  fireEvent.click(screen.getByRole('button', { name: buttonName }));
  const editor = await screen.findByPlaceholderText('{Sum(Products.UnitPrice * Products.UnitsInStock) - 0}');
  fireEvent.change(editor, { target: { value: nextValue } });
  const confirmButton = document.querySelector('.ant-modal-footer .ant-btn-primary') as HTMLElement | null;
  if (!confirmButton) throw new Error('Expression editor confirm button was not found');
  fireEvent.click(confirmButton);
}

describe('phase 27 component property model', () => {
  it('edits barcode content through the shared expression editor', async () => {
    loadSelectedComponent({
      id: 'barcode-1',
      type: 'barcode',
      name: 'Barcode1',
      x: 0,
      y: 0,
      width: 40,
      height: 16,
      value: 'ORD-1',
      format: 'CODE128',
      showText: true,
    } as ReportComponent);

    render(<PropertyEditor />);

    await editExpression('打开表达式编辑器：条码内容', '{Orders.No}');

    expect(selectedComponent().value).toBe('{Orders.No}');
  });

  it('edits checkbox checked and label fields as expressions', async () => {
    loadSelectedComponent({
      id: 'checkbox-1',
      type: 'checkbox',
      name: 'Check1',
      x: 0,
      y: 0,
      width: 35,
      height: 10,
      checked: '{Orders.Paid}',
      label: 'Paid',
    } as ReportComponent);

    render(<PropertyEditor />);

    await editExpression('打开表达式编辑器：选中表达式', '{Orders.IsPaid}');
    await editExpression('打开表达式编辑器：标签文本', '{Orders.StatusText}');

    expect(selectedComponent().checked).toBe('{Orders.IsPaid}');
    expect(selectedComponent().label).toBe('{Orders.StatusText}');
  });

  it('uses user-facing rich text content wording in properties', () => {
    loadSelectedComponent({
      id: 'rich-1',
      type: 'richtext',
      name: 'Rich1',
      x: 0,
      y: 0,
      width: 70,
      height: 18,
      html: '<p>{Orders.Note}</p>',
    } as ReportComponent);

    render(<PropertyEditor />);

    expect(screen.getByLabelText('富文本内容')).toBeInTheDocument();
    expect(screen.queryByLabelText('HTML 内容')).not.toBeInTheDocument();
  });

  it('only shows the shared font panel for components that render font-backed text', async () => {
    const customFont = {
      id: 'brand-song',
      name: 'Brand Song',
      family: 'BrandSong',
      fallback: 'serif',
    };

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
    } as ReportComponent, template => {
      template.fonts = [...(template.fonts ?? []), customFont];
    });
    render(<PropertyEditor />);
    expect(screen.queryByLabelText('字体系列')).not.toBeInTheDocument();

    cleanup();
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
    } as ReportComponent, template => {
      template.fonts = [...(template.fonts ?? []), customFont];
    });
    render(<PropertyEditor />);
    expect(screen.queryByLabelText('字体系列')).not.toBeInTheDocument();

    cleanup();
    loadSelectedComponent({
      id: 'page-1',
      type: 'pagenumber',
      name: 'PageNumber1',
      x: 0,
      y: 0,
      width: 30,
      height: 8,
      format: '1/N',
      font: { family: 'BrandSong', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      textAlign: 'center',
    } as ReportComponent, template => {
      template.fonts = [...(template.fonts ?? []), customFont];
    });
    render(<PropertyEditor />);
    expect(screen.getByLabelText('字体系列')).toBeInTheDocument();
    expect(await screen.findByText('Brand Song')).toBeInTheDocument();

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
      font: { family: 'BrandSong', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      textAlign: 'left',
    } as ReportComponent, template => {
      template.fonts = [...(template.fonts ?? []), customFont];
    });
    render(<PropertyEditor />);
    expect(screen.getByLabelText('字体系列')).toBeInTheDocument();
    expect(await within(document.body).findByText('Brand Song')).toBeInTheDocument();
  });

  it('edits page number and date time vertical alignment from their property groups', () => {
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

    fireEvent.click(screen.getByRole('button', { name: '底部对齐' }));
    expect(selectedComponent().verticalAlign).toBe('bottom');

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

    fireEvent.click(screen.getByRole('button', { name: '顶部对齐' }));
    expect(selectedComponent().verticalAlign).toBe('top');
  });
});
