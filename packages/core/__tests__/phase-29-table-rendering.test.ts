import { describe, expect, it } from 'vitest';
import { renderReport } from '../src';
import { band, makeTemplate } from './phase-2-helpers';
import type { ReportComponent } from '../src';

describe('Phase 29 table render contract', () => {
  it('renders table headers and detail values into the render document', () => {
    const template = makeTemplate([
      band('title', 'reportTitle', {
        height: 40,
        components: [{
          id: 'table-1',
          type: 'table',
          x: 0,
          y: 0,
          width: 80,
          height: 24,
          dataSource: 'employees',
          columns: [
            { id: 'name', header: 'Name', field: 'name', width: 50, cellType: 'text' },
            { id: 'salary', header: 'Salary', field: 'salary', width: 30, cellType: 'text' },
          ],
          rowCount: 3,
          columnCount: 2,
          headerRowsCount: 1,
          footerRowsCount: 0,
          canBreak: true,
          headerHeight: 8,
          rowHeight: 8,
          showBorder: true,
        } as ReportComponent],
      }),
    ]);

    const table = renderReport(template, {
      employees: [
        { name: 'Alice', salary: 98000 },
        { name: 'Ben', salary: 91000 },
      ],
    }).pages[0].items[0].components[0] as any;

    expect(table.type).toBe('table');
    expect(table.columns.map((column: any) => column.width)).toEqual([50, 30]);
    expect(table.rows.map((row: any[]) => row.map(cell => cell.content))).toEqual([
      ['Name', 'Salary'],
      ['Alice', '98000'],
      ['Ben', '91000'],
    ]);
    expect(table.rows[0][0]).toMatchObject({ isHeader: true, height: 8 });
    expect(table.rows[1][0]).toMatchObject({ field: 'name', height: 8 });
  });
});
