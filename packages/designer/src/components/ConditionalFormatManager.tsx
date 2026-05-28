import React, { useMemo, useState } from 'react';
import { Button, Checkbox, Divider, Empty, Form, Input, Modal, Select, Space, Tag } from 'antd';
import {
  BgColorsOutlined,
  BoldOutlined,
  DeleteOutlined,
  ItalicOutlined,
  PlusOutlined,
  UnderlineOutlined,
} from '@ant-design/icons';
import type { ConditionRule, ConditionalFormat } from '@report-designer/core';
import { useDesignerI18n, type DesignerMessageKey } from '../i18n';
import { useDesignerStore } from '../store/designer-store';

type ConditionDataType = NonNullable<ConditionRule['dataType']>;
type ConditionOperator = NonNullable<ConditionRule['operator']>;
type ConditionalFormatMessageKey = Extract<DesignerMessageKey, `conditionalFormat.${string}`>;

interface ConditionalFormatManagerProps {
  open: boolean;
  onClose: () => void;
}

export const ConditionalFormatManager: React.FC<ConditionalFormatManagerProps> = ({ open, onClose }) => {
  const { t } = useDesignerI18n();
  const formats = useDesignerStore(state => state.template.conditionalFormats);
  const createConditionalFormat = useDesignerStore(state => state.createConditionalFormat);
  const duplicateConditionalFormat = useDesignerStore(state => state.duplicateConditionalFormat);
  const updateConditionalFormat = useDesignerStore(state => state.updateConditionalFormat);
  const deleteConditionalFormat = useDesignerStore(state => state.deleteConditionalFormat);
  const applySelectedConditionalFormat = useDesignerStore(state => state.applySelectedConditionalFormat);
  const selectedComponentCount = useDesignerStore(state => state.selectedComponentIds.length);
  const [selectedId, setSelectedId] = useState<string | null>(formats[0]?.id ?? null);
  const [searchText, setSearchText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ConditionalFormat | null>(null);

  const filteredFormats = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return formats;
    return formats.filter(format => format.name.toLowerCase().includes(keyword));
  }, [formats, searchText]);

  const selectedFormat = formats.find(format => format.id === selectedId) ?? formats[0] ?? null;
  const selectedRule = selectedFormat?.rules[0] ?? null;

  const selectFormat = (format: ConditionalFormat) => setSelectedId(format.id);
  const ct = (key: ConditionalFormatMessageKey, values?: Record<string, string | number>) => t(key, values);

  const handleCreate = () => {
    const id = createConditionalFormat({ name: ct('conditionalFormat.newFormatName') });
    setSelectedId(id);
  };

  const handleDuplicate = () => {
    if (!selectedFormat) return;
    const id = duplicateConditionalFormat(selectedFormat.id);
    if (id) setSelectedId(id);
  };

  const handleDelete = () => {
    if (!selectedFormat) return;
    setDeleteTarget(selectedFormat);
  };

  const handleApplyToSelected = () => {
    if (!selectedFormat) return;
    applySelectedConditionalFormat(selectedFormat.id);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const deletingId = deleteTarget.id;
    deleteConditionalFormat(deletingId);
    const remaining = useDesignerStore.getState().template.conditionalFormats.filter(format => format.id !== deletingId);
    setSelectedId(remaining[0]?.id ?? null);
    setDeleteTarget(null);
  };

  const updateSelectedFormat = (updates: Partial<ConditionalFormat>) => {
    if (!selectedFormat) return;
    updateConditionalFormat(selectedFormat.id, updates);
  };

  const updateRule = (ruleId: string, updates: Partial<ConditionRule>) => {
    if (!selectedFormat) return;
    updateSelectedFormat({
      rules: selectedFormat.rules.map(rule => (
        rule.id === ruleId ? { ...rule, ...updates, overrides: { ...(rule.overrides ?? {}), ...(updates.overrides ?? {}) } } : rule
      )),
    });
  };

  const updateRuleOverride = (rule: ConditionRule, key: string, value: unknown) => {
    updateRule(rule.id, { overrides: { ...(rule.overrides ?? {}), [key]: value } });
  };

  const updateRuleValue = (rule: ConditionRule, value: string) => {
    updateRule(rule.id, {
      conditionType: 'value',
      value: parseConditionValue(value, rule.dataType ?? 'string'),
    });
  };

  return (
    <div style={{ display: 'contents' }}>
    <Modal
      title={<span>{ct('conditionalFormat.title')}</span>}
      open={open}
      onCancel={onClose}
      width={980}
      getContainer={false}
      aria-label={ct('conditionalFormat.title')}
      modalRender={modal => React.cloneElement(modal as React.ReactElement<any>, {
        'aria-label': ct('conditionalFormat.title'),
        'aria-labelledby': undefined,
      })}
      footer={<Button type="primary" onClick={onClose}>{ct('conditionalFormat.done')}</Button>}
    >
      <div style={{ display: 'flex', height: 560, minHeight: 0, gap: 12 }}>
        <aside style={{ width: 248, display: 'flex', minHeight: 0, flexDirection: 'column', borderRight: '1px solid #f0f0f0', paddingRight: 12 }}>
          <Input.Search
            aria-label={ct('conditionalFormat.search')}
            placeholder={ct('conditionalFormat.search')}
            value={searchText}
            onChange={event => setSearchText(event.target.value)}
            size="small"
            style={{ marginBottom: 8 }}
          />
          <Space size={6} style={{ marginBottom: 8 }}>
            <Button aria-label={ct('conditionalFormat.new')} size="small" icon={<PlusOutlined aria-hidden />} onClick={handleCreate}>{ct('conditionalFormat.new')}</Button>
            <Button aria-label={ct('conditionalFormat.duplicate')} size="small" onClick={handleDuplicate} disabled={!selectedFormat}>{ct('conditionalFormat.duplicate')}</Button>
            <Button aria-label={ct('conditionalFormat.delete')} size="small" danger icon={<DeleteOutlined aria-hidden />} onClick={handleDelete} disabled={!selectedFormat}>{ct('conditionalFormat.delete')}</Button>
          </Space>
          <Button
            aria-label={ct('conditionalFormat.applyToSelected')}
            size="small"
            type="primary"
            disabled={!selectedFormat || selectedComponentCount === 0}
            onClick={handleApplyToSelected}
            style={{ marginBottom: 8 }}
            block
          >
            {ct('conditionalFormat.applyToSelected')}
          </Button>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {filteredFormats.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={ct('conditionalFormat.empty')} />
            ) : filteredFormats.map(format => (
              <button
                key={format.id}
                type="button"
                onClick={() => selectFormat(format)}
                style={{
                  width: '100%',
                  border: 0,
                  borderRadius: 4,
                  padding: '6px 8px',
                  marginBottom: 2,
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: format.id === selectedFormat?.id ? '#e6f4ff' : 'transparent',
                }}
              >
                <span style={{ display: 'block', fontSize: 13, lineHeight: '18px' }}>{format.name}</span>
                <span style={{ color: '#8c8c8c', fontSize: 11 }}>{ct('conditionalFormat.ruleCount', { count: format.rules.length })}</span>
              </button>
            ))}
          </div>
        </aside>

        <main style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
          {selectedFormat ? (
            <Space orientation="vertical" size={12} style={{ width: '100%' }}>
              <section>
                <Form layout="vertical" size="small">
                  <Form.Item label={ct('conditionalFormat.name')}>
                    <Input
                      aria-label={ct('conditionalFormat.name')}
                      value={selectedFormat.name}
                      onChange={event => updateSelectedFormat({ name: event.target.value })}
                    />
                  </Form.Item>
                </Form>
              </section>

              <section style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <strong>{ct('conditionalFormat.rules')}</strong>
                  {selectedRule ? (
                    <Tag color={selectedRule.enabled === false ? 'default' : 'blue'}>
                      {selectedRule.enabled === false ? ct('conditionalFormat.disabled') : ct('conditionalFormat.enabled')}
                    </Tag>
                  ) : null}
                </div>
                {selectedRule ? (
                  <Form layout="vertical" size="small">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 160px', gap: 8 }}>
                    <Form.Item label={ct('conditionalFormat.conditionField')}>
                      <Input
                        aria-label={ct('conditionalFormat.conditionField')}
                        value={selectedRule.field ?? ''}
                        onChange={event => updateRule(selectedRule.id, { conditionType: 'value', field: event.target.value })}
                        placeholder="{Orders.Amount}"
                      />
                    </Form.Item>
                    <Form.Item label={ct('conditionalFormat.dataType')}>
                      <Select
                        aria-label={ct('conditionalFormat.dataType')}
                        value={selectedRule.dataType ?? 'string'}
                        onChange={(value: ConditionDataType) => updateRule(selectedRule.id, {
                          conditionType: 'value',
                          dataType: value,
                          value: parseConditionValue(String(selectedRule.value ?? ''), value),
                        })}
                        virtual={false}
                        options={DATA_TYPE_OPTIONS.map(option => ({ value: option.value, label: ct(option.labelKey) }))}
                      />
                    </Form.Item>
                    <Form.Item label={ct('conditionalFormat.operator')}>
                      <Select
                        aria-label={ct('conditionalFormat.operator')}
                        value={selectedRule.operator ?? 'equalTo'}
                        onChange={(value: ConditionOperator) => updateRule(selectedRule.id, { conditionType: 'value', operator: value })}
                        virtual={false}
                        options={OPERATOR_OPTIONS.map(option => ({ value: option.value, label: ct(option.labelKey) }))}
                      />
                    </Form.Item>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <Form.Item label={ct('conditionalFormat.value')}>
                      <Input
                        aria-label={ct('conditionalFormat.value')}
                        value={String(selectedRule.value ?? '')}
                        onChange={event => updateRuleValue(selectedRule, event.target.value)}
                      />
                    </Form.Item>
                    <Form.Item label={ct('conditionalFormat.expression')}>
                      <Input
                        aria-label={ct('conditionalFormat.expression')}
                        value={selectedRule.expression ?? ''}
                        onChange={event => updateRule(selectedRule.id, { conditionType: 'expression', expression: event.target.value })}
                        placeholder="{Orders.Amount} > 1000"
                      />
                    </Form.Item>
                  </div>

                  <Checkbox
                    checked={selectedRule.breakIfTrue ?? false}
                    onChange={event => updateRule(selectedRule.id, { breakIfTrue: event.target.checked })}
                  >
                    {ct('conditionalFormat.breakIfTrue')}
                  </Checkbox>
                  </Form>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={ct('conditionalFormat.noRules')} />
                )}
              </section>

              {selectedRule ? (
              <section style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: 12 }}>
                <strong>{ct('conditionalFormat.formatting')}</strong>
                <Divider style={{ margin: '10px 0' }} />
                <Space size={6} wrap>
                  <Button
                    aria-label={ct('conditionalFormat.bold')}
                    title={ct('conditionalFormat.bold')}
                    icon={<BoldOutlined />}
                    type={selectedRule.overrides?.fontWeight ? 'primary' : 'default'}
                    onClick={() => updateRuleOverride(selectedRule, 'fontWeight', !selectedRule.overrides?.fontWeight)}
                  />
                  <Button
                    aria-label={ct('conditionalFormat.italic')}
                    title={ct('conditionalFormat.italic')}
                    icon={<ItalicOutlined />}
                    type={selectedRule.overrides?.fontStyle ? 'primary' : 'default'}
                    onClick={() => updateRuleOverride(selectedRule, 'fontStyle', !selectedRule.overrides?.fontStyle)}
                  />
                  <Button
                    aria-label={ct('conditionalFormat.underline')}
                    title={ct('conditionalFormat.underline')}
                    icon={<UnderlineOutlined />}
                    type={selectedRule.overrides?.textDecoration ? 'primary' : 'default'}
                    onClick={() => updateRuleOverride(selectedRule, 'textDecoration', !selectedRule.overrides?.textDecoration)}
                  />
                </Space>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
                  <Form layout="vertical" size="small">
                    <Form.Item label={ct('conditionalFormat.textColor')}>
                      <Input
                        aria-label={ct('conditionalFormat.textColor')}
                        type="color"
                        value={String(selectedRule.overrides?.fontColor ?? '#000000')}
                        onChange={event => updateRuleOverride(selectedRule, 'fontColor', event.target.value)}
                      />
                    </Form.Item>
                  </Form>
                  <Form layout="vertical" size="small">
                    <Form.Item label={ct('conditionalFormat.backgroundColor')}>
                      <Input
                        aria-label={ct('conditionalFormat.backgroundColor')}
                        type="color"
                        prefix={<BgColorsOutlined />}
                        value={String(selectedRule.overrides?.backgroundColor ?? '#ffffff')}
                        onChange={event => updateRuleOverride(selectedRule, 'backgroundColor', event.target.value)}
                      />
                    </Form.Item>
                  </Form>
                  <Form layout="vertical" size="small">
                    <Form.Item label={ct('conditionalFormat.borderStyle')}>
                      <Select
                        aria-label={ct('conditionalFormat.borderStyle')}
                        value={(selectedRule.overrides?.border as any)?.style ?? selectedRule.overrides?.border ?? 'none'}
                        onChange={value => updateRuleOverride(selectedRule, 'border', value)}
                        virtual={false}
                        options={[
                          { value: 'none', label: ct('conditionalFormat.borderNone') },
                          { value: 'solid', label: ct('conditionalFormat.borderSolid') },
                          { value: 'dashed', label: ct('conditionalFormat.borderDashed') },
                          { value: 'dotted', label: ct('conditionalFormat.borderDotted') },
                          { value: 'double', label: ct('conditionalFormat.borderDouble') },
                        ]}
                      />
                    </Form.Item>
                  </Form>
                </div>
              </section>
              ) : null}
            </Space>
          ) : (
            <Empty description={ct('conditionalFormat.selectOrCreate')} />
          )}
        </main>
      </div>
    </Modal>
    <Modal
      title={deleteTarget ? ct('conditionalFormat.deleteTitle', { name: deleteTarget.name }) : ct('conditionalFormat.delete')}
      open={Boolean(deleteTarget)}
      getContainer={false}
      onOk={confirmDelete}
      onCancel={() => setDeleteTarget(null)}
      okText={ct('conditionalFormat.confirm')}
      cancelText={ct('conditionalFormat.cancel')}
      okButtonProps={{ 'aria-label': ct('conditionalFormat.confirm') }}
      cancelButtonProps={{ 'aria-label': ct('conditionalFormat.cancel') }}
    >
      {ct('conditionalFormat.deleteDescription')}
    </Modal>
    </div>
  );
};

