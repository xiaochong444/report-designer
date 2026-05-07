import React from 'react';
import { Input, InputNumber, Select, Space, Typography } from 'antd';
import { useDesignerStore } from '../../store/designer-store';
import { formatUnitValue, getUnitStep, parseUnitValue } from '../../page-settings';

export const BandPropertyGrid: React.FC = () => {
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

  return (
    <Space orientation="vertical" size={10} style={{ width: '100%' }}>
      <Typography.Text type="secondary">Name</Typography.Text>
      <Input value={band.id} readOnly />
      <Select
        value={band.dataBand?.dataSourceId ?? band.dataSource}
        placeholder="Data source"
        allowClear
        options={template.dataSources.map(source => ({ value: source.id, label: source.name || source.id }))}
        onChange={value => updateTemplate(current => ({
          ...current,
          pages: current.pages.map(item => item.id === page.id ? {
            ...item,
            bands: item.bands.map(nextBand => nextBand.id === band.id ? {
              ...nextBand,
              dataBand: {
                ...nextBand.dataBand,
                dataSourceId: value,
              },
            } : nextBand),
          } : item),
        }))}
      />
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
