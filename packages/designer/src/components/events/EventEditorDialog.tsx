import React, { useMemo, useState } from 'react';
import { Alert, Button, Input, Modal, Space, Switch, Tree, Typography } from 'antd';
import type { EventMap, EventScript } from '@report-designer/core';
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
import { getDefaultHelperCompletionItems } from './event-script-monaco';

export interface EventTreeItem {
  key: string;
  title: string;
  children?: EventTreeItem[];
}

interface SideTreeItem extends EventTreeItem {
  insertText?: string;
}

const EMPTY_DIAGNOSTICS: EventScriptEditorDiagnostics = { blocking: [], warnings: [] };

interface EventEditorDialogProps {
  open: boolean;
  targetType: EventTargetType;
  events?: EventMap<string>;
  dictionaryItems?: EventTreeItem[];
  componentItems?: EventTreeItem[];
  onCancel: () => void;
  onSave: (events: EventMap<string>) => void;
}

export const EventEditorDialog: React.FC<EventEditorDialogProps> = ({
  componentItems = [],
  dictionaryItems = [],
  events,
  onCancel,
  onSave,
  open,
  targetType,
}) => {
  const { t } = useDesignerI18n();
  const initialEvent = useMemo(() => chooseInitialEvent(targetType, events), [events, targetType]);
  const [active, setActive] = useState<DesignerEventName>(initialEvent);
  const [drafts, setDrafts] = useState<EventMap<string>>(() => ({ ...(events ?? {}) }));
  const [errors, setErrors] = useState<string[]>([]);
  const [editorDiagnostics, setEditorDiagnostics] = useState<EventScriptEditorDiagnostics>(EMPTY_DIAGNOSTICS);

  React.useEffect(() => {
    if (!open) return;
    const nextActive = chooseInitialEvent(targetType, events);
    setActive(nextActive);
    setDrafts({ ...(events ?? {}) });
    setErrors([]);
    setEditorDiagnostics(EMPTY_DIAGNOSTICS);
  }, [events, open, targetType]);

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
  const helperTreeItems: SideTreeItem[] = helperItems.map(item => ({
    key: `helper:${item.label}`,
    title: item.detail ? `${item.label} - ${item.detail}` : item.label,
    insertText: item.insertText ?? item.label,
  }));
  const exampleTreeItems: SideTreeItem[] = exampleItems.map((item, index) => ({
    key: `example:${index}`,
    title: item.label,
    insertText: item.insertText ?? item.label,
  }));
  const sideTree: SideTreeItem[] = [
    { key: 'fields', title: t('events.fields'), children: dictionaryItems },
    { key: 'components', title: t('events.components'), children: componentItems },
    { key: 'context-helpers', title: t('events.contextHelpers'), children: helperTreeItems },
    { key: 'examples', title: t('events.examples'), children: exampleTreeItems },
  ];
  const insertItems = [...helperTreeItems, ...exampleTreeItems];

  const updateDraft = (event: EventScript) => {
    setDrafts(current => updateEventMap(current, active, event));
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
    updateDraft({
      ...activeDraft,
      script: activeDraft.script ? `${activeDraft.script}\n${snippet}` : snippet,
    });
  };

  return (
    <Modal
      open={open}
      title={t('events.title')}
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
              setErrors([]);
              setEditorDiagnostics(EMPTY_DIAGNOSTICS);
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
            dictionaryItems={dictionaryItems}
            componentItems={componentItems}
            exampleItems={exampleItems}
            loadingText={t('events.editorLoading')}
            onChange={(script) => updateDraft({ ...activeDraft, script })}
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
          <Input.Search placeholder={t('common.search')} size="small" style={{ marginBottom: 8 }} />
          <Tree
            defaultExpandAll
            treeData={sideTree}
            onSelect={(keys) => {
              const key = String(keys[0] ?? '');
              const insertItem = insertItems.find(item => item.key === key);
              if (insertItem?.insertText) {
                appendSnippet(insertItem.insertText);
              } else if (key && !['fields', 'components', 'context-helpers', 'examples'].includes(key)) {
                appendSnippet(key.includes('.') ? `{${key}}` : key);
              }
            }}
          />
        </div>
      </div>
    </Modal>
  );
};
