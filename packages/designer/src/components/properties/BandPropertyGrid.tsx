import React from 'react';
import { Button, Collapse, ColorPicker, Form, Input, InputNumber, Modal, Select, Space, Switch, Typography } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { BandPrintOn, DataBandOptions, DataField, GroupBandOptions } from '@report-designer/core';
import { useDesignerStore } from '../../store/designer-store';
import { formatUnitValue, getUnitStep, parseUnitValue } from '../../page-settings';
import { useDesignerI18n, type DesignerMessageKey } from '../../i18n';
import { EventEditorDialog, type EventTreeItem } from '../events/EventEditorDialog';
import { buildEventEditorDataContext } from '../events/event-editor-utils';
import { ExpressionEditor } from '../ExpressionEditor';
import type { ExpressionCatalogExtensions } from '../../expression/expression-catalog';

type BandExpressionTarget = 'visibleExpression' | 'groupExpression';
type SortRule = NonNullable<DataBandOptions['sort']>[number];
type FilterOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith';
type FieldOption = { value: string; label: string; type: DataField['type'] };
interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: string;
}

export const BandPropertyGrid: React.FC<{ expressionExtensions?: ExpressionCatalogExtensions }> = ({ expressionExtensions }) => {
  const { t } = useDesignerI18n();
  const template = useDesignerStore(s => s.template);
  const selectedBandId = useDesignerStore(s => s.selectedBandId);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const updateTemplate = useDesignerStore(s => s.updateTemplate);
  const replaceBandEvents = useDesignerStore(s => s.replaceBandEvents);
  const reportUnit = useDesignerStore(s => s.reportUnit);
  const pendingEventEditorTarget = useDesignerStore(s => s.pendingEventEditorTarget);
  const consumeEventEditorTarget = useDesignerStore(s => s.consumeEventEditorTarget);
  const [eventEditorOpen, setEventEditorOpen] = React.useState(false);
  const [eventEditorTarget, setEventEditorTarget] = React.useState<typeof pendingEventEditorTarget>(null);
  const [expressionTarget, setExpressionTarget] = React.useState<{ field: BandExpressionTarget; label: string } | null>(null);
  const [sortEditorOpen, setSortEditorOpen] = React.useState(false);
  const [draftSortRules, setDraftSortRules] = React.useState<SortRule[]>([]);
  const [filterEditorOpen, setFilterEditorOpen] = React.useState(false);
  const [draftFilterConditions, setDraftFilterConditions] = React.useState<FilterCondition[]>([]);
  const [filterValueExpressionIndex, setFilterValueExpressionIndex] = React.useState<number | null>(null);
  const page = template.pages.find(item => item.id === currentPageId) ?? template.pages[0];
  const band = page?.bands.find(item => item.id === selectedBandId);

  if (!band || !page) {
    return <Typography.Text type="secondary">{t('propertyPanel.noObjectSelected')}</Typography.Text>;
  }

  const unitStep = getUnitStep(reportUnit);
  const bandMin = formatUnitValue(4, reportUnit);
  const bandMax = formatUnitValue(200, reportUnit);
  const dataSourceId = band.dataBand?.dataSourceId ?? band.dataSource;
  const currentDataSource = template.dataSources.find(source => source.id === dataSourceId);
  const sortFields = getSortFields(currentDataSource?.schema?.length ? currentDataSource.schema : currentDataSource?.fields);
  const sortRules = band.dataBand?.sort ?? [];
  const isDataBand = band.type === 'data' || band.type === 'hierarchicalData';
  const isGroupHeader = band.type === 'groupHeader';
  const supportsPrintOnAllPages = band.type === 'header' || band.type === 'columnHeader' || band.type === 'groupHeader';
  const supportsPrintAtBottom = band.type !== 'pageHeader' && band.type !== 'pageFooter' && band.type !== 'overlay';
  const supportsBreakIfLessThan = supportsPrintAtBottom;
  const behavior = {
    enabled: true,
    printOn: 'allPages' as const,
    printIfEmpty: true,
    printOnAllPages: band.type === 'pageHeader' || band.type === 'pageFooter' || band.type === 'groupHeader',
    printAtBottom: band.type === 'pageFooter',
    autoGrow: true,
    autoShrink: false,
    ...band.behavior,
  };
  const pendingTarget = pendingEventEditorTarget?.ownerType === 'band' && pendingEventEditorTarget.ownerId === band?.id
    ? pendingEventEditorTarget
    : null;

  React.useEffect(() => {
    if (!pendingTarget) return;
    setEventEditorTarget(pendingTarget);
    setEventEditorOpen(true);
    consumeEventEditorTarget(pendingTarget.requestId);
  }, [consumeEventEditorTarget, pendingTarget]);

  const updateBand = (updates: Partial<typeof band>) => {
    updateTemplate(current => ({
      ...current,
      pages: current.pages.map(item => item.id === page.id ? {
        ...item,
        bands: item.bands.map(nextBand => nextBand.id === band.id ? { ...nextBand, ...updates } : nextBand),
      } : item),
    }));
  };

  const updateBehavior = (updates: Partial<typeof behavior>) => {
    updateBand({ behavior: { ...behavior, ...updates } });
  };

  const updateBandDataBand = (updater: (dataBand: DataBandOptions) => DataBandOptions) => {
    updateTemplate(current => ({
      ...current,
      pages: current.pages.map(item => item.id === page.id ? {
        ...item,
        bands: item.bands.map(nextBand => nextBand.id === band.id ? {
          ...nextBand,
          dataBand: updater(nextBand.dataBand ?? {}),
        } : nextBand),
      } : item),
    }));
  };

  const updateBandGroup = (updater: (group: GroupBandOptions) => GroupBandOptions) => {
    updateTemplate(current => ({
      ...current,
      pages: current.pages.map(item => item.id === page.id ? {
        ...item,
        bands: item.bands.map(nextBand => nextBand.id === band.id ? {
          ...nextBand,
          group: updater(nextBand.group ?? {}),
        } : nextBand),
      } : item),
    }));
  };

  const updateSortRules = (sort: NonNullable<DataBandOptions['sort']>) => {
    updateBandDataBand(dataBand => ({
      ...dataBand,
      sort,
    }));
  };
  const openSortEditor = () => {
    setDraftSortRules(sortRules.map(rule => ({ ...rule })));
    setSortEditorOpen(true);
  };
  const openFilterEditor = () => {
    setDraftFilterConditions(parseFilterExpression(band.dataBand?.filterExpression, dataSourceId));
    setFilterEditorOpen(true);
  };
  const updateFilterValue = (value: string) => {
    if (filterValueExpressionIndex == null) return;
    setDraftFilterConditions(conditions => conditions.map((condition, index) => (
      index === filterValueExpressionIndex ? { ...condition, value } : condition
    )));
  };
  const expressionValue = expressionTarget ? getBandExpressionValue(expressionTarget.field, band, behavior) : '';
  const filterExpressionValue = filterValueExpressionIndex == null ? '' : draftFilterConditions[filterValueExpressionIndex]?.value ?? '';
  const applyExpressionValue = (value: string) => {
    if (!expressionTarget) return;
    switch (expressionTarget.field) {
      case 'visibleExpression':
        updateBehavior({ visibleExpression: value });
        break;
      case 'groupExpression':
        updateBandGroup(group => ({ ...group, conditionExpression: value }));
        break;
    }
  };

  return (
    <Space orientation="vertical" size={10} style={{ width: '100%' }}>
      <ExpressionEditor
        open={Boolean(expressionTarget)}
        value={expressionValue}
        expressionExtensions={expressionExtensions}
        onChange={applyExpressionValue}
        onClose={() => setExpressionTarget(null)}
      />
      <ExpressionEditor
        open={filterValueExpressionIndex != null}
        value={filterExpressionValue}
        expressionExtensions={expressionExtensions}
        onChange={updateFilterValue}
        onClose={() => setFilterValueExpressionIndex(null)}
      />
      <SortEditorDialog
        open={sortEditorOpen}
        fields={sortFields}
        rules={draftSortRules}
        onChange={setDraftSortRules}
        onCancel={() => setSortEditorOpen(false)}
        onApply={() => {
          updateSortRules(draftSortRules);
          setSortEditorOpen(false);
        }}
        t={t}
      />
      <FilterEditorDialog
        open={filterEditorOpen}
        fields={sortFields}
        conditions={draftFilterConditions}
        onChange={setDraftFilterConditions}
        onOpenExpression={setFilterValueExpressionIndex}
        onCancel={() => setFilterEditorOpen(false)}
        onApply={() => {
          updateBandDataBand(dataBand => ({
            ...dataBand,
            filterExpression: buildFilterExpression(draftFilterConditions, dataSourceId),
          }));
          setFilterEditorOpen(false);
        }}
        t={t}
      />
      <EventEditorDialog
        open={eventEditorOpen}
        targetType="band"
        events={band.events}
        initialEventName={eventEditorTarget?.eventName}
        initialCursor={eventEditorTarget ? { line: eventEditorTarget.line, column: eventEditorTarget.column } : undefined}
        dataContext={buildEventEditorDataContext(template, { targetType: 'band', bandId: band.id })}
        dictionaryItems={buildDictionaryEventItems(template)}
        componentItems={buildComponentEventItems(template)}
        onCancel={() => {
          setEventEditorOpen(false);
          setEventEditorTarget(null);
        }}
        onSave={(events) => {
          replaceBandEvents(page.id, band.id, events);
          setEventEditorOpen(false);
          setEventEditorTarget(null);
        }}
      />
      <Collapse
        size="small"
        defaultActiveKey={['basic', isDataBand ? 'data' : '', isGroupHeader ? 'group' : '', 'behavior', 'events'].filter(Boolean)}
        items={[
          {
            key: 'basic',
            label: t('bandProperties.basic'),
            children: (
              <Form data-testid="band-properties-basic-form" layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label={t('bandProperties.id')}>
                  <Input aria-label={t('bandProperties.id')} value={band.id} readOnly />
                </Form.Item>
                <Form.Item label={t('bandProperties.name')}>
                  <Input aria-label={t('bandProperties.name')} value={band.name ?? ''} onChange={event => updateBand({ name: event.target.value })} />
                </Form.Item>
                <Form.Item label={t('bandProperties.height')}>
                  <InputNumber
                    aria-label={t('bandProperties.height')}
                    value={formatUnitValue(band.height, reportUnit)}
                    min={bandMin}
                    max={bandMax}
                    step={unitStep}
                    style={{ width: '100%' }}
                    onChange={value => updateBand({ height: parseUnitValue(value, reportUnit, band.height) })}
                  />
                </Form.Item>
              </Form>
            ),
          },
          ...(isDataBand ? [{
            key: 'data',
            label: t('bandProperties.data'),
            children: (
              <Form data-testid="band-properties-data-form" layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label={t('dataBand.dataSource')}>
                  <Select
                    aria-label={t('dataBand.dataSource')}
                    value={dataSourceId}
                    placeholder={t('dataBand.dataSource')}
                    allowClear
                    size="small"
                    style={{ width: '100%' }}
                    options={template.dataSources.map(source => ({ value: source.id, label: source.name || source.id }))}
                    onChange={value => updateBandDataBand(dataBand => ({
                      ...dataBand,
                      dataSourceId: value,
                      sort: [],
                    }))}
                  />
                </Form.Item>
                <Form.Item label={t('bandProperties.filter')}>
                  <SummaryEditField
                    label={t('bandProperties.filter')}
                    value={band.dataBand?.filterExpression ? t('dataBand.filter.filtered') : t('dataBand.filter.notFiltered')}
                    buttonLabel={t('dataBand.filter.edit')}
                    onOpen={openFilterEditor}
                  />
                </Form.Item>
                <Form.Item label={t('dataBand.sort.title')}>
                  <SummaryEditField
                    label={t('dataBand.sort.title')}
                    value={formatSortSummary(sortRules, sortFields, t)}
                    buttonLabel={t('dataBand.sort.edit')}
                    onOpen={openSortEditor}
                    disabled={sortFields.length === 0}
                  />
                  {sortFields.length === 0 && (
                    <Typography.Text type="secondary">{t('dataBand.sort.noFields')}</Typography.Text>
                  )}
                </Form.Item>
                <Form.Item label={t('dataBand.oddRowBackgroundColor')}>
                  <BandColorField
                    label={t('dataBand.oddRowBackgroundColor')}
                    value={band.dataBand?.oddRowBackgroundColor ?? ''}
                    onChange={value => updateBandDataBand(dataBand => ({ ...dataBand, oddRowBackgroundColor: value || undefined }))}
                  />
                </Form.Item>
                <Form.Item label={t('dataBand.evenRowBackgroundColor')}>
                  <BandColorField
                    label={t('dataBand.evenRowBackgroundColor')}
                    value={band.dataBand?.evenRowBackgroundColor ?? ''}
                    onChange={value => updateBandDataBand(dataBand => ({ ...dataBand, evenRowBackgroundColor: value || undefined }))}
                  />
                </Form.Item>
              </Form>
            ),
          }] : []),
          ...(isGroupHeader ? [{
            key: 'group',
            label: t('bandProperties.group'),
            children: (
              <Form data-testid="band-properties-group-form" layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label={t('bandProperties.groupExpression')}>
                  <BandExpressionField
                    label={t('bandProperties.groupExpression')}
                    value={band.group?.conditionExpression ?? ''}
                    placeholder="{Orders.CustomerId}"
                    onChange={value => updateBandGroup(group => ({ ...group, conditionExpression: value }))}
                    onOpen={() => setExpressionTarget({ field: 'groupExpression', label: t('bandProperties.groupExpression') })}
                    t={t}
                  />
                </Form.Item>
                <Form.Item label={t('bandProperties.groupSort')}>
                  <Select
                    aria-label={t('bandProperties.groupSort')}
                    value={band.group?.sortDirection ?? 'none'}
                    size="small"
                    style={{ width: '100%' }}
                    options={groupSortOptions(t)}
                    onChange={sortDirection => updateBandGroup(group => ({ ...group, sortDirection }))}
                  />
                </Form.Item>
              </Form>
            ),
          }] : []),
          {
          key: 'behavior',
          label: t('bandProperties.behavior'),
          children: (
            <Form data-testid="band-properties-behavior-form" layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
              <Form.Item label={t('bandProperties.enabled')}>
                <Switch aria-label={t('bandProperties.enabled')} checked={behavior.enabled} onChange={enabled => updateBehavior({ enabled })} />
              </Form.Item>
              <Form.Item label={t('bandProperties.visibleExpression')}>
                <BandExpressionField
                  label={t('bandProperties.visibleExpression')}
                  value={behavior.visibleExpression ?? ''}
                  placeholder="{Orders.ShowDetails}"
                  onChange={value => updateBehavior({ visibleExpression: value })}
                  onOpen={() => setExpressionTarget({ field: 'visibleExpression', label: t('bandProperties.visibleExpression') })}
                  t={t}
                />
              </Form.Item>
              <Form.Item label={t('bandProperties.printOn')}>
                <Select
                  aria-label={t('bandProperties.printOn')}
                  value={behavior.printOn}
                  size="small"
                  style={{ width: '100%' }}
                  options={printOnOptions(t)}
                  onChange={(printOn: BandPrintOn) => updateBehavior({ printOn })}
                />
              </Form.Item>
              {supportsPrintOnAllPages && (
                <Form.Item label={t('bandProperties.printOnAllPages')}>
                <Switch aria-label={t('bandProperties.printOnAllPages')} checked={behavior.printOnAllPages} onChange={printOnAllPages => updateBehavior({ printOnAllPages })} />
                </Form.Item>
              )}
              {supportsPrintAtBottom && (
                <Form.Item label={t('bandProperties.printAtBottom')}>
                <Switch aria-label={t('bandProperties.printAtBottom')} checked={behavior.printAtBottom} onChange={printAtBottom => updateBehavior({ printAtBottom })} />
                </Form.Item>
              )}
              <Form.Item label={t('bandProperties.printIfEmpty')}>
                <Switch aria-label={t('bandProperties.printIfEmpty')} checked={behavior.printIfEmpty} onChange={printIfEmpty => updateBehavior({ printIfEmpty })} />
              </Form.Item>
              <Form.Item label={t('bandProperties.autoGrow')}>
                <Switch aria-label={t('bandProperties.autoGrow')} checked={behavior.autoGrow !== false} onChange={autoGrow => updateBehavior({ autoGrow })} />
              </Form.Item>
              <Form.Item label={t('bandProperties.autoShrink')}>
                <Switch aria-label={t('bandProperties.autoShrink')} checked={behavior.autoShrink ?? false} onChange={autoShrink => updateBehavior({ autoShrink })} />
              </Form.Item>
              {supportsBreakIfLessThan && (
                <Form.Item label={t('bandProperties.breakIfLessThan')}>
                  <InputNumber
                    aria-label={t('bandProperties.breakIfLessThan')}
                    value={formatUnitValue(behavior.breakIfLessThan ?? 0, reportUnit)}
                    min={0}
                    step={unitStep}
                    style={{ width: '100%' }}
                    onChange={value => updateBehavior({ breakIfLessThan: parseUnitValue(value, reportUnit, behavior.breakIfLessThan ?? 0) })}
                  />
                </Form.Item>
              )}
            </Form>
          ),
        },
        {
          key: 'events',
          label: t('bandProperties.events'),
          children: (
            <Button size="small" onClick={() => {
              setEventEditorTarget(null);
              setEventEditorOpen(true);
            }}>
              {t('events.edit')}
            </Button>
          ),
        }]}
      />
    </Space>
  );
};

