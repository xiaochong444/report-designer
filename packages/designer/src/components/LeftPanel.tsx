import React from 'react';
import { Tabs, Tree, Tooltip } from 'antd';
import {
  FileTextOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { useDesignerStore } from '../store/designer-store';
import type { ReportComponent, BandType, TableComponent, ReportTemplate } from '@report-designer/core';
import { getBandDisplayName, getComponentNamePrefix } from '../report-structure';
import { useEffect, useMemo, useState } from 'react';
import { useDesignerI18n, type DesignerMessageKey } from '../i18n';
import { createDefaultComponent, createFieldExpressionComponent, createTextExpressionComponent } from '../component-factory';
import { PanelSearchBox } from './panels/PanelSearchBox';
import { COMPONENT_GROUPS, COMPONENT_TYPES } from '../component-palette-model';
import { buildFieldPathTree, type FieldPathTreeNode } from '../data-source-fields';
import {
  resolveExpressionCatalog,
  type ExpressionCatalogExtensions,
} from '../expression/expression-catalog';
import { EXPRESSION_FUNCTION_CATEGORIES, FUNCTION_FOLDER_LABELS } from '../expression/function-catalog';
import { normalizeTable } from '../table/table-structure';

export type LeftPanelTabKey = 'palette' | 'data' | 'tree';

interface LeftPanelProps {
  activeTab?: LeftPanelTabKey;
  expressionExtensions?: ExpressionCatalogExtensions;
  onActiveTabChange?: (key: LeftPanelTabKey) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ activeTab, expressionExtensions, onActiveTabChange }) => {
  const { t } = useDesignerI18n();
  const [internalActiveTab, setInternalActiveTab] = useState<LeftPanelTabKey>('tree');
  const currentActiveTab = activeTab ?? internalActiveTab;

  const handleTabChange = (key: string) => {
    const nextKey = key as LeftPanelTabKey;
    setInternalActiveTab(nextKey);
    onActiveTabChange?.(nextKey);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0 6px 6px' }}>
      <Tabs
        size="small"
        activeKey={currentActiveTab}
        onChange={handleTabChange}
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
            children: <DataDictionary expressionExtensions={expressionExtensions} />,
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

function collectExpandableDictionaryKeys(nodes: SearchableDataNode[]): React.Key[] {
  return nodes.flatMap((node) => {
    const childKeys = node.children ? collectExpandableDictionaryKeys(node.children) : [];
    return node.children && node.children.length > 0 ? [node.key, ...childKeys] : childKeys;
  });
}

function renderDictionaryFieldNodes(
  nodes: FieldPathTreeNode[],
  onFieldDragStart: (event: React.DragEvent, sourceId: string, fieldName: string, fieldType: string) => void,
): SearchableDataNode[] {
  return nodes.map((node) => {
    const isField = Boolean(node.field);
    return {
      key: node.key,
      searchText: node.searchText,
      title: (
        <div
          className={isField ? 'rd-dictionary-node rd-dictionary-node-field' : 'rd-dictionary-node'}
          draggable={isField}
          onDragStart={isField
            ? (event) => onFieldDragStart(event, node.sourceId, node.field!.name, node.field!.type)
            : undefined}
        >
          {renderDictionaryGlyph(isField ? `field-${node.field!.type}` as DictionaryNodeKind : 'folder')}
          <span>{node.label}</span>
        </div>
      ),
      children: node.children
        ? renderDictionaryFieldNodes(node.children, onFieldDragStart)
        : undefined,
    };
  });
}

const DataDictionary: React.FC<{ expressionExtensions?: ExpressionCatalogExtensions }> = ({ expressionExtensions }) => {
  const { locale, t } = useDesignerI18n();
  const dataSources = useDesignerStore(s => s.template.dataSources);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const expressionCatalog = useMemo(() => resolveExpressionCatalog(expressionExtensions), [expressionExtensions]);

  const handleFieldDragStart = (e: React.DragEvent, dsId: string, fieldName: string, fieldType: string) => {
    e.dataTransfer.setData('fieldBinding', JSON.stringify({ dataSourceId: dsId, fieldName, fieldType }));
    e.dataTransfer.effectAllowed = 'copy';
  };
  const handleExpressionDragStart = (e: React.DragEvent, expression: string) => {
    e.dataTransfer.setData('expressionBinding', expression);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const rootSource = dataSources.find(source => source.id === 'root') ?? dataSources[0];
  const rootFieldNodes = rootSource
    ? renderDictionaryFieldNodes(buildFieldPathTree(rootSource), handleFieldDragStart)
    : [];
  const systemVariableNodes = expressionCatalog.variables.map((item) => ({
    key: safeDictionaryKey(`sys.${item.name}`),
    searchText: `${item.name} ${item.description[locale]}`.toLowerCase(),
    title: (
      <div
        className="rd-dictionary-node"
        draggable
        onDragStart={(event) => handleExpressionDragStart(event, item.insertText ?? item.name)}
      >
        {renderDictionaryGlyph('system')}
        <span>{item.name}</span>
      </div>
    ),
  }));
  const functionNodes = EXPRESSION_FUNCTION_CATEGORIES
    .map((category) => {
      const functions = expressionCatalog.functions.filter(item => item.category === category.key);
      if (functions.length === 0) return null;
      const folderLabelKey = FUNCTION_FOLDER_LABELS[category.key] ?? category.labelKey;
      const folderLabel = t(folderLabelKey as DesignerMessageKey);

      return {
        key: safeDictionaryKey(`function.${category.key}`),
        searchText: `${folderLabel} ${category.key}`.toLowerCase(),
        title: (
          <div className="rd-dictionary-node">
            {renderDictionaryGlyph('folder')}
            <span>{folderLabel}</span>
          </div>
        ),
        children: functions.map((item) => ({
          key: safeDictionaryKey(`function.${category.key}.${item.name}`),
          searchText: `${item.name} ${item.description[locale]} ${item.signature}`.toLowerCase(),
          title: (
            <div
              className="rd-dictionary-node"
              draggable
              onDragStart={(event) => handleExpressionDragStart(event, snippetToPlainText(item.insertText))}
            >
              {renderDictionaryGlyph('function')}
              <span>{item.name}</span>
            </div>
          ),
        })),
      };
    })
    .filter(Boolean) as SearchableDataNode[];
  const formatNodes = expressionCatalog.formats.map((item) => ({
    key: safeDictionaryKey(`format.${item.name}`),
    searchText: `${item.name} ${item.detail[locale]} ${item.description[locale]}`.toLowerCase(),
    title: (
      <div
        className="rd-dictionary-node"
        draggable
        onDragStart={(event) => handleExpressionDragStart(event, snippetToPlainText(item.insertText))}
      >
        {renderDictionaryGlyph('format')}
        <span>{item.name}</span>
      </div>
    ),
  }));

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
      children: rootFieldNodes,
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
      children: systemVariableNodes,
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
      children: functionNodes,
    },
    {
      key: 'dictionary-formats',
      searchText: t('styleLibrary.format'),
      title: (
        <div className="rd-dictionary-node">
          {renderDictionaryGlyph('format')}
          <span>{t('styleLibrary.format')}</span>
        </div>
      ),
      children: formatNodes,
    },
  ];

  const treeData = filterTreeNodes(baseTreeData, normalizedSearchTerm);
  const visibleExpandedKeys = normalizedSearchTerm
    ? collectExpandableDictionaryKeys(treeData)
    : expandedKeys;

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
        expandedKeys={visibleExpandedKeys}
        onExpand={(keys) => setExpandedKeys(keys)}
        blockNode
      />
    </div>
  );
};

