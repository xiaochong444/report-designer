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
import { useDesignerI18n, type DesignerLocale } from '../i18n';
import { useDesignerStore } from '../store/designer-store';

type ConditionDataType = NonNullable<ConditionRule['dataType']>;
type ConditionOperator = NonNullable<ConditionRule['operator']>;

interface ConditionalFormatManagerProps {
  open: boolean;
  onClose: () => void;
}

export const ConditionalFormatManager: React.FC<ConditionalFormatManagerProps> = ({ open, onClose }) => {
  const { locale } = useDesignerI18n();
  const t = createConditionT(locale);
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

  const handleCreate = () => {
    const id = createConditionalFormat({ name: t('newFormatName') });
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
      title={<span>{t('title')}</span>}
      open={open}
      onCancel={onClose}
      width={980}
      getContainer={false}
      aria-label={t('title')}
      modalRender={modal => React.cloneElement(modal as React.ReactElement<any>, {
        'aria-label': t('title'),
        'aria-labelledby': undefined,
      })}
      footer={<Button type="primary" onClick={onClose}>{t('done')}</Button>}
    >
      <div style={{ display: 'flex', height: 560, minHeight: 0, gap: 12 }}>
        <aside style={{ width: 248, display: 'flex', minHeight: 0, flexDirection: 'column', borderRight: '1px solid #f0f0f0', paddingRight: 12 }}>
          <Input.Search
            aria-label={t('search')}
            placeholder={t('search')}
            value={searchText}
            onChange={event => setSearchText(event.target.value)}
            size="small"
            style={{ marginBottom: 8 }}
          />
          <Space size={6} style={{ marginBottom: 8 }}>
            <Button aria-label={t('new')} size="small" icon={<PlusOutlined aria-hidden />} onClick={handleCreate}>{t('new')}</Button>
            <Button aria-label={t('duplicate')} size="small" onClick={handleDuplicate} disabled={!selectedFormat}>{t('duplicate')}</Button>
            <Button aria-label={t('delete')} size="small" danger icon={<DeleteOutlined aria-hidden />} onClick={handleDelete} disabled={!selectedFormat}>{t('delete')}</Button>
          </Space>
          <Button
            aria-label={t('applyToSelected')}
            size="small"
            type="primary"
            disabled={!selectedFormat || selectedComponentCount === 0}
            onClick={handleApplyToSelected}
            style={{ marginBottom: 8 }}
            block
          >
            {t('applyToSelected')}
          </Button>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {filteredFormats.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('empty')} />
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
                <span style={{ color: '#8c8c8c', fontSize: 11 }}>{t('ruleCount', { count: format.rules.length })}</span>
              </button>
            ))}
          </div>
        </aside>

        <main style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
          {selectedFormat ? (
            <Space orientation="vertical" size={12} style={{ width: '100%' }}>
              <section>
                <Form layout="vertical" size="small">
                  <Form.Item label={t('name')}>
                    <Input
                      aria-label={t('name')}
                      value={selectedFormat.name}
                      onChange={event => updateSelectedFormat({ name: event.target.value })}
                    />
                  </Form.Item>
                </Form>
              </section>

              <section style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <strong>{t('rules')}</strong>
                  {selectedRule ? (
                    <Tag color={selectedRule.enabled === false ? 'default' : 'blue'}>
                      {selectedRule.enabled === false ? t('disabled') : t('enabled')}
                    </Tag>
                  ) : null}
                </div>
                {selectedRule ? (
                  <Form layout="vertical" size="small">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 160px', gap: 8 }}>
                    <Form.Item label={t('conditionField')}>
                      <Input
                        aria-label={t('conditionField')}
                        value={selectedRule.field ?? ''}
                        onChange={event => updateRule(selectedRule.id, { conditionType: 'value', field: event.target.value })}
                        placeholder="{Orders.Amount}"
                      />
                    </Form.Item>
                    <Form.Item label={t('dataType')}>
                      <Select
                        aria-label={t('dataType')}
                        value={selectedRule.dataType ?? 'string'}
                        onChange={(value: ConditionDataType) => updateRule(selectedRule.id, {
                          conditionType: 'value',
                          dataType: value,
                          value: parseConditionValue(String(selectedRule.value ?? ''), value),
                        })}
                        virtual={false}
                        options={DATA_TYPE_OPTIONS.map(option => ({ value: option.value, label: t(option.labelKey) }))}
                      />
                    </Form.Item>
                    <Form.Item label={t('operator')}>
                      <Select
                        aria-label={t('operator')}
                        value={selectedRule.operator ?? 'equalTo'}
                        onChange={(value: ConditionOperator) => updateRule(selectedRule.id, { conditionType: 'value', operator: value })}
                        virtual={false}
                        options={OPERATOR_OPTIONS.map(option => ({ value: option.value, label: t(option.labelKey) }))}
                      />
                    </Form.Item>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <Form.Item label={t('value')}>
                      <Input
                        aria-label={t('value')}
                        value={String(selectedRule.value ?? '')}
                        onChange={event => updateRuleValue(selectedRule, event.target.value)}
                      />
                    </Form.Item>
                    <Form.Item label={t('expression')}>
                      <Input
                        aria-label={t('expression')}
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
                    {t('breakIfTrue')}
                  </Checkbox>
                  </Form>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('noRules')} />
                )}
              </section>

              {selectedRule ? (
              <section style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: 12 }}>
                <strong>{t('formatting')}</strong>
                <Divider style={{ margin: '10px 0' }} />
                <Space size={6} wrap>
                  <Button
                    aria-label={t('bold')}
                    title={t('bold')}
                    icon={<BoldOutlined />}
                    type={selectedRule.overrides?.fontWeight ? 'primary' : 'default'}
                    onClick={() => updateRuleOverride(selectedRule, 'fontWeight', !selectedRule.overrides?.fontWeight)}
                  />
                  <Button
                    aria-label={t('italic')}
                    title={t('italic')}
                    icon={<ItalicOutlined />}
                    type={selectedRule.overrides?.fontStyle ? 'primary' : 'default'}
                    onClick={() => updateRuleOverride(selectedRule, 'fontStyle', !selectedRule.overrides?.fontStyle)}
                  />
                  <Button
                    aria-label={t('underline')}
                    title={t('underline')}
                    icon={<UnderlineOutlined />}
                    type={selectedRule.overrides?.textDecoration ? 'primary' : 'default'}
                    onClick={() => updateRuleOverride(selectedRule, 'textDecoration', !selectedRule.overrides?.textDecoration)}
                  />
                </Space>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
                  <Form layout="vertical" size="small">
                    <Form.Item label={t('textColor')}>
                      <Input
                        aria-label={t('textColor')}
                        type="color"
                        value={String(selectedRule.overrides?.fontColor ?? '#000000')}
                        onChange={event => updateRuleOverride(selectedRule, 'fontColor', event.target.value)}
                      />
                    </Form.Item>
                  </Form>
                  <Form layout="vertical" size="small">
                    <Form.Item label={t('backgroundColor')}>
                      <Input
                        aria-label={t('backgroundColor')}
                        type="color"
                        prefix={<BgColorsOutlined />}
                        value={String(selectedRule.overrides?.backgroundColor ?? '#ffffff')}
                        onChange={event => updateRuleOverride(selectedRule, 'backgroundColor', event.target.value)}
                      />
                    </Form.Item>
                  </Form>
                  <Form layout="vertical" size="small">
                    <Form.Item label={t('borderStyle')}>
                      <Select
                        aria-label={t('borderStyle')}
                        value={(selectedRule.overrides?.border as any)?.style ?? selectedRule.overrides?.border ?? 'none'}
                        onChange={value => updateRuleOverride(selectedRule, 'border', value)}
                        virtual={false}
                        options={[
                          { value: 'none', label: t('borderNone') },
                          { value: 'solid', label: t('borderSolid') },
                          { value: 'dashed', label: t('borderDashed') },
                          { value: 'dotted', label: t('borderDotted') },
                          { value: 'double', label: t('borderDouble') },
                        ]}
                      />
                    </Form.Item>
                  </Form>
                </div>
              </section>
              ) : null}
            </Space>
          ) : (
            <Empty description={t('selectOrCreate')} />
          )}
        </main>
      </div>
    </Modal>
    <Modal
      title={deleteTarget ? t('deleteTitle', { name: deleteTarget.name }) : t('delete')}
      open={Boolean(deleteTarget)}
      getContainer={false}
      onOk={confirmDelete}
      onCancel={() => setDeleteTarget(null)}
      okText={t('confirm')}
      cancelText={t('cancel')}
      okButtonProps={{ 'aria-label': t('confirm') }}
      cancelButtonProps={{ 'aria-label': t('cancel') }}
    >
      {t('deleteDescription')}
    </Modal>
    </div>
  );
};

