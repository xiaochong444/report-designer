/* @vitest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultTemplate, type ChartComponent, type ReportComponent } from '@report-designer/core';
import { Designer } from '../components/Designer';
import { PropertyEditor } from '../components/PropertyEditor';
import { DesignerRibbon } from '../components/ribbon/DesignerRibbon';
import { DesignerI18nProvider } from '../i18n';
import { useDesignerStore } from '../store/designer-store';

const shellRenderSpy = vi.hoisted(() => vi.fn());
const chartPanelRenderSpies = vi.hoisted(() => ({
  data: vi.fn(),
  title: vi.fn(),
  theme: vi.fn(),
  axes: vi.fn(),
  legend: vi.fn(),
  labels: vi.fn(),
  style: vi.fn(),
}));

vi.mock('../components/shell/DesignerShell', () => ({
  DesignerShell: (props: Record<string, unknown>) => {
    shellRenderSpy(props);
    return <div data-testid="mock-designer-shell" />;
  },
}));

vi.mock('../components/chart/ChartTitlePanel', async () => {
  const React = await import('react');
  return {
    ChartTitlePanel: React.memo((props: Record<string, unknown>) => {
      chartPanelRenderSpies.title(props);
      return <div data-testid="chart-title-panel" />;
    }),
  };
});

vi.mock('../components/chart/ChartDataPanel', async () => {
  const React = await import('react');
  return {
    ChartDataPanel: React.memo((props: Record<string, unknown>) => {
      chartPanelRenderSpies.data(props);
      return <div data-testid="chart-data-panel" />;
    }),
  };
});

vi.mock('../components/chart/ChartThemePanel', async () => {
  const React = await import('react');
  return {
    ChartThemePanel: React.memo((props: Record<string, unknown>) => {
      chartPanelRenderSpies.theme(props);
      return <div data-testid="chart-theme-panel" />;
    }),
  };
});

vi.mock('../components/chart/ChartAxesPanel', async () => {
  const React = await import('react');
  return {
    ChartAxesPanel: React.memo((props: Record<string, unknown>) => {
      chartPanelRenderSpies.axes(props);
      return <div data-testid="chart-axes-panel" />;
    }),
  };
});

vi.mock('../components/chart/ChartLegendPanel', async () => {
  const React = await import('react');
  return {
    ChartLegendPanel: React.memo((props: Record<string, unknown>) => {
      chartPanelRenderSpies.legend(props);
      return <div data-testid="chart-legend-panel" />;
    }),
  };
});

vi.mock('../components/chart/ChartLabelPanel', async () => {
  const React = await import('react');
  return {
    ChartLabelPanel: React.memo((props: Record<string, unknown>) => {
      chartPanelRenderSpies.labels(props);
      return <div data-testid="chart-label-panel" />;
    }),
  };
});

vi.mock('../components/chart/ChartTypeStylePanel', async () => {
  const React = await import('react');
  return {
    ChartTypeStylePanel: React.memo((props: Record<string, unknown>) => {
      chartPanelRenderSpies.style(props);
      return <div data-testid="chart-style-panel" />;
    }),
  };
});

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

function chartComponent(): ChartComponent {
  return {
    id: 'chart-1',
    type: 'chart',
    name: 'Chart1',
    x: 10,
    y: 8,
    width: 80,
    height: 45,
    chartType: 'column',
    binding: {
      dataSourceId: 'orders',
      dimensions: [{ field: 'customer' }],
      measures: [{ field: 'amount', aggregation: 'sum' }],
      sort: [],
    },
    title: { visible: true, text: 'Sales' },
    legend: { visible: true, position: 'bottom' },
    axes: { x: { visible: true, title: 'Customer' }, y: { visible: true, title: 'Amount' } },
    labels: { visible: false, content: 'name' },
    theme: { baseTheme: 'light' },
    plotOptions: { bar: { cornerRadius: 2 } },
  };
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

  it('only rerenders the edited chart property group for chart field updates', () => {
    const template = createDefaultTemplate('Chart Property Render Boundary');
    template.dataSources = [{
      id: 'orders',
      name: 'orders',
      type: 'json',
      fields: [
        { name: 'customer', type: 'string' },
        { name: 'amount', type: 'number' },
      ],
    }];
    const dataBand = template.pages[0].bands.find(band => band.type === 'data')!;
    dataBand.components = [chartComponent()];

    act(() => {
      useDesignerStore.getState().loadTemplate(template);
      useDesignerStore.getState().selectComponents(['chart-1']);
    });

    render(
      <DesignerI18nProvider locale="en-US">
        <PropertyEditor />
      </DesignerI18nProvider>,
    );

    fireEvent.click(screen.getByText('Title'));
    fireEvent.click(screen.getByText('Theme'));
    fireEvent.click(screen.getByText('Axes'));
    fireEvent.click(screen.getByText('Legend'));
    fireEvent.click(screen.getByText('Labels'));
    fireEvent.click(screen.getByText('Type style'));

    Object.values(chartPanelRenderSpies).forEach(spy => spy.mockClear());

    act(() => {
      useDesignerStore.getState().updateComponent(
        template.pages[0].id,
        dataBand.id,
        'chart-1',
        { title: { visible: true, text: 'Updated Sales' } },
      );
    });

    expect(chartPanelRenderSpies.title).toHaveBeenCalledTimes(1);
    expect(chartPanelRenderSpies.data).not.toHaveBeenCalled();
    expect(chartPanelRenderSpies.theme).not.toHaveBeenCalled();
    expect(chartPanelRenderSpies.axes).not.toHaveBeenCalled();
    expect(chartPanelRenderSpies.legend).not.toHaveBeenCalled();
    expect(chartPanelRenderSpies.labels).not.toHaveBeenCalled();
    expect(chartPanelRenderSpies.style).not.toHaveBeenCalled();
  });
});
