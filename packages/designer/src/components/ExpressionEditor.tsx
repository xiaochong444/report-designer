import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Input, Modal, Space, Tree, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useDesignerI18n, type DesignerMessageKey } from '../i18n';
import { EXPRESSION_FUNCTION_CATEGORIES, FUNCTION_FOLDER_LABELS, formatExpressionFunctionDocumentation } from '../expression/function-catalog';
import type { DesignerLocale } from '../i18n/messages';
import { previewReportExpression, type ExpressionPreviewResult } from '../expression/expression-preview';
import { validateReportExpression, type ExpressionDiagnostic } from '../expression/expression-validation';
import {
  resolveExpressionCatalog,
  type ExpressionCatalogExtensions,
} from '../expression/expression-catalog';
import { useDesignerStore } from '../store/designer-store';
import { ExpressionMonacoEditor } from './expression/ExpressionMonacoEditor';
import { buildFieldPathTree, formatDataFieldExpression, type FieldPathTreeNode } from '../data-source-fields';

type ExpressionCategory = 'expression' | 'data' | 'system';

type TreeNodeMeta = DataNode & {
  searchText?: string;
  insertValue?: string;
  description?: ExpressionTreeDescription;
  children?: TreeNodeMeta[];
};

type ExpressionTreeDescription = {
  title: string;
  body: string;
};

type ExpressionTreeGlyphKind =
  | 'folder'
  | 'field-string'
  | 'field-number'
  | 'field-date'
  | 'field-boolean'
  | 'system'
  | 'function'
  | 'format'
  | 'resource';

const CATEGORY_ITEMS: Array<{ key: ExpressionCategory; labelKey: DesignerMessageKey; subtitleKey: DesignerMessageKey }> = [
  { key: 'expression', labelKey: 'expressionEditor.category.expression', subtitleKey: 'expressionEditor.category.expressionSubtitle' },
  { key: 'data', labelKey: 'expressionEditor.category.data', subtitleKey: 'expressionEditor.category.dataSubtitle' },
  { key: 'system', labelKey: 'expressionEditor.category.system', subtitleKey: 'expressionEditor.category.systemSubtitle' },
];

function makeTreeNode(
  key: string,
  label: string,
  kind: ExpressionTreeGlyphKind,
  options?: { insertValue?: string; searchText?: string; description?: ExpressionTreeDescription; children?: TreeNodeMeta[] },
): TreeNodeMeta {
  return {
    key: safeTreeKey(key),
    searchText: options?.searchText ?? label.toLowerCase(),
    insertValue: options?.insertValue,
    description: options?.description,
    title: (
      <div className="rd-expression-tree-node">
        <span className={`rd-expression-tree-glyph rd-expression-tree-glyph-${kind}`} aria-hidden />
        <span>{label}</span>
      </div>
    ),
    children: options?.children,
  };
}

function localizedDescriptionText(description: Record<DesignerLocale, string>, locale: DesignerLocale): string {
  return description[locale];
}

function getExpressionFieldGlyphKind(type: string | undefined): ExpressionTreeGlyphKind {
  const normalizedType = type?.toLowerCase();
  if (normalizedType === 'number' || normalizedType === 'integer' || normalizedType === 'decimal') {
    return 'field-number';
  }
  if (normalizedType === 'date' || normalizedType === 'datetime') {
    return 'field-date';
  }
  if (normalizedType === 'boolean' || normalizedType === 'bool') {
    return 'field-boolean';
  }
  return 'field-string';
}

function safeTreeKey(key: string) {
  return key.replace(/[^A-Za-z0-9_-]/g, '_');
}

function filterTreeNodes(nodes: TreeNodeMeta[], query: string): TreeNodeMeta[] {
  if (!query) return nodes;

  return nodes
    .map((node) => {
      const children = node.children ? filterTreeNodes(node.children, query) : [];
      if ((node.searchText ?? '').includes(query) || children.length > 0) {
        return { ...node, children };
      }
      return null;
    })
    .filter(Boolean) as TreeNodeMeta[];
}

function collectExpandableTreeKeys(nodes: TreeNodeMeta[]): React.Key[] {
  return nodes.flatMap((node) => {
    const childKeys = node.children ? collectExpandableTreeKeys(node.children) : [];
    return node.children && node.children.length > 0 ? [node.key, ...childKeys] : childKeys;
  });
}

function buildExpressionFieldNodes(dataSourceId: string, nodes: FieldPathTreeNode[]): TreeNodeMeta[] {
  return nodes.map((node) => {
    if (!node.field) {
      return makeTreeNode(`${dataSourceId}.${node.path}`, node.label, 'folder', {
        searchText: node.searchText,
        children: buildExpressionFieldNodes(dataSourceId, node.children ?? []),
      });
    }

    return makeTreeNode(`${dataSourceId}.${node.field.name}`, node.label, getExpressionFieldGlyphKind(node.field.type), {
      insertValue: formatDataFieldExpression(dataSourceId, node.field.name),
      searchText: node.searchText,
    });
  });
}

