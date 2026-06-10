import type { DataSource } from '@report-designer/core';
import { band, commonTextStyleIds, template, text } from './common';

const orgUnitsSource: DataSource = {
  id: 'orgUnits',
  name: 'orgUnits',
  type: 'json',
  path: 'orgUnits',
  fields: [
    { id: 'orgUnits.id', name: 'id', path: 'orgUnits.id', type: 'string', nullable: false },
    { id: 'orgUnits.sortOrder', name: 'sortOrder', path: 'orgUnits.sortOrder', type: 'number', nullable: false },
    { id: 'orgUnits.name', name: 'name', path: 'orgUnits.name', type: 'string', nullable: false },
    { id: 'orgUnits.children', name: 'children', path: 'orgUnits.children', type: 'string', nullable: true },
    { id: 'orgUnits.manager', name: 'manager', path: 'orgUnits.manager', type: 'string', nullable: false },
    { id: 'orgUnits.headcount', name: 'headcount', path: 'orgUnits.headcount', type: 'number', nullable: false },
  ],
};

export const hierarchicalOrgData = {
  orgUnits: [
    {
      id: 'company',
      sortOrder: 1,
      name: 'Acme Group',
      manager: 'Nina Patel',
      headcount: 128,
      children: [
        {
          id: 'sales',
          sortOrder: 1,
          name: 'Sales Division',
          manager: 'Ivy Chen',
          headcount: 42,
          children: [
            { id: 'sales-east', sortOrder: 1, name: 'East Region', manager: 'Owen Li', headcount: 18 },
            { id: 'sales-west', sortOrder: 2, name: 'West Region', manager: 'Mia Green', headcount: 24 },
          ],
        },
        {
          id: 'engineering',
          sortOrder: 2,
          name: 'Engineering',
          manager: 'Ravi Kumar',
          headcount: 58,
          children: [
            { id: 'platform', sortOrder: 1, name: 'Platform Team', manager: 'Sara Wong', headcount: 27 },
            { id: 'reporting', sortOrder: 2, name: 'Reporting Team', manager: 'Leo Martin', headcount: 31 },
          ],
        },
        { id: 'operations', sortOrder: 3, name: 'Operations', manager: 'Grace Wu', headcount: 28 },
      ],
    },
  ],
};

const baseHierarchicalOrgTemplate = template('hierarchical-organization', 'Hierarchical Organization', [
  band('ho-title', 'reportTitle', 12, [
    text('ho-title-text', 'Hierarchical Organization', 0, 1, 190, 8, { style: commonTextStyleIds.title }),
  ]),
  band('ho-page-header', 'pageHeader', 8, [
    text('ho-page-header-text', 'A hierarchical data band can display rows as a tree', 0, 0, 150, 6, { style: commonTextStyleIds.pageHeader }),
  ]),
  band('ho-header', 'header', 9, [
    text('ho-h-name', 'Organization Unit', 0, 1, 95, 6, { style: commonTextStyleIds.header }),
    text('ho-h-manager', 'Manager', 100, 1, 45, 6, { style: commonTextStyleIds.header }),
    text('ho-h-headcount', 'Headcount', 150, 1, 28, 6, { style: commonTextStyleIds.headerRight }),
  ]),
  band('ho-data', 'hierarchicalData', 8, [
    text('ho-name', '{orgUnits.name}', 0, 1, 95, 5, { style: commonTextStyleIds.data }),
    text('ho-manager', '{orgUnits.manager}', 100, 1, 45, 5, { style: commonTextStyleIds.data }),
    text('ho-headcount', '{orgUnits.headcount}', 150, 1, 28, 5, { style: commonTextStyleIds.dataRight }),
  ], {
    dataBand: {
      dataSourceId: 'orgUnits',
      hierarchical: { childrenField: 'children', indentChars: 3 },
      sort: [{ field: 'sortOrder', direction: 'asc' }],
      oddRowBackgroundColor: '#ffffff',
      evenRowBackgroundColor: '#f8fafc',
    },
  }),
  band('ho-footer', 'footer', 10, [
    text('ho-total', 'SUM({orgUnits.headcount})', 110, 2, 68, 5, { style: commonTextStyleIds.footerRight }),
  ]),
  band('ho-page-footer', 'pageFooter', 8, [
    text('ho-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footerCenter }),
  ]),
]);

export const hierarchicalOrgTemplate = {
  ...baseHierarchicalOrgTemplate,
  dataSources: [...baseHierarchicalOrgTemplate.dataSources, orgUnitsSource],
};
