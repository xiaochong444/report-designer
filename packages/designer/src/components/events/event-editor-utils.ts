import type { BandEventName, ComponentEventName, EventMap, EventScript, ReportEventName } from '@report-designer/core';
import { validateEventScript } from '@report-designer/core';

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

export const helperSnippets = [
  { key: 'ctx.log', title: 'ctx.log(message)', snippet: 'ctx.log.info("message");' },
  { key: 'ctx.hide', title: 'ctx.hide()', snippet: 'ctx.hide();' },
  { key: 'ctx.cancel', title: 'ctx.cancel()', snippet: 'ctx.cancel();' },
  { key: 'ctx.setValue', title: 'ctx.setValue(value)', snippet: 'ctx.setValue("");' },
  { key: 'ctx.bindText', title: 'ctx.bindText(name, expression)', snippet: 'ctx.bindText("Text1", "{Data.Field}");' },
  { key: 'ctx.createText', title: 'ctx.createText(options)', snippet: 'ctx.createText({ name: "DynamicText", x: 0, y: 0, width: 30, height: 8, text: "New" });' },
];
