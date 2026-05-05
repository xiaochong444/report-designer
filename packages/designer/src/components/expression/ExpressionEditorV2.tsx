import React, { useMemo } from 'react';
import { Button, Input, Space, Tag, Typography } from 'antd';
import type { DataSource } from '@report-designer/core';

interface ExpressionEditorV2Props {
  value: string;
  dataSources: DataSource[];
  onChange: (value: string) => void;
}

export const ExpressionEditorV2: React.FC<ExpressionEditorV2Props> = ({ value, dataSources, onChange }) => {
  const numericField = useMemo(() => {
    for (const source of dataSources) {
      const field = source.schema.find(item => item.type === 'number') ?? source.schema[0];
      if (field) return { source, field };
    }
    return null;
  }, [dataSources]);

  const append = (snippet: string) => onChange(`${value}${snippet}`);

  return (
    <Space orientation="vertical" size={10} style={{ width: '100%' }}>
      <Input.TextArea aria-label="Expression" value={value} rows={4} onChange={event => onChange(event.target.value)} />
      <Space wrap>
        {dataSources.flatMap(source => source.schema.map(field => (
          <Button key={`${source.id}.${field.name}`} size="small" onClick={() => append(`{${source.id}.${field.name}}`)}>
            {source.id}.{field.name}
          </Button>
        )))}
      </Space>
      <Space wrap>
        <Button size="small" onClick={() => numericField && append(`SUM("${numericField.source.id}", "{${numericField.source.id}.${numericField.field.name}}")`)}>
          SUM
        </Button>
        <Button size="small" onClick={() => append('{PageNumber}')}>{'{PageNumber}'}</Button>
        <Button size="small" onClick={() => append('{TotalPages}')}>{'{TotalPages}'}</Button>
      </Space>
      <Typography.Text type={isExpressionValid(value) ? 'success' : 'danger'}>
        {isExpressionValid(value) ? 'Valid expression' : 'Invalid expression'}
      </Typography.Text>
      <Tag color="blue">Stimulsoft syntax</Tag>
    </Space>
  );
};

function isExpressionValid(value: string): boolean {
  let balance = 0;
  for (const char of value) {
    if (char === '{') balance += 1;
    if (char === '}') balance -= 1;
    if (balance < 0) return false;
  }
  return balance === 0;
}
