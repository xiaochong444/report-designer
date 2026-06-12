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
    chartType: 'column',
    data: [
      { category: 'East', series: 'Online', value: 25, label: 'East', x: null, y: 25, raw: {} },
      { category: 'East', series: 'Retail', value: 20, label: 'East', x: null, y: 20, raw: {} },
    ],
    rawData: [
      { category: 'East', series: 'Online', value: 25 },
      { category: 'East', series: 'Retail', value: 20 },
    ],
    binding: {
      dimensions: [{ field: 'category' }],
      measures: [{ field: 'value' }],
      seriesField: 'series',
      aggregate: 'sum',
      sort: [],
    },
    title: 'Sales',
    showLegend: true,
    legendPosition: 'right',
    showAxes: true,
    showGrid: true,
    showLabels: true,
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
  it('builds VChart specs using VSeed pipeline for various chart types', () => {
    // Column chart builds through VSeed
    const columnSpec = buildVChartSpec(chart());
    expect(columnSpec).toBeDefined();
    expect(columnSpec.type).toBeDefined();

    // Pie chart
    const pieSpec = buildVChartSpec(chart({ chartType: 'pie' }));
    expect(pieSpec).toBeDefined();

    // Scatter chart
    const scatterSpec = buildVChartSpec(chart({
      chartType: 'scatter',
      data: [
        { category: '10', value: 25, series: undefined, label: 'A', x: 10, y: 25, raw: {} },
      ],
      rawData: [{ x: 10, y: 25 }],
      binding: {
        dimensions: [{ field: 'x' }],
        measures: [{ field: 'y' }],
        aggregate: 'none',
        sort: [],
      },
    }));
    expect(scatterSpec).toBeDefined();
  });

  it('applies theme and custom palette to the spec', () => {
    const spec = buildVChartSpec(chart({
      theme: { baseTheme: 'light', customPalette: ['#ff0000', '#00ff00'] },
    }));
    expect(spec).toBeDefined();
    expect(String((spec as any).theme)).toMatch(/^rd-chart-light-/);
    expect((spec as any).color?.range).toEqual(['#ff0000', '#00ff00']);
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

    const placeholderHtml = buildPrintHtml(documentWithChart(chart({ data: [], rawData: [] })));
    expect(placeholderHtml).toContain('No chart data');
  });

  it('does not drop chart components during PDF export', async () => {
    await expect(exportRenderDocumentToPDF(documentWithChart(chart({ data: [], rawData: [] })))).resolves.toBeInstanceOf(Uint8Array);
  });
});