const DATA_TYPE_OPTIONS: Array<{ value: ConditionDataType; labelKey: ConditionalFormatMessageKey }> = [
  { value: 'string', labelKey: 'conditionalFormat.typeString' },
  { value: 'number', labelKey: 'conditionalFormat.typeNumber' },
  { value: 'date', labelKey: 'conditionalFormat.typeDate' },
  { value: 'boolean', labelKey: 'conditionalFormat.typeBoolean' },
  { value: 'expression', labelKey: 'conditionalFormat.typeExpression' },
];

const OPERATOR_OPTIONS: Array<{ value: ConditionOperator; labelKey: ConditionalFormatMessageKey }> = [
  { value: 'equalTo', labelKey: 'conditionalFormat.opEqualTo' },
  { value: 'notEqualTo', labelKey: 'conditionalFormat.opNotEqualTo' },
  { value: 'between', labelKey: 'conditionalFormat.opBetween' },
  { value: 'notBetween', labelKey: 'conditionalFormat.opNotBetween' },
  { value: 'greaterThan', labelKey: 'conditionalFormat.opGreaterThan' },
  { value: 'greaterThanOrEqualTo', labelKey: 'conditionalFormat.opGreaterThanOrEqualTo' },
  { value: 'lessThan', labelKey: 'conditionalFormat.opLessThan' },
  { value: 'lessThanOrEqualTo', labelKey: 'conditionalFormat.opLessThanOrEqualTo' },
  { value: 'containing', labelKey: 'conditionalFormat.opContaining' },
  { value: 'notContaining', labelKey: 'conditionalFormat.opNotContaining' },
  { value: 'beginningWith', labelKey: 'conditionalFormat.opBeginningWith' },
  { value: 'endingWith', labelKey: 'conditionalFormat.opEndingWith' },
];

function parseConditionValue(value: string, dataType: ConditionDataType) {
  if (dataType === 'number') {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }
  if (dataType === 'boolean') {
    return value === 'true' || value === '1';
  }
  return value;
}
