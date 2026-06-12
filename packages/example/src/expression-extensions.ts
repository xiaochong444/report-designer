import type { BuiltinFunction } from '@report-designer/core';
import type { ExpressionCatalogExtensions } from '@report-designer/designer';

export const expressionExtensions: ExpressionCatalogExtensions = {
  functions: [
    {
      name: 'DISCOUNT',
      category: 'number',
      signature: 'DISCOUNT(price, rate)',
      detail: 'DISCOUNT(price, rate)',
      insertText: 'DISCOUNT(${1:price}, ${2:rate})',
      description: {
        'zh-CN': '按折扣率计算折后金额。',
        'en-US': 'Calculates a discounted amount by rate.',
      },
      examples: ['DISCOUNT({items.salesAmount}, 0.9)'],
      evaluate: ([price, rate]) => Number(price) * Number(rate),
    },
    {
      name: 'MASKPHONE',
      category: 'text',
      signature: 'MASKPHONE(phone)',
      detail: 'MASKPHONE(phone)',
      insertText: 'MASKPHONE(${1:phone})',
      description: {
        'zh-CN': '隐藏手机号中间四位，常用于单据脱敏展示。',
        'en-US': 'Masks the middle four digits of a phone number.',
      },
      examples: ['MASKPHONE({Customers.Phone})'],
      evaluate: ([phone]) => String(phone ?? '').replace(/^(\d{3})\d{4}(\d+)$/, '$1****$2'),
    },
  ],
  variables: [
    {
      name: '{TenantName}',
      description: {
        'zh-CN': '当前租户名称，由宿主系统注入。',
        'en-US': 'Current tenant name injected by the host application.',
      },
      previewValue: '演示租户',
    },
  ],
  formats: [
    {
      name: 'FORMAT("CN_DATE", value)',
      insertText: 'FORMAT("${1:CN_DATE}", ${2:value})',
      detail: {
        'zh-CN': '中文日期',
        'en-US': 'Chinese date',
      },
      description: {
        'zh-CN': '按中文日期习惯展示年月日。',
        'en-US': 'Formats a value as a Chinese date.',
      },
    },
  ],
};

export const expressionFunctions: Record<string, BuiltinFunction> = Object.fromEntries(
  (expressionExtensions.functions ?? [])
    .filter((item): item is NonNullable<typeof expressionExtensions.functions>[number] & { evaluate: BuiltinFunction } => Boolean(item.evaluate))
    .map((item) => [item.name.toUpperCase(), item.evaluate]),
);

export const expressionVariables: Record<string, unknown> = {
  TenantName: '演示租户',
};
