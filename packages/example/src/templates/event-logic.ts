import type { ReportTemplate, TextComponent } from '@report-designer/core';
import { band, commonTextStyleIds, template, text } from './common';

export const eventOrdersData = [
  { Customer: 'Northwind Market', Amount: 9800, AlternateAmount: 10200, Description: 'Priority shipment', IsVip: true },
  { Customer: 'Blue River Supply', Amount: 4200, AlternateAmount: 4100, Description: '', IsVip: false },
  { Customer: 'Summit Stores', Amount: 12650, AlternateAmount: 13100, Description: 'Requires approval', IsVip: true },
];

const customerText = text('event-customer', '{eventOrders.Customer}', 0, 0, 52, 8, {
  name: 'EventCustomer',
  events: {
    beforePrint: {
      enabled: true,
      script: 'if (ctx.row.IsVip) { ctx.component.font.bold = true; ctx.component.font.color = "#b45309"; }',
    },
  },
});

const amountText = text('event-amount', '{eventOrders.Amount}', 58, 0, 36, 8, {
  name: 'EventAmount',
  textAlign: 'right',
  format: { type: 'number', decimalDigits: 2, useGroupSeparator: true },
  events: {
    getValue: {
      enabled: true,
      script: 'const field = ctx.parameters.amountField || "Amount"; ctx.setValue(ctx.row[field]);',
    },
  },
});

const descriptionText: TextComponent = text('event-description', '{eventOrders.Description}', 100, 0, 62, 8, {
  name: 'EventDescription',
  events: {
    beforePrint: {
      enabled: true,
      script: 'if (!ctx.row.Description) { ctx.hide(); }',
    },
  },
});

export const eventLogicTemplate: ReportTemplate = {
  ...template('event-logic', 'Event Logic', [
    band('event-title', 'reportTitle', 16, [
      text('event-title-text', 'Event Logic', 0, 2, 80, 8, { style: commonTextStyleIds.title }),
      text('event-subtitle', 'Render-time script sample', 92, 3, 78, 6, { style: commonTextStyleIds.pageHeader }),
    ]),
    band('event-header', 'header', 10, [
      text('event-h-customer', 'Customer', 0, 1, 52, 7, { style: commonTextStyleIds.header }),
      text('event-h-amount', 'Amount', 58, 1, 36, 7, { style: commonTextStyleIds.headerRight }),
      text('event-h-description', 'Description', 100, 1, 62, 7, { style: commonTextStyleIds.header }),
    ]),
    band('event-data', 'data', 10, [
      customerText,
      amountText,
      descriptionText,
    ], {
      dataBand: { dataSourceId: 'eventOrders' },
      events: {
        beforePrint: {
          enabled: true,
          script: 'if (ctx.row.IsVip) { ctx.createText({ name: "VipBadge", x: 166, y: 0, width: 16, height: 7, text: "VIP", font: { bold: true, color: "#d97706" } }); }',
        },
      },
    }),
    band('event-footer', 'pageFooter', 8, [
      text('event-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footerCenter }),
    ]),
  ]),
  events: {
    beforePreview: { enabled: true, script: 'ctx.log.info("Preview event sample");' },
  },
  dataSources: [
    { id: 'eventOrders', name: 'eventOrders', type: 'json', fields: [
      { id: 'eventOrders.Customer', name: 'Customer', path: 'eventOrders.Customer', type: 'string', nullable: false },
      { id: 'eventOrders.Amount', name: 'Amount', path: 'eventOrders.Amount', type: 'number', nullable: false },
      { id: 'eventOrders.AlternateAmount', name: 'AlternateAmount', path: 'eventOrders.AlternateAmount', type: 'number', nullable: false },
      { id: 'eventOrders.Description', name: 'Description', path: 'eventOrders.Description', type: 'string', nullable: true },
      { id: 'eventOrders.IsVip', name: 'IsVip', path: 'eventOrders.IsVip', type: 'boolean', nullable: false },
    ] },
  ],
  parameters: [
    { id: 'amountField', name: 'amountField', type: 'string', defaultValue: 'Amount' },
  ],
};
