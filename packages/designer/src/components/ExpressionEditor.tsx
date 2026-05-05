import React, { useState, useRef } from 'react';
import { Modal, Input, Tree, Tabs, Button, message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useDesignerStore } from '../store/designer-store';
import { FieldStringOutlined, FunctionOutlined } from '@ant-design/icons';

const BUILT_IN_FUNCTIONS = [
  { name: 'SUM', desc: '求和', usage: 'SUM(field)', insert: 'SUM()' },
  { name: 'AVG', desc: '平均值', usage: 'AVG(field)', insert: 'AVG()' },
  { name: 'COUNT', desc: '计数', usage: 'COUNT(field)', insert: 'COUNT()' },
  { name: 'MAX', desc: '最大值', usage: 'MAX(field)', insert: 'MAX()' },
  { name: 'MIN', desc: '最小值', usage: 'MIN(field)', insert: 'MIN()' },
  { name: 'IF', desc: '条件判断', usage: 'IF(condition, trueVal, falseVal)', insert: 'IF(, , )' },
  { name: 'IIF', desc: '条件判断', usage: 'IIF(condition, trueVal, falseVal)', insert: 'IIF(, , )' },
  { name: 'TODATE', desc: '转日期', usage: 'TODATE(field, format)', insert: 'TODATE()' },
  { name: 'TOSTRING', desc: '转字符串', usage: 'TOSTRING(field)', insert: 'TOSTRING()' },
  { name: 'TONUMBER', desc: '转数字', usage: 'TONUMBER(field)', insert: 'TONUMBER()' },
  { name: 'SUBSTRING', desc: '子字符串', usage: 'SUBSTRING(field, start, length)', insert: 'SUBSTRING()' },
  { name: 'LENGTH', desc: '字符串长度', usage: 'LENGTH(field)', insert: 'LENGTH()' },
  { name: 'UPPER', desc: '大写', usage: 'UPPER(field)', insert: 'UPPER()' },
  { name: 'LOWER', desc: '小写', usage: 'LOWER(field)', insert: 'LOWER()' },
  { name: 'TRIM', desc: '去空格', usage: 'TRIM(field)', insert: 'TRIM()' },
  { name: 'ROUND', desc: '四舍五入', usage: 'ROUND(field, decimals)', insert: 'ROUND()' },
  { name: 'FORMAT', desc: '格式化', usage: 'FORMAT(field, format)', insert: 'FORMAT()' },
  { name: 'NOW', desc: '当前日期时间', usage: 'NOW()', insert: 'NOW()' },
  { name: 'TODAY', desc: '当前日期', usage: 'TODAY()', insert: 'TODAY()' },
  { name: 'PAGE', desc: '当前页码', usage: 'PAGE()', insert: 'PAGE()' },
  { name: 'TOTALPAGES', desc: '总页数', usage: 'TOTALPAGES()', insert: 'TOTALPAGES()' },
  { name: 'ISNULL', desc: '是否为空', usage: 'ISNULL(field)', insert: 'ISNULL()' },
  { name: 'NEWID', desc: '新 GUID', usage: 'NEWID()', insert: 'NEWID()' },
];

