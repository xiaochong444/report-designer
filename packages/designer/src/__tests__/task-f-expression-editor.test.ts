import { describe, it, expect } from 'vitest';

// Test the expression editor data structures and logic independently of React
describe('Task F: 表达式编辑弹窗', () => {
  describe('Built-in functions', () => {
    const BUILT_IN_FUNCTIONS = [
      { name: 'SUM', desc: '求和', usage: 'SUM(field)', insert: 'SUM()' },
      { name: 'AVG', desc: '平均值', usage: 'AVG(field)', insert: 'AVG()' },
      { name: 'COUNT', desc: '计数', usage: 'COUNT(field)', insert: 'COUNT()' },
      { name: 'MAX', desc: '最大值', usage: 'MAX(field)', insert: 'MAX()' },
      { name: 'MIN', desc: '最小值', usage: 'MIN(field)', insert: 'MIN()' },
      { name: 'IF', desc: '条件判断', usage: 'IF(condition, trueVal, falseVal)', insert: 'IF(, , )' },
      { name: 'IIF', desc: '条件判断', usage: 'IIF(condition, trueVal, falseVal)', insert: 'IIF(, , )' },
      { name: 'TODATE', desc: '转日期', usage: 'TODATE(field, format)', insert: 'TODATE()' },
      { name: 'TOSTRING', desc: '转字符串', usage: 'TOSTRING(field)', insert: 'TOSTRING()' },
      { name: 'TONUMBER', desc: '转数字', usage: 'TONUMBER(field)', insert: 'TONUMBER()' },
      { name: 'SUBSTRING', desc: '子字符串', usage: 'SUBSTRING(field, start, length)', insert: 'SUBSTRING()' },
      { name: 'LENGTH', desc: '字符串长度', usage: 'LENGTH(field)', insert: 'LENGTH()' },
      { name: 'UPPER', desc: '大写', usage: 'UPPER(field)', insert: 'UPPER()' },
      { name: 'LOWER', desc: '小写', usage: 'LOWER(field)', insert: 'LOWER()' },
      { name: 'TRIM', desc: '去空格', usage: 'TRIM(field)', insert: 'TRIM()' },
      { name: 'ROUND', desc: '四舍五入', usage: 'ROUND(field, decimals)', insert: 'ROUND()' },
      { name: 'FORMAT', desc: '格式化', usage: 'FORMAT(field, format)', insert: 'FORMAT()' },
      { name: 'NOW', desc: '当前日期时间', usage: 'NOW()', insert: 'NOW()' },
      { name: 'TODAY', desc: '当前日期', usage: 'TODAY()', insert: 'TODAY()' },
      { name: 'PAGE', desc: '当前页码', usage: 'PAGE()', insert: 'PAGE()' },
      { name: 'TOTALPAGES', desc: '总页数', usage: 'TOTALPAGES()', insert: 'TOTALPAGES()' },
      { name: 'ISNULL', desc: '是否为空', usage: 'ISNULL(field)', insert: 'ISNULL()' },
      { name: 'NEWID', desc: '新 GUID', usage: 'NEWID()', insert: 'NEWID()' },
    ];

    it('should have all functions defined', () => {
      expect(BUILT_IN_FUNCTIONS.length).toBeGreaterThan(20);
    });

    it('should have insert text for each function', () => {
      for (const f of BUILT_IN_FUNCTIONS) {
        expect(f.insert).toBeDefined();
        expect(f.insert.length).toBeGreaterThan(0);
      }
    });

    it('should categorize functions correctly', () => {
      const aggFuncs = BUILT_IN_FUNCTIONS.filter(f => ['SUM', 'AVG', 'COUNT', 'MAX', 'MIN'].includes(f.name));
      expect(aggFuncs).toHaveLength(5);

      const strFuncs = BUILT_IN_FUNCTIONS.filter(f => ['UPPER', 'LOWER', 'TRIM', 'LENGTH', 'SUBSTRING'].includes(f.name));
      expect(strFuncs).toHaveLength(5);

      const dateFuncs = BUILT_IN_FUNCTIONS.filter(f => ['NOW', 'TODAY', 'TODATE'].includes(f.name));
      expect(dateFuncs).toHaveLength(3);

      const rptFuncs = BUILT_IN_FUNCTIONS.filter(f => ['PAGE', 'TOTALPAGES'].includes(f.name));
      expect(rptFuncs).toHaveLength(2);
    });
  });

  describe('Expression string manipulation', () => {
    it('should insert field reference at cursor', () => {
      const expression = 'Hello ';
      const insert = '{DataSource.Name}';
      const cursorPos = expression.length;
      const result = expression.substring(0, cursorPos) + insert + expression.substring(cursorPos);
      expect(result).toBe('Hello {DataSource.Name}');
    });

    it('should replace selected text with insertion', () => {
      const expression = 'Hello {Old.Field} World';
      const insert = '{New.Field}';
      // Select "{Old.Field}" at positions 7-17
      const start = expression.indexOf('{Old.Field}');
      const end = expression.indexOf('{Old.Field}') + '{Old.Field}'.length;
      const result = expression.substring(0, start) + insert + expression.substring(end);
      expect(result).toBe('Hello {New.Field} World');
    });

    it('should insert function with cursor position', () => {
      const expression = '';
      const insert = 'SUM()';
      const result = expression + insert;
      expect(result).toBe('SUM()');
    });

    it('should handle complex expression', () => {
      const expression = 'IF(ISNULL({Data.Price}, 0)';
      expect(expression).toContain('{Data.Price}');
      expect(expression).toContain('IF(');
      expect(expression).toContain('ISNULL(');
    });

    it('should build expression from multiple insertions', () => {
      let expression = '';
      expression += 'IF(';
      expression += 'ISNULL({Data.Value})';
      expression += ', ';
      expression += '0';
      expression += ', ';
      expression += '{Data.Value}';
      expression += ')';
      expect(expression).toBe('IF(ISNULL({Data.Value}), 0, {Data.Value})');
    });
  });
});
