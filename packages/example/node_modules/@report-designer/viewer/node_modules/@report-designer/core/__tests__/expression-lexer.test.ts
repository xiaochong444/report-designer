import { describe, it, expect } from 'vitest';
import { tokenize, TokenType } from '../src/expression-engine/lexer';

describe('Lexer', () => {
  it('should tokenize field reference', () => {
    const tokens = tokenize('{Employee.Name}');
    expect(tokens).toHaveLength(2); // token + EOF
    expect(tokens[0].type).toBe(TokenType.FIELD_REF);
    expect(tokens[0].value).toBe('Employee.Name');
  });

  it('should tokenize string literal', () => {
    const tokens = tokenize('"hello world"');
    expect(tokens).toHaveLength(2);
    expect(tokens[0].type).toBe(TokenType.STRING);
    expect(tokens[0].value).toBe('hello world');
  });

  it('should tokenize number', () => {
    const tokens = tokenize('123.45');
    expect(tokens).toHaveLength(2);
    expect(tokens[0].type).toBe(TokenType.NUMBER);
    expect(tokens[0].value).toBe('123.45');
  });

  it('should tokenize arithmetic operators', () => {
    const tokens = tokenize('{A.X} + 100 * {B.Y}');
    expect(tokens.map(t => t.type)).toEqual([
      TokenType.FIELD_REF, TokenType.PLUS, TokenType.NUMBER, TokenType.MULTIPLY, TokenType.FIELD_REF, TokenType.EOF
    ]);
  });

  it('should tokenize comparison operators', () => {
    const tokens = tokenize('{A.X} > 10');
    expect(tokens[1].type).toBe(TokenType.GT);
  });

  it('should tokenize function call', () => {
    const tokens = tokenize('IF({A.X} > 10, "yes", "no")');
    expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[0].value).toBe('IF');
    expect(tokens).toContainEqual(expect.objectContaining({ type: TokenType.LPAREN }));
    expect(tokens).toContainEqual(expect.objectContaining({ type: TokenType.RPAREN }));
    expect(tokens).toContainEqual(expect.objectContaining({ type: TokenType.COMMA }));
  });

  it('should tokenize boolean literals', () => {
    const tokens = tokenize('true AND false');
    expect(tokens[0].type).toBe(TokenType.BOOLEAN);
    expect(tokens[0].value).toBe('true');
    expect(tokens[1].type).toBe(TokenType.AND);
    expect(tokens[2].type).toBe(TokenType.BOOLEAN);
    expect(tokens[2].value).toBe('false');
  });

  it('should throw on unknown characters', () => {
    expect(() => tokenize('{A.X} # 10')).toThrow();
  });

  it('should throw on unclosed field reference', () => {
    expect(() => tokenize('{A.X')).toThrow('Unclosed field reference');
  });

  it('should throw on unclosed string', () => {
    expect(() => tokenize('"hello')).toThrow('Unclosed string');
  });
});
