import React from 'react';
import { Tabs, Tree, Button, Tag, Tooltip, Modal, InputNumber, Select, Space, message } from 'antd';
import {
  FileTextOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { useDesignerStore } from '../store/designer-store';
import type { ReportComponent, BandType } from '@report-designer/core';
import { formatUnitValue, getReportUnitSymbol, getUnitStep, parseUnitValue } from '../page-settings';
import { nanoid } from 'nanoid';
import { useState } from 'react';

export const LeftPanel: React.FC = () => {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0 6px 6px' }}>
      <Tabs
        size="small"
        defaultActiveKey="report"
        items={[
          {
            key: 'palette',
            label: (
              <span><AppstoreOutlined /> Components</span>
            ),
            children: <ComponentPalette />,
          },
          {
            key: 'data',
            label: (
              <span><DatabaseOutlined /> Dictionary</span>
            ),
            children: <DataDictionary />,
          },
          {
            key: 'tree',
            label: (
              <span><FileTextOutlined /> Report</span>
            ),
            children: <PageTree />,
          },
        ]}
      />
    </div>
  );
};

// ---- Component Palette ----

const COMPONENT_TYPES = [
  { type: 'text', label: 'Text', icon: 'T' },
  { type: 'image', label: 'Image', icon: 'I' },
  { type: 'barcode', label: 'Barcode', icon: 'B' },
  { type: 'table', label: 'Table', icon: '▦' },
  { type: 'checkbox', label: 'Checkbox', icon: '☑' },
  { type: 'richtext', label: 'Rich Text', icon: 'R' },
  { type: 'subreport', label: 'Subreport', icon: 'S' },
  { type: 'panel', label: 'Panel', icon: 'P' },
  { type: 'line', label: 'Line', icon: '╱' },
  { type: 'shape', label: 'Shape', icon: '▭' },
  { type: 'pagenumber', label: 'Page #', icon: '#' },
  { type: 'datetime', label: 'Date/Time', icon: '📅' },
];

