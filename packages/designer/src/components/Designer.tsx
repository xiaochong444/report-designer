import React, { useEffect, useMemo, useRef } from 'react';
import { expandJsonDataBySources, mergeInferredDataSources, type ReportTemplate } from '@report-designer/core';
import { DesignerShell } from './shell/DesignerShell';
import { useDesignerStore, type DesignerEventNavigationTarget } from '../store/designer-store';
import { DesignerI18nProvider, type DesignerLocale } from '../i18n';
import type { ExpressionCatalogExtensions } from '../expression/expression-catalog';

interface DesignerProps {
  /** Optional initial template to load */
  template?: ReportTemplate;
  /** Optional data to bind to the template */
  data?: unknown;
  /** Optional local subreport templates keyed by subreport template key/name */
  subreports?: Record<string, ReportTemplate>;
  /** Emits the current in-designer template so hosts can preview or persist draft edits. */
  onTemplateChange?: (template: ReportTemplate) => void;
  locale?: DesignerLocale;
  expressionExtensions?: ExpressionCatalogExtensions;
  eventNavigationTarget?: DesignerEventNavigationTarget;
  className?: string;
}

export const Designer: React.FC<DesignerProps> = ({ template, data, subreports, onTemplateChange, locale = 'zh-CN', expressionExtensions, eventNavigationTarget, className }) => {
  const loadTemplate = useDesignerStore(s => s.loadTemplate);
  const setDataSources = useDesignerStore(s => s.setDataSources);
  const currentDataSourceDefinitions = useDesignerStore(s => template?.dataSources ?? s.template.dataSources);
  const setCurrentPage = useDesignerStore(s => s.setCurrentPage);
  const selectBand = useDesignerStore(s => s.selectBand);
  const selectComponents = useDesignerStore(s => s.selectComponents);
  const openEventEditorTarget = useDesignerStore(s => s.openEventEditorTarget);
  const loadedTemplateIdRef = useRef<string | undefined>(undefined);
  const loadedDataSignatureRef = useRef<string | undefined>(undefined);
  const handledNavigationKeyRef = useRef<string | undefined>(undefined);
  const dataSignature = data == null
    ? ''
    : Array.isArray(data)
      ? `array:${data.length}`
      : typeof data === 'object'
        ? Object.keys(data as Record<string, unknown>).join('|')
        : typeof data;
  const runtimeDataSources = useMemo(
    () => mergeInferredDataSources({ dataSources: currentDataSourceDefinitions } as ReportTemplate, data).dataSources,
    [data, currentDataSourceDefinitions],
  );

  useEffect(() => {
    if (template && (loadedTemplateIdRef.current !== template.id || loadedDataSignatureRef.current !== dataSignature)) {
      loadedTemplateIdRef.current = template.id;
      loadedDataSignatureRef.current = dataSignature;
      loadTemplate({ ...template, dataSources: runtimeDataSources });
    }
  }, [data, dataSignature, runtimeDataSources, template, loadTemplate]);

  useEffect(() => {
    if (!data) return;
    setDataSources(expandJsonDataBySources(data, runtimeDataSources));
  }, [data, runtimeDataSources, setDataSources]);

  useEffect(() => {
    if (!onTemplateChange) return;
    const currentTemplate = useDesignerStore.getState().template;
    if (!template || currentTemplate.id === template.id) {
      onTemplateChange(currentTemplate);
    }
    let previousTemplate = currentTemplate;
    return useDesignerStore.subscribe((state) => {
      if (state.template === previousTemplate) return;
      previousTemplate = state.template;
      if (template && state.template.id !== template.id) return;
      onTemplateChange(state.template);
    });
  }, [onTemplateChange, template?.id]);

  useEffect(() => {
    if (!eventNavigationTarget) return;
    const navigationKey = buildNavigationKey(eventNavigationTarget);
    if (handledNavigationKeyRef.current === navigationKey) return;
    const currentTemplate = useDesignerStore.getState().template;
    if (template && currentTemplate.id !== template.id) return;

    const located = locateEventTarget(currentTemplate, eventNavigationTarget);
    if (!located) return;

    setCurrentPage(located.pageId);
    if (eventNavigationTarget.ownerType === 'component') {
      selectBand(null);
      selectComponents([eventNavigationTarget.ownerId]);
    } else if (eventNavigationTarget.ownerType === 'band') {
      selectComponents([]);
      selectBand(eventNavigationTarget.ownerId);
    } else {
      selectComponents([]);
      selectBand(null);
    }
    openEventEditorTarget(eventNavigationTarget);
    handledNavigationKeyRef.current = navigationKey;
  }, [eventNavigationTarget, openEventEditorTarget, selectBand, selectComponents, setCurrentPage, template?.id]);

  return (
    <DesignerI18nProvider locale={locale}>
      <DesignerShell className={className} subreports={subreports} expressionExtensions={expressionExtensions} />
    </DesignerI18nProvider>
  );
};

export default Designer;

function locateEventTarget(template: ReportTemplate, target: DesignerEventNavigationTarget): { pageId: string } | null {
  if (target.ownerType === 'report') {
    return template.pages[0] ? { pageId: template.pages[0].id } : null;
  }

  if (target.ownerType === 'page') {
    return template.pages.some(page => page.id === target.ownerId) ? { pageId: target.ownerId } : null;
  }

  for (const page of template.pages) {
    for (const band of page.bands) {
      if (target.ownerType === 'band' && band.id === target.ownerId) {
        return { pageId: page.id };
      }
      if (target.ownerType === 'component' && band.components.some(component => component.id === target.ownerId)) {
        return { pageId: page.id };
      }
    }
  }

  return null;
}

function buildNavigationKey(target: DesignerEventNavigationTarget): string {
  return [
    target.ownerType,
    target.ownerId,
    target.eventName,
    target.line ?? '',
    target.column ?? '',
    target.nonce ?? '',
  ].join(':');
}
