import { describe, expect, it } from 'vitest';
import { renderReport } from '../src';
import { band, makeTemplate } from './phase-2-helpers';
import type { ReportComponent } from '../src';

describe('Phase 29 table render contract', () => {
  it('renders table headers and data band row values into the render document', () => {
    const headerTable: ReportComponent = {
      id: 'table-header',
      type: 'table',
      x: 0,
      y: 0,
      width: 80,
      height: 8,
      rowCount: 1,
      columnCount: 2,
      rows: [{
        id: 'header-row',
        height: 8,
        role: 'header',
        cells: [
          { id: 'h-name', text: 'Name', width: 50 },
          { id: 'h-salary', text: 'Salary', width: 30 },
        ],
      }],
      showBorder: true,
    } as ReportComponent;

    const detailTable: ReportComponent = {
      id: 'table-detail',
      type: 'table',
      x: 0,
      y: 0,
      width: 80,
      height: 8,
      rowCount: 1,
      columnCount: 2,
      rows: [{
        id: 'detail-row',
        height: 8,
        cells: [
          { id: 'd-name', text: '{employees.name}', width: 50 },
          { id: 'd-salary', text: '{employees.salary}', width: 30 },
        ],
      }],
      showBorder: true,
    } as ReportComponent;

    const template = makeTemplate([
      band('header', 'header', { height: 8, components: [headerTable] }),
      band('data', 'data', {
        height: 8,
        dataBand: { dataSourceId: 'employees' },
        components: [detailTable],
      }),
    ]);

    const document = renderReport(template, {
      employees: [
        { name: 'Alice', salary: 98000 },
        { name: 'Ben', salary: 91000 },
      ],
    });
    const tables = document.pages[0].items.flatMap(item => item.components).filter(component => component.type === 'table') as any[];

    expect(tables[0].columns.map((column: any) => column.width)).toEqual([50, 30]);
    expect(tables.map(table => table.rows.map((row: any[]) => row.map(cell => cell.content)))).toEqual([
      [['Name', 'Salary']],
      [['Alice', '98000']],
      [['Ben', '91000']],
    ]);
    expect(tables[0].rows[0][0]).toMatchObject({ isHeader: true, height: 8 });
    expect(tables[1].rows[0][0]).toMatchObject({ height: 8 });
  });
});
