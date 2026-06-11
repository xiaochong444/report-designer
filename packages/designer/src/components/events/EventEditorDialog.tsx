import React, { useMemo, useState } from 'react';
import { Alert, Button, Input, Modal, Switch, Tree } from 'antd';
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
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
  title: React.ReactNode;
  label: string;
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
  const [expandedSideTreeKeys, setExpandedSideTreeKeys] = useState<React.Key[]>([]);
  const [fullscreen, setFullscreen] = useState(false);

  React.useEffect(() => {
    if (!open) return;
    const nextActive = chooseDialogInitialEvent(targetType, events, initialEventName);
    setActive(nextActive);
    setDrafts({ ...(events ?? {}) });
    setErrors([]);
    setEditorDiagnostics(EMPTY_DIAGNOSTICS);
    setSearch('');
    setExpandedSideTreeKeys([]);
    setFullscreen(false);
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
    title: (
      <div className="rd-event-editor-tree-node">
        <span className="rd-expression-tree-glyph rd-expression-tree-glyph-expression" aria-hidden />
        <span>{t(`events.${name}`)}</span>
      </div>
    ),
  }));
  const fieldTreeItems = useMemo(
    () => buildFieldSideTree(flattenSingleDataSourceFieldItems(dictionaryItems)),
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
    label: item.label,
    title: makeSideTreeTitle(item.label, 'function'),
    insertText: item.insertText ?? item.label,
    searchText: [item.label, item.detail, item.insertText].filter(Boolean).join(' '),
  }));
  const exampleTreeItems: SideTreeItem[] = exampleItems.map((item, index) => ({
    key: `example:${index}`,
    label: item.label,
    title: makeSideTreeTitle(item.label, 'format'),
    insertText: item.insertText ?? item.label,
    searchText: [item.label, item.detail, item.insertText].filter(Boolean).join(' '),
  }));
  const sideTree: SideTreeItem[] = [
    makeSideTreeFolder('root:fields', t('events.fields'), fieldTreeItems),
    makeSideTreeFolder('root:components', t('events.components'), componentTreeItems),
    makeSideTreeFolder('root:context-helpers', t('events.contextHelpers'), helperTreeItems),
    makeSideTreeFolder('root:examples', t('events.scriptTemplates'), exampleTreeItems),
  ];
  const filteredSideTree = useMemo(() => filterSideTree(sideTree, search), [search, sideTree]);
  const visibleExpandedSideTreeKeys = useMemo(
    () => (search.trim() ? collectTreeKeys(filteredSideTree) : expandedSideTreeKeys),
    [expandedSideTreeKeys, filteredSideTree, search],
  );
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

  const updateSideTreeExpandedKeys = (
    keys: React.Key[],
    info: { node: { key: React.Key }; expanded: boolean },
  ) => {
    setExpandedSideTreeKeys(current => {
      if (info.expanded) {
        return [...new Set([...current, info.node.key])];
      }
      const collapsedKey = info.node.key;
      const collapsedPrefix = `${collapsedKey}.`;
      const nextKeys = keys.filter(key => {
        const value = String(key);
        return value !== String(collapsedKey) && !value.startsWith(collapsedPrefix);
      });
      return nextKeys;
    });
  };

  return (
    <Modal
      open={open}
      title={(
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingRight: 40 }}>
          <span>{dialogTitle}</span>
          <Button
            aria-label={fullscreen ? t('events.exitFullscreen') : t('events.fullscreen')}
            data-testid="event-editor-fullscreen-toggle"
            icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            size="small"
            type="text"
            onClick={() => setFullscreen(value => !value)}
          />
        </div>
      )}
      width={fullscreen ? '100vw' : 1040}
      zIndex={9999}
      wrapClassName={fullscreen ? 'rd-event-editor-modal-fullscreen' : undefined}
      style={fullscreen ? { top: 0, height: '100vh', paddingBottom: 0 } : undefined}
      onCancel={onCancel}
      footer={[
        <Button key="validate" onClick={validate}>{t('events.validate')}</Button>,
        <Button key="cancel" onClick={onCancel}>{t('events.cancel')}</Button>,
        <Button key="apply" type="primary" onClick={apply}>{t('events.apply')}</Button>,
      ]}
    >
      <div className={`rd-event-editor ${fullscreen ? 'rd-event-editor-fullscreen' : ''}`}>
        <aside className="rd-event-editor-rail">
          <Tree
            className="rd-expression-tree"
            selectedKeys={[active]}
            treeData={eventTree}
            blockNode
            onSelect={(keys) => {
              const next = String(keys[0] ?? active) as DesignerEventName;
              setActive(next);
              clearEditorFeedback();
            }}
          />
        </aside>
        <section className="rd-event-editor-main">
          <div className="rd-event-editor-toolbar">
            <Switch
              aria-label={t('events.enabled')}
              checked={activeDraft.enabled}
              checkedChildren={t('events.enabled')}
              unCheckedChildren={t('events.off')}
              style={{ alignSelf: 'flex-start' }}
              onChange={(enabled) => updateDraft({ ...activeDraft, enabled })}
            />
          </div>
          <div className="rd-event-editor-monaco-host">
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
              height="100%"
              onChange={updateScript}
              onDiagnostics={setEditorDiagnostics}
            />
          </div>
          <div className="rd-event-editor-footer">
          {errors.length > 0 ? (
            <Alert
              type="error"
              title={(
                <div data-testid="event-editor-diagnostics" style={diagnosticTextStyle}>
                  {errors.join('\n')}
                </div>
              )}
            />
          ) : editorDiagnostics.warnings.length > 0 ? (
            <Alert
              type="warning"
              title={t('events.typeWarnings')}
              description={(
                <div data-testid="event-editor-diagnostics" style={diagnosticTextStyle}>
                  {editorDiagnostics.warnings.join('\n')}
                </div>
              )}
            />
          ) : (
            <Alert type="success" title={t('events.validationPassed')} />
          )}
          </div>
        </section>
        <aside className="rd-event-editor-browser">
          <Input.Search
            allowClear
            placeholder={t('common.search')}
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="rd-event-editor-browser-tree">
            <Tree
              className="rd-expression-tree"
              autoExpandParent={Boolean(search.trim())}
              expandedKeys={visibleExpandedSideTreeKeys}
              treeData={filteredSideTree}
              blockNode
              virtual={false}
              onExpand={updateSideTreeExpandedKeys}
              onSelect={(keys) => {
                const key = String(keys[0] ?? '');
                const insertText = insertTextByKey.get(key);
                if (insertText) {
                  appendSnippet(insertText);
                }
              }}
            />
          </div>
        </aside>
      </div>
    </Modal>
  );
};

