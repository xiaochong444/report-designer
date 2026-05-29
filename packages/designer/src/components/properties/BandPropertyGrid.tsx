import React from 'react';
import { Button, Collapse, Form, Input, InputNumber, Select, Space, Switch, Typography } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { BandPrintOn, DataBandOptions, DataField, GroupBandOptions } from '@report-designer/core';
import { useDesignerStore } from '../../store/designer-store';
import { formatUnitValue, getUnitStep, parseUnitValue } from '../../page-settings';
import { useDesignerI18n, type DesignerMessageKey } from '../../i18n';
import { EventEditorDialog, type EventTreeItem } from '../events/EventEditorDialog';
import { buildEventEditorDataContext } from '../events/event-editor-utils';
import { ExpressionEditor } from '../ExpressionEditor';

type BandExpressionTarget = 'visibleExpression' | 'filterExpression' | 'groupExpression';

export const BandPropertyGrid: React.FC = () => {
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
  const isGroupBand = band.type === 'groupHeader' || band.type === 'groupFooter';
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
  const expressionValue = expressionTarget ? getBandExpressionValue(expressionTarget.field, band, behavior) : '';
  const applyExpressionValue = (value: string) => {
    if (!expressionTarget) return;
    switch (expressionTarget.field) {
      case 'visibleExpression':
        updateBehavior({ visibleExpression: value });
        break;
      case 'filterExpression':
        updateBandDataBand(dataBand => ({ ...dataBand, filterExpression: value }));
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
        onChange={applyExpressionValue}
        onClose={() => setExpressionTarget(null)}
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
        defaultActiveKey={['basic', isDataBand ? 'data' : '', isGroupBand ? 'group' : '', 'behavior', 'events'].filter(Boolean)}
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
              <Space orientation="vertical" size={8} style={{ width: '100%' }}>
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
                  <Form.Item label={t('bandProperties.filterExpression')}>
                    <BandExpressionField
                      label={t('bandProperties.filterExpression')}
                      value={band.dataBand?.filterExpression ?? ''}
                      placeholder="{Orders.Amount} > 0"
                      onChange={value => updateBandDataBand(dataBand => ({ ...dataBand, filterExpression: value }))}
                      onOpen={() => setExpressionTarget({ field: 'filterExpression', label: t('bandProperties.filterExpression') })}
                      t={t}
                    />
                  </Form.Item>
                </Form>
                <Space data-testid="databand-sort-rules" orientation="vertical" size={8} style={{ width: '100%' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Typography.Text type="secondary">{t('dataBand.sort.title')}</Typography.Text>
                    <Button
                      size="small"
                      onClick={() => {
                        const field = sortFields[0]?.value;
                        if (field) {
                          updateSortRules([...sortRules, { field, direction: 'asc' }]);
                        }
                      }}
                      disabled={sortFields.length === 0}
                    >
                      {t('dataBand.sort.addRule')}
                    </Button>
                  </Space>
                  {sortRules.map((rule, index) => (
                    <Space.Compact key={`${index}-${rule.field}`} style={{ width: '100%' }}>
                      <Select
                        aria-label={t('dataBand.sort.fieldAria', { index: index + 1 })}
                        value={rule.field}
                        options={sortFields}
                        style={{ flex: 1, minWidth: 0 }}
                        onChange={value => {
                          const nextRules = [...sortRules];
                          nextRules[index] = { ...nextRules[index], field: value };
                          updateSortRules(nextRules);
                        }}
                      />
                      <Button
                        aria-label={t('dataBand.sort.ascending')}
                        type={rule.direction === 'asc' ? 'primary' : 'default'}
                        onClick={() => {
                          const nextRules = [...sortRules];
                          nextRules[index] = { ...nextRules[index], direction: 'asc' };
                          updateSortRules(nextRules);
                        }}
                      >
                        <ArrowUpOutlined />
                      </Button>
                      <Button
                        aria-label={t('dataBand.sort.descending')}
                        type={rule.direction === 'desc' ? 'primary' : 'default'}
                        onClick={() => {
                          const nextRules = [...sortRules];
                          nextRules[index] = { ...nextRules[index], direction: 'desc' };
                          updateSortRules(nextRules);
                        }}
                      >
                        <ArrowDownOutlined />
                      </Button>
                      <Button
                        aria-label={t('dataBand.sort.moveUp', { index: index + 1 })}
                        disabled={index === 0}
                        onClick={() => updateSortRules(moveRule(sortRules, index, index - 1))}
                      >
                        <ArrowUpOutlined />
                      </Button>
                      <Button
                        aria-label={t('dataBand.sort.moveDown', { index: index + 1 })}
                        disabled={index === sortRules.length - 1}
                        onClick={() => updateSortRules(moveRule(sortRules, index, index + 1))}
                      >
                        <ArrowDownOutlined />
                      </Button>
                      <Button
                        aria-label={t('dataBand.sort.deleteRule', { index: index + 1 })}
                        onClick={() => updateSortRules(sortRules.filter((_, nextIndex) => nextIndex !== index))}
                      >
                        <DeleteOutlined />
                      </Button>
                    </Space.Compact>
                  ))}
                  {sortFields.length === 0 && (
                    <Typography.Text type="secondary">{t('dataBand.sort.noFields')}</Typography.Text>
                  )}
                </Space>
              </Space>
            ),
          }] : []),
          ...(isGroupBand ? [{
            key: 'group',
            label: t('bandProperties.group'),
            children: (
              <Form data-testid="band-properties-group-form" layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label={t('bandProperties.groupName')}>
                  <Input
                    aria-label={t('bandProperties.groupName')}
                    value={band.group?.name ?? ''}
                    onChange={event => updateBandGroup(group => ({ ...group, name: event.target.value }))}
                  />
                </Form.Item>
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

function getBandExpressionValue(
  field: BandExpressionTarget,
  band: { dataBand?: DataBandOptions; group?: GroupBandOptions },
  behavior: { visibleExpression?: string },
): string {
  switch (field) {
    case 'visibleExpression':
      return behavior.visibleExpression ?? '';
    case 'filterExpression':
      return band.dataBand?.filterExpression ?? '';
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