function printOnOptions(t: (key: DesignerMessageKey) => string): Array<{ value: BandPrintOn; label: string }> {
  return [
    { value: 'allPages', label: t('bandProperties.printOn.allPages') },
    { value: 'firstPage', label: t('bandProperties.printOn.firstPage') },
    { value: 'exceptFirstPage', label: t('bandProperties.printOn.exceptFirstPage') },
    { value: 'lastPage', label: t('bandProperties.printOn.lastPage') },
    { value: 'oddPages', label: t('bandProperties.printOn.oddPages') },
    { value: 'evenPages', label: t('bandProperties.printOn.evenPages') },
  ];
}

function groupSortOptions(t: (key: DesignerMessageKey) => string): Array<{ value: NonNullable<GroupBandOptions['sortDirection']>; label: string }> {
  return [
    { value: 'none', label: t('bandProperties.groupSort.none') },
    { value: 'asc', label: t('bandProperties.groupSort.asc') },
    { value: 'desc', label: t('bandProperties.groupSort.desc') },
  ];
}

const SummaryEditField: React.FC<{
  label: string;
  value: string;
  buttonLabel: string;
  disabled?: boolean;
  onOpen: () => void;
}> = ({ buttonLabel, disabled, label, onOpen, value }) => (
  <Space.Compact style={{ width: '100%' }}>
    <Input aria-label={label} value={value} readOnly size="small" />
    <Button aria-label={buttonLabel} title={buttonLabel} icon={<EditOutlined />} onClick={onOpen} disabled={disabled} style={{ width: 32 }} />
  </Space.Compact>
);

