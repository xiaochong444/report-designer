/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { Viewer } from '../components/Viewer';
import {
  groupedEmployeesTemplate,
  invoiceTemplate,
  longTextPaginationTemplate,
  masterDetailOrdersTemplate,
  sampleReportData,
} from '../../../example/src/templates';

describe('Phase 6 viewer regression suite', () => {
  it('renders grouped employees with multiple pages and page numbers', () => {
    render(<Viewer template={groupedEmployeesTemplate} data={sampleReportData} />);

    expect(screen.getAllByTestId('render-document-page').length).toBeGreaterThan(1);
    expect(screen.getByText('Grouped Employees')).toBeInTheDocument();
    expect(screen.getAllByText(/1\/\d+/)[0]).toBeInTheDocument();
  });

  it('renders invoice, master detail, and long text sample labels', () => {
    const { rerender } = render(<Viewer template={invoiceTemplate} data={sampleReportData} />);
    expect(screen.getByText('Invoice SO-1008')).toBeInTheDocument();

    rerender(<Viewer template={masterDetailOrdersTemplate} data={sampleReportData} />);
    expect(screen.getByText('Order Lines by Order')).toBeInTheDocument();

    rerender(<Viewer template={longTextPaginationTemplate} data={sampleReportData} />);
    expect(screen.getByText('Long Text Pagination')).toBeInTheDocument();
    expect(screen.getAllByTestId('render-document-page').length).toBeGreaterThan(1);
  });
});
