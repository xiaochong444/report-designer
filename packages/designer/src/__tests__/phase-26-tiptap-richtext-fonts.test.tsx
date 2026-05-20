/* @vitest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import type { ReportFont, TextComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { PropertyEditor } from '../components/PropertyEditor';
import { DesignerPropertyPanel } from '../components/panels/DesignerPropertyPanel';
import { useDesignerStore } from '../store/designer-store';

function createText(id = 'font-text'): TextComponent {
  return {
    id,
    type: 'text',
    name: 'FontText',
    x: 0,
    y: 0,
    width: 40,
    height: 10,
    text: 'Font sample',
    font: { family: 'BrandSong', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
    textAlign: 'left',
    verticalAlign: 'top',
    border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    backgroundColor: 'transparent',
    canGrow: false,
    canShrink: false,
  };
}

function loadTemplateWithFonts(fonts: ReportFont[]) {
  const template = createDefaultTemplate('Phase 26 Fonts');
  template.fonts = [...(template.fonts ?? []), ...fonts];
  const dataBand = template.pages[0].bands.find(band => band.type === 'data');
  if (!dataBand) throw new Error('Missing data band');
  const component = createText();
  dataBand.components = [component];

  act(() => {
    useDesignerStore.getState().loadTemplate(template);
    useDesignerStore.getState().selectComponents([component.id]);
  });

  return { template, component };
}

function openSelect(label: string, scope: HTMLElement | Document = document) {
  const target = within(scope as HTMLElement).getByLabelText(label);
  const trigger = (
    target.closest('.ant-select-selector')
    ?? target.closest('.ant-select')?.querySelector('.ant-select-selector')
    ?? target.closest('.ant-select')?.querySelector('.ant-select-content')
    ?? target.parentElement?.querySelector('.ant-select-selector')
    ?? target.parentElement?.querySelector('.ant-select-content')
  ) as HTMLElement | null;
  if (!trigger) throw new Error(`Unable to find select trigger for ${label}`);
  fireEvent.mouseDown(trigger);
}

describe('phase 26 report font registry and rich text editor shell', () => {
  it('uses report font registry options in text component font selector', async () => {
    loadTemplateWithFonts([
      {
        id: 'brand-song',
        name: 'Brand Song',
        family: 'BrandSong',
        fallback: 'serif',
        source: { url: '/fonts/brand-song.woff2', format: 'woff2' },
      },
    ]);

    render(<PropertyEditor />);

    openSelect('字体系列');

    expect(await screen.findByText('Brand Song')).toBeInTheDocument();
    expect(await screen.findByText('SimSun')).toBeInTheDocument();
  });

  it('shows a report font registry group on the page property panel and adds custom fonts', async () => {
    const template = createDefaultTemplate('Phase 26 Page Fonts');
    act(() => {
      useDesignerStore.getState().loadTemplate(template);
      useDesignerStore.getState().selectComponents([]);
      useDesignerStore.getState().selectBand(null);
    });

    render(<DesignerPropertyPanel />);

    expect(screen.getByTestId('report-font-registry')).toBeInTheDocument();
    expect(screen.getByText('Microsoft YaHei')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '添加字体' }));

    await waitFor(() => {
      expect(useDesignerStore.getState().template.fonts?.some(font => !font.builtin)).toBe(true);
    });
    expect(screen.getByDisplayValue('Custom Font')).toBeInTheDocument();
  });
});
