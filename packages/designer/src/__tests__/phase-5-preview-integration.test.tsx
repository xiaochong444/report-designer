/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { DesignerShell } from '../components/shell/DesignerShell';
import { useDesignerStore } from '../store/designer-store';

describe('Phase 5 preview integration', () => {
  beforeEach(() => {
    useDesignerStore.getState().loadTemplate(createDefaultTemplate('Preview Test'));
    useDesignerStore.getState().setDataSources({});
  });

  it('switches the canvas area to viewer preview from the Preview tab', () => {
    render(<DesignerShell />);

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

    expect(screen.getByTestId('render-document')).toBeInTheDocument();
  });
});
