import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Modal, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useDesignerStore } from '../store/designer-store';

const BUILT_IN_FUNCTIONS = [
  { name: 'SUM', desc: '求和', insert: 'SUM()' },
  { name: 'AVG', desc: '平均值', insert: 'AVG()' },
  { name: 'COUNT', desc: '计数', insert: 'COUNT()' },
  { name: 'MAX', desc: '最大值', insert: 'MAX()' },
  { name: 'MIN', desc: '最小值', insert: 'MIN()' },
  { name: 'PAGESUM', desc: '按页求和', insert: 'PAGESUM("", "")' },
  { name: 'PAGECOUNT', desc: '按页计数', insert: 'PAGECOUNT("")' },
  { name: 'REPORTSUM', desc: '按报表求和', insert: 'REPORTSUM("", "")' },
  { name: 'REPORTCOUNT', desc: '按报表计数', insert: 'REPORTCOUNT("")' },
  { name: 'TOTALS.PAGESUM', desc: '按页求和别名', insert: 'TOTALS.PAGESUM("", "")' },
  { name: 'TOTALS.PAGECOUNT', desc: '按页计数别名', insert: 'TOTALS.PAGECOUNT("")' },
  { name: 'TOTALS.REPORTSUM', desc: '按报表求和别名', insert: 'TOTALS.REPORTSUM("", "")' },
  { name: 'IF', desc: '条件判断', insert: 'IF(, , )' },
  { name: 'IIF', desc: '条件判断', insert: 'IIF(, , )' },
  { name: 'ISNULL', desc: '是否为空', insert: 'ISNULL()' },
  { name: 'FORMAT', desc: '格式化', insert: 'FORMAT()' },
  { name: 'ROUND', desc: '四舍五入', insert: 'ROUND()' },
  { name: 'NOW', desc: '当前日期时间', insert: 'NOW()' },
  { name: 'TODAY', desc: '当前日期', insert: 'TODAY()' },
  { name: 'PAGE', desc: '当前页码', insert: 'PAGE()' },
  { name: 'TOTALPAGES', desc: '总页数', insert: 'TOTALPAGES()' },
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
  { name: 'Html Tag', insert: '<span></span>' },
  { name: 'Bold', insert: '<b></b>' },
  { name: 'Italic', insert: '<i></i>' },
  { name: 'Line break', insert: '<br />' },
];

type ExpressionCategory = 'expression' | 'data' | 'system' | 'aggregates' | 'html';

type TreeNodeMeta = DataNode & {
  searchText?: string;
  insertValue?: string;
  children?: TreeNodeMeta[];
};

const CATEGORY_ITEMS: Array<{ key: ExpressionCategory; label: string; subtitle: string }> = [
  { key: 'expression', label: '表达式', subtitle: 'Expression' },
  { key: 'data', label: '数据列', subtitle: 'Data Column' },
  { key: 'system', label: '系统变量', subtitle: 'System' },
  { key: 'aggregates', label: '聚合', subtitle: 'Aggregate' },
  { key: 'html', label: 'HTML', subtitle: 'Html' },
];

