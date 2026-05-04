import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, Space, Divider, Tag, Tooltip, InputNumber, ColorPicker, message } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
} from '@ant-design/icons';
import { useDesignerStore } from '../store/designer-store';
import { nanoid } from 'nanoid';
import type { ConditionalFormat, ConditionRule, ReportStyle } from '@report-designer/core';

const OVERRIDE_FIELDS = [
  { key: 'fontWeight', label: '加粗', type: 'boolean', icon: <BoldOutlined /> },
  { key: 'fontStyle', label: '斜体', type: 'boolean', icon: <ItalicOutlined /> },
  { key: 'textDecoration', label: '下划线', type: 'boolean', icon: <UnderlineOutlined /> },
  { key: 'fontColor', label: '字体颜色', type: 'color' },
  { key: 'fontSize', label: '字号', type: 'number' },
  { key: 'backgroundColor', label: '背景色', type: 'color' },
  { key: 'textAlign', label: '对齐', type: 'select', options: [
    { value: 'left', label: '左' }, { value: 'center', label: '中' }, { value: 'right', label: '右' },
  ]},
  { key: 'border', label: '边框样式', type: 'select', options: [
    { value: 'none', label: '无' }, { value: 'solid', label: '实线' }, { value: 'dashed', label: '虚线' },
  ]},
];

