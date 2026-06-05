import type { DesignerLocale } from '../i18n/messages';

export type ExpressionFunctionCategory =
  | 'common'
  | 'aggregate'
  | 'number'
  | 'text'
  | 'date'
  | 'logic'
  | 'report'
  | 'money'
  | 'format';

export interface ExpressionFunctionMeta {
  name: string;
  category: ExpressionFunctionCategory;
  description: Record<DesignerLocale, string>;
  signature: string;
  insertText: string;
  detail: string;
  examples: string[];
}

export const EXPRESSION_FUNCTION_CATEGORIES: Array<{ key: ExpressionFunctionCategory; labelKey: string }> = [
  { key: 'common', labelKey: 'expressionEditor.category.common' },
  { key: 'aggregate', labelKey: 'expressionEditor.category.aggregate' },
  { key: 'number', labelKey: 'expressionEditor.category.number' },
  { key: 'text', labelKey: 'expressionEditor.category.text' },
  { key: 'date', labelKey: 'expressionEditor.category.date' },
  { key: 'logic', labelKey: 'expressionEditor.category.logic' },
  { key: 'report', labelKey: 'expressionEditor.category.report' },
  { key: 'money', labelKey: 'expressionEditor.category.money' },
  { key: 'format', labelKey: 'expressionEditor.category.format' },
];

function fn(
  name: string,
  category: ExpressionFunctionCategory,
  zh: string,
  en: string,
  signature: string,
  insertText: string,
  examples: string[],
): ExpressionFunctionMeta {
  return {
    name,
    category,
    description: { 'zh-CN': zh, 'en-US': en },
    signature,
    insertText,
    detail: signature,
    examples,
  };
}