export const ExpressionEditor: React.FC<{
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}> = ({ open, value, onChange, onClose }) => {
  const [expression, setExpression] = useState(value);
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const inputRef = useRef<any>(null);

  // Collect data sources from current page's bands
  const pageBandDataSources = currentPageId
    ? template.pages.find(p => p.id === currentPageId)?.bands
      .map(b => b.dataSource)
      .filter(Boolean)
    : [];

  const currentPage = template.pages.find(p => p.id === currentPageId);
  const allDsIds = new Set<string>();
  if (currentPage) {
    for (const band of currentPage.bands) {
      if (band.dataSource) allDsIds.add(band.dataSource);
    }
  }
  // Also include all data sources from the template
  const dataSources = template.dataSources.filter(ds => ds.schema.length > 0);

  const fieldTree: DataNode[] = dataSources.map(ds => ({
    key: ds.id,
    title: <span style={{ fontWeight: 500 }}>{ds.name}</span>,
    children: ds.schema.map(field => ({
      key: `${ds.id}.${field.name}`,
      title: (
        <span>
          {field.label || field.name}
          <span style={{ color: '#999', fontSize: 10, marginLeft: 4 }}>({field.type})</span>
        </span>
      ),
    })),
  }));

  const functionList: DataNode[] = [
    {
      key: 'agg',
      title: <span style={{ fontWeight: 500 }}>聚合函数</span>,
      children: BUILT_IN_FUNCTIONS.filter(f => ['SUM', 'AVG', 'COUNT', 'MAX', 'MIN'].includes(f.name)).map(f => ({
        key: f.name,
        title: <span>{f.name} <span style={{ color: '#999', fontSize: 10 }}>- {f.desc}</span></span>,
      })),
    },
    {
      key: 'cond',
      title: <span style={{ fontWeight: 500 }}>条件函数</span>,
      children: BUILT_IN_FUNCTIONS.filter(f => ['IF', 'IIF', 'ISNULL'].includes(f.name)).map(f => ({
        key: f.name,
        title: <span>{f.name} <span style={{ color: '#999', fontSize: 10 }}>- {f.desc}</span></span>,
      })),
    },
    {
      key: 'str',
      title: <span style={{ fontWeight: 500 }}>字符串函数</span>,
      children: BUILT_IN_FUNCTIONS.filter(f => ['SUBSTRING', 'LENGTH', 'UPPER', 'LOWER', 'TRIM', 'TOSTRING'].includes(f.name)).map(f => ({
        key: f.name,
        title: <span>{f.name} <span style={{ color: '#999', fontSize: 10 }}>- {f.desc}</span></span>,
      })),
    },
    {
      key: 'num',
      title: <span style={{ fontWeight: 500 }}>数值函数</span>,
      children: BUILT_IN_FUNCTIONS.filter(f => ['ROUND', 'TONUMBER'].includes(f.name)).map(f => ({
        key: f.name,
        title: <span>{f.name} <span style={{ color: '#999', fontSize: 10 }}>- {f.desc}</span></span>,
      })),
    },
    {
      key: 'date',
      title: <span style={{ fontWeight: 500 }}>日期函数</span>,
      children: BUILT_IN_FUNCTIONS.filter(f => ['NOW', 'TODAY', 'TODATE'].includes(f.name)).map(f => ({
        key: f.name,
        title: <span>{f.name} <span style={{ color: '#999', fontSize: 10 }}>- {f.desc}</span></span>,
      })),
    },
    {
      key: 'rpt',
      title: <span style={{ fontWeight: 500 }}>报表函数</span>,
      children: BUILT_IN_FUNCTIONS.filter(f => ['PAGE', 'TOTALPAGES', 'FORMAT', 'NEWID'].includes(f.name)).map(f => ({
        key: f.name,
        title: <span>{f.name} <span style={{ color: '#999', fontSize: 10 }}>- {f.desc}</span></span>,
      })),
    },
  ];

  const insertAtCursor = (text: string) => {
    const input = inputRef.current?.resizableTextArea?.textArea || inputRef.current;
    if (input) {
      const start = input.selectionStart ?? expression.length;
      const end = input.selectionEnd ?? expression.length;
      const before = expression.substring(0, start);
      const after = expression.substring(end);
      const newExp = before + text + after;
      setExpression(newExp);
      setTimeout(() => {
        input.focus();
        const newPos = start + text.length;
        input.setSelectionRange(newPos, newPos);
      }, 0);
    } else {
      setExpression(expression + text);
    }
  };

  const handleFieldSelect = (_: React.Key[], info: any) => {
    if (!info.node.children) {
      const fieldKey = info.node.key as string;
      insertAtCursor(`{${fieldKey}}`);
    }
  };

  const handleFunctionSelect = (_: React.Key[], info: any) => {
    const func = BUILT_IN_FUNCTIONS.find(f => f.name === info.node.key);
    if (func) {
      insertAtCursor(func.insert);
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
      title="表达式编辑器"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      width={700}
      okText="确定"
      cancelText="取消"
    >
      <div style={{ marginBottom: 8 }}>
        <Input.TextArea
          ref={inputRef}
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="输入表达式，如 {DataSource.Field} 或 IF(condition, 1, 0)"
          autoSize={{ minRows: 3, maxRows: 6 }}
          style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: 13 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {/* Left: Fields and Functions tabs */}
        <div style={{ flex: 1, border: '1px solid #d9d9d9', borderRadius: 4, overflow: 'hidden' }}>
          <Tabs
            size="small"
            defaultActiveKey="fields"
            tabBarStyle={{ marginBottom: 0, padding: '0 8px' }}
            items={[
              {
                key: 'fields',
                label: (
                  <span><FieldStringOutlined /> 字段</span>
                ),
                children: (
                  <div style={{ maxHeight: 250, overflow: 'auto', padding: '4px 8px 8px' }}>
                    {fieldTree.length > 0 ? (
                      <Tree
                        treeData={fieldTree}
                        showLine
                        defaultExpandAll
                        blockNode
                        onSelect={handleFieldSelect}
                      />
                    ) : (
                      <div style={{ color: '#999', fontSize: 12, padding: 8 }}>
                        没有可用数据源
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: 'functions',
                label: (
                  <span><FunctionOutlined /> 函数</span>
                ),
                children: (
                  <div style={{ maxHeight: 250, overflow: 'auto', padding: '4px 8px 8px' }}>
                    <Tree
                      treeData={functionList}
                      showLine
                      defaultExpandAll
                      blockNode
                      onSelect={handleFunctionSelect}
                    />
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Right: Quick insert buttons */}
        <div style={{ width: 140 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4, padding: '0 4px' }}>快速插入</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 4px' }}>
            {BUILT_IN_FUNCTIONS.slice(0, 12).map(f => (
              <Button
                key={f.name}
                size="small"
                onClick={() => insertAtCursor(f.insert)}
                title={f.desc}
                style={{ fontSize: 11, padding: '0 6px', height: 24 }}
              >
                {f.name}
              </Button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#999', padding: '8px 4px 0' }}>
            提示: 点击字段或函数可插入表达式
          </div>
        </div>
      </div>
    </Modal>
  );
};
