import React from 'react';
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
} from '@ant-design/icons';
import { useDesignerStore } from '../../store/designer-store';

const TAB_LABELS = ['Home', 'Insert', 'Page', 'Layout', 'Preview'];

export const StimulsoftRibbon: React.FC = () => {
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
  } = useDesignerStore();

  const selectedCount = useDesignerStore(s => s.selectedComponentIds.length);
  const template = useDesignerStore(s => s.template);
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
            className={index === 0 ? 'rd-ribbon-tab rd-ribbon-tab-active' : 'rd-ribbon-tab'}
            type="button"
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
            <Button size="small" icon={<SettingOutlined />} />
          </Tooltip>
        </RibbonGroup>

        <RibbonGroup title="Preview">
          <Tooltip title="Requires Phase 4 viewer/print integration">
            <Button size="small" icon={<PrinterOutlined />} disabled>
              Print
            </Button>
          </Tooltip>
        </RibbonGroup>
      </div>
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
