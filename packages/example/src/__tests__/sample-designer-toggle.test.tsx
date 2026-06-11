/* @vitest-environment jsdom */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useDesignerStore } from '@report-designer/designer';
import App from '../App';
import { commonTextStyleIds } from '../templates/common';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

function findTextComponent(componentId: string) {
  const template = useDesignerStore.getState().template;
  return template.pages
    .flatMap(page => page.bands)
    .flatMap(band => band.components)
    .find(component => component.id === componentId && component.type === 'text');
}

async function chooseLocale(container: HTMLElement, optionText: string) {
  const picker = container.querySelector('[data-testid="example-locale-picker"]') as HTMLElement | null;
  expect(picker).toBeTruthy();
  const trigger = (
    picker!.querySelector('.ant-select-selector')
    ?? picker!.querySelector('[role="combobox"]')
    ?? picker!.querySelector('.ant-select')
  ) as HTMLElement | null;
  expect(trigger).toBeTruthy();

  await act(async () => {
    trigger!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  });

  const option = Array.from(document.body.querySelectorAll('.ant-select-item-option-content'))
    .find(item => item.textContent?.trim() === optionText) as HTMLElement | undefined;
  expect(option).toBeTruthy();

  await act(async () => {
    option!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

describe('example sample designer toggle', () => {
  it('opens the designer for the selected sample template', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    expect(container.textContent).toContain('Grouped Employees');
    expect(container.querySelector('[data-testid="designer-quick-access"]')).toBeNull();

    const openDesigner = Array.from(container.querySelectorAll('button'))
      .find(button => button.textContent?.includes('打开设计器'));
    expect(openDesigner).toBeTruthy();

    await act(async () => {
      openDesigner!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const styleIds = useDesignerStore.getState().template.styles.map(style => style.id);

    expect(container.querySelector('[data-testid="designer-quick-access"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="designer-canvas-frame"]')).toBeTruthy();
    expect(container.textContent).toContain('Grouped Employees');
    expect(styleIds).toEqual(expect.arrayContaining([
      commonTextStyleIds.title,
      commonTextStyleIds.pageHeader,
      commonTextStyleIds.header,
      commonTextStyleIds.data,
      commonTextStyleIds.footer,
      commonTextStyleIds.group,
    ]));
    expect(new Set(styleIds).size).toBe(styleIds.length);
    expect(findTextComponent('ge-title-text')).toMatchObject({
      style: commonTextStyleIds.title,
      textAlign: 'center',
      font: expect.objectContaining({
        size: 15,
        bold: true,
      }),
    });
    expect(findTextComponent('ge-page-header-text')).toMatchObject({
      style: commonTextStyleIds.pageHeader,
      font: expect.objectContaining({
        size: 8,
        color: '#4b5563',
      }),
    });
  });

  it('returns to preview with the current designer template draft', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    const openDesigner = Array.from(container.querySelectorAll('button'))
      .find(button => button.textContent?.includes('打开设计器'));
    expect(openDesigner).toBeTruthy();

    await act(async () => {
      openDesigner!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await act(async () => {
      useDesignerStore.getState().updateTemplate(current => ({
        ...current,
        pages: current.pages.map(page => ({
          ...page,
          bands: page.bands.map(band => ({
            ...band,
            components: band.components.map(component => (
              component.id === 'ge-title-text'
                ? { ...component, text: 'Designer Draft Title', textAlign: 'center' }
                : component
            )),
          })),
        })),
      }));
    });

    expect(container.textContent).toContain('Designer Draft Title');

    const returnPreview = Array.from(container.querySelectorAll('button'))
      .find(button => button.textContent?.includes('返回预览'));
    expect(returnPreview).toBeTruthy();

    await act(async () => {
      returnPreview!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.querySelector('[data-testid="designer-quick-access"]')).toBeNull();
    expect(container.textContent).toContain('Designer Draft Title');
  });

  it('passes the selected language to the designer shell', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    await chooseLocale(container, 'English');

    const openDesigner = Array.from(container.querySelectorAll('button'))
      .find(button => button.textContent?.includes('Open Designer'));
    expect(openDesigner).toBeTruthy();

    await act(async () => {
      openDesigner!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Style Designer');
    expect(container.textContent).toContain('Report Designer');
    expect(container.textContent).not.toContain('样式设计器');
  });
});
