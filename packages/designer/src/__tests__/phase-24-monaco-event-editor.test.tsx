/* @vitest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
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
        setDiagnosticsOptions: vi.fn(),
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

const dataContext = {
  activeDataSourceId: 'employees',
  dataSources: [
    {
      id: 'employees',
      name: 'Employees',
      fields: [
        { name: 'salary', type: 'number' as const },
        { name: 'unit-price', type: 'number' as const },
      ],
    },
  ],
  parameters: [{ id: 'amount_field', name: 'amountField', type: 'string' as const }],
};

function toggleTreeNode(title: string) {
  const browser = document.querySelector('.rd-event-editor-browser');
  const node = screen
    .getAllByText(title)
    .map(element => element.closest('.ant-tree-treenode'))
    .find(element => element?.closest('.rd-event-editor-browser') === browser && !element.closest('[aria-hidden="true"]'));
  const switcher = node?.querySelector<HTMLElement>('.ant-tree-switcher');
  if (!switcher) {
    throw new Error(`Missing tree switcher for ${title}`);
  }
  fireEvent.click(switcher);
}

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

  it('documents table row height for scripts that read template table rows', () => {
    const extraLib = buildEventEditorExtraLib('report', 'beforeData');

    expect(extraLib).toContain('interface TableRow');
    expect(extraLib).toContain('height?: number;');
    expect(extraLib).toContain('rows?: TableRow[];');
  });

  it('adds typed event data declarations to the selected event ctx extra lib', () => {
    const extraLib = buildEventEditorExtraLib('component', 'getValue', dataContext);

    expect(extraLib).toContain('declare const ctx: ComponentGetValueEventContext & EventEditorTypedContext');
    expect(extraLib).toContain('salary: number;');
    expect(extraLib).toContain('amountField?: string;');
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
            children: [{ key: 'title-text-id', title: 'TitleText', name: 'TitleText' }],
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
      detail: 'title-text-id',
      insertText: 'ctx.getComponent?.("TitleText")',
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

  it('flattens a single root data source for dictionary completions', () => {
    const items = buildEventScriptCompletions(
      {
        dictionaryItems: [{
          key: 'root',
          title: 'root',
          children: [
            { key: 'root.sizeGroups', title: 'sizeGroups' },
            { key: 'root.items.amount', title: 'items.amount' },
          ],
        }],
      },
      monaco,
    );

    expect(items).toEqual([
      expect.objectContaining({ label: 'sizeGroups', detail: 'sizeGroups', insertText: '{sizeGroups}' }),
      expect.objectContaining({ label: 'items.amount', detail: 'items.amount', insertText: '{items.amount}' }),
    ]);
  });

  it('adds row, data source, and parameter completions before dictionary fields', () => {
    const items = buildEventScriptCompletions(
      {
        helperItems: [{ label: 'ctx.hide', insertText: 'ctx.hide?.();', detail: 'Hide component' }],
        dataContext,
        dictionaryItems: [{ key: 'Orders.Amount', title: 'Orders.Amount' }],
      },
      monaco,
    );

    expect(items.map(item => item.label)).toEqual(expect.arrayContaining([
      'ctx.row.salary',
      'ctx.row["unit-price"]',
      'ctx.data.employees',
      'ctx.parameters.amountField',
    ]));
    expect(items.find(item => item.label === 'ctx.row.salary')).toMatchObject({
      kind: monaco.CompletionItemKind.Field,
      insertText: 'ctx.row?.salary',
    });
    expect(items.find(item => item.label === 'ctx.row["unit-price"]')).toMatchObject({
      kind: monaco.CompletionItemKind.Field,
      insertText: 'ctx.row?.["unit-price"]',
    });
    expect(items.find(item => item.label === 'ctx.data.employees')).toMatchObject({
      kind: monaco.CompletionItemKind.Variable,
      insertText: 'ctx.data.employees',
    });
    expect(items.find(item => item.label === 'ctx.parameters.amountField')).toMatchObject({
      kind: monaco.CompletionItemKind.Variable,
      insertText: 'ctx.parameters?.amountField',
    });
    expect(items.filter(item => item.label.startsWith('ctx.row'))).toHaveLength(2);
    expect(items.filter(item => item.label.startsWith('ctx.parameters'))).toHaveLength(1);
    expect(items.findIndex(item => item.label === 'ctx.hide')).toBeLessThan(
      items.findIndex(item => item.label === 'ctx.row.salary'),
    );
    expect(items.findIndex(item => item.label === 'ctx.parameters.amountField')).toBeLessThan(
      items.findIndex(item => item.label === 'Orders.Amount'),
    );
  });

  it('uses bracket access for invalid data source and parameter completion inserts', () => {
    const items = buildEventScriptCompletions(
      {
        dataContext: {
          activeDataSourceId: 'order-lines',
          dataSources: [
            {
              id: 'order-lines',
              name: 'Order Lines',
              fields: [{ name: 'unit-price', type: 'number' as const }],
            },
          ],
          parameters: [{ id: 'amount-field', name: 'amount-field', type: 'number' as const }],
        },
      },
      monaco,
    );

    expect(items.find(item => item.label === 'ctx.row["unit-price"]')).toMatchObject({
      kind: monaco.CompletionItemKind.Field,
      insertText: 'ctx.row?.["unit-price"]',
    });
    expect(items.find(item => item.label === 'ctx.data["order-lines"]')).toMatchObject({
      kind: monaco.CompletionItemKind.Variable,
      insertText: 'ctx.data["order-lines"]',
    });
    expect(items.find(item => item.label === 'ctx.parameters["amount-field"]')).toMatchObject({
      kind: monaco.CompletionItemKind.Variable,
      insertText: 'ctx.parameters?.["amount-field"]',
    });
    expect(items.filter(item => item.label.startsWith('ctx.row'))).toHaveLength(1);
    expect(items.filter(item => item.label.startsWith('ctx.parameters'))).toHaveLength(1);
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

  it('filters implicit any diagnostics from event scripts', () => {
    const result = splitDiagnostics([
      { severity: 4, startLineNumber: 31, message: "Parameter 'seed' implicitly has an 'any' type, but a better type may be inferred from usage." },
      { severity: 4, startLineNumber: 32, message: "Variable 'value' implicitly has type 'any' in some locations where its type cannot be determined." },
      { severity: 4, startLineNumber: 40, message: 'Unused value' },
    ]);

    expect(result).toEqual({
      blocking: [],
      warnings: ['Line 40: Unused value'],
    });
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

  it('places the Monaco cursor on an initial script location', () => {
    const editor = {
      setPosition: vi.fn(),
      revealLineInCenter: vi.fn(),
      focus: vi.fn(),
    };

    render(
      <EventScriptEditor
        ariaLabel="Script"
        value={'ctx.log.info("start");\nthrow new Error("line boom");'}
        targetType="band"
        eventName="beforePrint"
        initialCursor={{ line: 2, column: 3 }}
        onChange={() => undefined}
      />,
    );

    const props = monacoEditorMock.lastProps;
    expect(props).toBeDefined();

    (props?.onMount as (_editor: typeof editor, monacoInstance: typeof monaco) => void)(editor, monaco);

    expect(editor.setPosition).toHaveBeenCalledWith({ lineNumber: 2, column: 3 });
    expect(editor.revealLineInCenter).toHaveBeenCalledWith(2);
    expect(editor.focus).toHaveBeenCalledTimes(1);
  });

  it('wires event script editor lifecycle props into Monaco configuration and diagnostics', () => {
    const onDiagnostics = vi.fn();
    const helperItems = [{ label: 'ctx.hide', insertText: 'ctx.hide?.();', detail: 'Hide component' }];
    const dictionaryItems = [{ key: 'Order.Amount', title: 'Order.Amount' }];
    const componentItems = [{ key: 'total-label-id', title: 'TotalLabel', name: 'TotalLabel' }];
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
      noImplicitAny: false,
      noImplicitThis: false,
      strict: false,
      target: monaco.languages.typescript.ScriptTarget.ES2020,
    });
    expect(monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions).toHaveBeenCalledWith({
      noSuggestionDiagnostics: true,
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
        expect.objectContaining({ label: 'TotalLabel', insertText: 'ctx.getComponent?.("TotalLabel")' }),
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

  it('adds typed event data declarations to the editor extra lib during mount', () => {
    render(
      <EventScriptEditor
        ariaLabel="Script"
        value=""
        targetType="component"
        eventName="getValue"
        dataContext={dataContext}
        onChange={() => undefined}
      />,
    );

    const props = monacoEditorMock.lastProps;
    expect(props).toBeDefined();

    (props?.beforeMount as (monacoInstance: typeof monaco) => void)(monaco);
    (props?.onMount as (_editor: unknown, monacoInstance: typeof monaco) => void)({}, monaco);

    expect(monaco.languages.typescript.javascriptDefaults.addExtraLib).toHaveBeenCalledWith(
      expect.stringContaining('EventEditorTypedContext'),
      'inmemory://event-scripts/event-api.d.ts',
    );
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

  it('refreshes the event api extra lib when data context changes', () => {
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
        dataContext={dataContext}
        onChange={() => undefined}
      />,
    );

    const firstProps = monacoEditorMock.lastProps;
    (firstProps?.onMount as (_editor: unknown, monacoInstance: typeof monaco) => void)({}, monaco);

    expect(monaco.languages.typescript.javascriptDefaults.addExtraLib).toHaveBeenCalledWith(
      expect.stringContaining('salary: number;'),
      'inmemory://event-scripts/event-api.d.ts',
    );

    rerender(
      <EventScriptEditor
        ariaLabel="Script"
        value=""
        targetType="component"
        eventName="getValue"
        dataContext={{
          ...dataContext,
          dataSources: [
            {
              id: 'employees',
              name: 'Employees',
              fields: [{ name: 'department', type: 'string' as const }],
            },
          ],
        }}
        onChange={() => undefined}
      />,
    );

    expect(firstExtraLibDisposable.dispose).toHaveBeenCalledTimes(1);
    expect(monaco.languages.typescript.javascriptDefaults.addExtraLib).toHaveBeenLastCalledWith(
      expect.stringContaining('department: string;'),
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
    expect(screen.queryByText('Set event value')).not.toBeInTheDocument();

    toggleTreeNode('Script templates');
    fireEvent.click(screen.getByText('Set event value'));
    expect(screen.getByLabelText('Script')).toHaveValue('ctx.setValue?.("");');

    fireEvent.click(screen.getByText('Apply'));
    expect(saved).toMatchObject({
      getValue: { enabled: true, script: 'ctx.setValue?.("");' },
    });
  });

  it('opens the requested event and forwards the initial script cursor', () => {
    render(
      <DesignerI18nProvider locale="en-US">
        <EventEditorDialog
          open
          targetType="component"
          events={{
            getValue: { enabled: true, script: 'ctx.setValue?.("old");' },
            beforePrint: { enabled: true, script: 'ctx.log.info("start");\nthrow new Error("line boom");' },
          }}
          initialEventName="beforePrint"
          initialCursor={{ line: 2, column: 4 }}
          onCancel={() => undefined}
          onSave={() => undefined}
        />
      </DesignerI18nProvider>,
    );

    expect(screen.getByLabelText('Script')).toHaveValue('ctx.log.info("start");\nthrow new Error("line boom");');
    expect(monacoEditorMock.lastProps).toMatchObject({
      path: 'inmemory://event-scripts/component/beforePrint.js',
      value: 'ctx.log.info("start");\nthrow new Error("line boom");',
    });
  });

  it('lets users expand the event editor dialog to a fullscreen editing layout', () => {
    render(
      <DesignerI18nProvider locale="en-US">
        <EventEditorDialog
          open
          targetType="component"
          events={{}}
          onCancel={() => undefined}
          onSave={() => undefined}
        />
      </DesignerI18nProvider>,
    );

    expect(monacoEditorMock.lastProps?.height).toBe('100%');

    fireEvent.click(screen.getByTestId('event-editor-fullscreen-toggle'));

    expect(screen.getByLabelText('Exit fullscreen')).toBeInTheDocument();
    expect(monacoEditorMock.lastProps?.height).toBe('100%');
    const modal = screen.getByLabelText('Exit fullscreen').closest('.ant-modal') as HTMLElement | null;
    const modalWrap = screen.getByLabelText('Exit fullscreen').closest('.rd-event-editor-modal-fullscreen') as HTMLElement | null;
    expect(modal).toHaveStyle({
      top: '0px',
      height: '100vh',
      paddingBottom: '0px',
    });
    expect(modalWrap).toHaveStyle({ zIndex: '9999' });
    expect(modalWrap).toBeTruthy();
    expect(screen.getByLabelText('Enabled')).toBeInTheDocument();
    expect(screen.getByLabelText('Enabled')).toHaveStyle({ alignSelf: 'flex-start' });
    expect(screen.getByText('Validation passed')).toBeInTheDocument();
    const title = screen.getByLabelText('Exit fullscreen').parentElement;
    expect(title).toHaveStyle({ paddingRight: '40px' });
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
    expect(screen.queryByText('设置事件值')).not.toBeInTheDocument();
    toggleTreeNode('脚本模板');
    expect(screen.getByText('设置事件值')).toBeInTheDocument();
  });

  it('keeps side tree groups collapsed by default and reveals nested fields through search', () => {
    render(
      <DesignerI18nProvider locale="en-US">
        <EventEditorDialog
          open
          targetType="component"
          events={{}}
          dictionaryItems={[{ key: 'Orders.Amount', title: 'Orders.Amount' }]}
          onCancel={() => undefined}
          onSave={() => undefined}
        />
      </DesignerI18nProvider>,
    );

    expect(screen.getByText('Fields')).toBeInTheDocument();
    expect(screen.queryByText('Orders.Amount')).not.toBeInTheDocument();

    toggleTreeNode('Fields');
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.queryByText('Amount')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'Amount' } });
    expect(screen.getByText('Amount')).toBeInTheDocument();
  });

  it('renders a single root data source as a nested event field tree', async () => {
    render(
      <DesignerI18nProvider locale="en-US">
        <EventEditorDialog
          open
          targetType="component"
          events={{}}
          dictionaryItems={[{
            key: 'root',
            title: 'root',
            children: [
              { key: 'root.sizeGroups', title: 'sizeGroups' },
              { key: 'root.items.amount', title: 'items.amount' },
            ],
          }]}
          onCancel={() => undefined}
          onSave={() => undefined}
        />
      </DesignerI18nProvider>,
    );

    toggleTreeNode('Fields');

    expect(screen.queryByText('root')).not.toBeInTheDocument();
    expect(screen.getByText('sizeGroups')).toBeInTheDocument();
    expect(screen.getByText('items')).toBeInTheDocument();
    expect(screen.queryByText('items.amount')).not.toBeInTheDocument();
    expect(screen.queryByText('amount')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'amount' } });
    expect(screen.getByText('amount')).toBeInTheDocument();

    fireEvent.click(screen.getByText('amount'));
    expect(screen.getByLabelText('Script')).toHaveValue('{items.amount}');
  });

  it('uses expression editor sized and styled panels for the event editor dialog', () => {
    render(
      <DesignerI18nProvider locale="en-US">
        <EventEditorDialog
          open
          targetType="component"
          events={{}}
          dictionaryItems={[{ key: 'Orders.Amount', title: 'Orders.Amount' }]}
          onCancel={() => undefined}
          onSave={() => undefined}
        />
      </DesignerI18nProvider>,
    );

    const modal = screen.getByRole('dialog').closest('.ant-modal') as HTMLElement | null;
    expect(modal).toHaveStyle({ width: '1040px' });
    expect(screen.getByLabelText('Script').closest('.rd-event-editor-main')).toBeInTheDocument();
    const treeSearch = screen.getByPlaceholderText('Search');
    expect(treeSearch.closest('.rd-event-editor-browser')).toBeInTheDocument();
    expect(treeSearch.closest('.rd-event-editor-browser')?.querySelector('.rd-event-editor-browser-tree')).toBeInTheDocument();
  });

  it('filters side tree helpers, fields, and components from the search box', () => {
    render(
      <DesignerI18nProvider locale="en-US">
        <EventEditorDialog
          open
          targetType="component"
          events={{}}
          dictionaryItems={[{ key: 'Orders.Amount', title: 'Orders.Amount' }]}
          componentItems={[{ key: 'total-label-id', title: 'TotalLabel', name: 'TotalLabel' }]}
          onCancel={() => undefined}
          onSave={() => undefined}
        />
      </DesignerI18nProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'Amount' } });
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.queryByText('TotalLabel')).not.toBeInTheDocument();
    expect(screen.queryByText(/ctx\.hide/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'Total' } });
    expect(screen.getByText('TotalLabel')).toBeInTheDocument();
    expect(screen.queryByText('Orders.Amount')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'ctx.hide' } });
    expect(screen.getByText(/ctx\.hide/)).toBeInTheDocument();
    expect(screen.queryByText('Orders.Amount')).not.toBeInTheDocument();
    expect(screen.queryByText('TotalLabel')).not.toBeInTheDocument();
  });

  it('allows applying when editor diagnostics only contain warnings', () => {
    let saved: unknown;

    render(
      <DesignerI18nProvider locale="en-US">
        <EventEditorDialog
          open
          targetType="component"
          events={{ getValue: { enabled: true, script: 'ctx.setValue?.("ok");' } }}
          onCancel={() => undefined}
          onSave={(events) => { saved = events; }}
        />
      </DesignerI18nProvider>,
    );

    act(() => {
      (monacoEditorMock.lastProps?.onValidate as (markers: Array<{ severity: number; startLineNumber: number; message: string }>) => void)([
        { severity: 4, startLineNumber: 1, message: 'Unused value' },
      ]);
    });

    expect(screen.getByText('Type warnings')).toBeInTheDocument();
    expect(screen.getByTestId('event-editor-diagnostics')).toHaveStyle({
      maxHeight: '120px',
      overflowY: 'auto',
    });
    fireEvent.click(screen.getByText('Apply'));

    expect(saved).toMatchObject({
      getValue: { enabled: true, script: 'ctx.setValue?.("ok");' },
    });
  });

  it('blocks applying on blocking diagnostics until script edits clear them', () => {
    let saved: unknown;

    render(
      <DesignerI18nProvider locale="en-US">
        <EventEditorDialog
          open
          targetType="component"
          events={{ getValue: { enabled: true, script: 'ctx.setValue?.("old");' } }}
          onCancel={() => undefined}
          onSave={(events) => { saved = events; }}
        />
      </DesignerI18nProvider>,
    );

    act(() => {
      (monacoEditorMock.lastProps?.onValidate as (markers: Array<{ severity: number; startLineNumber: number; message: string }>) => void)([
        { severity: 8, startLineNumber: 1, message: 'Unexpected token' },
      ]);
    });

    fireEvent.click(screen.getByText('Apply'));
    expect(saved).toBeUndefined();
    expect(screen.getByText('Line 1: Unexpected token')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Script'), { target: { value: 'ctx.setValue?.("new");' } });
    fireEvent.click(screen.getByText('Apply'));

    expect(saved).toMatchObject({
      getValue: { enabled: true, script: 'ctx.setValue?.("new");' },
    });
  });

  it('inserts namespaced field keys as fields instead of helper snippets', async () => {
    render(
      <DesignerI18nProvider locale="en-US">
        <EventEditorDialog
          open
          targetType="component"
          events={{}}
          dictionaryItems={[{ key: 'helper:ctx.hide', title: 'Conflicting field' }]}
          onCancel={() => undefined}
          onSave={() => undefined}
        />
      </DesignerI18nProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'Conflicting field' } });
    fireEvent.click(screen.getByText('Conflicting field'));

    expect(screen.getByLabelText('Script')).toHaveValue('{helper:ctx.hide}');
  });
});
