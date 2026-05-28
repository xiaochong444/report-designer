/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { Canvas } from '../components/Canvas';
import { BandWizardDialog } from '../components/dialogs/BandWizardDialog';
import { DesignerI18nProvider } from '../i18n';
import { useDesignerStore } from '../store/designer-store';

describe('Phase 7 designer band contract', () => {
  it('creates a HeaderBand + DataBand + FooterBand section from the wizard', () => {
    const template = createDefaultTemplate('Band Contract');
    template.dataSources = [{ id: 'employees', name: 'employees', type: 'json', schema: [{ name: 'name', type: 'string' }] }];
    useDesignerStore.getState().loadTemplate(template);

    render(
      <DesignerI18nProvider locale="en-US">
        <BandWizardDialog open onClose={() => {}} />
      </DesignerI18nProvider>,
    );
    fireEvent.click(screen.getByLabelText('HeaderBand + DataBand + FooterBand'));
    fireEvent.click(screen.getByRole('button', { name: 'Create bands' }));

    const bandTypes = useDesignerStore.getState().template.pages[0].bands.map(band => band.type);
    expect(bandTypes).toEqual(expect.arrayContaining(['header', 'data', 'footer']));
  });

  it('shows band names on the canvas', () => {
    const template = createDefaultTemplate('Band Labels');
    useDesignerStore.getState().loadTemplate(template);

    render(
      <DesignerI18nProvider locale="en-US">
        <Canvas />
      </DesignerI18nProvider>,
    );

    expect(screen.getByText('DataBand')).toBeInTheDocument();
    expect(screen.getByText('PageHeaderBand')).toBeInTheDocument();
  });
});
