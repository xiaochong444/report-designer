import { describe, it, expect } from 'vitest';
import { parse } from '../src/expression-engine/parser';
import { tokenize } from '../src/expression-engine/lexer';
import { ASTNodeType } from '../src/expression-engine/ast';

describe('Parser', () => {
  const p = (expr: string) => parse(tokenize(expr));

  it('should parse a field reference', () => {
    const ast = p('{Employee.Name}');
    expect(ast.type).toBe(ASTNodeType.FieldRef);
    const fr = ast as any;
    expect(fr.source).toBe('Employee');
    expect(fr.field).toBe('Name');
  });

  it('should parse a simple addition', () => {
    const ast = p('{A.X} + 10');
    expect(ast.type).toBe(ASTNodeType.BinaryOp);
    const bin = ast as any;
    expect(bin.operator).toBe('+');
    expect(bin.left.type).toBe(ASTNodeType.FieldRef);
    expect(bin.right.type).toBe(ASTNodeType.Literal);
  });

  it('should respect operator precedence: * before +', () => {
    const ast = p('{A} + {B} * {C}');
    expect(ast.type).toBe(ASTNodeType.BinaryOp);
    const bin = ast as any;
    expect(bin.operator).toBe('+');
    expect(bin.right.type).toBe(ASTNodeType.BinaryOp);
    expect((bin.right as any).operator).toBe('*');
  });

  it('should parse comparison operators', () => {
    const ast = p('{A} > 10');
    expect(ast.type).toBe(ASTNodeType.BinaryOp);
    expect((ast as any).operator).toBe('>');
  });

  it('should parse chained comparisons as binary tree', () => {
    const ast = p('{A} > 10 AND {B} < 20');
    expect(ast.type).toBe(ASTNodeType.BinaryOp);
    expect((ast as any).operator).toBe('AND');
  });

  it('should parse function calls with arguments', () => {
    const ast = p('IF({A} > 10, "yes", "no")');
    expect(ast.type).toBe(ASTNodeType.FunctionCall);
    const fn = ast as any;
    expect(fn.name).toBe('IF');
    expect(fn.args).toHaveLength(3);
  });

  it('should parse nested function calls', () => {
    const ast = p('SUM({A}, MAX({B}, {C}))');
    expect(ast.type).toBe(ASTNodeType.FunctionCall);
    const fn = ast as any;
    expect(fn.name).toBe('SUM');
    expect(fn.args).toHaveLength(2);
    expect(fn.args[1].type).toBe(ASTNodeType.FunctionCall);
    expect((fn.args[1] as any).name).toBe('MAX');
  });

  it('should parse NOT unary operator', () => {
    const ast = p('NOT {A}');
    expect(ast.type).toBe(ASTNodeType.UnaryOp);
    expect((ast as any).operator).toBe('NOT');
  });

  it('should parse parenthesized expressions', () => {
    const ast = p('({A} + {B}) * {C}');
    expect(ast.type).toBe(ASTNodeType.BinaryOp);
    expect((ast as any).operator).toBe('*');
    expect((ast as any).left.type).toBe(ASTNodeType.BinaryOp);
    expect(((ast as any).left as any).operator).toBe('+');
  });

  it('should parse boolean literals', () => {
    const ast = p('true AND false');
    expect(ast.type).toBe(ASTNodeType.BinaryOp);
    expect((ast as any).operator).toBe('AND');
    expect((ast as any).left.type).toBe(ASTNodeType.Literal);
    expect((ast as any).left.value).toBe(true);
    expect((ast as any).right.value).toBe(false);
  });

  it('should parse string concatenation', () => {
    const ast = p('"{FirstName}" + " " + "{LastName}"');
    expect(ast.type).toBe(ASTNodeType.BinaryOp);
    expect((ast as any).operator).toBe('+');
  });

  it('should parse unary minus', () => {
    const ast = p('-{A}');
    expect(ast.type).toBe(ASTNodeType.UnaryOp);
    expect((ast as any).operator).toBe('-');
  });
});
