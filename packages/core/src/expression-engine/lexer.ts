export enum TokenType {
  FIELD_REF,
  STRING,
  NUMBER,
  BOOLEAN,
  NULL,
  IDENTIFIER,
  PLUS,
  MINUS,
  MULTIPLY,
  DIVIDE,
  MODULO,
  EQUALS,
  NOT_EQUALS,
  GT,
  LT,
  GTE,
  LTE,
  AND,
  OR,
  NOT,
  LPAREN,
  RPAREN,
  COMMA,
  EOF,
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

const KEYWORDS: Record<string, TokenType> = {
  'AND': TokenType.AND,
  'OR': TokenType.OR,
  'NOT': TokenType.NOT,
  'TRUE': TokenType.BOOLEAN,
  'FALSE': TokenType.BOOLEAN,
  'NULL': TokenType.NULL,
};

const OPERATORS: Record<string, TokenType> = {
  '+': TokenType.PLUS,
  '-': TokenType.MINUS,
  '*': TokenType.MULTIPLY,
  '/': TokenType.DIVIDE,
  '%': TokenType.MODULO,
  '(': TokenType.LPAREN,
  ')': TokenType.RPAREN,
  ',': TokenType.COMMA,
};

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < input.length) {
    // 跳过空白
    if (/\s/.test(input[pos])) {
      pos++;
      continue;
    }

    // 字段引用 {DataSource.Field}
    if (input[pos] === '{') {
      const start = pos;
      pos++;
      const end = input.indexOf('}', pos);
      if (end === -1) {
        throw new Error(`Unclosed field reference at position ${start}`);
      }
      const fieldPath = input.slice(pos, end).trim();
      tokens.push({ type: TokenType.FIELD_REF, value: fieldPath, position: start });
      pos = end + 1;
      continue;
    }

    // 字符串 "..."
    if (input[pos] === '"') {
      const start = pos;
      pos++;
      let value = '';
      while (pos < input.length && input[pos] !== '"') {
        if (input[pos] === '\\' && pos + 1 < input.length) {
          pos++;
          value += input[pos];
        } else {
          value += input[pos];
        }
        pos++;
      }
      if (pos >= input.length) {
        throw new Error(`Unclosed string at position ${start}`);
      }
      tokens.push({ type: TokenType.STRING, value, position: start });
      pos++;
      continue;
    }

    // 数字
    if (/[0-9]/.test(input[pos]) || (input[pos] === '.' && pos + 1 < input.length && /[0-9]/.test(input[pos + 1]))) {
      const start = pos;
      let numStr = '';
      while (pos < input.length && /[0-9.]/.test(input[pos])) {
        numStr += input[pos];
        pos++;
      }
      tokens.push({ type: TokenType.NUMBER, value: numStr, position: start });
      continue;
    }

    // 双字符运算符
    if (pos + 1 < input.length) {
      const twoChar = input.slice(pos, pos + 2);
      if (twoChar === '!=') {
        tokens.push({ type: TokenType.NOT_EQUALS, value: '!=', position: pos });
        pos += 2;
        continue;
      }
      if (twoChar === '>=') {
        tokens.push({ type: TokenType.GTE, value: '>=', position: pos });
        pos += 2;
        continue;
      }
      if (twoChar === '<=') {
        tokens.push({ type: TokenType.LTE, value: '<=', position: pos });
        pos += 2;
        continue;
      }
    }

    // 单字符运算符
    if (input[pos] === '=') {
      tokens.push({ type: TokenType.EQUALS, value: '=', position: pos });
      pos++;
      continue;
    }
    if (input[pos] === '>') {
      tokens.push({ type: TokenType.GT, value: '>', position: pos });
      pos++;
      continue;
    }
    if (input[pos] === '<') {
      tokens.push({ type: TokenType.LT, value: '<', position: pos });
      pos++;
      continue;
    }
    if (OPERATORS[input[pos]]) {
      tokens.push({ type: OPERATORS[input[pos]], value: input[pos], position: pos });
      pos++;
      continue;
    }

    // 标识符 / 关键字
    if (/[a-zA-Z_一-鿿]/.test(input[pos])) {
      const start = pos;
      let ident = '';
      while (pos < input.length && /[a-zA-Z0-9_一-鿿]/.test(input[pos])) {
        ident += input[pos];
        pos++;
      }
      const upper = ident.toUpperCase();
      if (KEYWORDS[upper] !== undefined) {
        const kwType = KEYWORDS[upper];
        if (kwType === TokenType.BOOLEAN) {
          tokens.push({ type: TokenType.BOOLEAN, value: upper.toLowerCase(), position: start });
        } else {
          tokens.push({ type: kwType, value: upper, position: start });
        }
      } else {
        tokens.push({ type: TokenType.IDENTIFIER, value: upper, position: start });
      }
      continue;
    }

    throw new Error(`Unexpected character '${input[pos]}' at position ${pos}`);
  }

  tokens.push({ type: TokenType.EOF, value: '', position: pos });
  return tokens;
}
