import React, { useEffect, useRef } from 'react';
import type { ReportTemplate } from '@report-designer/core';
import { DesignerShell } from './shell/DesignerShell';
import { useDesignerStore, type DesignerEventNavigationTarget } from '../store/designer-store';
import { DesignerI18nProvider, type DesignerLocale } from '../i18n';
import type { ExpressionCatalogExtensions } from '../expression/expression-catalog';

interface DesignerProps {
  /** Optional initial template to load */
  template?: ReportTemplate;
  /** Optional data to bind to the template */
  data?: Record<string, any[]>;
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
  const currentTemplate = useDesignerStore(s => s.template);
  const setCurrentPage = useDesignerStore(s => s.setCurrentPage);
  const selectBand = useDesignerStore(s => s.selectBand);
  const selectComponents = useDesignerStore(s => s.selectComponents);
  const openEventEditorTarget = useDesignerStore(s => s.openEventEditorTarget);
  const loadedTemplateIdRef = useRef<string | undefined>(undefined);
  const handledNavigationKeyRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (template && loadedTemplateIdRef.current !== template.id) {
      loadedTemplateIdRef.current = template.id;
      loadTemplate(template);
    }
  }, [template, loadTemplate]);

  useEffect(() => {
    if (data) {
      setDataSources(data);
    }
  }, [data, setDataSources]);

  useEffect(() => {
    if (!onTemplateChange) return;
    if (template && currentTemplate.id !== template.id) return;
    onTemplateChange(currentTemplate);
  }, [currentTemplate, onTemplateChange, template?.id]);

  useEffect(() => {
    if (!eventNavigationTarget) return;
    const navigationKey = buildNavigationKey(eventNavigationTarget);
    if (handledNavigationKeyRef.current === navigationKey) return;
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
  }, [currentTemplate, eventNavigationTarget, openEventEditorTarget, selectBand, selectComponents, setCurrentPage]);

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
