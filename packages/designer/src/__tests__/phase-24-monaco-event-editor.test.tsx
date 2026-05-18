import { describe, expect, it } from 'vitest';
import {
  buildEventEditorExtraLib,
  buildEventScriptCompletions,
  getEventScriptModelPath,
  splitDiagnostics,
} from '../components/events/event-script-monaco';

const monaco = {
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
});