const DATA_TYPE_OPTIONS: Array<{ value: ConditionDataType; labelKey: ConditionMessageKey }> = [
  { value: 'string', labelKey: 'typeString' },
  { value: 'number', labelKey: 'typeNumber' },
  { value: 'date', labelKey: 'typeDate' },
  { value: 'boolean', labelKey: 'typeBoolean' },
  { value: 'expression', labelKey: 'typeExpression' },
];

const OPERATOR_OPTIONS: Array<{ value: ConditionOperator; labelKey: ConditionMessageKey }> = [
  { value: 'equalTo', labelKey: 'opEqualTo' },
  { value: 'notEqualTo', labelKey: 'opNotEqualTo' },
  { value: 'between', labelKey: 'opBetween' },
  { value: 'notBetween', labelKey: 'opNotBetween' },
  { value: 'greaterThan', labelKey: 'opGreaterThan' },
  { value: 'greaterThanOrEqualTo', labelKey: 'opGreaterThanOrEqualTo' },
  { value: 'lessThan', labelKey: 'opLessThan' },
  { value: 'lessThanOrEqualTo', labelKey: 'opLessThanOrEqualTo' },
  { value: 'containing', labelKey: 'opContaining' },
  { value: 'notContaining', labelKey: 'opNotContaining' },
  { value: 'beginningWith', labelKey: 'opBeginningWith' },
  { value: 'endingWith', labelKey: 'opEndingWith' },
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

const conditionMessages = {
  'zh-CN': {
    title: '条件格式库',
    search: '搜索条件格式',
    new: '新建',
    duplicate: '复制',
    delete: '删除',
    applyToSelected: '应用到选中项',
    done: '完成',
    cancel: '取消',
    confirm: '确认',
    empty: '没有条件格式',
    newFormatName: '新建条件格式',
    ruleCount: '{count} 条规则',
    deleteTitle: '删除“{name}”？',
    deleteDescription: '删除后会清除已选择该条件格式的组件引用。',
    name: '名称',
    rules: '规则',
    enabled: '已启用',
    disabled: '已禁用',
    noRules: '没有规则',
    conditionField: '条件字段',
    dataType: '数据类型',
    operator: '操作符',
    value: '值',
    expression: '表达式',
    breakIfTrue: '满足后停止',
    formatting: '格式设置',
    bold: '加粗',
    italic: '斜体',
    underline: '下划线',
    textColor: '文本颜色',
    backgroundColor: '背景色',
    borderStyle: '边框样式',
    borderNone: '无',
    borderSolid: '实线',
    borderDashed: '虚线',
    borderDotted: '点线',
    borderDouble: '双线',
    selectOrCreate: '选择或新建一个条件格式',
    typeString: '文本',
    typeNumber: '数字',
    typeDate: '日期',
    typeBoolean: '布尔值',
    typeExpression: '表达式',
    opEqualTo: '等于',
    opNotEqualTo: '不等于',
    opBetween: '介于',
    opNotBetween: '不介于',
    opGreaterThan: '大于',
    opGreaterThanOrEqualTo: '大于等于',
    opLessThan: '小于',
    opLessThanOrEqualTo: '小于等于',
    opContaining: '包含',
    opNotContaining: '不包含',
    opBeginningWith: '开头为',
    opEndingWith: '结尾为',
  },
  'en-US': {
    title: 'Conditional Format Library',
    search: 'Search conditional formats',
    new: 'New',
    duplicate: 'Duplicate',
    delete: 'Delete',
    applyToSelected: 'Apply to Selected',
    done: 'Done',
    cancel: 'Cancel',
    confirm: 'Confirm',
    empty: 'No conditional formats',
    newFormatName: 'New Conditional Format',
    ruleCount: '{count} rule(s)',
    deleteTitle: 'Delete "{name}"?',
    deleteDescription: 'Deleting it clears this conditional format from referenced components.',
    name: 'Name',
    rules: 'Rules',
    enabled: 'Enabled',
    disabled: 'Disabled',
    noRules: 'No rules',
    conditionField: 'Condition field',
    dataType: 'Data type',
    operator: 'Operator',
    value: 'Value',
    expression: 'Expression',
    breakIfTrue: 'Break if True',
    formatting: 'Formatting',
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    textColor: 'Text color',
    backgroundColor: 'Background color',
    borderStyle: 'Border style',
    borderNone: 'None',
    borderSolid: 'Solid',
    borderDashed: 'Dashed',
    borderDotted: 'Dotted',
    borderDouble: 'Double',
    selectOrCreate: 'Select or create a conditional format',
    typeString: 'Text',
    typeNumber: 'Number',
    typeDate: 'Date',
    typeBoolean: 'Boolean',
    typeExpression: 'Expression',
    opEqualTo: 'Equal to',
    opNotEqualTo: 'Not equal to',
    opBetween: 'Between',
    opNotBetween: 'Not between',
    opGreaterThan: 'Greater than',
    opGreaterThanOrEqualTo: 'Greater than or equal to',
    opLessThan: 'Less than',
    opLessThanOrEqualTo: 'Less than or equal to',
    opContaining: 'Containing',
    opNotContaining: 'Not containing',
    opBeginningWith: 'Beginning with',
    opEndingWith: 'Ending with',
  },
} as const;

type ConditionMessageKey = keyof typeof conditionMessages['zh-CN'];

function createConditionT(locale: DesignerLocale) {
  const messages = conditionMessages[locale] ?? conditionMessages['zh-CN'];
  const fallback = conditionMessages['en-US'];
  return (key: ConditionMessageKey, values?: Record<string, string | number>) => {
    const message = messages[key] ?? fallback[key] ?? key;
    if (!values) return message;
    return message.replace(/\{(\w+)\}/g, (match, valueKey) => (
      Object.prototype.hasOwnProperty.call(values, valueKey) ? String(values[valueKey]) : match
    ));
  };
}
