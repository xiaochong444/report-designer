/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DesignerI18nProvider } from '../i18n';
import { EventEditorDialog } from '../components/events/EventEditorDialog';
import { EventScriptEditor } from '../components/events/EventScriptEditor';
import {
  buildEventEditorExtraLib,
  buildEventScriptCompletions,
  getEventScriptModelPath,
  splitDiagnostics,
} from '../components/events/event-script-monaco';

const monacoEditorMock = vi.hoisted(() => ({
  lastProps: undefined as Record<string, unknown> | undefined,
}));

interface CompletionProviderMock {
  provideCompletionItems: () => { suggestions: unknown[] };
}

const createDisposable = () => ({ dispose: vi.fn() });

vi.mock('@monaco-editor/react', () => ({
  default: (props: Record<string, unknown>) => {
    monacoEditorMock.lastProps = props;
    return (
      <>
        <span>{props.loading as React.ReactNode}</span>
        <textarea
          aria-label={props['aria-label'] as string}
          value={props.value as string}
          onChange={(event) => (props.onChange as (value: string | undefined) => void)(event.target.value)}
        />
      </>
    );
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
    registerCompletionItemProvider: vi.fn((_language: string, _provider: CompletionProviderMock) => createDisposable()),
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
};

describe('phase 24 monaco event editor helpers', () => {
  beforeEach(() => {
    monacoEditorMock.lastProps = undefined;
    vi.clearAllMocks();
  });

  it('builds a stable in-memory model path for event scripts', () => {
    expect(getEventScriptModelPath('component', 'getValue')).toBe(
      'inmemory://event-scripts/component/getValue.js',
    );
  });

  it('narrows the event editor ctx declaration for the selected event', () => {
    const extraLib = buildEventEditorExtraLib('component', 'getValue');

    expect(extraLib).toContain('declare const ctx: ComponentGetValueEventContext');
    expect(extraLib).toContain('interface ComponentGetValueEventContext');
    expect(extraLib.match(/declare const ctx:/g)).toHaveLength(1);
  });

  it('builds helper, dictionary, component, and example completions in editor order', () => {
    const items = buildEventScriptCompletions(
      {
        helperItems: [{ label: 'ctx.hide', insertText: 'ctx.hide?.();', detail: 'Hide component' }],
        dictionaryItems: [
          {
            key: 'Orders',
            title: 'Orders',
            children: [{ key: 'Orders.Amount', title: 'Orders.Amount' }],
          },
          { key: 'EmptyGroup', title: 'Empty group', insertable: false },
        ],
        componentItems: [
          {
            key: 'page1',
            title: 'Page 1',
            children: [{ key: 'TitleText', title: 'TitleText' }],
          },
        ],
        exampleItems: [{ label: 'Set value', insertText: 'ctx.setValue(${1:value});', detail: 'Example' }],
      },
      monaco,
    );

    expect(items.map(item => item.label)).toEqual(['ctx.hide', 'Orders.Amount', 'TitleText', 'Set value']);
    expect(items[1]).toMatchObject({
      detail: 'Orders.Amount',
      insertText: '{Orders.Amount}',
      kind: monaco.CompletionItemKind.Field,
    });
    expect(items[2]).toMatchObject({
      detail: 'TitleText',
      kind: monaco.CompletionItemKind.Variable,
    });
    expect(items[3]).toMatchObject({
      kind: monaco.CompletionItemKind.Snippet,
      insertTextRules: monaco.CompletionItemInsertTextRule.InsertAsSnippet,
    });
    expect(items[0]).toMatchObject({
      kind: monaco.CompletionItemKind.Function,
      insertTextRules: monaco.CompletionItemInsertTextRule.InsertAsSnippet,
    });
  });

  it('supports Monaco instances that expose completion constants through languages', () => {
    const items = buildEventScriptCompletions(
      { helperItems: [{ label: 'ctx.hide', insertText: 'ctx.hide?.();' }] },
      { languages: monaco },
    );

    expect(items[0]).toMatchObject({
      kind: monaco.CompletionItemKind.Function,
      insertTextRules: monaco.CompletionItemInsertTextRule.InsertAsSnippet,
    });
  });

  it('throws a clear error when Monaco completion constants are missing', () => {
    expect(() => buildEventScriptCompletions({ helperItems: [{ label: 'ctx.hide' }] }, {})).toThrow(
      'Monaco completion constants are not available.',
    );
  });

  it('splits diagnostics by blocking severity and warning severity', () => {
    const result = splitDiagnostics([
      { severity: 8, startLineNumber: 2, message: 'Unexpected token' },
      { severity: 4, startLineNumber: 5, message: 'Unused value' },
      { severity: 10, startLineNumber: 7, message: 'Cannot compile' },
    ]);

    expect(result.blocking).toEqual(['Line 2: Unexpected token', 'Line 7: Cannot compile']);
    expect(result.warnings).toEqual(['Line 5: Unused value']);
  });

  it('renders the event script editor loading text and forwards script changes', () => {
    const onChange = vi.fn();

    render(
      <EventScriptEditor
        ariaLabel="Script"
        value="ctx.log.info('ready');"
        targetType="component"
        eventName="beforePrint"
        loadingText="Loading script editor"
        onChange={onChange}
      />,
    );

    expect(screen.getByText('Loading script editor')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Script'), { target: { value: 'ctx.hide?.();' } });

    expect(onChange).toHaveBeenCalledWith('ctx.hide?.();');
    expect(monacoEditorMock.lastProps).toMatchObject({
      language: 'javascript',
      path: 'inmemory://event-scripts/component/beforePrint.js',
      height: '420px',
      options: {
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
        tabSize: 2,
      },
    });
  });

  it('wires event script editor lifecycle props into Monaco configuration and diagnostics', () => {
    const onDiagnostics = vi.fn();
    const helperItems = [{ label: 'ctx.hide', insertText: 'ctx.hide?.();', detail: 'Hide component' }];
    const dictionaryItems = [{ key: 'Order.Amount', title: 'Order.Amount' }];
    const componentItems = [{ key: 'TotalLabel', title: 'TotalLabel' }];
    const exampleItems = [{ label: 'Set value', insertText: 'ctx.setValue(${1:value});' }];

    render(
      <EventScriptEditor
        ariaLabel="Script"
        value=""
        targetType="component"
        eventName="getValue"
        helperItems={helperItems}
        dictionaryItems={dictionaryItems}
        componentItems={componentItems}
        exampleItems={exampleItems}
        onChange={() => undefined}
        onDiagnostics={onDiagnostics}
      />,
    );

    const props = monacoEditorMock.lastProps;
    expect(props).toBeDefined();

    (props?.beforeMount as (monacoInstance: typeof monaco) => void)(monaco);

    expect(monaco.languages.typescript.javascriptDefaults.setCompilerOptions).toHaveBeenCalledWith({
      allowNonTsExtensions: true,
      checkJs: true,
      noEmit: true,
      target: monaco.languages.typescript.ScriptTarget.ES2020,
    });

    (props?.onMount as (_editor: unknown, monacoInstance: typeof monaco) => void)({}, monaco);

    expect(monaco.languages.typescript.javascriptDefaults.addExtraLib).toHaveBeenCalledWith(
      expect.stringContaining('declare const ctx: ComponentGetValueEventContext'),
      'inmemory://event-scripts/event-api.d.ts',
    );

    expect(monaco.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
      'javascript',
      expect.objectContaining({ provideCompletionItems: expect.any(Function) }),
    );
    const provider = vi.mocked(monaco.languages.registerCompletionItemProvider).mock.calls[0]?.[1];
    expect(provider).toBeDefined();
    expect(provider!.provideCompletionItems()).toEqual({
      suggestions: expect.arrayContaining([
        expect.objectContaining({ label: 'ctx.hide' }),
        expect.objectContaining({ label: 'Order.Amount', insertText: '{Order.Amount}' }),
        expect.objectContaining({ label: 'TotalLabel', insertText: 'TotalLabel' }),
        expect.objectContaining({ label: 'Set value' }),
      ]),
    });

    (props?.onValidate as (markers: Array<{ severity: number; startLineNumber: number; message: string }>) => void)([
      { severity: 8, startLineNumber: 3, message: 'Unexpected token' },
      { severity: 4, startLineNumber: 9, message: 'Unused value' },
    ]);

    expect(onDiagnostics).toHaveBeenCalledWith({
      blocking: ['Line 3: Unexpected token'],
      warnings: ['Line 9: Unused value'],
    });
  });

  it('refreshes the event api extra lib when the selected event changes', () => {
    const firstExtraLibDisposable = createDisposable();
    const secondExtraLibDisposable = createDisposable();
    monaco.languages.typescript.javascriptDefaults.addExtraLib
      .mockReturnValueOnce(firstExtraLibDisposable)
      .mockReturnValueOnce(secondExtraLibDisposable);

    const { rerender } = render(
      <EventScriptEditor
        ariaLabel="Script"
        value=""
        targetType="component"
        eventName="getValue"
        onChange={() => undefined}
      />,
    );

    const firstProps = monacoEditorMock.lastProps;
    (firstProps?.onMount as (_editor: unknown, monacoInstance: typeof monaco) => void)({}, monaco);

    expect(monaco.languages.typescript.javascriptDefaults.addExtraLib).toHaveBeenCalledWith(
      expect.stringContaining('declare const ctx: ComponentGetValueEventContext'),
      'inmemory://event-scripts/event-api.d.ts',
    );

    rerender(
      <EventScriptEditor
        ariaLabel="Script"
        value=""
        targetType="component"
        eventName="beforePrint"
        onChange={() => undefined}
      />,
    );

    expect(firstExtraLibDisposable.dispose).toHaveBeenCalledTimes(1);
    expect(monaco.languages.typescript.javascriptDefaults.addExtraLib).toHaveBeenLastCalledWith(
      expect.stringContaining('declare const ctx: ComponentEventContext'),
      'inmemory://event-scripts/event-api.d.ts',
    );
    expect(secondExtraLibDisposable.dispose).not.toHaveBeenCalled();
  });

  it('uses latest completion items from an already registered provider', () => {
    const { rerender } = render(
      <EventScriptEditor
        ariaLabel="Script"
        value=""
        targetType="component"
        eventName="beforePrint"
        helperItems={[{ label: 'ctx.hide', insertText: 'ctx.hide?.();' }]}
        onChange={() => undefined}
      />,
    );

    const props = monacoEditorMock.lastProps;
    (props?.onMount as (_editor: unknown, monacoInstance: typeof monaco) => void)({}, monaco);
    const provider = vi.mocked(monaco.languages.registerCompletionItemProvider).mock.calls[0]?.[1];
    expect(provider).toBeDefined();

    rerender(
      <EventScriptEditor
        ariaLabel="Script"
        value=""
        targetType="component"
        eventName="beforePrint"
        helperItems={[{ label: 'ctx.show', insertText: 'ctx.show?.();' }]}
        onChange={() => undefined}
      />,
    );

    expect(provider!.provideCompletionItems()).toEqual({
      suggestions: [expect.objectContaining({ label: 'ctx.show', insertText: 'ctx.show?.();' })],
    });
  });

  it('disposes the completion provider and event api extra lib on unmount', () => {
    const extraLibDisposable = createDisposable();
    const completionDisposable = createDisposable();
    monaco.languages.typescript.javascriptDefaults.addExtraLib.mockReturnValueOnce(extraLibDisposable);
    monaco.languages.registerCompletionItemProvider.mockReturnValueOnce(completionDisposable);

    const { unmount } = render(
      <EventScriptEditor
        ariaLabel="Script"
        value=""
        targetType="component"
        eventName="beforePrint"
        onChange={() => undefined}
      />,
    );

    const props = monacoEditorMock.lastProps;
    (props?.onMount as (_editor: unknown, monacoInstance: typeof monaco) => void)({}, monaco);

    unmount();

    expect(completionDisposable.dispose).toHaveBeenCalledTimes(1);
    expect(extraLibDisposable.dispose).toHaveBeenCalledTimes(1);
  });

  it('uses fallback script target when ES2020 is unavailable', () => {
    const monacoWithoutScriptTarget = {
      ...monaco,
      languages: {
        ...monaco.languages,
        typescript: {
          ...monaco.languages.typescript,
          ScriptTarget: {},
        },
      },
    };

    render(
      <EventScriptEditor
        ariaLabel="Script"
        value=""
        targetType="component"
        eventName="beforePrint"
        onChange={() => undefined}
      />,
    );

    const props = monacoEditorMock.lastProps;
    (props?.beforeMount as (monacoInstance: typeof monacoWithoutScriptTarget) => void)(monacoWithoutScriptTarget);

    expect(monaco.languages.typescript.javascriptDefaults.setCompilerOptions).toHaveBeenCalledWith(
      expect.objectContaining({ target: 7 }),
    );
  });

  it('integrates script editing, localized helper groups, and get value examples in the dialog', () => {
    let saved: unknown;

    render(
      <DesignerI18nProvider locale="en-US">
        <EventEditorDialog
          open
          targetType="component"
          events={{}}
          onCancel={() => undefined}
          onSave={(events) => { saved = events; }}
        />
      </DesignerI18nProvider>,
    );

    expect(screen.getByText('Context helpers')).toBeInTheDocument();
    expect(screen.getByText('Set event value')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Set event value'));
    expect(screen.getByLabelText('Script')).toHaveValue('ctx.setValue?.("");');

    fireEvent.click(screen.getByText('Apply'));
    expect(saved).toMatchObject({
      getValue: { enabled: true, script: 'ctx.setValue?.("");' },
    });
  });

  it('renders Chinese dialog helper groups and examples', () => {
    render(
      <DesignerI18nProvider locale="zh-CN">
        <EventEditorDialog
          open
          targetType="component"
          events={{}}
          onCancel={() => undefined}
          onSave={() => undefined}
        />
      </DesignerI18nProvider>,
    );

    expect(screen.getByText('上下文辅助')).toBeInTheDocument();
    expect(screen.getByText('设置事件值')).toBeInTheDocument();
  });
});
