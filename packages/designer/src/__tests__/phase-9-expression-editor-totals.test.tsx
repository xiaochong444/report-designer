/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { ExpressionEditor } from '../components/ExpressionEditor';
import { useDesignerStore } from '../store/designer-store';

vi.mock('@monaco-editor/react', () => ({
  default: (props: Record<string, unknown>) => (
    <textarea
      aria-label={props['aria-label'] as string}
      value={props.value as string}
      onChange={(event) => (props.onChange as (value: string | undefined) => void)(event.target.value)}
    />
  ),
}));

describe('Phase 9 expression editor total shortcuts', () => {
  it('does not list page and report total functions in the expression browser', async () => {
    useDesignerStore.getState().loadTemplate(createDefaultTemplate('Expression Totals'));

    render(<ExpressionEditor open value="" onChange={() => {}} onClose={() => {}} />);

    expect(await screen.findByText('聚合函数')).toBeInTheDocument();
    expect(screen.queryByText('页/报表合计')).not.toBeInTheDocument();

    const functionLabels = screen.getAllByText(/SUM/).map(node => node.textContent ?? '');
    expect(functionLabels.some(text => text.startsWith('SUM'))).toBe(true);
    expect(functionLabels.some(text => text.startsWith('PAGESUM'))).toBe(false);
    expect(functionLabels.some(text => text.startsWith('REPORTSUM'))).toBe(false);
    expect(functionLabels.some(text => text.startsWith('TOTALS.PAGESUM'))).toBe(false);
    expect(functionLabels.some(text => text.startsWith('TOTALS.REPORTSUM'))).toBe(false);
  });

  it('lists money uppercase helpers in the expression browser', async () => {
    useDesignerStore.getState().loadTemplate(createDefaultTemplate('Expression Money'));

    render(<ExpressionEditor open value="" onChange={() => {}} onClose={() => {}} />);

    expect(await screen.findByText('金额大写')).toBeInTheDocument();
    expect(screen.getByText('RMBUPPER')).toBeInTheDocument();
    expect(screen.getByText('MONEYUPPER')).toBeInTheDocument();
    expect(screen.getByText('CNYUPPER')).toBeInTheDocument();
  });
});
