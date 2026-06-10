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
  name?: string;
  type?: string;
  insertable?: boolean;
  children?: EventCompletionTreeItem[];
}

export interface EventCompletionTextItem {
  label: string;
  insertText?: string;
  detail?: string;
}

export interface EventCompletionComponentItem {
  name: string;
  type: string;
  label?: string;
  detail?: string;
}

export interface EventCompletionInput {
  helperItems?: EventCompletionTextItem[];
  dataContext?: EventEditorDataContractInput;
  dictionaryItems?: EventCompletionTreeItem[];
  componentItems?: EventCompletionTreeItem[];
  textItems?: EventCompletionComponentItem[];
  imageItems?: EventCompletionComponentItem[];
  tableItems?: EventCompletionComponentItem[];
  barcodeItems?: EventCompletionComponentItem[];
  qrcodeItems?: EventCompletionComponentItem[];
  checkboxItems?: EventCompletionComponentItem[];
  richtextItems?: EventCompletionComponentItem[];
  chartItems?: EventCompletionComponentItem[];
  lineItems?: EventCompletionComponentItem[];
  shapeItems?: EventCompletionComponentItem[];
  pageNumberItems?: EventCompletionComponentItem[];
  dateTimeItems?: EventCompletionComponentItem[];
  panelItems?: EventCompletionComponentItem[];
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
  sortText?: string;
}

const COMPONENT_HELPER_BY_TYPE: Record<string, string | undefined> = {
  text: 'text',
  image: 'image',
  table: 'table',
  barcode: 'barcode',
  qrcode: 'qrcode',
  checkbox: 'checkbox',
  richtext: 'richtext',
  chart: 'chart',
  line: 'line',
  shape: 'shape',
  pagenumber: 'pageNumber',
  datetime: 'dateTime',
  panel: 'panel',
};

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
    ...mapComponentItems(input, constants),
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

function mapComponentItems(
  input: EventCompletionInput,
  constants: Required<MonacoCompletionConstants>,
): EventCompletionItem[] {
  const components = normalizeComponentCompletionItems(input);
  const result: EventCompletionItem[] = [];

  for (const component of components) {
    const quotedName = JSON.stringify(component.name);
    const hasComponentType = Boolean(component.type?.trim());
    const type = normalizeComponentType(component.type);
    const detail = component.detail ?? type;
    const helper = COMPONENT_HELPER_BY_TYPE[type];
    const sortPrefix = `component:${type}:${component.name}`;

    result.push({
      label: component.label ?? component.name,
      detail,
      kind: constants.CompletionItemKind.Variable,
      insertText: `ctx.getComponent?.(${quotedName})`,
      sortText: `${sortPrefix}:0-raw`,
    });
    if (hasComponentType) {
      result.push({
        label: `ctx.component(${quotedName})`,
        detail,
        kind: constants.CompletionItemKind.Function,
        insertText: `ctx.component?.(${quotedName})`,
        sortText: `${sortPrefix}:1-base`,
      });
    }

    if (hasComponentType && helper) {
      result.push({
        label: `ctx.${helper}(${quotedName})`,
        detail,
        kind: constants.CompletionItemKind.Function,
        insertText: `ctx.${helper}?.(${quotedName})`,
        sortText: `${sortPrefix}:2-typed`,
      });
    }
  }

  return result;
}

function normalizeComponentCompletionItems(input: EventCompletionInput): EventCompletionComponentItem[] {
  const byName = new Map<string, EventCompletionComponentItem>();
  const add = (item: EventCompletionComponentItem | undefined) => {
    const name = item?.name?.trim();
    if (!item || !name) {
      return;
    }
    byName.set(name, {
      ...item,
      name,
      type: item.type,
    });
  };

  for (const item of flattenComponentTreeItems(input.componentItems)) {
    add(item);
  }
  for (const item of getExplicitComponentItems(input)) {
    add(item);
  }

  return [...byName.values()].sort((left, right) => {
    const typeOrder = normalizeComponentType(left.type).localeCompare(normalizeComponentType(right.type));
    return typeOrder || left.name.localeCompare(right.name);
  });
}

function flattenComponentTreeItems(items: EventCompletionTreeItem[] | undefined): EventCompletionComponentItem[] {
  const result: EventCompletionComponentItem[] = [];

  for (const item of items ?? []) {
    const name = getCompletionItemName(item);
    if (name && item.insertable !== false) {
      result.push({
        name,
        type: item.type ?? '',
        label: item.title || name,
        detail: item.type ?? item.key,
      });
    }
    result.push(...flattenComponentTreeItems(item.children));
  }

  return result;
}

function getExplicitComponentItems(input: EventCompletionInput): EventCompletionComponentItem[] {
  return [
    ...(input.textItems ?? []),
    ...(input.imageItems ?? []),
    ...(input.tableItems ?? []),
    ...(input.barcodeItems ?? []),
    ...(input.qrcodeItems ?? []),
    ...(input.checkboxItems ?? []),
    ...(input.richtextItems ?? []),
    ...(input.chartItems ?? []),
    ...(input.lineItems ?? []),
    ...(input.shapeItems ?? []),
    ...(input.pageNumberItems ?? []),
    ...(input.dateTimeItems ?? []),
    ...(input.panelItems ?? []),
  ];
}

function normalizeComponentType(type: string | undefined): string {
  return type?.trim().toLocaleLowerCase() || 'component';
}

function getCompletionItemName(item: EventCompletionTreeItem): string | undefined {
  return item.name?.trim() || undefined;
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
