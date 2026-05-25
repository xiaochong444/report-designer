import { beforeEach, describe, expect, it } from 'vitest';
import type { ReportComponent, ReportTemplate } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { useDesignerStore } from '../store/designer-store';

function makeText(id: string, x: number, y: number, width = 10, height = 6, zOrder = 0): ReportComponent {
  return {
    id,
    name: id,
    type: 'text',
    x,
    y,
    width,
    height,
    zOrder,
    text: id,
    font: {
      family: 'Arial',
      size: 10,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      color: '#000000',
    },
    textAlign: 'left',
    verticalAlign: 'top',
    border: {
      style: 'none',
      width: 0,
      color: '#000000',
      sides: { top: false, right: false, bottom: false, left: false },
    },
    canGrow: false,
    canShrink: false,
  } as ReportComponent;
}

function loadEditingTemplate(): ReportTemplate {
  const template = createDefaultTemplate('Phase 38 Editing');
  const dataBand = template.pages[0].bands.find(band => band.type === 'data')!;
  dataBand.components = [
    makeText('text-a', 10, 10, 10, 6, 1),
    makeText('text-b', 35, 14, 20, 8, 2),
    makeText('text-c', 80, 18, 10, 6, 3),
  ];
  useDesignerStore.getState().loadTemplate(template);
  return template;
}

function components() {
  return useDesignerStore.getState().template.pages[0].bands.flatMap(band => band.components);
}

function component(id: string) {
  const found = components().find(item => item.id === id);
  if (!found) throw new Error(`Missing component ${id}`);
  return found;
}

describe('phase 38 editing productivity store actions', () => {
  beforeEach(() => {
    loadEditingTemplate();
  });

  it('deletes selected components and restores them through command history', () => {
    const store = useDesignerStore.getState();
    store.selectComponents(['text-a', 'text-b']);

    store.deleteSelected();

    expect(components().map(item => item.id)).toEqual(['text-c']);
    expect(useDesignerStore.getState().selectedComponentIds).toEqual([]);
    expect(useDesignerStore.getState().canUndo()).toBe(true);

    useDesignerStore.getState().undo();
    useDesignerStore.getState().undo();
    expect(new Set(components().map(item => item.id))).toEqual(new Set(['text-a', 'text-b', 'text-c']));

    useDesignerStore.getState().redo();
    useDesignerStore.getState().redo();
    expect(components().map(item => item.id)).toEqual(['text-c']);
  });

  it('pastes copied components with new ids, offset positions, selection, and undo support', () => {
    const store = useDesignerStore.getState();
    store.selectComponents(['text-a', 'text-b']);
    store.copySelected();

    store.pasteClipboard();

    const all = components();
    expect(all).toHaveLength(5);
    const pastedIds = useDesignerStore.getState().selectedComponentIds;
    expect(pastedIds).toHaveLength(2);
    expect(pastedIds).not.toContain('text-a');
    expect(pastedIds).not.toContain('text-b');
    const pasted = pastedIds.map(id => component(id));
    expect(pasted[0]).toMatchObject({ x: 15, y: 15 });
    expect(pasted[1]).toMatchObject({ x: 40, y: 19 });

    useDesignerStore.getState().undo();
    useDesignerStore.getState().undo();
    expect(components().map(item => item.id)).toEqual(['text-a', 'text-b', 'text-c']);

    useDesignerStore.getState().redo();
    useDesignerStore.getState().redo();
    expect(components()).toHaveLength(5);
  });

  it('moves and resizes selected components with undo support', () => {
    const store = useDesignerStore.getState();
    store.selectComponents(['text-a', 'text-b']);

    store.moveSelectedBy(1.5, -0.5);
    expect(component('text-a')).toMatchObject({ x: 11.5, y: 9.5 });
    expect(component('text-b')).toMatchObject({ x: 36.5, y: 13.5 });

    useDesignerStore.getState().undo();
    expect(component('text-a')).toMatchObject({ x: 10, y: 10 });
    expect(component('text-b')).toMatchObject({ x: 35, y: 14 });

    store.resizeSelectedBy(2, 3);
    expect(component('text-a')).toMatchObject({ width: 12, height: 9 });
    expect(component('text-b')).toMatchObject({ width: 22, height: 11 });

    useDesignerStore.getState().undo();
    expect(component('text-a')).toMatchObject({ width: 10, height: 6 });
    expect(component('text-b')).toMatchObject({ width: 20, height: 8 });
  });

  it('distributes selected components by equal edge gaps instead of equal left points', () => {
    const store = useDesignerStore.getState();
    store.selectComponents(['text-a', 'text-b', 'text-c']);

    store.alignComponents('distribute-h');

    const a = component('text-a');
    const b = component('text-b');
    const c = component('text-c');
    const firstGap = b.x - (a.x + a.width);
    const secondGap = c.x - (b.x + b.width);

    expect(firstGap).toBeCloseTo(secondGap, 5);
    expect(a.x).toBe(10);
    expect(c.x).toBe(80);
  });

  it('keeps stable layer ordering for multi-selection and supports undo', () => {
    const store = useDesignerStore.getState();
    store.selectComponents(['text-a', 'text-b']);

    store.bringToFront();

    expect(component('text-a').zOrder).toBe(4);
    expect(component('text-b').zOrder).toBe(5);
    expect(component('text-c').zOrder).toBe(3);

    useDesignerStore.getState().undo();
    expect(component('text-a').zOrder).toBe(1);
    expect(component('text-b').zOrder).toBe(2);

    store.sendToBack();
    expect(component('text-a').zOrder).toBe(-1);
    expect(component('text-b').zOrder).toBe(0);
  });
});
