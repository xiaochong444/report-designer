import type { Token } from './lexer';
import { TokenType } from './lexer';
import {
  ASTNodeType,
  type ASTNode,
  type LiteralNode,
  type FieldRefNode,
  type BinaryOpNode,
  type UnaryOpNode,
  type FunctionCallNode,
} from './ast';

export class ParseError extends Error {
  constructor(message: string, public token: Token) {
    super(message);
  }
}

export function parse(tokens: Token[]): ASTNode {
  const parser = new Parser(tokens);
  const node = parser.parseExpression();
  if (parser.isEOF()) {
    const t = parser.lastToken();
    throw new ParseError(`Unexpected token: ${t.value}`, t);
  }
  return node;
}

class Parser {
  private pos = 0;
  private tokens: Token[];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private current(): Token {
    return this.tokens[this.pos];
  }

  private peek(offset = 0): Token {
    return this.tokens[this.pos + offset];
  }

  isEOF(): boolean {
    return this.tokens[this.pos].type !== TokenType.EOF;
  }

  lastToken(): Token {
    return this.tokens[this.pos];
  }

  private consume(expected: TokenType): Token {
    const t = this.current();
    if (t.type !== expected) {
      throw new ParseError(
        `Expected token type ${TokenType[expected]} but got ${TokenType[t.type]} (${t.value})`,
        t,
      );
    }
    this.pos++;
    return t;
  }

  /**
   * Expression = OrExpr
   * Lowest precedence: OR
   */
  parseExpression(): ASTNode {
    return this.parseOr();
  }

  /** OR: additive ( OR additive )* */
  private parseOr(): ASTNode {
    let node = this.parseAnd();
    while (this.current().type === TokenType.OR) {
      const op = this.current().value;
      this.pos++;
      const right = this.parseAnd();
      node = this.makeBinary(op, node, right);
    }
    return node;
  }

  /** AND: comparison ( AND comparison )* */
  private parseAnd(): ASTNode {
    let node = this.parseComparison();
    while (this.current().type === TokenType.AND) {
      const op = this.current().value;
      this.pos++;
      const right = this.parseComparison();
      node = this.makeBinary(op, node, right);
    }
    return node;
  }

  /** Comparison: additive ((= | != | > | < | >= | <=) additive)* */
  private parseComparison(): ASTNode {
    let node = this.parseAdditive();
    const compTypes = [
      TokenType.EQUALS, TokenType.NOT_EQUALS,
      TokenType.GT, TokenType.LT,
      TokenType.GTE, TokenType.LTE,
    ];
    while (compTypes.includes(this.current().type)) {
      const op = this.current().value;
      this.pos++;
      const right = this.parseAdditive();
      node = this.makeBinary(op, node, right);
    }
    return node;
  }

  /** Additive: multiplicative ((+ | -) multiplicative)* */
  private parseAdditive(): ASTNode {
    let node = this.parseMultiplicative();
    while (this.current().type === TokenType.PLUS || this.current().type === TokenType.MINUS) {
      const op = this.current().value;
      this.pos++;
      const right = this.parseMultiplicative();
      node = this.makeBinary(op, node, right);
    }
    return node;
  }

  /** Multiplicative: unary ((* | / | %) unary)* */
  private parseMultiplicative(): ASTNode {
    let node = this.parseUnary();
    while ([TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO].includes(this.current().type)) {
      const op = this.current().value;
      this.pos++;
      const right = this.parseUnary();
      node = this.makeBinary(op, node, right);
    }
    return node;
  }

  /** Unary: NOT unary | MINUS unary | primary */
  private parseUnary(): ASTNode {
    if (this.current().type === TokenType.NOT) {
      const op = this.current().value;
      this.pos++;
      const operand = this.parseUnary();
      return this.makeUnary(op, operand);
    }
    if (this.current().type === TokenType.MINUS) {
      const op = this.current().value;
      this.pos++;
      const operand = this.parseUnary();
      return this.makeUnary(op, operand);
    }
    return this.parsePrimary();
  }

