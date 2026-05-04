import React, { useState } from 'react';
import { Tabs, Tree, Button, Space, Tag, Tooltip } from 'antd';
import {
  FileTextOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { useDesignerStore } from '../store/designer-store';
import type { ReportComponent } from '@report-designer/core';
import { nanoid } from 'nanoid';

export const LeftPanel: React.FC = () => {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs
        size="small"
        items={[
          {
            key: 'palette',
            label: (
              <span><AppstoreOutlined /> Palette</span>
            ),
            children: <ComponentPalette />,
          },
          {
            key: 'data',
            label: (
              <span><DatabaseOutlined /> Data</span>
            ),
            children: <DataDictionary />,
          },
          {
            key: 'tree',
            label: (
              <span><FileTextOutlined /> Tree</span>
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
];

const ComponentPalette: React.FC = () => {
  const addComponent = useDesignerStore(s => s.addComponent);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const template = useDesignerStore(s => s.template);

  const getDropPosition = (e: React.DragEvent) => {
    const pageEl = document.querySelector('[data-page]') as HTMLElement;
    if (!pageEl) return null;

    const rect = pageEl.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;
    const xMm = xPx / 3.78;
    const yMm = yPx / 3.78;

    const bands = pageEl.querySelectorAll('[data-band-id]');
    let targetBandId: string | null = null;
    let relativeYMm = yMm;

    bands.forEach(el => {
      const bandRect = (el as HTMLElement).getBoundingClientRect();
      const bandTopMm = (bandRect.top - rect.top) / 3.78;
      const bandBottomMm = bandTopMm + (bandRect.height / 3.78);
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
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 4,
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
                  height: 40,
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  width: '100%',
                }}
              >
                <span>{item.icon}</span>
                <span style={{ fontSize: 11 }}>{item.label}</span>
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
        size="small"
      />
    </div>
  );
};

// ---- Page Tree ----

const PageTree: React.FC = () => {
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const selectComponents = useDesignerStore(s => s.selectComponents);
  const selectBand = useDesignerStore(s => s.selectBand);

  const treeData: DataNode[] = template.pages.map(page => ({
    key: page.id,
    title: `Page ${page.id.slice(0, 6)}`,
    children: page.bands.map(band => ({
      key: band.id,
      title: `${band.type} (${band.height}mm)`,
      children: band.components.map(comp => ({
        key: comp.id,
        title: `${comp.type} - ${comp.id.slice(0, 8)}`,
      })),
    })),
  }));

  return (
    <div style={{ padding: 8 }}>
      <Tree
        treeData={treeData}
        showLine
        defaultExpandAll
        blockNode
        size="small"
        selectedKeys={[currentPageId]}
        onSelect={(keys) => {
          if (keys.length > 0) {
            const key = keys[0] as string;
            // Check if it's a page, band, or component
            const isPage = template.pages.some(p => p.id === key);
            const isBand = template.pages.flatMap(p => p.bands).some(b => b.id === key);
            if (isPage) {
              // selectPage(key); // Would need a selectPage action
            } else if (isBand) {
              selectBand(key);
            } else {
              selectComponents([key]);
            }
          }
        }}
      />
    </div>
  );
};
