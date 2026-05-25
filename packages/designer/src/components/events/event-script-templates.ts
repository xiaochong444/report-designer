import type { EventCompletionTextItem } from './event-script-monaco';
import type { DesignerEventName, EventTargetType } from './event-editor-utils';

export interface EventScriptTemplate extends EventCompletionTextItem {
  id: string;
}

export function buildEventScriptTemplates(
  targetType: EventTargetType,
  eventName: DesignerEventName,
  t: (key: string) => string,
): EventScriptTemplate[] {
  const templates: EventScriptTemplate[] = [];

  if (targetType === 'component' && eventName === 'getValue') {
    templates.push({
      id: 'component.getValue.setValue',
      label: t('events.template.setValue'),
      insertText: 'ctx.setValue?.("");',
      detail: t('events.template.setValue.detail'),
    });
  }

  if (targetType === 'component') {
    templates.push({
      id: 'component.hide',
      label: t('events.template.hideComponent'),
      insertText: 'ctx.hide?.();',
      detail: t('events.template.hideComponent.detail'),
    });
  }

  if (targetType === 'band') {
    templates.push({
      id: 'band.readRow',
      label: t('events.template.readRow'),
      insertText: 'const row = ctx.row ?? {};\nctx.log.info(JSON.stringify(row));',
      detail: t('events.template.readRow.detail'),
    });
  }

  if (targetType === 'report') {
    templates.push({
      id: 'report.state',
      label: t('events.template.reportState'),
      insertText: 'ctx.state.lastEvent = ctx.target.eventName;',
      detail: t('events.template.reportState.detail'),
    });
  }

  templates.push({
    id: `${targetType}.logMessage`,
    label: t('events.template.logMessage'),
    insertText: 'ctx.log.info("message");',
    detail: t('events.template.logMessage.detail'),
  });

  return templates;
}
