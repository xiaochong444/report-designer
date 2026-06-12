import { describe, expect, it } from 'vitest';
import { renderReport } from '../src';
import {
  contractTermsData,
  contractTermsTemplate,
  salesOrderPrintData,
  salesOrderPrintTemplate,
  storeDailySalesData,
  storeDailySalesTemplate,
} from './fixtures/templates';

describe('Phase 6 RenderDocument regression suite', () => {
  it('renders grouped store sales across pages with repeated page chrome and group totals', () => {
    const document = renderReport(storeDailySalesTemplate, storeDailySalesData);

    expect(document.pages.length).toBeGreaterThan(1);
    for (const page of document.pages) {
      expect(page.items.some(item => item.bandType === 'pageFooter')).toBe(true);
    }

    const groupFooters = document.pages.flatMap(page => page.items).filter(item => item.bandType === 'groupFooter');
    expect(groupFooters.length).toBeGreaterThan(0);
    expect(JSON.stringify(groupFooters[0].components)).toContain('门店小计');
  });

  it('renders sales order totals from JSON line data', () => {
    const document = renderReport(salesOrderPrintTemplate, salesOrderPrintData);
    const subtotal = salesOrderPrintData.items.reduce((sum, row) => sum + row.salesAmount, 0);
    const footer = document.pages.flatMap(page => page.items).find(item => item.bandType === 'footer');

    expect(JSON.stringify(footer?.components)).toContain(subtotal.toFixed(2));
  });

  it('keeps long growing text inside the printable page area', () => {
    const document = renderReport(contractTermsTemplate, contractTermsData);
    const page = contractTermsTemplate.pages[0];
    const bottom = page.height - page.margins.bottom;

    for (const renderPage of document.pages) {
      for (const item of renderPage.items) {
        expect(item.y + item.height).toBeLessThanOrEqual(bottom);
        expect(item.overflow).not.toBe(true);
      }
    }
  });
});
