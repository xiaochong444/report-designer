import React, { useEffect, useRef } from 'react';
import type { ReportTemplate } from '@report-designer/core';
import { DesignerShell } from './shell/DesignerShell';
import { useDesignerStore } from '../store/designer-store';

interface DesignerProps {
  /** Optional initial template to load */
  template?: ReportTemplate;
  /** Optional data to bind to the template */
  data?: Record<string, any[]>;
  /** Emits the current in-designer template so hosts can preview or persist draft edits. */
  onTemplateChange?: (template: ReportTemplate) => void;
  className?: string;
}

export const Designer: React.FC<DesignerProps> = ({ template, data, onTemplateChange, className }) => {
  const loadTemplate = useDesignerStore(s => s.loadTemplate);
  const setDataSources = useDesignerStore(s => s.setDataSources);
  const currentTemplate = useDesignerStore(s => s.template);
  const loadedTemplateIdRef = useRef<string | undefined>(undefined);

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

  return <DesignerShell className={className} />;
};

export default Designer;
