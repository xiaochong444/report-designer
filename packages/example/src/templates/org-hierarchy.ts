import { band, commonTextStyleIds, template, text } from './common';

export const orgHierarchyData = {
  orgUnits: [
    {
      id: 'hq',
      sortOrder: 1,
      name: '织造服饰集团',
      manager: '陈总',
      headcount: 320,
      children: [
        {
          id: 'east',
          sortOrder: 1,
          name: '华东大区',
          manager: '林经理',
          headcount: 128,
          children: [
            { id: 'nj', sortOrder: 1, name: '南京分公司', manager: '周主管', headcount: 45 },
            { id: 'sh', sortOrder: 2, name: '上海分公司', manager: '吴主管', headcount: 52 },
            { id: 'hz', sortOrder: 3, name: '杭州分公司', manager: '郑主管', headcount: 31 },
          ],
        },
        {
          id: 'supply',
          sortOrder: 2,
          name: '供应链中心',
          manager: '黄总监',
          headcount: 86,
          children: [
            { id: 'wh-sh', sortOrder: 1, name: '上海总仓', manager: '李仓管', headcount: 28 },
            { id: 'wh-nj', sortOrder: 2, name: '南京区域仓', manager: '赵仓管', headcount: 22 },
            { id: 'procure', sortOrder: 3, name: '采购部', manager: '孙经理', headcount: 36 },
          ],
        },
        {
          id: 'retail',
          sortOrder: 3,
          name: '零售运营中心',
          manager: '钱总监',
          headcount: 106,
          children: [
            { id: 'store-nj', sortOrder: 1, name: '南京新街口店', manager: '门店店长A', headcount: 18 },
            { id: 'store-sh', sortOrder: 2, name: '上海淮海路店', manager: '门店店长B', headcount: 22 },
            { id: 'store-hz', sortOrder: 3, name: '杭州武林店', manager: '门店店长C', headcount: 16 },
          ],
        },
      ],
    },
  ],
};

export const orgHierarchyTemplate = template('org-hierarchy', '组织架构树', [
  band('oh-title', 'reportTitle', 12, [
    text('oh-title-text', '组织架构树', 0, 1, 190, 8, { style: commonTextStyleIds.title, textAlign: 'center' }),
  ]),
  band('oh-page-header', 'pageHeader', 8, [
    text('oh-page-header-text', '层级数据带展示服装零售企业组织树', 0, 0, 150, 6, { style: commonTextStyleIds.pageHeader }),
  ]),
  band('oh-header', 'header', 9, [
    text('oh-h-name', '组织单元', 0, 1, 95, 6, { style: commonTextStyleIds.header }),
    text('oh-h-manager', '负责人', 100, 1, 45, 6, { style: commonTextStyleIds.header }),
    text('oh-h-headcount', '编制人数', 150, 1, 28, 6, { style: commonTextStyleIds.headerRight }),
  ]),
  band('oh-data', 'hierarchicalData', 8, [
    text('oh-name', '{orgUnits.name}', 0, 1, 95, 5, { style: commonTextStyleIds.data }),
    text('oh-manager', '{orgUnits.manager}', 100, 1, 45, 5, { style: commonTextStyleIds.data }),
    text('oh-headcount', '{orgUnits.headcount}', 150, 1, 28, 5, { style: commonTextStyleIds.dataRight }),
  ], {
    dataBand: {
      dataSourceId: 'orgUnits',
      hierarchical: { childrenField: 'children', indentChars: 3 },
      sort: [{ field: 'sortOrder', direction: 'asc' }],
      oddRowBackgroundColor: '#ffffff',
      evenRowBackgroundColor: '#f8fafc',
    },
  }),
  band('oh-footer', 'footer', 10, [
    text('oh-total-label', '编制合计', 110, 2, 28, 5, { style: commonTextStyleIds.footer }),
    text('oh-total', 'SUM({orgUnits.headcount})', 150, 2, 28, 5, { style: commonTextStyleIds.footerRight }),
  ]),
  band('oh-page-footer', 'pageFooter', 8, [
    text('oh-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footerCenter }),
  ]),
]);
