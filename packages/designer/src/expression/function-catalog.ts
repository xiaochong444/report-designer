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

export function formatExpressionFunctionDocumentation(item: ExpressionFunctionMeta, locale: DesignerLocale): string {
  const exampleLabel = locale === 'zh-CN' ? '示例' : 'Example';
  return [
    item.signature,
    item.description[locale],
    ...item.examples.map(example => `${exampleLabel}: ${example}`),
  ].join('\n');
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

export const FUNCTION_FOLDER_LABELS: Partial<Record<ExpressionFunctionCategory, string>> = {
  aggregate: 'expressionEditor.tree.aggregateFunctions',
  logic: 'expressionEditor.tree.logicFunctions',
  money: 'expressionEditor.tree.moneyFunctions',
};

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
  fn('IF', 'common', '根据条件返回两个值中的一个', 'Returns one of two values based on a condition.', 'IF(condition, trueValue, falseValue)', 'IF(${1:condition}, ${2:trueValue}, ${3:falseValue})', ['IF({Orders.Amount} > 0, "Y", "N")']),

  fn('SUM', 'aggregate', '对指定字段表达式进行求和', 'Sums the values of a field expression.', 'SUM(expression)', 'SUM(${1:{Orders.Amount}})', ['SUM({Orders.Amount})']),
  fn('AVG', 'aggregate', '计算指定字段表达式的平均值', 'Calculates the average value of a field expression.', 'AVG(expression)', 'AVG(${1:{Orders.Amount}})', ['AVG({Orders.Amount})']),
  fn('COUNT', 'aggregate', '统计指定字段表达式的非空记录数', 'Counts non-empty values for a field expression.', 'COUNT(expression)', 'COUNT(${1:{Orders.Id}})', ['COUNT({Orders.Id})']),
  fn('COUNTDISTINCT', 'aggregate', '统计指定字段表达式的去重值数量', 'Counts distinct non-empty values for a field expression.', 'COUNTDISTINCT(expression)', 'COUNTDISTINCT(${1:{Orders.CustomerId}})', ['COUNTDISTINCT({Orders.CustomerId})']),
  fn('MIN', 'aggregate', '返回指定字段表达式的最小值', 'Returns the minimum value of a field expression.', 'MIN(expression)', 'MIN(${1:{Orders.Amount}})', ['MIN({Orders.Amount})']),
  fn('MAX', 'aggregate', '返回指定字段表达式的最大值', 'Returns the maximum value of a field expression.', 'MAX(expression)', 'MAX(${1:{Orders.Amount}})', ['MAX({Orders.Amount})']),
  fn('SUMIF', 'aggregate', '对满足条件的记录汇总指定字段表达式', 'Sums a field expression for rows that match a condition.', 'SUMIF(expression, condition)', 'SUMIF(${1:{Orders.Amount}}, "${2:{Orders.Status} = \\"OK\\"}")', ['SUMIF({Orders.Amount}, "{Orders.Status} = \\"OK\\"")']),
  fn('COUNTIF', 'aggregate', '统计满足条件的记录数量', 'Counts rows that match a condition.', 'COUNTIF(condition)', 'COUNTIF("${1:{Orders.Status} = \\"OK\\"}")', ['COUNTIF("{Orders.Status} = \\"OK\\"")']),
  fn('RUNNINGSUM', 'aggregate', '按当前行位置计算运行合计', 'Calculates a running sum up to the current row.', 'RUNNINGSUM(expression)', 'RUNNINGSUM(${1:{Orders.Amount}})', ['RUNNINGSUM({Orders.Amount})']),

  fn('ROUND', 'number', '按指定小数位四舍五入数字', 'Rounds a number to the specified number of digits.', 'ROUND(value, digits)', 'ROUND(${1:value}, ${2:2})', ['ROUND({Orders.Amount}, 2)']),
  fn('CEIL', 'number', '返回大于或等于该值的最小整数', 'Returns the smallest integer greater than or equal to the value.', 'CEIL(value)', 'CEIL(${1:value})', ['CEIL({Orders.Amount})']),
  fn('FLOOR', 'number', '返回小于或等于该值的最大整数', 'Returns the largest integer less than or equal to the value.', 'FLOOR(value)', 'FLOOR(${1:value})', ['FLOOR({Orders.Amount})']),
  fn('ABS', 'number', '返回数字的绝对值', 'Returns the absolute value of a number.', 'ABS(value)', 'ABS(${1:value})', ['ABS({Orders.Amount})']),
  fn('POWER', 'number', '返回数字的指定次幂', 'Raises a number to the specified power.', 'POWER(value, exponent)', 'POWER(${1:value}, ${2:2})', ['POWER({Orders.Amount}, 2)']),
  fn('SQRT', 'number', '返回数字的平方根', 'Returns the square root of a number.', 'SQRT(value)', 'SQRT(${1:value})', ['SQRT({Orders.Amount})']),
  fn('MAXVALUE', 'number', '返回多个值中的最大值', 'Returns the largest value from the provided arguments.', 'MAXVALUE(value1, value2)', 'MAXVALUE(${1:value1}, ${2:value2})', ['MAXVALUE({Orders.Amount}, 100)']),
  fn('MINVALUE', 'number', '返回多个值中的最小值', 'Returns the smallest value from the provided arguments.', 'MINVALUE(value1, value2)', 'MINVALUE(${1:value1}, ${2:value2})', ['MINVALUE({Orders.Amount}, 100)']),
  fn('TONUMBER', 'number', '将文本或值转换为数字', 'Converts text or another value to a number.', 'TONUMBER(value)', 'TONUMBER(${1:value})', ['TONUMBER({Orders.AmountText})']),

  fn('CONCAT', 'text', '按顺序拼接多个文本或字段值', 'Concatenates text and field values in order.', 'CONCAT(value1, value2)', 'CONCAT(${1:value1}, ${2:value2})', ['CONCAT({Customer.Name}, " - ", {Orders.Code})']),
  fn('LEN', 'text', '返回文本的字符长度', 'Returns the character length of a text value.', 'LEN(value)', 'LEN(${1:value})', ['LEN({Customer.Name})']),
  fn('UPPER', 'text', '将文本转换为大写', 'Converts text to uppercase.', 'UPPER(value)', 'UPPER(${1:value})', ['UPPER({Customer.Code})']),
  fn('LOWER', 'text', '将文本转换为小写', 'Converts text to lowercase.', 'LOWER(value)', 'LOWER(${1:value})', ['LOWER({Customer.Code})']),
  fn('TRIM', 'text', '移除文本首尾空白字符', 'Removes leading and trailing whitespace.', 'TRIM(value)', 'TRIM(${1:value})', ['TRIM({Customer.Name})']),
  fn('SUBSTRING', 'text', '按起始位置和长度截取文本', 'Returns part of a text value by start position and length.', 'SUBSTRING(value, start, length)', 'SUBSTRING(${1:value}, ${2:0}, ${3:3})', ['SUBSTRING({Customer.Name}, 0, 3)']),
  fn('LEFT', 'text', '从左侧截取指定长度的文本', 'Returns the leftmost characters from text.', 'LEFT(value, count)', 'LEFT(${1:value}, ${2:3})', ['LEFT({Customer.Name}, 3)']),
  fn('RIGHT', 'text', '从右侧截取指定长度的文本', 'Returns the rightmost characters from text.', 'RIGHT(value, count)', 'RIGHT(${1:value}, ${2:4})', ['RIGHT({Customer.Phone}, 4)']),
  fn('REPLACE', 'text', '替换文本中的指定内容', 'Replaces all occurrences of a search value in text.', 'REPLACE(value, search, replacement)', 'REPLACE(${1:value}, ${2:search}, ${3:replacement})', ['REPLACE({Customer.Phone}, "-", "")']),
  fn('INDEXOF', 'text', '返回文本中指定内容的位置', 'Returns the zero-based position of a search value in text.', 'INDEXOF(value, search)', 'INDEXOF(${1:value}, ${2:search})', ['INDEXOF({Customer.Name}, "Ltd")']),
  fn('CONTAINS', 'text', '判断文本是否包含指定内容', 'Checks whether text contains the specified value.', 'CONTAINS(value, search)', 'CONTAINS(${1:value}, ${2:search})', ['CONTAINS({Customer.Name}, "Ltd")']),
  fn('STARTSWITH', 'text', '判断文本是否以指定内容开头', 'Checks whether text starts with the specified value.', 'STARTSWITH(value, search)', 'STARTSWITH(${1:value}, ${2:search})', ['STARTSWITH({Customer.Code}, "A")']),
  fn('ENDSWITH', 'text', '判断文本是否以指定内容结尾', 'Checks whether text ends with the specified value.', 'ENDSWITH(value, search)', 'ENDSWITH(${1:value}, ${2:search})', ['ENDSWITH({Customer.Code}, "Z")']),
  fn('TOSTRING', 'text', '将值转换为文本', 'Converts a value to text.', 'TOSTRING(value)', 'TOSTRING(${1:value})', ['TOSTRING({Orders.Amount})']),

  fn('NOW', 'date', '返回当前日期和时间', 'Returns the current date and time.', 'NOW()', 'NOW()', ['NOW()']),
  fn('TODAY', 'date', '返回当前日期，不包含时间部分', 'Returns the current date without a time component.', 'TODAY()', 'TODAY()', ['TODAY()']),
  fn('YEAR', 'date', '返回日期中的年份', 'Returns the year part of a date.', 'YEAR(date)', 'YEAR(${1:date})', ['YEAR({Orders.Date})']),
  fn('MONTH', 'date', '返回日期中的月份', 'Returns the month part of a date.', 'MONTH(date)', 'MONTH(${1:date})', ['MONTH({Orders.Date})']),
  fn('DAY', 'date', '返回日期中的日', 'Returns the day part of a date.', 'DAY(date)', 'DAY(${1:date})', ['DAY({Orders.Date})']),
  fn('DATEFORMAT', 'date', '按指定日期格式输出文本', 'Formats a date using the specified pattern.', 'DATEFORMAT(date, pattern)', 'DATEFORMAT(${1:date}, "${2:yyyy-MM-dd}")', ['DATEFORMAT({Orders.Date}, "yyyy-MM-dd")']),
  fn('DATEADD', 'date', '按指定单位对日期进行加减', 'Adds or subtracts a date interval using the specified unit.', 'DATEADD(date, unit, amount)', 'DATEADD(${1:date}, "${2:day}", ${3:1})', ['DATEADD({Orders.Date}, "day", 7)']),
  fn('DATEDIFF', 'date', '按指定单位计算两个日期之间的差值', 'Calculates the difference between two dates using the specified unit.', 'DATEDIFF(start, end, unit)', 'DATEDIFF(${1:start}, ${2:end}, "${3:day}")', ['DATEDIFF({Orders.Start}, {Orders.End}, "day")']),

  fn('IIF', 'logic', 'IF 函数的别名，根据条件返回两个值中的一个', 'Alias of IF; returns one of two values based on a condition.', 'IIF(condition, trueValue, falseValue)', 'IIF(${1:condition}, ${2:trueValue}, ${3:falseValue})', ['IIF({Orders.Amount} > 0, "Y", "N")']),
  fn('ISNULL', 'logic', '判断值是否为空或未定义', 'Checks whether a value is null or undefined.', 'ISNULL(value)', 'ISNULL(${1:value})', ['ISNULL({Customer.Name})']),
  fn('ISEMPTY', 'logic', '判断值是否为空文本、空值或未定义', 'Checks whether a value is empty, null, or undefined.', 'ISEMPTY(value)', 'ISEMPTY(${1:value})', ['ISEMPTY({Customer.Name})']),
  fn('ISNUMBER', 'logic', '判断值是否可转换为数字', 'Checks whether a value can be treated as a number.', 'ISNUMBER(value)', 'ISNUMBER(${1:value})', ['ISNUMBER({Orders.Amount})']),
  fn('ISDATE', 'logic', '判断值是否可转换为日期', 'Checks whether a value can be treated as a date.', 'ISDATE(value)', 'ISDATE(${1:value})', ['ISDATE({Orders.Date})']),
  fn('COALESCE', 'logic', '返回参数中的第一个非空值', 'Returns the first non-null value from the provided arguments.', 'COALESCE(value1, value2)', 'COALESCE(${1:value1}, ${2:value2})', ['COALESCE({Customer.Name}, "Unknown")']),

  fn('PAGE', 'report', '返回当前渲染页码', 'Returns the current rendered page number.', 'PAGE()', 'PAGE()', ['PAGE()']),
  fn('TOTALPAGES', 'report', '返回报表总页数', 'Returns the total number of rendered pages.', 'TOTALPAGES()', 'TOTALPAGES()', ['TOTALPAGES()']),
  fn('ROWINDEX', 'report', '返回当前数据行的从零开始索引', 'Returns the zero-based index of the current data row.', 'ROWINDEX()', 'ROWINDEX()', ['ROWINDEX()']),

  fn('RMBUPPER', 'money', '将金额转换为人民币中文大写', 'Converts an amount to uppercase Chinese RMB text.', 'RMBUPPER(value)', 'RMBUPPER(${1:value})', ['RMBUPPER({Orders.Amount})']),

  fn('FORMAT', 'format', '按指定格式化模式输出值', 'Formats a value with the specified format pattern.', 'FORMAT(pattern, value)', 'FORMAT("${1:N2}", ${2:value})', ['FORMAT("C", {Orders.Amount})']),
];

export function getExpressionFunctionsByCategory(category: ExpressionFunctionCategory): ExpressionFunctionMeta[] {
  return EXPRESSION_FUNCTIONS.filter(item => item.category === category);
}

export function getExpressionFunctionNames(): string[] {
  return EXPRESSION_FUNCTIONS.map(item => item.name);
}
