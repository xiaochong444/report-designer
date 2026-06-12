import type { ReportTemplate } from '@report-designer/core';
import { band, commonTextStyleIds, template, text } from './common';

const termsHtml = [
  '<p><strong>第一条 加盟资格</strong></p>',
  '<p>加盟商须具备独立法人资格或合法经营主体，拥有符合品牌要求的经营场所。</p>',
  '<p><strong>第二条 品牌授权</strong></p>',
  '<p>授权方授予加盟商在约定区域内使用品牌标识、视觉系统及经营管理体系的非独占使用权。</p>',
  '<p><strong>第三条 供货与价格</strong></p>',
  '<p>加盟商须通过指定供应链系统订货，零售价不得低于公司指导价，促销方案须提前报备。</p>',
  '<p><strong>第四条 装修与陈列</strong></p>',
  '<p>门店装修须按品牌标准执行，开业前须通过公司验收。陈列方案每季更新，加盟商须配合执行。</p>',
  '<p><strong>第五条 培训与支持</strong></p>',
  '<p>公司提供免费开业培训及季度运营辅导，加盟商须指派店长及核心员工参加。</p>',
  '<p><strong>第六条 数据上报</strong></p>',
  '<p>加盟商须每日通过 POS 系统上报销售数据，确保库存、会员、促销信息实时同步。</p>',
  '<p><strong>第七条 违约责任</strong></p>',
  '<p>违反本合同约定的，授权方有权要求整改、暂停供货或终止加盟关系，并追究相应经济损失。</p>',
].join('');

const longRemark = [
  '附：加盟商须确保门店员工统一着装，严格执行会员积分与退换货政策。',
  '夏季新品上市期间须保证橱窗陈列面积不低于门店总面积的 15%，并配合总部巡店检查。',
  '如遇商场统一促销活动，须提前 7 个工作日向区域经理提交活动方案，未经审批不得擅自降价。',
  '本条款为合同附件，与主合同具有同等法律效力。加盟商签字确认后即视为知悉并同意遵守以上全部条款。',
  '补充说明：对于超过 500 平方米的旗舰店，装修周期可延长至 90 天，但须提交详细的施工进度计划。',
  '所有门店须在营业时间内保持至少两名经过培训的导购在岗，VIP 客户接待须由资深导购负责。',
  '加盟商应每季度参加总部组织的产品知识培训，并通过线上考试后方可参与新品预售活动。',
  '对于违反陈列标准的门店，总部有权要求限期整改；逾期未整改的，将按合同约定扣除相应保证金。',
].join(' ');

export const contractTermsData = {
  contractNo: 'JM-2026-0612',
  franchiseeName: '杭州织造商贸有限公司',
  signDate: '2026-06-12',
  termsHtml,
  longRemark,
};

const baseTemplate = template('contract-terms', '合同条款与长文本', [
  band('ct-title', 'reportTitle', 20, [
    text('ct-title-text', '加盟合同附页', 0, 2, 190, 8, { style: commonTextStyleIds.title, textAlign: 'center' }),
    text('ct-contract-no', '合同编号：{contractNo}', 0, 12, 90, 5, { style: commonTextStyleIds.pageHeader }),
    text('ct-franchisee', '加盟商：{franchiseeName}', 100, 12, 90, 5, { style: commonTextStyleIds.pageHeader }),
  ]),
  band('ct-richtext', 'header', 52, [
    {
      id: 'ct-terms',
      type: 'richtext',
      x: 0,
      y: 0,
      width: 190,
      height: 50,
      html: '{termsHtml}',
    },
  ]),
  band('ct-remark-header', 'header', 8, [
    text('ct-remark-title', '补充条款（canGrow 自动分页）', 0, 1, 120, 5, { style: commonTextStyleIds.header }),
  ]),
  band('ct-remark', 'reportSummary', 14, [
    text('ct-remark-body', '{longRemark}', 0, 1, 190, 8, { style: commonTextStyleIds.dataGrow }),
  ]),
  band('ct-page-footer', 'pageFooter', 8, [
    text('ct-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footerCenter }),
  ]),
]);

export const contractTermsTemplate: ReportTemplate = {
  ...baseTemplate,
  pages: [
    {
      ...baseTemplate.pages[0],
      watermark: {
        enabled: true,
        text: '内部资料',
        fontSize: 48,
        color: '#8c8c8c',
        opacity: 0.15,
      },
      pageBorder: {
        enabled: true,
        style: 'solid',
        width: 0.5,
        color: '#cbd5e1',
        sides: { top: true, right: true, bottom: true, left: true },
      },
    },
  ],
  dataSources: [],
};