export const EXPRESSION_FUNCTIONS: ExpressionFunctionMeta[] = [
  fn('IF', 'common', '条件判断', 'Conditional expression', 'IF(condition, trueValue, falseValue)', 'IF(${1:condition}, ${2:trueValue}, ${3:falseValue})', ['IF({Orders.Amount} > 0, "Y", "N")']),

  fn('SUM', 'aggregate', '求和', 'Sum', 'SUM(expression)', 'SUM(${1:{Orders.Amount}})', ['SUM({Orders.Amount})']),
  fn('AVG', 'aggregate', '平均值', 'Average', 'AVG(expression)', 'AVG(${1:{Orders.Amount}})', ['AVG({Orders.Amount})']),
  fn('COUNT', 'aggregate', '计数', 'Count', 'COUNT(expression)', 'COUNT(${1:{Orders.Id}})', ['COUNT({Orders.Id})']),
  fn('COUNTDISTINCT', 'aggregate', '去重计数', 'Distinct count', 'COUNTDISTINCT(expression)', 'COUNTDISTINCT(${1:{Orders.CustomerId}})', ['COUNTDISTINCT({Orders.CustomerId})']),
  fn('MIN', 'aggregate', '最小值', 'Minimum', 'MIN(expression)', 'MIN(${1:{Orders.Amount}})', ['MIN({Orders.Amount})']),
  fn('MAX', 'aggregate', '最大值', 'Maximum', 'MAX(expression)', 'MAX(${1:{Orders.Amount}})', ['MAX({Orders.Amount})']),
  fn('SUMIF', 'aggregate', '条件求和', 'Conditional sum', 'SUMIF(expression, condition)', 'SUMIF(${1:{Orders.Amount}}, "${2:{Orders.Status} = \\"OK\\"}")', ['SUMIF({Orders.Amount}, "{Orders.Status} = \\"OK\\"")']),
  fn('COUNTIF', 'aggregate', '条件计数', 'Conditional count', 'COUNTIF(condition)', 'COUNTIF("${1:{Orders.Status} = \\"OK\\"}")', ['COUNTIF("{Orders.Status} = \\"OK\\"")']),
  fn('RUNNINGSUM', 'aggregate', '运行合计', 'Running sum', 'RUNNINGSUM(expression)', 'RUNNINGSUM(${1:{Orders.Amount}})', ['RUNNINGSUM({Orders.Amount})']),

  fn('ROUND', 'number', '四舍五入', 'Round', 'ROUND(value, digits)', 'ROUND(${1:value}, ${2:2})', ['ROUND({Orders.Amount}, 2)']),
  fn('CEIL', 'number', '向上取整', 'Ceiling', 'CEIL(value)', 'CEIL(${1:value})', ['CEIL({Orders.Amount})']),
  fn('FLOOR', 'number', '向下取整', 'Floor', 'FLOOR(value)', 'FLOOR(${1:value})', ['FLOOR({Orders.Amount})']),
  fn('ABS', 'number', '绝对值', 'Absolute value', 'ABS(value)', 'ABS(${1:value})', ['ABS({Orders.Amount})']),
  fn('TONUMBER', 'number', '转换为数字', 'Convert to number', 'TONUMBER(value)', 'TONUMBER(${1:value})', ['TONUMBER({Orders.AmountText})']),

  fn('CONCAT', 'text', '拼接文本', 'Concatenate text', 'CONCAT(value1, value2)', 'CONCAT(${1:value1}, ${2:value2})', ['CONCAT({Customer.Name}, " - ", {Orders.Code})']),
  fn('LEN', 'text', '文本长度', 'Text length', 'LEN(value)', 'LEN(${1:value})', ['LEN({Customer.Name})']),
  fn('UPPER', 'text', '转换为大写', 'Uppercase', 'UPPER(value)', 'UPPER(${1:value})', ['UPPER({Customer.Code})']),
  fn('LOWER', 'text', '转换为小写', 'Lowercase', 'LOWER(value)', 'LOWER(${1:value})', ['LOWER({Customer.Code})']),
  fn('TRIM', 'text', '去除首尾空格', 'Trim whitespace', 'TRIM(value)', 'TRIM(${1:value})', ['TRIM({Customer.Name})']),
  fn('SUBSTRING', 'text', '截取文本', 'Substring', 'SUBSTRING(value, start, length)', 'SUBSTRING(${1:value}, ${2:0}, ${3:3})', ['SUBSTRING({Customer.Name}, 0, 3)']),
  fn('CONTAINS', 'text', '包含文本', 'Contains text', 'CONTAINS(value, search)', 'CONTAINS(${1:value}, ${2:search})', ['CONTAINS({Customer.Name}, "Ltd")']),
  fn('STARTSWITH', 'text', '以文本开头', 'Starts with', 'STARTSWITH(value, search)', 'STARTSWITH(${1:value}, ${2:search})', ['STARTSWITH({Customer.Code}, "A")']),
  fn('ENDSWITH', 'text', '以文本结尾', 'Ends with', 'ENDSWITH(value, search)', 'ENDSWITH(${1:value}, ${2:search})', ['ENDSWITH({Customer.Code}, "Z")']),
  fn('TOSTRING', 'text', '转换为文本', 'Convert to string', 'TOSTRING(value)', 'TOSTRING(${1:value})', ['TOSTRING({Orders.Amount})']),

  fn('NOW', 'date', '当前日期时间', 'Current date and time', 'NOW()', 'NOW()', ['NOW()']),
  fn('TODAY', 'date', '当前日期', 'Current date', 'TODAY()', 'TODAY()', ['TODAY()']),
  fn('YEAR', 'date', '年份', 'Year', 'YEAR(date)', 'YEAR(${1:date})', ['YEAR({Orders.Date})']),
  fn('MONTH', 'date', '月份', 'Month', 'MONTH(date)', 'MONTH(${1:date})', ['MONTH({Orders.Date})']),
  fn('DAY', 'date', '日期中的天', 'Day', 'DAY(date)', 'DAY(${1:date})', ['DAY({Orders.Date})']),
  fn('DATEADD', 'date', '日期加减', 'Add date interval', 'DATEADD(date, unit, amount)', 'DATEADD(${1:date}, "${2:day}", ${3:1})', ['DATEADD({Orders.Date}, "day", 7)']),
  fn('DATEDIFF', 'date', '日期差值', 'Date difference', 'DATEDIFF(start, end, unit)', 'DATEDIFF(${1:start}, ${2:end}, "${3:day}")', ['DATEDIFF({Orders.Start}, {Orders.End}, "day")']),

  fn('IIF', 'logic', '条件判断别名', 'Conditional alias', 'IIF(condition, trueValue, falseValue)', 'IIF(${1:condition}, ${2:trueValue}, ${3:falseValue})', ['IIF({Orders.Amount} > 0, "Y", "N")']),
  fn('ISNULL', 'logic', '是否为空', 'Is null', 'ISNULL(value)', 'ISNULL(${1:value})', ['ISNULL({Customer.Name})']),
  fn('COALESCE', 'logic', '返回第一个非空值', 'First non-null value', 'COALESCE(value1, value2)', 'COALESCE(${1:value1}, ${2:value2})', ['COALESCE({Customer.Name}, "Unknown")']),

  fn('PAGE', 'report', '当前页码', 'Current page', 'PAGE()', 'PAGE()', ['PAGE()']),
  fn('TOTALPAGES', 'report', '总页数', 'Total pages', 'TOTALPAGES()', 'TOTALPAGES()', ['TOTALPAGES()']),
  fn('ROWINDEX', 'report', '当前行索引', 'Current row index', 'ROWINDEX()', 'ROWINDEX()', ['ROWINDEX()']),

  fn('RMBUPPER', 'money', '人民币金额大写', 'RMB uppercase', 'RMBUPPER(value)', 'RMBUPPER(${1:value})', ['RMBUPPER({Orders.Amount})']),
  fn('MONEYUPPER', 'money', '金额大写别名', 'Money uppercase alias', 'MONEYUPPER(value)', 'MONEYUPPER(${1:value})', ['MONEYUPPER({Orders.Amount})']),
  fn('CNYUPPER', 'money', '人民币大写别名', 'CNY uppercase alias', 'CNYUPPER(value)', 'CNYUPPER(${1:value})', ['CNYUPPER({Orders.Amount})']),
  fn('CHINESEMONEY', 'money', '中文金额大写别名', 'Chinese money uppercase alias', 'CHINESEMONEY(value)', 'CHINESEMONEY(${1:value})', ['CHINESEMONEY({Orders.Amount})']),

  fn('FORMAT', 'format', '格式化值', 'Format value', 'FORMAT(pattern, value)', 'FORMAT("${1:N2}", ${2:value})', ['FORMAT("C", {Orders.Amount})']),
];

export function getExpressionFunctionsByCategory(category: ExpressionFunctionCategory): ExpressionFunctionMeta[] {
  return EXPRESSION_FUNCTIONS.filter(item => item.category === category);
}

export function getExpressionFunctionNames(): string[] {
  return EXPRESSION_FUNCTIONS.map(item => item.name);
}
