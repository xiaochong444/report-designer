import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Input, Modal, Space, Tree, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useDesignerI18n, type DesignerMessageKey } from '../i18n';
import { EXPRESSION_FUNCTION_CATEGORIES, getExpressionFunctionsByCategory } from '../expression/function-catalog';
import { previewReportExpression, type ExpressionPreviewResult } from '../expression/expression-preview';
import { validateReportExpression, type ExpressionDiagnostic } from '../expression/expression-validation';
import { useDesignerStore } from '../store/designer-store';
import { ExpressionMonacoEditor } from './expression/ExpressionMonacoEditor';

const SYSTEM_VARIABLES = [
  { name: '{Today}', insert: '{Today}' },
  { name: '{PageNumber}', insert: '{PageNumber}' },
  { name: '{TotalPages}', insert: '{TotalPages}' },
  { name: '{Line}', insert: '{Line}' },
];

const FORMAT_PATTERNS = [
  { name: 'FORMAT("N2", value)', insert: 'FORMAT("N2", value)' },
  { name: 'FORMAT("C", value)', insert: 'FORMAT("C", value)' },
  { name: 'FORMAT("D", value)', insert: 'FORMAT("D", value)' },
  { name: '#,##0.00', insert: '#,##0.00' },
  { name: 'yyyy-MM-dd', insert: 'yyyy-MM-dd' },
  { name: 'yyyy-MM-dd HH:mm:ss', insert: 'yyyy-MM-dd HH:mm:ss' },
  { name: '0.00%', insert: '0.00%' },
];

type ExpressionCategory = 'expression' | 'data' | 'system';

type TreeNodeMeta = DataNode & {
  searchText?: string;
  insertValue?: string;
  children?: TreeNodeMeta[];
};

const CATEGORY_ITEMS: Array<{ key: ExpressionCategory; labelKey: DesignerMessageKey; subtitleKey: DesignerMessageKey }> = [
  { key: 'expression', labelKey: 'expressionEditor.category.expression', subtitleKey: 'expressionEditor.category.expressionSubtitle' },
  { key: 'data', labelKey: 'expressionEditor.category.data', subtitleKey: 'expressionEditor.category.dataSubtitle' },
  { key: 'system', labelKey: 'expressionEditor.category.system', subtitleKey: 'expressionEditor.category.systemSubtitle' },
];

const FUNCTION_FOLDER_LABELS: Partial<Record<string, DesignerMessageKey>> = {
  aggregate: 'expressionEditor.tree.aggregateFunctions',
  logic: 'expressionEditor.tree.logicFunctions',
  money: 'expressionEditor.tree.moneyFunctions',
};

function makeTreeNode(
  key: string,
  label: string,
  kind: 'folder' | 'field' | 'system' | 'function' | 'format' | 'resource',
  options?: { insertValue?: string; searchText?: string; children?: TreeNodeMeta[] },
): TreeNodeMeta {
  return {
    key: safeTreeKey(key),
    searchText: options?.searchText ?? label.toLowerCase(),
    insertValue: options?.insertValue,
    title: (
      <div className="rd-expression-tree-node">
        <span className={`rd-expression-tree-glyph rd-expression-tree-glyph-${kind}`} aria-hidden />
        <span>{label}</span>
      </div>
    ),
    children: options?.children,
  };
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

function snippetToPlainText(insertText: string) {
  return insertText.replace(/\$\{\d+:([^}]+)\}/g, '$1');
}

function formatDiagnostics(diagnostics: ExpressionDiagnostic[]) {
  return diagnostics.map(item => item.message).join('\n');
}

