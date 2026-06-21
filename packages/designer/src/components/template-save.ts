import type { ReportTemplate } from '@report-designer/core';

export type DesignerSaveHandler = (template: ReportTemplate) => void | Promise<void>;

export function saveTemplate(template: ReportTemplate, onSave?: DesignerSaveHandler) {
  if (onSave) {
    void onSave(template);
    return;
  }

  const json = JSON.stringify(template, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${template.name || 'report'}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
