import type { DataFieldV2, DataSourceV2, JsonDictionaryV2, JsonFieldTypeV2 } from '../template-model/v2-types';

export function inferJsonDictionary(data: unknown): JsonDictionaryV2 {
  const dataSources: DataSourceV2[] = [];
  if (!isPlainObject(data)) {
    return { dataSources };
  }

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      visitArraySource(key, key, value, dataSources);
    }
  }

  return { dataSources };
}

function visitArraySource(
  id: string,
  path: string,
  rows: unknown[],
  dataSources: DataSourceV2[],
  parentSourceId?: string,
): void {
  const source: DataSourceV2 = {
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
    visitArraySource(`${id}.${fieldName}`, `${path}.${fieldName}`, nestedRows, dataSources, id);
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

function createDataField(source: DataSourceV2, fieldName: string, samples: unknown[]): DataFieldV2 {
  return {
    id: `${source.id}.${fieldName}`,
    name: fieldName,
    path: `${source.path}.${fieldName}`,
    type: inferFieldType(samples),
    nullable: samples.some((sample) => sample === null || sample === undefined || sample === ''),
  };
}

function inferFieldType(samples: unknown[]): JsonFieldTypeV2 {
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
