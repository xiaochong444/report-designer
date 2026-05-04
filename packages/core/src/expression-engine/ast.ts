export enum ASTNodeType {
  Literal,
  FieldRef,
  BinaryOp,
  UnaryOp,
  FunctionCall,
}

export interface LiteralNode {
  type: ASTNodeType.Literal;
  value: string | number | boolean | null;
  dataType: 'string' | 'number' | 'boolean' | 'null';
}

export interface FieldRefNode {
  type: ASTNodeType.FieldRef;
  source: string;
  field: string;
}

export interface BinaryOpNode {
  type: ASTNodeType.BinaryOp;
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryOpNode {
  type: ASTNodeType.UnaryOp;
  operator: string;
  operand: ASTNode;
}

export interface FunctionCallNode {
  type: ASTNodeType.FunctionCall;
  name: string;
  args: ASTNode[];
}

export type ASTNode = LiteralNode | FieldRefNode | BinaryOpNode | UnaryOpNode | FunctionCallNode;
