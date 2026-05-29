import { describe, expect, it } from 'vitest';
import { renderReport } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

describe('Phase 3 pagination', () => {
  it('repeats page headers and positions page footers at the bottom', () => {
    const template = makeTemplate([
      band('page-header', 'pageHeader', { height: 8 }),
      band('data', 'data', { height: 20, dataBand: { dataSourceId: 'employees' } }),
      band('page-footer', 'pageFooter', { height: 10 }),
    ]);
    template.pages[0].height = 70;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReport(template, {
      employees: Array.from({ length: 4 }, (_, index) => ({ Name: `N${index}` })),
    });

    expect(document.pages).toHaveLength(2);
    for (const page of document.pages) {
      expect(page.items.filter((item) => item.bandType === 'pageHeader')).toHaveLength(1);
      const footer = page.items.find((item) => item.bandType === 'pageFooter');
      expect(footer?.y).toBe(55);
    }
  });

  it('places report title once and report summary once at the end', () => {
    const template = makeTemplate([
      band('report-title', 'reportTitle', { height: 8 }),
      band('data', 'data', { height: 20, dataBand: { dataSourceId: 'employees' } }),
      band('report-summary', 'reportSummary', { height: 8 }),
    ]);
    template.pages[0].height = 70;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReport(template, {
      employees: Array.from({ length: 4 }, (_, index) => ({ Name: `N${index}` })),
    });

    expect(document.pages.flatMap((page) => page.items).filter((item) => item.bandType === 'reportTitle')).toHaveLength(1);
    expect(document.pages.flatMap((page) => page.items).filter((item) => item.bandType === 'reportSummary')).toHaveLength(1);
    expect(document.pages.at(-1)?.items.at(-1)?.bandType).toBe('reportSummary');
  });

  it('repeats group headers on a new page when printOnAllPages is enabled', () => {
    const template = makeTemplate([
      band('group-header', 'groupHeader', {
        height: 8,
        behavior: {
          enabled: true,
          printOn: 'allPages',
          printIfEmpty: true,
          printOnAllPages: true,
          keepTogether: false,
          canBreak: true,
          printAtBottom: false,
        },
        group: { conditionExpression: '{employees.Department}' },
      }),
      band('data', 'data', { height: 20, dataBand: { dataSourceId: 'employees' } }),
      band('group-footer', 'groupFooter', { height: 8 }),
    ]);
    template.pages[0].height = 70;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReport(template, {
      employees: [
        { Name: 'A', Department: 'Engineering' },
        { Name: 'B', Department: 'Engineering' },
        { Name: 'C', Department: 'Engineering' },
      ],
    });

    expect(document.pages).toHaveLength(2);
    expect(document.pages[1].items[0].bandType).toBe('groupHeader');
  });
});
