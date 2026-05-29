import { describe, expect, it } from 'vitest';
import { renderReport } from '../src';
import type { Band } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

function behavior(overrides: Partial<Band['behavior']>) {
  return {
    enabled: true,
    printOn: 'allPages' as const,
    printIfEmpty: true,
    printOnAllPages: false,
    keepTogether: false,
    canBreak: true,
    printAtBottom: false,
    ...overrides,
  };
}

describe('Phase 7 band break behavior contract', () => {
  it('moves a keepTogether group footer to the next page when it does not fit', () => {
    const template = makeTemplate([
      band('group-header', 'groupHeader', { height: 8, group: { conditionExpression: '{employees.Department}' } }),
      band('data', 'data', { height: 18, dataBand: { dataSourceId: 'employees' } }),
      band('group-footer', 'groupFooter', { height: 18, behavior: behavior({ keepTogether: true, canBreak: false }) }),
    ]);
    template.pages[0].height = 60;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReport(template, {
      employees: [
        { Name: 'A', Department: 'Engineering' },
        { Name: 'B', Department: 'Engineering' },
      ],
    });

    const footerPageIndex = document.pages.findIndex(page => page.items.some(item => item.bandId === 'group-footer'));
    expect(footerPageIndex).toBeGreaterThan(0);
  });

  it('honors breakIfLessThan by starting a data row on the next page', () => {
    const template = makeTemplate([
      band('data', 'data', { height: 18, behavior: behavior({ breakIfLessThan: 20 }), dataBand: { dataSourceId: 'employees' } }),
    ]);
    template.pages[0].height = 65;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReport(template, {
      employees: Array.from({ length: 3 }, (_, index) => ({ Name: `N${index}` })),
    });

    expect(document.pages).toHaveLength(2);
    expect(document.pages[1].items[0].bandType).toBe('data');
  });

  it('prints a printAtBottom footer at the bottom printable edge', () => {
    const template = makeTemplate([
      band('data', 'data', { height: 10, dataBand: { dataSourceId: 'employees' } }),
      band('footer', 'footer', { height: 10, behavior: behavior({ printAtBottom: true }) }),
    ]);
    template.pages[0].height = 80;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReport(template, { employees: [{ Name: 'A' }] });
    const footer = document.pages[0].items.find(item => item.bandId === 'footer');

    expect(footer?.y).toBe(65);
  });
});
