import React from 'react';
import type { ReportTemplate } from '@report-designer/core';
import {
  RedoOutlined,
  SaveOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { DesignerCanvasFrame } from '../canvas/DesignerCanvasFrame';
import { ConditionalFormatManager } from '../ConditionalFormatManager';
import { TextStyleLibraryDialog } from '../TextStyleLibraryDialog';
import { DesignerLeftPanel } from '../panels/DesignerLeftPanel';
import { DesignerPropertyPanel } from '../panels/DesignerPropertyPanel';
import { DesignerRibbon } from '../ribbon/DesignerRibbon';
import { useDesignerStore } from '../../store/designer-store';
import { useDesignerI18n } from '../../i18n';
import type { ExpressionCatalogExtensions } from '../../expression/expression-catalog';
import { DesignerStatusBar } from './DesignerStatusBar';
import '../../styles/designer-shell.css';

interface DesignerShellProps {
  className?: string;
  subreports?: Record<string, ReportTemplate>;
  expressionExtensions?: ExpressionCatalogExtensions;
}

export const DesignerShell: React.FC<DesignerShellProps> = ({ className, subreports, expressionExtensions }) => {
  const template = useDesignerStore(s => s.template);
  const undo = useDesignerStore(s => s.undo);
  const redo = useDesignerStore(s => s.redo);
  const canUndo = useDesignerStore(s => s.canUndo);
  const canRedo = useDesignerStore(s => s.canRedo);
  const textStyleLibraryOpen = useDesignerStore(s => s.textStyleLibraryOpen);
  const closeTextStyleLibrary = useDesignerStore(s => s.closeTextStyleLibrary);
  const conditionalFormatLibraryOpen = useDesignerStore(s => s.conditionalFormatLibraryOpen);
  const closeConditionalFormatLibrary = useDesignerStore(s => s.closeConditionalFormatLibrary);

  return (
    <div className={className ? `rd-designer-shell ${className}` : 'rd-designer-shell'}>
      <QuickAccess template={template} undo={undo} redo={redo} canUndo={canUndo()} canRedo={canRedo()} />
      <DesignerRibbon />
      <div className="rd-designer-body">
        <DesignerLeftPanel />
        <DesignerCanvasFrame subreports={subreports} />
        <DesignerPropertyPanel expressionExtensions={expressionExtensions} />
      </div>
      <DesignerStatusBar />
      <TextStyleLibraryDialog open={textStyleLibraryOpen} onClose={closeTextStyleLibrary} />
      <ConditionalFormatManager open={conditionalFormatLibraryOpen} onClose={closeConditionalFormatLibrary} />
    </div>
  );
};

interface QuickAccessProps {
  template: ReportTemplate;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const QuickAccess: React.FC<QuickAccessProps> = ({ template, undo, redo, canUndo, canRedo }) => {
  const { t } = useDesignerI18n();
  const saveTemplate = () => {
    const json = JSON.stringify(useDesignerStore.getState().template, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name || 'report'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="rd-quick-access" data-testid="designer-quick-access">
      <div className="rd-quick-access-buttons">
        <Tooltip title={t('shell.save')}>
          <Button size="small" type="text" icon={<SaveOutlined />} onClick={saveTemplate} />
        </Tooltip>
        <span className="rd-quick-access-separator" />
        <Tooltip title={t('shell.undo')}>
          <Button size="small" type="text" icon={<UndoOutlined />} disabled={!canUndo} onClick={undo} />
        </Tooltip>
        <Tooltip title={t('shell.redo')}>
          <Button size="small" type="text" icon={<RedoOutlined />} disabled={!canRedo} onClick={redo} />
        </Tooltip>
      </div>
      <div className="rd-quick-access-title">{template.name || t('shell.untitledReport')}</div>
      <div className="rd-quick-access-meta">{t('shell.designerName')}</div>
    </header>
  );
};
