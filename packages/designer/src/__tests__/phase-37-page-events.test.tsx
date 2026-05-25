/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { DesignerI18nProvider } from '../i18n';
import { DesignerPropertyPanel } from '../components/panels/DesignerPropertyPanel';
import { useDesignerStore } from '../store/designer-store';

vi.mock('@monaco-editor/react', () => ({
  default: (props: Record<string, unknown>) => (
    <textarea
      aria-label={props['aria-label'] as string}
      value={props.value as string}
      onChange={(event) => (props.onChange as (value: string | undefined) => void)(event.target.value)}
    />
  ),
}));

describe('phase 37 page event editor', () => {
  it('opens page events from page properties and saves them on the current page', () => {
    const template = createDefaultTemplate('Page Event Editor');
    useDesignerStore.getState().loadTemplate(template);

    render(
      <DesignerI18nProvider locale="en-US">
        <DesignerPropertyPanel />
      </DesignerI18nProvider>,
    );

    fireEvent.click(screen.getByText('Edit Page Events'));
    expect(screen.getByText('Page Events')).toBeInTheDocument();
    expect(screen.getByText('Before Print')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Script'), { target: { value: 'ctx.log.info("page");' } });
    fireEvent.click(screen.getByText('Apply'));

    const page = useDesignerStore.getState().template.pages[0];
    expect(page.events).toMatchObject({
      beforePrint: { enabled: true, script: 'ctx.log.info("page");' },
    });
  });
});
