/* @vitest-environment jsdom */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const printReportMock = vi.fn();

vi.mock('@report-designer/viewer', () => ({
  Viewer: () => <div data-testid="viewer-stub">Viewer</div>,
  printReport: (...args: unknown[]) => printReportMock(...args),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
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

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

describe('example silent print smoke entry', () => {
  beforeEach(() => {
    printReportMock.mockReset();
    printReportMock.mockResolvedValue(undefined);
  });

  it('sends the selected sample to the Chrome native host without choosing a printer in the web app', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    const silentPrint = Array.from(container.querySelectorAll('button'))
      .find(button => button.textContent?.includes('静默打印测试'));
    expect(silentPrint).toBeTruthy();

    await act(async () => {
      silentPrint!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(printReportMock).toHaveBeenCalledTimes(1);
    expect(printReportMock.mock.calls[0][1]).toEqual({
      adapter: 'chrome-extension',
      chromeExtension: {
        backend: 'nativeMessaging',
        jobName: 'Grouped Employees',
        silent: true,
      },
    });
  });

  it('exposes a PDF print validation entry that targets Microsoft Print to PDF interactively', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    const pdfPrint = Array.from(container.querySelectorAll('button'))
      .find(button => button.textContent?.includes('PDF 打印验证') || button.textContent?.includes('PDF Print Validation'));
    expect(pdfPrint).toBeTruthy();

    await act(async () => {
      pdfPrint!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(printReportMock).toHaveBeenCalledTimes(1);
    expect(printReportMock.mock.calls[0][1]).toEqual({
      adapter: 'chrome-extension',
      chromeExtension: {
        backend: 'nativeMessaging',
        jobName: 'Grouped Employees',
        printerId: 'Microsoft Print to PDF',
        silent: false,
      },
    });
  });
});
