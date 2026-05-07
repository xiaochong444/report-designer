import React from 'react';
import { Tabs, Tree, Button, Tooltip, Input } from 'antd';
import {
  FileTextOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { useDesignerStore } from '../store/designer-store';
import type { ReportComponent, BandType } from '@report-designer/core';
import { getBandDisplayName, getComponentNamePrefix } from '../report-structure';
import { nanoid } from 'nanoid';
import { useEffect, useMemo, useState } from 'react';
import { useDesignerI18n, type DesignerMessageKey } from '../i18n';

export const LeftPanel: React.FC = () => {
  const { t } = useDesignerI18n();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0 6px 6px' }}>
      <Tabs
        size="small"
        defaultActiveKey="tree"
        items={[
          {
            key: 'palette',
            label: (
              <span><AppstoreOutlined /> {t('leftPanel.components')}</span>
            ),
            children: <ComponentPalette />,
          },
          {
            key: 'data',
            label: (
              <span><DatabaseOutlined /> {t('leftPanel.dictionary')}</span>
            ),
            children: <DataDictionary />,
          },
          {
            key: 'tree',
            label: (
              <span><FileTextOutlined /> {t('leftPanel.report')}</span>
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
  { type: 'text', labelKey: 'leftPanel.componentText', icon: 'T' },
  { type: 'image', labelKey: 'leftPanel.componentImage', icon: 'I' },
  { type: 'barcode', labelKey: 'leftPanel.componentBarcode', icon: 'B' },
  { type: 'table', labelKey: 'leftPanel.componentTable', icon: '▦' },
  { type: 'checkbox', labelKey: 'leftPanel.componentCheckbox', icon: '☑' },
  { type: 'richtext', labelKey: 'leftPanel.componentRichText', icon: 'R' },
  { type: 'subreport', labelKey: 'leftPanel.componentSubreport', icon: 'S' },
  { type: 'panel', labelKey: 'leftPanel.componentPanel', icon: 'P' },
  { type: 'line', labelKey: 'leftPanel.componentLine', icon: '╱' },
  { type: 'shape', labelKey: 'leftPanel.componentShape', icon: '▭' },
  { type: 'pagenumber', labelKey: 'leftPanel.componentPageNumber', icon: '#' },
  { type: 'datetime', labelKey: 'leftPanel.componentDateTime', icon: 'D' },
];

const ComponentPalette: React.FC = () => {
  const { t } = useDesignerI18n();
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
          let format: any;
          let textAlign = 'left';
          if (fieldType === 'number') {
            format = { type: 'number', pattern: '#,##0.00' };
            textAlign = 'right';
          } else if (fieldType === 'date') {
            format = { type: 'date', pattern: 'yyyy-MM-dd' };
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
          if (fieldType === 'number' || fieldType === 'date') {
            const state = useDesignerStore.getState();
            state.updateComponent(
              currentPageId,
              pos.targetBandId,
              component.id,
              fieldType === 'number'
                ? { textAlign: 'right', format }
                : { format },
            );
          }
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
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>{t('leftPanel.componentsHint')}</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 6,
      }}>
        {COMPONENT_TYPES.map(item => {
          const label = t(item.labelKey as DesignerMessageKey);
          return (
          <Tooltip key={item.type} title={label}>
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
                <span style={{ fontSize: 10, lineHeight: 1.1 }}>{label}</span>
              </Button>
            </div>
          </Tooltip>
          );
        })}
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

type DictionaryNodeKind =
  | 'folder'
  | 'datasource'
  | 'field-string'
  | 'field-number'
  | 'field-boolean'
  | 'field-date'
  | 'variable'
  | 'system'
  | 'function'
  | 'format'
  | 'resource';

function renderDictionaryGlyph(kind: DictionaryNodeKind) {
  return (
    <span
      className={`rd-dictionary-glyph rd-dictionary-glyph-${kind}`}
      aria-hidden
    />
  );
}

function filterTreeNodes(nodes: DataNode[], query: string): DataNode[] {
  if (!query) {
    return nodes;
  }

  return nodes
    .map((node) => {
      const titleText =
        typeof node.title === 'string'
          ? node.title
          : typeof node.key === 'string'
            ? node.key
            : '';
      const children = node.children ? filterTreeNodes(node.children as DataNode[], query) : [];
      if (titleText.toLowerCase().includes(query) || children.length > 0) {
        return {
          ...node,
          children,
        };
      }
      return null;
    })
    .filter(Boolean) as DataNode[];
}

const DataDictionary: React.FC = () => {
  const { t } = useDesignerI18n();
  const dataSources = useDesignerStore(s => s.template.dataSources);
  const [searchTerm, setSearchTerm] = useState('');
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const handleFieldDragStart = (e: React.DragEvent, dsId: string, fieldName: string, fieldType: string) => {
    e.dataTransfer.setData('fieldBinding', JSON.stringify({ dataSourceId: dsId, fieldName, fieldType }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const baseTreeData: DataNode[] = [
    {
      key: 'dictionary-data-sources',
      title: (
        <div className="rd-dictionary-node">
          {renderDictionaryGlyph('folder')}
          <span>{t('leftPanel.dataSources')}</span>
        </div>
      ),
      children: dataSources.map((ds) => ({
        key: ds.id,
        title: (
          <div className="rd-dictionary-node">
            {renderDictionaryGlyph('datasource')}
            <span>{`${ds.name} [${ds.name}]`}</span>
          </div>
        ),
        children: (ds.schema ?? ds.fields ?? []).map((field) => ({
          key: `${ds.id}.${field.name}`,
          title: (
            <div
              className="rd-dictionary-node rd-dictionary-node-field"
              draggable
              onDragStart={(event) => handleFieldDragStart(event, ds.id, field.name, field.type)}
            >
              {renderDictionaryGlyph(`field-${field.type}` as DictionaryNodeKind)}
              <span>{field.label || field.name}</span>
            </div>
          ),
        })),
      })),
    },
    {
      key: 'dictionary-variables',
      title: (
        <div className="rd-dictionary-node">
          {renderDictionaryGlyph('variable')}
          <span>{t('leftPanel.variables')}</span>
        </div>
      ),
      children: [
        {
          key: 'dictionary-variable-empty',
          selectable: false,
          title: <span className="rd-dictionary-empty">{t('leftPanel.noVariables')}</span>,
        },
      ],
    },
    {
      key: 'dictionary-system-variables',
      title: (
        <div className="rd-dictionary-node">
          {renderDictionaryGlyph('system')}
          <span>{t('leftPanel.systemVariables')}</span>
        </div>
      ),
      children: [
        { key: 'sys.Today', title: <div className="rd-dictionary-node">{renderDictionaryGlyph('system')}<span>{'{Today}'}</span></div> },
        { key: 'sys.PageNumber', title: <div className="rd-dictionary-node">{renderDictionaryGlyph('system')}<span>{'{PageNumber}'}</span></div> },
        { key: 'sys.TotalPages', title: <div className="rd-dictionary-node">{renderDictionaryGlyph('system')}<span>{'{TotalPages}'}</span></div> },
      ],
    },
    {
      key: 'dictionary-functions',
      title: (
        <div className="rd-dictionary-node">
          {renderDictionaryGlyph('function')}
          <span>{t('leftPanel.functions')}</span>
        </div>
      ),
      children: [
        { key: 'function.Sum', title: <div className="rd-dictionary-node">{renderDictionaryGlyph('function')}<span>SUM</span></div> },
        { key: 'function.Count', title: <div className="rd-dictionary-node">{renderDictionaryGlyph('function')}<span>COUNT</span></div> },
      ],
    },
    {
      key: 'dictionary-resources',
      title: (
        <div className="rd-dictionary-node">
          {renderDictionaryGlyph('resource')}
          <span>{t('leftPanel.resources')}</span>
        </div>
      ),
      children: [
        {
          key: 'dictionary-resource-empty',
          selectable: false,
          title: <span className="rd-dictionary-empty">{t('leftPanel.noResources')}</span>,
        },
      ],
    },
  ];

  const treeData = filterTreeNodes(baseTreeData, normalizedSearchTerm);

  return (
    <div className="rd-dictionary-panel" data-testid="dictionary-tree">
      <div className="rd-dictionary-toolbar">
        <Input
          allowClear
          size="small"
          placeholder={t('leftPanel.searchDictionary')}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>
      <Tree
        className="rd-dictionary-tree"
        treeData={treeData}
        defaultExpandAll
        blockNode
      />
    </div>
  );
};

// ---- Page Tree ----

function renderComponentTreeIcon(type: ReportComponent['type']) {
  const props = {
    className: `rd-report-tree-glyph rd-report-tree-glyph-${type}`,
    'data-testid': `report-tree-icon-${type}`,
    'aria-hidden': true,
  } as const;
  switch (type) {
    case 'text':
      return <span {...props} />;
    case 'image':
      return <span {...props} />;
    case 'barcode':
      return <span {...props} />;
    case 'table':
      return <span {...props} />;
    case 'checkbox':
      return <span {...props} />;
    case 'richtext':
      return <span {...props} />;
    case 'subreport':
      return <span {...props} />;
    case 'panel':
      return <span {...props} />;
    case 'line':
      return <span {...props} />;
    case 'shape':
      return <span {...props} />;
    case 'pagenumber':
      return <span {...props} />;
    case 'datetime':
      return <span {...props} />;
    default:
      return <span {...props} />;
  }
}

function renderTreeDocGlyph(kind: 'report' | 'page') {
  return (
    <span
      className={`rd-report-tree-glyph rd-report-tree-glyph-doc rd-report-tree-glyph-${kind}`}
      data-testid={`report-tree-icon-${kind}`}
      aria-hidden
    />
  );
}

const PageTree: React.FC = () => {
  const { t } = useDesignerI18n();
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const selectedComponentIds = useDesignerStore(s => s.selectedComponentIds);
  const selectedBandId = useDesignerStore(s => s.selectedBandId);
  const selectComponents = useDesignerStore(s => s.selectComponents);
  const selectBand = useDesignerStore(s => s.selectBand);

  const [searchTerm, setSearchTerm] = useState('');
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const autoExpandedKeys = useMemo(
    () => [
      'report-root',
      ...template.pages.flatMap((page) => [page.id, ...page.bands.map((band) => band.id)]),
    ],
    [template.pages],
  );
  const [expandedKeys, setExpandedKeys] = useState<string[]>(autoExpandedKeys);

  useEffect(() => {
    setExpandedKeys((previousKeys) => {
      const nextKeys = [...previousKeys];
      for (const key of autoExpandedKeys) {
        if (!nextKeys.includes(key)) {
          nextKeys.push(key);
        }
      }
      return nextKeys.length === previousKeys.length ? previousKeys : nextKeys;
    });
  }, [autoExpandedKeys]);

  const selectedKeys = selectedComponentIds.length > 0
    ? selectedComponentIds
      : selectedBandId
        ? [selectedBandId]
        : [currentPageId];

  const treeData: DataNode[] = [
    {
      key: 'report-root',
      selectable: false,
      title: (
        <div className="rd-report-tree-root" data-testid="report-tree-root">
          {renderTreeDocGlyph('report')}
          <span>{template.name || t('shell.untitledReport')}</span>
        </div>
      ),
      children: template.pages.map((page, pageIndex) => {
        const bandTypeCounters: Partial<Record<BandType, number>> = {};
        return {
          key: page.id,
          title: (
            <div className="rd-report-tree-node rd-report-tree-page-node">
              <div className="rd-report-tree-node-main">
                {renderTreeDocGlyph('page')}
                <span>{`Page${pageIndex + 1}`}</span>
              </div>
            </div>
          ),
          children: page.bands.map((band) => {
            bandTypeCounters[band.type] = (bandTypeCounters[band.type] ?? 0) + 1;
            const bandIndex = bandTypeCounters[band.type] ?? 1;
            const bandName = getBandDisplayName(band, bandIndex);
            const visibleComponents = band.components.filter((comp) => {
              if (!normalizedSearchTerm) {
                return true;
              }

              const componentName = comp.name?.trim() || getComponentNamePrefix(comp.type);
              return componentName.toLowerCase().includes(normalizedSearchTerm);
            });

            if (normalizedSearchTerm && visibleComponents.length === 0) {
              return null;
            }

            return {
              key: band.id,
              title: (
                <div
                  className="rd-report-tree-node rd-report-tree-band-node"
                  data-testid={`report-tree-band-${band.id}`}
                >
                  <div className="rd-report-tree-node-main">
                    <span className={`rd-report-tree-band-swatch rd-report-tree-band-${band.type}`} />
                    <span>{bandName}</span>
                  </div>
                </div>
              ),
              children: visibleComponents.map((comp) => ({
                key: comp.id,
                title: (
                  <div className="rd-report-tree-node rd-report-tree-component-node" data-testid={`report-tree-component-${comp.id}`}>
                    <div className="rd-report-tree-node-main">
                      {renderComponentTreeIcon(comp.type)}
                      <span>{comp.name?.trim() || getComponentNamePrefix(comp.type)}</span>
                    </div>
                  </div>
                ),
              })),
            };
          }).filter(Boolean) as DataNode[],
        };
      }),
    },
  ];

  return (
    <div className="rd-report-tree" data-testid="report-tree">
      <div className="rd-report-tree-header">
        <Input
          size="small"
          allowClear
          placeholder={t('leftPanel.searchComponents')}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>
      <div className="rd-report-tree-body">
        <Tree
          className="rd-report-tree-tree"
          treeData={treeData}
          blockNode
          expandedKeys={expandedKeys}
          selectedKeys={selectedKeys}
          onExpand={(keys) => setExpandedKeys(keys as string[])}
          onSelect={(keys) => {
            if (keys.length > 0) {
              const key = keys[0] as string;
              if (key === 'report-root') return;
              const isPage = template.pages.some(p => p.id === key);
              const isBand = template.pages.flatMap(p => p.bands).some(b => b.id === key);
              if (isPage) {
                selectComponents([]);
                selectBand(null);
                useDesignerStore.getState().setCurrentPage(key);
              } else if (isBand) {
                selectComponents([]);
                selectBand(key);
              } else {
                selectBand(null);
                selectComponents([key]);
              }
            }
          }}
        />
      </div>
    </div>
  );
};