function safeDictionaryKey(key: string) {
  return key.replace(/[^A-Za-z0-9_-]/g, '_');
}

function snippetToPlainText(insertText: string) {
  return insertText.replace(/\$\{\d+:([^}]+)\}/g, '$1');
}

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
    case 'chart':
      return <span {...props} />;
    case 'barcode':
      return <span {...props} />;
    case 'qrcode':
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

function tableRowKey(tableId: string, rowIndex: number) {
  return `${tableId}::row::${rowIndex}`;
}

function tableCellKey(tableId: string, rowIndex: number, columnIndex: number) {
  return `${tableId}::cell::${rowIndex}::${columnIndex}`;
}

function parseTableTreeKey(key: string):
  | { type: 'row'; tableId: string; row: number }
  | { type: 'cell'; tableId: string; row: number; column: number }
  | null {
  const parts = key.split('::');
  if (parts.length === 3 && parts[1] === 'row') {
    const row = Number(parts[2]);
    return Number.isInteger(row) ? { type: 'row', tableId: parts[0], row } : null;
  }
  if (parts.length === 4 && parts[1] === 'cell') {
    const row = Number(parts[2]);
    const column = Number(parts[3]);
    return Number.isInteger(row) && Number.isInteger(column) ? { type: 'cell', tableId: parts[0], row, column } : null;
  }
  return null;
}

