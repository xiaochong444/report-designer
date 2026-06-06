import type { DataField, DataSource, JsonDictionary, JsonFieldType, ReportTemplate } from '../template-model/types';
import { getJsonValueByPath } from './json-path';

export function inferJsonDictionary(data: unknown): JsonDictionary {
  const dataSources: DataSource[] = [];
  if (!isPlainObject(data)) {
    return { dataSources };
  }

  if (!isDatasetMap(data)) {
    visitArraySource('root', 'root', [data], dataSources, undefined, { childIdPrefix: '' });
    return { dataSources };
  }

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      visitArraySource(key, key, value, dataSources);
    }
  }

  return { dataSources };
}

export function mergeInferredDataSources(template: ReportTemplate, data: Record<string, unknown> | undefined): ReportTemplate {
  if (!data) {
    return template;
  }

  const inferred = inferJsonDictionary(data).dataSources;
  if (inferred.length === 0) {
    return template;
  }

  let changed = false;
  const byId = new Map(template.dataSources.map(source => [source.id, cloneDataSource(source)]));

  for (const source of inferred) {
    const existing = byId.get(source.id);
    if (!existing) {
      byId.set(source.id, cloneDataSource(source));
      changed = true;
      continue;
    }

    const mergedFields = mergeFields(existing.fields ?? existing.schema ?? [], source.fields ?? []);
    if (mergedFields.length !== (existing.fields ?? existing.schema ?? []).length) {
      existing.fields = mergedFields;
      existing.schema = mergeFields(existing.schema ?? [], source.fields ?? []);
      changed = true;
    }
    existing.path ??= source.path;
    existing.parentSourceId ??= source.parentSourceId;
    existing.parentPath ??= source.parentPath;
  }

  if (!changed) {
    return template;
  }

  return {
    ...template,
    dataSources: Array.from(byId.values()),
  };
}

export function expandJsonDataBySources(
  data: Record<string, unknown[]> | Record<string, unknown>,
  dataSources: DataSource[],
): Record<string, Record<string, unknown>[]> {
  const expanded: Record<string, Record<string, unknown>[]> = {};

  if (!isDatasetMap(data)) {
    expanded.root = [flattenRow(data, 'root')];
  } else {
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        expanded[key] = value.filter(isPlainObject).map(row => flattenRow(row, key));
      }
    }
  }

  for (const source of dataSources) {
    if (expanded[source.id]) {
      continue;
    }
    const rows = getRowsByPath(data, source.path ?? source.id);
    if (rows.length > 0) {
      expanded[source.id] = rows.map(row => flattenRow(row, source.id));
    }
  }

  return expanded;
}

function visitArraySource(
  id: string,
  path: string,
  rows: unknown[],
  dataSources: DataSource[],
  parentSourceId?: string,
  options: { childIdPrefix?: string } = {},
): void {
  const source: DataSource = {
    id,
    name: id.split('.').at(-1) ?? id,
    type: 'json',
    path,
    fields: [],
    parentSourceId,
    parentPath: parentSourceId ? path : undefined,
  };
  dataSources.push(source);

  const fieldSamples = new Map<string, unknown[]>();
  const nestedArrays = new Map<string, unknown[]>();

  for (const row of rows) {
    if (!isPlainObject(row)) {
      continue;
    }

    collectFieldsAndArrays(row, '', fieldSamples, nestedArrays);
  }

  source.fields = Array.from(fieldSamples.entries()).map(([fieldName, samples]) => createDataField(source, fieldName, samples));

  for (const [fieldName, nestedRows] of nestedArrays.entries()) {
    const childId = options.childIdPrefix === '' ? fieldName : `${id}.${fieldName}`;
    visitArraySource(childId, `${path}.${fieldName}`, nestedRows, dataSources, id);
  }
}

function collectFieldsAndArrays(
  value: Record<string, unknown>,
  prefix: string,
  fieldSamples: Map<string, unknown[]>,
  nestedArrays: Map<string, unknown[]>,
): void {
  for (const [key, child] of Object.entries(value)) {
    const fieldName = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(child)) {
      const rows = nestedArrays.get(fieldName) ?? [];
      rows.push(...child);
      nestedArrays.set(fieldName, rows);
      continue;
    }

    if (isPlainObject(child)) {
      collectFieldsAndArrays(child, fieldName, fieldSamples, nestedArrays);
      continue;
    }

    const samples = fieldSamples.get(fieldName) ?? [];
    samples.push(child);
    fieldSamples.set(fieldName, samples);
  }
}

function createDataField(source: DataSource, fieldName: string, samples: unknown[]): DataField {
  return {
    id: `${source.id}.${fieldName}`,
    name: fieldName,
    path: `${source.path}.${fieldName}`,
    type: inferFieldType(samples),
    nullable: samples.some((sample) => sample === null || sample === undefined || sample === ''),
  };
}

function getRowsByPath(data: Record<string, unknown>, path: string): Record<string, unknown>[] {
  const normalizedPath = path === 'root' ? '' : path.startsWith('root.') ? path.slice(5) : path;
  const value = normalizedPath ? getJsonValueByPath(data, normalizedPath) : data;
  return Array.isArray(value) ? value.filter(isPlainObject) : [];
}

function flattenRow(row: Record<string, unknown>, sourceId: string): Record<string, unknown> {
  const flattened: Record<string, unknown> = { ...row };

  const visit = (value: Record<string, unknown>, prefix: string) => {
    for (const [key, child] of Object.entries(value)) {
      const fieldName = prefix ? `${prefix}.${key}` : key;
      if (Array.isArray(child)) {
        continue;
      }
      if (isPlainObject(child)) {
        visit(child, fieldName);
        continue;
      }
      flattened[fieldName] = child;
      if (sourceId !== 'root') {
        flattened[`${sourceId}.${fieldName}`] = child;
      }
    }
  };

  visit(row, '');
  return flattened;
}

function cloneDataSource(source: DataSource): DataSource {
  return {
    ...source,
    fields: source.fields?.map(field => ({ ...field })),
    schema: source.schema?.map(field => ({ ...field })),
  };
}

function mergeFields(current: DataField[], inferred: DataField[]): DataField[] {
  const byName = new Map(current.map(field => [field.name, { ...field }]));
  for (const field of inferred) {
    if (!byName.has(field.name)) {
      byName.set(field.name, { ...field });
    }
  }
  return Array.from(byName.values());
}

function inferFieldType(samples: unknown[]): JsonFieldType {
  const meaningful = samples.filter((sample) => sample !== null && sample !== undefined && sample !== '');
  if (meaningful.length === 0) {
    return 'null';
  }

  if (meaningful.every((sample) => typeof sample === 'boolean')) {
    return 'boolean';
  }

  if (meaningful.every((sample) => typeof sample === 'number' && Number.isFinite(sample))) {
    return 'number';
  }

  if (meaningful.every(isDateLikeValue)) {
    return 'date';
  }

  return 'string';
}

function isDateLikeValue(value: unknown): boolean {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (typeof value !== 'string') {
    return false;
  }

  return /[-/:T]/.test(value) && !Number.isNaN(Date.parse(value));
}

function isDatasetMap(value: Record<string, unknown>): boolean {
  const entries = Object.entries(value);
  return entries.length > 0 && entries.every(([, child]) => Array.isArray(child));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
}
