/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { createDefaultTemplate } from '@report-designer/core';
import { describe, expect, it, vi } from 'vitest';
import { ExpressionMonacoEditor } from '../components/expression/ExpressionMonacoEditor';

const monacoEditorMock = vi.hoisted(() => ({
  lastProps: undefined as Record<string, unknown> | undefined,
}));

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

describe('phase 44 expression monaco editor component', () => {
  it('renders Monaco with the report-expression language and propagates changes', () => {
    const template = createDefaultTemplate('Monaco Editor');
    let nextValue = '';

    render(
      <ExpressionMonacoEditor
        ariaLabel="Expression"
        value="SUM()"
        template={template}
        locale="zh-CN"
        onChange={(value) => {
          nextValue = value;
        }}
        onDiagnostics={() => undefined}
      />,
    );

    expect(monacoEditorMock.lastProps).toMatchObject({
      language: 'report-expression',
      path: 'inmemory://report-expression/expression.expr',
      value: 'SUM()',
      height: 260,
    });
    fireEvent.change(screen.getByLabelText('Expression'), { target: { value: 'DATEADD(TODAY(), "day", 1)' } });
    expect(nextValue).toBe('DATEADD(TODAY(), "day", 1)');
  });
});
