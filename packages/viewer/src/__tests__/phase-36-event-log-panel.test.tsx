/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReportTemplate, TextComponent } from '@report-designer/core';
import { Viewer } from '../components/Viewer';
import { EventLogPanel } from '../components/EventLogPanel';
import { viewerMessages } from '../i18n';

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

  it('selects an event log entry for editor navigation', () => {
    const onEventLogSelect = vi.fn();

    render(<Viewer template={eventLogTemplate()} data={{}} onEventLogSelect={onEventLogSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'Event Logs' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Open Event' }).at(-1)!);

    expect(onEventLogSelect).toHaveBeenCalledWith(expect.objectContaining({
      ownerType: 'band',
      ownerId: 'title-band',
      eventName: 'beforePrint',
      line: 2,
      message: 'line boom',
    }));
  });

  it('filters, clears, and exports event logs from the viewer', () => {
    const onEventLogsClear = vi.fn();
    const onEventLogsExport = vi.fn();

    render(
      <Viewer
        template={eventLogTemplate()}
        data={{}}
        onEventLogsClear={onEventLogsClear}
        onEventLogsExport={onEventLogsExport}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Event Logs' }));
    expect(screen.getByText('start')).toBeInTheDocument();
    expect(screen.getByText('line boom')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Error' }));
    expect(screen.queryByText('start')).not.toBeInTheDocument();
    expect(screen.getByText('line boom')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Export Event Logs' }));
    expect(onEventLogsExport).toHaveBeenCalledWith([
      expect.objectContaining({ level: 'error', message: 'line boom' }),
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Clear Event Logs' }));
    expect(onEventLogsClear).toHaveBeenCalledTimes(1);
  });

  it('keeps output-mode event errors visible in the event log panel after PDF export', async () => {
    render(<Viewer template={printOnlyEventLogTemplate()} data={{}} />);

    expect(screen.queryByRole('button', { name: 'Event Logs' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Event Logs' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Event Logs' }));

    expect(screen.getByText('print-only boom')).toBeInTheDocument();
    expect(screen.getAllByText(/beforePrint/).length).toBeGreaterThan(0);
  });

  it('localizes viewer toolbar and event log operations to Chinese', () => {
    render(<Viewer template={eventLogTemplate()} data={{}} locale="zh-CN" onEventLogSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: '打印' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '导出 PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '上一页' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一页' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '事件日志' }));

    expect(screen.getByText('事件日志')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '全部' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '错误' })).toBeInTheDocument();
    expect(screen.getAllByText('信息').length).toBeGreaterThan(0);
    expect(screen.getAllByText('错误').length).toBeGreaterThan(0);
    expect(screen.queryByText('INFO')).not.toBeInTheDocument();
    expect(screen.queryByText('ERROR')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '打开事件' }).length).toBeGreaterThan(0);
  });

  it('shows the localized empty event log state', () => {
    render(
      <EventLogPanel
        open
        logs={[]}
        onClose={() => {}}
        messages={viewerMessages['zh-CN']}
      />,
    );

    expect(screen.getByText('暂无事件日志')).toBeInTheDocument();
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

function printOnlyEventLogTemplate(): ReportTemplate {
  return {
    id: 'report-1',
    name: 'Print Only Event Logs',
    version: '2.0',
    events: {
      beforePrint: { enabled: true, script: 'throw new Error("print-only boom");' },
    },
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
            components: [],
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
