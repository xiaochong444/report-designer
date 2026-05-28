/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { InlineExpressionEditor } from '../components/expression/InlineExpressionEditor';
import { DesignerI18nProvider } from '../i18n';

describe('Phase 5 inline expression editor', () => {
  it('inserts fields, aggregate functions, and page variables', () => {
    let value = '';
    render(
      <DesignerI18nProvider locale="en-US">
        <InlineExpressionEditor
          value=""
          dataSources={[{ id: 'employees', name: 'employees', type: 'json', schema: [{ name: 'salary', type: 'number' }] }]}
          onChange={(next) => { value = next; }}
        />
      </DesignerI18nProvider>,
    );

    fireEvent.click(screen.getByText('employees.salary'));
    expect(value).toBe('{employees.salary}');

    fireEvent.click(screen.getByText('SUM'));
    expect(value).toContain('SUM("employees"');

    fireEvent.click(screen.getByText('{PageNumber}'));
    expect(value).toContain('{PageNumber}');
    expect(screen.getByText('Valid expression')).toBeInTheDocument();
  });

  it('localizes validation copy to Chinese', () => {
    render(
      <DesignerI18nProvider locale="zh-CN">
        <InlineExpressionEditor
          value="{Orders.Total}"
          dataSources={[]}
          onChange={() => {}}
        />
      </DesignerI18nProvider>,
    );

    expect(screen.getByLabelText('表达式')).toBeInTheDocument();
    expect(screen.getByText('表达式有效')).toBeInTheDocument();
    expect(screen.getByText('报表表达式语法')).toBeInTheDocument();
  });
});
