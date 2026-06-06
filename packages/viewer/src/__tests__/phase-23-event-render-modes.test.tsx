/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { RenderDocument, ReportTemplate, TextComponent } from '@report-designer/core';
import { Viewer } from '../components/Viewer';
import { downloadPDF, exportToPDF, printReport } from '../export';

vi.mock('../export', () => ({
  downloadPDF: vi.fn().mockResolvedValue(undefined),
  exportToPDF: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  printReport: vi.fn().mockResolvedValue(undefined),
}));

function eventTemplate(): ReportTemplate {
  const title: TextComponent = {
    id: 'title',
    name: 'Title',
    type: 'text',
    x: 0,
    y: 0,
    width: 80,
    height: 10,
    text: 'Original',
    font: { family: 'Arial', size: 12, bold: true, italic: false, underline: false, strikethrough: false, color: '#000000' },
    textAlign: 'left',
    verticalAlign: 'middle',
    border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    canGrow: true,
    canShrink: false,
  };

  return {
    id: 'report-1',
    name: 'Event Viewer',
    version: '2.0',
    events: {
      beforePreview: { enabled: true, script: 'ctx.bindText("Title", "Preview Title");' },
      beforePrint: { enabled: true, script: 'ctx.bindText("Title", "Output Title");' },
    },
    pages: [
      {
        id: 'page-1',
        width: 210,
        height: 297,
        margins: { top: 10, right: 10, bottom: 10, left: 10 },
        orientation: 'portrait',
        bands: [{ id: 'title-band', type: 'reportTitle', height: 20, components: [title] }],
      },
    ],
    dataSources: [],
    styles: [],
    conditionalFormats: [],
    parameters: [],
  };
}

function expressionTemplate(): ReportTemplate {
  const template = eventTemplate();
  template.events = undefined;
  const title = template.pages[0].bands[0].components[0] as TextComponent;
  title.text = 'CONCAT(MASKPHONE({Customers.Phone}), " - ", {TenantName})';
  template.pages[0].bands[0].type = 'data';
  template.pages[0].bands[0].dataBand = { dataSourceId: 'Customers' };
  return template;
}

function firstTextContent(document: RenderDocument): string | undefined {
  const text = document.pages[0]?.items.flatMap(item => item.components).find(component => component.type === 'text');
  return text && 'content' in text ? text.content : undefined;
}

describe('phase 23 viewer event render modes', () => {
  it('renders the visible preview with preview mode', () => {
    render(<Viewer template={eventTemplate()} data={{}} />);

    expect(screen.getByText('Preview Title')).toBeInTheDocument();
    expect(screen.queryByText('Output Title')).not.toBeInTheDocument();
  });

  it('prints the current preview document through the browser print path', () => {
    render(<Viewer template={eventTemplate()} data={{}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Print' }));

    expect(printReport).toHaveBeenCalledTimes(1);
    expect(firstTextContent(vi.mocked(printReport).mock.calls[0][0] as RenderDocument)).toBe('Preview Title');
  });

  it('renders PDF output with pdf mode before exporting', async () => {
    render(<Viewer template={eventTemplate()} data={{}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }));

    await waitFor(() => expect(exportToPDF).toHaveBeenCalledTimes(1));
    expect(firstTextContent(vi.mocked(exportToPDF).mock.calls[0][0] as RenderDocument)).toBe('Output Title');
    expect(downloadPDF).toHaveBeenCalledWith(new Uint8Array([1, 2, 3]), 'report.pdf');
  });

  it('passes custom expression functions and variables to preview, print, and pdf renders', async () => {
    render(
      <Viewer
        template={expressionTemplate()}
        data={{ Customers: [{ Phone: '13812345678' }] }}
        expressionVariables={{ TenantName: '演示租户' }}
        expressionFunctions={{
          MASKPHONE: ([phone]) => String(phone).replace(/^(\d{3})\d{4}(\d+)$/, '$1****$2'),
        }}
      />,
    );

    expect(screen.getByText('138****5678 - 演示租户')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Print' }));
    expect(firstTextContent(vi.mocked(printReport).mock.calls.at(-1)?.[0] as RenderDocument)).toBe('138****5678 - 演示租户');

    fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }));
    await waitFor(() => expect(exportToPDF).toHaveBeenCalled());
    expect(firstTextContent(vi.mocked(exportToPDF).mock.calls.at(-1)?.[0] as RenderDocument)).toBe('138****5678 - 演示租户');
  });
});
