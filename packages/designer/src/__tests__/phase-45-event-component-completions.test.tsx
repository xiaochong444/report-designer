/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DesignerI18nProvider } from '../i18n';
import { EventEditorDialog } from '../components/events/EventEditorDialog';
import { buildEventScriptCompletions } from '../components/events/event-script-monaco';

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
      <textarea
        aria-label={props['aria-label'] as string}
        value={props.value as string}
        onChange={(event) => (props.onChange as (value: string | undefined) => void)(event.target.value)}
      />
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

function toggleTreeNode(title: string) {
  const node = screen.getByText(title).closest('.ant-tree-treenode');
  const switcher = node?.querySelector<HTMLElement>('.ant-tree-switcher');
  if (!switcher) {
    throw new Error(`Missing tree switcher for ${title}`);
  }
  fireEvent.click(switcher);
}

describe('phase 45 event component completions', () => {
  beforeEach(() => {
    monacoEditorMock.lastProps = undefined;
    vi.clearAllMocks();
  });

  it('inserts component names for raw, base handle, and typed helper completions', () => {
    const items = buildEventScriptCompletions(
      {
        componentItems: [
          {
            key: 'cmp-internal-1',
            title: 'OrderSizeHeaderTable',
            name: 'OrderSizeHeaderTable',
            type: 'table',
          },
          {
            key: 'cmp-internal-2',
            title: 'OrderTitleText',
            name: 'OrderTitleText',
            type: 'text',
          },
        ],
      } as any,
      monaco,
    );

    expect(items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: 'OrderSizeHeaderTable',
        insertText: 'ctx.getComponent?.("OrderSizeHeaderTable")',
        detail: 'table',
      }),
      expect.objectContaining({
        label: 'ctx.component("OrderSizeHeaderTable")',
        insertText: 'ctx.component?.("OrderSizeHeaderTable")',
        detail: 'table',
      }),
      expect.objectContaining({
        label: 'ctx.table("OrderSizeHeaderTable")',
        insertText: 'ctx.table?.("OrderSizeHeaderTable")',
        detail: 'table',
      }),
      expect.objectContaining({
        label: 'ctx.text("OrderTitleText")',
        insertText: 'ctx.text?.("OrderTitleText")',
        detail: 'text',
      }),
    ]));
    expect(items.map(item => item.insertText)).not.toContain('cmp-internal-1');
    expect(items.map(item => item.insertText)).not.toContain('cmp-internal-2');
  });

  it('does not treat nameless component ids as insertable component names', () => {
    const items = buildEventScriptCompletions(
      {
        componentItems: [
          {
            key: 'internal-id',
            title: 'internal-id',
          },
          {
            key: 'named-component-id',
            title: 'OrderTitleText (text)',
            name: 'OrderTitleText',
            type: 'text',
          },
        ],
      },
      monaco,
    );

    expect(items.map(item => item.label)).not.toContain('internal-id');
    for (const item of items) {
      expect(item.insertText).not.toContain('internal-id');
    }
    expect(items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: 'OrderTitleText (text)',
        insertText: 'ctx.getComponent?.("OrderTitleText")',
      }),
      expect.objectContaining({
        label: 'ctx.text("OrderTitleText")',
        insertText: 'ctx.text?.("OrderTitleText")',
      }),
    ]));
  });

  it('forwards dialog typed component groups into Monaco completions', () => {
    const Dialog = EventEditorDialog as any;

    render(
      <DesignerI18nProvider locale="en-US">
        <Dialog
          open
          targetType="component"
          events={{}}
          tableItems={[{ name: 'OrderSizeHeaderTable', type: 'table' }]}
          onCancel={() => undefined}
          onSave={() => undefined}
        />
      </DesignerI18nProvider>,
    );

    (monacoEditorMock.lastProps?.onMount as (_editor: unknown, monacoInstance: typeof monaco) => void)({}, monaco);
    const provider = vi.mocked(monaco.languages.registerCompletionItemProvider).mock.calls[0]?.[1];

    expect(provider?.provideCompletionItems().suggestions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: 'ctx.table("OrderSizeHeaderTable")',
        insertText: 'ctx.table?.("OrderSizeHeaderTable")',
      }),
    ]));
  });

  it('omits nameless component ids from the dialog side tree', () => {
    render(
      <DesignerI18nProvider locale="en-US">
        <EventEditorDialog
          open
          targetType="component"
          events={{}}
          componentItems={[
            { key: 'internal-id', title: 'internal-id' },
            { key: 'named-component-id', title: 'OrderTitleText (text)', name: 'OrderTitleText', type: 'text' },
          ]}
          onCancel={() => undefined}
          onSave={() => undefined}
        />
      </DesignerI18nProvider>,
    );

    expect(document.body.textContent).not.toContain('internal-id');
    expect(document.body.textContent).not.toContain('OrderTitleText (text)');
    toggleTreeNode('Components');
    expect(document.body.textContent).toContain('OrderTitleText (text)');
  });
});
