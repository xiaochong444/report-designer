import type { DataSource, JsonFieldType, ReportParameter } from '../template-model/types';

export interface EventEditorDataContractInput {
  dataSources: Pick<DataSource, 'id' | 'name' | 'fields' | 'schema'>[];
  parameters: Pick<ReportParameter, 'id' | 'name' | 'type'>[];
  activeDataSourceId?: string;
}

type EventEditorField = NonNullable<DataSource['fields']>[number];

const VALID_IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export function toEventEditorTypeName(dataSourceId: string): string {
  const normalizedId = dataSourceId.replace(/[^A-Za-z0-9_$]/g, '_').replace(/^[^A-Za-z_$]/, '_');
  return `EventDataSource_${normalizedId || 'DataSource'}`;
}

export function toEventEditorPropertyName(propertyName: string): string {
  if (VALID_IDENTIFIER_PATTERN.test(propertyName)) {
    return propertyName;
  }

  return JSON.stringify(propertyName);
}

export function buildEventEditorDataDts(input: EventEditorDataContractInput): string {
  const activeDataSource = input.dataSources.find((dataSource) => dataSource.id === input.activeDataSourceId);
  const activeRowType = activeDataSource ? toEventEditorTypeName(activeDataSource.id) : 'Record<string, unknown>';
  const dataSourceInterfaces = input.dataSources.map(buildDataSourceInterface).join('\n\n');
  const dataRows = input.dataSources.map((dataSource) => {
    return `  ${toEventEditorPropertyName(dataSource.id)}: ${toEventEditorTypeName(dataSource.id)}[];`;
  });
  const parameters = input.parameters.map((parameter) => {
    return `  ${toEventEditorPropertyName(parameter.id)}?: ${toTypeScriptType(parameter.type)};`;
  });

  return [
    dataSourceInterfaces,
    [
      'interface EventEditorDataRows {',
      ...dataRows,
      '  [key: string]: unknown;',
      '}',
    ].join('\n'),
    [
      'interface EventEditorParameters {',
      ...parameters,
      '  [key: string]: unknown;',
      '}',
    ].join('\n'),
    [
      'interface EventEditorVariables {',
      '  rowIndex?: number;',
      '  row?: Record<string, unknown>;',
      '  [key: string]: unknown;',
      '}',
    ].join('\n'),
    [
      'interface EventEditorTypedContext {',
      '  data: EventEditorDataRows;',
      '  parameters?: EventEditorParameters;',
      '  variables?: EventEditorVariables;',
      `  row?: ${activeRowType};`,
      '}',
    ].join('\n'),
  ]
    .filter(Boolean)
    .join('\n\n');
}

function buildDataSourceInterface(dataSource: Pick<DataSource, 'id' | 'name' | 'fields' | 'schema'>): string {
  const fields = dataSource.schema ?? dataSource.fields ?? [];
  const fieldLines =
    fields.length > 0
      ? fields.map((field) => `  ${toEventEditorPropertyName(field.name)}: ${toFieldType(field)};`)
      : ['  [key: string]: unknown;'];

  return [`interface ${toEventEditorTypeName(dataSource.id)} {`, ...fieldLines, '}'].join('\n');
}

function toFieldType(field: EventEditorField): string {
  const type = toTypeScriptType(field.type);
  if (!field.nullable || type === 'null') {
    return type;
  }

  return `${type} | null`;
}

function toTypeScriptType(type: JsonFieldType | undefined): string {
  switch (type) {
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
    case 'string':
      return 'string';
    case 'null':
      return 'null';
    default:
      return 'unknown';
  }
}