const BandColorField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, onChange, value }) => (
  <Space.Compact style={{ width: '100%' }}>
    <ColorPicker value={value || '#ffffff'} onChange={color => onChange(color.toHexString())} />
    <Input aria-label={label} value={value} placeholder="transparent" size="small" onChange={event => onChange(event.target.value)} />
  </Space.Compact>
);

const SortEditorDialog: React.FC<{
  open: boolean;
  fields: FieldOption[];
  rules: SortRule[];
  onChange: (rules: SortRule[]) => void;
  onCancel: () => void;
  onApply: () => void;
  t: (key: DesignerMessageKey, values?: Record<string, string | number>) => string;
}> = ({ fields, onApply, onCancel, onChange, open, rules, t }) => {
  const addRule = () => {
    const field = fields[0]?.value;
    if (field) {
      onChange([...rules, { field, direction: 'asc' }]);
    }
  };

  return (
    <Modal
      open={open}
      title={t('dataBand.sort.dialogTitle')}
      width={560}
      onCancel={onCancel}
      onOk={onApply}
      okText={t('common.ok')}
      cancelText={t('common.cancel')}
    >
      <Space orientation="vertical" size={10} style={{ width: '100%' }}>
        <Button onClick={addRule} disabled={fields.length === 0}>{t('dataBand.sort.addRule')}</Button>
        {rules.map((rule, index) => (
          <Space.Compact key={`${index}-${rule.field}`} style={{ width: '100%' }}>
            <Select
              aria-label={t('dataBand.sort.fieldAria', { index: index + 1 })}
              value={rule.field}
              options={fields}
              style={{ flex: 1, minWidth: 0 }}
              onChange={field => onChange(rules.map((next, nextIndex) => nextIndex === index ? { ...next, field } : next))}
            />
            <Select
              aria-label={t('dataBand.sort.directionAria', { index: index + 1 })}
              value={rule.direction}
              options={[
                { value: 'asc', label: t('dataBand.sort.ascending') },
                { value: 'desc', label: t('dataBand.sort.descending') },
              ]}
              style={{ width: 132 }}
              onChange={direction => onChange(rules.map((next, nextIndex) => nextIndex === index ? { ...next, direction } : next))}
            />
            <Button
              aria-label={t('dataBand.sort.moveUp', { index: index + 1 })}
              disabled={index === 0}
              onClick={() => onChange(moveRule(rules, index, index - 1))}
            >
              <ArrowUpOutlined />
            </Button>
            <Button
              aria-label={t('dataBand.sort.moveDown', { index: index + 1 })}
              disabled={index === rules.length - 1}
              onClick={() => onChange(moveRule(rules, index, index + 1))}
            >
              <ArrowDownOutlined />
            </Button>
            <Button
              aria-label={t('dataBand.sort.deleteRule', { index: index + 1 })}
              onClick={() => onChange(rules.filter((_, nextIndex) => nextIndex !== index))}
            >
              <DeleteOutlined />
            </Button>
          </Space.Compact>
        ))}
      </Space>
    </Modal>
  );
};