export const ConditionalFormatManager: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const template = useDesignerStore(s => s.template);
  const [formats, setFormats] = useState<ConditionalFormat[]>(template.conditionalFormats);
  const [editingFormat, setEditingFormat] = useState<ConditionalFormat | null>(null);

  const handleAddFormat = () => {
    const newFormat: ConditionalFormat = {
      id: `cf_${nanoid(6)}`,
      name: `条件格式 ${formats.length + 1}`,
      rules: [],
      applyTo: [],
    };
    const updated = [...formats, newFormat];
    setFormats(updated);
    setEditingFormat(newFormat);
  };

  const handleDeleteFormat = (id: string) => {
    setFormats(formats.filter(f => f.id !== id));
    if (editingFormat?.id === id) setEditingFormat(null);
  };

  const handleSaveAll = () => {
    const state = useDesignerStore.getState();
    // Update the template's conditionalFormats
    const newTemplate = { ...state.template, conditionalFormats: formats };
    state.loadTemplate(newTemplate);
    message.success('已保存条件格式');
    onClose();
  };

  const handleAddRule = () => {
    if (!editingFormat) return;
    const newRule: ConditionRule = {
      id: `rule_${nanoid(6)}`,
      expression: '',
      overrides: {},
    };
    setEditingFormat({ ...editingFormat, rules: [...editingFormat.rules, newRule] });
    // Also update in the formats array
    setFormats(formats.map(f => f.id === editingFormat.id ? { ...f, rules: [...f.rules, newRule] } : f));
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<ConditionRule>) => {
    if (!editingFormat) return;
    const updatedRules = editingFormat.rules.map(r => r.id === ruleId ? { ...r, ...updates } : r);
    const updated = { ...editingFormat, rules: updatedRules };
    setEditingFormat(updated);
    setFormats(formats.map(f => f.id === editingFormat.id ? updated : f));
  };

  const handleDeleteRule = (ruleId: string) => {
    if (!editingFormat) return;
    const updatedRules = editingFormat.rules.filter(r => r.id !== ruleId);
    const updated = { ...editingFormat, rules: updatedRules };
    setEditingFormat(updated);
    setFormats(formats.map(f => f.id === editingFormat.id ? updated : f));
  };

  const handleOverrideChange = (rule: ConditionRule, field: string, value: any) => {
    const newOverrides = { ...rule.overrides, [field]: value };
    handleUpdateRule(rule.id, { overrides: newOverrides });
  };

  return (
    <Modal
      title="条件格式管理"
      open={open}
      onOk={handleSaveAll}
      onCancel={onClose}
      width={800}
      okText="保存"
      cancelText="取消"
    >
      <div style={{ display: 'flex', height: 450, gap: 12 }}>
        {/* Left: Format list */}
        <div style={{ width: 200, border: '1px solid #d9d9d9', borderRadius: 4, padding: 8, display: 'flex', flexDirection: 'column' }}>
          <Button size="small" icon={<PlusOutlined />} onClick={handleAddFormat} block style={{ marginBottom: 8 }}>
            新建
          </Button>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {formats.map(f => (
              <div
                key={f.id}
                onClick={() => setEditingFormat(f)}
                style={{
                  padding: '6px 8px', cursor: 'pointer', borderRadius: 4, marginBottom: 4,
                  backgroundColor: editingFormat?.id === f.id ? '#e6f7ff' : 'transparent',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 13 }}>{f.name}</span>
                <Tooltip title="删除">
                  <Button
                    type="text" size="small" danger icon={<DeleteOutlined />}
                    style={{ height: 20, padding: 0, fontSize: 10 }}
                    onClick={(e) => { e.stopPropagation(); handleDeleteFormat(f.id); }}
                  />
                </Tooltip>
              </div>
            ))}
            {formats.length === 0 && (
              <div style={{ color: '#999', fontSize: 12, textAlign: 'center', padding: 16 }}>
                没有条件格式
              </div>
            )}
          </div>
        </div>

        {/* Right: Rule editor */}
        <div style={{ flex: 1, border: '1px solid #d9d9d9', borderRadius: 4, padding: 8, overflow: 'auto' }}>
          {editingFormat ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <Input
                  value={editingFormat.name}
                  onChange={(e) => {
                    const updated = { ...editingFormat, name: e.target.value };
                    setEditingFormat(updated);
                    setFormats(formats.map(f => f.id === editingFormat.id ? updated : f));
                  }}
                  placeholder="条件格式名称"
                  size="small"
                />
              </div>
              <Button size="small" icon={<PlusOutlined />} onClick={handleAddRule} block style={{ marginBottom: 8 }}>
                添加规则
              </Button>
              {editingFormat.rules.map((rule, idx) => (
                <div key={rule.id} style={{
                  border: '1px solid #e8e8e8', borderRadius: 4, padding: 8, marginBottom: 8,
                  backgroundColor: '#fafafa',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Tag color="blue">规则 {idx + 1}</Tag>
                    <Button
                      type="text" size="small" danger icon={<DeleteOutlined />}
                      onClick={() => handleDeleteRule(rule.id)}
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>条件表达式</div>
                    <Input
                      value={rule.expression}
                      onChange={(e) => handleUpdateRule(rule.id, { expression: e.target.value })}
                      placeholder="如 {Data.Amount} > 1000"
                      size="small"
                    />
                  </div>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>覆盖样式</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {OVERRIDE_FIELDS.map(field => (
                      <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {field.type === 'boolean' && (
                          <Button
                            size="small" icon={field.icon}
                            type={rule.overrides[field.key] ? 'primary' : 'default'}
                            onClick={() => handleOverrideChange(rule, field.key, !rule.overrides[field.key])}
                            style={{ width: 28, height: 24, padding: 0, fontSize: 12 }}
                          />
                        )}
                        {field.type === 'color' && (
                          <>
                            <span style={{ fontSize: 11, width: 50 }}>{field.label}</span>
                            <ColorPicker
                              size="small"
                              value={rule.overrides[field.key] || '#000000'}
                              onChange={(color) => handleOverrideChange(rule, field.key, color.toHexString())}
                            />
                          </>
                        )}
                        {field.type === 'number' && (
                          <>
                            <span style={{ fontSize: 11, width: 50 }}>{field.label}</span>
                            <InputNumber
                              size="small"
                              value={rule.overrides[field.key] || 12}
                              onChange={(v) => handleOverrideChange(rule, field.key, v)}
                              style={{ width: 60 }}
                              min={6}
                              max={72}
                            />
                          </>
                        )}
                        {field.type === 'select' && (
                          <>
                            <span style={{ fontSize: 11, width: 50 }}>{field.label}</span>
                            <Select
                              size="small"
                              value={rule.overrides[field.key] || undefined}
                              onChange={(v) => handleOverrideChange(rule, field.key, v)}
                              style={{ width: 70 }}
                              options={field.options}
                              allowClear
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {editingFormat.rules.length === 0 && (
                <div style={{ color: '#999', fontSize: 12, textAlign: 'center', padding: 16 }}>
                  点击"添加规则"创建条件
                </div>
              )}
            </>
          ) : (
            <div style={{ color: '#999', fontSize: 12, textAlign: 'center', padding: 40 }}>
              选择或创建一个条件格式
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
