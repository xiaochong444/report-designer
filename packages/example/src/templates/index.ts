import type { ReportTemplate } from '@report-designer/core';
import { businessDashboardTemplate } from './business-dashboard';
import { clothingOrderDynamicSizeData, clothingOrderDynamicSizeTemplate } from './clothing-order-dynamic-size';
import { clothingOrderGroupedSizeData, clothingOrderGroupedSizeTemplate } from './clothing-order-grouped-size';
import { componentShowcaseTemplate } from './component-showcase';
import { contractTermsData, contractTermsTemplate } from './contract-terms';
import { memberConsumptionData, memberConsumptionTemplate } from './member-consumption';
import { orgHierarchyData, orgHierarchyTemplate } from './org-hierarchy';
import { productHangTagsData, productHangTagsTemplate } from './product-hang-tags';
import { purchaseReceiptData, purchaseReceiptTemplate } from './purchase-receipt';
import { salesOrderPrintData, salesOrderPrintTemplate } from './sales-order-print';
import { storeDailySalesData, storeDailySalesTemplate } from './store-daily-sales';
import { warehouseTransferData, warehouseTransferTemplate } from './warehouse-transfer';

export const salesAnalyticsData = [
  { date: '2026-01-05', category: '上装', channel: '直营', yearMonth: '2026-01', amount: 3200, quantity: 16, avgOrderValue: 320, attachRate: 1.8, funnelStage: '浏览', count: 1200, region: '华东', kpiScore: 85, storeName: '南京店' },
  { date: '2026-01-12', category: '裤装', channel: '加盟', yearMonth: '2026-01', amount: 1800, quantity: 24, avgOrderValue: 280, attachRate: 1.5, funnelStage: '加购', count: 480, region: '华东', kpiScore: 72, storeName: '上海店' },
  { date: '2026-01-20', category: '配饰', channel: '电商', yearMonth: '2026-01', amount: 950, quantity: 38, avgOrderValue: 150, attachRate: 2.1, funnelStage: '下单', count: 220, region: '华南', kpiScore: 68, storeName: '杭州店' },
  { date: '2026-01-28', category: '外套', channel: '直营', yearMonth: '2026-01', amount: 1450, quantity: 20, avgOrderValue: 450, attachRate: 1.3, funnelStage: '成交', count: 180, region: '华北', kpiScore: 90, storeName: '北京店' },
  { date: '2026-02-03', category: '上装', channel: '加盟', yearMonth: '2026-02', amount: 4100, quantity: 20, avgOrderValue: 340, attachRate: 1.9, funnelStage: '复购', count: 95, region: '华东', kpiScore: 88, storeName: '南京店' },
  { date: '2026-02-15', category: '裤装', channel: '电商', yearMonth: '2026-02', amount: 2200, quantity: 30, avgOrderValue: 290, attachRate: 1.6, funnelStage: '浏览', count: 1100, region: '华南', kpiScore: 75, storeName: '广州店' },
  { date: '2026-02-22', category: '配饰', channel: '直营', yearMonth: '2026-02', amount: 1100, quantity: 44, avgOrderValue: 160, attachRate: 2.0, funnelStage: '加购', count: 420, region: '华北', kpiScore: 70, storeName: '北京店' },
  { date: '2026-02-27', category: '外套', channel: '加盟', yearMonth: '2026-02', amount: 1650, quantity: 22, avgOrderValue: 480, attachRate: 1.4, funnelStage: '下单', count: 200, region: '西南', kpiScore: 82, storeName: '成都店' },
  { date: '2026-03-08', category: '上装', channel: '电商', yearMonth: '2026-03', amount: 3800, quantity: 19, avgOrderValue: 350, attachRate: 1.7, funnelStage: '成交', count: 170, region: '华东', kpiScore: 86, storeName: '上海店' },
  { date: '2026-03-14', category: '裤装', channel: '直营', yearMonth: '2026-03', amount: 2600, quantity: 35, avgOrderValue: 300, attachRate: 1.8, funnelStage: '复购', count: 88, region: '华南', kpiScore: 78, storeName: '广州店' },
  { date: '2026-03-21', category: '配饰', channel: '加盟', yearMonth: '2026-03', amount: 1350, quantity: 54, avgOrderValue: 170, attachRate: 2.2, funnelStage: '浏览', count: 1050, region: '华北', kpiScore: 71, storeName: '天津店' },
  { date: '2026-03-29', category: '外套', channel: '电商', yearMonth: '2026-03', amount: 1900, quantity: 26, avgOrderValue: 500, attachRate: 1.2, funnelStage: '加购', count: 390, region: '西南', kpiScore: 84, storeName: '成都店' },
  { date: '2026-04-06', category: '上装', channel: '直营', yearMonth: '2026-04', amount: 4500, quantity: 22, avgOrderValue: 360, attachRate: 1.9, funnelStage: '下单', count: 210, region: '华东', kpiScore: 91, storeName: '南京店' },
  { date: '2026-04-13', category: '裤装', channel: '加盟', yearMonth: '2026-04', amount: 2100, quantity: 28, avgOrderValue: 285, attachRate: 1.5, funnelStage: '成交', count: 165, region: '华南', kpiScore: 76, storeName: '深圳店' },
  { date: '2026-04-22', category: '配饰', channel: '电商', yearMonth: '2026-04', amount: 1500, quantity: 60, avgOrderValue: 155, attachRate: 2.3, funnelStage: '复购', count: 82, region: '华北', kpiScore: 69, storeName: '北京店' },
  { date: '2026-04-30', category: '外套', channel: '直营', yearMonth: '2026-04', amount: 2050, quantity: 29, avgOrderValue: 490, attachRate: 1.3, funnelStage: '浏览', count: 980, region: '西南', kpiScore: 87, storeName: '重庆店' },
  { date: '2026-05-09', category: '上装', channel: '加盟', yearMonth: '2026-05', amount: 5200, quantity: 26, avgOrderValue: 370, attachRate: 2.0, funnelStage: '加购', count: 450, region: '华东', kpiScore: 92, storeName: '上海店' },
  { date: '2026-05-16', category: '裤装', channel: '电商', yearMonth: '2026-05', amount: 2800, quantity: 37, avgOrderValue: 295, attachRate: 1.6, funnelStage: '下单', count: 195, region: '华南', kpiScore: 79, storeName: '广州店' },
  { date: '2026-05-23', category: '配饰', channel: '直营', yearMonth: '2026-05', amount: 1680, quantity: 67, avgOrderValue: 165, attachRate: 2.1, funnelStage: '成交', count: 175, region: '华北', kpiScore: 73, storeName: '天津店' },
  { date: '2026-05-31', category: '外套', channel: '加盟', yearMonth: '2026-05', amount: 2300, quantity: 32, avgOrderValue: 510, attachRate: 1.4, funnelStage: '复购', count: 78, region: '西南', kpiScore: 85, storeName: '成都店' },
  { date: '2026-06-07', category: '上装', channel: '电商', yearMonth: '2026-06', amount: 4800, quantity: 24, avgOrderValue: 380, attachRate: 1.8, funnelStage: '浏览', count: 1150, region: '华东', kpiScore: 89, storeName: '杭州店' },
  { date: '2026-06-14', category: '裤装', channel: '直营', yearMonth: '2026-06', amount: 3100, quantity: 41, avgOrderValue: 310, attachRate: 1.7, funnelStage: '加购', count: 410, region: '华南', kpiScore: 80, storeName: '深圳店' },
  { date: '2026-06-22', category: '配饰', channel: '加盟', yearMonth: '2026-06', amount: 1900, quantity: 76, avgOrderValue: 175, attachRate: 2.4, funnelStage: '下单', count: 205, region: '华北', kpiScore: 74, storeName: '北京店' },
  { date: '2026-06-29', category: '外套', channel: '电商', yearMonth: '2026-06', amount: 2550, quantity: 35, avgOrderValue: 520, attachRate: 1.5, funnelStage: '成交', count: 168, region: '西南', kpiScore: 86, storeName: '重庆店' },
];

