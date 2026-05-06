/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { ExpressionEditor } from '../components/ExpressionEditor';
import { useDesignerStore } from '../store/designer-store';

describe('Phase 9 expression editor total shortcuts', () => {
  it('lists page and report total functions in the functions tab', async () => {
    useDesignerStore.getState().loadTemplate(createDefaultTemplate('Expression Totals'));

    render(<ExpressionEditor open value="" onChange={() => {}} onClose={() => {}} />);
    fireEvent.click(screen.getByText('函数'));

    expect(await screen.findByText('页/报表合计')).toBeInTheDocument();

    const functionLabels = screen.getAllByText(/SUM/).map(node => node.textContent ?? '');
    expect(functionLabels.some(text => text.startsWith('PAGESUM'))).toBe(true);
    expect(functionLabels.some(text => text.startsWith('REPORTSUM'))).toBe(true);
    expect(functionLabels.some(text => text.startsWith('TOTALS.PAGESUM'))).toBe(true);
    expect(functionLabels.some(text => text.startsWith('TOTALS.REPORTSUM'))).toBe(true);
  });
});
