import React from 'react';
import { Input, InputNumber, Select, Space, Typography } from 'antd';
import { useDesignerStore } from '../../store/designer-store';

export const PropertyGridV2: React.FC = () => {
  const template = useDesignerStore(s => s.template);
  const selectedBandId = useDesignerStore(s => s.selectedBandId);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const updateTemplate = useDesignerStore(s => s.updateTemplate);
  const page = template.pages.find(item => item.id === currentPageId) ?? template.pages[0];
  const band = page?.bands.find(item => item.id === selectedBandId);

  if (!band || !page) {
    return <Typography.Text type="secondary">No object selected</Typography.Text>;
  }

  return (
    <Space orientation="vertical" size={10} style={{ width: '100%' }}>
      <Typography.Text type="secondary">Name</Typography.Text>
      <Input value={band.id} readOnly />
      <Select
        value={band.dataSource}
        placeholder="Data source"
        allowClear
        options={template.dataSources.map(source => ({ value: source.id, label: source.name || source.id }))}
        onChange={value => updateTemplate(current => ({
          ...current,
          pages: current.pages.map(item => item.id === page.id ? {
            ...item,
            bands: item.bands.map(nextBand => nextBand.id === band.id ? { ...nextBand, dataSource: value } : nextBand),
          } : item),
        }))}
      />
      <Typography.Text type="secondary">Height (mm)</Typography.Text>
      <InputNumber
        value={band.height}
        min={4}
        max={200}
        style={{ width: '100%' }}
        onChange={value => updateTemplate(current => ({
          ...current,
          pages: current.pages.map(item => item.id === page.id ? {
            ...item,
            bands: item.bands.map(nextBand => nextBand.id === band.id ? { ...nextBand, height: value ?? nextBand.height } : nextBand),
          } : item),
        }))}
      />
    </Space>
  );
};
