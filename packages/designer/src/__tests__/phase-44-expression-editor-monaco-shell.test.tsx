/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { describe, expect, it, vi } from 'vitest';
import { ExpressionEditor } from '../components/ExpressionEditor';
import { DesignerI18nProvider } from '../i18n';
import { useDesignerStore } from '../store/designer-store';

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

function loadTemplate() {
  const template = createDefaultTemplate('Expression Shell');
  template.dataSources = [
    {
      id: 'Orders',
      name: 'Orders',
      type: 'json',
      schema: [{ name: 'Amount', type: 'number' }],
      sampleRows: [{ Amount: 88.8 }],
    } as any,
  ];
  useDesignerStore.getState().loadTemplate(template);
}

describe('phase 44 expression editor monaco shell', () => {
  it('uses Monaco, shows function categories, and applies edited values', async () => {
    loadTemplate();
    let value = '';
    render(
      <DesignerI18nProvider locale="zh-CN">
        <ExpressionEditor
          open
          value=""
          onChange={(next) => {
            value = next;
          }}
          onClose={() => undefined}
        />
      </DesignerI18nProvider>,
    );

    expect(monacoEditorMock.lastProps).toMatchObject({ language: 'report-expression' });
    expect(screen.getByRole('button', { name: /日期/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /数字/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /文本/ })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('表达式'), { target: { value: 'FORMAT("N2", {Orders.Amount})' } });
    fireEvent.click(screen.getByRole('button', { name: '执行' }));
    expect(await screen.findByText(/执行结果.*88.80/)).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /确\s*定/ }));
    await waitFor(() => expect(value).toBe('FORMAT("N2", {Orders.Amount})'));
  });
});
