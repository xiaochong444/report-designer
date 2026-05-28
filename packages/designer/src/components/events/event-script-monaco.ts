import {
  EVENT_SCRIPT_DTS,
  buildEventEditorDataDts,
  eventEditorHelpers,
  getEventEditorContextType,
  type EventEditorDataContractInput,
  type EventEditorTargetType,
} from '@report-designer/core';

export interface EventCompletionTreeItem {
  key: string;
  title: string;
  insertable?: boolean;
  children?: EventCompletionTreeItem[];
}

export interface EventCompletionTextItem {
  label: string;
  insertText?: string;
  detail?: string;
}

export interface EventCompletionInput {
  helperItems?: EventCompletionTextItem[];
  dataContext?: EventEditorDataContractInput;
  dictionaryItems?: EventCompletionTreeItem[];
  componentItems?: EventCompletionTreeItem[];
  exampleItems?: EventCompletionTextItem[];
}

export interface MonacoCompletionConstants {
  CompletionItemKind?: {
    Function: number;
    Field: number;
    Variable: number;
    Snippet: number;
  };
  CompletionItemInsertTextRule?: {
    InsertAsSnippet: number;
  };
  languages?: MonacoCompletionConstants;
}

export interface MonacoDiagnostic {
  severity: number;
  startLineNumber: number;
  message: string;
}

export interface EventCompletionItem {
  label: string;
  kind: number;
  insertText: string;
  detail?: string;
  insertTextRules?: number;
}

export const getEventScriptModelPath = (targetType: EventEditorTargetType, eventName: string): string =>
  `inmemory://event-scripts/${targetType}/${eventName}.js`;

export function buildEventEditorExtraLib(
  targetType: EventEditorTargetType,
  eventName: string,
  dataContext?: EventEditorDataContractInput,
): string {
  const contextType = getEventEditorContextType(targetType, eventName);
  const ctxType = dataContext ? `${contextType} & EventEditorTypedContext` : contextType;
  const ctxDeclaration = `declare const ctx: ${ctxType};`;
  const ctxDeclarationPattern = /declare\s+const\s+ctx\s*:\s*[^;]+;/;
  const eventScriptDts = dataContext
    ? `${EVENT_SCRIPT_DTS.trimEnd()}\n\n${buildEventEditorDataDts(dataContext)}`
    : EVENT_SCRIPT_DTS;

  if (ctxDeclarationPattern.test(eventScriptDts)) {
    return eventScriptDts.replace(ctxDeclarationPattern, ctxDeclaration);
  }

  return `${eventScriptDts.trimEnd()}\n\n${ctxDeclaration}\n`;
}

export function buildEventScriptCompletions(
  input: EventCompletionInput,
  monaco: MonacoCompletionConstants,
): EventCompletionItem[] {
  const constants = getCompletionConstants(monaco);

  return [
    ...mapTextItems(input.helperItems, constants.CompletionItemKind.Function, {
      insertTextRules: constants.CompletionItemInsertTextRule.InsertAsSnippet,
    }),
    ...mapDataContextItems(input.dataContext, constants),
    ...flattenTreeItems(input.dictionaryItems).map(item => ({
      label: item.title,
      detail: item.key,
      kind: constants.CompletionItemKind.Field,
      insertText: `{${item.key}}`,
    })),
    ...flattenTreeItems(input.componentItems).map(item => ({
      label: item.title,
      detail: item.key,
      kind: constants.CompletionItemKind.Variable,
      insertText: item.key,
    })),
    ...mapTextItems(input.exampleItems, constants.CompletionItemKind.Snippet, {
      insertTextRules: constants.CompletionItemInsertTextRule.InsertAsSnippet,
    }),
  ];
}

export function splitDiagnostics(markers: MonacoDiagnostic[], lineTemplate = 'Line {line}'): { blocking: string[]; warnings: string[] } {
  const blocking: string[] = [];
  const warnings: string[] = [];

  for (const marker of markers) {
    const lineLabel = lineTemplate.replace('{line}', String(marker.startLineNumber));
    const message = `${lineLabel}: ${marker.message}`;
    if (marker.severity >= 8) {
      blocking.push(message);
    } else {
      warnings.push(message);
    }
  }

  return { blocking, warnings };
}

