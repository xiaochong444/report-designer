import React, { useMemo, useState } from 'react';
import { Button, Empty, Modal, Space } from 'antd';
import type { Band, DataSource } from '@report-designer/core';
import { useDesignerStore } from '../../store/designer-store';
import { createTextComponent, uid } from './dialog-utils';

interface GroupWizardDialogProps {
  open: boolean;
  onClose: () => void;
}

export const GroupWizardDialog: React.FC<GroupWizardDialogProps> = ({ open, onClose }) => {
  const template = useDesignerStore(s => s.template);
  const updateTemplate = useDesignerStore(s => s.updateTemplate);
  const fields = useMemo(() => getGroupFields(template.dataSources), [template.dataSources]);
  const [selected, setSelected] = useState(fields[0]?.value ?? '');

  const createGroup = () => {
    const field = fields.find(item => item.value === selected) ?? fields[0];
    if (!field) return;

    updateTemplate(current => ({
      ...current,
      pages: current.pages.map((page, pageIndex) => {
        if (pageIndex !== 0) return page;
        const dataIndex = Math.max(0, page.bands.findIndex(band => (
          band.type === 'data' && (!(band.dataBand?.dataSourceId ?? band.dataSource) || (band.dataBand?.dataSourceId ?? band.dataSource) === field.dataSourceId)
        )));
        const dataBand = page.bands[dataIndex];
        const groupHeader: Band = {
          id: uid('band_group_header'),
          type: 'groupHeader',
          height: 14,
          group: { name: field.fieldName, conditionExpression: `{${field.dataSourceId}.${field.fieldName}}` },
          components: [createTextComponent(`{${field.dataSourceId}.${field.fieldName}}`, 10, 3, 80, 8, 'Group Header')],
        };
        const sumField = (field.source.schema ?? field.source.fields ?? []).find(item => item.type === 'number')?.name;
        const groupFooter: Band = {
          id: uid('band_group_footer'),
          type: 'groupFooter',
          height: 14,
          group: { name: field.fieldName, conditionExpression: `{${field.dataSourceId}.${field.fieldName}}` },
          components: [
            createTextComponent(`COUNT("${field.dataSourceId}")`, 10, 3, 42, 8, 'Group Count'),
            createTextComponent(sumField ? `SUM("${field.dataSourceId}", "{${field.dataSourceId}.${sumField}}")` : `SUM("${field.dataSourceId}")`, 58, 3, 70, 8, 'Group Sum'),
          ],
        };
        const bands = [...page.bands];
        bands[dataIndex] = {
          ...dataBand,
          dataBand: {
            ...dataBand.dataBand,
            dataSourceId: dataBand.dataBand?.dataSourceId ?? dataBand.dataSource ?? field.dataSourceId,
            sort: [{ field: field.fieldName, direction: 'asc' }],
          },
        };
        bands.splice(dataIndex, 0, groupHeader);
        bands.splice(dataIndex + 2, 0, groupFooter);
        return { ...page, bands };
      }),
    }));
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Group Wizard"
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button key="create" type="primary" onClick={createGroup} disabled={fields.length === 0}>
          Create group
        </Button>,
      ]}
    >
      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
        {fields.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : fields.map(field => (
          <button
            key={field.value}
            type="button"
            className={selected === field.value ? 'rd-field-option rd-field-option-active' : 'rd-field-option'}
            onMouseDown={() => setSelected(field.value)}
            onClick={() => setSelected(field.value)}
          >
            {field.label}
          </button>
        ))}
      </Space>
    </Modal>
  );
};

function getGroupFields(dataSources: DataSource[]) {
  return dataSources.flatMap(source =>
    (source.schema ?? source.fields ?? []).map(field => ({
      value: `${source.id}.${field.name}`,
      label: `${source.id}.${field.name}`,
      dataSourceId: source.id,
      fieldName: field.name,
      source,
    })),
  );
}
