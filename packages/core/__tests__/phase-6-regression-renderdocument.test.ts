import { describe, expect, it } from 'vitest';
import { renderReport } from '../src';
import {
  employeesData,
  groupedEmployeesTemplate,
  invoiceLinesData,
  invoiceTemplate,
  longTextPaginationTemplate,
  sampleReportData,
} from './fixtures/templates';

describe('Phase 6 RenderDocument regression suite', () => {
  it('renders grouped employees across pages with repeated page chrome and group totals', () => {
    const document = renderReport(groupedEmployeesTemplate, sampleReportData);
    const engineeringTotal = employeesData
      .filter(row => row.department === 'Engineering')
      .reduce((sum, row) => sum + row.salary, 0);

    expect(document.pages.length).toBeGreaterThan(1);
    for (const page of document.pages) {
      expect(page.items.some(item => item.bandType === 'pageHeader')).toBe(true);
      expect(page.items.some(item => item.bandType === 'pageFooter')).toBe(true);
    }

    const groupFooters = document.pages.flatMap(page => page.items).filter(item => item.bandType === 'groupFooter');
    expect(groupFooters[0].components.find(component => component.id === 'ge-group-sum')?.content).toBe(String(engineeringTotal));
  });

  it('renders invoice totals from JSON line data', () => {
    const document = renderReport(invoiceTemplate, sampleReportData);
    const subtotal = invoiceLinesData.reduce((sum, row) => sum + row.lineTotal, 0);
    const footer = document.pages.flatMap(page => page.items).find(item => item.bandType === 'footer');

    expect(footer?.components.find(component => component.id === 'inv-subtotal')?.content).toBe(String(subtotal));
    expect(footer?.components.find(component => component.id === 'inv-grand')?.content).toBe(String(subtotal * 1.1));
  });

  it('keeps long growing text inside the printable page area', () => {
    const document = renderReport(longTextPaginationTemplate, sampleReportData);
    const page = longTextPaginationTemplate.pages[0];
    const bottom = page.height - page.margins.bottom;

    expect(document.pages.length).toBeGreaterThan(1);
    for (const renderPage of document.pages) {
      for (const item of renderPage.items) {
        expect(item.y + item.height).toBeLessThanOrEqual(bottom);
        expect(item.overflow).not.toBe(true);
      }
    }
  });
});
