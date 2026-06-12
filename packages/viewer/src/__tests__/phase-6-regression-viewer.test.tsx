/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { Viewer } from '../components/Viewer';
import {
  contractTermsData,
  contractTermsTemplate,
  salesOrderPrintData,
  salesOrderPrintTemplate,
  storeDailySalesData,
  storeDailySalesTemplate,
} from '../../../example/src/templates';

describe('Phase 6 viewer regression suite', () => {
  it('renders grouped store sales with multiple pages and page numbers', () => {
    render(<Viewer template={storeDailySalesTemplate} data={storeDailySalesData} />);

    expect(screen.getAllByTestId('render-document-page').length).toBeGreaterThan(1);
    expect(screen.getByText('门店销售日报')).toBeInTheDocument();
    expect(screen.getAllByText(/1\/\d+/)[0]).toBeInTheDocument();
  });

  it('renders sales order and long text sample labels', () => {
    const { rerender } = render(<Viewer template={salesOrderPrintTemplate} data={salesOrderPrintData} />);
    expect(screen.getByText('销售订单')).toBeInTheDocument();

    rerender(<Viewer template={contractTermsTemplate} data={contractTermsData} />);
    expect(screen.getByText('加盟合同附页')).toBeInTheDocument();
    expect(screen.getAllByTestId('render-document-page').length).toBeGreaterThan(0);
  });
});
