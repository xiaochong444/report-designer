/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import type { RenderChart, RenderDocument } from '@report-designer/core';
import { buildVChartSpec } from '../renderers/chart/chart-spec';
import { RenderDocumentView } from '../renderers/dom/RenderDocumentView';
import { buildPrintHtml } from '../print/print-frame';
import { exportRenderDocumentToPDF } from '../export/pdf/export-render-document';
import { makeRenderDocument } from './phase-4-helpers';

vi.mock('@visactor/vchart', () => ({
  default: class MockVChart {
    private readonly dom: HTMLElement;
    private readonly spec: Record<string, unknown>;

    constructor(spec: Record<string, unknown>, options: { dom: HTMLElement }) {
      this.spec = spec;
      this.dom = options.dom;
      this.dom.setAttribute('data-chart-type', String(this.spec.type));
    }

    async renderAsync() {}
    release() {}
    async getDataURL() {
      return 'data:image/png;base64,iVBORw0KGgo=';
    }
  },
}));

function chart(overrides: Partial<RenderChart> = {}): RenderChart {
  return {
    id: 'chart-1',
    type: 'chart',
    x: 30,
    y: 30,
    width: 80,
    height: 50,
    chartType: 'bar',
    variant: 'stacked',
    data: [
      { category: 'East', series: 'Online', value: 25, label: 'East', x: null, y: 25, raw: {} },
      { category: 'East', series: 'Retail', value: 20, label: 'East', x: null, y: 20, raw: {} },
    ],
    title: 'Sales',
    showLegend: true,
    legendPosition: 'right',
    showAxes: true,
    showGrid: true,
    showLabels: true,
    palette: ['#2f6fed', '#f59e0b'],
    aggregate: 'sum',
    emptyMessage: 'No chart data',
    style: {},
    ...overrides,
  };
}

function documentWithChart(component = chart()): RenderDocument {
  const document = makeRenderDocument();
  document.pages[0].items[0].components.push(component);
  return document;
}

describe('phase 41 chart rendering viewer', () => {
  it('builds VChart specs for common chart variants', () => {
    expect(buildVChartSpec(chart())).toMatchObject({
      type: 'bar',
      stack: true,
      seriesField: 'series',
      xField: 'category',
      yField: 'value',
    });

    expect(buildVChartSpec(chart({ chartType: 'pie', variant: 'donut' }))).toMatchObject({
      type: 'pie',
      categoryField: 'category',
      valueField: 'value',
      innerRadius: 0.55,
    });

    expect(buildVChartSpec(chart({ chartType: 'point', variant: 'scatter' }))).toMatchObject({
      type: 'scatter',
      xField: 'x',
      yField: 'y',
    });
  });

  it('renders charts through the DOM preview renderer', async () => {
    render(<RenderDocumentView document={documentWithChart()} zoom={100} />);

    expect(screen.getByTestId('render-component-chart')).toBeInTheDocument();
    expect(await screen.findByTestId('render-component-chart-vchart')).toHaveAttribute('data-chart-type', 'bar');
  });

  it('prints chart snapshots as static images and falls back to a visible placeholder', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
    const imageHtml = buildPrintHtml(documentWithChart(chart({ imageDataUrl: dataUrl })));
    expect(imageHtml).toContain('rd-print-chart');
    expect(imageHtml).toContain(`src="${dataUrl}"`);

    const placeholderHtml = buildPrintHtml(documentWithChart(chart({ data: [] })));
    expect(placeholderHtml).toContain('No chart data');
  });

  it('does not drop chart components during PDF export', async () => {
    await expect(exportRenderDocumentToPDF(documentWithChart(chart({ data: [] })))).resolves.toBeInstanceOf(Uint8Array);
  });
});
