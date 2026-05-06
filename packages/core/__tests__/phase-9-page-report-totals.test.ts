import { describe, expect, it } from 'vitest';
import { AggregateRuntime, evalExpression, renderReportV2 } from '../src';
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
  it('evaluates page and report aggregate aliases through the runtime', () => {
    const runtime = new AggregateRuntime({
      rowsByBand: { employees: rows },
      pageRowsByBand: { employees: rows.slice(0, 2) },
    });

    expect(evalExpression('PAGESUM("employees", "{employees.Salary}")', () => null, 0, {}, runtime)).toBe(300);
    expect(evalExpression('PAGECOUNT("employees")', () => null, 0, {}, runtime)).toBe(2);
    expect(evalExpression('REPORTSUM("employees", "{employees.Salary}")', () => null, 0, {}, runtime)).toBe(450);
    expect(evalExpression('TOTALS.PAGESUM("employees", "{employees.Salary}")', () => null, 0, {}, runtime)).toBe(300);
    expect(evalExpression('TOTALS.REPORTSUM("employees", "{employees.Salary}")', () => null, 0, {}, runtime)).toBe(450);
  });

  it('renders page totals in PageFooter per physical page and report totals in ReportSummary', () => {
    const template = makeTemplate([
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
    template.pages[0].height = 55;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReportV2(template, { employees: rows });
    const pageFooterTotals = document.pages.map(page => page.items.find(item => item.bandType === 'pageFooter')!.components[0].content);
    const reportSummary = document.pages.flatMap(page => page.items).find(item => item.bandType === 'reportSummary')!.components[0].content;

    expect(pageFooterTotals).toEqual(['300', '150']);
    expect(reportSummary).toBe('450');
  });
});
