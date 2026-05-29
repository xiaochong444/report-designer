/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
import * as DesignerPackage from '../index';
import { Canvas } from '../components/Canvas';
import { DesignerI18nProvider } from '../i18n';
import { useDesignerStore } from '../store/designer-store';

describe('Phase 7 designer band contract', () => {
  it('does not expose deprecated band and group wizards from the public package', () => {
    expect(DesignerPackage).not.toHaveProperty('BandWizardDialog');
    expect(DesignerPackage).not.toHaveProperty('GroupWizardDialog');
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