function treeTitle(key: React.Key, children: React.ReactNode) {
  return (
    <div data-report-tree-key={String(key)}>
      {children}
    </div>
  );
}

function collectExpandableTreeKeys(nodes: DataNode[]): string[] {
  const keys: string[] = [];
  const visit = (items: DataNode[]) => {
    for (const item of items) {
      if (item.children && item.children.length > 0) {
        keys.push(String(item.key));
        visit(item.children);
      }
    }
  };
  visit(nodes);
  return keys;
}

function findComponentLocation(template: ReportTemplate, componentId: string) {
  for (const page of template.pages) {
    for (const band of page.bands) {
      const component = band.components.find(item => item.id === componentId);
      if (component) {
        return { pageId: page.id, bandId: band.id, component };
      }
    }
  }
  return null;
}

function findBandLocation(template: ReportTemplate, bandId: string) {
  for (const page of template.pages) {
    const band = page.bands.find(item => item.id === bandId);
    if (band) {
      return { pageId: page.id, bandId: band.id };
    }
  }
  return null;
}

function getSelectedTreeExpansionKeys(
  template: ReportTemplate,
  selectedComponentIds: string[],
  selectedBandId: string | null,
  selectedTableRow: { tableId: string; row: number } | null,
  selectedTableCell: { tableId: string; startRow: number } | null,
): string[] {
  if (selectedTableCell) {
    const location = findComponentLocation(template, selectedTableCell.tableId);
    return location ? ['report-root', location.pageId, location.bandId, selectedTableCell.tableId, tableRowKey(selectedTableCell.tableId, selectedTableCell.startRow)] : [];
  }
  if (selectedTableRow) {
    const location = findComponentLocation(template, selectedTableRow.tableId);
    return location ? ['report-root', location.pageId, location.bandId, selectedTableRow.tableId] : [];
  }
  if (selectedComponentIds.length > 0) {
    const location = findComponentLocation(template, selectedComponentIds[0]);
    return location ? ['report-root', location.pageId, location.bandId] : [];
  }
  if (selectedBandId) {
    const location = findBandLocation(template, selectedBandId);
    return location ? ['report-root', location.pageId] : [];
  }
  return [];
}

function tableStructureMatches(component: ReportComponent, query: string): boolean {
  if (!query || component.type !== 'table') return false;
  const table = normalizeTable(component as TableComponent);
  return (table.rows ?? []).some((row, rowIndex) => {
    const rowName = `row ${rowIndex + 1}`;
    if (rowName.toLowerCase().includes(query)) return true;
    return row.cells.some((cell, columnIndex) => {
      const cellName = `cell ${rowIndex + 1}.${columnIndex + 1} ${cell.text ?? ''}`;
      return cellName.toLowerCase().includes(query);
    });
  });
}