const FilterEditorDialog: React.FC<{
  open: boolean;
  fields: FieldOption[];
  conditions: FilterCondition[];
  onChange: (conditions: FilterCondition[]) => void;
  onOpenExpression: (index: number) => void;
  onCancel: () => void;
  onApply: () => void;
  t: (key: DesignerMessageKey, values?: Record<string, string | number>) => string;
}> = ({ conditions, fields, onApply, onCancel, onChange, onOpenExpression, open, t }) => {
  const addCondition = () => {
    const field = fields[0]?.value;
    if (field) {
      onChange([...conditions, { field, operator: defaultFilterOperatorForField(field, fields), value: '' }]);
    }
  };

  return (
    <Modal
      open={open}
      title={t('dataBand.filter.dialogTitle')}
      width={640}
      onCancel={onCancel}
      onOk={onApply}
      okText={t('common.ok')}
      cancelText={t('common.cancel')}
    >
      <Space orientation="vertical" size={10} style={{ width: '100%' }}>
        <Button onClick={addCondition} disabled={fields.length === 0}>{t('dataBand.filter.addCondition')}</Button>
        {conditions.map((condition, index) => (
          <Space.Compact key={`${index}-${condition.field}`} style={{ width: '100%' }}>
            <Select
              aria-label={t('dataBand.filter.fieldAria', { index: index + 1 })}
              value={condition.field}
              options={fields}
              style={{ flex: 1, minWidth: 0 }}
              onChange={field => onChange(conditions.map((next, nextIndex) => nextIndex === index ? {
                ...next,
                field,
                operator: normalizeFilterOperator(next.operator, field, fields),
              } : next))}
            />
            <Select
              aria-label={t('dataBand.filter.operatorAria', { index: index + 1 })}
              value={condition.operator}
              options={filterOperatorOptions(t, fields.find(field => field.value === condition.field)?.type)}
              style={{ width: 168 }}
              onChange={operator => onChange(conditions.map((next, nextIndex) => nextIndex === index ? { ...next, operator: operator as FilterOperator } : next))}
            />
            <Input
              aria-label={t('dataBand.filter.valueAria', { index: index + 1 })}
              value={condition.value}
              onChange={event => onChange(conditions.map((next, nextIndex) => nextIndex === index ? { ...next, value: event.target.value } : next))}
              style={{ flex: 1, minWidth: 0 }}
            />
            <Button
              aria-label={t('dataBand.filter.openValueExpression', { index: index + 1 })}
              title={t('dataBand.filter.openValueExpression', { index: index + 1 })}
              icon={<EditOutlined />}
              onClick={() => onOpenExpression(index)}
            />
            <Button
              aria-label={t('dataBand.filter.deleteCondition', { index: index + 1 })}
              onClick={() => onChange(conditions.filter((_, nextIndex) => nextIndex !== index))}
            >
              <DeleteOutlined />
            </Button>
          </Space.Compact>
        ))}
      </Space>
    </Modal>
  );
};

