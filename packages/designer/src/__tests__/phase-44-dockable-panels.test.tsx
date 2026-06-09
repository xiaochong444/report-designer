/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { Designer } from '../components/Designer';

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

describe('phase 44 dockable designer panels', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('lets the left panel switch between pinned and hover flyout modes', () => {
    render(<Designer template={createDefaultTemplate('Dockable Left Panel')} />);

    const body = screen.getByTestId('designer-body');
    const leftDock = screen.getByTestId('designer-left-dock');
    const leftStrip = screen.getByTestId('designer-left-dock-strip');

    expect(leftDock).toHaveAttribute('data-dock-mode', 'pinned');
    expect(leftDock).toHaveAttribute('data-dock-open', 'false');
    expect(body).toHaveStyle({ gridTemplateColumns: '270px minmax(360px, 1fr) 310px' });

    fireEvent.click(screen.getByTitle('取消固定侧边栏'));

    expect(leftDock).toHaveAttribute('data-dock-mode', 'auto');
    expect(leftDock).toHaveAttribute('data-dock-open', 'false');
    expect(body).toHaveStyle({ gridTemplateColumns: '30px minmax(360px, 1fr) 310px' });
    expect(window.localStorage.getItem('rd-designer-left-panel-dock')).toBe('auto');
    expect(within(leftStrip).getByTestId('designer-left-dock-tab-palette')).toHaveTextContent('组件');
    expect(within(leftStrip).getByTestId('designer-left-dock-tab-data')).toHaveTextContent('字典');
    expect(within(leftStrip).getByTestId('designer-left-dock-tab-tree')).toHaveTextContent('报表');

    fireEvent.mouseEnter(within(leftStrip).getByTestId('designer-left-dock-tab-palette'));
    expect(leftDock).toHaveAttribute('data-dock-open', 'true');
    expect(leftDock.querySelector('.rd-dock-content')).toHaveStyle({
      left: '30px',
      visibility: 'visible',
      pointerEvents: 'auto',
    });
    expect(screen.getByRole('tab', { name: /组件/ })).toHaveAttribute('aria-selected', 'true');

    fireEvent.mouseLeave(leftDock);
    expect(leftDock).toHaveAttribute('data-dock-open', 'false');

    fireEvent.mouseEnter(within(leftStrip).getByTestId('designer-left-dock-tab-data'));
    expect(leftDock).toHaveAttribute('data-dock-open', 'true');
    expect(screen.getByRole('tab', { name: /字典/ })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getByTitle('固定侧边栏'));

    expect(leftDock).toHaveAttribute('data-dock-mode', 'pinned');
    expect(body).toHaveStyle({ gridTemplateColumns: '270px minmax(360px, 1fr) 310px' });
    expect(window.localStorage.getItem('rd-designer-left-panel-dock')).toBe('pinned');
  });

  it('lets the property panel auto-hide independently from the left panel', () => {
    render(<Designer template={createDefaultTemplate('Dockable Property Panel')} />);

    const body = screen.getByTestId('designer-body');
    const leftDock = screen.getByTestId('designer-left-dock');
    const propertyDock = screen.getByTestId('designer-property-dock');
    const propertyStrip = screen.getByTestId('designer-property-dock-strip');
    const pinnedPropertyPinButton = screen.getByTitle('取消固定属性栏');

    expect(pinnedPropertyPinButton).toHaveClass('rd-dock-pin-button-vertical');

    fireEvent.click(screen.getByTitle('取消固定属性栏'));

    expect(leftDock).toHaveAttribute('data-dock-mode', 'pinned');
    expect(propertyDock).toHaveAttribute('data-dock-mode', 'auto');
    expect(propertyDock).toHaveAttribute('data-dock-open', 'false');
    expect(body).toHaveStyle({ gridTemplateColumns: '270px minmax(360px, 1fr) 30px' });
    expect(window.localStorage.getItem('rd-designer-property-panel-dock')).toBe('auto');
    expect(within(propertyStrip).getByTestId('designer-property-dock-tab-properties')).toHaveTextContent('属性');

    fireEvent.mouseEnter(within(propertyStrip).getByTestId('designer-property-dock-tab-properties'));
    expect(propertyDock).toHaveAttribute('data-dock-open', 'true');
    expect(propertyDock.querySelector('.rd-dock-content')).toHaveStyle({
      right: '30px',
      visibility: 'visible',
      pointerEvents: 'auto',
    });
    const propertyPinButton = screen.getByTestId('designer-property-dock-pin-button');
    expect(propertyPinButton).toHaveAttribute('aria-label', '固定属性栏');
    expect(propertyPinButton).toHaveClass('rd-dock-pin-button-horizontal');
    expect(propertyPinButton).toHaveStyle({
      visibility: 'visible',
      pointerEvents: 'auto',
    });

    fireEvent.click(propertyPinButton);

    expect(propertyDock).toHaveAttribute('data-dock-mode', 'pinned');
    expect(propertyPinButton).toHaveClass('rd-dock-pin-button-vertical');
    expect(body).toHaveStyle({ gridTemplateColumns: '270px minmax(360px, 1fr) 310px' });
    expect(window.localStorage.getItem('rd-designer-property-panel-dock')).toBe('pinned');

    fireEvent.mouseLeave(propertyDock);
    expect(propertyDock).toHaveAttribute('data-dock-open', 'false');
  });

  it('restores persisted auto-hide panel modes', () => {
    window.localStorage.setItem('rd-designer-left-panel-dock', 'auto');
    window.localStorage.setItem('rd-designer-property-panel-dock', 'auto');

    render(<Designer template={createDefaultTemplate('Persisted Dock Modes')} />);

    expect(screen.getByTestId('designer-left-dock')).toHaveAttribute('data-dock-mode', 'auto');
    expect(screen.getByTestId('designer-property-dock')).toHaveAttribute('data-dock-mode', 'auto');
    expect(screen.getByTestId('designer-body')).toHaveStyle({ gridTemplateColumns: '30px minmax(360px, 1fr) 30px' });
  });
});