const ComponentPalette: React.FC = () => {
  const addComponent = useDesignerStore(s => s.addComponent);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const template = useDesignerStore(s => s.template);
  const zoom = useDesignerStore(s => s.zoom);

  const getDropPosition = (e: React.DragEvent) => {
    const pageEl = document.querySelector('[data-page]') as HTMLElement;
    if (!pageEl) return null;

    const rect = pageEl.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;
    const xMm = xPx / (3.78 * zoom);
    const yMm = yPx / (3.78 * zoom);

    const bands = pageEl.querySelectorAll('[data-band-id]');
    let targetBandId: string | null = null;
    let relativeYMm = yMm;

    bands.forEach(el => {
      const bandRect = (el as HTMLElement).getBoundingClientRect();
      const bandTopMm = (bandRect.top - rect.top) / (3.78 * zoom);
      const bandBottomMm = bandTopMm + (bandRect.height / (3.78 * zoom));
      if (yMm >= bandTopMm && yMm < bandBottomMm) {
        targetBandId = el.getAttribute('data-band-id');
        relativeYMm = yMm - bandTopMm;
      }
    });

    if (!targetBandId) {
      const currentPage = template.pages.find(p => p.id === currentPageId);
      const dataBand = currentPage?.bands.find(b => b.type === 'data');
      if (dataBand) {
        targetBandId = dataBand.id;
      }
    }

    return { xMm, yMm: relativeYMm, targetBandId };
  };

  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    if (!currentPageId) return;

    const pos = getDropPosition(e);
    if (!pos || !pos.targetBandId) return;

    // Check if it's a field binding drop
    const fieldBindingStr = e.dataTransfer.getData('fieldBinding');
    if (fieldBindingStr) {
      try {
        const { dataSourceId, fieldName, fieldType } = JSON.parse(fieldBindingStr);
        let component: ReportComponent;

        if (fieldType === 'boolean') {
          component = {
            id: `comp_checkbox_${nanoid(6)}`,
            type: 'checkbox',
            x: Math.round(pos.xMm * 10) / 10,
            y: Math.round(pos.yMm * 10) / 10,
            width: 15, height: 15,
          } as ReportComponent;
          addComponent(currentPageId, pos.targetBandId, component);
          // Also set the checked binding
          const bandId = pos.targetBandId;
          useDesignerStore.getState().updateComponent(currentPageId, bandId, component.id, {
            checked: `{${dataSourceId}.${fieldName}}`,
          });
        } else {
          let format = '';
          let textAlign = 'left';
          if (fieldType === 'number') {
            format = '#,##0.00';
            textAlign = 'right';
          } else if (fieldType === 'date') {
            format = 'yyyy-MM-dd';
          }
          component = {
            id: `comp_text_${nanoid(6)}`,
            type: 'text',
            x: Math.round(pos.xMm * 10) / 10,
            y: Math.round(pos.yMm * 10) / 10,
            width: 40, height: 15,
            text: `{${dataSourceId}.${fieldName}}`,
            font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
            textAlign: textAlign as any,
            verticalAlign: 'middle',
            border: { style: 'none', width: 0, color: '#000', sides: { top: false, right: false, bottom: false, left: false } },
            canGrow: false, canShrink: false,
            dataSource: dataSourceId,
            format,
          } as any;
          addComponent(currentPageId, pos.targetBandId, component);
        }
        return;
      } catch { /* fall through to component type handling */ }
    }

    // Component type drop
    const type = e.dataTransfer.getData('componentType');
    if (!type) return;

    const component = createDefaultComponent(type, pos.xMm, pos.yMm);
    addComponent(currentPageId, pos.targetBandId, component);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <div style={{ padding: 8 }} onDrop={handleDropOnCanvas} onDragOver={handleDragOver}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>Drag common report controls into the selected band.</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 6,
      }}>
        {COMPONENT_TYPES.map(item => (
          <Tooltip key={item.type} title={item.label}>
            <div
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('componentType', item.type);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              style={{ cursor: 'grab' }}
            >
              <Button
                size="small"
                style={{
                  height: 52,
                  fontSize: 15,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  width: '100%',
                }}
              >
                <span>{item.icon}</span>
                <span style={{ fontSize: 10, lineHeight: 1.1 }}>{item.label}</span>
              </Button>
            </div>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};

function createDefaultComponent(type: string, xMm: number, yMm: number): ReportComponent {
  const id = `comp_${type}_${nanoid(6)}`;
  const x = Math.round(xMm * 10) / 10;
  const y = Math.round(yMm * 10) / 10;

  switch (type) {
    case 'text':
      return {
        id, type: 'text', x, y, width: 40, height: 15, style: '',
        text: '{Field}',
        font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
        textAlign: 'left', verticalAlign: 'middle',
        border: { style: 'none', width: 0, color: '#000', sides: { top: false, right: false, bottom: false, left: false } },
        canGrow: false, canShrink: false,
      } as ReportComponent;
    case 'image':
      return { id, type: 'image', x, y, width: 30, height: 30, style: '', src: '', fitMode: 'contain' } as ReportComponent;
    case 'barcode':
      return { id, type: 'barcode', x, y, width: 30, height: 30, style: '', value: '123456', format: 'CODE128', showText: true } as ReportComponent;
    case 'table':
      return { id, type: 'table', x, y, width: 100, height: 50, style: '', dataSource: '', columns: [], headerHeight: 20, rowHeight: 20, showBorder: true } as ReportComponent;
    case 'checkbox':
      return { id, type: 'checkbox', x, y, width: 15, height: 15, style: '' } as ReportComponent;
    case 'richtext':
      return { id, type: 'richtext', x, y, width: 60, height: 20, style: '', html: '<p>Rich text</p>' } as ReportComponent;
    case 'subreport':
      return { id, type: 'subreport', x, y, width: 80, height: 60, style: '', templateUrl: '', parameters: {} } as ReportComponent;
    case 'panel':
      return { id, type: 'panel', x, y, width: 60, height: 40, style: '', components: [], border: { style: 'none', width: 0, color: '#000', sides: { top: false, right: false, bottom: false, left: false } } } as ReportComponent;
    case 'line':
      return { id, type: 'line', x, y, width: 50, height: 10, startX: 0, startY: 0, endX: 50, endY: 0, lineColor: '#000000', lineWidth: 0.2, lineStyle: 'solid' } as ReportComponent;
    case 'shape':
      return { id, type: 'shape', x, y, width: 30, height: 30, shapeType: 'rectangle', fillColor: 'transparent', borderColor: '#000000', borderWidth: 0.2, borderStyle: 'solid' } as ReportComponent;
    case 'pagenumber':
      return { id, type: 'pagenumber', x, y, width: 30, height: 15, format: '1/N', font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' }, textAlign: 'center' } as ReportComponent;
    case 'datetime':
      return { id, type: 'datetime', x, y, width: 50, height: 15, format: 'yyyy-MM-dd', font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' }, textAlign: 'left' } as ReportComponent;
    default:
      return { id, type: 'text', x, y, width: 30, height: 20, style: '', text: '', font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000' }, textAlign: 'left', verticalAlign: 'middle', border: { style: 'none', width: 0, color: '#000', sides: { top: false, right: false, bottom: false, left: false } }, canGrow: false, canShrink: false } as ReportComponent;
  }
}

// ---- Data Dictionary ----

const DataDictionary: React.FC = () => {
  const dataSources = useDesignerStore(s => s.template.dataSources);

  const handleFieldDragStart = (e: React.DragEvent, dsId: string, fieldName: string, fieldType: string) => {
    e.dataTransfer.setData('fieldBinding', JSON.stringify({ dataSourceId: dsId, fieldName, fieldType }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const treeData: DataNode[] = dataSources.map(ds => ({
    key: ds.id,
    title: (
      <span>
        <DatabaseOutlined style={{ marginRight: 4, color: '#1890ff' }} />
        {ds.name}
        <Tag style={{ marginLeft: 8, fontSize: 10 }}>{ds.type}</Tag>
      </span>
    ),
    children: ds.schema.map(field => ({
      key: `${ds.id}.${field.name}`,
      title: (
        <span
          draggable
          onDragStart={(e) => handleFieldDragStart(e, ds.id, field.name, field.type)}
          style={{ cursor: 'grab' }}
        >
          {field.name} <span style={{ color: '#999', fontSize: 10 }}>({field.type})</span>
        </span>
      ),
    })),
  }));

  return (
    <div style={{ padding: 8 }}>
      <div style={{ marginBottom: 8 }}>
        <Button size="small" icon={<PlusOutlined />}>Add Data Source</Button>
      </div>
      <Tree
        treeData={treeData}
        showLine
        defaultExpandAll
        blockNode
      />
    </div>
  );
};

// ---- Page Tree ----

const BAND_TYPE_OPTIONS: { value: BandType; label: string }[] = [
  { value: 'reportTitle', label: '报表标题' },
  { value: 'reportSummary', label: '报表汇总' },
  { value: 'pageHeader', label: '页眉' },
  { value: 'pageFooter', label: '页脚' },
  { value: 'groupHeader', label: '分组头' },
  { value: 'groupFooter', label: '分组尾' },
  { value: 'data', label: '数据' },
  { value: 'child', label: '子报表' },
];

const PageTree: React.FC = () => {
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const selectComponents = useDesignerStore(s => s.selectComponents);
  const selectBand = useDesignerStore(s => s.selectBand);
  const addBand = useDesignerStore(s => s.addBand);
  const deleteBand = useDesignerStore(s => s.deleteBand);
  const reportUnit = useDesignerStore(s => s.reportUnit);

  const [bandModalOpen, setBandModalOpen] = useState(false);
  const [newBandType, setNewBandType] = useState<BandType>('data');
  const [newBandHeight, setNewBandHeight] = useState(30);
  const unitSymbol = getReportUnitSymbol(reportUnit);
  const unitStep = getUnitStep(reportUnit);

  const currentPage = template.pages.find(p => p.id === currentPageId);

  const handleAddBand = () => {
    if (!currentPageId) return;
    addBand(currentPageId, { type: newBandType, height: newBandHeight, components: [] });
    setBandModalOpen(false);
    message.success(`已添加 ${newBandType} 带`);
  };

  const handleMoveBand = (bandId: string, direction: 'up' | 'down') => {
    if (!currentPage) return;
    const idx = currentPage.bands.findIndex(b => b.id === bandId);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= currentPage.bands.length) return;

    const newBands = [...currentPage.bands];
    [newBands[idx], newBands[newIdx]] = [newBands[newIdx], newBands[idx]];

    useDesignerStore.getState().setPageSettings(currentPageId, { bands: newBands });
  };

  const treeData: DataNode[] = template.pages.map(page => ({
    key: page.id,
    title: (
      <span>
        {page.id === currentPageId ? <Tag color="blue">{page.id.slice(0, 6)}</Tag> : `Page ${page.id.slice(0, 6)}`}
      </span>
    ),
    children: page.bands.map(band => ({
      key: band.id,
      title: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>{band.type} ({formatUnitValue(band.height, reportUnit)} {unitSymbol})</span>
          <Space size={0}>
            <Tooltip title="上移">
              <Button
                type="text" size="small" icon={<ArrowUpOutlined />}
                style={{ height: 20, padding: 0, fontSize: 10 }}
                onClick={(e) => { e.stopPropagation(); handleMoveBand(band.id, 'up'); }}
              />
            </Tooltip>
            <Tooltip title="下移">
              <Button
                type="text" size="small" icon={<ArrowDownOutlined />}
                style={{ height: 20, padding: 0, fontSize: 10 }}
                onClick={(e) => { e.stopPropagation(); handleMoveBand(band.id, 'down'); }}
              />
            </Tooltip>
            <Tooltip title="删除">
              <Button
                type="text" size="small" danger icon={<DeleteOutlined />}
                style={{ height: 20, padding: 0, fontSize: 10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  Modal.confirm({
                    title: '确认删除',
                    content: `确定删除 ${band.type} 带及其所有组件？`,
                    onOk: () => {
                      deleteBand(page.id, band.id);
                      message.success('已删除带');
                    },
                  });
                }}
              />
            </Tooltip>
          </Space>
        </div>
      ),
      children: band.components.map(comp => ({
        key: comp.id,
        title: `${comp.type} - ${comp.id.slice(0, 8)}`,
      })),
    })),
  }));

  return (
    <div style={{ padding: 8, height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#6b7280' }}>Pages, bands, and components</div>
        <Button size="small" icon={<PlusOutlined />} onClick={() => setBandModalOpen(true)}>
          添加带
        </Button>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Tree
          treeData={treeData}
          showLine
          defaultExpandAll
          blockNode
          selectedKeys={[currentPageId]}
          onSelect={(keys) => {
            if (keys.length > 0) {
              const key = keys[0] as string;
              const isPage = template.pages.some(p => p.id === key);
              const isBand = template.pages.flatMap(p => p.bands).some(b => b.id === key);
              if (isPage) {
                useDesignerStore.getState().setCurrentPage(key);
              } else if (isBand) {
                selectBand(key);
              } else {
                selectComponents([key]);
              }
            }
          }}
        />
      </div>

      {/* Add Band Modal */}
      <Modal
        title="添加带"
        open={bandModalOpen}
        onOk={handleAddBand}
        onCancel={() => setBandModalOpen(false)}
        okText="添加"
        cancelText="取消"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ width: 60 }}>类型</span>
            <Select
              value={newBandType}
              onChange={(v) => setNewBandType(v)}
              style={{ width: '100%' }}
              options={BAND_TYPE_OPTIONS}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ width: 60 }}>高度</span>
            <InputNumber
              value={formatUnitValue(newBandHeight, reportUnit)}
              onChange={(v) => setNewBandHeight(parseUnitValue(v, reportUnit, newBandHeight))}
              style={{ width: '100%' }}
              min={formatUnitValue(5, reportUnit)}
              max={formatUnitValue(500, reportUnit)}
              step={unitStep}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
