import React from 'react';
import type { ReportTemplate } from '@report-designer/core';
import {
  FileAddOutlined,
  FolderOpenOutlined,
  RedoOutlined,
  SaveOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { DesignerCanvasFrame } from '../canvas/DesignerCanvasFrame';
import { TextStyleLibraryDialog } from '../TextStyleLibraryDialog';
import { DesignerLeftPanel } from '../panels/DesignerLeftPanel';
import { DesignerPropertyPanel } from '../panels/DesignerPropertyPanel';
import { DesignerRibbon } from '../ribbon/DesignerRibbon';
import { useDesignerStore } from '../../store/designer-store';
import { DesignerStatusBar } from './DesignerStatusBar';
import '../../styles/designer-shell.css';

interface DesignerShellProps {
  className?: string;
}

export const DesignerShell: React.FC<DesignerShellProps> = ({ className }) => {
  const template = useDesignerStore(s => s.template);
  const undo = useDesignerStore(s => s.undo);
  const redo = useDesignerStore(s => s.redo);
  const canUndo = useDesignerStore(s => s.canUndo);
  const canRedo = useDesignerStore(s => s.canRedo);
  const textStyleLibraryOpen = useDesignerStore(s => s.textStyleLibraryOpen);
  const closeTextStyleLibrary = useDesignerStore(s => s.closeTextStyleLibrary);

  return (
    <div className={className ? `rd-designer-shell ${className}` : 'rd-designer-shell'}>
      <QuickAccess template={template} undo={undo} redo={redo} canUndo={canUndo()} canRedo={canRedo()} />
      <DesignerRibbon />
      <div className="rd-designer-body">
        <DesignerLeftPanel />
        <DesignerCanvasFrame />
        <DesignerPropertyPanel />
      </div>
      <DesignerStatusBar />
      <TextStyleLibraryDialog open={textStyleLibraryOpen} onClose={closeTextStyleLibrary} />
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

const QuickAccess: React.FC<QuickAccessProps> = ({ template, undo, redo, canUndo, canRedo }) => (
  <header className="rd-quick-access" data-testid="designer-quick-access">
    <div className="rd-quick-access-buttons">
      <Tooltip title="New">
        <Button size="small" type="text" icon={<FileAddOutlined />} />
      </Tooltip>
      <Tooltip title="Open">
        <Button size="small" type="text" icon={<FolderOpenOutlined />} />
      </Tooltip>
      <Tooltip title="Save">
        <Button size="small" type="text" icon={<SaveOutlined />} />
      </Tooltip>
      <span className="rd-quick-access-separator" />
      <Tooltip title="Undo">
        <Button size="small" type="text" icon={<UndoOutlined />} disabled={!canUndo} onClick={undo} />
      </Tooltip>
      <Tooltip title="Redo">
        <Button size="small" type="text" icon={<RedoOutlined />} disabled={!canRedo} onClick={redo} />
      </Tooltip>
    </div>
    <div className="rd-quick-access-title">{template.name || 'Untitled Report'}</div>
    <div className="rd-quick-access-meta">Report Designer</div>
  </header>
);
