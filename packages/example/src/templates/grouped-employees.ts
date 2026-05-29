import { band, commonTextStyleIds, moneyExpression, template, text } from './common';

export const groupedEmployeesTemplate = template('grouped-employees', 'Grouped Employees', [
  band('ge-title', 'reportTitle', 12, [
    text('ge-title-text', 'Grouped Employees', 0, 1, 190, 8, { style: commonTextStyleIds.title, textAlign: 'center' }),
  ]),
  band('ge-page-header', 'pageHeader', 8, [
    text('ge-page-header-text', 'Employees by department', 0, 0, 120, 6, { style: commonTextStyleIds.pageHeader }),
  ]),
  band('ge-header', 'header', 9, [
    text('ge-h-name', 'Name', 0, 1, 70, 6, { style: commonTextStyleIds.header }),
    text('ge-h-hire', 'Hire Date', 74, 1, 36, 6, { style: commonTextStyleIds.header }),
    text('ge-h-salary', 'Salary', 130, 1, 40, 6, { style: commonTextStyleIds.header, textAlign: 'right' }),
  ]),
  band('ge-group-header', 'groupHeader', 10, [
    text('ge-group-name', '{Group.department}', 0, 2, 120, 6, { style: commonTextStyleIds.group }),
  ], { group: { conditionExpression: '{employees.department}', sortDirection: 'asc' } }),
  band('ge-data', 'data', 8, [
    text('ge-name', '{employees.name}', 0, 1, 70, 5, { style: commonTextStyleIds.data }),
    text('ge-hire', '{employees.hireDate}', 74, 1, 36, 5, { style: commonTextStyleIds.data }),
    text('ge-salary', moneyExpression('employees', 'salary'), 130, 1, 40, 5, { style: commonTextStyleIds.data, textAlign: 'right' }),
  ], { dataBand: { dataSourceId: 'employees', sort: [{ field: 'department', direction: 'asc' }, { field: 'name', direction: 'asc' }] } }),
  band('ge-group-footer', 'groupFooter', 10, [
    text('ge-group-count', 'COUNT("employees")', 0, 2, 50, 5, { style: commonTextStyleIds.footer }),
    text('ge-group-sum', 'SUM("employees", "{employees.salary}")', 90, 2, 80, 5, { style: commonTextStyleIds.footer, textAlign: 'right' }),
  ]),
  band('ge-footer', 'footer', 10, [
    text('ge-total-count', 'COUNT("employees")', 0, 2, 70, 5, { style: commonTextStyleIds.footer }),
    text('ge-total-salary', 'SUM("employees", "{employees.salary}")', 90, 2, 80, 5, { style: commonTextStyleIds.footer, textAlign: 'right' }),
  ]),
  band('ge-page-footer', 'pageFooter', 8, [
    text('ge-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footer, textAlign: 'center' }),
  ]),
]);
