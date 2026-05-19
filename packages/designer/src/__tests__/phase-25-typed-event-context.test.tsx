/* @vitest-environment jsdom */
import React from 'react';
import { render } from '@testing-library/react';
import type { ReportTemplate } from '@report-designer/core';
import { describe, expect, it, vi } from 'vitest';
import { DesignerI18nProvider } from '../i18n';
import { EventEditorDialog } from '../components/events/EventEditorDialog';
import { buildEventEditorDataContext } from '../components/events/event-editor-utils';

const monacoEditorMock = vi.hoisted(() => ({
  lastProps: undefined as Record<string, unknown> | undefined,
}));

const createDisposable = () => ({ dispose: vi.fn() });

vi.mock('@monaco-editor/react', () => ({
  default: (props: Record<string, unknown>) => {
    monacoEditorMock.lastProps = props;
    return <textarea aria-label={props['aria-label'] as string} value={props.value as string} readOnly />;
  },
}));

const monaco = {
  languages: {
    typescript: {
      ScriptTarget: {
        ES2020: 7,
      },
      javascriptDefaults: {
        setCompilerOptions: vi.fn(),
        addExtraLib: vi.fn((_content: string, _filePath?: string) => createDisposable()),
      },
    },
    CompletionItemKind: {
      Function: 1,
      Field: 2,
      Variable: 3,
      Snippet: 4,
    },
    CompletionItemInsertTextRule: {
      InsertAsSnippet: 4,
    },
    registerCompletionItemProvider: vi.fn((_language: string, _provider: { provideCompletionItems: () => unknown }) => createDisposable()),
  },
};

const template = {
  id: 'report',
  name: 'Report',
  version: '2.0',
  dataSources: [
    {
      id: 'employees',
      name: 'Employees',
      type: 'json',
      fields: [{ name: 'salary', type: 'number' }],
    },
    {
      id: 'departments',
      name: 'Departments',
      type: 'json',
      fields: [{ name: 'title', type: 'string' }],
    },
    {
      id: 'fallback',
      name: 'Fallback',
      type: 'json',
      fields: [{ name: 'code', type: 'string' }],
    },
  ],
  parameters: [{ id: 'threshold', name: 'threshold', type: 'number' }],
  styles: [],
  conditionalFormats: [],
  pages: [
    {
      id: 'page',
      width: 210,
      height: 297,
      margins: { top: 10, right: 10, bottom: 10, left: 10 },
      orientation: 'portrait',
      bands: [
        {
          id: 'detail',
          type: 'data',
          height: 20,
          dataBand: { dataSourceId: 'employees' },
          components: [{ id: 'salaryText', type: 'text', x: 0, y: 0, width: 20, height: 6 }],
        },
        {
          id: 'summary',
          type: 'footer',
          height: 16,
          dataSource: 'departments',
          components: [{ id: 'summaryText', type: 'text', x: 0, y: 0, width: 20, height: 6 }],
        },
        {
          id: 'fallbackBand',
          type: 'footer',
          height: 16,
          dataBand: {},
          dataSource: 'fallback',
          components: [],
        },
      ],
    },
  ],
} as ReportTemplate;

describe('phase 25 typed event context scope', () => {
  it('builds a band scoped data context from the selected band data source', () => {
    expect(buildEventEditorDataContext(template, { targetType: 'band', bandId: 'detail' })).toMatchObject({
      dataSources: template.dataSources,
      parameters: template.parameters,
      activeDataSourceId: 'employees',
    });

    expect(buildEventEditorDataContext(template, { targetType: 'band', bandId: 'fallbackBand' }).activeDataSourceId)
      .toBe('fallback');
  });

  it('builds a component scoped data context from the containing band', () => {
    expect(buildEventEditorDataContext(template, { targetType: 'component', componentId: 'summaryText' })).toMatchObject({
      dataSources: template.dataSources,
      parameters: template.parameters,
      activeDataSourceId: 'departments',
    });
  });

  it('builds a report scoped data context without an active data source', () => {
    expect(buildEventEditorDataContext(template, { targetType: 'report' })).toEqual({
      dataSources: template.dataSources,
      parameters: template.parameters,
      activeDataSourceId: undefined,
    });
  });

  it('passes dialog data context into the script editor Monaco setup', () => {
    const dataContext = buildEventEditorDataContext(template, { targetType: 'component', componentId: 'salaryText' });

    render(
      <DesignerI18nProvider locale="en-US">
        <EventEditorDialog
          open
          targetType="component"
          events={{}}
          dataContext={dataContext}
          onCancel={() => undefined}
          onSave={() => undefined}
        />
      </DesignerI18nProvider>,
    );

    const props = monacoEditorMock.lastProps;
    expect(props).toBeDefined();

    (props?.beforeMount as (monacoInstance: typeof monaco) => void)(monaco);
    (props?.onMount as (_editor: unknown, monacoInstance: typeof monaco) => void)({}, monaco);

    expect(monaco.languages.typescript.javascriptDefaults.addExtraLib).toHaveBeenCalledWith(
      expect.stringContaining('EventEditorTypedContext'),
      'inmemory://event-scripts/event-api.d.ts',
    );

    const provider = vi.mocked(monaco.languages.registerCompletionItemProvider).mock.calls[0]?.[1];
    expect(provider?.provideCompletionItems()).toEqual({
      suggestions: expect.arrayContaining([
        expect.objectContaining({ label: 'ctx.row.salary' }),
      ]),
    });
  });
});
