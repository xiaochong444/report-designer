import { describe, expect, it } from 'vitest';
import { buildBandPlan, executeBandPlan, renderReport } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

const textBase = {
  font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
  textAlign: 'left' as const,
  verticalAlign: 'top' as const,
  border: { style: 'none' as const, width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
  canGrow: false,
  canShrink: false,
};

describe('phase 35 band contracts', () => {
  it('keeps nested group ownership and EmptyData branch deterministic', () => {
    const groupedTemplate = makeTemplate([
      band('department-header', 'groupHeader', { group: { name: 'Department', conditionExpression: '{employees.Department}' } }),
      band('team-header', 'groupHeader', { group: { name: 'Team', conditionExpression: '{employees.Team}' } }),
      band('data', 'data', { dataBand: { dataSourceId: 'employees', sort: [{ field: 'Team', direction: 'asc' }] } }),
      band('team-footer', 'groupFooter', { group: { name: 'Team' } }),
      band('department-footer', 'groupFooter', { group: { name: 'Department' } }),
    ]);

    const sequence = executeBandPlan(buildBandPlan(groupedTemplate), {
      employees: [
        { Name: 'A', Department: 'Engineering', Team: 'Platform' },
        { Name: 'B', Department: 'Engineering', Team: 'UI' },
      ],
    }).filter(item => item.kind === 'band').map(item => item.band.id);

    expect(sequence).toEqual([
      'department-header',
      'team-header',
      'data',
      'team-footer',
      'team-header',
      'data',
      'team-footer',
      'department-footer',
    ]);

    const emptyTemplate = makeTemplate([
      band('header', 'header'),
      band('data', 'data', { dataBand: { dataSourceId: 'employees' } }),
      band('empty', 'emptyData'),
      band('footer', 'footer'),
    ]);
    const emptySequence = executeBandPlan(buildBandPlan(emptyTemplate), { employees: [] })
      .filter(item => item.kind === 'band')
      .map(item => item.band.type);

    expect(emptySequence).toEqual(['emptyData']);
  });

  it('repeats section headers on page breaks and computes page/report totals after pagination', () => {
    const template = makeTemplate([
      band('section-header', 'header', {
        height: 8,
        behavior: { enabled: true, printOn: 'allPages', printIfEmpty: true, printOnAllPages: true, keepTogether: false, canBreak: true, printAtBottom: false },
      }),
      band('column-header', 'columnHeader', {
        height: 8,
        behavior: { enabled: true, printOn: 'allPages', printIfEmpty: true, printOnAllPages: true, keepTogether: false, canBreak: true, printAtBottom: false },
      }),
      band('data', 'data', {
        height: 15,
        dataBand: { dataSourceId: 'employees' },
        components: [{
          id: 'detail',
          type: 'text',
          x: 0,
          y: 0,
          width: 50,
          height: 8,
          text: '{employees.Salary}',
          ...textBase,
        }],
      }),
      band('report-summary', 'reportSummary', {
        height: 8,
        components: [{
          id: 'report-total',
          type: 'text',
          x: 0,
          y: 0,
          width: 50,
          height: 8,
          text: 'REPORTSUM("employees", "{employees.Salary}")',
          ...textBase,
        }],
      }),
      band('page-footer', 'pageFooter', {
        height: 8,
        behavior: { enabled: true, printOn: 'allPages', printIfEmpty: true, printOnAllPages: true, keepTogether: false, canBreak: false, printAtBottom: true },
        components: [{
          id: 'page-total',
          type: 'text',
          x: 0,
          y: 0,
          width: 50,
          height: 8,
          text: 'PAGESUM("employees", "{employees.Salary}")',
          ...textBase,
        }],
      }),
    ]);
    template.pages[0].height = 72;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReport(template, {
      employees: [
        { Name: 'A', Salary: 100 },
        { Name: 'B', Salary: 200 },
        { Name: 'C', Salary: 150 },
        { Name: 'D', Salary: 50 },
      ],
    });

    expect(document.pages.length).toBeGreaterThan(1);
    expect(document.pages[1].items.map(item => item.bandId).slice(0, 2)).toEqual(['section-header', 'column-header']);
    expect(document.pages.map(page => page.items.find(item => item.bandType === 'pageFooter')?.components[0].content)).toEqual(['300', '200']);
    expect(document.pages.flatMap(page => page.items).find(item => item.bandType === 'reportSummary')?.components[0].content).toBe('500');
  });

  it('keeps header and footer ownership scoped to their following data band', () => {
    const template = makeTemplate([
      band('orders-header', 'header'),
      band('orders-data', 'data', { dataBand: { dataSourceId: 'orders' } }),
      band('orders-footer', 'footer'),
      band('employees-header', 'header'),
      band('employees-data', 'data', { dataBand: { dataSourceId: 'employees' } }),
      band('employees-footer', 'footer'),
    ]);
    template.dataSources.push({ id: 'orders', name: 'Orders', type: 'json', fields: [] });

    const sequence = executeBandPlan(buildBandPlan(template), {
      orders: [{ id: 1 }, { id: 2 }],
      employees: [{ Name: 'A' }],
    }).filter(item => item.kind === 'band').map(item => item.band.id);

    expect(sequence).toEqual([
      'orders-header',
      'orders-data',
      'orders-data',
      'orders-footer',
      'employees-header',
      'employees-data',
      'employees-footer',
    ]);
  });

  it('does not print section header or footer when the data section uses EmptyData', () => {
    const template = makeTemplate([
      band('section-header', 'header'),
      band('data', 'data', { dataBand: { dataSourceId: 'employees' } }),
      band('empty', 'emptyData'),
      band('section-footer', 'footer'),
    ]);

    const sequence = executeBandPlan(buildBandPlan(template), { employees: [] })
      .filter(item => item.kind === 'band')
      .map(item => item.band.id);

    expect(sequence).toEqual(['empty']);
  });

  it('honors band print-on rules during pagination', () => {
    const template = makeTemplate([
      band('page-header', 'pageHeader', {
        height: 8,
        behavior: { enabled: true, printOn: 'exceptFirstPage', printIfEmpty: true, printOnAllPages: true, keepTogether: false, canBreak: false, printAtBottom: false },
        components: [{
          id: 'header-text',
          type: 'text',
          x: 0,
          y: 0,
          width: 50,
          height: 8,
          text: 'Page Header',
          ...textBase,
        }],
      }),
      band('data', 'data', {
        height: 20,
        dataBand: { dataSourceId: 'employees' },
        components: [{
          id: 'detail',
          type: 'text',
          x: 0,
          y: 0,
          width: 50,
          height: 8,
          text: '{employees.Name}',
          ...textBase,
        }],
      }),
    ]);
    template.pages[0].height = 70;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReport(template, {
      employees: [
        { Name: 'A' },
        { Name: 'B' },
        { Name: 'C' },
        { Name: 'D' },
      ],
    });

    expect(document.pages.length).toBeGreaterThan(1);
    expect(document.pages[0].items.map(item => item.bandId)).not.toContain('page-header');
    expect(document.pages[1].items.map(item => item.bandId)[0]).toBe('page-header');
  });

  it('skips disabled bands and bands with a false visible expression', () => {
    const template = makeTemplate([
      band('disabled-header', 'header', {
        height: 8,
        behavior: { enabled: false, printOn: 'allPages', printIfEmpty: true, printOnAllPages: false, keepTogether: false, canBreak: false, printAtBottom: false },
      }),
      band('hidden-header', 'header', {
        height: 8,
        behavior: { enabled: true, visibleExpression: '{Parameters.ShowHeader}', printOn: 'allPages', printIfEmpty: true, printOnAllPages: false, keepTogether: false, canBreak: false, printAtBottom: false },
      }),
      band('data', 'data', {
        height: 10,
        dataBand: { dataSourceId: 'employees' },
        components: [{
          id: 'detail',
          type: 'text',
          x: 0,
          y: 0,
          width: 50,
          height: 8,
          text: '{employees.Name}',
          ...textBase,
        }],
      }),
    ]);

    const document = renderReport(template, { employees: [{ Name: 'A' }] }, { parameters: { ShowHeader: false } });

    expect(document.pages[0].items.map(item => item.bandId)).toEqual(['data']);
  });

  it('prints last-page fixed bands only on the final page', () => {
    const template = makeTemplate([
      band('data', 'data', {
        height: 20,
        dataBand: { dataSourceId: 'employees' },
        components: [{
          id: 'detail',
          type: 'text',
          x: 0,
          y: 0,
          width: 50,
          height: 8,
          text: '{employees.Name}',
          ...textBase,
        }],
      }),
      band('last-page-footer', 'pageFooter', {
        height: 8,
        behavior: { enabled: true, printOn: 'lastPage', printIfEmpty: true, printOnAllPages: true, keepTogether: false, canBreak: false, printAtBottom: true },
        components: [{
          id: 'last-page-text',
          type: 'text',
          x: 0,
          y: 0,
          width: 50,
          height: 8,
          text: 'Last page only',
          ...textBase,
        }],
      }),
    ]);
    template.pages[0].height = 65;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReport(template, {
      employees: [
        { Name: 'A' },
        { Name: 'B' },
        { Name: 'C' },
        { Name: 'D' },
      ],
    });

    expect(document.pages.length).toBeGreaterThan(1);
    expect(document.pages[0].items.map(item => item.bandId)).not.toContain('last-page-footer');
    expect(document.pages.at(-1)?.items.map(item => item.bandId)).toContain('last-page-footer');
  });

  it('honors first odd even and last page rules for non-footer bands', () => {
    const template = makeTemplate([
      band('first-page-header', 'header', {
        height: 6,
        behavior: { enabled: true, printOn: 'firstPage', printIfEmpty: true, printOnAllPages: false, keepTogether: false, canBreak: false, printAtBottom: false },
        components: [{ id: 'first', type: 'text', x: 0, y: 0, width: 30, height: 6, text: 'First', ...textBase }],
      }),
      band('odd-page-header', 'header', {
        height: 6,
        behavior: { enabled: true, printOn: 'oddPages', printIfEmpty: true, printOnAllPages: true, keepTogether: false, canBreak: false, printAtBottom: false },
        components: [{ id: 'odd', type: 'text', x: 0, y: 0, width: 30, height: 6, text: 'Odd', ...textBase }],
      }),
      band('even-page-header', 'header', {
        height: 6,
        behavior: { enabled: true, printOn: 'evenPages', printIfEmpty: true, printOnAllPages: true, keepTogether: false, canBreak: false, printAtBottom: false },
        components: [{ id: 'even', type: 'text', x: 0, y: 0, width: 30, height: 6, text: 'Even', ...textBase }],
      }),
      band('last-page-header', 'header', {
        height: 6,
        behavior: { enabled: true, printOn: 'lastPage', printIfEmpty: true, printOnAllPages: true, keepTogether: false, canBreak: false, printAtBottom: false },
        components: [{ id: 'last', type: 'text', x: 0, y: 0, width: 30, height: 6, text: 'Last', ...textBase }],
      }),
      band('data', 'data', {
        height: 18,
        dataBand: { dataSourceId: 'employees' },
        components: [{ id: 'detail', type: 'text', x: 0, y: 0, width: 30, height: 6, text: '{employees.Name}', ...textBase }],
      }),
    ]);
    template.pages[0].height = 60;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReport(template, {
      employees: [
        { Name: 'A' },
        { Name: 'B' },
        { Name: 'C' },
        { Name: 'D' },
        { Name: 'E' },
      ],
    });

    expect(document.pages.length).toBeGreaterThan(1);
    expect(document.pages[0].items.map(item => item.bandId)).toContain('first-page-header');
    expect(document.pages[0].items.map(item => item.bandId)).toContain('odd-page-header');
    expect(document.pages[0].items.map(item => item.bandId)).not.toContain('even-page-header');
    expect(document.pages.at(1)?.items.map(item => item.bandId)).toContain('even-page-header');
    expect(document.pages.at(-1)?.items.map(item => item.bandId)).toContain('last-page-header');
  });

  it('skips bands with no rendered components when printIfEmpty is false', () => {
    const template = makeTemplate([
      band('empty-header', 'header', {
        height: 8,
        behavior: { enabled: true, printOn: 'allPages', printIfEmpty: false, printOnAllPages: false, keepTogether: false, canBreak: false, printAtBottom: false },
        components: [{
          id: 'hidden-header-text',
          type: 'text',
          x: 0,
          y: 0,
          width: 50,
          height: 8,
          text: 'Hidden',
          visible: '{Parameters.ShowHeader}',
          ...textBase,
        }],
      }),
      band('data', 'data', {
        height: 10,
        dataBand: { dataSourceId: 'employees' },
        components: [{
          id: 'detail',
          type: 'text',
          x: 0,
          y: 0,
          width: 50,
          height: 8,
          text: '{employees.Name}',
          ...textBase,
        }],
      }),
    ]);

    const document = renderReport(template, { employees: [{ Name: 'A' }] }, { parameters: { ShowHeader: false } });

    expect(document.pages[0].items.map(item => item.bandId)).toEqual(['data']);
  });

  it('keeps band height fixed and clips overflow when autoGrow is false', () => {
    const template = makeTemplate([
      band('fixed-header', 'pageHeader', {
        height: 10,
        behavior: { enabled: true, printOn: 'allPages', printIfEmpty: true, printOnAllPages: false, keepTogether: false, canBreak: false, printAtBottom: false, autoGrow: false, autoShrink: false } as any,
        components: [{
          id: 'fixed-text',
          type: 'text',
          x: 0,
          y: 0,
          width: 50,
          height: 24,
          text: 'Tall content',
          ...textBase,
        }],
      }),
    ]);

    const document = renderReport(template, {});
    const bandBox = document.pages[0].items.find(item => item.bandId === 'fixed-header');

    expect(bandBox?.height).toBe(10);
    expect(bandBox?.overflow).toBe(true);
  });

  it('shrinks band height to rendered content when autoShrink is true', () => {
    const template = makeTemplate([
      band('shrunk-header', 'pageHeader', {
        height: 24,
        behavior: { enabled: true, printOn: 'allPages', printIfEmpty: true, printOnAllPages: false, keepTogether: false, canBreak: false, printAtBottom: false, autoGrow: true, autoShrink: true } as any,
        components: [{
          id: 'shrunk-text',
          type: 'text',
          x: 0,
          y: 0,
          width: 50,
          height: 8,
          text: 'Short content',
          ...textBase,
        }],
      }),
    ]);

    const document = renderReport(template, {});
    const bandBox = document.pages[0].items.find(item => item.bandId === 'shrunk-header');

    expect(bandBox?.height).toBe(8);
    expect(bandBox?.overflow).toBeFalsy();
  });
});
