import type { ReportTemplate, TextComponent } from '@report-designer/core';
import { band, commonTextStyleIds, template, text } from './common';

export const memberConsumptionData = {
  records: [
    { memberName: '张女士', memberLevel: 'VIP', phone: '13812345678', storeName: '南京新街口店', amount: 3280, remark: '购买夏装套装' },
    { memberName: '李先生', memberLevel: '普通', phone: '13987654321', storeName: '上海淮海路店', amount: 890, remark: '' },
    { memberName: '王女士', memberLevel: 'VIP', phone: '13611112222', storeName: '杭州武林店', amount: 5680, remark: '超额消费需审批' },
    { memberName: '赵先生', memberLevel: '普通', phone: '13733334444', storeName: '南京新街口店', amount: 1250, remark: '使用优惠券' },
    { memberName: '陈女士', memberLevel: 'VIP', phone: '13555556666', storeName: '上海淮海路店', amount: 4200, remark: '' },
    { memberName: '孙先生', memberLevel: '普通', phone: '13477778888', storeName: '杭州武林店', amount: 680, remark: '' },
    { memberName: '周女士', memberLevel: 'VIP', phone: '13399990000', storeName: '南京新街口店', amount: 7200, remark: '大额消费' },
    { memberName: '吴先生', memberLevel: '普通', phone: '13200001111', storeName: '上海淮海路店', amount: 1560, remark: '' },
  ],
};

const memberNameText = text('mc-member', '{records.memberName}', 0, 0, 36, 8, {
  name: 'MemberName',
  events: {
    beforePrint: {
      enabled: true,
      script: 'if (ctx.row.memberLevel === "VIP") { ctx.component.font.bold = true; ctx.component.font.color = "#b45309"; }',
    },
  },
});

const phoneText = text('mc-phone', '{records.phone}', 38, 0, 36, 8, {
  name: 'MemberPhone',
  events: {
    getValue: {
      enabled: true,
      script: 'ctx.setValue(MASKPHONE(ctx.row.phone));',
    },
  },
});

const amountText = text('mc-amount', '{records.amount}', 108, 0, 28, 8, {
  name: 'MemberAmount',
  textAlign: 'right',
  format: { type: 'number', decimalDigits: 2, useGroupSeparator: true },
  conditionalFormat: 'amount-high',
});

const remarkText: TextComponent = text('mc-remark', '{records.remark}', 140, 0, 42, 8, {
  name: 'MemberRemark',
  events: {
    beforePrint: {
      enabled: true,
      script: 'if (!ctx.row.remark) { ctx.hide(); }',
    },
  },
});

export const memberConsumptionTemplate: ReportTemplate = {
  ...template('member-consumption', '会员消费明细', [
    band('mc-title', 'reportTitle', 14, [
      text('mc-title-text', '会员消费明细', 0, 2, 190, 8, { style: commonTextStyleIds.title, textAlign: 'center' }),
      text('mc-subtitle', '事件脚本：VIP 高亮、手机号脱敏、超额标注、条件格式', 0, 11, 190, 5, { style: commonTextStyleIds.pageHeader, textAlign: 'center' }),
    ]),
    band('mc-header', 'header', 10, [
      text('mc-h-member', '会员', 0, 1, 36, 7, { style: commonTextStyleIds.header }),
      text('mc-h-phone', '手机号', 38, 1, 36, 7, { style: commonTextStyleIds.header }),
      text('mc-h-store', '门店', 76, 1, 30, 7, { style: commonTextStyleIds.header }),
      text('mc-h-amount', '消费金额', 108, 1, 28, 7, { style: commonTextStyleIds.headerRight }),
      text('mc-h-remark', '备注', 140, 1, 42, 7, { style: commonTextStyleIds.header }),
    ]),
    band('mc-data', 'data', 10, [
      memberNameText,
      phoneText,
      text('mc-store', '{records.storeName}', 76, 0, 30, 8, { style: commonTextStyleIds.data }),
      amountText,
      remarkText,
    ], {
      dataBand: { dataSourceId: 'records' },
      events: {
        beforePrint: {
          enabled: true,
          script: 'if (ctx.row.amount > 5000) { ctx.createText({ name: "OverLimitBadge", x: 138, y: 0, width: 18, height: 7, text: "超额", font: { bold: true, color: "#dc2626", size: 8 } }); }',
        },
      },
    }),
    band('mc-footer', 'pageFooter', 8, [
      text('mc-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footerCenter }),
    ]),
  ]),
  events: {
    beforePreview: { enabled: true, script: 'ctx.log.info("会员消费明细预览");' },
  },
  conditionalFormats: [
    {
      id: 'amount-high',
      name: '高额消费',
      applyTo: [],
      rules: [
        {
          id: 'amount-high-rule',
          expression: '{records.amount} > 5000',
          overrides: { fontColor: '#dc2626', fontWeight: true },
          breakIfTrue: true,
        },
      ],
    },
  ],
  dataSources: [],
};
