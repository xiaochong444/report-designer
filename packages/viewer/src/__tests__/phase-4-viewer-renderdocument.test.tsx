/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { Viewer } from '../components/Viewer';
import { RenderDocumentView } from '../renderers/dom/RenderDocumentView';
import { makeRenderDocument, makeViewerTemplate } from './phase-4-helpers';

describe('Phase 4 RenderDocument viewer', () => {
  it('renders RenderDocument pages through the viewer', () => {
    const { template, data } = makeViewerTemplate(4);

    render(<Viewer template={template} data={data} />);

    expect(screen.getAllByTestId('render-document-page')).toHaveLength(2);
    expect(screen.getAllByText('Employees')).toHaveLength(2);
    expect(screen.getByText('Employee 1')).toBeInTheDocument();
  });

  it('renders core component types in the DOM renderer', () => {
    render(<RenderDocumentView document={makeRenderDocument()} zoom={100} />);

    expect(screen.getByTestId('render-document-page')).toBeInTheDocument();
    expect(screen.getByText('Hello PDF')).toBeInTheDocument();
  });
});
