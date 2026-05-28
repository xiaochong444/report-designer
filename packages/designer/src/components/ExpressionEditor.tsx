import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Modal, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useDesignerI18n, type DesignerMessageKey } from '../i18n';
import { useDesignerStore } from '../store/designer-store';

const BUILT_IN_FUNCTIONS = [
  { name: 'SUM', desc: { 'zh-CN': '求和', 'en-US': 'Sum' }, insert: 'SUM()' },
  { name: 'AVG', desc: { 'zh-CN': '平均值', 'en-US': 'Average' }, insert: 'AVG()' },
  { name: 'COUNT', desc: { 'zh-CN': '计数', 'en-US': 'Count' }, insert: 'COUNT()' },
  { name: 'MAX', desc: { 'zh-CN': '最大值', 'en-US': 'Maximum' }, insert: 'MAX()' },
  { name: 'MIN', desc: { 'zh-CN': '最小值', 'en-US': 'Minimum' }, insert: 'MIN()' },
  { name: 'PAGESUM', desc: { 'zh-CN': '按页求和', 'en-US': 'Page sum' }, insert: 'PAGESUM("", "")' },
  { name: 'PAGECOUNT', desc: { 'zh-CN': '按页计数', 'en-US': 'Page count' }, insert: 'PAGECOUNT("")' },
  { name: 'REPORTSUM', desc: { 'zh-CN': '按报表求和', 'en-US': 'Report sum' }, insert: 'REPORTSUM("", "")' },
  { name: 'REPORTCOUNT', desc: { 'zh-CN': '按报表计数', 'en-US': 'Report count' }, insert: 'REPORTCOUNT("")' },
  { name: 'TOTALS.PAGESUM', desc: { 'zh-CN': '按页求和别名', 'en-US': 'Page sum alias' }, insert: 'TOTALS.PAGESUM("", "")' },
  { name: 'TOTALS.PAGECOUNT', desc: { 'zh-CN': '按页计数别名', 'en-US': 'Page count alias' }, insert: 'TOTALS.PAGECOUNT("")' },
  { name: 'TOTALS.REPORTSUM', desc: { 'zh-CN': '按报表求和别名', 'en-US': 'Report sum alias' }, insert: 'TOTALS.REPORTSUM("", "")' },
  { name: 'RMBUPPER', desc: { 'zh-CN': '金额大写', 'en-US': 'RMB uppercase' }, insert: 'RMBUPPER()' },
  { name: 'MONEYUPPER', desc: { 'zh-CN': '金额大写别名', 'en-US': 'Money uppercase alias' }, insert: 'MONEYUPPER()' },
  { name: 'CNYUPPER', desc: { 'zh-CN': '人民币大写别名', 'en-US': 'CNY uppercase alias' }, insert: 'CNYUPPER()' },
  { name: 'CHINESEMONEY', desc: { 'zh-CN': '中文金额大写别名', 'en-US': 'Chinese money uppercase alias' }, insert: 'CHINESEMONEY()' },
  { name: 'IF', desc: { 'zh-CN': '条件判断', 'en-US': 'Conditional' }, insert: 'IF(, , )' },
  { name: 'IIF', desc: { 'zh-CN': '条件判断', 'en-US': 'Conditional' }, insert: 'IIF(, , )' },
  { name: 'ISNULL', desc: { 'zh-CN': '是否为空', 'en-US': 'Is null' }, insert: 'ISNULL()' },
  { name: 'FORMAT', desc: { 'zh-CN': '格式化', 'en-US': 'Format' }, insert: 'FORMAT()' },
  { name: 'ROUND', desc: { 'zh-CN': '四舍五入', 'en-US': 'Round' }, insert: 'ROUND()' },
  { name: 'NOW', desc: { 'zh-CN': '当前日期时间', 'en-US': 'Current date/time' }, insert: 'NOW()' },
  { name: 'TODAY', desc: { 'zh-CN': '当前日期', 'en-US': 'Current date' }, insert: 'TODAY()' },
  { name: 'PAGE', desc: { 'zh-CN': '当前页码', 'en-US': 'Current page' }, insert: 'PAGE()' },
  { name: 'TOTALPAGES', desc: { 'zh-CN': '总页数', 'en-US': 'Total pages' }, insert: 'TOTALPAGES()' },
];

const SYSTEM_VARIABLES = [
  { name: '{Today}', insert: '{Today}' },
  { name: '{PageNumber}', insert: '{PageNumber}' },
  { name: '{TotalPages}', insert: '{TotalPages}' },
  { name: '{Line}', insert: '{Line}' },
];

