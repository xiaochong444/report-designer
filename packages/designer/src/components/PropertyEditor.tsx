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
  UploadOutlined,
} from '@ant-design/icons';
import { useDesignerStore } from '../store/designer-store';
import type { BorderConfig, TableComponent, TextFormatConfig } from '@report-designer/core';
import type { CSSProperties } from 'react';
import { formatUnitValue, getUnitStep, parseUnitValue } from '../page-settings';
import { ExpressionEditor } from './ExpressionEditor';
import { normalizeTable } from '../table/table-structure';
import { hasTextStyleBinding } from '../text-style-bindings';
import { TextFormatEditor } from './TextFormatEditor';
import { useDesignerI18n, type DesignerLocale } from '../i18n';

const DEFAULT_BORDER: BorderConfig = {
  style: 'none',
  width: 0.1,
  color: '#000000',
  sides: { top: false, right: false, bottom: false, left: false },
};
const NO_CONDITIONAL_FORMAT = '__none__';

export const PropertyEditor: React.FC = () => {
  const { locale } = useDesignerI18n();
  const t = createPropertyT(locale);
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const selectedComponentIds = useDesignerStore(s => s.selectedComponentIds);
  const updateComponent = useDesignerStore(s => s.updateComponent);
  const updateSelectedTable = useDesignerStore(s => s.updateSelectedTable);
  const applySelectedStyle = useDesignerStore(s => s.applySelectedStyle);
  const applySelectedConditionalFormat = useDesignerStore(s => s.applySelectedConditionalFormat);
  const openTextStyleLibrary = useDesignerStore(s => s.openTextStyleLibrary);
  const openConditionalFormatLibrary = useDesignerStore(s => s.openConditionalFormatLibrary);
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
        {t('selectComponent')}
      </div>
    );
  }

  if (selectedComponentIds.length > 1) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#999', fontSize: 13 }}>
        {t('selectedComponents', { count: selectedComponentIds.length })}
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

  return (
    <div style={{ padding: 8 }}>
      <Collapse
        defaultActiveKey={['general', 'position', 'text', 'font', 'border', 'appearance', 'table', 'line', 'shape', 'pagenumber', 'datetime']}
        size="small"
        items={[
          // ---- 基本信息 ----
          {
            key: 'general',
            label: t('general'),
            children: (
              <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label={t('name')}>
                  <Input
                    aria-label={t('name')}
                    value={comp.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    size="small"
                    placeholder={t('componentName')}
                  />
                </Form.Item>
                <Form.Item label={t('type')}>
                  <Input aria-label={t('type')} value={comp.type} size="small" disabled />
                </Form.Item>
              </Form>
            ),
          },

          // ---- 位置尺寸 ----
          {
            key: 'position',
            label: t('position'),
            children: (
              <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label="X">
                  <InputNumber
                    aria-label="X"
                    value={formatUnitValue(comp.x, reportUnit)}
                    onChange={(v) => handleChange('x', parseUnitValue(v, reportUnit, comp.x))}
                    size="small"
                    style={{ width: '100%' }}
                    step={unitStep}
                  />
                </Form.Item>
                <Form.Item label="Y">
                  <InputNumber
                    aria-label="Y"
                    value={formatUnitValue(comp.y, reportUnit)}
                    onChange={(v) => handleChange('y', parseUnitValue(v, reportUnit, comp.y))}
                    size="small"
                    style={{ width: '100%' }}
                    step={unitStep}
                  />
                </Form.Item>
                <Form.Item label={t('width')}>
                  <InputNumber
                    aria-label={t('width')}
                    value={formatUnitValue(comp.width, reportUnit)}
                    onChange={(v) => handleChange('width', parseUnitValue(v, reportUnit, comp.width))}
                    size="small"
                    style={{ width: '100%' }}
                    step={unitStep}
                    min={formatUnitValue(1, reportUnit)}
                  />
                </Form.Item>
                <Form.Item label={t('height')}>
                  <InputNumber
                    aria-label={t('height')}
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
            label: t('text'),
            children: component.type === 'text' ? (
              <Form size="small" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
                <Form.Item label={t('textContent')}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Input.TextArea
                      aria-label={t('textContent')}
                      value={comp.text || ''}
                      onChange={(e) => handleChange('text', e.target.value)}
                      autoSize={false}
                      rows={3}
                      placeholder={t('textContentPlaceholder')}
                    />
                    <Button
                      aria-label={t('openExpressionEditor')}
                      title={t('openExpressionEditor')}
                      icon={<EditOutlined />}
                      onClick={() => setExprModalOpen(true)}
                      style={{ width: 32 }}
                    />
                  </Space.Compact>
                </Form.Item>
                <Form.Item label={t('textStyle')}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Select
                      aria-label={t('textStyle')}
                      value={comp.style}
                      onChange={(value) => applySelectedStyle(value)}
                      size="small"
                      style={{ width: '100%' }}
                      allowClear
                      virtual={false}
                      placeholder={t('chooseStyle')}
                      options={template.styles.map(style => ({ value: style.id, label: style.name }))}
                    />
                    <Button onClick={openTextStyleLibrary}>{t('manage')}</Button>
                  </Space.Compact>
                </Form.Item>
                <Form.Item label={t('conditionalFormat')}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Select
                      aria-label={t('conditionalFormat')}
                      value={comp.conditionalFormat ?? undefined}
                      onChange={(value) => applySelectedConditionalFormat(value === NO_CONDITIONAL_FORMAT ? undefined : value)}
                      size="small"
                      style={{ width: '100%' }}
                      virtual={false}
                      placeholder={t('chooseConditionalFormat')}
                      options={[
                        { value: NO_CONDITIONAL_FORMAT, label: t('none') },
                        ...template.conditionalFormats.map(format => ({ value: format.id, label: format.name })),
                      ]}
                    />
                    <Button onClick={openConditionalFormatLibrary}>{t('manage')}</Button>
                  </Space.Compact>
                </Form.Item>
                <Form.Item wrapperCol={{ span: 24 }} style={{ marginBottom: 8 }}>
                  <div data-testid="property-format-editor-full-width" style={{ width: '100%', minWidth: 0 }}>
                    <TextFormatEditor
                      value={format}
                      onChange={(nextFormat) => handleChange('format', nextFormat)}
                      isFieldDisabled={isTextStyleLocked}
                      labelWidth={88}
                      size="small"
                    />
                  </div>
                </Form.Item>
                <Form.Item label={t('horizontalAlign')}>
                  <HorizontalAlignButtons
                    value={comp.textAlign || 'left'}
                    onChange={(value) => handleChange('textAlign', value)}
                    disabled={isTextStyleLocked('textAlign')}
                    labels={{
                      left: t('alignLeft'),
                      center: t('alignCenter'),
                      right: t('alignRight'),
                    }}
                  />
                </Form.Item>
                <Form.Item label={t('verticalAlign')}>
                  <VerticalAlignButtons
                    value={comp.verticalAlign || 'top'}
                    onChange={(value) => handleChange('verticalAlign', value)}
                    disabled={isTextStyleLocked('verticalAlign')}
                    labels={{
                      top: t('verticalTop'),
                      middle: t('verticalMiddle'),
                      bottom: t('verticalBottom'),
                    }}
                  />
                </Form.Item>
                <Form.Item label={t('canGrow')}>
                  <Switch
                    aria-label={t('canGrow')}
                    size="small"
                    checked={comp.canGrow || false}
                    onChange={(v) => handleChange('canGrow', v)}
                    disabled={isTextStyleLocked('canGrow')}
                  />
                </Form.Item>
                <Form.Item label={t('canShrink')}>
                  <Switch
                    aria-label={t('canShrink')}
                    size="small"
                    checked={comp.canShrink || false}
                    onChange={(v) => handleChange('canShrink', v)}
                    disabled={isTextStyleLocked('canShrink')}
                  />
                </Form.Item>
              </Form>
            ) : <ComponentContentProperties component={component} comp={comp} onChange={handleChange} t={t} />,
          },

          // ---- 字体 ----
          {
            key: 'font',
            label: t('font'),
            children: (
              <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label={t('fontFamily')}>
                  <Select
                    aria-label={t('fontFamily')}
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
                <Form.Item label={t('fontSize')}>
                  <InputNumber
                    aria-label={t('fontSize')}
                    value={font.size}
                    onChange={(v) => handleFontField('size', v)}
                    size="small"
                    disabled={isTextStyleLocked('font.size')}
                    style={{ width: '100%' }}
                    min={6}
                    max={72}
                  />
                </Form.Item>
                <Form.Item label={t('textColor')}>
                  <ColorPicker
                    aria-label={t('textColor')}
                    size="small"
                    value={font.color || '#000000'}
                    onChange={(color) => handleFontField('color', color.toHexString())}
                    disabled={isTextStyleLocked('font.color')}
                  />
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button
                      aria-label={t('bold')}
                      title={t('bold')}
                      icon={<BoldOutlined />}
                      size="small"
                      type={font.bold ? 'primary' : 'default'}
                      style={{ minWidth: 32 }}
                      onClick={() => handleFontField('bold', !font.bold)}
                      disabled={isTextStyleLocked('font.bold')}
                    />
                    <Button
                      aria-label={t('italic')}
                      title={t('italic')}
                      icon={<ItalicOutlined />}
                      size="small"
                      type={font.italic ? 'primary' : 'default'}
                      style={{ minWidth: 32 }}
                      onClick={() => handleFontField('italic', !font.italic)}
                      disabled={isTextStyleLocked('font.italic')}
                    />
                    <Button
                      aria-label={t('underline')}
                      title={t('underline')}
                      icon={<UnderlineOutlined />}
                      size="small"
                      type={font.underline ? 'primary' : 'default'}
                      style={{ minWidth: 32 }}
                      onClick={() => handleFontField('underline', !font.underline)}
                      disabled={isTextStyleLocked('font.underline')}
                    />
                    <Button
                      aria-label={t('strike')}
                      title={t('strike')}
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
            label: t('border'),
            children: (
              <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label={t('borderStyle')}>
                  <Select
                    aria-label={t('borderStyle')}
                    value={border.style}
                    onChange={(v) => handleBorderField('style', v)}
                    size="small"
                    disabled={isTextStyleLocked('border.style')}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'none', label: t('borderNone') },
                      { value: 'solid', label: t('borderSolid') },
                      { value: 'dashed', label: t('borderDashed') },
                      { value: 'dotted', label: t('borderDotted') },
                      { value: 'double', label: t('borderDouble') },
                    ]}
                  />
                </Form.Item>
                <Form.Item label={t('borderWidth')}>
                  <InputNumber
                    aria-label={t('borderWidth')}
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
                <Form.Item label={t('borderColor')}>
                  <ColorPicker
                    aria-label={t('borderColor')}
                    size="small"
                    value={border.color}
                    onChange={(color) => handleBorderField('color', color.toHexString())}
                    disabled={isTextStyleLocked('border.color')}
                  />
                </Form.Item>
                <Divider style={{ margin: '4px 0' }} />
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{t('applySides')}</div>
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
                  <Checkbox value="top" disabled={isTextStyleLocked('border.sides.top')}>{t('top')}</Checkbox>
                  <Checkbox value="right" disabled={isTextStyleLocked('border.sides.right')}>{t('right')}</Checkbox>
                  <Checkbox value="bottom" disabled={isTextStyleLocked('border.sides.bottom')}>{t('bottom')}</Checkbox>
                  <Checkbox value="left" disabled={isTextStyleLocked('border.sides.left')}>{t('left')}</Checkbox>
                </Checkbox.Group>
                <div style={{ ...borderSideStyle(), width: 60, height: 40, margin: '8px auto 0' }} />
              </Form>
            ),
          },

          // ---- 外观 ----
          {
            key: 'appearance',
            label: t('appearance'),
            children: (
              <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label={t('backgroundColor')}>
                  <ColorPicker
                    aria-label={t('backgroundColor')}
                    size="small"
                    value={comp.backgroundColor || '#ffffff'}
                    onChange={(color) => handleChange('backgroundColor', color.toHexString())}
                    allowClear
                    disabled={backgroundLocked}
                  />
                </Form.Item>
                <Divider style={{ margin: '4px 0' }} />
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{t('padding')}</div>
                <Form.Item label={t('top')}>
                  <InputNumber
                    aria-label={t('paddingTop')}
                    value={formatUnitValue(padding.top, reportUnit)}
                    onChange={(v) => handlePaddingField('top', parseUnitValue(v, reportUnit, padding.top))}
                    size="small"
                    disabled={isTextStyleLocked('padding.top')}
                    style={{ width: '100%' }}
                    min={0}
                    step={unitStep}
                  />
                </Form.Item>
                <Form.Item label={t('right')}>
                  <InputNumber
                    aria-label={t('paddingRight')}
                    value={formatUnitValue(padding.right, reportUnit)}
                    onChange={(v) => handlePaddingField('right', parseUnitValue(v, reportUnit, padding.right))}
                    size="small"
                    disabled={isTextStyleLocked('padding.right')}
                    style={{ width: '100%' }}
                    min={0}
                    step={unitStep}
                  />
                </Form.Item>
                <Form.Item label={t('bottom')}>
                  <InputNumber
                    aria-label={t('paddingBottom')}
                    value={formatUnitValue(padding.bottom, reportUnit)}
                    onChange={(v) => handlePaddingField('bottom', parseUnitValue(v, reportUnit, padding.bottom))}
                    size="small"
                    disabled={isTextStyleLocked('padding.bottom')}
                    style={{ width: '100%' }}
                    min={0}
                    step={unitStep}
                  />
                </Form.Item>
                <Form.Item label={t('left')}>
                  <InputNumber
                    aria-label={t('paddingLeft')}
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
            label: t('table'),
            children: (
              <TablePropertyPanel
                table={normalizeTable(component as TableComponent)}
                dataSources={dataSources}
                onChange={updateSelectedTable}
                t={t}
              />
            ),
          } : null,

          // ---- 线条 ----
          component.type === 'line' ? {
            key: 'line',
            label: t('line'),
            children: (
              <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label={t('color')}>
                  <ColorPicker
                    size="small"
                    value={comp.lineColor || '#000000'}
                    onChange={(color) => handleChange('lineColor', color.toHexString())}
                  />
                </Form.Item>
                <Form.Item label={t('lineWidth')}>
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
                <Form.Item label={t('lineStyle')}>
                  <Select
                    value={comp.lineStyle || 'solid'}
                    onChange={(v) => handleChange('lineStyle', v)}
                    size="small"
                    style={{ width: '100%' }}
                    options={[
                      { value: 'solid', label: t('borderSolid') },
                      { value: 'dashed', label: t('borderDashed') },
                      { value: 'dotted', label: t('borderDotted') },
                    ]}
                  />
                </Form.Item>
                <Divider style={{ margin: '4px 0' }} />
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{t('lineEndpoints')}</div>
                <Form.Item label={t('startX')}>
                  <InputNumber value={formatUnitValue(comp.startX ?? 0, reportUnit)} onChange={(v) => handleChange('startX', parseUnitValue(v, reportUnit, comp.startX ?? 0))} size="small" style={{ width: '100%' }} step={unitStep} />
                </Form.Item>
                <Form.Item label={t('startY')}>
                  <InputNumber value={formatUnitValue(comp.startY ?? 0, reportUnit)} onChange={(v) => handleChange('startY', parseUnitValue(v, reportUnit, comp.startY ?? 0))} size="small" style={{ width: '100%' }} step={unitStep} />
                </Form.Item>
                <Form.Item label={t('endX')}>
                  <InputNumber value={formatUnitValue(comp.endX ?? comp.width, reportUnit)} onChange={(v) => handleChange('endX', parseUnitValue(v, reportUnit, comp.endX ?? comp.width))} size="small" style={{ width: '100%' }} step={unitStep} />
                </Form.Item>
                <Form.Item label={t('endY')}>
                  <InputNumber value={formatUnitValue(comp.endY ?? comp.height, reportUnit)} onChange={(v) => handleChange('endY', parseUnitValue(v, reportUnit, comp.endY ?? comp.height))} size="small" style={{ width: '100%' }} step={unitStep} />
                </Form.Item>
              </Form>
            ),
          } : null,

          // ---- 形状 ----
          component.type === 'shape' ? {
            key: 'shape',
            label: t('shape'),
            children: (
              <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label={t('shapeType')}>
                  <Select
                    value={comp.shapeType || 'rectangle'}
                    onChange={(v) => handleChange('shapeType', v)}
                    size="small"
                    style={{ width: '100%' }}
                    options={[
                      { value: 'rectangle', label: t('rectangle') },
                      { value: 'ellipse', label: t('ellipse') },
                      { value: 'roundRect', label: t('roundRect') },
                      { value: 'triangle', label: t('triangle') },
                    ]}
                  />
                </Form.Item>
                <Form.Item label={t('fillColor')}>
                  <ColorPicker
                    size="small"
                    value={comp.fillColor || '#ffffff'}
                    onChange={(color) => handleChange('fillColor', color.toHexString())}
                    allowClear
                  />
                </Form.Item>
                <Form.Item label={t('shapeBorderColor')}>
                  <ColorPicker
                    size="small"
                    value={comp.borderColor || '#000000'}
                    onChange={(color) => handleChange('borderColor', color.toHexString())}
                  />
                </Form.Item>
                <Form.Item label={t('shapeBorderWidth')}>
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
                <Form.Item label={t('shapeBorderStyle')}>
                  <Select
                    value={comp.borderStyle || 'solid'}
                    onChange={(v) => handleChange('borderStyle', v)}
                    size="small"
                    style={{ width: '100%' }}
                    options={[
                      { value: 'solid', label: t('borderSolid') },
                      { value: 'dashed', label: t('borderDashed') },
                      { value: 'dotted', label: t('borderDotted') },
                    ]}
                  />
                </Form.Item>
              </Form>
            ),
          } : null,

          // ---- 页码 ----
          component.type === 'pagenumber' ? {
            key: 'pagenumber',
            label: t('pageNumber'),
            children: (
              <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label={t('format')}>
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
                <Form.Item label={t('horizontalAlign')}>
                  <HorizontalAlignButtons
                    value={comp.textAlign || 'center'}
                    onChange={(value) => handleChange('textAlign', value)}
                    labels={{
                      left: t('alignLeft'),
                      center: t('alignCenter'),
                      right: t('alignRight'),
                    }}
                  />
                </Form.Item>
              </Form>
            ),
          } : null,

          // ---- 日期时间 ----
          component.type === 'datetime' ? {
            key: 'datetime',
            label: t('dateTime'),
            children: (
              <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label={t('format')}>
                  <Input
                    value={comp.format || 'yyyy-MM-dd'}
                    onChange={(e) => handleChange('format', e.target.value)}
                    size="small"
                    placeholder={t('dateTimeFormatPlaceholder')}
                  />
                </Form.Item>
                <Form.Item label={t('horizontalAlign')}>
                  <HorizontalAlignButtons
                    value={comp.textAlign || 'left'}
                    onChange={(value) => handleChange('textAlign', value)}
                    labels={{
                      left: t('alignLeft'),
                      center: t('alignCenter'),
                      right: t('alignRight'),
                    }}
                  />
                </Form.Item>
              </Form>
            ),
          } : null,

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

const ComponentContentProperties: React.FC<{
  component: { type: string };
  comp: any;
  onChange: (field: string, value: any) => void;
  t: ReturnType<typeof createPropertyT>;
}> = ({ component, comp, onChange, t }) => {
  switch (component.type) {
    case 'image': {
      const uploadInputId = `rd-image-upload-${comp.id ?? 'selected'}`;
      const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
          const dataUrl = await readImageAsDataUrl(file);
          onChange('src', dataUrl);
        } finally {
          event.target.value = '';
        }
      };
      return (
        <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
          <Form.Item label={t('imageUrlOrBase64')}>
            <Input.TextArea
              aria-label={t('imageUrlOrBase64')}
              value={comp.src || ''}
              onChange={(event) => onChange('src', event.target.value)}
              size="small"
              autoSize={false}
              rows={3}
              placeholder={t('imageUrlOrBase64Placeholder')}
            />
          </Form.Item>
          <Form.Item label={t('uploadImage')}>
            <input
              id={uploadInputId}
              aria-label={t('uploadImage')}
              type="file"
              accept="image/*"
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
              onChange={handleImageFileChange}
            />
            <Button size="small" icon={<UploadOutlined />} onClick={() => document.getElementById(uploadInputId)?.click()}>
              {t('uploadImage')}
            </Button>
          </Form.Item>
          <Form.Item label={t('fitMode')}>
            <Select
              aria-label={t('fitMode')}
              value={comp.fitMode || 'contain'}
              onChange={(value) => onChange('fitMode', value)}
              size="small"
              virtual={false}
              options={[
                { value: 'contain', label: t('fitContain') },
                { value: 'cover', label: t('fitCover') },
                { value: 'fill', label: t('fitFill') },
                { value: 'stretch', label: t('fitStretch') },
              ]}
            />
          </Form.Item>
        </Form>
      );
    }
    case 'barcode':
      return (
        <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
          <Form.Item label={t('barcodeContent')}>
            <Input
              aria-label={t('barcodeContent')}
              value={comp.value || ''}
              onChange={(event) => onChange('value', event.target.value)}
              size="small"
              placeholder={t('expressionLikePlaceholder')}
            />
          </Form.Item>
          <Form.Item label={t('barcodeFormat')}>
            <Select
              aria-label={t('barcodeFormat')}
              value={comp.format || 'CODE128'}
              onChange={(value) => onChange('format', value)}
              size="small"
              virtual={false}
              options={['QR_CODE', 'CODE128', 'EAN13', 'EAN8', 'UPC', 'CODE39', 'ITF14'].map(value => ({ value, label: value }))}
            />
          </Form.Item>
          <Form.Item label={t('showText')}>
            <Switch
              aria-label={t('showText')}
              size="small"
              checked={comp.showText ?? true}
              onChange={(checked) => onChange('showText', checked)}
            />
          </Form.Item>
        </Form>
      );
    case 'checkbox':
      return (
        <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
          <Form.Item label={t('checkedExpression')}>
            <Input
              aria-label={t('checkedExpression')}
              value={comp.checked || ''}
              onChange={(event) => onChange('checked', event.target.value)}
              size="small"
              placeholder={t('expressionLikePlaceholder')}
            />
          </Form.Item>
          <Form.Item label={t('labelText')}>
            <Input
              aria-label={t('labelText')}
              value={comp.label || ''}
              onChange={(event) => onChange('label', event.target.value)}
              size="small"
            />
          </Form.Item>
        </Form>
      );
    case 'richtext':
      return (
        <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
          <Form.Item label={t('htmlContent')}>
            <Input.TextArea
              aria-label={t('htmlContent')}
              value={comp.html || ''}
              onChange={(event) => onChange('html', event.target.value)}
              autoSize={false}
              rows={5}
              placeholder="<p>{Data.Field}</p>"
            />
          </Form.Item>
        </Form>
      );
    case 'subreport':
      return (
        <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
          <Form.Item label={t('templateUrl')}>
            <Input
              aria-label={t('templateUrl')}
              value={comp.templateUrl || ''}
              onChange={(event) => onChange('templateUrl', event.target.value)}
              size="small"
            />
          </Form.Item>
          <Form.Item label={t('parameters')}>
            <Input.TextArea
              aria-label={t('parameters')}
              value={JSON.stringify(comp.parameters ?? {}, null, 2)}
              onChange={(event) => {
                try {
                  onChange('parameters', JSON.parse(event.target.value || '{}'));
                } catch {
                  onChange('parameters', comp.parameters ?? {});
                }
              }}
              autoSize={false}
              rows={5}
            />
          </Form.Item>
        </Form>
      );
    case 'panel':
      return <div style={{ padding: 8, color: '#999', fontSize: 12 }}>{t('panelContentHint')}</div>;
    default:
      return <div style={{ padding: 8, color: '#999', fontSize: 12 }}>{t('noContentProperties')}</div>;
  }
};

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

const propertyEditorMessages = {
  'zh-CN': {
    selectComponent: '选择组件以编辑属性',
    selectedComponents: '已选择 {count} 个组件',
    general: '基本信息',
    position: '位置与尺寸',
    text: '文本内容',
    font: '字体',
    border: '边框',
    appearance: '外观',
    table: '表格',
    line: '线条属性',
    shape: '形状属性',
    pageNumber: '页码属性',
    dateTime: '日期时间属性',
    name: '名称',
    type: '类型',
    componentName: '组件名称',
    width: '宽度',
    height: '高度',
    textContent: '文本内容',
    textContentPlaceholder: '普通文本或 {DataSource.Field}',
    openExpressionEditor: '打开表达式编辑器',
    expressionLikePlaceholder: '普通值或 {DataSource.Field}',
    textStyle: '文本样式',
    chooseStyle: '选择样式集',
    conditionalFormat: '条件格式',
    chooseConditionalFormat: '选择条件格式',
    none: '无',
    manage: '管理',
    horizontalAlign: '水平对齐',
    verticalAlign: '垂直对齐',
    canGrow: '自动增大',
    canShrink: '自动缩小',
    textOnly: '文本组件专属',
    imageContent: '图片内容',
    imageContentPlaceholder: '图片地址或 {DataSource.Field}',
    imageUrlOrBase64: '图片地址/Base64',
    imageUrlOrBase64Placeholder: 'URL、Base64 或 {DataSource.Field}',
    uploadImage: '上传图片',
    fitMode: '适应方式',
    fitContain: '等比包含',
    fitCover: '等比裁切',
    fitFill: '填充',
    fitStretch: '拉伸',
    barcodeContent: '条码内容',
    barcodeFormat: '条码类型',
    showText: '显示文本',
    checkedExpression: '选中表达式',
    labelText: '标签文本',
    htmlContent: 'HTML 内容',
    templateUrl: '模板地址',
    parameters: '参数',
    panelContentHint: '面板可承载子组件，使用外观和边框属性设置容器样式。',
    noContentProperties: '该组件暂无专属内容属性。',
    fontFamily: '字体系列',
    fontSize: '字号',
    textColor: '字体颜色',
    bold: '加粗',
    italic: '斜体',
    underline: '下划线',
    strike: '删除线',
    borderStyle: '边框样式',
    borderNone: '无边框',
    borderSolid: '实线',
    borderDashed: '虚线',
    borderDotted: '点线',
    borderDouble: '双线',
    borderWidth: '边框宽度',
    borderColor: '边框颜色',
    applySides: '应用边',
    top: '上',
    right: '右',
    bottom: '下',
    left: '左',
    backgroundColor: '背景色',
    padding: '内边距',
    paddingTop: '内边距上',
    paddingRight: '内边距右',
    paddingBottom: '内边距下',
    paddingLeft: '内边距左',
    tableDataSource: '表格数据源',
    dataSource: '数据源',
    chooseDataSource: '选择数据源',
    columnCount: '列数',
    rowCount: '行数',
    headerRowsCount: '表头行数',
    footerRowsCount: '表尾行数',
    canBreak: '允许跨页',
    showBorder: '显示边框',
    color: '颜色',
    lineWidth: '宽度',
    lineStyle: '样式',
    lineEndpoints: '端点坐标',
    startX: '起点 X',
    startY: '起点 Y',
    endX: '终点 X',
    endY: '终点 Y',
    shapeType: '形状类型',
    rectangle: '矩形',
    ellipse: '椭圆',
    roundRect: '圆角矩形',
    triangle: '三角形',
    fillColor: '填充色',
    shapeBorderColor: '边框色',
    shapeBorderWidth: '边框宽',
    shapeBorderStyle: '边框样式',
    format: '格式',
    dateTimeFormatPlaceholder: 'yyyy-MM-dd HH:mm:ss',
    alignLeft: '左对齐',
    alignCenter: '水平居中',
    alignRight: '右对齐',
    verticalTop: '顶部对齐',
    verticalMiddle: '垂直居中',
    verticalBottom: '底部对齐',
  },
  'en-US': {
    selectComponent: 'Select a component to edit properties',
    selectedComponents: '{count} components selected',
    general: 'General',
    position: 'Position and Size',
    text: 'Text Content',
    font: 'Font',
    border: 'Border',
    appearance: 'Appearance',
    table: 'Table',
    line: 'Line Properties',
    shape: 'Shape Properties',
    pageNumber: 'Page Number Properties',
    dateTime: 'Date/Time Properties',
    name: 'Name',
    type: 'Type',
    componentName: 'Component name',
    width: 'Width',
    height: 'Height',
    textContent: 'Text content',
    textContentPlaceholder: 'Plain text or {DataSource.Field}',
    openExpressionEditor: 'Open expression editor',
    expressionLikePlaceholder: 'Plain value or {DataSource.Field}',
    textStyle: 'Text style',
    chooseStyle: 'Select style',
    conditionalFormat: 'Conditional format',
    chooseConditionalFormat: 'Select conditional format',
    none: 'None',
    manage: 'Manage',
    horizontalAlign: 'Horizontal align',
    verticalAlign: 'Vertical align',
    canGrow: 'Can grow',
    canShrink: 'Can shrink',
    textOnly: 'Text components only',
    imageContent: 'Image content',
    imageContentPlaceholder: 'Image URL or {DataSource.Field}',
    imageUrlOrBase64: 'Image URL/Base64',
    imageUrlOrBase64Placeholder: 'URL, Base64, or {DataSource.Field}',
    uploadImage: 'Upload image',
    fitMode: 'Fit mode',
    fitContain: 'Contain',
    fitCover: 'Cover',
    fitFill: 'Fill',
    fitStretch: 'Stretch',
    barcodeContent: 'Barcode content',
    barcodeFormat: 'Barcode type',
    showText: 'Show text',
    checkedExpression: 'Checked expression',
    labelText: 'Label text',
    htmlContent: 'HTML content',
    templateUrl: 'Template URL',
    parameters: 'Parameters',
    panelContentHint: 'Panels host child components. Use appearance and border properties for container styling.',
    noContentProperties: 'This component has no content-specific properties.',
    fontFamily: 'Font family',
    fontSize: 'Font size',
    textColor: 'Font color',
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    strike: 'Strike',
    borderStyle: 'Border style',
    borderNone: 'None',
    borderSolid: 'Solid',
    borderDashed: 'Dashed',
    borderDotted: 'Dotted',
    borderDouble: 'Double',
    borderWidth: 'Border width',
    borderColor: 'Border color',
    applySides: 'Apply sides',
    top: 'Top',
    right: 'Right',
    bottom: 'Bottom',
    left: 'Left',
    backgroundColor: 'Background color',
    padding: 'Padding',
    paddingTop: 'Padding top',
    paddingRight: 'Padding right',
    paddingBottom: 'Padding bottom',
    paddingLeft: 'Padding left',
    tableDataSource: 'Table data source',
    dataSource: 'Data source',
    chooseDataSource: 'Select data source',
    columnCount: 'Columns',
    rowCount: 'Rows',
    headerRowsCount: 'Header rows',
    footerRowsCount: 'Footer rows',
    canBreak: 'Can break',
    showBorder: 'Show border',
    color: 'Color',
    lineWidth: 'Width',
    lineStyle: 'Style',
    lineEndpoints: 'Endpoints',
    startX: 'Start X',
    startY: 'Start Y',
    endX: 'End X',
    endY: 'End Y',
    shapeType: 'Shape type',
    rectangle: 'Rectangle',
    ellipse: 'Ellipse',
    roundRect: 'Round rectangle',
    triangle: 'Triangle',
    fillColor: 'Fill',
    shapeBorderColor: 'Border color',
    shapeBorderWidth: 'Border width',
    shapeBorderStyle: 'Border style',
    format: 'Format',
    dateTimeFormatPlaceholder: 'yyyy-MM-dd HH:mm:ss',
    alignLeft: 'Align left',
    alignCenter: 'Center horizontally',
    alignRight: 'Align right',
    verticalTop: 'Align top',
    verticalMiddle: 'Center vertically',
    verticalBottom: 'Align bottom',
  },
} as const;

type PropertyEditorMessageKey = keyof typeof propertyEditorMessages['zh-CN'];

function createPropertyT(locale: DesignerLocale) {
  const messages = propertyEditorMessages[locale] ?? propertyEditorMessages['zh-CN'];
  const fallback = propertyEditorMessages['en-US'];
  return (key: PropertyEditorMessageKey, values?: Record<string, string | number>) => {
    const message = messages[key] ?? fallback[key] ?? key;
    if (!values) return message;
    return message.replace(/\{(\w+)\}/g, (match, valueKey) => (
      Object.prototype.hasOwnProperty.call(values, valueKey) ? String(values[valueKey]) : match
    ));
  };
}

type HorizontalAlignment = 'left' | 'center' | 'right';
type VerticalAlignment = 'top' | 'middle' | 'bottom';

const HorizontalAlignButtons: React.FC<{
  value: HorizontalAlignment;
  onChange: (value: HorizontalAlignment) => void;
  disabled?: boolean;
  labels?: Record<HorizontalAlignment, string>;
}> = ({ disabled = false, labels, onChange, value }) => (
  <IconButtonGroup
    items={[
      { value: 'left', label: labels?.left ?? '左对齐', icon: <AlignLeftOutlined /> },
      { value: 'center', label: labels?.center ?? '水平居中', icon: <AlignCenterOutlined /> },
      { value: 'right', label: labels?.right ?? '右对齐', icon: <AlignRightOutlined /> },
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
  labels?: Record<VerticalAlignment, string>;
}> = ({ disabled = false, labels, onChange, value }) => (
  <IconButtonGroup
    items={[
      { value: 'top', label: labels?.top ?? '顶部对齐', icon: <VerticalAlignGlyph position="top" /> },
      { value: 'middle', label: labels?.middle ?? '垂直居中', icon: <VerticalAlignGlyph position="middle" /> },
      { value: 'bottom', label: labels?.bottom ?? '底部对齐', icon: <VerticalAlignGlyph position="bottom" /> },
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
  t: ReturnType<typeof createPropertyT>;
  onChange: (updates: {
    rowCount?: number;
    columnCount?: number;
    headerRowsCount?: number;
    footerRowsCount?: number;
    canBreak?: boolean;
    showBorder?: boolean;
    dataSource?: string;
  }) => void;
}> = ({ table, dataSources, onChange, t }) => (
  <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
    <Form.Item label={t('dataSource')}>
      <Select
        aria-label={t('tableDataSource')}
        value={table.dataSource || undefined}
        onChange={(value) => onChange({ dataSource: value })}
        size="small"
        style={{ width: '100%' }}
        allowClear
        placeholder={t('chooseDataSource')}
        options={dataSources.map(source => ({ value: source, label: source }))}
      />
    </Form.Item>
    <Form.Item label={t('columnCount')}>
      <InputNumber
        aria-label={t('columnCount')}
        value={table.columnCount ?? table.columns.length}
        onChange={(value) => onChange({ columnCount: value ?? 1 })}
        size="small"
        style={{ width: '100%' }}
        min={1}
        step={1}
      />
    </Form.Item>
    <Form.Item label={t('rowCount')}>
      <InputNumber
        aria-label={t('rowCount')}
        value={table.rowCount ?? 3}
        onChange={(value) => onChange({ rowCount: value ?? 1 })}
        size="small"
        style={{ width: '100%' }}
        min={1}
        step={1}
      />
    </Form.Item>
    <Form.Item label={t('headerRowsCount')}>
      <InputNumber
        aria-label={t('headerRowsCount')}
        value={table.headerRowsCount ?? 1}
        onChange={(value) => onChange({ headerRowsCount: value ?? 0 })}
        size="small"
        style={{ width: '100%' }}
        min={0}
        max={table.rowCount ?? 3}
        step={1}
      />
    </Form.Item>
    <Form.Item label={t('footerRowsCount')}>
      <InputNumber
        aria-label={t('footerRowsCount')}
        value={table.footerRowsCount ?? 0}
        onChange={(value) => onChange({ footerRowsCount: value ?? 0 })}
        size="small"
        style={{ width: '100%' }}
        min={0}
        max={table.rowCount ?? 3}
        step={1}
      />
    </Form.Item>
    <Form.Item label={t('canBreak')}>
      <Switch
        aria-label={t('canBreak')}
        size="small"
        checked={table.canBreak ?? true}
        onChange={(checked) => onChange({ canBreak: checked })}
      />
    </Form.Item>
    <Form.Item label={t('showBorder')}>
      <Switch
        aria-label={t('showBorder')}
        size="small"
        checked={table.showBorder}
        onChange={(checked) => onChange({ showBorder: checked })}
      />
    </Form.Item>
  </Form>
);
