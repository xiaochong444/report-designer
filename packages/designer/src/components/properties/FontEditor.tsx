import React from 'react';
import { Button, ColorPicker, Form, InputNumber, Select, Space } from 'antd';
import { BoldOutlined, ItalicOutlined, StrikethroughOutlined, UnderlineOutlined } from '@ant-design/icons';
import type { FontConfig, ReportFontOption } from '@report-designer/core';

export type FontField = 'family' | 'size' | 'color' | 'bold' | 'italic' | 'underline' | 'strikethrough';

const ALL_FIELDS: FontField[] = ['family', 'size', 'color', 'bold', 'italic', 'underline', 'strikethrough'];

export interface FontEditorLabels {
  fontFamily: string;
  fontSize: string;
  textColor: string;
  bold: string;
  italic: string;
  underline: string;
  strike: string;
}

export interface FontEditorProps {
  value: FontConfig;
  onChange: (next: FontConfig) => void;
  reportFontOptions: ReportFontOption[];
  fields?: FontField[];
  sizeRange?: [number, number];
  disabled?: boolean | ((field: FontField) => boolean);
  labels: FontEditorLabels;
}

const FORM_LABEL_COL = { span: 8 };
const FORM_WRAPPER_COL = { span: 16 };

/**
 * 字体编辑器公共组件。
 * 通过 fields 白名单控制渲染哪些字段，解决不同场景（图表轴标签仅 size+color、主标题全家桶、水印仅 family+size）的能力差异。
 */
export const FontEditor: React.FC<FontEditorProps> = ({
  value,
  onChange,
  reportFontOptions,
  fields = ALL_FIELDS,
  sizeRange = [6, 72],
  disabled = false,
  labels,
}) => {
  const active = React.useMemo(() => new Set(fields), [fields]);
  const isDisabled = React.useCallback(
    (field: FontField) => (typeof disabled === 'function' ? disabled(field) : disabled),
    [disabled],
  );
  const update = React.useCallback(
    (field: keyof FontConfig, next: any) => onChange({ ...value, [field]: next }),
    [onChange, value],
  );

  const fontOptions = React.useMemo(
    () => reportFontOptions.map(option => ({
      value: option.value,
      label: <span style={{ fontFamily: option.fontFamily }}>{option.label}</span>,
    })),
    [reportFontOptions],
  );

  return (
    <Form size="small" labelCol={FORM_LABEL_COL} wrapperCol={FORM_WRAPPER_COL}>
      {active.has('family') ? (
        <Form.Item label={labels.fontFamily}>
          <Select
            aria-label={labels.fontFamily}
            value={value.family || ''}
            onChange={v => update('family', v)}
            size="small"
            disabled={isDisabled('family')}
            style={{ width: '100%' }}
            showSearch
            allowClear
            options={fontOptions}
          />
        </Form.Item>
      ) : null}

      {active.has('size') ? (
        <Form.Item label={labels.fontSize}>
          <InputNumber
            aria-label={labels.fontSize}
            value={value.size}
            onChange={v => update('size', v ?? sizeRange[0])}
            size="small"
            disabled={isDisabled('size')}
            style={{ width: '100%' }}
            min={sizeRange[0]}
            max={sizeRange[1]}
          />
        </Form.Item>
      ) : null}

      {active.has('color') ? (
        <Form.Item label={labels.textColor}>
          <ColorPicker
            aria-label={labels.textColor}
            size="small"
            value={value.color || '#000000'}
            onChange={color => update('color', color.toHexString())}
            disabled={isDisabled('color')}
          />
        </Form.Item>
      ) : null}

      {active.has('bold') || active.has('italic') || active.has('underline') || active.has('strikethrough') ? (
        <Form.Item>
          <Space>
            {active.has('bold') ? (
              <Button
                aria-label={labels.bold}
                title={labels.bold}
                icon={<BoldOutlined />}
                size="small"
                type={value.bold ? 'primary' : 'default'}
                style={{ minWidth: 32 }}
                onClick={() => update('bold', !value.bold)}
                disabled={isDisabled('bold')}
              />
            ) : null}
            {active.has('italic') ? (
              <Button
                aria-label={labels.italic}
                title={labels.italic}
                icon={<ItalicOutlined />}
                size="small"
                type={value.italic ? 'primary' : 'default'}
                style={{ minWidth: 32 }}
                onClick={() => update('italic', !value.italic)}
                disabled={isDisabled('italic')}
              />
            ) : null}
            {active.has('underline') ? (
              <Button
                aria-label={labels.underline}
                title={labels.underline}
                icon={<UnderlineOutlined />}
                size="small"
                type={value.underline ? 'primary' : 'default'}
                style={{ minWidth: 32 }}
                onClick={() => update('underline', !value.underline)}
                disabled={isDisabled('underline')}
              />
            ) : null}
            {active.has('strikethrough') ? (
              <Button
                aria-label={labels.strike}
                title={labels.strike}
                icon={<StrikethroughOutlined />}
                size="small"
                type={value.strikethrough ? 'primary' : 'default'}
                style={{ minWidth: 32 }}
                onClick={() => update('strikethrough', !value.strikethrough)}
                disabled={isDisabled('strikethrough')}
              />
            ) : null}
          </Space>
        </Form.Item>
      ) : null}
    </Form>
  );
};
