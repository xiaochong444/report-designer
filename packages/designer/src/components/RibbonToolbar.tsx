import React from 'react';
import { Button, Space, Select, Tooltip, Divider, Dropdown, Typography } from 'antd';
import {
  UndoOutlined,
  RedoOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  FileAddOutlined,
  BoldOutlined,
  ItalicOutlined,
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
} from '@ant-design/icons';
import { useDesignerStore } from '../store/designer-store';

export const RibbonToolbar: React.FC = () => {
  const { undo, redo, canUndo, canRedo, alignComponents, sizeComponents, bringToFront, sendToBack } = useDesignerStore();
  const selectedCount = useDesignerStore(s => s.selectedComponentIds.length);

  const alignDisabled = selectedCount < 2;
  const sizeDisabled = selectedCount < 2;
  const layerDisabled = selectedCount === 0;

  // Alignment dropdown menu
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

  // Size dropdown menu
  const sizeMenu = {
    items: [
      { key: 'same-width', label: '等宽', icon: <ColumnWidthOutlined />, disabled: sizeDisabled },
      { key: 'same-height', label: '等高', icon: <ColumnHeightOutlined />, disabled: sizeDisabled },
      { key: 'same-size', label: '等大小', icon: <ArrowsAltOutlined />, disabled: sizeDisabled },
    ],
    onClick: ({ key }: { key: string }) => sizeComponents(key),
  };

  // Layer dropdown menu
  const layerMenu = {
    items: [
      { key: 'bringToFront', label: '置顶', icon: <RiseOutlined />, disabled: layerDisabled },
      { key: 'sendToBack', label: '置底', icon: <FallOutlined />, disabled: layerDisabled },
    ],
    onClick: ({ key }: string) => {
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
        <Tooltip title="New">
          <Button icon={<FileAddOutlined />} size="small" />
        </Tooltip>
        <Tooltip title="Open">
          <Button icon={<FolderOpenOutlined />} size="small" />
        </Tooltip>
        <Tooltip title="Save">
          <Button icon={<SaveOutlined />} size="small" />
        </Tooltip>
      </Space>

      <Divider type="vertical" style={{ height: 24 }} />

      {/* Undo/Redo */}
      <Space>
        <Tooltip title="Undo (Ctrl+Z)">
          <Button
            icon={<UndoOutlined />}
            size="small"
            disabled={!canUndo()}
            onClick={undo}
          />
        </Tooltip>
        <Tooltip title="Redo (Ctrl+Y)">
          <Button
            icon={<RedoOutlined />}
            size="small"
            disabled={!canRedo()}
            onClick={redo}
          />
        </Tooltip>
      </Space>

      <Divider type="vertical" style={{ height: 24 }} />

      {/* Delete */}
      <Tooltip title="Delete">
        <Button icon={<DeleteOutlined />} size="small" danger />
      </Tooltip>

      <Divider type="vertical" style={{ height: 24 }} />

      {/* Font controls */}
      <Space>
        <Select
          size="small"
          defaultValue="12"
          style={{ width: 60 }}
          options={[
            { value: '8', label: '8' },
            { value: '9', label: '9' },
            { value: '10', label: '10' },
            { value: '11', label: '11' },
            { value: '12', label: '12' },
            { value: '14', label: '14' },
            { value: '16', label: '16' },
            { value: '18', label: '18' },
            { value: '20', label: '20' },
            { value: '24', label: '24' },
          ]}
          suffixIcon={<FontSizeOutlined />}
        />
        <Button icon={<BoldOutlined />} size="small" />
        <Button icon={<ItalicOutlined />} size="small" />
      </Space>

      <Divider type="vertical" style={{ height: 24 }} />

      {/* Text Alignment */}
      <Space>
        <Button icon={<AlignLeftOutlined />} size="small" title="左对齐文本" />
        <Button icon={<AlignCenterOutlined />} size="small" title="居中对齐文本" />
        <Button icon={<AlignRightOutlined />} size="small" title="右对齐文本" />
      </Space>

      <Divider type="vertical" style={{ height: 24 }} />

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

      <Divider type="vertical" style={{ height: 24 }} />

      {/* Selection info */}
      {selectedCount > 0 && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          已选 {selectedCount} 个组件
        </Typography.Text>
      )}
    </div>
  );
};
