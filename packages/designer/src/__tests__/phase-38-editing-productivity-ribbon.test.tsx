/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { ReportComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { DesignerI18nProvider } from '../i18n';
import { DesignerRibbon } from '../components/ribbon/DesignerRibbon';
import { useDesignerStore } from '../store/designer-store';

function makeComponent(id: string, x: number, y: number): ReportComponent {
  return {
    id,
    name: id,
    type: 'text',
    x,
    y,
    width: 10,
    height: 6,
    text: id,
    font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
    textAlign: 'left',
    verticalAlign: 'top',
    border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    canGrow: false,
    canShrink: false,
  } as ReportComponent;
}

function loadTemplate(selectedIds: string[]) {
  const template = createDefaultTemplate('Ribbon Editing');
  const dataBand = template.pages[0].bands.find(band => band.type === 'data')!;
  dataBand.components = [
    makeComponent('text-a', 10, 10),
    makeComponent('text-b', 40, 12),
    makeComponent('text-c', 80, 14),
  ];
  useDesignerStore.getState().loadTemplate(template);
  useDesignerStore.getState().selectComponents(selectedIds);
}

function renderRibbon(locale: 'zh-CN' | 'en-US' = 'zh-CN') {
  return render(
    <DesignerI18nProvider locale={locale}>
      <DesignerRibbon />
    </DesignerI18nProvider>,
  );
}

describe('phase 38 editing productivity ribbon', () => {
  it('shows editing command entrypoints on the Home ribbon and wires align/size actions', () => {
    loadTemplate(['text-a', 'text-b', 'text-c']);
    useDesignerStore.getState().copySelected();
    renderRibbon();

    const ribbon = screen.getByTestId('designer-ribbon-content');
    const labels = [
      '复制',
      '剪切',
      '粘贴',
      '复制一份',
      '删除选中对象',
      '置于顶层',
      '置于底层',
      '左对齐',
      '水平居中',
      '右对齐',
      '上对齐',
      '垂直居中',
      '下对齐',
      '水平分布',
      '垂直分布',
      '等宽',
      '等高',
      '等尺寸',
    ];

    for (const label of labels) {
      expect(within(ribbon).getByRole('button', { name: label })).toBeInTheDocument();
    }

    fireEvent.click(within(ribbon).getByRole('button', { name: '左对齐' }));
    const components = useDesignerStore.getState().template.pages[0].bands.flatMap(band => band.components);
    expect(new Set(components.map(component => component.x))).toEqual(new Set([10]));

    fireEvent.click(within(ribbon).getByRole('button', { name: '等宽' }));
    const widths = useDesignerStore.getState().template.pages[0].bands.flatMap(band => band.components).map(component => component.width);
    expect(new Set(widths)).toEqual(new Set([10]));
  });

  it('disables commands based on selection count and clipboard state', () => {
    loadTemplate(['text-a']);
    renderRibbon();

    expect(screen.getByRole('button', { name: '复制' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '粘贴' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '左对齐' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '水平分布' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '等宽' })).toBeDisabled();
  });

  it('localizes editing command labels to English', () => {
    loadTemplate(['text-a', 'text-b', 'text-c']);
    useDesignerStore.getState().copySelected();
    renderRibbon('en-US');

    expect(screen.getByRole('button', { name: 'Cut' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bring to Front' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Align Middle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Distribute Horizontal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Same Size' })).toBeInTheDocument();
  });
});
