/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReportComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { Canvas } from '../components/Canvas';
import { useDesignerStore } from '../store/designer-store';

function textComponent(): ReportComponent {
  return {
    id: 'text-1',
    type: 'text',
    x: 10,
    y: 10,
    width: 30,
    height: 8,
    text: 'Name',
    font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
    textAlign: 'left',
    verticalAlign: 'top',
    border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    canGrow: false,
    canShrink: false,
  } as ReportComponent;
}

function loadText() {
  const component = textComponent();
  const template = createDefaultTemplate('Phase 8 Shortcuts');
  template.pages[0].bands.find(band => band.type === 'data')!.components.push(component);
  useDesignerStore.getState().loadTemplate(template);
  useDesignerStore.getState().selectComponents([component.id]);
}

function dataBandComponents() {
  return useDesignerStore.getState().template.pages[0].bands.find(band => band.type === 'data')!.components;
}

describe('Phase 8 designer shortcut regression coverage', () => {
  it('duplicates the selected component with Ctrl+D', () => {
    loadText();
    render(<Canvas />);

    fireEvent.keyDown(window, { key: 'd', ctrlKey: true });

    const components = dataBandComponents();
    expect(components).toHaveLength(2);
    expect(components[1].x).toBe(15);
    expect(components[1].y).toBe(15);
    expect(useDesignerStore.getState().selectedComponentIds).toEqual([components[1].id]);
  });

  it('cuts the selected component with Ctrl+X and keeps it on the clipboard', () => {
    loadText();
    render(<Canvas />);

    fireEvent.keyDown(window, { key: 'x', ctrlKey: true });

    expect(dataBandComponents()).toHaveLength(0);
    expect(useDesignerStore.getState().clipboard).toHaveLength(1);
    expect(useDesignerStore.getState().clipboard[0].id).toBe('text-1');
  });

  it('nudges the selected component with arrow keys', () => {
    loadText();
    render(<Canvas />);

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'ArrowDown' });

    const component = dataBandComponents()[0];
    expect(component.x).toBe(11);
    expect(component.y).toBe(11);
  });

  it('resizes the selected component with Shift+ArrowRight', () => {
    loadText();
    render(<Canvas />);

    fireEvent.keyDown(window, { key: 'ArrowRight', shiftKey: true });

    const component = dataBandComponents()[0];
    expect(component.width).toBe(31);
    expect(component.height).toBe(8);
  });
});
