import React, { useMemo, useState } from 'react';
import { Alert, Button, Input, Modal, Space, Switch, Tree, Typography } from 'antd';
import type { EventEditorDataContractInput, EventMap, EventScript } from '@report-designer/core';
import { useDesignerI18n, type DesignerMessageKey } from '../../i18n';
import { EventScriptEditor, type EventScriptEditorDiagnostics } from './EventScriptEditor';
import {
  buildEventExampleItems,
  chooseInitialEvent,
  eventNamesByTarget,
  normalizeEvent,
  updateEventMap,
  validateDesignerScript,
  type DesignerEventName,
  type EventTargetType,
} from './event-editor-utils';
import { getDefaultHelperCompletionItems, type EventCompletionComponentItem } from './event-script-monaco';

export interface EventTreeItem {
  key: string;
  title: string;
  name?: string;
  type?: string;
  insertable?: boolean;
  children?: EventTreeItem[];
}

interface SideTreeItem {
  key: string;
  title: string;
  insertText?: string;
  searchText?: string;
  children?: SideTreeItem[];
}

const EMPTY_DIAGNOSTICS: EventScriptEditorDiagnostics = { blocking: [], warnings: [] };

interface EventEditorDialogProps {
  open: boolean;
  targetType: EventTargetType;
  events?: EventMap<string>;
  initialEventName?: string;
  initialCursor?: { line?: number; column?: number };
  dataContext?: EventEditorDataContractInput;
  dictionaryItems?: EventTreeItem[];
  componentItems?: EventTreeItem[];
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
  onCancel: () => void;
  onSave: (events: EventMap<string>) => void;
}

