import React, { useMemo, useState } from 'react';
import { Alert, Button, Input, Modal, Space, Switch, Tree, Typography } from 'antd';
import type { EventMap, EventScript } from '@report-designer/core';
import { useDesignerI18n } from '../../i18n';
import {
  chooseInitialEvent,
  eventNamesByTarget,
  helperSnippets,
  normalizeEvent,
  updateEventMap,
  validateDesignerScript,
  type DesignerEventName,
  type EventTargetType,
} from './event-editor-utils';

export interface EventTreeItem {
  key: string;
  title: string;
  children?: EventTreeItem[];
}

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

  React.useEffect(() => {
    if (!open) return;
    const nextActive = chooseInitialEvent(targetType, events);
    setActive(nextActive);
    setDrafts({ ...(events ?? {}) });
    setErrors([]);
  }, [events, open, targetType]);

  const activeDraft = normalizeEvent(drafts[active]);
  const eventTree = eventNamesByTarget[targetType].map(name => ({
    key: name,
    title: t(`events.${name}`),
  }));
  const sideTree = [
    { key: 'fields', title: t('events.fields'), children: dictionaryItems },
    { key: 'components', title: t('events.components'), children: componentItems },
    { key: 'helpers', title: t('events.helper'), children: helperSnippets.map(item => ({ key: item.key, title: item.title })) },
  ];

  const updateDraft = (event: EventScript) => {
    setDrafts(current => updateEventMap(current, active, event));
  };

  const validate = () => {
    const nextErrors = validateDesignerScript(activeDraft.script);
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
          <Input.TextArea
            aria-label={t('events.script')}
            value={activeDraft.script}
            rows={16}
            onChange={(event) => updateDraft({ ...activeDraft, script: event.target.value })}
          />
          {errors.length > 0 ? (
            <Alert type="error" title={errors.join('\n')} />
          ) : (
            <Alert type="success" title={t('events.validationPassed')} />
          )}
        </Space>
        <div style={{ borderLeft: '1px solid #f0f0f0', paddingLeft: 8, overflow: 'auto', maxHeight: 450 }}>
          <Input.Search placeholder={t('common.search')} size="small" style={{ marginBottom: 8 }} />
          <Tree
            treeData={sideTree}
            onSelect={(keys) => {
              const key = String(keys[0] ?? '');
              const helper = helperSnippets.find(item => item.key === key);
              if (helper) {
                appendSnippet(helper.snippet);
              } else if (key && !['fields', 'components', 'helpers'].includes(key)) {
                appendSnippet(key.includes('.') ? `{${key}}` : key);
              }
            }}
          />
        </div>
      </div>
    </Modal>
  );
};
