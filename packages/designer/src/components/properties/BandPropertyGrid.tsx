import React from 'react';
import { Button, Input, InputNumber, Select, Space, Typography } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined } from '@ant-design/icons';
import type { DataBandOptions, DataField } from '@report-designer/core';
import { useDesignerStore } from '../../store/designer-store';
import { formatUnitValue, getUnitStep, parseUnitValue } from '../../page-settings';
import { useDesignerI18n } from '../../i18n';

export const BandPropertyGrid: React.FC = () => {
  const { t } = useDesignerI18n();
  const template = useDesignerStore(s => s.template);
  const selectedBandId = useDesignerStore(s => s.selectedBandId);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const updateTemplate = useDesignerStore(s => s.updateTemplate);
  const reportUnit = useDesignerStore(s => s.reportUnit);
  const page = template.pages.find(item => item.id === currentPageId) ?? template.pages[0];
  const band = page?.bands.find(item => item.id === selectedBandId);

  if (!band || !page) {
    return <Typography.Text type="secondary">No object selected</Typography.Text>;
  }

  const unitStep = getUnitStep(reportUnit);
  const bandMin = formatUnitValue(4, reportUnit);
  const bandMax = formatUnitValue(200, reportUnit);
  const dataSourceId = band.dataBand?.dataSourceId ?? band.dataSource;
  const currentDataSource = template.dataSources.find(source => source.id === dataSourceId);
  const sortFields = getSortFields(currentDataSource?.schema?.length ? currentDataSource.schema : currentDataSource?.fields);
  const sortRules = band.dataBand?.sort ?? [];

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

  const updateSortRules = (sort: NonNullable<DataBandOptions['sort']>) => {
    updateBandDataBand(dataBand => ({
      ...dataBand,
      sort,
    }));
  };

  return (
    <Space orientation="vertical" size={10} style={{ width: '100%' }}>
      <Typography.Text type="secondary">Name</Typography.Text>
      <Input value={band.id} readOnly />
      <Select
        aria-label={t('dataBand.dataSource')}
        value={dataSourceId}
        placeholder={t('dataBand.dataSource')}
        allowClear
        options={template.dataSources.map(source => ({ value: source.id, label: source.name || source.id }))}
        onChange={value => updateBandDataBand(dataBand => ({
          ...dataBand,
          dataSourceId: value,
          sort: [],
        }))}
      />
      {(band.type === 'data' || band.type === 'hierarchicalData') && (
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
      )}
      <Typography.Text type="secondary">Height</Typography.Text>
      <InputNumber
        value={formatUnitValue(band.height, reportUnit)}
        min={bandMin}
        max={bandMax}
        step={unitStep}
        style={{ width: '100%' }}
        onChange={value => updateTemplate(current => ({
          ...current,
          pages: current.pages.map(item => item.id === page.id ? {
            ...item,
            bands: item.bands.map(nextBand => nextBand.id === band.id ? { ...nextBand, height: parseUnitValue(value, reportUnit, nextBand.height) } : nextBand),
          } : item),
        }))}
      />
    </Space>
  );
};

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