function snippetToPlainText(insertText: string) {
  return insertText.replace(/\$\{\d+:([^}]+)\}/g, '$1');
}

function formatDiagnostics(diagnostics: ExpressionDiagnostic[]) {
  return diagnostics.map(item => item.message).join('\n');
}

export const ExpressionEditor: React.FC<{
  open: boolean;
  value: string;
  expressionExtensions?: ExpressionCatalogExtensions;
  onChange: (value: string) => void;
  onClose: () => void;
}> = ({ open, value, expressionExtensions, onChange, onClose }) => {
  const { locale, t } = useDesignerI18n();
  const template = useDesignerStore((state) => state.template);
  const expressionCatalog = useMemo(() => resolveExpressionCatalog(expressionExtensions), [expressionExtensions]);
  const [expression, setExpression] = useState(value);
  const [activeCategory, setActiveCategory] = useState<ExpressionCategory>('expression');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTreeKeys, setExpandedTreeKeys] = useState<React.Key[]>([]);
  const [selectedTreeDescription, setSelectedTreeDescription] = useState<ExpressionTreeDescription | null>(null);
  const [diagnostics, setDiagnostics] = useState<ExpressionDiagnostic[]>([]);
  const [previewResult, setPreviewResult] = useState<ExpressionPreviewResult | null>(null);

  useEffect(() => {
    if (open) {
      setExpression(value);
      setSearchTerm('');
      setExpandedTreeKeys([]);
      setSelectedTreeDescription(null);
      setDiagnostics([]);
      setPreviewResult(null);
    }
  }, [open, value]);

  const insertAtCursor = (text: string) => {
    setExpression((current) => `${current}${snippetToPlainText(text)}`);
    setPreviewResult(null);
  };

  const dataSourceNodes = useMemo<TreeNodeMeta[]>(
    () => {
      const rootSource = template.dataSources.find(dataSource => dataSource.id === 'root') ?? template.dataSources[0];
      const rootFieldNodes = rootSource
        ? buildExpressionFieldNodes(rootSource.id, buildFieldPathTree(rootSource))
        : [];
      return rootFieldNodes;
    },
    [template.dataSources],
  );

  const functionNodes = useMemo<TreeNodeMeta[]>(
    () =>
      EXPRESSION_FUNCTION_CATEGORIES
        .map((category) => {
          const folderLabelKey = FUNCTION_FOLDER_LABELS[category.key] ?? category.labelKey;
          const functions = expressionCatalog.functions.filter(item => item.category === category.key);
          if (functions.length === 0) return null;
          return makeTreeNode(`fn.${category.key}`, t(folderLabelKey as DesignerMessageKey), 'folder', {
            searchText: `${t(folderLabelKey as DesignerMessageKey)} ${category.key}`.toLowerCase(),
            children: functions.map((item) =>
              makeTreeNode(`fn.${category.key}.${item.name}`, item.name, 'function', {
                insertValue: item.insertText,
                searchText: `${item.name} ${item.description[locale]}`.toLowerCase(),
                description: {
                  title: item.name,
                  body: formatExpressionFunctionDocumentation(item, locale),
                },
              }),
            ),
          });
        })
        .filter(Boolean) as TreeNodeMeta[],
    [expressionCatalog.functions, locale, t],
  );

  const systemNodes = useMemo<TreeNodeMeta[]>(
    () =>
      expressionCatalog.variables.map((item) =>
        makeTreeNode(`sys.${item.name}`, item.name, 'system', {
          insertValue: item.insertText ?? item.name,
          searchText: `${item.name} ${localizedDescriptionText(item.description, locale)}`.toLowerCase(),
          description: {
            title: item.name,
            body: localizedDescriptionText(item.description, locale),
          },
        }),
      ),
    [expressionCatalog.variables, locale],
  );

  const formatNodes = useMemo<TreeNodeMeta[]>(
    () =>
      expressionCatalog.formats.map((item) =>
        makeTreeNode(`format.${item.name}`, item.name, 'format', {
          insertValue: item.insertText,
          searchText: `${item.name} ${localizedDescriptionText(item.description, locale)}`.toLowerCase(),
          description: {
            title: item.name,
            body: localizedDescriptionText(item.description, locale),
          },
        }),
      ),
    [expressionCatalog.formats, locale],
  );

  const treeData = useMemo<TreeNodeMeta[]>(() => {
    switch (activeCategory) {
      case 'data':
        return [makeTreeNode('tree.data', t('leftPanel.dataSources'), 'folder', { children: dataSourceNodes })];
      case 'system':
        return [makeTreeNode('tree.system', t('leftPanel.systemVariables'), 'folder', { children: systemNodes })];
      case 'expression':
      default:
        return [
          makeTreeNode('tree.data', t('leftPanel.dataSources'), 'folder', { children: dataSourceNodes }),
          makeTreeNode('tree.system', t('leftPanel.systemVariables'), 'folder', { children: systemNodes }),
          makeTreeNode('tree.function', t('leftPanel.functions'), 'folder', { children: functionNodes }),
          makeTreeNode('tree.format', t('styleLibrary.format'), 'folder', { children: formatNodes }),
        ];
    }
  }, [activeCategory, dataSourceNodes, formatNodes, functionNodes, systemNodes, t]);

  const filteredTree = useMemo(
    () => filterTreeNodes(treeData, searchTerm.trim().toLowerCase()),
    [searchTerm, treeData],
  );
  const normalizedSearchTerm = searchTerm.trim();
  const visibleExpandedTreeKeys = useMemo(
    () => (normalizedSearchTerm || expandedTreeKeys.length === 0 ? collectExpandableTreeKeys(filteredTree) : expandedTreeKeys),
    [expandedTreeKeys, filteredTree, normalizedSearchTerm],
  );

  const handleTreeSelect = (_keys: React.Key[], info: { node: TreeNodeMeta }) => {
    setSelectedTreeDescription(info.node.description ?? null);
    if (info.node.insertValue) {
      insertAtCursor(info.node.insertValue);
    }
  };

  const handleOk = () => {
    onChange(expression);
    onClose();
  };

  const handleCancel = () => {
    setExpression(value);
    onClose();
  };

  const runValidation = () => {
    setPreviewResult(null);
    setDiagnostics(validateReportExpression(expression, template, expressionExtensions));
  };

  const runExpression = () => {
    setDiagnostics(validateReportExpression(expression, template, expressionExtensions));
    setPreviewResult(previewReportExpression(expression, template, expressionExtensions));
  };

  return (
    <Modal
      title={t('expressionEditor.title')}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      width={1040}
      okText={t('common.ok')}
      cancelText={t('common.cancel')}
      destroyOnHidden
    >
      <div className="rd-expression-editor">
        <aside className="rd-expression-rail">
          {CATEGORY_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`rd-expression-rail-item ${activeCategory === item.key ? 'rd-expression-rail-item-active' : ''}`}
              onClick={() => {
                setActiveCategory(item.key);
                setSearchTerm('');
                setExpandedTreeKeys([]);
                setSelectedTreeDescription(null);
              }}
            >
              <span className={`rd-expression-tree-glyph rd-expression-tree-glyph-${item.key}`} aria-hidden />
              <span className="rd-expression-rail-copy">
                <span>{t(item.labelKey)}</span>
                <span>{t(item.subtitleKey)}</span>
              </span>
            </button>
          ))}
        </aside>

        <section className="rd-expression-editor-main">
          <div className="rd-expression-monaco-host">
            <ExpressionMonacoEditor
              ariaLabel={t('expressionEditor.inline.expression')}
              value={expression}
              template={template}
              locale={locale}
              expressionExtensions={expressionExtensions}
              height="100%"
              onChange={(nextValue) => {
                setExpression(nextValue);
                setPreviewResult(null);
              }}
              onDiagnostics={setDiagnostics}
            />
          </div>
          <div className="rd-expression-editor-footer">
            <div className="rd-expression-editor-result">
              {diagnostics.length > 0 ? (
                <Alert type="error" showIcon title={formatDiagnostics(diagnostics)} />
              ) : previewResult?.ok ? (
                <Alert type="success" showIcon title={`${t('expressionEditor.runResult')}: ${String(previewResult.value)}`} />
              ) : previewResult ? (
                <Alert type="error" showIcon title={previewResult.message} />
              ) : (
                <Typography.Text type="secondary">{t('expressionEditor.noDiagnostics')}</Typography.Text>
              )}
            </div>
            <Space size={6}>
              <Button size="small" aria-label={t('expressionEditor.validate')} onClick={runValidation}>
                {t('expressionEditor.validate')}
              </Button>
              <Button size="small" aria-label={t('expressionEditor.run')} onClick={runExpression}>
                {t('expressionEditor.run')}
              </Button>
            </Space>
          </div>
        </section>

        <aside className="rd-expression-browser">
          <Input.Search
            allowClear
            size="small"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <div className="rd-expression-browser-tree">
            <Tree
              key={activeCategory}
              className="rd-expression-tree"
              treeData={filteredTree}
              expandedKeys={visibleExpandedTreeKeys}
              onExpand={setExpandedTreeKeys}
              blockNode
              onSelect={handleTreeSelect}
            />
          </div>
          {selectedTreeDescription ? (
            <div className="rd-expression-tree-description" data-testid="expression-tree-description">
              <div className="rd-expression-tree-description-title">{selectedTreeDescription.title}</div>
              <div className="rd-expression-tree-description-body">{selectedTreeDescription.body}</div>
            </div>
          ) : null}
        </aside>
      </div>
    </Modal>
  );
};