export const EventEditorDialog: React.FC<EventEditorDialogProps> = ({
  componentItems = [],
  dataContext,
  dictionaryItems = [],
  events,
  textItems,
  imageItems,
  tableItems,
  barcodeItems,
  qrcodeItems,
  checkboxItems,
  richtextItems,
  chartItems,
  lineItems,
  shapeItems,
  pageNumberItems,
  dateTimeItems,
  panelItems,
  initialCursor,
  initialEventName,
  onCancel,
  onSave,
  open,
  targetType,
}) => {
  const { t } = useDesignerI18n();
  const dialogTitle = targetType === 'page'
    ? t('events.pageTitle')
    : targetType === 'report'
      ? t('events.reportTitle')
      : t('events.title');
  const initialEvent = useMemo(
    () => chooseDialogInitialEvent(targetType, events, initialEventName),
    [events, initialEventName, targetType],
  );
  const [active, setActive] = useState<DesignerEventName>(initialEvent);
  const [drafts, setDrafts] = useState<EventMap<string>>(() => ({ ...(events ?? {}) }));
  const [errors, setErrors] = useState<string[]>([]);
  const [editorDiagnostics, setEditorDiagnostics] = useState<EventScriptEditorDiagnostics>(EMPTY_DIAGNOSTICS);
  const [search, setSearch] = useState('');

  React.useEffect(() => {
    if (!open) return;
    const nextActive = chooseDialogInitialEvent(targetType, events, initialEventName);
    setActive(nextActive);
    setDrafts({ ...(events ?? {}) });
    setErrors([]);
    setEditorDiagnostics(EMPTY_DIAGNOSTICS);
  }, [events, initialEventName, open, targetType]);

  const activeDraft = normalizeEvent(drafts[active]);
  const translateMessageKey = (key: string) => t(key as DesignerMessageKey);
  const helperItems = useMemo(
    () => getDefaultHelperCompletionItems(translateMessageKey),
    [t],
  );
  const exampleItems = useMemo(
    () => buildEventExampleItems(targetType, active, translateMessageKey),
    [active, t, targetType],
  );
  const eventTree = eventNamesByTarget[targetType].map(name => ({
    key: name,
    title: t(`events.${name}`),
  }));
  const fieldTreeItems = useMemo(
    () => namespaceTreeItems(dictionaryItems, 'field', rawKey => `{${rawKey}}`),
    [dictionaryItems],
  );
  const componentTreeItems = useMemo(
    () => namespaceTreeItems(componentItems, 'component', (_rawKey, item) => (
      getEventTreeItemName(item) ? `ctx.getComponent?.(${JSON.stringify(getEventTreeItemName(item))})` : undefined
    )),
    [componentItems],
  );
  const helperTreeItems: SideTreeItem[] = helperItems.map(item => ({
    key: `helper:${item.label}`,
    title: item.detail ? `${item.label} - ${item.detail}` : item.label,
    insertText: item.insertText ?? item.label,
    searchText: [item.label, item.detail, item.insertText].filter(Boolean).join(' '),
  }));
  const exampleTreeItems: SideTreeItem[] = exampleItems.map((item, index) => ({
    key: `example:${index}`,
    title: item.label,
    insertText: item.insertText ?? item.label,
    searchText: [item.label, item.detail, item.insertText].filter(Boolean).join(' '),
  }));
  const sideTree: SideTreeItem[] = [
    { key: 'root:fields', title: t('events.fields'), children: fieldTreeItems },
    { key: 'root:components', title: t('events.components'), children: componentTreeItems },
    { key: 'root:context-helpers', title: t('events.contextHelpers'), children: helperTreeItems },
    { key: 'root:examples', title: t('events.scriptTemplates'), children: exampleTreeItems },
  ];
  const filteredSideTree = useMemo(() => filterSideTree(sideTree, search), [search, sideTree]);
  const expandedSideTreeKeys = useMemo(() => collectTreeKeys(filteredSideTree), [filteredSideTree]);
  const insertTextByKey = useMemo(() => buildInsertTextMap(sideTree), [sideTree]);

  const updateDraft = (event: EventScript) => {
    setDrafts(current => updateEventMap(current, active, event));
  };

  const clearEditorFeedback = () => {
    setErrors([]);
    setEditorDiagnostics(EMPTY_DIAGNOSTICS);
  };

  const validate = () => {
    const nextErrors = [
      ...validateDesignerScript(activeDraft.script),
      ...editorDiagnostics.blocking,
    ];
    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const apply = () => {
    if (!validate()) return;
    onSave(updateEventMap(drafts, active, activeDraft));
  };

  const appendSnippet = (snippet: string) => {
    clearEditorFeedback();
    updateDraft({
      ...activeDraft,
      script: activeDraft.script ? `${activeDraft.script}\n${snippet}` : snippet,
    });
  };

  const updateScript = (script: string) => {
    clearEditorFeedback();
    updateDraft({ ...activeDraft, script });
  };

  return (
    <Modal
      open={open}
      title={dialogTitle}
      width={900}
      onCancel={onCancel}
      footer={[
        <Button key="validate" onClick={validate}>{t('events.validate')}</Button>,
        <Button key="cancel" onClick={onCancel}>{t('events.cancel')}</Button>,
        <Button key="apply" type="primary" onClick={apply}>{t('events.apply')}</Button>,
      ]}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '180px minmax(320px, 1fr) 230px', gap: 12, minHeight: 450 }}>
        <div style={{ borderRight: '1px solid #f0f0f0', paddingRight: 8 }}>
          <Typography.Text strong>{t('events.title')}</Typography.Text>
          <Tree
            selectedKeys={[active]}
            treeData={eventTree}
            onSelect={(keys) => {
              const next = String(keys[0] ?? active) as DesignerEventName;
              setActive(next);
              clearEditorFeedback();
            }}
          />
        </div>
        <Space orientation="vertical" size={8} style={{ minWidth: 0, width: '100%' }}>
          <Switch
            aria-label={t('events.enabled')}
            checked={activeDraft.enabled}
            checkedChildren={t('events.enabled')}
            unCheckedChildren={t('events.off')}
            onChange={(enabled) => updateDraft({ ...activeDraft, enabled })}
          />
          <EventScriptEditor
            ariaLabel={t('events.script')}
            value={activeDraft.script}
            targetType={targetType}
            eventName={active}
            helperItems={helperItems}
            dataContext={dataContext}
            dictionaryItems={dictionaryItems}
            componentItems={componentItems}
            textItems={textItems}
            imageItems={imageItems}
            tableItems={tableItems}
            barcodeItems={barcodeItems}
            qrcodeItems={qrcodeItems}
            checkboxItems={checkboxItems}
            richtextItems={richtextItems}
            chartItems={chartItems}
            lineItems={lineItems}
            shapeItems={shapeItems}
            pageNumberItems={pageNumberItems}
            dateTimeItems={dateTimeItems}
            panelItems={panelItems}
            exampleItems={exampleItems}
            initialCursor={initialCursor}
            loadingText={t('events.editorLoading')}
            diagnosticLineLabel={t('events.diagnosticLine')}
            onChange={updateScript}
            onDiagnostics={setEditorDiagnostics}
          />
          {errors.length > 0 ? (
            <Alert type="error" title={errors.join('\n')} />
          ) : editorDiagnostics.warnings.length > 0 ? (
            <Alert
              type="warning"
              title={t('events.typeWarnings')}
              description={editorDiagnostics.warnings.join('\n')}
            />
          ) : (
            <Alert type="success" title={t('events.validationPassed')} />
          )}
        </Space>
        <div style={{ borderLeft: '1px solid #f0f0f0', paddingLeft: 8, overflow: 'auto', maxHeight: 450 }}>
          <Input.Search
            placeholder={t('common.search')}
            size="small"
            value={search}
            style={{ marginBottom: 8 }}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Tree
            autoExpandParent
            expandedKeys={expandedSideTreeKeys}
            treeData={filteredSideTree}
            onSelect={(keys) => {
              const key = String(keys[0] ?? '');
              const insertText = insertTextByKey.get(key);
              if (insertText) {
                appendSnippet(insertText);
              }
            }}
          />
        </div>
      </div>
    </Modal>
  );
};

