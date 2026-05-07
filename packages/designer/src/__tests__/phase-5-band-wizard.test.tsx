/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { BandWizardDialog } from '../components/dialogs/BandWizardDialog';
import { useDesignerStore } from '../store/designer-store';

describe('Phase 5 band wizard', () => {
  beforeEach(() => {
    const template = createDefaultTemplate('Band Wizard');
    template.dataSources = [{ id: 'employees', name: 'employees', type: 'json', schema: [{ name: 'name', type: 'string' }] }];
    useDesignerStore.getState().loadTemplate(template);
  });

  it('creates header, data, and footer bands for a data source', () => {
    render(<BandWizardDialog open onClose={() => {}} />);

    fireEvent.click(screen.getByLabelText('HeaderBand + DataBand + FooterBand'));
    fireEvent.click(screen.getByRole('button', { name: 'Create bands' }));

    const bands = useDesignerStore.getState().template.pages[0].bands;
    expect(bands.map((band) => band.type)).toEqual(expect.arrayContaining(['header', 'data', 'footer']));
    expect(bands.find((band) => band.type === 'data')?.dataBand?.dataSourceId).toBe('employees');
  });
});