function filterOperatorOptions(t: (key: DesignerMessageKey) => string, fieldType?: DataField['type']): Array<{ value: FilterOperator; label: string }> {
  const equalityOptions: Array<{ value: FilterOperator; label: string }> = [
    { value: '=', label: t('dataBand.filter.operator.equal') },
    { value: '!=', label: t('dataBand.filter.operator.notEqual') },
  ];
  if (fieldType === 'boolean') {
    return equalityOptions;
  }
  if (fieldType === 'string') {
    return [
      ...equalityOptions,
      { value: 'contains', label: t('dataBand.filter.operator.contains') },
      { value: 'startsWith', label: t('dataBand.filter.operator.startsWith') },
      { value: 'endsWith', label: t('dataBand.filter.operator.endsWith') },
    ];
  }
  return [
    ...equalityOptions,
    { value: '>', label: t('dataBand.filter.operator.greaterThan') },
    { value: '<', label: t('dataBand.filter.operator.lessThan') },
    { value: '>=', label: t('dataBand.filter.operator.greaterThanOrEqual') },
    { value: '<=', label: t('dataBand.filter.operator.lessThanOrEqual') },
  ];
}

function buildDictionaryEventItems(template: { dataSources: Array<{ id: string; name?: string; fields?: DataField[]; schema?: DataField[] }> }): EventTreeItem[] {
  return template.dataSources.map(source => ({
    key: source.id,
    title: source.name || source.id,
    children: (source.schema ?? source.fields ?? []).map(field => ({
      key: `${source.id}.${field.name}`,
      title: field.label || field.name,
    })),
  }));
}

