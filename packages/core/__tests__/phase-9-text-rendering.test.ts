import { describe, expect, it } from 'vitest';
import { renderReportV2 } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

const textBase = {
  font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
  textAlign: 'left' as const,
  verticalAlign: 'top' as const,
  border: { style: 'none' as const, width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
  canGrow: false,
  canShrink: false,
};

describe('Phase 9 text rendering', () => {
  it('applies text format metadata after expression evaluation', () => {
    const template = makeTemplate([
      band('data', 'data', {
        dataBand: { dataSourceId: 'employees' },
        components: [{
          id: 'salary',
          type: 'text',
          x: 0,
          y: 0,
          width: 50,
          height: 8,
          text: '{employees.Salary}',
          format: { type: 'number', pattern: '#,##0.00' },
          ...textBase,
          textAlign: 'right',
        }],
      }),
    ]);

    const document = renderReportV2(template, { employees: [{ Salary: 1234.5 }] });

    expect(document.pages[0].items[0].components[0].content).toBe('1,234.50');
  });

  it('resolves named report style sets into render styles', () => {
    const template = makeTemplate([
      band('data', 'data', {
        dataBand: { dataSourceId: 'employees' },
        components: [{
          id: 'label',
          type: 'text',
          style: 'total-style',
          x: 0,
          y: 0,
          width: 50,
          height: 8,
          text: '{employees.Name}',
          ...textBase,
        }],
      }),
    ]);
    template.styles = [{
      id: 'total-style',
      name: 'Total',
      font: { bold: true, color: '#ff0000' },
      border: { style: 'solid', width: 0.2, color: '#ff0000', sides: { top: true, right: false, bottom: true, left: false } },
      backgroundColor: '#fff7e6',
    }];

    const box = renderReportV2(template, { employees: [{ Name: 'Alice' }] }).pages[0].items[0].components[0];

    expect(box.style?.font?.bold).toBe(true);
    expect(box.style?.font?.color).toBe('#ff0000');
    expect(box.style?.backgroundColor).toBe('#fff7e6');
  });
});
