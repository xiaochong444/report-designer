import { describe, expect, it } from 'vitest';
import { renderReport } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

const repeatBehavior = {
  enabled: true,
  printOn: 'allPages' as const,
  printIfEmpty: true,
  printOnAllPages: true,
  keepTogether: false,
  canBreak: true,
  printAtBottom: false,
};

describe('Phase 7 band pagination contract', () => {
  it('repeats PageHeader and PageFooter on every page without duplicating ReportTitle or ReportSummary', () => {
    const template = makeTemplate([
      band('page-header', 'pageHeader', { height: 8 }),
      band('report-title', 'reportTitle', { height: 8 }),
      band('data', 'data', { height: 20, dataBand: { dataSourceId: 'employees' } }),
      band('report-summary', 'reportSummary', { height: 8 }),
      band('page-footer', 'pageFooter', { height: 8 }),
    ]);
    template.pages[0].height = 70;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReport(template, {
      employees: Array.from({ length: 5 }, (_, index) => ({ Name: `N${index}` })),
    });

    expect(document.pages.length).toBeGreaterThan(1);
    for (const page of document.pages) {
      expect(page.items.filter(item => item.bandType === 'pageHeader')).toHaveLength(1);
      expect(page.items.filter(item => item.bandType === 'pageFooter')).toHaveLength(1);
    }
    expect(document.pages.flatMap(page => page.items).filter(item => item.bandType === 'reportTitle')).toHaveLength(1);
    expect(document.pages.flatMap(page => page.items).filter(item => item.bandType === 'reportSummary')).toHaveLength(1);
  });

  it('repeats HeaderBand and ColumnHeader on a new page when printOnAllPages is enabled', () => {
    const template = makeTemplate([
      band('section-header', 'header', { height: 8, behavior: repeatBehavior }),
      band('column-header', 'columnHeader', { height: 8, behavior: repeatBehavior }),
      band('data', 'data', { height: 18, dataBand: { dataSourceId: 'employees' } }),
    ]);
    template.pages[0].height = 64;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReport(template, {
      employees: Array.from({ length: 5 }, (_, index) => ({ Name: `N${index}` })),
    });

    expect(document.pages.length).toBeGreaterThan(1);
    expect(document.pages[0].items.map(item => item.bandId)).toContain('section-header');
    expect(document.pages[0].items.map(item => item.bandId)).toContain('column-header');
    expect(document.pages[1].items.map(item => item.bandId).slice(0, 2)).toEqual(['section-header', 'column-header']);
  });

  it('repeats HeaderBand and ColumnHeader on a new page with default behavior', () => {
    const template = makeTemplate([
      { id: 'section-header', type: 'header', height: 8, components: [] },
      { id: 'column-header', type: 'columnHeader', height: 8, components: [] },
      band('data', 'data', { height: 18, dataBand: { dataSourceId: 'employees' } }),
    ]);
    template.pages[0].height = 64;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReport(template, {
      employees: Array.from({ length: 5 }, (_, index) => ({ Name: `N${index}` })),
    });

    expect(document.pages.length).toBeGreaterThan(1);
    expect(document.pages[1].items.map(item => item.bandId).slice(0, 2)).toEqual(['section-header', 'column-header']);
  });
});