  /** Primary: LPAREN expression RPAREN | IDENTIFIER LPAREN args RPAREN | FIELD_REF | STRING | NUMBER | BOOLEAN */
  private parsePrimary(): ASTNode {
    const t = this.current();

    // Parenthesized expression
    if (t.type === TokenType.LPAREN) {
      this.pos++;
      const node = this.parseExpression();
      this.consume(TokenType.RPAREN);
      return node;
    }

    // Function call: IDENTIFIER LPAREN
    if (t.type === TokenType.IDENTIFIER && this.peek(1).type === TokenType.LPAREN) {
      this.pos++; // consume identifier
      this.pos++; // consume LPAREN
      const args = this.parseArgs();
      this.consume(TokenType.RPAREN);
      return this.makeFunctionCall(t.value, args);
    }

    // Field reference
    if (t.type === TokenType.FIELD_REF) {
      this.pos++;
      return this.makeFieldRef(t.value);
    }

    // String literal
    if (t.type === TokenType.STRING) {
      this.pos++;
      return this.makeStringLiteral(t.value);
    }

    // Number literal
    if (t.type === TokenType.NUMBER) {
      this.pos++;
      return this.makeNumberLiteral(t.value);
    }

    // Boolean literal
    if (t.type === TokenType.BOOLEAN) {
      this.pos++;
      return this.makeBooleanLiteral(t.value);
    }

    // Null literal
    if (t.type === TokenType.NULL) {
      this.pos++;
      return this.makeNullLiteral();
    }

    // Bare identifier — treat as a function with no args (e.g. a variable reference)
    if (t.type === TokenType.IDENTIFIER) {
      this.pos++;
      // For now, treat bare identifiers as function calls with no args.
      // Field references inside expressions resolve without requiring braces
      // are typically wrapped in {}, but bare names can resolve to variables.
      return this.makeFunctionCall(t.value, []);
    }

    throw new ParseError(`Unexpected token: ${TokenType[t.type]} (${t.value})`, t);
  }

  /** Parse comma-separated argument list inside parentheses */
  private parseArgs(): ASTNode[] {
    if (this.current().type === TokenType.RPAREN) {
      return [];
    }
    const args: ASTNode[] = [];
    args.push(this.parseExpression());
    while (this.current().type === TokenType.COMMA) {
      this.pos++;
      args.push(this.parseExpression());
    }
    return args;
  }

  // ---- Node factories ----

  private makeBinary(op: string, left: ASTNode, right: ASTNode): BinaryOpNode {
    return { type: ASTNodeType.BinaryOp, operator: op, left, right };
  }

  private makeUnary(op: string, operand: ASTNode): UnaryOpNode {
    return { type: ASTNodeType.UnaryOp, operator: op, operand };
  }

  private makeFieldRef(value: string): FieldRefNode {
    const parts = value.split('.');
    const source = parts.length > 1 ? parts.slice(0, -1).join('.') : '';
    const field = parts.length > 0 ? parts[parts.length - 1] : value;
    return { type: ASTNodeType.FieldRef, source, field };
  }

  private makeStringLiteral(value: string): LiteralNode {
    return { type: ASTNodeType.Literal, value, dataType: 'string' };
  }

  private makeNumberLiteral(value: string): LiteralNode {
    return { type: ASTNodeType.Literal, value: parseFloat(value), dataType: 'number' };
  }

  private makeBooleanLiteral(value: string): LiteralNode {
    return { type: ASTNodeType.Literal, value: value === 'true', dataType: 'boolean' };
  }

  private makeNullLiteral(): LiteralNode {
    return { type: ASTNodeType.Literal, value: null, dataType: 'null' };
  }

  private makeFunctionCall(name: string, args: ASTNode[]): FunctionCallNode {
    return { type: ASTNodeType.FunctionCall, name, args };
  }
}