const FORMAT_PATTERNS = [
  { name: '#,##0.00', insert: '#,##0.00' },
  { name: 'yyyy-MM-dd', insert: 'yyyy-MM-dd' },
  { name: 'yyyy-MM-dd HH:mm:ss', insert: 'yyyy-MM-dd HH:mm:ss' },
  { name: '0.00%', insert: '0.00%' },
];

const HTML_TAGS = [
  { labelKey: 'expressionEditor.html.tag', insert: '<span></span>' },
  { labelKey: 'expressionEditor.html.bold', insert: '<b></b>' },
  { labelKey: 'expressionEditor.html.italic', insert: '<i></i>' },
  { labelKey: 'expressionEditor.html.lineBreak', insert: '<br />' },
];

type ExpressionCategory = 'expression' | 'data' | 'system' | 'aggregates' | 'html';

type TreeNodeMeta = DataNode & {
  searchText?: string;
  insertValue?: string;
  children?: TreeNodeMeta[];
};

const CATEGORY_ITEMS: Array<{ key: ExpressionCategory; labelKey: DesignerMessageKey; subtitleKey: DesignerMessageKey }> = [
  { key: 'expression', labelKey: 'expressionEditor.category.expression', subtitleKey: 'expressionEditor.category.expressionSubtitle' },
  { key: 'data', labelKey: 'expressionEditor.category.data', subtitleKey: 'expressionEditor.category.dataSubtitle' },
  { key: 'system', labelKey: 'expressionEditor.category.system', subtitleKey: 'expressionEditor.category.systemSubtitle' },
  { key: 'aggregates', labelKey: 'expressionEditor.category.aggregates', subtitleKey: 'expressionEditor.category.aggregatesSubtitle' },
  { key: 'html', labelKey: 'expressionEditor.category.html', subtitleKey: 'expressionEditor.category.htmlSubtitle' },
];

function makeTreeNode(
  key: string,
  label: string,
  kind: 'folder' | 'field' | 'system' | 'function' | 'format' | 'html' | 'resource',
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
  if (!query) {
    return nodes;
  }

  return nodes
    .map((node) => {
      const children = node.children ? filterTreeNodes(node.children, query) : [];
      if ((node.searchText ?? '').includes(query) || children.length > 0) {
        return {
          ...node,
          children,
        };
      }
      return null;
    })
    .filter(Boolean) as TreeNodeMeta[];
}