function makeTreeNode(
  key: string,
  label: string,
  kind: 'folder' | 'field' | 'system' | 'function' | 'format' | 'html' | 'resource',
  options?: { insertValue?: string; searchText?: string; children?: TreeNodeMeta[] },
): TreeNodeMeta {
  return {
    key,
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

function validateExpression(expression: string) {
  const openBraces = (expression.match(/{/g) ?? []).length;
  const closeBraces = (expression.match(/}/g) ?? []).length;
  const openParens = (expression.match(/\(/g) ?? []).length;
  const closeParens = (expression.match(/\)/g) ?? []).length;

  if (openBraces !== closeBraces) {
    return '大括号数量不匹配';
  }
  if (openParens !== closeParens) {
    return '括号数量不匹配';
  }
  return '表达式校验通过';
}

export const ExpressionEditor: React.FC<{
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}> = ({ open, value, onChange, onClose }) => {
  const template = useDesignerStore((state) => state.template);
  const [expression, setExpression] = useState(value);
  const [activeCategory, setActiveCategory] = useState<ExpressionCategory>('expression');
  const [searchTerm, setSearchTerm] = useState('');
  const [validationMessage, setValidationMessage] = useState('示例: Text: {Expression}, {DataSource.Field}');
  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (open) {
      setExpression(value);
      setSearchTerm('');
      setValidationMessage('示例: Text: {Expression}, {DataSource.Field}');
    }
  }, [open, value]);

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
      makeTreeNode('fn.aggregate', '聚合函数', 'folder', {
        children: BUILT_IN_FUNCTIONS.filter((item) => ['SUM', 'AVG', 'COUNT', 'MAX', 'MIN'].includes(item.name)).map((item) =>
          makeTreeNode(`fn.${item.name}`, item.name, 'function', {
            insertValue: item.insert,
            searchText: `${item.name} ${item.desc}`.toLowerCase(),
          }),
        ),
      }),
      makeTreeNode('fn.total', '页/报表合计', 'folder', {
        children: BUILT_IN_FUNCTIONS.filter((item) =>
          ['PAGESUM', 'PAGECOUNT', 'REPORTSUM', 'REPORTCOUNT', 'TOTALS.PAGESUM', 'TOTALS.PAGECOUNT', 'TOTALS.REPORTSUM'].includes(item.name),
        ).map((item) =>
          makeTreeNode(`fn.${item.name}`, item.name, 'function', {
            insertValue: item.insert,
            searchText: `${item.name} ${item.desc}`.toLowerCase(),
          }),
        ),
      }),
      makeTreeNode('fn.logic', '条件函数', 'folder', {
        children: BUILT_IN_FUNCTIONS.filter((item) => ['IF', 'IIF', 'ISNULL'].includes(item.name)).map((item) =>
          makeTreeNode(`fn.${item.name}`, item.name, 'function', {
            insertValue: item.insert,
            searchText: `${item.name} ${item.desc}`.toLowerCase(),
          }),
        ),
      }),
    ],
    [],
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
        makeTreeNode(`html.${item.name}`, item.name, 'html', {
          insertValue: item.insert,
          searchText: item.name.toLowerCase(),
        }),
      ),
    [],
  );

  const treeData = useMemo<TreeNodeMeta[]>(() => {
    switch (activeCategory) {
      case 'data':
        return [makeTreeNode('tree.data', '数据源', 'folder', { children: dataSourceNodes })];
      case 'system':
        return [makeTreeNode('tree.system', '系统变量', 'folder', { children: systemNodes })];
      case 'aggregates':
        return [makeTreeNode('tree.function', '函数', 'folder', { children: functionNodes })];
      case 'html':
        return [makeTreeNode('tree.html', 'Html Tag', 'folder', { children: htmlNodes })];
      case 'expression':
      default:
        return [
          makeTreeNode('tree.data', '数据源', 'folder', { children: dataSourceNodes }),
          makeTreeNode('tree.variables', '变量', 'folder', {
            children: [makeTreeNode('tree.variables.empty', '暂无变量', 'resource')],
          }),
          makeTreeNode('tree.system', '系统变量', 'folder', { children: systemNodes }),
          makeTreeNode('tree.function', '函数', 'folder', { children: functionNodes }),
          makeTreeNode('tree.format', '格式', 'folder', { children: formatNodes }),
          makeTreeNode('tree.resources', '资源', 'folder', {
            children: [makeTreeNode('tree.resources.empty', '暂无资源', 'resource')],
          }),
        ];
    }
  }, [activeCategory, dataSourceNodes, formatNodes, functionNodes, htmlNodes, systemNodes]);

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
      title="文本"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      width={960}
      okText="确定"
      cancelText="取消"
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
                <span>{item.label}</span>
                <span>{item.subtitle}</span>
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
              onClick={() => setValidationMessage(validateExpression(expression))}
            >
              校验
            </Button>
          </div>
        </section>

        <aside className="rd-expression-browser">
          <Input
            allowClear
            size="small"
            placeholder="搜索"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <div className="rd-expression-browser-tree">
            <Tree
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
