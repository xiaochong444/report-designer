import React, { useState } from 'react';
import { Button, Select, Tooltip } from 'antd';
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BorderOuterOutlined,
  DeleteOutlined,
  FileAddOutlined,
  FolderOpenOutlined,
  FontSizeOutlined,
  PlusOutlined,
  PrinterOutlined,
  SaveOutlined,
  SettingOutlined,
  UndoOutlined,
  RedoOutlined,
  DatabaseOutlined,
  ApartmentOutlined,
  GroupOutlined,
} from '@ant-design/icons';
import { useDesignerStore } from '../../store/designer-store';
import { BandWizardDialog } from '../dialogs/BandWizardDialog';
import { GroupWizardDialog } from '../dialogs/GroupWizardDialog';
import { JsonDataSourceDialog } from '../dialogs/JsonDataSourceDialog';
import { PageSetupDialog } from '../dialogs/PageSetupDialog';

const TAB_LABELS = ['Home', 'Insert', 'Page', 'Layout', 'Preview'];

export const StimulsoftRibbon: React.FC = () => {
  const [dataDialogOpen, setDataDialogOpen] = useState(false);
  const [bandDialogOpen, setBandDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    deleteSelected,
    copySelected,
    pasteClipboard,
    getClipboard,
    setFontBold,
    setFontSize,
    setTextAlign,
    setBorderAll,
    addPage,
    getSelectedFont,
    getSelectedTextAlign,
    setMode,
  } = useDesignerStore();

  const selectedCount = useDesignerStore(s => s.selectedComponentIds.length);
  const template = useDesignerStore(s => s.template);
  const mode = useDesignerStore(s => s.mode);
  const fontInfo = getSelectedFont();
  const textAlign = getSelectedTextAlign();

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
    <div className="rd-ribbon" data-testid="designer-ribbon">
      <div className="rd-ribbon-tabs">
        {TAB_LABELS.map((tab, index) => (
          <button
            key={tab}
            className={(tab === 'Preview' ? mode === 'preview' : index === 0 && mode === 'design') ? 'rd-ribbon-tab rd-ribbon-tab-active' : 'rd-ribbon-tab'}
            type="button"
            onClick={() => setMode(tab === 'Preview' ? 'preview' : 'design')}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="rd-ribbon-content">
        <RibbonGroup title="File">
          <Tooltip title="New report">
            <Button size="small" icon={<FileAddOutlined />} />
          </Tooltip>
          <Tooltip title="Open JSON template">
            <Button size="small" icon={<FolderOpenOutlined />} />
          </Tooltip>
          <Tooltip title="Save JSON template">
            <Button size="small" icon={<SaveOutlined />} onClick={saveTemplate} />
          </Tooltip>
        </RibbonGroup>

        <RibbonGroup title="History">
          <Tooltip title="Undo">
            <Button size="small" icon={<UndoOutlined />} disabled={!canUndo()} onClick={undo} />
          </Tooltip>
          <Tooltip title="Redo">
            <Button size="small" icon={<RedoOutlined />} disabled={!canRedo()} onClick={redo} />
          </Tooltip>
        </RibbonGroup>

        <RibbonGroup title="Edit">
          <Button size="small" onClick={copySelected} disabled={selectedCount === 0}>Copy</Button>
          <Button size="small" onClick={pasteClipboard} disabled={getClipboard().length === 0}>Paste</Button>
          <Tooltip title="Delete selected objects">
            <Button size="small" danger icon={<DeleteOutlined />} onClick={deleteSelected} disabled={selectedCount === 0} />
          </Tooltip>
        </RibbonGroup>

        <RibbonGroup title="Data">
          <Tooltip title="JSON data source">
            <Button size="small" icon={<DatabaseOutlined />} onClick={() => setDataDialogOpen(true)}>
              JSON
            </Button>
          </Tooltip>
          <Tooltip title="Band wizard">
            <Button size="small" icon={<ApartmentOutlined />} onClick={() => setBandDialogOpen(true)}>
              Bands
            </Button>
          </Tooltip>
          <Tooltip title="Group wizard">
            <Button size="small" icon={<GroupOutlined />} onClick={() => setGroupDialogOpen(true)}>
              Group
            </Button>
          </Tooltip>
        </RibbonGroup>

        <RibbonGroup title="Font">
          <Select
            size="small"
            value={fontInfo?.size || 12}
            style={{ width: 64 }}
            suffixIcon={<FontSizeOutlined />}
            disabled={!fontInfo}
            onChange={setFontSize}
            options={[8, 9, 10, 11, 12, 14, 16, 18, 20, 24].map(size => ({ value: size, label: String(size) }))}
          />
          <Button size="small" disabled={!fontInfo} type={fontInfo?.bold ? 'primary' : 'default'} onClick={() => setFontBold(!fontInfo?.bold)}>
            B
          </Button>
        </RibbonGroup>

        <RibbonGroup title="Align">
          <Button size="small" icon={<AlignLeftOutlined />} disabled={textAlign === null} type={textAlign === 'left' ? 'primary' : 'default'} onClick={() => setTextAlign('left')} />
          <Button size="small" icon={<AlignCenterOutlined />} disabled={textAlign === null} type={textAlign === 'center' ? 'primary' : 'default'} onClick={() => setTextAlign('center')} />
          <Button size="small" icon={<AlignRightOutlined />} disabled={textAlign === null} type={textAlign === 'right' ? 'primary' : 'default'} onClick={() => setTextAlign('right')} />
          <Button size="small" icon={<BorderOuterOutlined />} disabled={selectedCount === 0} onClick={() => setBorderAll(true)} />
        </RibbonGroup>

        <RibbonGroup title="Page">
          <Tooltip title="Add page">
            <Button size="small" icon={<PlusOutlined />} onClick={addPage} />
          </Tooltip>
          <Tooltip title="Page settings">
            <Button size="small" icon={<SettingOutlined />} onClick={() => setPageDialogOpen(true)} />
          </Tooltip>
        </RibbonGroup>

        <RibbonGroup title="Preview">
          <Tooltip title="Print preview">
            <Button size="small" icon={<PrinterOutlined />} onClick={() => setMode('preview')}>
              Print
            </Button>
          </Tooltip>
        </RibbonGroup>
      </div>
      <JsonDataSourceDialog open={dataDialogOpen} onClose={() => setDataDialogOpen(false)} />
      <BandWizardDialog open={bandDialogOpen} onClose={() => setBandDialogOpen(false)} />
      <GroupWizardDialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)} />
      <PageSetupDialog open={pageDialogOpen} onClose={() => setPageDialogOpen(false)} />
    </div>
  );
};

const RibbonGroup: React.FC<React.PropsWithChildren<{ title: string }>> = ({ title, children }) => (
  <div className="rd-ribbon-group">
    <div className="rd-ribbon-group-controls">{children}</div>
    <span className="rd-ribbon-divider" />
    <div className="rd-ribbon-group-title">{title}</div>
  </div>
);