export const ExpressionEditor: React.FC<{
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}> = ({ open, value, onChange, onClose }) => {
  const { locale, t } = useDesignerI18n();
  const template = useDesignerStore((state) => state.template);
  const [expression, setExpression] = useState(value);
  const [activeCategory, setActiveCategory] = useState<ExpressionCategory>('expression');
  const [searchTerm, setSearchTerm] = useState('');
  const [diagnostics, setDiagnostics] = useState<ExpressionDiagnostic[]>([]);
  const [previewResult, setPreviewResult] = useState<ExpressionPreviewResult | null>(null);

  useEffect(() => {
    if (open) {
      setExpression(value);
      setSearchTerm('');
      setDiagnostics([]);
      setPreviewResult(null);
    }
  }, [open, value]);

  const insertAtCursor = (text: string) => {
    setExpression((current) => `${current}${snippetToPlainText(text)}`);
    setPreviewResult(null);
  };

  const dataSourceNodes = useMemo<TreeNodeMeta[]>(
    () =>
      template.dataSources.map((dataSource) =>
        makeTreeNode(`ds.${dataSource.id}`, dataSource.name, 'folder', {
          searchText: `${dataSource.name} ${dataSource.id}`.toLowerCase(),
          children: (dataSource.schema ?? dataSource.fields ?? []).map((field) =>
            makeTreeNode(`${dataSource.id}.${field.name}`, `${dataSource.id}.${field.name}`, 'field', {
              insertValue: `{${dataSource.id}.${field.name}}`,
              searchText: `${dataSource.id}.${field.name} ${field.label ?? ''}`.toLowerCase(),
            }),
          ),
        }),
      ),
    [template.dataSources],
  );

  const functionNodes = useMemo<TreeNodeMeta[]>(
    () =>
      EXPRESSION_FUNCTION_CATEGORIES
        .filter(item => item.key !== 'common')
        .map((category) => {
          const folderLabelKey = FUNCTION_FOLDER_LABELS[category.key] ?? category.labelKey;
          return makeTreeNode(`fn.${category.key}`, t(folderLabelKey as DesignerMessageKey), 'folder', {
            searchText: `${t(folderLabelKey as DesignerMessageKey)} ${category.key}`.toLowerCase(),
            children: getExpressionFunctionsByCategory(category.key).map((item) =>
              makeTreeNode(`fn.${category.key}.${item.name}`, item.name, 'function', {
                insertValue: item.insertText,
                searchText: `${item.name} ${item.description[locale]}`.toLowerCase(),
              }),
            ),
          });
        }),
    [locale, t],
  );

  const systemNodes = useMemo<TreeNodeMeta[]>(
    () =>
      SYSTEM_VARIABLES.map((item) =>
        makeTreeNode(`sys.${item.name}`, item.name, 'system', {
          insertValue: item.insert,
          searchText: item.name.toLowerCase(),
        }),
      ),
    [],
  );

  const formatNodes = useMemo<TreeNodeMeta[]>(
    () =>
      FORMAT_PATTERNS.map((item) =>
        makeTreeNode(`format.${item.name}`, item.name, 'format', {
          insertValue: item.insert,
          searchText: item.name.toLowerCase(),
        }),
      ),
    [],
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

  const handleTreeSelect = (_keys: React.Key[], info: { node: TreeNodeMeta }) => {
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
    setDiagnostics(validateReportExpression(expression, template));
  };

  const runPreview = () => {
    setDiagnostics(validateReportExpression(expression, template));
    setPreviewResult(previewReportExpression(expression, template));
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
          <div className="rd-expression-function-strip">
            {EXPRESSION_FUNCTION_CATEGORIES.filter(item => item.key !== 'common').map((item) => (
              <Button
                key={item.key}
                size="small"
                type="text"
                onClick={() => setSearchTerm(t(item.labelKey as DesignerMessageKey).toLowerCase())}
              >
                {t(item.labelKey as DesignerMessageKey)}
              </Button>
            ))}
          </div>
          <ExpressionMonacoEditor
            ariaLabel={t('expressionEditor.inline.expression')}
            value={expression}
            template={template}
            locale={locale}
            onChange={(nextValue) => {
              setExpression(nextValue);
              setPreviewResult(null);
            }}
            onDiagnostics={setDiagnostics}
          />
          <div className="rd-expression-editor-footer">
            <div className="rd-expression-editor-result">
              {diagnostics.length > 0 ? (
                <Alert type="error" showIcon title={formatDiagnostics(diagnostics)} />
              ) : previewResult?.ok ? (
                <Alert type="success" showIcon title={`${t('expressionEditor.result')}: ${String(previewResult.value)}`} />
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
              <Button size="small" aria-label={t('expressionEditor.test')} onClick={runPreview}>
                {t('expressionEditor.test')}
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
              defaultExpandAll
              blockNode
              onSelect={handleTreeSelect}
            />
          </div>
        </aside>
      </div>
    </Modal>
  );
};
