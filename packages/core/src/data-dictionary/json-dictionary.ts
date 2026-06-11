import type { DataField, DataSource, JsonDictionary, JsonFieldType, ReportTemplate } from '../template-model/types';
import { getJsonValueByPath } from './json-path';

export function inferJsonDictionary(data: unknown): JsonDictionary {
  const dataSources: DataSource[] = [];
  const normalizedData = normalizeJsonInput(data);
  if (!isPlainObject(normalizedData)) {
    return { dataSources };
  }

  visitRootSource(normalizedData, dataSources);
  return { dataSources };
}

export function mergeInferredDataSources(template: ReportTemplate, data: unknown | undefined): ReportTemplate {
  const collapsed = collapseDataSources(template.dataSources);
  if (!data) {
    return collapsed === template.dataSources ? template : { ...template, dataSources: collapsed };
  }

  const inferred = inferJsonDictionary(data).dataSources;
  if (inferred.length === 0) {
    return collapsed === template.dataSources ? template : { ...template, dataSources: collapsed };
  }

  const existingRoot = collapsed.find(source => source.id === 'root');
  const inferredRoot = cloneDataSource(inferred[0]);
  const mergedFields = mergeFields(existingRoot?.fields ?? existingRoot?.schema ?? [], inferredRoot.fields ?? []);
  inferredRoot.fields = mergedFields;
  inferredRoot.schema = mergeFields(existingRoot?.schema ?? [], mergedFields);

  return {
    ...template,
    dataSources: [inferredRoot],
  };
}

export function expandJsonDataBySources(
  data: unknown,
  dataSources: DataSource[],
): Record<string, Record<string, unknown>[]> {
  const expanded: Record<string, Record<string, unknown>[]> = {};
  const normalizedData = normalizeJsonInput(data);

  if (isPlainObject(normalizedData)) {
    expanded.root = [flattenRow(normalizedData, 'root')];
    collectArrayRows(normalizedData, '', expanded);
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

export function normalizeJsonInput(data: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(data)) {
    return { items: data };
  }
  return isPlainObject(data) ? data : undefined;
}

function visitRootSource(data: Record<string, unknown>, dataSources: DataSource[]): void {
  const source: DataSource = {
    id: 'root',
    name: 'root',
    type: 'json',
    path: 'root',
    fields: [],
  };
  dataSources.push(source);

  const fieldSamples = new Map<string, unknown[]>();
  collectFields(data, '', fieldSamples);

  source.fields = Array.from(fieldSamples.entries()).map(([fieldName, samples]) => createDataField(source, fieldName, samples));
}

function collectFields(
  value: unknown,
  prefix: string,
  fieldSamples: Map<string, unknown[]>,
): void {
  if (Array.isArray(value)) {
    if (value.length === 0 && prefix) {
      const samples = fieldSamples.get(prefix) ?? [];
      samples.push(undefined);
      fieldSamples.set(prefix, samples);
      return;
    }
    for (const child of value) {
      collectFields(child, prefix, fieldSamples);
    }
    return;
  }

  if (!isPlainObject(value)) {
    if (!prefix) {
      return;
    }
    const samples = fieldSamples.get(prefix) ?? [];
    samples.push(value);
    fieldSamples.set(prefix, samples);
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    const fieldName = prefix ? `${prefix}.${key}` : key;
    collectFields(child, fieldName, fieldSamples);
  }
}

function createDataField(source: DataSource, fieldName: string, samples: unknown[]): DataField {
  return {
    id: fieldName,
    name: fieldName,
    path: fieldName,
    type: inferFieldType(samples),
    nullable: samples.some((sample) => sample === null || sample === undefined || sample === ''),
  };
}

function getRowsByPath(data: unknown, path: string): Record<string, unknown>[] {
  const normalizedData = normalizeJsonInput(data);
  if (!normalizedData) {
    return [];
  }
  const normalizedPath = path === 'root' ? '' : path.startsWith('root.') ? path.slice(5) : path;
  const value = normalizedPath ? getJsonValueByPath(normalizedData, normalizedPath) : normalizedData;
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

function collectArrayRows(value: unknown, prefix: string, expanded: Record<string, Record<string, unknown>[]>): void {
  if (Array.isArray(value)) {
    if (prefix) {
      const rows = value.filter(isPlainObject);
      if (rows.length > 0) {
        expanded[prefix] = rows.map(row => flattenRow(row, prefix));
      }
    }
    value.forEach(child => collectArrayRows(child, prefix, expanded));
    return;
  }

  if (!isPlainObject(value)) {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = prefix ? `${prefix}.${key}` : key;
    collectArrayRows(child, childPath, expanded);
  }
}

function cloneDataSource(source: DataSource): DataSource {
  return {
    ...source,
    fields: source.fields?.map(field => ({ ...field })),
    schema: source.schema?.map(field => ({ ...field })),
  };
}

function collapseDataSources(dataSources: DataSource[]): DataSource[] {
  if (dataSources.length === 0) {
    return dataSources;
  }
  if (dataSources.length === 1 && dataSources[0].id === 'root') {
    return dataSources;
  }

  const root: DataSource = {
    id: 'root',
    name: 'root',
    type: 'json',
    path: 'root',
    fields: [],
    schema: [],
  };

  const fields: DataField[] = [];
  const schemas: DataField[] = [];
  for (const source of dataSources) {
    fields.push(...collapseFieldsForSource(source, source.fields ?? source.schema ?? []));
    schemas.push(...collapseFieldsForSource(source, source.schema ?? source.fields ?? []));
  }
  root.fields = mergeFields([], fields);
  root.schema = mergeFields([], schemas);
  return [root];
}

function collapseFieldsForSource(source: DataSource, fields: DataField[]): DataField[] {
  const sourcePath = source.id === 'root' ? '' : source.path ?? source.id;
  return fields.map(field => {
    const name = sourcePath && !field.name.startsWith(`${sourcePath}.`)
      ? `${sourcePath}.${field.name}`
      : field.name;
    return {
      ...field,
      id: name,
      name,
      path: name,
    };
  });
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
}
