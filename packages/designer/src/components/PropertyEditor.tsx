import React, { useMemo, useState } from 'react';
import { Form, Input, InputNumber, Select, Switch, ColorPicker, Collapse, Space, Button, Divider, Checkbox } from 'antd';
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BoldOutlined,
  EditOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  UnderlineOutlined,
} from '@ant-design/icons';
import { useDesignerStore } from '../store/designer-store';
import type { BorderConfig, TableComponent, TextFormatConfig, TextFormatType } from '@report-designer/core';
import type { CSSProperties } from 'react';
import { formatUnitValue, getUnitStep, parseUnitValue } from '../page-settings';
import { ExpressionEditor } from './ExpressionEditor';
import { normalizeTable } from '../table/table-structure';
import { hasTextStyleBinding } from '../text-style-bindings';

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
  const openTextStyleLibrary = useDesignerStore(s => s.openTextStyleLibrary);
  const reportUnit = useDesignerStore(s => s.reportUnit);

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
  const unitStep = getUnitStep(reportUnit);
  const fineUnitStep = getUnitStep(reportUnit, 'fine');

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
    const dataSourceId = b.dataBand?.dataSourceId ?? b.dataSource;
    if (dataSourceId && !acc.includes(dataSourceId)) acc.push(dataSourceId);
    return acc;
  }, []) ?? [];
  for (const source of template.dataSources) {
    if (!dataSources.includes(source.name)) dataSources.push(source.name);
  }

  const handleChange = (field: string, value: any) => {
    if (!component || !bandId || !currentPageId) return;
    updateComponent(currentPageId, bandId, component.id, { [field]: value }, { [field]: (component as any)[field] });
  };

  const textFieldOptions = template.dataSources.flatMap(source => (source.schema ?? source.fields ?? []).map(field => ({
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

  const isTextComponent = component.type === 'text';
  const isTextStyleLocked = (pathOrPrefix: string) => (
    isTextComponent ? hasTextStyleBinding(component as { styleBindings?: string[] }, pathOrPrefix) : false
  );
  const backgroundLocked = isTextStyleLocked('backgroundColor');
  const dataBindingFormatValue = isTextComponent
    ? (typeof comp.format === 'object' ? comp.format?.pattern ?? '' : comp.format ?? '')
    : comp.format || '';
  const handleDataBindingFormatChange = (value: string) => {
    if (isTextComponent) {
      handleFormatField('pattern', value);
      return;
    }
    handleChange('format', value);
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
                <Form.Item label="X">
                  <InputNumber
                    value={formatUnitValue(comp.x, reportUnit)}
                    onChange={(v) => handleChange('x', parseUnitValue(v, reportUnit, comp.x))}
                    size="small"
                    style={{ width: '100%' }}
                    step={unitStep}
                  />
                </Form.Item>
                <Form.Item label="Y">
                  <InputNumber
                    value={formatUnitValue(comp.y, reportUnit)}
                    onChange={(v) => handleChange('y', parseUnitValue(v, reportUnit, comp.y))}
                    size="small"
                    style={{ width: '100%' }}
                    step={unitStep}
                  />
                </Form.Item>
                <Form.Item label="宽度">
                  <InputNumber
                    value={formatUnitValue(comp.width, reportUnit)}
                    onChange={(v) => handleChange('width', parseUnitValue(v, reportUnit, comp.width))}
                    size="small"
                    style={{ width: '100%' }}
                    step={unitStep}
                    min={formatUnitValue(1, reportUnit)}
                  />
                </Form.Item>
                <Form.Item label="高度">
                  <InputNumber
                    value={formatUnitValue(comp.height, reportUnit)}
                    onChange={(v) => handleChange('height', parseUnitValue(v, reportUnit, comp.height))}
                    size="small"
                    style={{ width: '100%' }}
                    step={unitStep}
                    min={formatUnitValue(1, reportUnit)}
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
                  <Space.Compact style={{ width: '100%' }}>
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
                    <Button onClick={openTextStyleLibrary}>Manage</Button>
                  </Space.Compact>
                </Form.Item>
                <Form.Item label="格式类型">
                  <Select
                    aria-label="格式类型"
                    value={format.type}
                    onChange={(value: TextFormatType) => handleFormatField('type', value)}
                    size="small"
                    disabled={isTextStyleLocked('format.type')}
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
                    disabled={isTextStyleLocked('format.pattern')}
                    placeholder="#,##0.00 / yyyy-MM-dd"
                  />
                </Form.Item>
                <Form.Item label="水平对齐">
                  <HorizontalAlignButtons
                    value={comp.textAlign || 'left'}
                    onChange={(value) => handleChange('textAlign', value)}
                    disabled={isTextStyleLocked('textAlign')}
                  />
                </Form.Item>
                <Form.Item label="垂直对齐">
                  <VerticalAlignButtons
                    value={comp.verticalAlign || 'top'}
                    onChange={(value) => handleChange('verticalAlign', value)}
                    disabled={isTextStyleLocked('verticalAlign')}
                  />
                </Form.Item>
                <Form.Item label="自动增大">
                  <Switch
                    aria-label="自动增大"
                    size="small"
                    checked={comp.canGrow || false}
                    onChange={(v) => handleChange('canGrow', v)}
                    disabled={isTextStyleLocked('canGrow')}
                  />
                </Form.Item>
                <Form.Item label="自动缩小">
                  <Switch
                    aria-label="自动缩小"
                    size="small"
                    checked={comp.canShrink || false}
                    onChange={(v) => handleChange('canShrink', v)}
                    disabled={isTextStyleLocked('canShrink')}
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
                    aria-label="字体系列"
                    value={font.family || ''}
                    onChange={(v) => handleFontField('family', v)}
                    size="small"
                    disabled={isTextStyleLocked('font.family')}
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
                    aria-label="字号"
                    value={font.size}
                    onChange={(v) => handleFontField('size', v)}
                    size="small"
                    disabled={isTextStyleLocked('font.size')}
                    style={{ width: '100%' }}
                    min={6}
                    max={72}
                  />
                </Form.Item>
                <Form.Item label="颜色">
                  <ColorPicker
                    aria-label="字体颜色"
                    size="small"
                    value={font.color || '#000000'}
                    onChange={(color) => handleFontField('color', color.toHexString())}
                    disabled={isTextStyleLocked('font.color')}
                  />
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button
                      aria-label="加粗"
                      title="加粗"
                      icon={<BoldOutlined />}
                      size="small"
                      type={font.bold ? 'primary' : 'default'}
                      style={{ minWidth: 32 }}
                      onClick={() => handleFontField('bold', !font.bold)}
                      disabled={isTextStyleLocked('font.bold')}
                    />
                    <Button
                      aria-label="斜体"
                      title="斜体"
                      icon={<ItalicOutlined />}
                      size="small"
                      type={font.italic ? 'primary' : 'default'}
                      style={{ minWidth: 32 }}
                      onClick={() => handleFontField('italic', !font.italic)}
                      disabled={isTextStyleLocked('font.italic')}
                    />
                    <Button
                      aria-label="下划线"
                      title="下划线"
                      icon={<UnderlineOutlined />}
                      size="small"
                      type={font.underline ? 'primary' : 'default'}
                      style={{ minWidth: 32 }}
                      onClick={() => handleFontField('underline', !font.underline)}
                      disabled={isTextStyleLocked('font.underline')}
                    />
                    <Button
                      aria-label="删除线"
                      title="删除线"
                      icon={<StrikethroughOutlined />}
                      size="small"
                      type={font.strikethrough ? 'primary' : 'default'}
                      style={{ minWidth: 32 }}
                      onClick={() => handleFontField('strikethrough', !font.strikethrough)}
                      disabled={isTextStyleLocked('font.strikethrough')}
                    />
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
                    aria-label="边框样式"
                    value={border.style}
                    onChange={(v) => handleBorderField('style', v)}
                    size="small"
                    disabled={isTextStyleLocked('border.style')}
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
                <Form.Item label="宽度">
                  <InputNumber
                    aria-label="边框宽度"
                    value={formatUnitValue(border.width, reportUnit)}
                    onChange={(v) => handleBorderField('width', parseUnitValue(v, reportUnit, border.width))}
                    size="small"
                    disabled={isTextStyleLocked('border.width')}
                    style={{ width: '100%' }}
                    min={formatUnitValue(0.1, reportUnit)}
                    max={formatUnitValue(5, reportUnit)}
                    step={fineUnitStep}
                  />
                </Form.Item>
                <Form.Item label="颜色">
                  <ColorPicker
                    aria-label="边框颜色"
                    size="small"
                    value={border.color}
                    onChange={(color) => handleBorderField('color', color.toHexString())}
                    disabled={isTextStyleLocked('border.color')}
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
                  <Checkbox value="top" disabled={isTextStyleLocked('border.sides.top')}>上</Checkbox>
                  <Checkbox value="right" disabled={isTextStyleLocked('border.sides.right')}>右</Checkbox>
                  <Checkbox value="bottom" disabled={isTextStyleLocked('border.sides.bottom')}>下</Checkbox>
                  <Checkbox value="left" disabled={isTextStyleLocked('border.sides.left')}>左</Checkbox>
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
                    aria-label="背景色"
                    size="small"
                    value={comp.backgroundColor || '#ffffff'}
                    onChange={(color) => handleChange('backgroundColor', color.toHexString())}
                    allowClear
                    disabled={backgroundLocked}
                  />
                </Form.Item>
                <Divider style={{ margin: '4px 0' }} />
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>内边距</div>
                <Form.Item label="上">
                  <InputNumber
                    aria-label="内边距上"
                    value={formatUnitValue(padding.top, reportUnit)}
                    onChange={(v) => handlePaddingField('top', parseUnitValue(v, reportUnit, padding.top))}
                    size="small"
                    disabled={isTextStyleLocked('padding.top')}
                    style={{ width: '100%' }}
                    min={0}
                    step={unitStep}
                  />
                </Form.Item>
                <Form.Item label="右">
                  <InputNumber
                    aria-label="内边距右"
                    value={formatUnitValue(padding.right, reportUnit)}
                    onChange={(v) => handlePaddingField('right', parseUnitValue(v, reportUnit, padding.right))}
                    size="small"
                    disabled={isTextStyleLocked('padding.right')}
                    style={{ width: '100%' }}
                    min={0}
                    step={unitStep}
                  />
                </Form.Item>
                <Form.Item label="下">
                  <InputNumber
                    aria-label="内边距下"
                    value={formatUnitValue(padding.bottom, reportUnit)}
                    onChange={(v) => handlePaddingField('bottom', parseUnitValue(v, reportUnit, padding.bottom))}
                    size="small"
                    disabled={isTextStyleLocked('padding.bottom')}
                    style={{ width: '100%' }}
                    min={0}
                    step={unitStep}
                  />
                </Form.Item>
                <Form.Item label="左">
                  <InputNumber
                    aria-label="内边距左"
                    value={formatUnitValue(padding.left, reportUnit)}
                    onChange={(v) => handlePaddingField('left', parseUnitValue(v, reportUnit, padding.left))}
                    size="small"
                    disabled={isTextStyleLocked('padding.left')}
                    style={{ width: '100%' }}
                    min={0}
                    step={unitStep}
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
                <Form.Item label="宽度">
                  <InputNumber
                    value={formatUnitValue(comp.lineWidth ?? 0.2, reportUnit)}
                    onChange={(v) => handleChange('lineWidth', parseUnitValue(v, reportUnit, comp.lineWidth ?? 0.2))}
                    size="small"
                    style={{ width: '100%' }}
                    min={formatUnitValue(0.1, reportUnit)}
                    max={formatUnitValue(5, reportUnit)}
                    step={fineUnitStep}
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
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>端点坐标</div>
                <Form.Item label="起点 X">
                  <InputNumber value={formatUnitValue(comp.startX ?? 0, reportUnit)} onChange={(v) => handleChange('startX', parseUnitValue(v, reportUnit, comp.startX ?? 0))} size="small" style={{ width: '100%' }} step={unitStep} />
                </Form.Item>
                <Form.Item label="起点 Y">
                  <InputNumber value={formatUnitValue(comp.startY ?? 0, reportUnit)} onChange={(v) => handleChange('startY', parseUnitValue(v, reportUnit, comp.startY ?? 0))} size="small" style={{ width: '100%' }} step={unitStep} />
                </Form.Item>
                <Form.Item label="终点 X">
                  <InputNumber value={formatUnitValue(comp.endX ?? comp.width, reportUnit)} onChange={(v) => handleChange('endX', parseUnitValue(v, reportUnit, comp.endX ?? comp.width))} size="small" style={{ width: '100%' }} step={unitStep} />
                </Form.Item>
                <Form.Item label="终点 Y">
                  <InputNumber value={formatUnitValue(comp.endY ?? comp.height, reportUnit)} onChange={(v) => handleChange('endY', parseUnitValue(v, reportUnit, comp.endY ?? comp.height))} size="small" style={{ width: '100%' }} step={unitStep} />
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
                <Form.Item label="边框宽">
                  <InputNumber
                    value={formatUnitValue(comp.borderWidth ?? 0.2, reportUnit)}
                    onChange={(v) => handleChange('borderWidth', parseUnitValue(v, reportUnit, comp.borderWidth ?? 0.2))}
                    size="small"
                    style={{ width: '100%' }}
                    min={0}
                    max={formatUnitValue(5, reportUnit)}
                    step={fineUnitStep}
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
                  <HorizontalAlignButtons
                    value={comp.textAlign || 'center'}
                    onChange={(value) => handleChange('textAlign', value)}
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
                  <HorizontalAlignButtons
                    value={comp.textAlign || 'left'}
                    onChange={(value) => handleChange('textAlign', value)}
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
                    aria-label="格式化"
                    value={dataBindingFormatValue}
                    onChange={(e) => handleDataBindingFormatChange(e.target.value)}
                    size="small"
                    disabled={isTextStyleLocked('format')}
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

type HorizontalAlignment = 'left' | 'center' | 'right';
type VerticalAlignment = 'top' | 'middle' | 'bottom';

const HorizontalAlignButtons: React.FC<{
  value: HorizontalAlignment;
  onChange: (value: HorizontalAlignment) => void;
  disabled?: boolean;
}> = ({ disabled = false, onChange, value }) => (
  <IconButtonGroup
    items={[
      { value: 'left', label: '左对齐', icon: <AlignLeftOutlined /> },
      { value: 'center', label: '水平居中', icon: <AlignCenterOutlined /> },
      { value: 'right', label: '右对齐', icon: <AlignRightOutlined /> },
    ]}
    value={value}
    onChange={onChange}
    disabled={disabled}
  />
);

const VerticalAlignButtons: React.FC<{
  value: VerticalAlignment;
  onChange: (value: VerticalAlignment) => void;
  disabled?: boolean;
}> = ({ disabled = false, onChange, value }) => (
  <IconButtonGroup
    items={[
      { value: 'top', label: '顶部对齐', icon: <VerticalAlignGlyph position="top" /> },
      { value: 'middle', label: '垂直居中', icon: <VerticalAlignGlyph position="middle" /> },
      { value: 'bottom', label: '底部对齐', icon: <VerticalAlignGlyph position="bottom" /> },
    ]}
    value={value}
    onChange={onChange}
    disabled={disabled}
  />
);

const IconButtonGroup = <T extends string,>({
  disabled,
  items,
  onChange,
  value,
}: {
  disabled: boolean;
  items: Array<{ value: T; label: string; icon: React.ReactNode }>;
  onChange: (value: T) => void;
  value: T;
}) => (
  <Space size={4} wrap>
    {items.map(item => (
      <Button
        key={item.value}
        aria-label={item.label}
        title={item.label}
        size="small"
        type={value === item.value ? 'primary' : 'default'}
        icon={item.icon}
        disabled={disabled}
        onClick={() => onChange(item.value)}
        style={{ width: 28, paddingInline: 0 }}
      />
    ))}
  </Space>
);

const VerticalAlignGlyph: React.FC<{ position: VerticalAlignment }> = ({ position }) => {
  const blockTop = position === 'top' ? 2 : position === 'middle' ? 8 : 14;
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'relative',
        display: 'inline-block',
        width: 14,
        height: 18,
      }}
    >
      <span style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1.5, background: 'currentColor', opacity: 0.45, borderRadius: 999 }} />
      <span style={{ position: 'absolute', left: 0, right: 0, top: 8, height: 1.5, background: 'currentColor', opacity: 0.45, borderRadius: 999 }} />
      <span style={{ position: 'absolute', left: 0, right: 0, top: 16, height: 1.5, background: 'currentColor', opacity: 0.45, borderRadius: 999 }} />
      <span style={{ position: 'absolute', left: 2, right: 2, top: blockTop, height: 3.5, background: 'currentColor', borderRadius: 999 }} />
    </span>
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
