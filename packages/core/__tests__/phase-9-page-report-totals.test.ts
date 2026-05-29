import { describe, expect, it } from 'vitest';
import { AggregateRuntime, evalExpression, renderReport } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

const rows = [
  { Name: 'A', Salary: 100 },
  { Name: 'B', Salary: 200 },
  { Name: 'C', Salary: 150 },
];

const textBase = {
  font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
  textAlign: 'left' as const,
  verticalAlign: 'top' as const,
  border: { style: 'none' as const, width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
  canGrow: false,
  canShrink: false,
};

describe('Phase 9 page and report totals', () => {
  it('evaluates standard aggregate functions through the runtime', () => {
    const runtime = new AggregateRuntime({
      rowsByBand: { employees: rows },
      pageRowsByBand: { employees: rows.slice(0, 2) },
    });

    expect(evalExpression('SUM({employees.Salary})', () => null, 0, {}, runtime)).toBe(450);
    expect(evalExpression('COUNT({employees.Salary})', () => null, 0, {}, runtime)).toBe(3);
    expect(evalExpression('AVG({employees.Salary})', () => null, 0, {}, runtime)).toBe(150);
    expect(evalExpression('MIN({employees.Salary})', () => null, 0, {}, runtime)).toBe(100);
    expect(evalExpression('MAX({employees.Salary})', () => null, 0, {}, runtime)).toBe(200);
  });

  it('renders standard aggregate functions according to footer band scope', () => {
    const template = makeTemplate([
      band('group-header', 'groupHeader', {
        group: { conditionExpression: '{employees.Team}', sortDirection: 'asc' },
        height: 8,
        components: [],
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
      band('group-footer', 'groupFooter', {
        height: 8,
        components: [{
          id: 'group-total',
          type: 'text',
          x: 0,
          y: 0,
          width: 50,
          height: 8,
          text: 'SUM({employees.Salary})',
          ...textBase,
        }],
      }),
      band('data-footer', 'footer', {
        height: 8,
        components: [{
          id: 'data-total',
          type: 'text',
          x: 0,
          y: 0,
          width: 50,
          height: 8,
          text: 'SUM({employees.Salary})',
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
          text: 'SUM({employees.Salary})',
          ...textBase,
        }],
      }),
    ]);
    template.pages[0].height = 120;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReport(template, {
      employees: [
        { Name: 'A', Team: 'Engineering', Salary: 100 },
        { Name: 'B', Team: 'Engineering', Salary: 200 },
        { Name: 'C', Team: 'Sales', Salary: 150 },
      ],
    });
    const groupTotals = document.pages.flatMap(page => page.items)
      .filter(item => item.bandType === 'groupFooter')
      .map(item => item.components[0].content);
    const dataFooter = document.pages.flatMap(page => page.items).find(item => item.bandType === 'footer')!.components[0].content;
    const reportSummary = document.pages.flatMap(page => page.items).find(item => item.bandType === 'reportSummary')!.components[0].content;

    expect(groupTotals).toEqual(['300', '150']);
    expect(dataFooter).toBe('450');
    expect(reportSummary).toBe('450');
  });
});
