/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReportComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { Canvas } from '../components/Canvas';
import { useDesignerStore } from '../store/designer-store';

function makeText(id: string, x: number, y: number): ReportComponent {
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

function loadCanvasTemplate() {
  const template = createDefaultTemplate('Canvas Editing');
  const dataBand = template.pages[0].bands.find(band => band.type === 'data')!;
  dataBand.components = [
    makeText('text-a', 10, 10),
    makeText('text-b', 30, 12),
  ];
  useDesignerStore.getState().loadTemplate(template);
}

function components() {
  return useDesignerStore.getState().template.pages[0].bands.flatMap(band => band.components);
}

function component(id: string) {
  const found = components().find(item => item.id === id);
  if (!found) throw new Error(`Missing component ${id}`);
  return found;
}

describe('phase 38 canvas editing shortcuts', () => {
  it('selects all current-page components with Ctrl+A', () => {
    loadCanvasTemplate();
    render(<Canvas />);

    fireEvent.keyDown(window, { key: 'a', ctrlKey: true });

    expect(useDesignerStore.getState().selectedComponentIds).toEqual(['text-a', 'text-b']);
  });

  it('nudges selected components with arrow keys and restores with undo', () => {
    loadCanvasTemplate();
    useDesignerStore.getState().selectComponents(['text-a', 'text-b']);
    render(<Canvas />);

    fireEvent.keyDown(window, { key: 'ArrowRight' });

    expect(component('text-a')).toMatchObject({ x: 11, y: 10 });
    expect(component('text-b')).toMatchObject({ x: 31, y: 12 });

    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });

    expect(component('text-a')).toMatchObject({ x: 10, y: 10 });
    expect(component('text-b')).toMatchObject({ x: 30, y: 12 });
  });

  it('resizes selected components with Shift+Arrow and restores with undo', () => {
    loadCanvasTemplate();
    useDesignerStore.getState().selectComponents(['text-a', 'text-b']);
    render(<Canvas />);

    fireEvent.keyDown(window, { key: 'ArrowDown', shiftKey: true });

    expect(component('text-a')).toMatchObject({ width: 10, height: 7 });
    expect(component('text-b')).toMatchObject({ width: 10, height: 7 });

    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });

    expect(component('text-a')).toMatchObject({ width: 10, height: 6 });
    expect(component('text-b')).toMatchObject({ width: 10, height: 6 });
  });

  it('duplicates selected components with Ctrl+D and removes duplicates with undo', () => {
    loadCanvasTemplate();
    useDesignerStore.getState().selectComponents(['text-a']);
    render(<Canvas />);

    fireEvent.keyDown(window, { key: 'd', ctrlKey: true });

    const selectedIds = useDesignerStore.getState().selectedComponentIds;
    expect(components()).toHaveLength(3);
    expect(selectedIds).toHaveLength(1);
    expect(selectedIds[0]).not.toBe('text-a');

    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });

    expect(components().map(item => item.id)).toEqual(['text-a', 'text-b']);
  });

  it('keeps selected components on Backspace and deletes them on Delete', () => {
    loadCanvasTemplate();
    useDesignerStore.getState().selectComponents(['text-a']);
    render(<Canvas />);

    fireEvent.keyDown(window, { key: 'Backspace' });

    expect(components().map(item => item.id)).toEqual(['text-a', 'text-b']);

    fireEvent.keyDown(window, { key: 'Delete' });

    expect(components().map(item => item.id)).toEqual(['text-b']);
  });
});
