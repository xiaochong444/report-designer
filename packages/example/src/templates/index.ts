import employees from '../fixtures/json/employees.json';
import orders from '../fixtures/json/orders.json';
import { commonComponentsDetailTemplate, commonComponentsTemplate } from './common-components';
import { chartsTemplate } from './charts';
import { customChineseFontTemplate } from './custom-chinese-font';
import { eventLogicTemplate, eventOrdersData } from './event-logic';
import { groupedEmployeesTemplate } from './grouped-employees';
import { hierarchicalOrgData, hierarchicalOrgTemplate } from './hierarchical-organization';
import { invoiceTemplate } from './invoice';
import { longTextPaginationTemplate } from './long-text-pagination';
import { masterDetailOrdersTemplate } from './master-detail-orders';
import { productPriceLabelsData, productPriceLabelsTemplate } from './product-price-labels';
import { salesOrderPrintData, salesOrderPrintTemplate } from './sales-order-print';
import { tableDetailTemplate } from './table-detail';

export const employeesData = employees;
export const ordersData = orders;
export const tableOrdersData = orders.map(order => ({
  orderNo: order.orderNo,
  customer: order.customer,
  orderDate: order.orderDate,
  items: order.lines,
}));
export const invoiceLinesData = orders.find(order => order.orderNo === 'SO-1008')?.lines ?? [];
export const orderLinesData = orders.flatMap(order => order.lines.map(line => ({
  orderNo: order.orderNo,
  customer: order.customer,
  orderDate: order.orderDate,
  ...line,
})));
export const chartSalesData = [
  { month: '2026-01', customer: 'Apex Manufacturing', channel: 'Online', amount: 1280, qty: 12 },
  { month: '2026-01', customer: 'Blue Peak Ltd', channel: 'Retail', amount: 960, qty: 9 },
  { month: '2026-02', customer: 'Summit Education', channel: 'Online', amount: 1520, qty: 14 },
  { month: '2026-02', customer: 'Harbor Retail', channel: 'Retail', amount: 1180, qty: 11 },
  { month: '2026-03', customer: 'Apex Manufacturing', channel: 'Retail', amount: 1420, qty: 13 },
  { month: '2026-03', customer: 'Blue Peak Ltd', channel: 'Online', amount: 1740, qty: 16 },
  { month: '2026-04', customer: 'Summit Education', channel: 'Retail', amount: 1340, qty: 12 },
  { month: '2026-04', customer: 'Harbor Retail', channel: 'Online', amount: 1880, qty: 18 },
];

export const sampleReportData = {
  employees: employeesData,
  orders: tableOrdersData,
  invoiceLines: invoiceLinesData,
  orderLines: orderLinesData,
  chartSales: chartSalesData,
  eventOrders: eventOrdersData,
};

export const sampleReports = [
  { key: 'groupedEmployees', label: 'Grouped Employees', template: groupedEmployeesTemplate, data: sampleReportData },
  { key: 'charts', label: 'Charts', template: chartsTemplate, data: sampleReportData },
  { key: 'invoice', label: 'Invoice', template: invoiceTemplate, data: sampleReportData },
  { key: 'salesOrderPrint', label: 'Sales Order Print', template: salesOrderPrintTemplate, data: salesOrderPrintData },
  { key: 'tableDetail', label: 'Table Detail', template: tableDetailTemplate, data: sampleReportData },
  { key: 'masterDetailOrders', label: 'Master Detail Orders', template: masterDetailOrdersTemplate, data: sampleReportData },
  { key: 'productPriceLabels', label: 'Product Price Labels', template: productPriceLabelsTemplate, data: productPriceLabelsData },
  { key: 'hierarchicalOrg', label: 'Hierarchical Organization', template: hierarchicalOrgTemplate, data: hierarchicalOrgData },
  { key: 'customChineseFont', label: 'Custom Chinese Font', template: customChineseFontTemplate, data: sampleReportData },
  { key: 'longTextPagination', label: 'Long Text Pagination', template: longTextPaginationTemplate, data: sampleReportData },
  {
    key: 'commonComponents',
    label: 'Common Components',
    template: commonComponentsTemplate,
    data: sampleReportData,
    subreports: { 'common-components-detail': commonComponentsDetailTemplate },
  },
  { key: 'eventLogic', label: 'Event Logic', template: eventLogicTemplate, data: sampleReportData },
] as const;

export {
  commonComponentsDetailTemplate,
  commonComponentsTemplate,
  chartsTemplate,
  customChineseFontTemplate,
  eventLogicTemplate,
  groupedEmployeesTemplate,
  hierarchicalOrgData,
  hierarchicalOrgTemplate,
  invoiceTemplate,
  longTextPaginationTemplate,
  masterDetailOrdersTemplate,
  productPriceLabelsData,
  productPriceLabelsTemplate,
  salesOrderPrintData,
  salesOrderPrintTemplate,
  tableDetailTemplate,
};