function buildComponentEventItems(template: { pages: Array<{ id: string; bands: Array<{ id: string; name?: string; components: Array<{ id: string; name?: string }> }> }> }): EventTreeItem[] {
  return template.pages.map(page => ({
    key: page.id,
    title: page.id,
    children: page.bands.map(band => ({
      key: band.id,
      title: band.name || band.id,
      children: band.components.map(component => ({
        key: component.name || component.id,
        title: component.name || component.id,
      })),
    })),
  }));
}

function getSortFields(fields: DataField[] | undefined) {
  return (fields ?? []).map(field => ({
    value: field.name,
    label: field.label || field.name,
    type: field.type,
  }));
}

function moveRule<T>(rules: T[], from: number, to: number): T[] {
  if (to < 0 || to >= rules.length) {
    return rules;
  }
  const next = [...rules];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function formatSortSummary(
  rules: SortRule[],
  fields: FieldOption[],
  t: (key: DesignerMessageKey) => string,
): string {
  if (rules.length === 0) {
    return t('dataBand.sort.noSorting');
  }
  return rules.map(rule => {
    const label = fields.find(field => field.value === rule.field)?.label ?? rule.field;
    return `${label} ${rule.direction.toUpperCase()}`;
  }).join(', ');
}

function parseFilterExpression(expression: string | undefined, dataSourceId: string | undefined): FilterCondition[] {
  const trimmed = expression?.trim();
  if (!trimmed) {
    return [];
  }
  const sourcePattern = dataSourceId ? escapeRegExp(dataSourceId) : '[\\w-]+';
  const conditionPattern = new RegExp(`^\\{${sourcePattern}\\.([\\w-]+)\\}\\s*(=|==|!=|>=|<=|>|<)\\s*(.+)$`);
  const functionPattern = new RegExp(`^(CONTAINS|STARTSWITH|ENDSWITH)\\(\\s*\\{${sourcePattern}\\.([\\w-]+)\\}\\s*,\\s*(.+)\\)$`, 'i');
  const conditions = trimmed.split(/\s+AND\s+/i).map(part => {
    const functionMatch = part.trim().match(functionPattern);
    if (functionMatch) {
      return {
        field: functionMatch[2],
        operator: filterOperatorFromFunction(functionMatch[1]),
        value: unquoteFilterValue(functionMatch[3].trim()),
      };
    }
    const match = part.trim().match(conditionPattern);
    if (!match) {
      return null;
    }
    return {
      field: match[1],
      operator: (match[2] === '==' ? '=' : match[2]) as FilterOperator,
      value: unquoteFilterValue(match[3].trim()),
    };
  });
  return conditions.every(Boolean) ? conditions as FilterCondition[] : [];
}

function buildFilterExpression(conditions: FilterCondition[], dataSourceId: string | undefined): string {
  if (!dataSourceId) {
    return '';
  }
  return conditions
    .filter(condition => condition.field && condition.value.trim())
    .map(condition => formatFilterCondition(condition, dataSourceId))
    .join(' AND ');
}

function formatFilterCondition(condition: FilterCondition, dataSourceId: string): string {
  const fieldExpression = `{${dataSourceId}.${condition.field}}`;
  const valueExpression = formatFilterValue(condition.value);
  const functionName = filterOperatorFunction(condition.operator);
  if (functionName) {
    return `${functionName}(${fieldExpression}, ${valueExpression})`;
  }
  return `${fieldExpression} ${condition.operator} ${valueExpression}`;
}

function formatFilterValue(value: string): string {
  const trimmed = value.trim();
  if (/^\{.+\}$/.test(trimmed) || /^(true|false|null)$/i.test(trimmed) || /^-?\d+(\.\d+)?$/.test(trimmed)) {
    return trimmed;
  }
  return JSON.stringify(trimmed);
}

function unquoteFilterValue(value: string): string {
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }
  return value;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function defaultFilterOperatorForField(field: string, fields: FieldOption[]): FilterOperator {
  return filterOperatorOptionsForType(fields.find(item => item.value === field)?.type)[0];
}

function normalizeFilterOperator(operator: FilterOperator, field: string, fields: FieldOption[]): FilterOperator {
  const operators = filterOperatorOptionsForType(fields.find(item => item.value === field)?.type);
  return operators.includes(operator) ? operator : operators[0];
}

function filterOperatorOptionsForType(fieldType?: DataField['type']): FilterOperator[] {
  if (fieldType === 'boolean') {
    return ['=', '!='];
  }
  if (fieldType === 'string') {
    return ['=', '!=', 'contains', 'startsWith', 'endsWith'];
  }
  return ['=', '!=', '>', '<', '>=', '<='];
}

function filterOperatorFunction(operator: FilterOperator): string | null {
  switch (operator) {
    case 'contains':
      return 'CONTAINS';
    case 'startsWith':
      return 'STARTSWITH';
    case 'endsWith':
      return 'ENDSWITH';
    default:
      return null;
  }
}

function filterOperatorFromFunction(name: string): FilterOperator {
  switch (name.toUpperCase()) {
    case 'STARTSWITH':
      return 'startsWith';
    case 'ENDSWITH':
      return 'endsWith';
    default:
      return 'contains';
  }
}

function getBandExpressionValue(
  field: BandExpressionTarget,
  band: { dataBand?: DataBandOptions; group?: GroupBandOptions },
  behavior: { visibleExpression?: string },
): string {
  switch (field) {
    case 'visibleExpression':
      return behavior.visibleExpression ?? '';
    case 'groupExpression':
      return band.group?.conditionExpression ?? '';
  }
}

const BandExpressionField: React.FC<{
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onOpen: () => void;
  t: (key: DesignerMessageKey, values?: Record<string, string | number>) => string;
}> = ({ label, onChange, onOpen, placeholder, t, value }) => {
  const title = t('bandProperties.openExpressionEditorFor', { field: label });
  return (
    <Space.Compact style={{ width: '100%' }}>
      <Input
        aria-label={label}
        value={value}
        placeholder={placeholder}
        size="small"
        onChange={event => onChange(event.target.value)}
      />
      <Button
        aria-label={title}
        title={title}
        icon={<EditOutlined />}
        onClick={onOpen}
        style={{ width: 32 }}
      />
    </Space.Compact>
  );
};
