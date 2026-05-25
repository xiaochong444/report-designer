/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { DesignerI18nProvider } from '../i18n';
import { BandPropertyGrid } from '../components/properties/BandPropertyGrid';
import { useDesignerStore } from '../store/designer-store';

function loadSelectedDataBand() {
  const template = createDefaultTemplate('Band Properties');
  const dataBand = template.pages[0].bands.find(band => band.type === 'data');
  if (!dataBand) throw new Error('Missing data band');
  useDesignerStore.getState().loadTemplate(template);
  useDesignerStore.getState().selectBand(dataBand.id);
  return dataBand.id;
}

function selectedBand() {
  const state = useDesignerStore.getState();
  return state.template.pages[0].bands.find(band => band.id === state.selectedBandId);
}

describe('phase 35 band properties', () => {
  it('updates band pagination behavior from the property grid', () => {
    loadSelectedDataBand();
    render(
      <DesignerI18nProvider locale="zh-CN">
        <BandPropertyGrid />
      </DesignerI18nProvider>,
    );

    fireEvent.click(screen.getByLabelText('每页重复打印'));
    fireEvent.click(screen.getByLabelText('保持整体'));
    fireEvent.click(screen.getByLabelText('打印在底部'));
    fireEvent.change(screen.getByLabelText('不足高度换页'), { target: { value: '12' } });

    expect(selectedBand()?.behavior).toMatchObject({
      printOnAllPages: true,
      keepTogether: true,
      printAtBottom: true,
      breakIfLessThan: 12,
    });
  });

  it('localizes band behavior controls to English', () => {
    loadSelectedDataBand();
    render(
      <DesignerI18nProvider locale="en-US">
        <BandPropertyGrid />
      </DesignerI18nProvider>,
    );

    expect(screen.getByText('Pagination / Print Behavior')).toBeInTheDocument();
    expect(screen.getByLabelText('Can Break')).toBeInTheDocument();
    expect(screen.queryByText('分页/打印行为')).not.toBeInTheDocument();
  });
});
