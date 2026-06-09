import React from 'react';
import type { ReportTemplate } from '@report-designer/core';
import {
  PushpinOutlined,
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
import type { LeftPanelTabKey } from '../LeftPanel';
import { DesignerRibbon } from '../ribbon/DesignerRibbon';
import { useDesignerStore } from '../../store/designer-store';
import { useDesignerI18n } from '../../i18n';
import type { ExpressionCatalogExtensions } from '../../expression/expression-catalog';
import { DesignerStatusBar } from './DesignerStatusBar';
import '../../styles/designer-shell.css';

type DockMode = 'pinned' | 'auto';
type DockSide = 'left' | 'right';

const LEFT_DOCK_STORAGE_KEY = 'rd-designer-left-panel-dock';
const PROPERTY_DOCK_STORAGE_KEY = 'rd-designer-property-panel-dock';
const LEFT_PANEL_WIDTH = '270px';
const PROPERTY_PANEL_WIDTH = '310px';
const DOCK_TAB_WIDTH = '30px';

interface DesignerShellProps {
  className?: string;
  subreports?: Record<string, ReportTemplate>;
  expressionExtensions?: ExpressionCatalogExtensions;
}

export const DesignerShell: React.FC<DesignerShellProps> = ({ className, subreports, expressionExtensions }) => {
  const { t } = useDesignerI18n();
  const template = useDesignerStore(s => s.template);
  const undo = useDesignerStore(s => s.undo);
  const redo = useDesignerStore(s => s.redo);
  const canUndo = useDesignerStore(s => s.canUndo);
  const canRedo = useDesignerStore(s => s.canRedo);
  const textStyleLibraryOpen = useDesignerStore(s => s.textStyleLibraryOpen);
  const closeTextStyleLibrary = useDesignerStore(s => s.closeTextStyleLibrary);
  const conditionalFormatLibraryOpen = useDesignerStore(s => s.conditionalFormatLibraryOpen);
  const closeConditionalFormatLibrary = useDesignerStore(s => s.closeConditionalFormatLibrary);
  const [leftDockMode, setLeftDockMode] = usePersistentDockMode(LEFT_DOCK_STORAGE_KEY);
  const [propertyDockMode, setPropertyDockMode] = usePersistentDockMode(PROPERTY_DOCK_STORAGE_KEY);
  const [leftActiveTab, setLeftActiveTab] = React.useState<LeftPanelTabKey>('tree');
  const leftColumnWidth = leftDockMode === 'pinned' ? LEFT_PANEL_WIDTH : DOCK_TAB_WIDTH;
  const propertyColumnWidth = propertyDockMode === 'pinned' ? PROPERTY_PANEL_WIDTH : DOCK_TAB_WIDTH;
  const leftDockTabs: DockPanelTab<LeftPanelTabKey>[] = [
    { key: 'palette', label: t('leftPanel.components'), testId: 'designer-left-dock-tab-palette' },
    { key: 'data', label: t('leftPanel.dictionary'), testId: 'designer-left-dock-tab-data' },
    { key: 'tree', label: t('leftPanel.report'), testId: 'designer-left-dock-tab-tree' },
  ];
  const propertyDockTabs: DockPanelTab<'properties'>[] = [
    { key: 'properties', label: t('shell.propertyPanel'), testId: 'designer-property-dock-tab-properties' },
  ];

  return (
    <div className={className ? `rd-designer-shell ${className}` : 'rd-designer-shell'}>
      <QuickAccess template={template} undo={undo} redo={redo} canUndo={canUndo()} canRedo={canRedo()} />
      <DesignerRibbon />
      <div
        className="rd-designer-body"
        data-testid="designer-body"
        style={{ gridTemplateColumns: `${leftColumnWidth} minmax(360px, 1fr) ${propertyColumnWidth}` }}
      >
        <DockablePanel
          side="left"
          mode={leftDockMode}
          width={LEFT_PANEL_WIDTH}
          testId="designer-left-dock"
          stripTestId="designer-left-dock-strip"
          tabs={leftDockTabs}
          activeTabKey={leftActiveTab}
          pinTitle={t('shell.pinLeftPanel')}
          unpinTitle={t('shell.unpinLeftPanel')}
          onTabActivate={key => setLeftActiveTab(key as LeftPanelTabKey)}
          onModeChange={setLeftDockMode}
        >
          <DesignerLeftPanel activeTab={leftActiveTab} expressionExtensions={expressionExtensions} onActiveTabChange={setLeftActiveTab} />
        </DockablePanel>
        <DesignerCanvasFrame subreports={subreports} expressionExtensions={expressionExtensions} />
        <DockablePanel
          side="right"
          mode={propertyDockMode}
          width={PROPERTY_PANEL_WIDTH}
          testId="designer-property-dock"
          stripTestId="designer-property-dock-strip"
          tabs={propertyDockTabs}
          activeTabKey="properties"
          pinTitle={t('shell.pinPropertyPanel')}
          unpinTitle={t('shell.unpinPropertyPanel')}
          onModeChange={setPropertyDockMode}
        >
          <DesignerPropertyPanel expressionExtensions={expressionExtensions} />
        </DockablePanel>
      </div>
      <DesignerStatusBar />
      <TextStyleLibraryDialog open={textStyleLibraryOpen} onClose={closeTextStyleLibrary} />
      <ConditionalFormatManager open={conditionalFormatLibraryOpen} onClose={closeConditionalFormatLibrary} />
    </div>
  );
};

interface DockPanelTab<TKey extends string = string> {
  key: TKey;
  label: string;
  testId: string;
}

interface DockablePanelProps {
  children: React.ReactNode;
  mode: DockMode;
  onModeChange: (mode: DockMode) => void;
  activeTabKey: string;
  onTabActivate?: (key: string) => void;
  pinTitle: string;
  side: DockSide;
  stripTestId: string;
  tabs: DockPanelTab[];
  testId: string;
  unpinTitle: string;
  width: string;
}

const DockablePanel: React.FC<DockablePanelProps> = ({
  children,
  mode,
  onModeChange,
  activeTabKey,
  onTabActivate,
  pinTitle,
  side,
  stripTestId,
  tabs,
  testId,
  unpinTitle,
  width,
}) => {
  const [open, setOpen] = React.useState(false);
  const isAuto = mode === 'auto';
  const isOpen = isAuto && open;
  const pinButtonTitle = isAuto ? pinTitle : unpinTitle;

  React.useEffect(() => {
    if (!isAuto) setOpen(false);
  }, [isAuto]);

  const showPanel = () => {
    if (isAuto) setOpen(true);
  };

  const hidePanel = () => {
    if (isAuto) setOpen(false);
  };

  const toggleMode = () => {
    onModeChange(isAuto ? 'pinned' : 'auto');
  };

  const activateTab = (key: string) => {
    onTabActivate?.(key);
    showPanel();
  };

  const autoContentStyle: React.CSSProperties | undefined = isAuto
    ? {
        ...(side === 'left' ? { left: DOCK_TAB_WIDTH } : { right: DOCK_TAB_WIDTH }),
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? 'visible' : 'hidden',
        pointerEvents: isOpen ? 'auto' : 'none',
        transform: isOpen ? 'translateX(0)' : `translateX(${side === 'left' ? '-8px' : '8px'})`,
      }
    : undefined;
  const pinButtonVisible = !isAuto || isOpen;
  const pinButtonStyle: React.CSSProperties = {
    opacity: pinButtonVisible ? 1 : 0,
    visibility: pinButtonVisible ? 'visible' : 'hidden',
    pointerEvents: pinButtonVisible ? 'auto' : 'none',
  };
  const pinButtonOrientationClass = isAuto ? 'rd-dock-pin-button-horizontal' : 'rd-dock-pin-button-vertical';

  return (
    <div
      className={`rd-dock-panel rd-dock-panel-${side} rd-dock-panel-${mode}${isOpen ? ' rd-dock-panel-open' : ''}`}
      data-dock-mode={mode}
      data-dock-open={isOpen ? 'true' : 'false'}
      data-testid={testId}
      onMouseEnter={showPanel}
      onMouseLeave={hidePanel}
      style={{ ['--rd-dock-width' as string]: width }}
    >
      <div className="rd-dock-strip" data-testid={stripTestId} onMouseEnter={showPanel}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`rd-dock-strip-tab${tab.key === activeTabKey ? ' rd-dock-strip-tab-active' : ''}`}
            data-testid={tab.testId}
            title={tab.label}
            aria-label={tab.label}
            onMouseEnter={() => activateTab(tab.key)}
            onFocus={() => activateTab(tab.key)}
            onClick={() => activateTab(tab.key)}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="rd-dock-content" style={autoContentStyle} onMouseEnter={showPanel}>
        <Tooltip title={pinButtonTitle}>
          <Button
            className={`rd-dock-pin-button ${pinButtonOrientationClass}`}
            data-testid={`${testId}-pin-button`}
            size="small"
            style={pinButtonStyle}
            type="text"
            title={pinButtonTitle}
            aria-label={pinButtonTitle}
            icon={<PushpinOutlined aria-hidden />}
            onClick={toggleMode}
          />
        </Tooltip>
        {children}
      </div>
    </div>
  );
};

function usePersistentDockMode(storageKey: string): [DockMode, (mode: DockMode) => void] {
  const [mode, setMode] = React.useState<DockMode>(() => readDockMode(storageKey));

  const updateMode = React.useCallback((nextMode: DockMode) => {
    setMode(nextMode);
    try {
      window.localStorage.setItem(storageKey, nextMode);
    } catch {
      // Local storage can be unavailable in embedded or private contexts.
    }
  }, [storageKey]);

  return [mode, updateMode];
}

function readDockMode(storageKey: string): DockMode {
  try {
    return window.localStorage.getItem(storageKey) === 'auto' ? 'auto' : 'pinned';
  } catch {
    return 'pinned';
  }
}

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
