import React, { useMemo, useState } from 'react';
import { Form, Input, InputNumber, Select, Switch, ColorPicker, Collapse, Space, Button, Divider, Checkbox } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useDesignerStore } from '../store/designer-store';
import type { BorderConfig, TableComponent, TextFormatConfig, TextFormatType } from '@report-designer/core';
import type { CSSProperties } from 'react';
import { ExpressionEditor } from './ExpressionEditor';
import { normalizeTable } from '../table/table-structure';

const DEFAULT_BORDER: BorderConfig = {
  style: 'none',
  width: 0.1,
  color: '#000000',
  sides: { top: false, right: false, bottom: false, left: false },
};

export const PropertyEditor: React.FC = () => {
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const selectedComponentIds = useDesignerStore(s => s.selectedComponentIds);
  const updateComponent = useDesignerStore(s => s.updateComponent);
  const updateSelectedTable = useDesignerStore(s => s.updateSelectedTable);
  const applySelectedStyle = useDesignerStore(s => s.applySelectedStyle);

  const { component, bandId } = useMemo(() => {
    if (selectedComponentIds.length !== 1) return { component: null, bandId: null };
    const page = template.pages.find(p => p.id === currentPageId);
    if (!page) return { component: null, bandId: null };
    for (const band of page.bands) {
      const comp = band.components.find(c => c.id === selectedComponentIds[0]);
      if (comp) return { component: comp, bandId: band.id };
    }
    return { component: null, bandId: null };
  }, [template, currentPageId, selectedComponentIds]);

  const [exprModalOpen, setExprModalOpen] = useState(false);

  if (selectedComponentIds.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#999', fontSize: 13 }}>
        选择组件以编辑属性
      </div>
    );
  }

  if (selectedComponentIds.length > 1) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#999', fontSize: 13 }}>
        已选择 {selectedComponentIds.length} 个组件
      </div>
    );
  }

  if (!component || !bandId) return null;

  const comp = component as any;
  const currentPage = template.pages.find(p => p.id === currentPageId);
  const dataSources = currentPage?.bands.reduce<string[]>((acc, b) => {
    if (b.dataSource && !acc.includes(b.dataSource)) acc.push(b.dataSource);
    return acc;
  }, []) ?? [];
  for (const source of template.dataSources) {
    if (!dataSources.includes(source.name)) dataSources.push(source.name);
  }

  const handleChange = (field: string, value: any) => {
    if (!component || !bandId || !currentPageId) return;
    updateComponent(currentPageId, bandId, component.id, { [field]: value }, { [field]: (component as any)[field] });
  };

  const textFieldOptions = template.dataSources.flatMap(source => source.schema.map(field => ({
    value: `${source.id}.${field.name}`,
    label: field.label || field.name,
    sourceId: source.id,
  })));

  const handleBindTextField = (value?: string) => {
    if (!value) {
      handleChange('text', '');
      handleChange('dataSource', undefined);
      return;
    }
    const option = textFieldOptions.find(item => item.value === value);
    handleChange('text', `{${value}}`);
    handleChange('dataSource', option?.sourceId ?? value.split('.')[0]);
  };

  // ---- Border helpers ----
  const border = (comp.border as BorderConfig) ?? DEFAULT_BORDER;
  const handleBorderField = (path: string, value: any) => {
    const parts = path.split('.');
    const newBorder = { ...border };
    let target: any = newBorder;
    for (let i = 0; i < parts.length - 1; i++) {
      target[parts[i]] = { ...target[parts[i]] };
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = value;
    handleChange('border', newBorder);
  };

  const borderSideStyle = (): CSSProperties => ({
    borderTop: border.sides.top ? `${border.width}mm ${border.style} ${border.color}` : '1px solid #eee',
    borderRight: border.sides.right ? `${border.width}mm ${border.style} ${border.color}` : '1px solid #eee',
    borderBottom: border.sides.bottom ? `${border.width}mm ${border.style} ${border.color}` : '1px solid #eee',
    borderLeft: border.sides.left ? `${border.width}mm ${border.style} ${border.color}` : '1px solid #eee',
  });

  // ---- Font helpers ----
  const font = comp.font ?? { family: '', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' };
  const handleFontField = (field: string, value: any) => {
    handleChange('font', { ...font, [field]: value });
  };

  const format = (comp.format ?? { type: 'none' }) as TextFormatConfig;
  const handleFormatField = (field: keyof TextFormatConfig, value: any) => {
    const next = { ...format, [field]: value } as TextFormatConfig;
    if (field === 'type' && value === 'none') {
      handleChange('format', { type: 'none' });
      return;
    }
    handleChange('format', next);
  };

  // ---- Padding helpers ----
  const padding = comp.padding ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const handlePaddingField = (field: string, value: number) => {
    handleChange('padding', { ...padding, [field]: value });
  };

  return (
    <div style={{ padding: 8 }}>
      <Collapse
        defaultActiveKey={['general', 'position', 'text', 'font', 'border', 'appearance', 'table', 'data']}
        size="small"
        items={[
          // ---- 基本信息 ----
          {
            key: 'general',
            label: '基本信息',
            children: (
              <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label="名称">
                  <Input
                    value={comp.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    size="small"
                    placeholder="组件名称"
                  />
                </Form.Item>
                <Form.Item label="类型">
                  <Input value={comp.type} size="small" disabled />
                </Form.Item>
              </Form>
            ),
          },

          // ---- 位置尺寸 ----
          {
            key: 'position',
            label: '位置与尺寸',
            children: (
              <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label="X (mm)">
                  <InputNumber
                    value={comp.x}
                    onChange={(v) => handleChange('x', v)}
                    size="small"
                    style={{ width: '100%' }}
                    step={0.5}
                  />
                </Form.Item>
                <Form.Item label="Y (mm)">
                  <InputNumber
                    value={comp.y}
                    onChange={(v) => handleChange('y', v)}
                    size="small"
                    style={{ width: '100%' }}
                    step={0.5}
                  />
                </Form.Item>
                <Form.Item label="宽度 (mm)">
                  <InputNumber
                    value={comp.width}
                    onChange={(v) => handleChange('width', v)}
                    size="small"
                    style={{ width: '100%' }}
                    step={0.5}
                    min={1}
                  />
                </Form.Item>
                <Form.Item label="高度 (mm)">
                  <InputNumber
                    value={comp.height}
                    onChange={(v) => handleChange('height', v)}
                    size="small"
                    style={{ width: '100%' }}
                    step={0.5}
                    min={1}
                  />
                </Form.Item>
              </Form>
            ),
          },

          // ---- 文本内容 ----
          {
            key: 'text',
            label: '文本内容',
            children: component.type === 'text' ? (
              <Form size="small" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
                <Form.Item label="表达式">
                  <Space.Compact style={{ width: '100%' }}>
                    <Input.TextArea
                      value={comp.text || ''}
                      onChange={(e) => handleChange('text', e.target.value)}
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      placeholder="{DataSource.Field}"
                    />
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => setExprModalOpen(true)}
                      style={{ width: 32 }}
                    />
                  </Space.Compact>
                </Form.Item>
                <Form.Item label="绑定字段">
                  <Select
                    aria-label="绑定字段"
                    value={textFieldOptions.find(option => comp.text === `{${option.value}}`)?.value}
                    onChange={handleBindTextField}
                    size="small"
                    style={{ width: '100%' }}
                    allowClear
                    showSearch
                    virtual={false}
                    placeholder="选择 JSON 字段"
                    options={textFieldOptions}
                  />
                </Form.Item>
                <Form.Item label="文本样式">
                  <Select
                    aria-label="文本样式"
                    value={comp.style}
                    onChange={(value) => applySelectedStyle(value)}
                    size="small"
                    style={{ width: '100%' }}
                    allowClear
                    virtual={false}
                    placeholder="选择样式集"
                    options={template.styles.map(style => ({ value: style.id, label: style.name }))}
                  />
                </Form.Item>
                <Form.Item label="格式类型">
                  <Select
                    aria-label="格式类型"
                    value={format.type}
                    onChange={(value: TextFormatType) => handleFormatField('type', value)}
                    size="small"
                    style={{ width: '100%' }}
                    virtual={false}
                    options={[
                      { value: 'none', label: '无' },
                      { value: 'number', label: '数字' },
                      { value: 'currency', label: '货币' },
                      { value: 'date', label: '日期' },
                      { value: 'time', label: '时间' },
                      { value: 'percent', label: '百分比' },
                      { value: 'boolean', label: '布尔' },
                      { value: 'custom', label: '自定义' },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="格式模式">
                  <Input
                    aria-label="格式模式"
                    value={format.pattern || ''}
                    onChange={(e) => handleFormatField('pattern', e.target.value)}
                    size="small"
                    placeholder="#,##0.00 / yyyy-MM-dd"
                  />
                </Form.Item>
                <Form.Item label="水平对齐">
                  <Select
                    value={comp.textAlign || 'left'}
                    onChange={(v) => handleChange('textAlign', v)}
                    size="small"
                    style={{ width: '100%' }}
                    options={[
                      { value: 'left', label: '左对齐' },
                      { value: 'center', label: '居中' },
                      { value: 'right', label: '右对齐' },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="垂直对齐">
                  <Select
                    value={comp.verticalAlign || 'top'}
                    onChange={(v) => handleChange('verticalAlign', v)}
                    size="small"
                    style={{ width: '100%' }}
                    options={[
                      { value: 'top', label: '顶部' },
                      { value: 'middle', label: '居中' },
                      { value: 'bottom', label: '底部' },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="自动增大">
                  <Switch
                    size="small"
                    checked={comp.canGrow || false}
                    onChange={(v) => handleChange('canGrow', v)}
                  />
                </Form.Item>
                <Form.Item label="自动缩小">
                  <Switch
                    size="small"
                    checked={comp.canShrink || false}
                    onChange={(v) => handleChange('canShrink', v)}
                  />
                </Form.Item>
              </Form>
            ) : (
              <div style={{ padding: 8, color: '#999', fontSize: 12 }}>文本组件专属</div>
            ),
          },

          // ---- 字体 ----
          {
            key: 'font',
            label: '字体',
            children: (
              <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label="字体系列">
                  <Select
                    value={font.family || ''}
                    onChange={(v) => handleFontField('family', v)}
                    size="small"
                    style={{ width: '100%' }}
                    showSearch
                    allowClear
                    options={[
                      'Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Tahoma', 'Georgia',
                      'Microsoft YaHei', 'SimSun', 'SimHei', 'KaiTi',
                    ].map(f => ({ value: f, label: <span style={{ fontFamily: f }}>{f}</span> }))}
                  />
                </Form.Item>
                <Form.Item label="字号">
                  <InputNumber
                    value={font.size}
                    onChange={(v) => handleFontField('size', v)}
                    size="small"
                    style={{ width: '100%' }}
                    min={6}
                    max={72}
                  />
                </Form.Item>
                <Form.Item label="颜色">
                  <ColorPicker
                    size="small"
                    value={font.color || '#000000'}
                    onChange={(color) => handleFontField('color', color.toHexString())}
                  />
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button
                      size="small"
                      type={font.bold ? 'primary' : 'default'}
                      style={{ fontWeight: 'bold', minWidth: 32 }}
                      onClick={() => handleFontField('bold', !font.bold)}
                    >B</Button>
                    <Button
                      size="small"
                      type={font.italic ? 'primary' : 'default'}
                      style={{ fontStyle: 'italic', minWidth: 32 }}
                      onClick={() => handleFontField('italic', !font.italic)}
                    >I</Button>
                    <Button
                      size="small"
                      type={font.underline ? 'primary' : 'default'}
                      style={{ textDecoration: 'underline', minWidth: 32 }}
                      onClick={() => handleFontField('underline', !font.underline)}
                    >U</Button>
                    <Button
                      size="small"
                      type={font.strikethrough ? 'primary' : 'default'}
                      style={{ textDecoration: 'line-through', minWidth: 32 }}
                      onClick={() => handleFontField('strikethrough', !font.strikethrough)}
                    >S</Button>
                  </Space>
                </Form.Item>
              </Form>
            ),
          },

          // ---- 边框 ----
          {
            key: 'border',
            label: '边框',
            children: (
              <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label="样式">
                  <Select
                    value={border.style}
                    onChange={(v) => handleBorderField('style', v)}
                    size="small"
                    style={{ width: '100%' }}
                    options={[
                      { value: 'none', label: '无边框' },
                      { value: 'solid', label: '实线' },
                      { value: 'dashed', label: '虚线' },
                      { value: 'dotted', label: '点线' },
                      { value: 'double', label: '双线' },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="宽度 (mm)">
                  <InputNumber
                    value={border.width}
                    onChange={(v) => handleBorderField('width', v)}
                    size="small"
                    style={{ width: '100%' }}
                    min={0.1}
                    max={5}
                    step={0.1}
                  />
                </Form.Item>
                <Form.Item label="颜色">
                  <ColorPicker
                    size="small"
                    value={border.color}
                    onChange={(color) => handleBorderField('color', color.toHexString())}
                  />
                </Form.Item>
                <Divider style={{ margin: '4px 0' }} />
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>应用边</div>
                <Checkbox.Group
                  value={Object.entries(border.sides).filter(([_, v]) => v).map(([k]) => k)}
                  onChange={(checkedValues) => {
                    handleBorderField('sides', {
                      top: checkedValues.includes('top'),
                      right: checkedValues.includes('right'),
                      bottom: checkedValues.includes('bottom'),
                      left: checkedValues.includes('left'),
                    });
                  }}
                  style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
                >
                  <Checkbox value="top">上</Checkbox>
                  <Checkbox value="right">右</Checkbox>
                  <Checkbox value="bottom">下</Checkbox>
                  <Checkbox value="left">左</Checkbox>
                </Checkbox.Group>
                <div style={{ ...borderSideStyle(), width: 60, height: 40, margin: '8px auto 0' }} />
              </Form>
            ),
          },

          // ---- 外观 ----
          {
            key: 'appearance',
            label: '外观',
            children: (
              <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label="背景色">
                  <ColorPicker
                    size="small"
                    value={comp.backgroundColor || '#ffffff'}
                    onChange={(color) => handleChange('backgroundColor', color.toHexString())}
                    allowClear
                  />
                </Form.Item>
                <Divider style={{ margin: '4px 0' }} />
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>内边距 (mm)</div>
                <Form.Item label="上">
                  <InputNumber
                    value={padding.top}
                    onChange={(v) => handlePaddingField('top', v ?? 0)}
                    size="small"
                    style={{ width: '100%' }}
                    min={0}
                    step={0.5}
                  />
                </Form.Item>
                <Form.Item label="右">
                  <InputNumber
                    value={padding.right}
                    onChange={(v) => handlePaddingField('right', v ?? 0)}
                    size="small"
                    style={{ width: '100%' }}
                    min={0}
                    step={0.5}
                  />
                </Form.Item>
                <Form.Item label="下">
                  <InputNumber
                    value={padding.bottom}
                    onChange={(v) => handlePaddingField('bottom', v ?? 0)}
                    size="small"
                    style={{ width: '100%' }}
                    min={0}
                    step={0.5}
                  />
                </Form.Item>
                <Form.Item label="左">
                  <InputNumber
                    value={padding.left}
                    onChange={(v) => handlePaddingField('left', v ?? 0)}
                    size="small"
                    style={{ width: '100%' }}
                    min={0}
                    step={0.5}
                  />
                </Form.Item>
              </Form>
            ),
          },

          // ---- 表格 ----
          component.type === 'table' ? {
            key: 'table',
            label: '表格',
            children: (
              <TablePropertyPanel
                table={normalizeTable(component as TableComponent)}
                dataSources={dataSources}
                onChange={updateSelectedTable}
              />
            ),
          } : null,

          // ---- 线条 ----
          component.type === 'line' ? {
            key: 'line',
            label: '线条属性',
            children: (
              <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label="颜色">
                  <ColorPicker
                    size="small"
                    value={comp.lineColor || '#000000'}
                    onChange={(color) => handleChange('lineColor', color.toHexString())}
                  />
                </Form.Item>
                <Form.Item label="宽度 (mm)">
                  <InputNumber
                    value={comp.lineWidth ?? 0.2}
                    onChange={(v) => handleChange('lineWidth', v ?? 0.2)}
                    size="small"
                    style={{ width: '100%' }}
                    min={0.1}
                    max={5}
                    step={0.1}
                  />
                </Form.Item>
                <Form.Item label="样式">
                  <Select
                    value={comp.lineStyle || 'solid'}
                    onChange={(v) => handleChange('lineStyle', v)}
                    size="small"
                    style={{ width: '100%' }}
                    options={[
                      { value: 'solid', label: '实线' },
                      { value: 'dashed', label: '虚线' },
                      { value: 'dotted', label: '点线' },
                    ]}
                  />
                </Form.Item>
                <Divider style={{ margin: '4px 0' }} />
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>端点坐标 (mm)</div>
                <Form.Item label="起点 X">
                  <InputNumber value={comp.startX ?? 0} onChange={(v) => handleChange('startX', v ?? 0)} size="small" style={{ width: '100%' }} step={0.5} />
                </Form.Item>
                <Form.Item label="起点 Y">
                  <InputNumber value={comp.startY ?? 0} onChange={(v) => handleChange('startY', v ?? 0)} size="small" style={{ width: '100%' }} step={0.5} />
                </Form.Item>
                <Form.Item label="终点 X">
                  <InputNumber value={comp.endX ?? comp.width} onChange={(v) => handleChange('endX', v ?? comp.width)} size="small" style={{ width: '100%' }} step={0.5} />
                </Form.Item>
                <Form.Item label="终点 Y">
                  <InputNumber value={comp.endY ?? comp.height} onChange={(v) => handleChange('endY', v ?? comp.height)} size="small" style={{ width: '100%' }} step={0.5} />
                </Form.Item>
              </Form>
            ),
          } : null,

          // ---- 形状 ----
          component.type === 'shape' ? {
            key: 'shape',
            label: '形状属性',
            children: (
              <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label="形状类型">
                  <Select
                    value={comp.shapeType || 'rectangle'}
                    onChange={(v) => handleChange('shapeType', v)}
                    size="small"
                    style={{ width: '100%' }}
                    options={[
                      { value: 'rectangle', label: '矩形' },
                      { value: 'ellipse', label: '椭圆' },
                      { value: 'roundRect', label: '圆角矩形' },
                      { value: 'triangle', label: '三角形' },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="填充色">
                  <ColorPicker
                    size="small"
                    value={comp.fillColor || '#ffffff'}
                    onChange={(color) => handleChange('fillColor', color.toHexString())}
                    allowClear
                  />
                </Form.Item>
                <Form.Item label="边框色">
                  <ColorPicker
                    size="small"
                    value={comp.borderColor || '#000000'}
                    onChange={(color) => handleChange('borderColor', color.toHexString())}
                  />
                </Form.Item>
                <Form.Item label="边框宽 (mm)">
                  <InputNumber
                    value={comp.borderWidth ?? 0.2}
                    onChange={(v) => handleChange('borderWidth', v ?? 0.2)}
                    size="small"
                    style={{ width: '100%' }}
                    min={0}
                    max={5}
                    step={0.1}
                  />
                </Form.Item>
                <Form.Item label="边框样式">
                  <Select
                    value={comp.borderStyle || 'solid'}
                    onChange={(v) => handleChange('borderStyle', v)}
                    size="small"
                    style={{ width: '100%' }}
                    options={[
                      { value: 'solid', label: '实线' },
                      { value: 'dashed', label: '虚线' },
                      { value: 'dotted', label: '点线' },
                    ]}
                  />
                </Form.Item>
              </Form>
            ),
          } : null,

          // ---- 页码 ----
          component.type === 'pagenumber' ? {
            key: 'pagenumber',
            label: '页码属性',
            children: (
              <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label="格式">
                  <Select
                    value={comp.format || '1/N'}
                    onChange={(v) => handleChange('format', v)}
                    size="small"
                    style={{ width: '100%' }}
                    options={[
                      { value: '1', label: '1, 2, 3...' },
                      { value: '1/N', label: '1/N, 2/N...' },
                      { value: 'Page 1 of N', label: 'Page 1 of N' },
                      { value: 'Page 1', label: 'Page 1' },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="水平对齐">
                  <Select
                    value={comp.textAlign || 'center'}
                    onChange={(v) => handleChange('textAlign', v)}
                    size="small"
                    style={{ width: '100%' }}
                    options={[
                      { value: 'left', label: '左对齐' },
                      { value: 'center', label: '居中' },
                      { value: 'right', label: '右对齐' },
                    ]}
                  />
                </Form.Item>
              </Form>
            ),
          } : null,

          // ---- 日期时间 ----
          component.type === 'datetime' ? {
            key: 'datetime',
            label: '日期时间属性',
            children: (
              <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label="格式">
                  <Input
                    value={comp.format || 'yyyy-MM-dd'}
                    onChange={(e) => handleChange('format', e.target.value)}
                    size="small"
                    placeholder="yyyy-MM-dd HH:mm:ss"
                  />
                </Form.Item>
                <Form.Item label="水平对齐">
                  <Select
                    value={comp.textAlign || 'left'}
                    onChange={(v) => handleChange('textAlign', v)}
                    size="small"
                    style={{ width: '100%' }}
                    options={[
                      { value: 'left', label: '左对齐' },
                      { value: 'center', label: '居中' },
                      { value: 'right', label: '右对齐' },
                    ]}
                  />
                </Form.Item>
              </Form>
            ),
          } : null,

          // ---- 数据绑定 ----
          {
            key: 'data',
            label: '数据绑定',
            children: (
              <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label="数据源">
                  <Select
                    value={comp.dataSource || undefined}
                    onChange={(v) => handleChange('dataSource', v)}
                    size="small"
                    style={{ width: '100%' }}
                    allowClear
                    placeholder="选择数据源"
                    options={dataSources.map(ds => ({ value: ds, label: ds }))}
                  />
                </Form.Item>
                <Form.Item label="格式化">
                  <Input
                    value={comp.format || ''}
                    onChange={(e) => handleChange('format', e.target.value)}
                    size="small"
                    placeholder="如 #,##0.00 或 yyyy-MM-dd"
                  />
                </Form.Item>
              </Form>
            ),
          },
        ].filter(Boolean) as any}
      />
      <ExpressionEditor
        open={exprModalOpen}
        value={comp.text || ''}
        onChange={(v) => handleChange('text', v)}
        onClose={() => setExprModalOpen(false)}
      />
    </div>
  );
};

const TablePropertyPanel: React.FC<{
  table: TableComponent;
  dataSources: string[];
  onChange: (updates: {
    rowCount?: number;
    columnCount?: number;
    headerRowsCount?: number;
    footerRowsCount?: number;
    canBreak?: boolean;
    showBorder?: boolean;
    dataSource?: string;
  }) => void;
}> = ({ table, dataSources, onChange }) => (
  <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
    <Form.Item label="数据源">
      <Select
        aria-label="表格数据源"
        value={table.dataSource || undefined}
        onChange={(value) => onChange({ dataSource: value })}
        size="small"
        style={{ width: '100%' }}
        allowClear
        placeholder="选择数据源"
        options={dataSources.map(source => ({ value: source, label: source }))}
      />
    </Form.Item>
    <Form.Item label="列数">
      <InputNumber
        aria-label="列数"
        value={table.columnCount ?? table.columns.length}
        onChange={(value) => onChange({ columnCount: value ?? 1 })}
        size="small"
        style={{ width: '100%' }}
        min={1}
        step={1}
      />
    </Form.Item>
    <Form.Item label="行数">
      <InputNumber
        aria-label="行数"
        value={table.rowCount ?? 3}
        onChange={(value) => onChange({ rowCount: value ?? 1 })}
        size="small"
        style={{ width: '100%' }}
        min={1}
        step={1}
      />
    </Form.Item>
    <Form.Item label="表头行数">
      <InputNumber
        aria-label="表头行数"
        value={table.headerRowsCount ?? 1}
        onChange={(value) => onChange({ headerRowsCount: value ?? 0 })}
        size="small"
        style={{ width: '100%' }}
        min={0}
        max={table.rowCount ?? 3}
        step={1}
      />
    </Form.Item>
    <Form.Item label="表尾行数">
      <InputNumber
        aria-label="表尾行数"
        value={table.footerRowsCount ?? 0}
        onChange={(value) => onChange({ footerRowsCount: value ?? 0 })}
        size="small"
        style={{ width: '100%' }}
        min={0}
        max={table.rowCount ?? 3}
        step={1}
      />
    </Form.Item>
    <Form.Item label="允许跨页">
      <Switch
        aria-label="允许跨页"
        size="small"
        checked={table.canBreak ?? true}
        onChange={(checked) => onChange({ canBreak: checked })}
      />
    </Form.Item>
    <Form.Item label="显示边框">
      <Switch
        aria-label="显示边框"
        size="small"
        checked={table.showBorder}
        onChange={(checked) => onChange({ showBorder: checked })}
      />
    </Form.Item>
  </Form>
);
