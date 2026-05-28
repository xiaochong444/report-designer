import type {
  BandEventName,
  ComponentEventName,
  EventEditorDataContractInput,
  EventMap,
  EventScript,
  PageEventName,
  PanelComponent,
  ReportComponent,
  ReportEventName,
  ReportTemplate,
} from '@report-designer/core';
import { validateEventScript } from '@report-designer/core';
import type { EventCompletionTextItem } from './event-script-monaco';
import { buildEventScriptTemplates } from './event-script-templates';

export type EventTargetType = 'report' | 'page' | 'band' | 'component';
export type DesignerEventName = ReportEventName | PageEventName | BandEventName | ComponentEventName;

export interface EventEditorDataContextScope {
  targetType: EventTargetType;
  pageId?: string;
  bandId?: string;
  componentId?: string;
}

export const eventNamesByTarget: Record<EventTargetType, DesignerEventName[]> = {
  report: ['beforePreview', 'beforePrint', 'beforeRender', 'afterRender', 'beforeData', 'afterData'],
  page: ['beforePrint', 'afterPrint'],
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

export function buildEventEditorDataContext(
  template: ReportTemplate,
  scope: EventEditorDataContextScope,
): EventEditorDataContractInput {
  let activeDataSourceId: string | undefined;

  if (scope.targetType === 'band') {
    const band = template.pages.flatMap(page => page.bands).find(item => item.id === scope.bandId);
    activeDataSourceId = band?.dataBand?.dataSourceId ?? band?.dataSource;
  }

  if (scope.targetType === 'component') {
    const band = template.pages
      .flatMap(page => page.bands)
      .find(item => containsComponent(item.components, scope.componentId));
    activeDataSourceId = band?.dataBand?.dataSourceId ?? band?.dataSource;
  }

  return {
    dataSources: template.dataSources,
    parameters: template.parameters ?? [],
    activeDataSourceId,
  };
}

function containsComponent(components: ReportComponent[], componentId?: string): boolean {
  if (!componentId) return false;
  for (const component of components) {
    if (component.id === componentId) {
      return true;
    }
    if (component.type === 'panel') {
      const panel = component as PanelComponent;
      if (containsComponent(panel.components, componentId)) {
        return true;
      }
    }
  }
  return false;
}

export function buildEventExampleItems(
  targetType: EventTargetType,
  eventName: DesignerEventName,
  t: (key: string) => string,
): EventCompletionTextItem[] {
  return buildEventScriptTemplates(targetType, eventName, t);
}
