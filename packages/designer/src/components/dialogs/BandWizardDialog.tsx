import React, { useMemo, useState } from 'react';
import { Button, Modal, Radio, Select, Space } from 'antd';
import type { Band } from '@report-designer/core';
import { useDesignerStore } from '../../store/designer-store';
import { createTextComponent, uid } from './dialog-utils';

interface BandWizardDialogProps {
  open: boolean;
  onClose: () => void;
}

type BandPreset = 'header-data-footer' | 'data-only';

export const BandWizardDialog: React.FC<BandWizardDialogProps> = ({ open, onClose }) => {
  const template = useDesignerStore(s => s.template);
  const updateTemplate = useDesignerStore(s => s.updateTemplate);
  const [preset, setPreset] = useState<BandPreset>('header-data-footer');
  const [dataSourceId, setDataSourceId] = useState(template.dataSources[0]?.id ?? '');

  const sourceOptions = useMemo(
    () => template.dataSources.map(source => ({ value: source.id, label: source.name || source.id })),
    [template.dataSources],
  );

  const createBands = () => {
    const source = template.dataSources.find(item => item.id === dataSourceId) ?? template.dataSources[0];
    if (!source) return;

    updateTemplate(current => ({
      ...current,
      pages: current.pages.map((page, index) => {
        if (index !== 0) return page;
        const fieldComponents = source.schema.slice(0, 5).map((field, fieldIndex) =>
          createTextComponent(`{${source.id}.${field.name}}`, 10 + fieldIndex * 36, 2, 34, 8, field.name),
        );
        const nextBands: Band[] = preset === 'data-only'
          ? [{ id: uid('band_data'), type: 'data', height: 14, dataSource: source.id, components: fieldComponents }]
          : [
              { id: uid('band_header'), type: 'header', height: 12, components: source.schema.slice(0, 5).map((field, fieldIndex) => createTextComponent(field.label || field.name, 10 + fieldIndex * 36, 2, 34, 8, `${field.name} Header`)) },
              { id: uid('band_data'), type: 'data', height: 14, dataSource: source.id, components: fieldComponents },
              { id: uid('band_footer'), type: 'footer', height: 12, components: [createTextComponent(`COUNT("${source.id}")`, 10, 2, 50, 8, 'Count')] },
            ];

        return {
          ...page,
          bands: [
            ...page.bands.map(band => band.type === 'data' && !band.dataSource ? { ...band, dataSource: source.id } : band),
            ...nextBands,
          ],
        };
      }),
    }));
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Band Wizard"
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button key="create" type="primary" onClick={createBands} disabled={!dataSourceId}>
          Create bands
        </Button>,
      ]}
    >
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Select
          aria-label="Data source"
          value={dataSourceId || undefined}
          options={sourceOptions}
          style={{ width: '100%' }}
          onChange={setDataSourceId}
        />
        <Radio.Group value={preset} onChange={event => setPreset(event.target.value)}>
          <Space orientation="vertical">
            <Radio value="header-data-footer" aria-label="HeaderBand + DataBand + FooterBand">HeaderBand + DataBand + FooterBand</Radio>
            <Radio value="data-only" aria-label="DataBand only">DataBand only</Radio>
          </Space>
        </Radio.Group>
      </Space>
    </Modal>
  );
};
