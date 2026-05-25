/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReportTemplate, TextComponent } from '@report-designer/core';
import { Viewer } from '../components/Viewer';

vi.mock('../export', () => ({
  downloadPDF: vi.fn().mockResolvedValue(undefined),
  exportToPDF: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  printReport: vi.fn().mockResolvedValue(undefined),
}));

describe('phase 36 event log panel', () => {
  beforeEach(() => {
    const computedStyle = window.getComputedStyle.bind(window);
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    Object.defineProperty(window, 'getComputedStyle', {
      writable: true,
      value: (element: Element) => {
        try {
          return computedStyle(element);
        } catch {
          return {
            getPropertyValue: () => '',
            width: '0px',
            height: '0px',
            overflow: 'visible',
            overflowX: 'visible',
            overflowY: 'visible',
          };
        }
      },
    });
  });

  it('shows event logs and script location in the viewer', () => {
    render(<Viewer template={eventLogTemplate()} data={{}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Event Logs' }));

    expect(screen.getByText('Event Logs')).toBeInTheDocument();
    expect(screen.getByText('line boom')).toBeInTheDocument();
    expect(screen.getAllByText(/Band/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/beforePrint/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Line 2/)).toBeInTheDocument();
  });
});

function eventLogTemplate(): ReportTemplate {
  const title: TextComponent = {
    id: 'title',
    name: 'Title',
    type: 'text',
    x: 0,
    y: 0,
    width: 80,
    height: 10,
    text: 'Title',
    font: { family: 'Arial', size: 12, bold: true, italic: false, underline: false, strikethrough: false, color: '#000000' },
    textAlign: 'left',
    verticalAlign: 'middle',
    border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    canGrow: true,
    canShrink: false,
  };

  return {
    id: 'report-1',
    name: 'Event Logs',
    version: '2.0',
    pages: [
      {
        id: 'page-1',
        width: 210,
        height: 297,
        margins: { top: 10, right: 10, bottom: 10, left: 10 },
        orientation: 'portrait',
        bands: [
          {
            id: 'title-band',
            type: 'reportTitle',
            height: 20,
            events: { beforePrint: { enabled: true, script: 'ctx.log.info("start");\nthrow new Error("line boom");' } },
            components: [title],
          },
        ],
      },
    ],
    dataSources: [],
    styles: [],
    conditionalFormats: [],
    parameters: [],
  };
}
