/* @vitest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate, type ReportComponent, type ReportTemplate } from '@report-designer/core';
import { PropertyEditor } from '../components/PropertyEditor';
import { prepareComponentForInsert } from '../report-structure';
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

function textComponent(id: string, name: string, x: number): ReportComponent {
  return {
    id,
    type: 'text',
    name,
    x,
    y: 0,
    width: 40,
    height: 8,
    text: name,
    font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
    textAlign: 'left',
    verticalAlign: 'top',
    border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    canGrow: false,
    canShrink: false,
  } as ReportComponent;
}

function makeTemplate(): ReportTemplate {
  const template = createDefaultTemplate('Name Uniqueness');
  const dataBand = template.pages[0].bands.find(band => band.type === 'data');
  if (!dataBand) throw new Error('Missing data band');
  dataBand.components = [
    textComponent('first-text', 'CustomerName', 0),
    textComponent('second-text', 'CustomerTitle', 45),
    {
      id: 'panel-1',
      type: 'panel',
      name: 'DetailsPanel',
      x: 0,
      y: 15,
      width: 80,
      height: 30,
      border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
      components: [
        textComponent('panel-child-text', 'PanelChildName', 0),
      ],
    } as ReportComponent,
  ];
  return template;
}

function componentNames() {
  return allComponents().map(component => component.name);
}

function componentIds() {
  return allComponents().map(component => component.id);
}

function allComponents() {
  const result: ReportComponent[] = [];
  const visit = (items: ReportComponent[]) => {
    for (const component of items) {
      result.push(component);
      if ('components' in component && Array.isArray((component as ReportComponent & { components?: ReportComponent[] }).components)) {
        visit((component as ReportComponent & { components?: ReportComponent[] }).components ?? []);
      }
    }
  };

  for (const band of useDesignerStore.getState().template.pages[0].bands) {
    visit(band.components);
  }
  return result;
}

function findComponent(componentId: string) {
  const visit = (components: ReportComponent[]): ReportComponent | undefined => {
    for (const component of components) {
      if (component.id === componentId) return component;
      if ('components' in component && Array.isArray((component as ReportComponent & { components?: ReportComponent[] }).components)) {
        const child = visit((component as ReportComponent & { components?: ReportComponent[] }).components ?? []);
        if (child) return child;
      }
    }
    return undefined;
  };

  for (const band of useDesignerStore.getState().template.pages[0].bands) {
    const component = visit(band.components);
    if (component) return component;
  }
  return undefined;
}

describe('Phase 45 component name uniqueness', () => {
  it('rejects manually renaming a component to an existing component name and shows a property error', async () => {
    const template = makeTemplate();
    const page = template.pages[0];
    const dataBand = page.bands.find(band => band.type === 'data')!;

    act(() => {
      useDesignerStore.getState().loadTemplate(template);
      useDesignerStore.getState().selectComponents(['second-text']);
    });

    render(<PropertyEditor />);

    fireEvent.change(screen.getByLabelText('名称'), { target: { value: 'CustomerName' } });

    await waitFor(() => {
      expect(componentNames()).toEqual(['CustomerName', 'CustomerTitle', 'DetailsPanel', 'PanelChildName']);
      expect(screen.getByText('组件名称不能重复')).toBeInTheDocument();
    });

    act(() => {
      useDesignerStore.getState().updateComponent(page.id, dataBand.id, 'second-text', { name: 'CustomerName' });
    });

    expect(componentNames()).toEqual(['CustomerName', 'CustomerTitle', 'DetailsPanel', 'PanelChildName']);
  });

  it('updates panel child component names through the store and rejects duplicate child names', () => {
    const template = makeTemplate();
    const page = template.pages[0];
    const dataBand = page.bands.find(band => band.type === 'data')!;

    act(() => {
      useDesignerStore.getState().loadTemplate(template);
      useDesignerStore.getState().updateComponent(page.id, dataBand.id, 'panel-child-text', { name: 'PanelChildRenamed' });
    });

    expect(findComponent('panel-child-text')?.name).toBe('PanelChildRenamed');

    act(() => {
      useDesignerStore.getState().updateComponent(page.id, dataBand.id, 'panel-child-text', { name: 'CustomerName' });
    });

    expect(findComponent('panel-child-text')?.name).toBe('PanelChildRenamed');
  });

  it('shows and validates selected panel child names in the property editor', async () => {
    const template = makeTemplate();

    act(() => {
      useDesignerStore.getState().loadTemplate(template);
      useDesignerStore.getState().selectComponents(['panel-child-text']);
    });

    render(<PropertyEditor />);

    expect(screen.getByLabelText('名称')).toHaveValue('PanelChildName');

    fireEvent.change(screen.getByLabelText('名称'), { target: { value: 'CustomerName' } });

    await waitFor(() => {
      expect(findComponent('panel-child-text')?.name).toBe('PanelChildName');
      expect(screen.getByText('组件名称不能重复')).toBeInTheDocument();
    });
  });

  it('shows an error when clearing a component name in the property editor', async () => {
    const template = makeTemplate();

    act(() => {
      useDesignerStore.getState().loadTemplate(template);
      useDesignerStore.getState().selectComponents(['second-text']);
    });

    render(<PropertyEditor />);

    fireEvent.change(screen.getByLabelText('名称'), { target: { value: '   ' } });

    await waitFor(() => {
      expect(findComponent('second-text')?.name).toBe('CustomerTitle');
      expect(screen.getByText('组件名称不能为空')).toBeInTheDocument();
    });
  });

  it('trims explicit inserted component names and generates unique names for duplicate or empty names', () => {
    const template = makeTemplate();

    expect(prepareComponentForInsert(template, textComponent('trimmed-text', '  InvoiceTotal  ', 0)).name).toBe('InvoiceTotal');

    const duplicate = prepareComponentForInsert(template, textComponent('duplicate-text', 'CustomerName', 0));
    expect(duplicate.name).toMatch(/^Text\d+$/);
    expect(duplicate.name).not.toBe('CustomerName');

    const empty = prepareComponentForInsert(template, textComponent('empty-text', '   ', 0));
    expect(empty.name).toMatch(/^Text\d+$/);
  });

  it('rejects manually clearing a component name through the store', () => {
    const template = makeTemplate();
    const page = template.pages[0];
    const dataBand = page.bands.find(band => band.type === 'data')!;

    act(() => {
      useDesignerStore.getState().loadTemplate(template);
      useDesignerStore.getState().updateComponent(page.id, dataBand.id, 'second-text', { name: '   ' });
    });

    expect(findComponent('second-text')?.name).toBe('CustomerTitle');
  });

  it('normalizes duplicate explicit component names when loading templates including panel children', () => {
    const template = makeTemplate();
    const dataBand = template.pages[0].bands.find(band => band.type === 'data')!;
    const second = dataBand.components.find(component => component.id === 'second-text')!;
    const panel = dataBand.components.find(component => component.id === 'panel-1') as ReportComponent & { components: ReportComponent[] };
    second.name = 'CustomerName';
    panel.components[0].name = 'CustomerName';

    act(() => {
      useDesignerStore.getState().loadTemplate(template);
    });

    const firstName = findComponent('first-text')?.name;
    const secondName = findComponent('second-text')?.name;
    const panelChildName = findComponent('panel-child-text')?.name;

    expect(firstName).toBe('CustomerName');
    expect(secondName).toMatch(/^Text\d+$/);
    expect(panelChildName).toMatch(/^Text\d+$/);
    expect(new Set(componentNames()).size).toBe(componentNames().length);
  });

  it('pastes panel component trees with unique child ids and names', () => {
    const template = makeTemplate();

    act(() => {
      useDesignerStore.getState().loadTemplate(template);
      useDesignerStore.getState().selectComponents(['panel-1']);
      useDesignerStore.getState().copySelected();
      useDesignerStore.getState().pasteClipboard();
    });

    const dataBand = useDesignerStore.getState().template.pages[0].bands.find(band => band.type === 'data')!;
    const panels = dataBand.components.filter(component => component.type === 'panel') as Array<ReportComponent & { components: ReportComponent[] }>;
    const originalPanel = panels.find(panel => panel.id === 'panel-1')!;
    const pastedPanel = panels.find(panel => panel.id !== 'panel-1')!;
    const originalChild = originalPanel.components[0];
    const pastedChild = pastedPanel.components[0];

    expect(new Set(componentIds()).size).toBe(componentIds().length);
    expect(new Set(componentNames()).size).toBe(componentNames().length);
    expect(pastedChild.id).not.toBe(originalChild.id);

    act(() => {
      useDesignerStore.getState().updateComponent(
        useDesignerStore.getState().template.pages[0].id,
        dataBand.id,
        pastedChild.id,
        { name: 'PastedPanelChild' },
      );
    });

    expect(findComponent(pastedChild.id)?.name).toBe('PastedPanelChild');
    expect(findComponent(originalChild.id)?.name).toBe('PanelChildName');

    act(() => {
      useDesignerStore.getState().updateComponent(
        useDesignerStore.getState().template.pages[0].id,
        dataBand.id,
        pastedChild.id,
        { name: 'PanelChildName' },
      );
    });

    expect(findComponent(pastedChild.id)?.name).toBe('PastedPanelChild');
  });
});
