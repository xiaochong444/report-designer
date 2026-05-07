import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, ColorPicker, Empty, Input, InputNumber, Modal, Select, Space, Switch, Tag, Typography } from 'antd';
import type { BorderConfig, FontConfig, ReportStyle, TextFormatConfig } from '@report-designer/core';
import { useDesignerStore } from '../store/designer-store';

interface TextStyleLibraryDialogProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY_FONT: FontConfig = {
  family: 'Arial',
  size: 10,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  color: '#000000',
};

const EMPTY_BORDER: BorderConfig = {
  style: 'none',
  width: 0,
  color: '#000000',
  sides: { top: false, right: false, bottom: false, left: false },
};

const EMPTY_FORMAT: TextFormatConfig = {
  type: 'none',
};

function filterStyles(styles: ReportStyle[], search: string) {
  const keyword = search.trim().toLowerCase();
  if (!keyword) {
    return styles;
  }
  return styles.filter(style => (
    style.name.toLowerCase().includes(keyword) || style.id.toLowerCase().includes(keyword)
  ));
}

export const TextStyleLibraryDialog: React.FC<TextStyleLibraryDialogProps> = ({ open, onClose }) => {
  const template = useDesignerStore(s => s.template);
  const selectedComponentIds = useDesignerStore(s => s.selectedComponentIds);
  const createTextStyle = useDesignerStore(s => s.createTextStyle);
  const duplicateTextStyle = useDesignerStore(s => s.duplicateTextStyle);
  const renameTextStyle = useDesignerStore(s => s.renameTextStyle);
  const updateTextStyle = useDesignerStore(s => s.updateTextStyle);
  const deleteTextStyle = useDesignerStore(s => s.deleteTextStyle);
  const setDefaultTextStyle = useDesignerStore(s => s.setDefaultTextStyle);
  const applySelectedStyle = useDesignerStore(s => s.applySelectedStyle);
  const getTextStyleUsageCount = useDesignerStore(s => s.getTextStyleUsageCount);

  const [search, setSearch] = useState('');
  const [selectedStyleId, setSelectedStyleId] = useState<string>();
  const [draftName, setDraftName] = useState('');
  const searchRef = useRef(search);
  const visibleSelectedStyleIdRef = useRef<string | undefined>(undefined);

  const filteredStyles = useMemo(() => {
    return filterStyles(template.styles, search);
  }, [search, template.styles]);

  const selectedStyle = useMemo(() => {
    return filteredStyles.find(style => style.id === selectedStyleId) ?? filteredStyles[0];
  }, [filteredStyles, selectedStyleId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setSelectedStyleId(current => {
      if (current && filteredStyles.some(style => style.id === current)) {
        return current;
      }
      return filteredStyles[0]?.id;
    });
  }, [filteredStyles, open]);

  useEffect(() => {
    setDraftName(selectedStyle?.name ?? '');
  }, [selectedStyle?.id, selectedStyle?.name]);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  useEffect(() => {
    visibleSelectedStyleIdRef.current = selectedStyle?.id;
  }, [selectedStyle?.id]);

  const updateSelectedStyle = (updates: Partial<ReportStyle>) => {
    if (!selectedStyle) {
      return;
    }
    updateTextStyle(selectedStyle.id, updates);
  };

  const handleCreate = () => {
    const createdId = createTextStyle({ name: 'New Style' });
    setSelectedStyleId(createdId);
  };

  const handleDuplicate = () => {
    if (!selectedStyle) {
      return;
    }
    const duplicateId = duplicateTextStyle(selectedStyle.id);
    if (duplicateId) {
      setSelectedStyleId(duplicateId);
    }
  };

  const handleRename = () => {
    if (!selectedStyle) {
      return;
    }
    const nextName = draftName.trim();
    if (!nextName) {
      setDraftName(selectedStyle.name);
      return;
    }
    renameTextStyle(selectedStyle.id, nextName);
  };

  const handleDelete = () => {
    if (!selectedStyle) {
      return;
    }
    const deletingId = selectedStyle.id;
    const usageCount = getTextStyleUsageCount(deletingId);
    Modal.confirm({
      title: `Delete "${selectedStyle.name}"?`,
      content: usageCount > 0
        ? `该样式当前被 ${usageCount} 个文本组件引用。删除后会清除引用组件的样式关联。`
        : '删除后无法恢复。',
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: () => {
        const latestTemplate = useDesignerStore.getState().template;
        const latestSearch = searchRef.current;
        const latestVisibleStyles = filterStyles(latestTemplate.styles, latestSearch);
        const latestVisibleSelectedStyleId = visibleSelectedStyleIdRef.current;
        const deletingVisibleIndex = latestVisibleStyles.findIndex(style => style.id === deletingId);

        deleteTextStyle(deletingId);

        const stylesAfterDelete = useDesignerStore.getState().template.styles;
        const visibleStylesAfterDelete = filterStyles(stylesAfterDelete, latestSearch);
        if (
          latestVisibleSelectedStyleId
          && latestVisibleSelectedStyleId !== deletingId
          && visibleStylesAfterDelete.some(style => style.id === latestVisibleSelectedStyleId)
        ) {
          setSelectedStyleId(latestVisibleSelectedStyleId);
          return;
        }

        const fallbackStyle = (
          deletingVisibleIndex >= 0
            ? visibleStylesAfterDelete[deletingVisibleIndex] ?? visibleStylesAfterDelete[deletingVisibleIndex - 1]
            : undefined
        ) ?? visibleStylesAfterDelete[0];
        setSelectedStyleId(fallbackStyle?.id);
      },
    });
  };

  const font = selectedStyle?.font ?? EMPTY_FONT;
  const border = selectedStyle?.border ?? EMPTY_BORDER;
  const padding = selectedStyle?.padding ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const format = selectedStyle?.format ?? EMPTY_FORMAT;

  return (
    <Modal
      open={open}
      title="Text Style Library"
      onCancel={onClose}
      onOk={onClose}
      width={1080}
      okText="Done"
      destroyOnHidden
    >
      <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr) 360px', gap: 16, minHeight: 520 }}>
        <section style={{ display: 'grid', gridTemplateRows: 'auto auto minmax(0, 1fr)', gap: 12, minWidth: 0 }}>
          <Input.Search
            aria-label="样式搜索"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search styles"
            allowClear
          />
          <Space wrap>
            <Button onClick={handleCreate}>New</Button>
            <Button onClick={handleDuplicate} disabled={!selectedStyle}>Duplicate</Button>
            <Button danger onClick={handleDelete} disabled={!selectedStyle}>Delete</Button>
          </Space>
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden', minHeight: 0 }}>
            {filteredStyles.length ? (
              <div style={{ display: 'grid', gap: 4, padding: 8 }}>
                {filteredStyles.map((style) => {
                  const active = style.id === selectedStyle?.id;
                  return (
                    <Button
                      key={style.id}
                      block
                      type={active ? 'primary' : 'text'}
                      onClick={() => setSelectedStyleId(style.id)}
                      style={{ height: 'auto', justifyContent: 'space-between', textAlign: 'left', whiteSpace: 'normal' }}
                    >
                      <span>{style.name}</span>
                      <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                        {style.isDefault ? <Tag color="blue" style={{ marginInlineEnd: 0 }}>Default</Tag> : null}
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {getTextStyleUsageCount(style.id)}
                        </Typography.Text>
                      </span>
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No styles" />
              </div>
            )}
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr', gap: 12, minWidth: 0 }}>
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>Preview</Typography.Title>
            <Typography.Text type="secondary">Simple text preview for the selected style.</Typography.Text>
          </div>
          <div
            style={{
              border: `${Math.max(border.width, 0.2)}px ${border.style === 'none' ? 'solid' : border.style} ${border.color}`,
              background: selectedStyle?.backgroundColor === 'transparent' ? '#ffffff' : selectedStyle?.backgroundColor,
              color: font.color,
              fontFamily: font.family,
              fontSize: font.size,
              fontWeight: font.bold ? 700 : 400,
              fontStyle: font.italic ? 'italic' : 'normal',
              textDecoration: [
                font.underline ? 'underline' : '',
                font.strikethrough ? 'line-through' : '',
              ].filter(Boolean).join(' ') || 'none',
              textAlign: selectedStyle?.textAlign ?? 'left',
              padding: `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`,
              minHeight: 160,
              display: 'flex',
              alignItems: selectedStyle?.verticalAlign === 'bottom' ? 'flex-end' : selectedStyle?.verticalAlign === 'middle' ? 'center' : 'flex-start',
              justifyContent: selectedStyle?.textAlign === 'center' ? 'center' : selectedStyle?.textAlign === 'right' ? 'flex-end' : 'flex-start',
            }}
          >
            The quick brown fox jumps over 123,456.78
          </div>
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: 16 }}>
            <Typography.Paragraph style={{ marginBottom: 8 }}>
              <strong>{selectedStyle?.name ?? 'No style selected'}</strong>
            </Typography.Paragraph>
            <Typography.Text type="secondary">
              Used by {selectedStyle ? getTextStyleUsageCount(selectedStyle.id) : 0} text component(s).
            </Typography.Text>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr)', gap: 12, minWidth: 0 }}>
          <Space wrap>
            <Button onClick={handleRename} disabled={!selectedStyle}>Rename</Button>
            <Button onClick={() => selectedStyle && setDefaultTextStyle(selectedStyle.id)} disabled={!selectedStyle}>Set Default</Button>
            <Button type="primary" onClick={() => selectedStyle && applySelectedStyle(selectedStyle.id)} disabled={!selectedStyle || selectedComponentIds.length === 0}>
              Apply to Selected
            </Button>
          </Space>

          {selectedStyle ? (
            <div style={{ display: 'grid', gap: 10, alignContent: 'start', overflow: 'auto', paddingRight: 4 }}>
              <Field label="Name">
                <Input aria-label="样式名称" value={draftName} onChange={(event) => setDraftName(event.target.value)} />
              </Field>
              <Field label="Font">
                <Select
                  aria-label="样式字体系列"
                  value={font.family}
                  virtual={false}
                  onChange={(value) => updateSelectedStyle({ font: { ...font, family: value } })}
                  options={[
                    'Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Tahoma', 'Georgia',
                    'Microsoft YaHei', 'SimSun', 'SimHei', 'KaiTi',
                  ].map(value => ({ value, label: value }))}
                />
              </Field>
              <Field label="Size">
                <InputNumber
                  aria-label="样式字号"
                  value={font.size}
                  min={6}
                  max={72}
                  style={{ width: '100%' }}
                  onChange={(value) => updateSelectedStyle({ font: { ...font, size: Number(value ?? font.size) } })}
                />
              </Field>
              <Field label="Text Color">
                <ColorPicker
                  aria-label="样式文本颜色"
                  value={font.color}
                  onChange={(value) => updateSelectedStyle({ font: { ...font, color: value.toHexString() } })}
                />
              </Field>
              <Field label="Background">
                <ColorPicker
                  aria-label="样式背景色"
                  value={selectedStyle.backgroundColor}
                  onChange={(value) => updateSelectedStyle({ backgroundColor: value.toHexString() })}
                />
              </Field>
              <InlineSwitches
                values={[
                  { label: 'Bold', checked: font.bold, onChange: (checked) => updateSelectedStyle({ font: { ...font, bold: checked } }) },
                  { label: 'Italic', checked: font.italic, onChange: (checked) => updateSelectedStyle({ font: { ...font, italic: checked } }) },
                  { label: 'Underline', checked: font.underline, onChange: (checked) => updateSelectedStyle({ font: { ...font, underline: checked } }) },
                  { label: 'Strike', checked: font.strikethrough, onChange: (checked) => updateSelectedStyle({ font: { ...font, strikethrough: checked } }) },
                ]}
              />
              <Field label="Horizontal">
                <Select
                  aria-label="样式水平对齐"
                  value={selectedStyle.textAlign ?? 'left'}
                  virtual={false}
                  onChange={(value) => updateSelectedStyle({ textAlign: value })}
                  options={[
                    { value: 'left', label: 'Left' },
                    { value: 'center', label: 'Center' },
                    { value: 'right', label: 'Right' },
                  ]}
                />
              </Field>
              <Field label="Vertical">
                <Select
                  aria-label="样式垂直对齐"
                  value={selectedStyle.verticalAlign ?? 'top'}
                  virtual={false}
                  onChange={(value) => updateSelectedStyle({ verticalAlign: value })}
                  options={[
                    { value: 'top', label: 'Top' },
                    { value: 'middle', label: 'Middle' },
                    { value: 'bottom', label: 'Bottom' },
                  ]}
                />
              </Field>
              <Field label="Format">
                <Select
                  aria-label="样式格式类型"
                  value={format.type}
                  virtual={false}
                  onChange={(value) => updateSelectedStyle({ format: value === 'none' ? { type: 'none' } : { ...(selectedStyle.format ?? EMPTY_FORMAT), type: value } })}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'number', label: 'Number' },
                    { value: 'currency', label: 'Currency' },
                    { value: 'date', label: 'Date' },
                    { value: 'time', label: 'Time' },
                    { value: 'percent', label: 'Percent' },
                    { value: 'boolean', label: 'Boolean' },
                    { value: 'custom', label: 'Custom' },
                  ]}
                />
              </Field>
              <Field label="Pattern">
                <Input
                  aria-label="样式格式模式"
                  value={format.pattern ?? ''}
                  onChange={(event) => updateSelectedStyle({ format: { ...(selectedStyle.format ?? EMPTY_FORMAT), pattern: event.target.value } })}
                  placeholder="#,##0.00 / yyyy-MM-dd"
                />
              </Field>
              <Field label="Null">
                <Input
                  aria-label="样式格式空值文本"
                  value={format.nullValue ?? ''}
                  onChange={(event) => updateSelectedStyle({ format: { ...(selectedStyle.format ?? EMPTY_FORMAT), nullValue: event.target.value } })}
                  placeholder="No value"
                />
              </Field>
              <Field label="True Text">
                <Input
                  aria-label="样式格式真值文本"
                  value={format.trueText ?? ''}
                  onChange={(event) => updateSelectedStyle({ format: { ...(selectedStyle.format ?? EMPTY_FORMAT), trueText: event.target.value } })}
                  placeholder="True"
                />
              </Field>
              <Field label="False Text">
                <Input
                  aria-label="样式格式假值文本"
                  value={format.falseText ?? ''}
                  onChange={(event) => updateSelectedStyle({ format: { ...(selectedStyle.format ?? EMPTY_FORMAT), falseText: event.target.value } })}
                  placeholder="False"
                />
              </Field>
              <Field label="Border">
                <Select
                  aria-label="样式边框样式"
                  value={border.style}
                  virtual={false}
                  onChange={(value) => updateSelectedStyle({ border: { ...border, style: value } })}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'solid', label: 'Solid' },
                    { value: 'dashed', label: 'Dashed' },
                    { value: 'dotted', label: 'Dotted' },
                    { value: 'double', label: 'Double' },
                  ]}
                />
              </Field>
              <Field label="Border Width">
                <InputNumber
                  aria-label="样式边框宽度"
                  value={border.width}
                  min={0}
                  max={5}
                  step={0.1}
                  style={{ width: '100%' }}
                  onChange={(value) => updateSelectedStyle({ border: { ...border, width: Number(value ?? border.width) } })}
                />
              </Field>
              <Field label="Border Color">
                <ColorPicker
                  aria-label="样式边框颜色"
                  value={border.color}
                  onChange={(value) => updateSelectedStyle({ border: { ...border, color: value.toHexString() } })}
                />
              </Field>
              <Field label="Border Sides">
                <Checkbox.Group
                  value={Object.entries(border.sides).filter(([, enabled]) => enabled).map(([side]) => side)}
                  onChange={(checkedValues) => updateSelectedStyle({
                    border: {
                      ...border,
                      sides: {
                        top: checkedValues.includes('top'),
                        right: checkedValues.includes('right'),
                        bottom: checkedValues.includes('bottom'),
                        left: checkedValues.includes('left'),
                      },
                    },
                  })}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
                >
                  <Checkbox value="top">上</Checkbox>
                  <Checkbox value="right">右</Checkbox>
                  <Checkbox value="bottom">下</Checkbox>
                  <Checkbox value="left">左</Checkbox>
                </Checkbox.Group>
              </Field>
              <PaddingEditor
                padding={padding}
                onChange={(nextPadding) => updateSelectedStyle({ padding: nextPadding })}
              />
              <InlineSwitches
                values={[
                  { label: 'Can Grow', checked: selectedStyle.canGrow ?? false, onChange: (checked) => updateSelectedStyle({ canGrow: checked }) },
                  { label: 'Can Shrink', checked: selectedStyle.canShrink ?? false, onChange: (checked) => updateSelectedStyle({ canShrink: checked }) },
                ]}
              />
            </div>
          ) : (
            <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select a style to edit" />
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
};

