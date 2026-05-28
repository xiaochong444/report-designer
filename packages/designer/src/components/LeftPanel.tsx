import React from 'react';
import { Tabs, Tree, Tooltip } from 'antd';
import {
  FileTextOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { useDesignerStore } from '../store/designer-store';
import type { ReportComponent, BandType } from '@report-designer/core';
import { getComponentNamePrefix } from '../report-structure';
import { useEffect, useMemo, useState } from 'react';
import { useDesignerI18n, type DesignerMessageKey } from '../i18n';
import { createDefaultComponent, createFieldExpressionComponent, createTextExpressionComponent } from '../component-factory';
import { PanelSearchBox } from './panels/PanelSearchBox';

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
  { type: 'text', labelKey: 'leftPanel.componentText' },
  { type: 'richtext', labelKey: 'leftPanel.componentRichText' },
  { type: 'image', labelKey: 'leftPanel.componentImage' },
  { type: 'table', labelKey: 'leftPanel.componentTable' },
  { type: 'barcode', labelKey: 'leftPanel.componentBarcode' },
  { type: 'checkbox', labelKey: 'leftPanel.componentCheckbox' },
  { type: 'pagenumber', labelKey: 'leftPanel.componentPageNumber' },
  { type: 'datetime', labelKey: 'leftPanel.componentDateTime' },
  { type: 'line', labelKey: 'leftPanel.componentLine' },
  { type: 'shape', labelKey: 'leftPanel.componentShape' },
  { type: 'panel', labelKey: 'leftPanel.componentPanel' },
  { type: 'subreport', labelKey: 'leftPanel.componentSubreport' },
];

const COMPONENT_GROUPS = [
  { key: 'common', labelKey: 'leftPanel.groupCommon', types: ['text', 'richtext', 'image', 'table'] },
  { key: 'data', labelKey: 'leftPanel.groupData', types: ['barcode', 'checkbox', 'pagenumber', 'datetime'] },
  { key: 'graphics', labelKey: 'leftPanel.groupGraphics', types: ['line', 'shape', 'panel'] },
  { key: 'advanced', labelKey: 'leftPanel.groupAdvanced', types: ['subreport'] },
];

