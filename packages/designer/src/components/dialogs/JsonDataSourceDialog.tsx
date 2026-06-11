import React, { useMemo, useState } from 'react';
import { Alert, Button, Input, Modal, Space, Table, Typography } from 'antd';
import type { DataField, DataSource } from '@report-designer/core';
import { expandJsonDataBySources, inferJsonDictionary } from '@report-designer/core';
import { useDesignerStore } from '../../store/designer-store';
import { useDesignerI18n } from '../../i18n';

interface JsonDataSourceDialogProps {
  open: boolean;
  onClose: () => void;
}

export const JsonDataSourceDialog: React.FC<JsonDataSourceDialogProps> = ({ open, onClose }) => {
  const { t } = useDesignerI18n();
  const [json, setJson] = useState('');
  const updateTemplate = useDesignerStore(s => s.updateTemplate);
  const setDataSources = useDesignerStore(s => s.setDataSources);

  const parsedResult = useMemo((): { value: Record<string, unknown> | null; error: string | null } => {
    if (!json.trim()) return { value: null, error: null };
    try {
      return { value: JSON.parse(json) as Record<string, unknown>, error: null };
    } catch {
      return { value: null, error: t('jsonDataSource.invalidJson') };
    }
  }, [json, t]);
  const parsed = parsedResult.value;
  const error = parsedResult.error;

  const inferred = useMemo(() => parsed ? inferJsonDictionary(parsed) : { dataSources: [] }, [parsed]);

  const addDataSources = () => {
    if (!parsed) return;
    const nextSources: DataSource[] = inferred.dataSources.map(source => {
      const fields = source.fields ?? [];
      return {
        id: source.id,
        name: source.name,
        type: 'json',
        path: source.path,
        fields: fields.map<DataField>(field => ({
          name: field.name,
          type: field.type === 'null' ? 'string' : field.type,
          label: field.name,
        })),
        schema: fields.map<DataField>(field => ({
          name: field.name,
          type: field.type === 'null' ? 'string' : field.type,
          label: field.name,
        })),
      };
    });

    updateTemplate(template => ({
      ...template,
      dataSources: nextSources,
    }));

    setDataSources(expandJsonDataBySources(parsed, nextSources));
    onClose();
  };

  return (
    <Modal
      open={open}
      title={t('jsonDataSource.title')}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>{t('common.cancel')}</Button>,
        <Button key="add" type="primary" onClick={addDataSources} disabled={inferred.dataSources.length === 0}>
          {t('jsonDataSource.addDataSources')}
        </Button>,
      ]}
      width={720}
    >
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Input.TextArea
          aria-label="JSON"
          value={json}
          rows={8}
          onChange={event => setJson(event.target.value)}
          placeholder='{ "employees": [{ "name": "Alice", "salary": 100 }] }'
        />
        {error ? <Alert type="error" showIcon title={error} /> : null}
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={inferred.dataSources}
          columns={[
            { title: t('jsonDataSource.column.name'), dataIndex: 'id', key: 'id' },
            { title: t('jsonDataSource.column.path'), key: 'path', render: (_, source) => source.path === source.id ? t('jsonDataSource.rootArray') : source.path },
            {
              title: t('jsonDataSource.column.fields'),
              key: 'fields',
              render: (_, source) => (
                <Typography.Text>{(source.fields ?? []).map(field => field.name).join(', ')}</Typography.Text>
              ),
            },
          ]}
        />
      </Space>
    </Modal>
  );
};