function namespaceTreeItems(
  items: EventTreeItem[],
  namespace: 'field' | 'component',
  buildInsertText: (rawKey: string, item: EventTreeItem) => string | undefined,
): SideTreeItem[] {
  return items.flatMap(item => {
    const children = item.children?.length
      ? namespaceTreeItems(item.children, namespace, buildInsertText)
      : undefined;
    const insertText = item.insertable === false ? undefined : buildInsertText(item.key, item);

    if (!children?.length && !insertText && namespace === 'component') {
      return [];
    }

    return [{
      key: `${namespace}:${item.key}`,
      title: item.title,
      insertText,
      searchText: [item.key, item.title, insertText].filter(Boolean).join(' '),
      children,
    }];
  });
}

function chooseDialogInitialEvent(
  targetType: EventTargetType,
  events: EventMap<string> | undefined,
  initialEventName: string | undefined,
): DesignerEventName {
  if (initialEventName && eventNamesByTarget[targetType].includes(initialEventName as DesignerEventName)) {
    return initialEventName as DesignerEventName;
  }

  return chooseInitialEvent(targetType, events);
}

function filterSideTree(items: SideTreeItem[], query: string): SideTreeItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return items;
  }

  return items.flatMap(item => {
    const selfMatches = [item.key, item.title, item.insertText, item.searchText]
      .filter(Boolean)
      .some(value => String(value).toLocaleLowerCase().includes(normalizedQuery));

    if (selfMatches) {
      return [item];
    }

    const children = filterSideTree(item.children ?? [], query);
    return children.length ? [{ ...item, children }] : [];
  });
}

function collectTreeKeys(items: SideTreeItem[]): string[] {
  return items.flatMap(item => [item.key, ...collectTreeKeys(item.children ?? [])]);
}

function buildInsertTextMap(items: SideTreeItem[]): Map<string, string> {
  const result = new Map<string, string>();

  for (const item of items) {
    if (item.insertText) {
      result.set(item.key, item.insertText);
    }
    for (const [key, insertText] of buildInsertTextMap(item.children ?? [])) {
      result.set(key, insertText);
    }
  }

  return result;
}

function getEventTreeItemName(item: EventTreeItem): string | undefined {
  return item.name?.trim() || undefined;
}
