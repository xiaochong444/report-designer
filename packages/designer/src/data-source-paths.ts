import type { DataField, DataSource } from '@report-designer/core';

export interface ArrayPathOption {
  value: string;
  label: string;
}

export function getRootDataSource(dataSources: DataSource[]): DataSource | undefined {
  return dataSources.find(source => source.id === 'root') ?? dataSources[0];
}

export function getRootFields(dataSources: DataSource[]): DataField[] {
  const source = getRootDataSource(dataSources);
  return source?.schema?.length ? source.schema : source?.fields ?? [];
}

export function getFieldsForPath(dataSources: DataSource[], arrayPath?: string): DataField[] {
  const fields = getRootFields(dataSources);
  const normalizedPath = normalizeArrayPath(arrayPath);
  if (!normalizedPath || normalizedPath === 'root') {
    return fields;
  }
  const directSource = dataSources.find(source => source.id === normalizedPath);
  if (directSource?.fields?.length || directSource?.schema?.length) {
    const directFields = directSource.schema?.length ? directSource.schema : directSource.fields ?? [];
    if (directFields.some(field => !field.name.startsWith(`${normalizedPath}.`))) {
      return directFields;
    }
  }
  const prefix = `${normalizedPath}.`;
  return fields
    .filter(field => field.name.startsWith(prefix))
    .map(field => ({
      ...field,
      name: field.name.slice(prefix.length),
      path: field.path?.startsWith(prefix) ? field.path.slice(prefix.length) : field.path,
    }));
}

export function createArrayPathOptions(
  dataSources: DataSource[],
  rowsByPath: Record<string, unknown[]> = {},
  existingPaths: string[] = [],
): ArrayPathOption[] {
  const paths = new Set<string>();
  Object.keys(rowsByPath).forEach(path => {
    if (path && path !== 'root') {
      paths.add(path);
    }
  });
  existingPaths.forEach(path => {
    if (path && path !== 'root') {
      paths.add(path);
    }
  });

  for (const field of getRootFields(dataSources)) {
    const segments = field.name.split('.').filter(Boolean);
    for (let length = 1; length < segments.length; length += 1) {
      const candidate = segments.slice(0, length).join('.');
      if (length === 1 || Object.prototype.hasOwnProperty.call(rowsByPath, candidate)) {
        paths.add(candidate);
      }
    }
  }

  return Array.from(paths)
    .sort((left, right) => left.localeCompare(right))
    .map(path => ({ value: path, label: path }));
}

function normalizeArrayPath(path?: string): string | undefined {
  if (!path) {
    return undefined;
  }
  return path.startsWith('root.') ? path.slice(5) : path;
}
