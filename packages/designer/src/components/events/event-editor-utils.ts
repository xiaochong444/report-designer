import type { BandEventName, ComponentEventName, EventMap, EventScript, ReportEventName } from '@report-designer/core';
import { validateEventScript } from '@report-designer/core';
import type { EventCompletionTextItem } from './event-script-monaco';

export type EventTargetType = 'report' | 'band' | 'component';
export type DesignerEventName = ReportEventName | BandEventName | ComponentEventName;

export const eventNamesByTarget: Record<EventTargetType, DesignerEventName[]> = {
  report: ['beforePreview', 'beforePrint', 'beforeRender', 'afterRender', 'beforeData', 'afterData'],
  band: ['beforeRow', 'beforePrint', 'afterPrint', 'afterRow'],
  component: ['getValue', 'beforePrint', 'afterPrint'],
};

export function normalizeEvent(event?: EventScript): EventScript {
  return { enabled: event?.enabled ?? true, script: event?.script ?? '' };
}

export function chooseInitialEvent(targetType: EventTargetType, events?: EventMap<string>): DesignerEventName {
  const names = eventNamesByTarget[targetType];
  return names.find(name => Boolean(events?.[name]?.script)) ?? names[0];
}

export function updateEventMap<TName extends string>(
  events: EventMap<TName> | undefined,
  name: TName,
  event: EventScript,
): EventMap<TName> {
  const next: EventMap<TName> = { ...(events ?? {}), [name]: event };
  for (const key of Object.keys(next) as TName[]) {
    const item = next[key];
    if (item && !item.enabled && !item.script.trim()) {
      delete next[key];
    }
  }
  return next;
}

export function validateDesignerScript(script: string): string[] {
  return validateEventScript(script).errors;
}

export function buildEventExampleItems(
  targetType: EventTargetType,
  eventName: DesignerEventName,
  t: (key: string) => string,
): EventCompletionTextItem[] {
  const examples: EventCompletionTextItem[] = [];

  if (targetType === 'component' && eventName === 'getValue') {
    examples.push({
      label: t('events.example.setValue'),
      insertText: 'ctx.setValue?.("");',
      detail: t('events.example.setValue.detail'),
    });
  }

  if (targetType === 'component') {
    examples.push({
      label: t('events.example.hideComponent'),
      insertText: 'ctx.hide?.();',
      detail: t('events.example.hideComponent.detail'),
    });
  }

  if (targetType === 'band') {
    examples.push({
      label: t('events.example.readRow'),
      insertText: 'const row = ctx.row ?? {};\nctx.log.info(JSON.stringify(row));',
      detail: t('events.example.readRow.detail'),
    });
  }

  if (targetType === 'report') {
    examples.push({
      label: t('events.example.reportState'),
      insertText: 'ctx.state.lastEvent = ctx.target.eventName;',
      detail: t('events.example.reportState.detail'),
    });
  }

  examples.push({
    label: t('events.example.logMessage'),
    insertText: 'ctx.log.info("message");',
    detail: t('events.example.logMessage.detail'),
  });

  return examples;
}
