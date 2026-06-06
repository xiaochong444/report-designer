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

export function getJsonValueByPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((cursor, segment) => {
    if (Array.isArray(cursor)) {
      return cursor.flatMap(row => getJsonValueByPath(row, segment) ?? []);
    }
    if (isPlainObject(cursor)) {
      return cursor[segment];
    }
    return undefined;
  }, value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
}