const Field: React.FC<React.PropsWithChildren<{ label: string }>> = ({ label, children }) => (
  <label style={{ display: 'grid', gridTemplateColumns: '96px minmax(0, 1fr)', gap: 8, alignItems: 'center' }}>
    <span>{label}</span>
    {children}
  </label>
);

const InlineSwitches: React.FC<{
  values: Array<{
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }>;
}> = ({ values }) => (
  <div style={{ display: 'grid', gap: 8 }}>
    {values.map(item => (
      <label key={item.label} style={{ display: 'grid', gridTemplateColumns: '96px minmax(0, 1fr)', gap: 8, alignItems: 'center' }}>
        <span>{item.label}</span>
        <Switch aria-label={item.label} checked={item.checked} onChange={item.onChange} />
      </label>
    ))}
  </div>
);

const PaddingEditor: React.FC<{
  padding: { top: number; right: number; bottom: number; left: number };
  onChange: (padding: { top: number; right: number; bottom: number; left: number }) => void;
}> = ({ padding, onChange }) => {
  const updateField = (field: 'top' | 'right' | 'bottom' | 'left', value: number | null) => {
    onChange({ ...padding, [field]: Number(value ?? padding[field]) });
  };

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <Typography.Text>Padding</Typography.Text>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        <InputNumber aria-label="样式内边距上" value={padding.top} min={0} style={{ width: '100%' }} onChange={(value) => updateField('top', value)} />
        <InputNumber aria-label="样式内边距右" value={padding.right} min={0} style={{ width: '100%' }} onChange={(value) => updateField('right', value)} />
        <InputNumber aria-label="样式内边距下" value={padding.bottom} min={0} style={{ width: '100%' }} onChange={(value) => updateField('bottom', value)} />
        <InputNumber aria-label="样式内边距左" value={padding.left} min={0} style={{ width: '100%' }} onChange={(value) => updateField('left', value)} />
      </div>
    </div>
  );
};