const PageTree: React.FC = () => {
  const { t } = useDesignerI18n();
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const selectedComponentIds = useDesignerStore(s => s.selectedComponentIds);
  const selectedBandId = useDesignerStore(s => s.selectedBandId);
  const selectedTableRow = useDesignerStore(s => s.selectedTableRow);
  const selectedTableCell = useDesignerStore(s => s.selectedTableCell);
  const selectComponents = useDesignerStore(s => s.selectComponents);
  const selectBand = useDesignerStore(s => s.selectBand);
  const selectTableRow = useDesignerStore(s => s.selectTableRow);
  const selectTableCell = useDesignerStore(s => s.selectTableCell);

  const [searchTerm, setSearchTerm] = useState('');
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const selectedKeys = selectedTableCell
    ? [tableCellKey(selectedTableCell.tableId, selectedTableCell.startRow, selectedTableCell.startColumn)]
    : selectedTableRow
      ? [tableRowKey(selectedTableRow.tableId, selectedTableRow.row)]
      : selectedComponentIds.length > 0
        ? selectedComponentIds
        : selectedBandId
          ? [selectedBandId]
          : [currentPageId];

  const treeData: DataNode[] = [
    {
      key: 'report-root',
      selectable: false,
      title: treeTitle('report-root', (
        <div className="rd-report-tree-root" data-testid="report-tree-root">
          {renderTreeDocGlyph('report')}
          <span>{template.name || t('shell.untitledReport')}</span>
        </div>
      )),
      children: template.pages.map((page, pageIndex) => {
        const bandTypeCounters: Partial<Record<BandType, number>> = {};
        const pageName = page.name || `${t('leftPanel.page')}${pageIndex + 1}`;
        const pageMatches = matchesSearch([pageName, page.id], normalizedSearchTerm);
        return {
          key: page.id,
          title: treeTitle(page.id, (
            <div className="rd-report-tree-node rd-report-tree-page-node">
              <div className="rd-report-tree-node-main">
                {renderTreeDocGlyph('page')}
                <span>{pageName}</span>
              </div>
            </div>
          )),
          children: page.bands.map((band) => {
            bandTypeCounters[band.type] = (bandTypeCounters[band.type] ?? 0) + 1;
            const bandIndex = bandTypeCounters[band.type] ?? 1;
            const bandName = getBandDisplayName(band, bandIndex);
            const bandMatches = pageMatches || matchesSearch([bandName, band.name, band.id, band.type], normalizedSearchTerm);
            const visibleComponents = band.components.filter((comp) => {
              if (!normalizedSearchTerm || bandMatches) {
                return true;
              }

              const componentName = comp.name?.trim() || getComponentNamePrefix(comp.type);
              return matchesSearch([componentName, comp.id, comp.type, getComponentNamePrefix(comp.type)], normalizedSearchTerm)
                || tableStructureMatches(comp, normalizedSearchTerm);
            });

            if (normalizedSearchTerm && !bandMatches && visibleComponents.length === 0) {
              return null;
            }

            return {
              key: band.id,
              title: treeTitle(band.id, (
                <div
                  className="rd-report-tree-node rd-report-tree-band-node"
                  data-testid={`report-tree-band-${band.id}`}
                >
                  <div className="rd-report-tree-node-main">
                    <span className={`rd-report-tree-band-swatch rd-report-tree-band-${band.type}`} />
                    <span>{bandName}</span>
                  </div>
                </div>
              )),
              children: visibleComponents.map((comp) => componentTreeNode(comp)),
            };
          }).filter(Boolean) as DataNode[],
        };
      }).filter((pageNode) => !normalizedSearchTerm || (pageNode.children?.length ?? 0) > 0 || matchesSearch([String(pageNode.key)], normalizedSearchTerm)),
    },
  ];
  const visibleExpandedKeys = normalizedSearchTerm ? collectExpandableTreeKeys(treeData) : expandedKeys;

  useEffect(() => {
    if (normalizedSearchTerm) return;
    const selectedExpansionKeys = getSelectedTreeExpansionKeys(template, selectedComponentIds, selectedBandId, selectedTableRow, selectedTableCell);
    setExpandedKeys(previousKeys => {
      if (previousKeys.length === selectedExpansionKeys.length && previousKeys.every((key, index) => key === selectedExpansionKeys[index])) {
        return previousKeys;
      }
      return selectedExpansionKeys;
    });
  }, [normalizedSearchTerm, selectedBandId, selectedComponentIds, selectedTableCell, selectedTableRow, template]);

  useEffect(() => {
    const selectedKey = selectedKeys[0];
    if (!selectedKey) return;
    const timer = window.setTimeout(() => {
      const node = Array.from(document.querySelectorAll<HTMLElement>('[data-report-tree-key]'))
        .find(element => element.getAttribute('data-report-tree-key') === String(selectedKey));
      if (typeof node?.scrollIntoView === 'function') {
        node.scrollIntoView({ block: 'nearest' });
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedKeys, visibleExpandedKeys]);

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
          expandedKeys={visibleExpandedKeys}
          selectedKeys={selectedKeys}
          onExpand={(keys) => setExpandedKeys(keys as string[])}
          onSelect={(keys) => {
            if (keys.length > 0) {
              const key = keys[0] as string;
              if (key === 'report-root') return;
              const tableTreeKey = parseTableTreeKey(key);
              if (tableTreeKey) {
                const band = template.pages.flatMap(p => p.bands).find(item => item.components.some(component => component.id === tableTreeKey.tableId));
                if (!band) return;
                selectBand(null);
                if (tableTreeKey.type === 'row') {
                  selectTableRow({ tableId: tableTreeKey.tableId, bandId: band.id, row: tableTreeKey.row });
                } else {
                  selectTableCell({
                    tableId: tableTreeKey.tableId,
                    bandId: band.id,
                    startRow: tableTreeKey.row,
                    startColumn: tableTreeKey.column,
                    endRow: tableTreeKey.row,
                    endColumn: tableTreeKey.column,
                  });
                }
                return;
              }
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

  function componentTreeNode(comp: ReportComponent): DataNode {
    const children = comp.type === 'table'
      ? (normalizeTable(comp as TableComponent).rows ?? []).map((row, rowIndex) => ({
          key: tableRowKey(comp.id, rowIndex),
          title: treeTitle(tableRowKey(comp.id, rowIndex), (
            <div className="rd-report-tree-node rd-report-tree-table-row-node" data-testid={`report-tree-table-row-${comp.id}-${rowIndex}`}>
              <div className="rd-report-tree-node-main">
                <span className="rd-report-tree-glyph rd-report-tree-glyph-table-row" aria-hidden />
                <span>{`Row ${rowIndex + 1}`}</span>
              </div>
            </div>
          )),
          children: row.cells.map((cell, columnIndex) => ({
            key: tableCellKey(comp.id, rowIndex, columnIndex),
            title: treeTitle(tableCellKey(comp.id, rowIndex, columnIndex), (
              <div className="rd-report-tree-node rd-report-tree-table-cell-node" data-testid={`report-tree-table-cell-${comp.id}-${rowIndex}-${columnIndex}`}>
                <div className="rd-report-tree-node-main">
                  <span className="rd-report-tree-glyph rd-report-tree-glyph-table-cell" aria-hidden />
                  <span>{`Cell ${columnIndex + 1}`}</span>
                </div>
              </div>
            )),
          })),
        }))
      : undefined;
    return {
      key: comp.id,
      title: treeTitle(comp.id, (
        <div className="rd-report-tree-node rd-report-tree-component-node" data-testid={`report-tree-component-${comp.id}`}>
          <div className="rd-report-tree-node-main">
            {renderComponentTreeIcon(comp.type)}
            <span>{comp.name?.trim() || getComponentNamePrefix(comp.type)}</span>
          </div>
        </div>
      )),
      children,
    };
  }
};
