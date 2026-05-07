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
});
