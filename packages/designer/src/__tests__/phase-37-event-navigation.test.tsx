/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultTemplate, type ReportTemplate } from '@report-designer/core';
import { Designer } from '../components/Designer';
import { useDesignerStore } from '../store/designer-store';

const monacoEditorMock = vi.hoisted(() => ({
  lastProps: undefined as Record<string, unknown> | undefined,
  editor: {
    setPosition: vi.fn(),
    revealLineInCenter: vi.fn(),
    focus: vi.fn(),
  },
}));

vi.mock('@monaco-editor/react', () => ({
  default: (props: Record<string, unknown>) => {
    monacoEditorMock.lastProps = props;
    (props.onMount as ((editor: typeof monacoEditorMock.editor, monaco: Record<string, unknown>) => void) | undefined)?.(monacoEditorMock.editor, {
      languages: {
        typescript: {
          ScriptTarget: { ES2020: 7 },
          javascriptDefaults: {
            setCompilerOptions: vi.fn(),
            addExtraLib: vi.fn(() => ({ dispose: vi.fn() })),
          },
        },
        CompletionItemKind: { Function: 1, Field: 2, Variable: 3, Snippet: 4 },
        CompletionItemInsertTextRule: { InsertAsSnippet: 4 },
        registerCompletionItemProvider: vi.fn(() => ({ dispose: vi.fn() })),
      },
    });
    return (
      <textarea
        aria-label={props['aria-label'] as string}
        value={props.value as string}
        onChange={(event) => (props.onChange as (value: string | undefined) => void)(event.target.value)}
      />
    );
  },
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

describe('phase 37 event navigation', () => {
  beforeEach(() => {
    monacoEditorMock.lastProps = undefined;
    monacoEditorMock.editor.setPosition.mockClear();
    monacoEditorMock.editor.revealLineInCenter.mockClear();
    monacoEditorMock.editor.focus.mockClear();
  });

  it('selects the logged band and opens the requested event at the logged script location', async () => {
    render(
      <Designer
        template={eventNavigationTemplate()}
        locale="en-US"
        eventNavigationTarget={{
          ownerType: 'band',
          ownerId: 'title-band',
          eventName: 'beforePrint',
          line: 2,
          column: 5,
          nonce: 1,
        }}
      />,
    );

    await waitFor(() => {
      expect(useDesignerStore.getState().selectedBandId).toBe('title-band');
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Script')).toHaveValue('ctx.log.info("start");\nthrow new Error("line boom");');
    expect(screen.getByText('Band')).toBeInTheDocument();
    expect(monacoEditorMock.lastProps).toMatchObject({
      path: 'inmemory://event-scripts/band/beforePrint.js',
      value: 'ctx.log.info("start");\nthrow new Error("line boom");',
    });
    expect(monacoEditorMock.editor.setPosition).toHaveBeenCalledWith({ lineNumber: 2, column: 5 });
    expect(monacoEditorMock.editor.revealLineInCenter).toHaveBeenCalledWith(2);
  });
});

function eventNavigationTemplate(): ReportTemplate {
  const template = createDefaultTemplate('Event Navigation');
  const page = template.pages[0];
  const titleBand = page.bands[0];

  titleBand.id = 'title-band';
  titleBand.events = {
    beforePrint: {
      enabled: true,
      script: 'ctx.log.info("start");\nthrow new Error("line boom");',
    },
  };

  return template;
}