const diagnosticTextStyle: React.CSSProperties = {
  margin: 0,
  maxHeight: 120,
  overflowY: 'auto',
  whiteSpace: 'pre-wrap',
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
      label: item.title,
      title: makeSideTreeTitle(item.title, namespace === 'component' ? 'resource' : children?.length ? 'folder' : 'field-string'),
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
    const selfMatches = [item.key, item.label, item.insertText, item.searchText]
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

type SideGlyphKind = 'folder' | 'field-string' | 'function' | 'format' | 'resource';

function makeSideTreeTitle(label: string, kind: SideGlyphKind): React.ReactNode {
  return (
    <div className="rd-event-editor-tree-node">
      <span className={`rd-expression-tree-glyph rd-expression-tree-glyph-${kind}`} aria-hidden />
      <span>{label}</span>
    </div>
  );
}

function makeSideTreeFolder(key: string, label: string, children: SideTreeItem[]): SideTreeItem {
  return {
    key,
    label,
    title: makeSideTreeTitle(label, 'folder'),
    searchText: label,
    children,
  };
}

function buildFieldSideTree(items: EventTreeItem[]): SideTreeItem[] {
  const roots: SideTreeItem[] = [];

  const addPath = (fieldKey: string, label: string) => {
    const segments = fieldKey.split('.').filter(Boolean);
    if (!segments.length) return;
    let siblings = roots;
    let currentPath = '';

    segments.forEach((segment, index) => {
      currentPath = currentPath ? `${currentPath}.${segment}` : segment;
      const isLeaf = index === segments.length - 1;
      const nodeKey = isLeaf ? `field:${fieldKey}` : `field-folder:${currentPath}`;
      let node = siblings.find(candidate => candidate.key === nodeKey);

      if (!node) {
        const nodeLabel = isLeaf ? basename(label || fieldKey) : segment;
        node = {
          key: nodeKey,
          label: nodeLabel,
          title: makeSideTreeTitle(nodeLabel, isLeaf ? 'field-string' : 'folder'),
          insertText: isLeaf ? `{${fieldKey}}` : undefined,
          searchText: [fieldKey, label, nodeLabel].filter(Boolean).join(' '),
          children: isLeaf ? undefined : [],
        };
        siblings.push(node);
      }

      if (!isLeaf) {
        node.children ??= [];
        siblings = node.children;
      }
    });
  };

  const collect = (item: EventTreeItem) => {
    if (item.children?.length) {
      item.children.forEach(collect);
      return;
    }
    if (item.insertable === false) {
      return;
    }
    addPath(item.key, item.title);
  };

  items.forEach(collect);
  return roots;
}

function basename(value: string): string {
  return value.split('.').filter(Boolean).at(-1) ?? value;
}

function flattenSingleDataSourceFieldItems(items: EventTreeItem[]): EventTreeItem[] {
  const source = items[0];
  if (items.length !== 1 || !source?.children?.length) {
    return items;
  }

  return source.children.map(item => stripSourceFieldPrefix(item, source.key));
}

function stripSourceFieldPrefix(item: EventTreeItem, sourceKey: string): EventTreeItem {
  const prefix = `${sourceKey}.`;
  const key = item.key.startsWith(prefix) ? item.key.slice(prefix.length) : item.key;

  return {
    ...item,
    key,
    children: item.children?.map(child => stripSourceFieldPrefix(child, sourceKey)),
  };
}
