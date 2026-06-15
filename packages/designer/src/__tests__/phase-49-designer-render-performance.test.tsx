/* @vitest-environment jsdom */
import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultTemplate, type ReportComponent } from '@report-designer/core';
import { Designer } from '../components/Designer';
import { DesignerRibbon } from '../components/ribbon/DesignerRibbon';
import { DesignerI18nProvider } from '../i18n';
import { useDesignerStore } from '../store/designer-store';

const shellRenderSpy = vi.hoisted(() => vi.fn());

vi.mock('../components/shell/DesignerShell', () => ({
  DesignerShell: (props: Record<string, unknown>) => {
    shellRenderSpy(props);
    return <div data-testid="mock-designer-shell" />;
  },
}));

function textComponent(id = 'text-1', text = 'Original'): ReportComponent {
  return {
    id,
    type: 'text',
    name: id,
    x: 10,
    y: 8,
    width: 50,
    height: 10,
    text,
    font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
    textAlign: 'left',
    verticalAlign: 'top',
  } as ReportComponent;
}

describe('phase 49 designer render performance', () => {
  it('does not rerender the designer shell for component property updates', async () => {
    shellRenderSpy.mockClear();
    const template = createDefaultTemplate('Designer Render Stability');
    const dataBand = template.pages[0].bands.find(band => band.type === 'data')!;
    dataBand.components = [textComponent()];

    render(<Designer template={template} data={{ customer: 'Acme' }} locale="en-US" />);

    await waitFor(() => {
      expect(useDesignerStore.getState().template.id).toBe(template.id);
      expect(shellRenderSpy).toHaveBeenCalled();
    });

    const rendersAfterLoad = shellRenderSpy.mock.calls.length;

    act(() => {
      useDesignerStore.getState().updateComponent(
        template.pages[0].id,
        dataBand.id,
        'text-1',
        { text: 'Edited' },
      );
    });

    expect(shellRenderSpy).toHaveBeenCalledTimes(rendersAfterLoad);
  });

  it('preserves unrelated template references for component property updates', () => {
    const template = createDefaultTemplate('Component Update Sharing');
    const reportTitleBand = template.pages[0].bands.find(band => band.type === 'reportTitle')!;
    const dataBand = template.pages[0].bands.find(band => band.type === 'data')!;
    reportTitleBand.components = [textComponent('title-text', 'Title')];
    dataBand.components = [textComponent('text-1', 'Original'), textComponent('text-2', 'Sibling')];

    act(() => {
      useDesignerStore.getState().loadTemplate(template);
    });

    const before = useDesignerStore.getState().template;
    const beforePage = before.pages[0];
    const beforeReportTitleBand = beforePage.bands.find(band => band.id === reportTitleBand.id)!;
    const beforeDataBand = beforePage.bands.find(band => band.id === dataBand.id)!;
    const beforeUpdatedComponent = beforeDataBand.components[0];
    const beforeSiblingComponent = beforeDataBand.components[1];

    act(() => {
      useDesignerStore.getState().updateComponent(beforePage.id, beforeDataBand.id, 'text-1', { text: 'Edited' });
    });

    const after = useDesignerStore.getState().template;
    const afterPage = after.pages[0];
    const afterReportTitleBand = afterPage.bands.find(band => band.id === reportTitleBand.id)!;
    const afterDataBand = afterPage.bands.find(band => band.id === dataBand.id)!;

    expect(after).not.toBe(before);
    expect(afterPage).not.toBe(beforePage);
    expect(afterReportTitleBand).toBe(beforeReportTitleBand);
    expect(afterDataBand).not.toBe(beforeDataBand);
    expect(afterDataBand.components[0]).not.toBe(beforeUpdatedComponent);
    expect(afterDataBand.components[1]).toBe(beforeSiblingComponent);
  });

  it('does not traverse unrelated band component trees for component property updates', () => {
    const template = createDefaultTemplate('Component Update Targeting');
    const reportTitleBand = template.pages[0].bands.find(band => band.type === 'reportTitle')!;
    const dataBand = template.pages[0].bands.find(band => band.type === 'data')!;
    reportTitleBand.components = [textComponent('title-text', 'Title')];
    dataBand.components = [textComponent('text-1', 'Original')];

    act(() => {
      useDesignerStore.getState().loadTemplate(template);
    });

    const stateTemplate = useDesignerStore.getState().template;
    const statePage = stateTemplate.pages[0];
    const unrelatedBand = statePage.bands.find(band => band.id === reportTitleBand.id)!;
    Object.defineProperty(unrelatedBand, 'components', {
      configurable: true,
      get: () => {
        throw new Error('unrelated band components should not be read');
      },
    });

    expect(() => {
      act(() => {
        useDesignerStore.getState().updateComponent(statePage.id, dataBand.id, 'text-1', { text: 'Edited' });
      });
    }).not.toThrow();
  });

  it('does not replace the template for no-op component property updates', () => {
    const template = createDefaultTemplate('Component Update No-op');
    const dataBand = template.pages[0].bands.find(band => band.type === 'data')!;
    dataBand.components = [textComponent('text-1', 'Original')];

    act(() => {
      useDesignerStore.getState().loadTemplate(template);
    });

    const before = useDesignerStore.getState().template;
    act(() => {
      useDesignerStore.getState().updateComponent(template.pages[0].id, dataBand.id, 'text-1', { text: 'Original' });
    });

    expect(useDesignerStore.getState().template).toBe(before);
  });

  it('does not notify template hosts for selection zoom or data-only updates', async () => {
    const template = createDefaultTemplate('Template Change Boundary');
    const dataBand = template.pages[0].bands.find(band => band.type === 'data')!;
    dataBand.components = [textComponent('text-1', 'Original')];
    const onTemplateChange = vi.fn();

    render(<Designer template={template} data={{ customer: 'Acme' }} locale="en-US" onTemplateChange={onTemplateChange} />);

    await waitFor(() => {
      expect(useDesignerStore.getState().template.id).toBe(template.id);
      expect(onTemplateChange).toHaveBeenCalled();
    });
    onTemplateChange.mockClear();

    act(() => {
      useDesignerStore.getState().selectComponents(['text-1']);
      useDesignerStore.getState().setZoom(1.25);
      useDesignerStore.getState().setDataSources({ runtime: [{ id: 1 }] });
    });

    expect(onTemplateChange).not.toHaveBeenCalled();

    act(() => {
      useDesignerStore.getState().updateComponent(template.pages[0].id, dataBand.id, 'text-1', { text: 'Edited' });
    });

    expect(onTemplateChange).toHaveBeenCalledTimes(1);
  });

  it('does not rerender the ribbon for zoom or runtime data source updates', () => {
    const template = createDefaultTemplate('Ribbon Render Boundary');
    act(() => {
      useDesignerStore.getState().loadTemplate(template);
    });

    const ribbonRenderSpy = vi.fn();
    render(
      <DesignerI18nProvider locale="en-US">
        <React.Profiler id="designer-ribbon" onRender={ribbonRenderSpy}>
          <DesignerRibbon />
        </React.Profiler>
      </DesignerI18nProvider>,
    );

    ribbonRenderSpy.mockClear();
    act(() => {
      useDesignerStore.getState().setZoom(1.5);
      useDesignerStore.getState().setDataSources({ runtime: [{ id: 1 }] });
    });

    expect(ribbonRenderSpy).not.toHaveBeenCalled();
  });
});
