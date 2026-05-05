export interface ParsedJsonFieldExpression {
  sourceId: string;
  fieldName: string;
  path: string;
}

export function formatJsonFieldExpression(sourceId: string, fieldName: string): string {
  return `{${sourceId}.${fieldName}}`;
}

export function parseJsonFieldExpression(expression: string): ParsedJsonFieldExpression | null {
  const trimmed = expression.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    return null;
  }

  const path = trimmed.slice(1, -1).trim();
  const lastDot = path.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === path.length - 1) {
    return null;
  }

  return {
    sourceId: path.slice(0, lastDot),
    fieldName: path.slice(lastDot + 1),
    path,
  };
}
