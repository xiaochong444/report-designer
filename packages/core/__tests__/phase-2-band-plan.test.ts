import { describe, expect, it } from 'vitest';
import { buildBandPlan } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

describe('Phase 2 band plan', () => {
  it('associates bands with page, report, and nearest data sections', () => {
    const template = makeTemplate([
      band('page-header', 'pageHeader'),
      band('report-title', 'reportTitle'),
      band('header', 'header'),
      band('group-header', 'groupHeader', { group: { name: 'Department', conditionExpression: '{employees.Department}' } }),
      band('data', 'data', { dataBand: { dataSourceId: 'employees' } }),
      band('group-footer', 'groupFooter', { group: { name: 'Department' } }),
      band('footer', 'footer'),
      band('report-summary', 'reportSummary'),
      band('page-footer', 'pageFooter'),
    ]);

    const plan = buildBandPlan(template);

    expect(plan.pageBands.pageHeader.map((item) => item.id)).toEqual(['page-header']);
    expect(plan.pageBands.pageFooter.map((item) => item.id)).toEqual(['page-footer']);
    expect(plan.reportBands.reportTitle.map((item) => item.id)).toEqual(['report-title']);
    expect(plan.reportBands.reportSummary.map((item) => item.id)).toEqual(['report-summary']);
    expect(plan.dataSections).toHaveLength(1);
    expect(plan.dataSections[0].dataBand.id).toBe('data');
    expect(plan.dataSections[0].headers.map((item) => item.id)).toEqual(['header']);
    expect(plan.dataSections[0].groupPairs.map((pair) => [pair.header.id, pair.footer?.id])).toEqual([
      ['group-header', 'group-footer'],
    ]);
    expect(plan.dataSections[0].footers.map((item) => item.id)).toEqual(['footer']);
  });
});
