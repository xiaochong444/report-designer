import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Input, Modal, Space, Tree, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useDesignerI18n, type DesignerMessageKey } from '../i18n';
import { EXPRESSION_FUNCTION_CATEGORIES, formatExpressionFunctionDocumentation, getExpressionFunctionsByCategory } from '../expression/function-catalog';
import type { DesignerLocale } from '../i18n/messages';
import { previewReportExpression, type ExpressionPreviewResult } from '../expression/expression-preview';
import { validateReportExpression, type ExpressionDiagnostic } from '../expression/expression-validation';
import { useDesignerStore } from '../store/designer-store';
import { ExpressionMonacoEditor } from './expression/ExpressionMonacoEditor';

const SYSTEM_VARIABLES = [
  {
    name: '{Today}',
    insert: '{Today}',
    description: {
      'zh-CN': '当前日期。返回运行报表时的日期，可用于页眉、页脚和日期字段。',
      'en-US': 'Current date. Returns the date when the report runs and is commonly used in headers, footers, and date fields.',
    },
  },
  {
    name: '{PageNumber}',
    insert: '{PageNumber}',
    description: {
      'zh-CN': '当前页码。渲染和打印时按实际分页结果输出当前页序号。',
      'en-US': 'Current page number. Prints the page index from the actual rendered pagination result.',
    },
  },
  {
    name: '{TotalPages}',
    insert: '{TotalPages}',
    description: {
      'zh-CN': '总页数。渲染完成后输出报表的总页数。',
      'en-US': 'Total pages. Prints the total number of pages after the report has been rendered.',
    },
  },
  {
    name: '{Line}',
    insert: '{Line}',
    description: {
      'zh-CN': '当前数据行序号。通常用于明细区显示行号。',
      'en-US': 'Current line number. Usually used in detail bands to display row numbers.',
    },
  },
];

const FORMAT_PATTERNS = [
  {
    name: 'FORMAT("N2", value)',
    insert: 'FORMAT("N2", value)',
    description: {
      'zh-CN': '将数字格式化为保留两位小数的文本。',
      'en-US': 'Formats a number with two decimal places.',
    },
  },
  {
    name: 'FORMAT("C", value)',
    insert: 'FORMAT("C", value)',
    description: {
      'zh-CN': '将数字格式化为货币文本。',
      'en-US': 'Formats a number as currency text.',
    },
  },
  {
    name: 'FORMAT("D", value)',
    insert: 'FORMAT("D", value)',
    description: {
      'zh-CN': '将日期或时间值格式化为短日期文本。',
      'en-US': 'Formats a date or time value as a short date.',
    },
  },
  {
    name: '#,##0.00',
    insert: '#,##0.00',
    description: {
      'zh-CN': '常用数字格式，包含千分位并保留两位小数。',
      'en-US': 'Common number pattern with group separators and two decimal places.',
    },
  },
  {
    name: 'yyyy-MM-dd',
    insert: 'yyyy-MM-dd',
    description: {
      'zh-CN': '常用日期格式，输出年、月、日。',
      'en-US': 'Common date pattern that prints year, month, and day.',
    },
  },
  {
    name: 'yyyy-MM-dd HH:mm:ss',
    insert: 'yyyy-MM-dd HH:mm:ss',
    description: {
      'zh-CN': '常用日期时间格式，输出日期、小时、分钟和秒。',
      'en-US': 'Common date-time pattern that prints date, hour, minute, and second.',
    },
  },
  {
    name: '0.00%',
    insert: '0.00%',
    description: {
      'zh-CN': '常用百分比格式，保留两位小数。',
      'en-US': 'Common percentage pattern with two decimal places.',
    },
  },
];

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

const FUNCTION_FOLDER_LABELS: Partial<Record<string, DesignerMessageKey>> = {
  aggregate: 'expressionEditor.tree.aggregateFunctions',
  logic: 'expressionEditor.tree.logicFunctions',
  money: 'expressionEditor.tree.moneyFunctions',
};

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
  const [selectedTreeDescription, setSelectedTreeDescription] = useState<ExpressionTreeDescription | null>(null);
  const [diagnostics, setDiagnostics] = useState<ExpressionDiagnostic[]>([]);
  const [previewResult, setPreviewResult] = useState<ExpressionPreviewResult | null>(null);

  useEffect(() => {
    if (open) {
      setExpression(value);
      setSearchTerm('');
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
    () =>
      template.dataSources.map((dataSource) =>
        makeTreeNode(`ds.${dataSource.id}`, dataSource.name, 'folder', {
          searchText: `${dataSource.name} ${dataSource.id}`.toLowerCase(),
          children: (dataSource.schema ?? dataSource.fields ?? []).map((field) =>
            makeTreeNode(`${dataSource.id}.${field.name}`, field.name, getExpressionFieldGlyphKind(field.type), {
              insertValue: `{${dataSource.id}.${field.name}}`,
              searchText: `${dataSource.id}.${field.name} ${field.name} ${field.label ?? ''}`.toLowerCase(),
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
                description: {
                  title: item.name,
                  body: formatExpressionFunctionDocumentation(item, locale),
                },
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
          searchText: `${item.name} ${localizedDescriptionText(item.description, locale)}`.toLowerCase(),
          description: {
            title: item.name,
            body: localizedDescriptionText(item.description, locale),
          },
        }),
      ),
    [locale],
  );

  const formatNodes = useMemo<TreeNodeMeta[]>(
    () =>
      FORMAT_PATTERNS.map((item) =>
        makeTreeNode(`format.${item.name}`, item.name, 'format', {
          insertValue: item.insert,
          searchText: `${item.name} ${localizedDescriptionText(item.description, locale)}`.toLowerCase(),
          description: {
            title: item.name,
            body: localizedDescriptionText(item.description, locale),
          },
        }),
      ),
    [locale],
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
    setDiagnostics(validateReportExpression(expression, template));
  };

  const runExpression = () => {
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
              defaultExpandAll
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
