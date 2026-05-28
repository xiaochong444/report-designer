/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { DesignerShell } from '../components/shell/DesignerShell';
import { DesignerI18nProvider } from '../i18n';
import { useDesignerStore } from '../store/designer-store';

describe('Phase 5 preview integration', () => {
  beforeEach(() => {
    useDesignerStore.getState().loadTemplate(createDefaultTemplate('Preview Test'));
    useDesignerStore.getState().setDataSources({});
  });

  it('switches the canvas area to viewer preview from the Preview tab', () => {
    render(
      <DesignerI18nProvider locale="en-US">
        <DesignerShell />
      </DesignerI18nProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

    expect(screen.getByTestId('render-document')).toBeInTheDocument();
  });

  it('keeps the designer locale when showing embedded preview', () => {
    render(
      <DesignerI18nProvider locale="zh-CN">
        <DesignerShell />
      </DesignerI18nProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: '预览' }));

    expect(screen.getByRole('button', { name: '打印' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Print' })).not.toBeInTheDocument();
  });

  it('passes local subreport templates to the embedded preview', () => {
    const mainTemplate = createDefaultTemplate('Main Report');
    const detailTemplate = createDefaultTemplate('Local Detail');
    const mainTitleBand = mainTemplate.pages[0].bands.find(band => band.type === 'reportTitle');
    const detailTitleBand = detailTemplate.pages[0].bands.find(band => band.type === 'reportTitle');
    if (!mainTitleBand || !detailTitleBand) {
      throw new Error('Missing test bands');
    }

    mainTitleBand.components = [{
      id: 'subreport-1',
      type: 'subreport',
      x: 10,
      y: 2,
      width: 80,
      height: 24,
      templateUrl: 'local-detail',
      parameters: {},
    } as any];
    detailTitleBand.components = [{
      id: 'detail-text',
      type: 'text',
      x: 0,
      y: 0,
      width: 50,
      height: 8,
      text: 'Local subreport rendered',
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      textAlign: 'left',
      verticalAlign: 'top',
      border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    } as any];

    useDesignerStore.getState().loadTemplate(mainTemplate);
    render(
      <DesignerI18nProvider locale="en-US">
        <DesignerShell subreports={{ 'local-detail': detailTemplate }} />
      </DesignerI18nProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

    expect(screen.getByText('Local subreport rendered')).toBeInTheDocument();
    expect(screen.queryByText(/Missing subreport/i)).not.toBeInTheDocument();
  });
});
