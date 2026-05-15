import employees from '../fixtures/json/employees.json';
import orders from '../fixtures/json/orders.json';
import { commonComponentsDetailTemplate, commonComponentsTemplate } from './common-components';
import { groupedEmployeesTemplate } from './grouped-employees';
import { invoiceTemplate } from './invoice';
import { longTextPaginationTemplate } from './long-text-pagination';
import { masterDetailOrdersTemplate } from './master-detail-orders';

export const employeesData = employees;
export const ordersData = orders;
export const invoiceLinesData = orders.find(order => order.orderNo === 'SO-1008')?.lines ?? [];
export const orderLinesData = orders.flatMap(order => order.lines.map(line => ({
  orderNo: order.orderNo,
  customer: order.customer,
  orderDate: order.orderDate,
  ...line,
})));

export const sampleReportData = {
  employees: employeesData,
  invoiceLines: invoiceLinesData,
  orderLines: orderLinesData,
};

export const sampleReports = [
  { key: 'groupedEmployees', label: 'Grouped Employees', template: groupedEmployeesTemplate, data: sampleReportData },
  { key: 'invoice', label: 'Invoice', template: invoiceTemplate, data: sampleReportData },
  { key: 'masterDetailOrders', label: 'Master Detail Orders', template: masterDetailOrdersTemplate, data: sampleReportData },
  { key: 'longTextPagination', label: 'Long Text Pagination', template: longTextPaginationTemplate, data: sampleReportData },
  {
    key: 'commonComponents',
    label: 'Common Components',
    template: commonComponentsTemplate,
    data: sampleReportData,
    subreports: { 'common-components-detail': commonComponentsDetailTemplate },
  },
] as const;

export {
  commonComponentsDetailTemplate,
  commonComponentsTemplate,
  groupedEmployeesTemplate,
  invoiceTemplate,
  longTextPaginationTemplate,
  masterDetailOrdersTemplate,
};
