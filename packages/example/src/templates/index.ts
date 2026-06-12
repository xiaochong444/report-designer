import type { ReportTemplate } from '@report-designer/core';
import employees from '../fixtures/json/employees.json';
import orders from '../fixtures/json/orders.json';
import { commonComponentsDetailTemplate, commonComponentsTemplate } from './common-components';
import { chartsTemplate } from './charts';
import { clothingOrderDynamicSizeData, clothingOrderDynamicSizeTemplate } from './clothing-order-dynamic-size';
import { clothingOrderGroupedSizeData, clothingOrderGroupedSizeTemplate } from './clothing-order-grouped-size';
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
  { date: '2026-01-05', productType: '电子产品', yearMonth: '2026-01', amount: 3200, quantity: 16 },
  { date: '2026-01-12', productType: '服装', yearMonth: '2026-01', amount: 1800, quantity: 24 },
  { date: '2026-01-20', productType: '食品', yearMonth: '2026-01', amount: 950, quantity: 38 },
  { date: '2026-01-28', productType: '办公用品', yearMonth: '2026-01', amount: 1450, quantity: 20 },
  { date: '2026-02-03', productType: '电子产品', yearMonth: '2026-02', amount: 4100, quantity: 20 },
  { date: '2026-02-15', productType: '服装', yearMonth: '2026-02', amount: 2200, quantity: 30 },
  { date: '2026-02-22', productType: '食品', yearMonth: '2026-02', amount: 1100, quantity: 44 },
  { date: '2026-02-27', productType: '办公用品', yearMonth: '2026-02', amount: 1650, quantity: 22 },
  { date: '2026-03-08', productType: '电子产品', yearMonth: '2026-03', amount: 3800, quantity: 19 },
  { date: '2026-03-14', productType: '服装', yearMonth: '2026-03', amount: 2600, quantity: 35 },
  { date: '2026-03-21', productType: '食品', yearMonth: '2026-03', amount: 1350, quantity: 54 },
  { date: '2026-03-29', productType: '办公用品', yearMonth: '2026-03', amount: 1900, quantity: 26 },
  { date: '2026-04-06', productType: '电子产品', yearMonth: '2026-04', amount: 4500, quantity: 22 },
  { date: '2026-04-13', productType: '服装', yearMonth: '2026-04', amount: 2100, quantity: 28 },
  { date: '2026-04-22', productType: '食品', yearMonth: '2026-04', amount: 1500, quantity: 60 },
  { date: '2026-04-30', productType: '办公用品', yearMonth: '2026-04', amount: 2050, quantity: 29 },
  { date: '2026-05-09', productType: '电子产品', yearMonth: '2026-05', amount: 5200, quantity: 26 },
  { date: '2026-05-16', productType: '服装', yearMonth: '2026-05', amount: 2800, quantity: 37 },
  { date: '2026-05-23', productType: '食品', yearMonth: '2026-05', amount: 1680, quantity: 67 },
  { date: '2026-05-31', productType: '办公用品', yearMonth: '2026-05', amount: 2300, quantity: 32 },
  { date: '2026-06-07', productType: '电子产品', yearMonth: '2026-06', amount: 4800, quantity: 24 },
  { date: '2026-06-14', productType: '服装', yearMonth: '2026-06', amount: 3100, quantity: 41 },
  { date: '2026-06-22', productType: '食品', yearMonth: '2026-06', amount: 1900, quantity: 76 },
  { date: '2026-06-29', productType: '办公用品', yearMonth: '2026-06', amount: 2550, quantity: 35 },
];

type SampleReport = {
  key: string;
  label: string;
  template: ReportTemplate;
  data: unknown;
  subreports?: Record<string, ReportTemplate>;
};

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
  { key: 'clothingOrderDynamicSize', label: '服装订单动态尺码打印', template: clothingOrderDynamicSizeTemplate, data: clothingOrderDynamicSizeData },
  { key: 'clothingOrderGroupedSize', label: '服装订单分组尺码打印', template: clothingOrderGroupedSizeTemplate, data: clothingOrderGroupedSizeData },
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
] as const satisfies readonly SampleReport[];

export {
  commonComponentsDetailTemplate,
  commonComponentsTemplate,
  chartsTemplate,
  clothingOrderDynamicSizeData,
  clothingOrderDynamicSizeTemplate,
  clothingOrderGroupedSizeData,
  clothingOrderGroupedSizeTemplate,
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