const ComponentPalette: React.FC = () => {
  const { t } = useDesignerI18n();
  const addComponent = useDesignerStore(s => s.addComponent);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const template = useDesignerStore(s => s.template);
  const zoom = useDesignerStore(s => s.zoom);
  const [query, setQuery] = useState('');

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
        const field = JSON.parse(fieldBindingStr);
        addComponent(
          currentPageId,
          pos.targetBandId,
          createFieldExpressionComponent(field, pos.xMm, pos.yMm),
        );
        return;
      } catch { /* fall through to component type handling */ }
    }

    const expressionBinding = e.dataTransfer.getData('expressionBinding');
    if (expressionBinding) {
      addComponent(
        currentPageId,
        pos.targetBandId,
        createTextExpressionComponent(expressionBinding, pos.xMm, pos.yMm),
      );
      return;
    }

    // Component type drop
    const type = e.dataTransfer.getData('componentType');
    if (!type) return;

    addComponent(currentPageId, pos.targetBandId, createDefaultComponent(type, pos.xMm, pos.yMm));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const normalizedQuery = query.trim().toLowerCase();
  const componentByType = new Map(COMPONENT_TYPES.map(item => [item.type, item]));

  return (
    <div className="rd-component-palette" data-testid="component-palette" onDrop={handleDropOnCanvas} onDragOver={handleDragOver}>
      <PanelSearchBox
        placeholder={t('leftPanel.searchComponents')}
        value={query}
        onChange={setQuery}
      />
      <div className="rd-component-palette-hint">{t('leftPanel.componentsHint')}</div>
      <div className="rd-component-palette-groups">
        {COMPONENT_GROUPS.map(group => {
          const items = group.types
            .map(type => componentByType.get(type))
            .filter((item): item is (typeof COMPONENT_TYPES)[number] => Boolean(item))
            .filter(item => {
              const label = t(item.labelKey as DesignerMessageKey).toLowerCase();
              return !normalizedQuery || label.includes(normalizedQuery) || item.type.includes(normalizedQuery);
            });
          if (items.length === 0) return null;

          return (
            <section key={group.key} className="rd-component-palette-group" data-testid={`component-palette-group-${group.key}`}>
              <div className="rd-component-palette-group-title">{t(group.labelKey as DesignerMessageKey)}</div>
              <div className="rd-component-toolbox-grid">
                {items.map(item => {
                  const label = t(item.labelKey as DesignerMessageKey);
                  return (
                    <Tooltip key={item.type} title={label} mouseEnterDelay={0.4}>
                      <button
                        type="button"
                        className="rd-component-toolbox-item"
                        data-testid={`component-palette-item-${item.type}`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('componentType', item.type);
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                      >
                        <span className={`rd-report-tree-glyph rd-report-tree-glyph-${item.type}`} aria-hidden />
                        <span className="rd-component-toolbox-label">{label}</span>
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

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
  | 'format';

type SearchableDataNode = DataNode & {
  searchText?: string;
  children?: SearchableDataNode[];
};

function renderDictionaryGlyph(kind: DictionaryNodeKind) {
  return (
    <span
      className={`rd-dictionary-glyph rd-dictionary-glyph-${kind}`}
      aria-hidden
    />
  );
}

function filterTreeNodes(nodes: SearchableDataNode[], query: string): SearchableDataNode[] {
  if (!query) {
    return nodes;
  }

  return nodes
    .map((node) => {
      const titleText =
        node.searchText ??
        (typeof node.title === 'string'
          ? node.title
          : typeof node.key === 'string'
            ? node.key
            : '');
      const children = node.children ? filterTreeNodes(node.children, query) : [];
      if (titleText.toLowerCase().includes(query) || children.length > 0) {
        return {
          ...node,
          children,
        };
      }
      return null;
    })
    .filter(Boolean) as SearchableDataNode[];
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
  const handleExpressionDragStart = (e: React.DragEvent, expression: string) => {
    e.dataTransfer.setData('expressionBinding', expression);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const baseTreeData: SearchableDataNode[] = [
    {
      key: 'dictionary-data-sources',
      searchText: t('leftPanel.dataSources'),
      title: (
        <div className="rd-dictionary-node">
          {renderDictionaryGlyph('folder')}
          <span>{t('leftPanel.dataSources')}</span>
        </div>
      ),
      children: dataSources.map((ds) => ({
        key: ds.id,
        searchText: `${ds.id} ${ds.name}`,
        title: (
          <div className="rd-dictionary-node">
            {renderDictionaryGlyph('datasource')}
            <span>{`${ds.name || ds.id} [${ds.id}]`}</span>
          </div>
        ),
        children: (ds.schema ?? ds.fields ?? []).map((field) => ({
          key: `${ds.id}.${field.name}`,
          searchText: `${ds.id} ${ds.name} ${field.name} ${field.label ?? ''} ${field.type}`,
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
      key: 'dictionary-system-variables',
      searchText: t('leftPanel.systemVariables'),
      title: (
        <div className="rd-dictionary-node">
          {renderDictionaryGlyph('system')}
          <span>{t('leftPanel.systemVariables')}</span>
        </div>
      ),
      children: [
        { key: 'sys.Today', searchText: 'Today', title: <div className="rd-dictionary-node" draggable onDragStart={(event) => handleExpressionDragStart(event, '{Today}')}>{renderDictionaryGlyph('system')}<span>{'{Today}'}</span></div> },
        { key: 'sys.PageNumber', searchText: 'PageNumber', title: <div className="rd-dictionary-node" draggable onDragStart={(event) => handleExpressionDragStart(event, '{PageNumber}')}>{renderDictionaryGlyph('system')}<span>{'{PageNumber}'}</span></div> },
        { key: 'sys.TotalPages', searchText: 'TotalPages', title: <div className="rd-dictionary-node" draggable onDragStart={(event) => handleExpressionDragStart(event, '{TotalPages}')}>{renderDictionaryGlyph('system')}<span>{'{TotalPages}'}</span></div> },
      ],
    },
    {
      key: 'dictionary-functions',
      searchText: t('leftPanel.functions'),
      title: (
        <div className="rd-dictionary-node">
          {renderDictionaryGlyph('function')}
          <span>{t('leftPanel.functions')}</span>
        </div>
      ),
      children: [
        { key: 'function.Sum', searchText: 'SUM', title: <div className="rd-dictionary-node" draggable onDragStart={(event) => handleExpressionDragStart(event, '{SUM()}')}>{renderDictionaryGlyph('function')}<span>SUM</span></div> },
        { key: 'function.Count', searchText: 'COUNT', title: <div className="rd-dictionary-node" draggable onDragStart={(event) => handleExpressionDragStart(event, '{COUNT()}')}>{renderDictionaryGlyph('function')}<span>COUNT</span></div> },
      ],
    },
  ];

  const treeData = filterTreeNodes(baseTreeData, normalizedSearchTerm);

  return (
    <div className="rd-dictionary-panel" data-testid="dictionary-tree">
      <div className="rd-dictionary-toolbar">
        <PanelSearchBox
          placeholder={t('leftPanel.searchDictionary')}
          value={searchTerm}
          onChange={setSearchTerm}
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

function matchesSearch(values: Array<string | undefined>, query: string) {
  if (!query) {
    return true;
  }
  return values.some(value => value?.toLowerCase().includes(query));
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
        const pageName = page.name || `${t('leftPanel.page')}${pageIndex + 1}`;
        const pageMatches = matchesSearch([pageName, page.id], normalizedSearchTerm);
        return {
          key: page.id,
          title: (
            <div className="rd-report-tree-node rd-report-tree-page-node">
              <div className="rd-report-tree-node-main">
                {renderTreeDocGlyph('page')}
                <span>{pageName}</span>
              </div>
            </div>
          ),
          children: page.bands.map((band) => {
            bandTypeCounters[band.type] = (bandTypeCounters[band.type] ?? 0) + 1;
            const bandIndex = bandTypeCounters[band.type] ?? 1;
            const bandName = `${t(`band.type.${band.type}` as DesignerMessageKey)}${bandIndex}`;
            const bandMatches = pageMatches || matchesSearch([bandName, band.name, band.id, band.type], normalizedSearchTerm);
            const visibleComponents = band.components.filter((comp) => {
              if (!normalizedSearchTerm || bandMatches) {
                return true;
              }

              const componentName = comp.name?.trim() || getComponentNamePrefix(comp.type);
              return matchesSearch([componentName, comp.id, comp.type, getComponentNamePrefix(comp.type)], normalizedSearchTerm);
            });

            if (normalizedSearchTerm && !bandMatches && visibleComponents.length === 0) {
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
      }).filter((pageNode) => !normalizedSearchTerm || (pageNode.children?.length ?? 0) > 0 || matchesSearch([String(pageNode.key)], normalizedSearchTerm)),
    },
  ];

  return (
    <div className="rd-report-tree" data-testid="report-tree">
      <div className="rd-report-tree-header">
        <PanelSearchBox
          placeholder={t('leftPanel.searchReportTree')}
          value={searchTerm}
          onChange={setSearchTerm}
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
