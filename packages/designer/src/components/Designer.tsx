import React, { useEffect } from 'react';
import type { ReportTemplate } from '@report-designer/core';
import { DesignerShell } from './shell/DesignerShell';
import { useDesignerStore } from '../store/designer-store';

interface DesignerProps {
  /** Optional initial template to load */
  template?: ReportTemplate;
  /** Optional data to bind to the template */
  data?: Record<string, any[]>;
  className?: string;
}

export const Designer: React.FC<DesignerProps> = ({ template, data, className }) => {
  const loadTemplate = useDesignerStore(s => s.loadTemplate);
  const setDataSources = useDesignerStore(s => s.setDataSources);

  useEffect(() => {
    if (template) {
      loadTemplate(template);
    }
  }, [template, loadTemplate]);

  useEffect(() => {
    if (data) {
      setDataSources(data);
    }
  }, [data, setDataSources]);

  return <DesignerShell className={className} />;
};

export default Designer;
