import type { RenderChart, RenderComponentBox, RenderDocument } from '@report-designer/core';
import { buildVChartSpec } from './chart-spec';

const MM_TO_PX = 96 / 25.4;

export async function resolveChartSnapshots(renderDocument: RenderDocument): Promise<RenderDocument> {
  if (typeof window === 'undefined' || !window.document?.body || isJsdom()) {
    return renderDocument;
  }

  return {
    ...renderDocument,
    pages: await Promise.all(renderDocument.pages.map(async page => ({
      ...page,
      items: await Promise.all(page.items.map(async band => ({
        ...band,
        components: await Promise.all(band.components.map((component) => resolveChartComponent(component))),
      }))),
    }))),
  };
}

function isJsdom(): boolean {
  return typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('jsdom');
}

async function resolveChartComponent(component: RenderComponentBox): Promise<RenderComponentBox> {
  if (component.type === 'chart') {
    const chart = component as RenderChart;
    const imageDataUrl = await renderChartDataUrl(chart);
    return { ...chart, imageDataUrl };
  }

  if ('children' in component && Array.isArray(component.children)) {
    return {
      ...component,
      children: await Promise.all(component.children.map(child => resolveChartComponent(child))),
    };
  }

  return component;
}

async function renderChartDataUrl(chart: RenderChart): Promise<string | undefined> {
  const container = window.document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  const width = Math.max(1, Math.round(chart.width * MM_TO_PX));
  const height = Math.max(1, Math.round(chart.height * MM_TO_PX));
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  window.document.body.appendChild(container);

  try {
    const { default: VChart } = await import('@visactor/vchart');
    const spec = buildVChartSpec(chart, {
      width,
      height,
    });
    const instance = new VChart(spec as any, { dom: container });
    await instance.renderAsync();
    const dataUrl = await instance.getDataURL();
    instance.release();
    return typeof dataUrl === 'string' ? dataUrl : undefined;
  } catch {
    return undefined;
  } finally {
    container.remove();
  }
}