function validateExpression(expression: string, t: (key: DesignerMessageKey) => string) {
  const openBraces = (expression.match(/{/g) ?? []).length;
  const closeBraces = (expression.match(/}/g) ?? []).length;
  const openParens = (expression.match(/\(/g) ?? []).length;
  const closeParens = (expression.match(/\)/g) ?? []).length;

  if (openBraces !== closeBraces) {
    return t('expressionEditor.validation.braces');
  }
  if (openParens !== closeParens) {
    return t('expressionEditor.validation.parens');
  }
  return t('expressionEditor.validation.passed');
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
  const [validationMessage, setValidationMessage] = useState(() => t('expressionEditor.example'));
  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (open) {
      setExpression(value);
      setSearchTerm('');
      setValidationMessage(t('expressionEditor.example'));
    }
  }, [locale, open, value]);

  const insertAtCursor = (text: string) => {
    const input = inputRef.current?.resizableTextArea?.textArea || inputRef.current;
    if (input) {
      const start = input.selectionStart ?? expression.length;
      const end = input.selectionEnd ?? expression.length;
      const before = expression.slice(0, start);
      const after = expression.slice(end);
      const nextValue = `${before}${text}${after}`;
      setExpression(nextValue);
      setTimeout(() => {
        input.focus();
        const nextCursor = start + text.length;
        input.setSelectionRange(nextCursor, nextCursor);
      }, 0);
      return;
    }

    setExpression((current) => `${current}${text}`);
  };

  const dataSourceNodes = useMemo<TreeNodeMeta[]>(
    () =>
      template.dataSources.map((dataSource) =>
        makeTreeNode(`ds.${dataSource.id}`, dataSource.name, 'folder', {
          searchText: `${dataSource.name} ${dataSource.id}`.toLowerCase(),
          children: (dataSource.schema ?? dataSource.fields ?? []).map((field) =>
            makeTreeNode(
              `${dataSource.id}.${field.name}`,
              `${dataSource.id}.${field.name}`,
              'field',
              {
                insertValue: `{${dataSource.id}.${field.name}}`,
                searchText: `${dataSource.id}.${field.name} ${field.label ?? ''}`.toLowerCase(),
              },
            ),
          ),
        }),
      ),
    [template.dataSources],
  );

  const functionNodes = useMemo<TreeNodeMeta[]>(
    () => [
      makeTreeNode('fn.aggregate', t('expressionEditor.tree.aggregateFunctions'), 'folder', {
        children: BUILT_IN_FUNCTIONS.filter((item) => ['SUM', 'AVG', 'COUNT', 'MAX', 'MIN'].includes(item.name)).map((item) =>
          makeTreeNode(`fn.${item.name}`, item.name, 'function', {
            insertValue: item.insert,
            searchText: `${item.name} ${item.desc[locale]}`.toLowerCase(),
          }),
        ),
      }),
      makeTreeNode('fn.total', t('expressionEditor.tree.pageReportTotals'), 'folder', {
        children: BUILT_IN_FUNCTIONS.filter((item) =>
          ['PAGESUM', 'PAGECOUNT', 'REPORTSUM', 'REPORTCOUNT', 'TOTALS.PAGESUM', 'TOTALS.PAGECOUNT', 'TOTALS.REPORTSUM'].includes(item.name),
        ).map((item) =>
          makeTreeNode(`fn.${item.name}`, item.name, 'function', {
            insertValue: item.insert,
            searchText: `${item.name} ${item.desc[locale]}`.toLowerCase(),
          }),
        ),
      }),
      makeTreeNode('fn.logic', t('expressionEditor.tree.logicFunctions'), 'folder', {
        children: BUILT_IN_FUNCTIONS.filter((item) => ['IF', 'IIF', 'ISNULL'].includes(item.name)).map((item) =>
          makeTreeNode(`fn.${item.name}`, item.name, 'function', {
            insertValue: item.insert,
            searchText: `${item.name} ${item.desc[locale]}`.toLowerCase(),
          }),
        ),
      }),
      makeTreeNode('fn.money', t('expressionEditor.tree.moneyFunctions'), 'folder', {
        children: BUILT_IN_FUNCTIONS.filter((item) => ['RMBUPPER', 'MONEYUPPER', 'CNYUPPER', 'CHINESEMONEY'].includes(item.name)).map((item) =>
          makeTreeNode(`fn.${item.name}`, item.name, 'function', {
            insertValue: item.insert,
            searchText: `${item.name} ${item.desc[locale]}`.toLowerCase(),
          }),
        ),
      }),
    ],
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

  const htmlNodes = useMemo<TreeNodeMeta[]>(
    () =>
      HTML_TAGS.map((item) =>
        makeTreeNode(`html.${item.labelKey}`, t(item.labelKey as DesignerMessageKey), 'html', {
          insertValue: item.insert,
          searchText: t(item.labelKey as DesignerMessageKey).toLowerCase(),
        }),
      ),
    [t],
  );

  const treeData = useMemo<TreeNodeMeta[]>(() => {
    switch (activeCategory) {
      case 'data':
        return [makeTreeNode('tree.data', t('leftPanel.dataSources'), 'folder', { children: dataSourceNodes })];
      case 'system':
        return [makeTreeNode('tree.system', t('leftPanel.systemVariables'), 'folder', { children: systemNodes })];
      case 'aggregates':
        return [makeTreeNode('tree.function', t('leftPanel.functions'), 'folder', { children: functionNodes })];
      case 'html':
        return [makeTreeNode('tree.html', t('expressionEditor.html.tag'), 'folder', { children: htmlNodes })];
      case 'expression':
      default:
        return [
          makeTreeNode('tree.data', t('leftPanel.dataSources'), 'folder', { children: dataSourceNodes }),
          makeTreeNode('tree.system', t('leftPanel.systemVariables'), 'folder', { children: systemNodes }),
          makeTreeNode('tree.function', t('leftPanel.functions'), 'folder', { children: functionNodes }),
          makeTreeNode('tree.format', t('styleLibrary.format'), 'folder', { children: formatNodes }),
        ];
    }
  }, [activeCategory, dataSourceNodes, formatNodes, functionNodes, htmlNodes, systemNodes, t]);

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

  return (
    <Modal
      title={t('expressionEditor.title')}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      width={960}
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
          <Input.TextArea
            ref={inputRef}
            className="rd-expression-editor-textarea"
            value={expression}
            onChange={(event) => setExpression(event.target.value)}
            autoSize={false}
            placeholder="{Sum(Products.UnitPrice * Products.UnitsInStock) - 0}"
          />
          <div className="rd-expression-editor-footer">
            <span>{validationMessage}</span>
            <Button
              type="link"
              size="small"
              onClick={() => setValidationMessage(validateExpression(expression, t))}
            >
              {t('expressionEditor.validate')}
            </Button>
          </div>
        </section>

        <aside className="rd-expression-browser">
          <Input
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