export function getDefaultHelperCompletionItems(t: (key: string) => string): EventCompletionTextItem[] {
  return eventEditorHelpers.map(helper => ({
    label: helper.id,
    insertText: helper.snippet,
    detail: t(helper.descriptionKey),
  }));
}

function getCompletionConstants(monaco: MonacoCompletionConstants): Required<MonacoCompletionConstants> {
  const source = monaco.languages ?? monaco;
  const kind = source.CompletionItemKind ?? monaco.CompletionItemKind;
  const insertTextRule = source.CompletionItemInsertTextRule ?? monaco.CompletionItemInsertTextRule;

  if (
    typeof kind?.Function !== 'number' ||
    typeof kind.Field !== 'number' ||
    typeof kind.Variable !== 'number' ||
    typeof kind.Snippet !== 'number' ||
    typeof insertTextRule?.InsertAsSnippet !== 'number'
  ) {
    throw new Error('Monaco completion constants are not available.');
  }

  return {
    CompletionItemKind: kind,
    CompletionItemInsertTextRule: insertTextRule,
    languages: source,
  };
}

function mapDataContextItems(
  dataContext: EventEditorDataContractInput | undefined,
  constants: Required<MonacoCompletionConstants>,
): EventCompletionItem[] {
  if (!dataContext) {
    return [];
  }

  const activeDataSource = dataContext.dataSources.find(source => source.id === dataContext.activeDataSourceId);
  const activeFields = activeDataSource?.schema ?? activeDataSource?.fields ?? [];
  const fieldItems = activeFields.map(field => {
    const fieldAccess = toPropertyAccess(field.name);
    const optionalFieldAccess = toOptionalPropertyAccess(field.name);
    return {
      label: `ctx.row${fieldAccess}`,
      detail: activeDataSource?.name || activeDataSource?.id,
      kind: constants.CompletionItemKind.Field,
      insertText: `ctx.row${optionalFieldAccess}`,
    };
  });
  const dataSourceItems = dataContext.dataSources.map(source => {
    const sourceAccess = toPropertyAccess(source.id);
    return {
      label: `ctx.data${sourceAccess}`,
      detail: source.name || source.id,
      kind: constants.CompletionItemKind.Variable,
      insertText: `ctx.data${sourceAccess}`,
    };
  });
  const parameterItems = dataContext.parameters.map(parameter => {
    const parameterName = parameter.name || parameter.id;
    const parameterAccess = toPropertyAccess(parameterName);
    const optionalParameterAccess = toOptionalPropertyAccess(parameterName);
    return {
      label: `ctx.parameters${parameterAccess}`,
      detail: parameter.id,
      kind: constants.CompletionItemKind.Variable,
      insertText: `ctx.parameters${optionalParameterAccess}`,
    };
  });

  return [...fieldItems, ...dataSourceItems, ...parameterItems];
}

function toPropertyAccess(propertyName: string): string {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(propertyName)) {
    return `.${propertyName}`;
  }

  return `[${JSON.stringify(propertyName)}]`;
}

function toOptionalPropertyAccess(propertyName: string): string {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(propertyName)) {
    return `?.${propertyName}`;
  }

  return `?.[${JSON.stringify(propertyName)}]`;
}

function mapTextItems(
  items: EventCompletionTextItem[] | undefined,
  kind: number,
  options: Pick<EventCompletionItem, 'insertTextRules'> = {},
): EventCompletionItem[] {
  return (items ?? []).map(item => ({
    label: item.label,
    kind,
    insertText: item.insertText ?? item.label,
    detail: item.detail,
    ...options,
  }));
}

function flattenTreeItems(items: EventCompletionTreeItem[] | undefined): EventCompletionTreeItem[] {
  const result: EventCompletionTreeItem[] = [];

  for (const item of items ?? []) {
    if (item.children?.length) {
      result.push(...flattenTreeItems(item.children));
    } else if (item.insertable !== false) {
      result.push(item);
    }
  }

  return result;
}
