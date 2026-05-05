/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ExpressionEditorV2 } from '../components/expression/ExpressionEditorV2';

describe('Phase 5 ExpressionEditorV2', () => {
  it('inserts fields, aggregate functions, and page variables', () => {
    let value = '';
    render(
      <ExpressionEditorV2
        value=""
        dataSources={[{ id: 'employees', name: 'employees', type: 'json', schema: [{ name: 'salary', type: 'number' }] }]}
        onChange={(next) => { value = next; }}
      />,
    );

    fireEvent.click(screen.getByText('employees.salary'));
    expect(value).toBe('{employees.salary}');

    fireEvent.click(screen.getByText('SUM'));
    expect(value).toContain('SUM("employees"');

    fireEvent.click(screen.getByText('{PageNumber}'));
    expect(value).toContain('{PageNumber}');
    expect(screen.getByText('Valid expression')).toBeInTheDocument();
  });
});