type SampleReport = {
  key: string;
  label: string;
  template: ReportTemplate;
  data: unknown;
};

export const sampleGroups = [
  {
    label: '单据打印',
    samples: ['purchaseReceipt', 'salesOrderPrint'],
  },
  {
    label: '分组汇总',
    samples: ['storeDailySales', 'warehouseTransfer'],
  },
  {
    label: '服装行业',
    samples: ['clothingOrderDynamicSize', 'clothingOrderGroupedSize', 'productHangTags'],
  },
  {
    label: '高级特性',
    samples: ['orgHierarchy', 'memberConsumption'],
  },
  {
    label: '图表与综合',
    samples: ['businessDashboard', 'contractTerms', 'componentShowcase'],
  },
] as const;

const sampleReportMap: Record<string, SampleReport> = {
  purchaseReceipt: { key: 'purchaseReceipt', label: '采购入库单', template: purchaseReceiptTemplate, data: purchaseReceiptData },
  salesOrderPrint: { key: 'salesOrderPrint', label: '销售订单打印', template: salesOrderPrintTemplate, data: salesOrderPrintData },
  storeDailySales: { key: 'storeDailySales', label: '门店销售日报', template: storeDailySalesTemplate, data: storeDailySalesData },
  warehouseTransfer: { key: 'warehouseTransfer', label: '仓库调拨单', template: warehouseTransferTemplate, data: warehouseTransferData },
  clothingOrderDynamicSize: { key: 'clothingOrderDynamicSize', label: '服装订单动态尺码打印', template: clothingOrderDynamicSizeTemplate, data: clothingOrderDynamicSizeData },
  clothingOrderGroupedSize: { key: 'clothingOrderGroupedSize', label: '服装订单分组尺码打印', template: clothingOrderGroupedSizeTemplate, data: clothingOrderGroupedSizeData },
  productHangTags: { key: 'productHangTags', label: '商品吊牌批量打印', template: productHangTagsTemplate, data: productHangTagsData },
  orgHierarchy: { key: 'orgHierarchy', label: '组织架构树', template: orgHierarchyTemplate, data: orgHierarchyData },
  memberConsumption: { key: 'memberConsumption', label: '会员消费明细', template: memberConsumptionTemplate, data: memberConsumptionData },
  businessDashboard: { key: 'businessDashboard', label: '经营分析看板', template: businessDashboardTemplate, data: { salesAnalytics: salesAnalyticsData } },
  contractTerms: { key: 'contractTerms', label: '合同条款与长文本', template: contractTermsTemplate, data: contractTermsData },
  componentShowcase: { key: 'componentShowcase', label: '组件能力全景', template: componentShowcaseTemplate, data: {} },
};

export const sampleReports = sampleGroups.flatMap(group => (
  group.samples.map(key => sampleReportMap[key])
));

export const sampleSelectOptions = sampleGroups.map(group => ({
  label: group.label,
  options: group.samples.map(key => ({
    value: sampleReportMap[key].key,
    label: sampleReportMap[key].label,
  })),
}));

export {
  businessDashboardTemplate,
  clothingOrderDynamicSizeData,
  clothingOrderDynamicSizeTemplate,
  clothingOrderGroupedSizeData,
  clothingOrderGroupedSizeTemplate,
  componentShowcaseTemplate,
  contractTermsData,
  contractTermsTemplate,
  memberConsumptionData,
  memberConsumptionTemplate,
  orgHierarchyData,
  orgHierarchyTemplate,
  productHangTagsData,
  productHangTagsTemplate,
  purchaseReceiptData,
  purchaseReceiptTemplate,
  salesOrderPrintData,
  salesOrderPrintTemplate,
  storeDailySalesData,
  storeDailySalesTemplate,
  warehouseTransferData,
  warehouseTransferTemplate,
};
