import React, { useState } from 'react';
import { Button, Space, Select, Tooltip, Dropdown, Typography, Modal, InputNumber, message } from 'antd';
import {
  UndoOutlined,
  RedoOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  FileAddOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  FontSizeOutlined,
  DeleteOutlined,
  ColumnWidthOutlined,
  ColumnHeightOutlined,
  ArrowsAltOutlined,
  RiseOutlined,
  FallOutlined,
  MenuOutlined,
  BorderOuterOutlined,
  SettingOutlined,
  PlusOutlined,
  MinusOutlined,
  BorderlessTableOutlined,
  PartitionOutlined,
} from '@ant-design/icons';
import { useDesignerStore } from '../store/designer-store';
import type { Margins } from '@report-designer/core';
import { ConditionalFormatManager } from './ConditionalFormatManager';

export const RibbonToolbar: React.FC = () => {
  const { undo, redo, canUndo, canRedo, alignComponents, sizeComponents, bringToFront, sendToBack, deleteSelected, copySelected, pasteClipboard, getClipboard, setFontBold, setFontSize, setTextAlign, setBorderAll, addPage, deletePage, getSelectedFont, getSelectedTextAlign } = useDesignerStore();
  const selectedCount = useDesignerStore(s => s.selectedComponentIds.length);
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const currentPage = template.pages.find(p => p.id === currentPageId);

  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [pageSettings, setPageSettings] = useState<{ width: number; height: number; orientation: 'portrait' | 'landscape'; margins: Margins } | null>(null);
  const [cfModalOpen, setCfModalOpen] = useState(false);

  const alignDisabled = selectedCount < 2;
  const sizeDisabled = selectedCount < 2;
  const layerDisabled = selectedCount === 0;
  const fontInfo = getSelectedFont();
  const textAlign = getSelectedTextAlign();

  // ---- File operations ----

  const handleNew = () => {
    Modal.confirm({
      title: '新建模板',
      content: '当前未保存的更改将丢失，确定新建？',
      onOk: () => {
        useDesignerStore.getState().loadTemplate({
          id: `tpl_${Date.now()}`,
          name: 'New Template',
          version: '1.0',
          pages: [{
            id: `page_${Date.now()}`,
            width: 210, height: 297,
            margins: { top: 10, right: 10, bottom: 10, left: 10 },
            orientation: 'portrait',
            bands: [
              { id: `band_ph_${Date.now()}`, type: 'pageHeader', height: 20, components: [] },
              { id: `band_data_${Date.now()}`, type: 'data', height: 50, components: [] },
              { id: `band_pf_${Date.now()}`, type: 'pageFooter', height: 20, components: [] },
            ],
          }],
          dataSources: [],
          styles: [],
          conditionalFormats: [],
        });
        message.success('已创建新模板');
      },
    });
  };

  const handleOpen = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = JSON.parse(ev.target?.result as string);
          useDesignerStore.getState().loadTemplate(json);
          message.success('已加载模板: ' + file.name);
        } catch {
          message.error('无效的 JSON 文件');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleSave = () => {
    const state = useDesignerStore.getState();
    const json = JSON.stringify(state.template, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.template.name || 'template'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('已保存模板');
  };

  // ---- Page settings ----

  const openPageSettings = () => {
    if (!currentPage) return;
    setPageSettings({
      width: currentPage.width,
      height: currentPage.height,
      orientation: currentPage.orientation,
      margins: { ...currentPage.margins },
    });
    setPageModalOpen(true);
  };

  const applyPageSettings = () => {
    if (!pageSettings || !currentPageId) return;
    const { width, height, orientation, margins } = pageSettings;
    useDesignerStore.getState().setPageSettings(currentPageId, { width, height, orientation, margins });
    setPageModalOpen(false);
    message.success('页面设置已应用');
  };

  // ---- Alignment dropdown menu ----

  const alignMenu = {
    items: [
      { key: 'left', label: '左对齐', icon: <AlignLeftOutlined />, disabled: alignDisabled },
      { key: 'center-h', label: '水平居中', icon: <AlignCenterOutlined />, disabled: alignDisabled },
      { key: 'right', label: '右对齐', icon: <AlignRightOutlined />, disabled: alignDisabled },
      { type: 'divider' as const },
      { key: 'top', label: '顶部对齐', icon: <RiseOutlined />, disabled: alignDisabled },
      { key: 'center-v', label: '垂直居中', icon: <AlignCenterOutlined />, disabled: alignDisabled },
      { key: 'bottom', label: '底部对齐', icon: <FallOutlined />, disabled: alignDisabled },
      { type: 'divider' as const },
      { key: 'distribute-h', label: '水平等间距', icon: <ColumnWidthOutlined />, disabled: alignDisabled || selectedCount < 3 },
      { key: 'distribute-v', label: '垂直等间距', icon: <ColumnHeightOutlined />, disabled: alignDisabled || selectedCount < 3 },
    ],
    onClick: ({ key }: { key: string }) => alignComponents(key),
  };

  const sizeMenu = {
    items: [
      { key: 'same-width', label: '等宽', icon: <ColumnWidthOutlined />, disabled: sizeDisabled },
      { key: 'same-height', label: '等高', icon: <ColumnHeightOutlined />, disabled: sizeDisabled },
      { key: 'same-size', label: '等大小', icon: <ArrowsAltOutlined />, disabled: sizeDisabled },
    ],
    onClick: ({ key }: { key: string }) => sizeComponents(key),
  };

  const layerMenu = {
    items: [
      { key: 'bringToFront', label: '置顶', icon: <RiseOutlined />, disabled: layerDisabled },
      { key: 'sendToBack', label: '置底', icon: <FallOutlined />, disabled: layerDisabled },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'bringToFront') bringToFront();
      if (key === 'sendToBack') sendToBack();
    },
  };

  return (
    <div style={{
      padding: '4px 12px',
      background: '#fafafa',
      borderBottom: '1px solid #e8e8e8',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      flexWrap: 'wrap',
    }}>
      {/* File operations */}
      <Space>
        <Tooltip title="新建 (Ctrl+N)">
          <Button icon={<FileAddOutlined />} size="small" onClick={handleNew} />
        </Tooltip>
        <Tooltip title="打开 (Ctrl+O)">
          <Button icon={<FolderOpenOutlined />} size="small" onClick={handleOpen} />
        </Tooltip>
        <Tooltip title="保存 (Ctrl+S)">
          <Button icon={<SaveOutlined />} size="small" onClick={handleSave} />
        </Tooltip>
      </Space>

      <ToolbarDivider />

      {/* Undo/Redo */}
      <Space>
        <Tooltip title="撤销 (Ctrl+Z)">
          <Button icon={<UndoOutlined />} size="small" disabled={!canUndo()} onClick={undo} />
        </Tooltip>
        <Tooltip title="重做 (Ctrl+Y)">
          <Button icon={<RedoOutlined />} size="small" disabled={!canRedo()} onClick={redo} />
        </Tooltip>
      </Space>

      <ToolbarDivider />

      {/* Page management */}
      <Space>
        <Tooltip title="添加页面">
          <Button icon={<PlusOutlined />} size="small" onClick={addPage} />
        </Tooltip>
        <Tooltip title="删除页面">
          <Button icon={<MinusOutlined />} size="small" onClick={() => currentPageId && deletePage(currentPageId)} disabled={template.pages.length <= 1} />
        </Tooltip>
        <Tooltip title="页面设置">
          <Button icon={<SettingOutlined />} size="small" onClick={openPageSettings} disabled={!currentPage} />
        </Tooltip>
      </Space>

      <ToolbarDivider />

      {/* Delete / Copy / Paste */}
      <Space>
        <Tooltip title="删除 (Del)">
          <Button icon={<DeleteOutlined />} size="small" danger onClick={deleteSelected} disabled={selectedCount === 0} />
        </Tooltip>
        <Tooltip title="复制 (Ctrl+C)">
          <Button icon={<BorderlessTableOutlined />} size="small" onClick={copySelected} disabled={selectedCount === 0} />
        </Tooltip>
        <Tooltip title="粘贴 (Ctrl+V)">
          <Button icon={<BorderlessTableOutlined />} size="small" onClick={pasteClipboard} disabled={getClipboard().length === 0} />
        </Tooltip>
      </Space>

      <ToolbarDivider />

      {/* Font controls */}
      <Space>
        <Select
          size="small"
          value={fontInfo?.size || 12}
          style={{ width: 60 }}
          onChange={(v) => setFontSize(v)}
          options={[8, 9, 10, 11, 12, 14, 16, 18, 20, 24].map(s => ({ value: s, label: `${s}` }))}
          suffixIcon={<FontSizeOutlined />}
          disabled={!fontInfo}
        />
        <Button
          icon={<BoldOutlined />}
          size="small"
          type={fontInfo?.bold ? 'primary' : 'default'}
          onClick={() => setFontBold(!fontInfo?.bold)}
          disabled={!fontInfo}
        />
        <Button
          icon={<ItalicOutlined />}
          size="small"
          disabled={!fontInfo}
        />
        <Button
          icon={<UnderlineOutlined />}
          size="small"
          disabled={!fontInfo}
        />
      </Space>

      <ToolbarDivider />

      {/* Text Alignment */}
      <Space>
        <Button
          icon={<AlignLeftOutlined />}
          size="small"
          type={textAlign === 'left' ? 'primary' : 'default'}
          onClick={() => setTextAlign('left')}
          disabled={textAlign === null}
        />
        <Button
          icon={<AlignCenterOutlined />}
          size="small"
          type={textAlign === 'center' ? 'primary' : 'default'}
          onClick={() => setTextAlign('center')}
          disabled={textAlign === null}
        />
        <Button
          icon={<AlignRightOutlined />}
          size="small"
          type={textAlign === 'right' ? 'primary' : 'default'}
          onClick={() => setTextAlign('right')}
          disabled={textAlign === null}
        />
      </Space>

      <ToolbarDivider />

      {/* Border toggle */}
      <Tooltip title="切换边框">
        <Button icon={<BorderOuterOutlined />} size="small" onClick={() => setBorderAll(true)} disabled={selectedCount === 0} />
      </Tooltip>

      <ToolbarDivider />

      {/* Conditional Format */}
      <Tooltip title="条件格式">
        <Button icon={<PartitionOutlined />} size="small" onClick={() => setCfModalOpen(true)}>
          条件格式
        </Button>
      </Tooltip>

      <ToolbarDivider />

      {/* Component Alignment */}
      <Tooltip title="对齐 (多选组件)">
        <Dropdown menu={alignMenu} trigger={['click']}>
          <Button icon={<MenuOutlined />} size="small" disabled={alignDisabled}>
            对齐
          </Button>
        </Dropdown>
      </Tooltip>

      {/* Size */}
      <Tooltip title="统一大小 (多选组件)">
        <Dropdown menu={sizeMenu} trigger={['click']}>
          <Button icon={<ArrowsAltOutlined />} size="small" disabled={sizeDisabled}>
            大小
          </Button>
        </Dropdown>
      </Tooltip>

      {/* Layer */}
      <Tooltip title="层级">
        <Dropdown menu={layerMenu} trigger={['click']}>
          <Button icon={<RiseOutlined />} size="small" disabled={layerDisabled}>
            层级
          </Button>
        </Dropdown>
      </Tooltip>

      <ToolbarDivider />

      {/* Selection info */}
      {selectedCount > 0 && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          已选 {selectedCount} 个组件
        </Typography.Text>
      )}

      {/* Page settings modal */}
      {pageSettings && (
        <Modal
          title="页面设置"
          open={pageModalOpen}
          onOk={applyPageSettings}
          onCancel={() => setPageModalOpen(false)}
          okText="应用"
          cancelText="取消"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ width: 60 }}>宽度 (mm)</span>
              <InputNumber
                value={pageSettings.width}
                onChange={(v) => setPageSettings({ ...pageSettings, width: v ?? 210 })}
                style={{ width: '100%' }}
                min={50}
                max={1000}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ width: 60 }}>高度 (mm)</span>
              <InputNumber
                value={pageSettings.height}
                onChange={(v) => setPageSettings({ ...pageSettings, height: v ?? 297 })}
                style={{ width: '100%' }}
                min={50}
                max={1000}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ width: 60 }}>方向</span>
              <Select
                value={pageSettings.orientation}
                onChange={(v) => {
                  const isLandscape = v === 'landscape';
                  const w = pageSettings.width;
                  const h = pageSettings.height;
                  setPageSettings({ ...pageSettings, orientation: v, width: isLandscape ? h : w, height: isLandscape ? w : h });
                }}
                style={{ width: '100%' }}
                options={[
                  { value: 'portrait', label: '纵向' },
                  { value: 'landscape', label: '横向' },
                ]}
              />
            </div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>页边距 (mm)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><span>上</span><InputNumber value={pageSettings.margins.top} onChange={(v) => setPageSettings({ ...pageSettings, margins: { ...pageSettings.margins, top: v ?? 0 } })} style={{ width: '100%' }} min={0} max={50} /></div>
              <div><span>右</span><InputNumber value={pageSettings.margins.right} onChange={(v) => setPageSettings({ ...pageSettings, margins: { ...pageSettings.margins, right: v ?? 0 } })} style={{ width: '100%' }} min={0} max={50} /></div>
              <div><span>下</span><InputNumber value={pageSettings.margins.bottom} onChange={(v) => setPageSettings({ ...pageSettings, margins: { ...pageSettings.margins, bottom: v ?? 0 } })} style={{ width: '100%' }} min={0} max={50} /></div>
              <div><span>左</span><InputNumber value={pageSettings.margins.left} onChange={(v) => setPageSettings({ ...pageSettings, margins: { ...pageSettings.margins, left: v ?? 0 } })} style={{ width: '100%' }} min={0} max={50} /></div>
            </div>
          </div>
        </Modal>
      )}

      {/* Conditional Format Manager */}
      <ConditionalFormatManager open={cfModalOpen} onClose={() => setCfModalOpen(false)} />
    </div>
  );
};

const ToolbarDivider: React.FC = () => (
  <span
    aria-hidden="true"
    style={{
      width: 1,
      height: 24,
      backgroundColor: '#d9d9d9',
      display: 'inline-block',
      margin: '0 4px',
    }}
  />
);
