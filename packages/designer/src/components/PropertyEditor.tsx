import React, { useMemo, useState } from 'react';
import { Form, Input, InputNumber, Select, Switch, ColorPicker, Collapse, Space, Button, Divider, Checkbox, Typography, Segmented } from 'antd';
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
import { getReportFontOptions } from '@report-designer/core';
import type { BorderConfig, ChartAggregateMode, ChartComponent, ChartType, ChartVariant, DataSource, ReportTemplate, TableColumn, TableComponent, TextFormatConfig } from '@report-designer/core';
import type { CSSProperties } from 'react';
import { formatUnitValue, getUnitStep, parseUnitValue } from '../page-settings';
import { ExpressionEditor } from './ExpressionEditor';
import { normalizeTable } from '../table/table-structure';
import { hasTextStyleBinding } from '../text-style-bindings';
import { TextFormatEditor } from './TextFormatEditor';
import { useDesignerI18n, type DesignerLocale } from '../i18n';
import { EventEditorDialog, type EventTreeItem } from './events/EventEditorDialog';
import { buildEventEditorDataContext } from './events/event-editor-utils';

const DEFAULT_BORDER: BorderConfig = {
  style: 'none',
  width: 0.1,
  color: '#000000',
  sides: { top: false, right: false, bottom: false, left: false },
};
const NO_CONDITIONAL_FORMAT = '__none__';

export const PropertyEditor: React.FC = () => {
  const { locale, t: globalT } = useDesignerI18n();
  const t = createPropertyT(locale);
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const selectedComponentIds = useDesignerStore(s => s.selectedComponentIds);
  const updateComponent = useDesignerStore(s => s.updateComponent);
  const updateSelectedTable = useDesignerStore(s => s.updateSelectedTable);
  const applySelectedStyle = useDesignerStore(s => s.applySelectedStyle);
  const applySelectedConditionalFormat = useDesignerStore(s => s.applySelectedConditionalFormat);
  const replaceComponentEvents = useDesignerStore(s => s.replaceComponentEvents);
  const openTextStyleLibrary = useDesignerStore(s => s.openTextStyleLibrary);
  const openConditionalFormatLibrary = useDesignerStore(s => s.openConditionalFormatLibrary);
  const reportUnit = useDesignerStore(s => s.reportUnit);
  const pendingEventEditorTarget = useDesignerStore(s => s.pendingEventEditorTarget);
  const consumeEventEditorTarget = useDesignerStore(s => s.consumeEventEditorTarget);

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

  const [expressionTarget, setExpressionTarget] = useState<{ field: string; label: string } | null>(null);
  const [eventEditorOpen, setEventEditorOpen] = useState(false);
  const [eventEditorTarget, setEventEditorTarget] = useState<typeof pendingEventEditorTarget>(null);
  const unitStep = getUnitStep(reportUnit);
  const fineUnitStep = getUnitStep(reportUnit, 'fine');
  const pendingTarget = pendingEventEditorTarget?.ownerType === 'component' && pendingEventEditorTarget.ownerId === component?.id
    ? pendingEventEditorTarget
    : null;

  React.useEffect(() => {
    if (!pendingTarget) return;
    setEventEditorTarget(pendingTarget);
    setEventEditorOpen(true);
    consumeEventEditorTarget(pendingTarget.requestId);
  }, [consumeEventEditorTarget, pendingTarget]);

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

  const openFieldExpressionEditor = (field: string, label: string) => {
    setExpressionTarget({ field, label });
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
  const reportFontOptions = getReportFontOptions(template.fonts);

  // ---- Padding helpers ----
  const padding = comp.padding ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const handlePaddingField = (field: string, value: number) => {
    handleChange('padding', { ...padding, [field]: value });
  };

  const isTextComponent = component.type === 'text';
  const supportsFontProperties = ['text', 'barcode', 'checkbox', 'pagenumber', 'datetime'].includes(component.type);
  const supportsBorderProperties = ['text', 'image', 'chart', 'barcode', 'checkbox', 'panel', 'pagenumber', 'datetime'].includes(component.type);
  const supportsAppearanceProperties = ['text', 'image', 'chart', 'barcode', 'checkbox', 'richtext', 'panel', 'subreport', 'pagenumber', 'datetime'].includes(component.type);
  const supportsForegroundColor = component.type === 'barcode' || component.type === 'checkbox';
  const isTextStyleLocked = (pathOrPrefix: string) => (
    isTextComponent ? hasTextStyleBinding(component as { styleBindings?: string[] }, pathOrPrefix) : false
  );
  const backgroundLocked = isTextStyleLocked('backgroundColor');
  const dictionaryItems = buildDictionaryEventItems(template);
  const componentItems = buildComponentEventItems(template);

  return (
    <div style={{ padding: 8 }}>
      <Collapse
        defaultActiveKey={['general', 'position', 'behavior', 'text', 'font', 'border', 'appearance', 'events', 'table', 'line', 'shape', 'pagenumber', 'datetime']}
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

          {
            key: 'behavior',
            label: t('behavior'),
            children: (
              <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label={t('visibleExpression')}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      aria-label={t('visibleExpression')}
                      value={comp.visible || ''}
                      onChange={(event) => handleChange('visible', event.target.value)}
                      size="small"
                      placeholder={t('visibleExpressionPlaceholder')}
                    />
                    <Button
                      aria-label={t('openExpressionEditorFor', { field: t('visibleExpression') })}
                      title={t('openExpressionEditorFor', { field: t('visibleExpression') })}
                      icon={<EditOutlined />}
                      onClick={() => openFieldExpressionEditor('visible', t('visibleExpression'))}
                      style={{ width: 32 }}
                    />
                  </Space.Compact>
                </Form.Item>
                <Form.Item label={t('enabledExpression')}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      aria-label={t('enabledExpression')}
                      value={comp.enabledExpression || ''}
                      onChange={(event) => handleChange('enabledExpression', event.target.value)}
                      size="small"
                      placeholder={t('enabledExpressionPlaceholder')}
                    />
                    <Button
                      aria-label={t('openExpressionEditorFor', { field: t('enabledExpression') })}
                      title={t('openExpressionEditorFor', { field: t('enabledExpression') })}
                      icon={<EditOutlined />}
                      onClick={() => openFieldExpressionEditor('enabledExpression', t('enabledExpression'))}
                      style={{ width: 32 }}
                    />
                  </Space.Compact>
                </Form.Item>
                <Form.Item label={t('printableExpression')}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      aria-label={t('printableExpression')}
                      value={comp.printableExpression || ''}
                      onChange={(event) => handleChange('printableExpression', event.target.value)}
                      size="small"
                      placeholder={t('printableExpressionPlaceholder')}
                    />
                    <Button
                      aria-label={t('openExpressionEditorFor', { field: t('printableExpression') })}
                      title={t('openExpressionEditorFor', { field: t('printableExpression') })}
                      icon={<EditOutlined />}
                      onClick={() => openFieldExpressionEditor('printableExpression', t('printableExpression'))}
                      style={{ width: 32 }}
                    />
                  </Space.Compact>
                </Form.Item>
              </Form>
            ),
          },

          // ---- 文本内容 ----
          {
            key: 'text',
            label: component.type === 'chart' ? t('chart') : t('text'),
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
                      aria-label={t('openExpressionEditorFor', { field: t('textContent') })}
                      title={t('openExpressionEditorFor', { field: t('textContent') })}
                      icon={<EditOutlined />}
                      onClick={() => openFieldExpressionEditor('text', t('textContent'))}
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
            ) : (
              <ComponentContentProperties
                component={component}
                comp={comp}
                onChange={handleChange}
                onOpenExpressionEditor={openFieldExpressionEditor}
                t={t}
                dataSources={dataSources}
                dataSourceDefinitions={template.dataSources}
              />
            ),
          },

          // ---- 字体 ----
          supportsFontProperties ? {
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
                      ...reportFontOptions.map(fontOption => ({
                        value: fontOption.value,
                        label: <span style={{ fontFamily: fontOption.fontFamily }}>{fontOption.label}</span>,
                      })),
                    ]}
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
          } : null,

          // ---- 边框 ----
          supportsBorderProperties ? {
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
          } : null,

          // ---- 外观 ----
          supportsAppearanceProperties ? {
            key: 'appearance',
            label: t('appearance'),
            children: (
              <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                {supportsForegroundColor ? (
                  <Form.Item label={t('foregroundColor')}>
                    <Space.Compact style={{ width: '100%' }}>
                      <ColorPicker
                        aria-label={t('foregroundColorPicker')}
                        size="small"
                        value={comp.foregroundColor || '#000000'}
                        onChange={(color) => handleChange('foregroundColor', color.toHexString())}
                      />
                      <Input
                        aria-label={t('foregroundColor')}
                        value={comp.foregroundColor || '#000000'}
                        onChange={(event) => handleChange('foregroundColor', event.target.value)}
                        size="small"
                        style={{ width: '100%' }}
                        placeholder="#000000"
                      />
                    </Space.Compact>
                  </Form.Item>
                ) : null}
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
          } : null,

          // ---- 表格 ----
          component.type === 'table' ? {
            key: 'table',
            label: t('table'),
            children: (
              <TablePropertyPanel
                table={normalizeTable(component as TableComponent)}
                dataSources={dataSources}
                dataSourceDefinitions={template.dataSources}
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
                      { value: '1/N', label: t('pageNumberFormatFraction') },
                      { value: 'Page 1 of N', label: t('pageNumberFormatPageOf') },
                      { value: 'Page 1', label: t('pageNumberFormatPageOnly') },
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
                <Form.Item label={t('verticalAlign')}>
                  <VerticalAlignButtons
                    value={comp.verticalAlign || 'middle'}
                    onChange={(value) => handleChange('verticalAlign', value)}
                    labels={{
                      top: t('verticalTop'),
                      middle: t('verticalMiddle'),
                      bottom: t('verticalBottom'),
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
                <Form.Item label={t('verticalAlign')}>
                  <VerticalAlignButtons
                    value={comp.verticalAlign || 'middle'}
                    onChange={(value) => handleChange('verticalAlign', value)}
                    labels={{
                      top: t('verticalTop'),
                      middle: t('verticalMiddle'),
                      bottom: t('verticalBottom'),
                    }}
                  />
                </Form.Item>
              </Form>
            ),
          } : null,

          {
            key: 'events',
            label: globalT('events.title'),
            children: (
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Button block size="small" icon={<EditOutlined />} onClick={() => {
                  setEventEditorTarget(null);
                  setEventEditorOpen(true);
                }}>
                  {globalT('events.edit')}
                </Button>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {Object.keys(comp.events ?? {}).length} {globalT('events.title')}
                </Typography.Text>
              </Space>
            ),
          },

        ].filter(Boolean) as any}
      />
      <EventEditorDialog
        open={eventEditorOpen}
        targetType="component"
        events={component.events}
        initialEventName={eventEditorTarget?.eventName}
        initialCursor={eventEditorTarget ? { line: eventEditorTarget.line, column: eventEditorTarget.column } : undefined}
        dataContext={buildEventEditorDataContext(template, { targetType: 'component', componentId: component.id })}
        dictionaryItems={dictionaryItems}
        componentItems={componentItems}
        onCancel={() => {
          setEventEditorOpen(false);
          setEventEditorTarget(null);
        }}
        onSave={(events) => {
          replaceComponentEvents(currentPageId, bandId, component.id, events);
          setEventEditorOpen(false);
          setEventEditorTarget(null);
        }}
      />
      <ExpressionEditor
        open={Boolean(expressionTarget)}
        value={expressionTarget ? String(comp[expressionTarget.field] ?? '') : ''}
        onChange={(v) => {
          if (expressionTarget) handleChange(expressionTarget.field, v);
        }}
        onClose={() => setExpressionTarget(null)}
      />
    </div>
  );
};

const ComponentContentProperties: React.FC<{
  component: { type: string };
  comp: any;
  onChange: (field: string, value: any) => void;
  onOpenExpressionEditor: (field: string, label: string) => void;
  t: ReturnType<typeof createPropertyT>;
  dataSources: string[];
  dataSourceDefinitions: DataSource[];
}> = ({ component, comp, dataSourceDefinitions, dataSources, onChange, onOpenExpressionEditor, t }) => {
  switch (component.type) {
    case 'chart':
      return (
        <ChartPropertyPanel
          chart={comp as ChartComponent}
          dataSources={dataSources}
          dataSourceDefinitions={dataSourceDefinitions}
          onChange={onChange}
          onOpenExpressionEditor={onOpenExpressionEditor}
          t={t}
        />
      );
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
            <Space.Compact style={{ width: '100%' }}>
              <Input.TextArea
                aria-label={t('imageUrlOrBase64')}
                value={comp.src || ''}
                onChange={(event) => onChange('src', event.target.value)}
                size="small"
                autoSize={false}
                rows={3}
                placeholder={t('imageUrlOrBase64Placeholder')}
              />
              <ExpressionFieldButton
                label={t('imageUrlOrBase64')}
                t={t}
                onClick={() => onOpenExpressionEditor('src', t('imageUrlOrBase64'))}
              />
            </Space.Compact>
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
            <Space.Compact style={{ width: '100%' }}>
              <Input
                aria-label={t('barcodeContent')}
                value={comp.value || ''}
                onChange={(event) => onChange('value', event.target.value)}
                size="small"
                placeholder={t('expressionLikePlaceholder')}
              />
              <ExpressionFieldButton
                label={t('barcodeContent')}
                t={t}
                onClick={() => onOpenExpressionEditor('value', t('barcodeContent'))}
              />
            </Space.Compact>
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
            <Space.Compact style={{ width: '100%' }}>
              <Input
                aria-label={t('checkedExpression')}
                value={comp.checked || ''}
                onChange={(event) => onChange('checked', event.target.value)}
                size="small"
                placeholder={t('expressionLikePlaceholder')}
              />
              <ExpressionFieldButton
                label={t('checkedExpression')}
                t={t}
                onClick={() => onOpenExpressionEditor('checked', t('checkedExpression'))}
              />
            </Space.Compact>
          </Form.Item>
          <Form.Item label={t('labelText')}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                aria-label={t('labelText')}
                value={comp.label || ''}
                onChange={(event) => onChange('label', event.target.value)}
                size="small"
              />
              <ExpressionFieldButton
                label={t('labelText')}
                t={t}
                onClick={() => onOpenExpressionEditor('label', t('labelText'))}
              />
            </Space.Compact>
          </Form.Item>
        </Form>
      );
    case 'richtext':
      return (
        <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
          <Form.Item label={t('richTextContent')}>
            <Space.Compact style={{ width: '100%' }}>
              <Input.TextArea
                aria-label={t('richTextContent')}
                value={comp.html || ''}
                onChange={(event) => onChange('html', event.target.value)}
                autoSize={false}
                rows={5}
                placeholder="<p>{Data.Field}</p>"
              />
              <ExpressionFieldButton
                label={t('richTextContent')}
                t={t}
                onClick={() => onOpenExpressionEditor('html', t('richTextContent'))}
              />
            </Space.Compact>
          </Form.Item>
        </Form>
      );
    case 'subreport':
      return (
        <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
          <Form.Item label={t('localTemplateKey')}>
            <Input
              aria-label={t('localTemplateKey')}
              value={comp.templateUrl || ''}
              onChange={(event) => onChange('templateUrl', event.target.value)}
              size="small"
              placeholder={t('localTemplateKeyPlaceholder')}
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

const ChartPropertyPanel: React.FC<{
  chart: ChartComponent;
  dataSources: string[];
  dataSourceDefinitions: DataSource[];
  onChange: (field: string, value: any) => void;
  onOpenExpressionEditor: (field: string, label: string) => void;
  t: ReturnType<typeof createPropertyT>;
}> = ({ chart, dataSourceDefinitions, dataSources, onChange, t }) => {
  const binding = chart.binding ?? {};
  const appearance = chart.appearance ?? {};
  const source = dataSourceDefinitions.find(item => item.id === binding.dataSourceId || item.name === binding.dataSourceId);
  const fieldOptions = (source?.schema ?? source?.fields ?? []).map(field => ({
    value: `{${field.name}}`,
    label: field.label || field.name,
  }));
  const expressionListId = `rd-chart-fields-${chart.id}`;
  const updateBinding = (updates: Partial<ChartComponent['binding']>) => {
    onChange('binding', {
      dataSourceId: '',
      categoryExpression: '',
      valueExpression: '',
      xExpression: '',
      yExpression: '',
      seriesExpression: '',
      labelExpression: '',
      sort: [],
      aggregate: 'none',
      ...binding,
      ...updates,
    });
  };
  const updateAppearance = (updates: Partial<ChartComponent['appearance']>) => {
    onChange('appearance', {
      title: '',
      subtitle: '',
      showLegend: true,
      legendPosition: 'bottom',
      showAxes: true,
      showGrid: true,
      showLabels: false,
      palette: ['#2f6fed', '#16a34a', '#f59e0b', '#ef4444'],
      axisTitleX: '',
      axisTitleY: '',
      innerRadius: 0.55,
      outerRadius: 0.85,
      ...appearance,
      ...updates,
    });
  };
  const handleTypeChange = (chartType: ChartType) => {
    onChange('chartType', chartType);
    onChange('variant', defaultChartVariant(chartType));
  };
  const handleDataSourceChange = (dataSourceId?: string) => {
    const nextSource = dataSourceDefinitions.find(item => item.id === dataSourceId || item.name === dataSourceId);
    const fields = nextSource?.schema ?? nextSource?.fields ?? [];
    const category = fields.find(field => field.type !== 'number') ?? fields[0];
    const numberFields = fields.filter(field => field.type === 'number');
    const value = numberFields[0] ?? fields[1] ?? fields[0];
    const y = numberFields[1] ?? numberFields[0] ?? fields[1] ?? fields[0];
    updateBinding({
      dataSourceId: dataSourceId ?? '',
      arrayPath: dataSourceId ? arrayPathForDataSource(dataSourceId, dataSourceDefinitions) : '',
      categoryExpression: binding.categoryExpression || fieldExpression(category),
      valueExpression: binding.valueExpression || fieldExpression(value),
      xExpression: binding.xExpression || fieldExpression(value),
      yExpression: binding.yExpression || fieldExpression(y),
    });
  };

  return (
    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
        <Form.Item label={t('chartType')}>
          <Select
            aria-label={t('chartType')}
            value={chart.chartType}
            onChange={handleTypeChange}
            size="small"
            options={chartTypeOptions(t)}
          />
        </Form.Item>
        <Form.Item label={t('chartVariant')}>
          <Select
            aria-label={t('chartVariant')}
            value={chart.variant}
            onChange={(value) => onChange('variant', value)}
            size="small"
            options={chartVariantOptions(chart.chartType, t)}
          />
        </Form.Item>
      </Form>

      <Typography.Text strong>{t('chartBinding')}</Typography.Text>
      <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
        <Form.Item label={t('chartDataSource')}>
          <Select
            aria-label={t('chartDataSource')}
            value={binding.dataSourceId || undefined}
            onChange={handleDataSourceChange}
            allowClear
            showSearch
            size="small"
            placeholder={t('chooseDataSource')}
            options={createDataSourceOptions(dataSources, dataSourceDefinitions)}
          />
        </Form.Item>
        <Form.Item label={t('chartArrayPath')}>
          <Input
            aria-label={t('chartArrayPath')}
            value={binding.arrayPath ?? ''}
            onChange={(event) => updateBinding({ arrayPath: event.target.value })}
            size="small"
            placeholder={t('tableBindingArrayPathPlaceholder')}
          />
        </Form.Item>
        {chart.chartType === 'point' ? (
          <>
            {chartExpressionItem('xExpression', t('chartXField'))}
            {chartExpressionItem('yExpression', t('chartYField'))}
          </>
        ) : (
          <>
            {chartExpressionItem('categoryExpression', t('chartCategoryField'))}
            {chartExpressionItem('valueExpression', t('chartValueField'))}
          </>
        )}
        {chartExpressionItem('seriesExpression', t('chartSeriesField'), false)}
        {chartExpressionItem('labelExpression', t('chartLabelField'), false)}
        <Form.Item label={t('chartAggregate')}>
          <Select
            aria-label={t('chartAggregate')}
            value={binding.aggregate ?? 'none'}
            onChange={(value) => updateBinding({ aggregate: value as ChartAggregateMode })}
            size="small"
            options={chartAggregateOptions(t)}
          />
        </Form.Item>
      </Form>
      <datalist id={expressionListId}>
        {fieldOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </datalist>

      <Typography.Text strong>{t('chartAppearance')}</Typography.Text>
      <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
        <Form.Item label={t('chartTitle')}>
          <Input aria-label={t('chartTitle')} value={appearance.title ?? ''} onChange={(event) => updateAppearance({ title: event.target.value })} size="small" />
        </Form.Item>
        <Form.Item label={t('chartSubtitle')}>
          <Input aria-label={t('chartSubtitle')} value={appearance.subtitle ?? ''} onChange={(event) => updateAppearance({ subtitle: event.target.value })} size="small" />
        </Form.Item>
        <Form.Item label={t('chartShowLegend')}>
          <Switch aria-label={t('chartShowLegend')} size="small" checked={appearance.showLegend ?? true} onChange={(checked) => updateAppearance({ showLegend: checked })} />
        </Form.Item>
        <Form.Item label={t('chartLegendPosition')}>
          <Select
            aria-label={t('chartLegendPosition')}
            value={appearance.legendPosition ?? 'bottom'}
            onChange={(value) => updateAppearance({ legendPosition: value })}
            size="small"
            options={['top', 'right', 'bottom', 'left'].map(value => ({ value, label: t(value as 'top' | 'right' | 'bottom' | 'left') }))}
          />
        </Form.Item>
        <Form.Item label={t('chartShowAxes')}>
          <Switch aria-label={t('chartShowAxes')} size="small" checked={appearance.showAxes ?? true} onChange={(checked) => updateAppearance({ showAxes: checked })} disabled={chart.chartType === 'pie'} />
        </Form.Item>
        <Form.Item label={t('chartShowGrid')}>
          <Switch aria-label={t('chartShowGrid')} size="small" checked={appearance.showGrid ?? true} onChange={(checked) => updateAppearance({ showGrid: checked })} disabled={chart.chartType === 'pie'} />
        </Form.Item>
        <Form.Item label={t('chartShowLabels')}>
          <Switch aria-label={t('chartShowLabels')} size="small" checked={appearance.showLabels ?? false} onChange={(checked) => updateAppearance({ showLabels: checked })} />
        </Form.Item>
        <Form.Item label={t('chartAxisTitleX')}>
          <Input aria-label={t('chartAxisTitleX')} value={appearance.axisTitleX ?? ''} onChange={(event) => updateAppearance({ axisTitleX: event.target.value })} size="small" disabled={chart.chartType === 'pie'} />
        </Form.Item>
        <Form.Item label={t('chartAxisTitleY')}>
          <Input aria-label={t('chartAxisTitleY')} value={appearance.axisTitleY ?? ''} onChange={(event) => updateAppearance({ axisTitleY: event.target.value })} size="small" disabled={chart.chartType === 'pie'} />
        </Form.Item>
        <Form.Item label={t('chartPalette')}>
          <Input
            aria-label={t('chartPalette')}
            value={(appearance.palette ?? []).join(',')}
            onChange={(event) => updateAppearance({ palette: event.target.value.split(',').map(item => item.trim()).filter(Boolean) })}
            size="small"
            placeholder={t('chartPalettePlaceholder')}
          />
        </Form.Item>
        <Form.Item label={t('chartEmptyMessage')}>
          <Input aria-label={t('chartEmptyMessage')} value={chart.emptyMessage ?? ''} onChange={(event) => onChange('emptyMessage', event.target.value)} size="small" />
        </Form.Item>
      </Form>
    </Space>
  );

  function chartExpressionItem(field: keyof ChartComponent['binding'], label: string, required = true) {
    return (
      <Form.Item label={label}>
        <Input
          aria-label={label}
          value={String(binding[field] ?? '')}
          onChange={(event) => updateBinding({ [field]: event.target.value })}
          size="small"
          list={expressionListId}
          placeholder={required ? '{Field}' : t('expressionLikePlaceholder')}
        />
      </Form.Item>
    );
  }
};

const ExpressionFieldButton: React.FC<{
  label: string;
  onClick: () => void;
  t: ReturnType<typeof createPropertyT>;
}> = ({ label, onClick, t }) => {
  const title = t('openExpressionEditorFor', { field: label });
  return (
    <Button
      aria-label={title}
      title={title}
      icon={<EditOutlined />}
      onClick={onClick}
      style={{ width: 32 }}
    />
  );
};

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

function buildDictionaryEventItems(template: ReportTemplate): EventTreeItem[] {
  return template.dataSources.map(source => ({
    key: source.id,
    title: source.name || source.id,
    children: (source.schema ?? source.fields ?? []).map(field => ({
      key: `${source.id}.${field.name}`,
      title: field.label || field.name,
    })),
  }));
}

function buildComponentEventItems(template: ReportTemplate): EventTreeItem[] {
  return template.pages.map(page => ({
    key: page.id,
    title: page.id,
    children: page.bands.map(band => ({
      key: band.id,
      title: band.name || band.id,
      children: band.components.map(component => ({
        key: component.name || component.id,
        title: component.name || component.id,
      })),
    })),
  }));
}

function createDataSourceOptions(
  sourceNames: string[],
  dataSources: ReportTemplate['dataSources'],
): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [];
  const seen = new Set<string>();
  const push = (value: string, label: string) => {
    const key = `${value}::${label}`;
    if (seen.has(key)) return;
    seen.add(key);
    options.push({ value, label });
  };

  for (const source of dataSources) {
    const label = source.parentSourceId
      ? `${source.name || source.id.split('.').at(-1) || source.id} (${source.id})`
      : (source.name || source.id);
    push(source.id, label);
    if (!source.parentSourceId && source.name && source.name !== source.id) {
      push(source.name, source.name);
    }
  }

  for (const sourceName of sourceNames) {
    push(sourceName, sourceName);
  }

  return options;
}

function arrayPathForDataSource(
  dataSourceId: string,
  dataSources: ReportTemplate['dataSources'],
): string | undefined {
  const source = dataSources.find(item => item.id === dataSourceId || item.name === dataSourceId);
  if (!source) return undefined;
  if (!source.parentSourceId) return undefined;

  const parent = dataSources.find(item => item.id === source.parentSourceId);
  const parentPath = parent?.path ?? parent?.id ?? source.parentSourceId;
  const sourcePath = source.path ?? source.id;
  if (sourcePath.startsWith(`${parentPath}.`)) {
    return sourcePath.slice(parentPath.length + 1);
  }
  return sourcePath.split('.').at(-1);
}

function fieldExpression(field: { name: string } | undefined): string {
  return field?.name ? `{${field.name}}` : '';
}

function defaultChartVariant(type: ChartType): ChartVariant {
  if (type === 'point') return 'scatter';
  return 'default';
}

function chartTypeOptions(t: ReturnType<typeof createPropertyT>): Array<{ value: ChartType; label: string }> {
  return [
    { value: 'bar', label: t('chartTypeBar') },
    { value: 'line', label: t('chartTypeLine') },
    { value: 'area', label: t('chartTypeArea') },
    { value: 'pie', label: t('chartTypePie') },
    { value: 'point', label: t('chartTypePoint') },
  ];
}

function chartVariantOptions(type: ChartType, t: ReturnType<typeof createPropertyT>): Array<{ value: ChartVariant; label: string }> {
  if (type === 'point') {
    return [{ value: 'scatter', label: t('chartVariantScatter') }];
  }
  if (type === 'line') {
    return [
      { value: 'default', label: t('chartVariantDefault') },
      { value: 'smooth', label: t('chartVariantSmooth') },
      { value: 'step', label: t('chartVariantStep') },
    ];
  }
  if (type === 'bar') {
    return [
      { value: 'default', label: t('chartVariantDefault') },
      { value: 'grouped', label: t('chartVariantGrouped') },
      { value: 'stacked', label: t('chartVariantStacked') },
      { value: 'horizontal', label: t('chartVariantHorizontal') },
    ];
  }
  if (type === 'area') {
    return [
      { value: 'default', label: t('chartVariantDefault') },
      { value: 'smooth', label: t('chartVariantSmooth') },
      { value: 'stacked', label: t('chartVariantStacked') },
    ];
  }
  return [
    { value: 'default', label: t('chartVariantDefault') },
    { value: 'donut', label: t('chartVariantDonut') },
  ];
}

function chartAggregateOptions(t: ReturnType<typeof createPropertyT>): Array<{ value: ChartAggregateMode; label: string }> {
  return [
    { value: 'none', label: t('chartAggregateNone') },
    { value: 'sum', label: t('chartAggregateSum') },
    { value: 'avg', label: t('chartAggregateAvg') },
    { value: 'count', label: t('chartAggregateCount') },
    { value: 'min', label: t('chartAggregateMin') },
    { value: 'max', label: t('chartAggregateMax') },
  ];
}

const propertyEditorMessages = {
  'zh-CN': {
    selectComponent: '选择组件以编辑属性',
    selectedComponents: '已选择 {count} 个组件',
    general: '基本信息',
    position: '位置与尺寸',
    behavior: '行为',
    text: '文本内容',
    font: '字体',
    border: '边框',
    appearance: '外观',
    table: '表格',
    line: '线条属性',
    shape: '形状属性',
    pageNumber: '页码属性',
    dateTime: '日期时间属性',
    chart: '图表属性',
    chartType: '图表类型',
    chartVariant: '图表变种',
    chartBinding: '数据绑定',
    chartDataSource: '数据源',
    chartArrayPath: '数组路径',
    chartCategoryField: '类目字段',
    chartValueField: '数值字段',
    chartXField: 'X 轴字段',
    chartYField: 'Y 轴字段',
    chartSeriesField: '系列字段',
    chartLabelField: '标签字段',
    chartAggregate: '聚合',
    chartAggregateNone: '不聚合',
    chartAggregateSum: '求和',
    chartAggregateAvg: '平均值',
    chartAggregateCount: '计数',
    chartAggregateMin: '最小值',
    chartAggregateMax: '最大值',
    chartAppearance: '图表外观',
    chartTitle: '图表标题',
    chartSubtitle: '副标题',
    chartShowLegend: '显示图例',
    chartLegendPosition: '图例位置',
    chartShowAxes: '显示坐标轴',
    chartShowGrid: '显示网格',
    chartShowLabels: '显示标签',
    chartAxisTitleX: 'X 轴标题',
    chartAxisTitleY: 'Y 轴标题',
    chartPalette: '调色板',
    chartPalettePlaceholder: '使用逗号分隔，例如 #2f6fed,#16a34a',
    chartEmptyMessage: '空数据提示',
    chartTypePoint: '点图',
    chartTypeLine: '折线图',
    chartTypeBar: '柱状图',
    chartTypeArea: '面积图',
    chartTypePie: '饼图',
    chartVariantDefault: '默认',
    chartVariantSmooth: '平滑',
    chartVariantStep: '阶梯',
    chartVariantGrouped: '分组',
    chartVariantStacked: '堆叠',
    chartVariantHorizontal: '横向',
    chartVariantDonut: '环形',
    chartVariantScatter: '散点',
    name: '名称',
    type: '类型',
    componentName: '组件名称',
    width: '宽度',
    height: '高度',
    visibleExpression: '可见表达式',
    visibleExpressionPlaceholder: '留空表示始终可见，例如 {Orders.ShowTitle}',
    enabledExpression: '启用表达式',
    enabledExpressionPlaceholder: '留空表示始终启用，例如 {Orders.EnableTitle}',
    printableExpression: '可打印表达式',
    printableExpressionPlaceholder: '留空表示始终打印，例如 {Orders.PrintTitle}',
    textContent: '文本内容',
    textContentPlaceholder: '普通文本或 {DataSource.Field}',
    openExpressionEditor: '打开表达式编辑器',
    openExpressionEditorFor: '打开表达式编辑器：{field}',
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
    richTextContent: '富文本内容',
    localTemplateKey: '本地模板键/名称',
    localTemplateKeyPlaceholder: '例如：invoice-detail',
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
    foregroundColor: '前景色',
    foregroundColorPicker: '前景色选择器',
    padding: '内边距',
    paddingTop: '内边距上',
    paddingRight: '内边距右',
    paddingBottom: '内边距下',
    paddingLeft: '内边距左',
    tableDataSource: '表格数据源',
    tableBindingMode: '绑定模式',
    tableBindingFixed: '固定',
    tableBindingDetail: '明细',
    tableBindingDataSourceId: '绑定数组属性',
    tableBindingArrayPath: '数组路径',
    tableBindingArrayPathPlaceholder: '例如：Items 或 Customer.Orders',
    dataSource: '数据源',
    chooseDataSource: '选择数据源',
    columnCount: '列数',
    rowCount: '行数',
    headerRowsCount: '表头行数',
    footerRowsCount: '表尾行数',
    headerHeight: '表头高度',
    rowHeight: '明细行高',
    tableColumns: '列定义',
    tableColumn: '第 {index} 列',
    tableColumnHeader: '标题',
    tableColumnField: '字段',
    tableColumnWidth: '宽度',
    tableColumnType: '类型',
    tableColumnHeaderAria: '第 {index} 列标题',
    tableColumnFieldAria: '第 {index} 列字段',
    tableColumnWidthAria: '第 {index} 列宽度',
    tableColumnTypeAria: '第 {index} 列类型',
    tableCellTypeText: '文本',
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
    pageNumberFormatFraction: '第 1 / N 页',
    pageNumberFormatPageOf: '第 1 页，共 N 页',
    pageNumberFormatPageOnly: '第 1 页',
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
    behavior: 'Behavior',
    text: 'Text Content',
    font: 'Font',
    border: 'Border',
    appearance: 'Appearance',
    table: 'Table',
    line: 'Line Properties',
    shape: 'Shape Properties',
    pageNumber: 'Page Number Properties',
    dateTime: 'Date/Time Properties',
    chart: 'Chart Properties',
    chartType: 'Chart type',
    chartVariant: 'Variant',
    chartBinding: 'Data binding',
    chartDataSource: 'Data source',
    chartArrayPath: 'Array path',
    chartCategoryField: 'Category field',
    chartValueField: 'Value field',
    chartXField: 'X field',
    chartYField: 'Y field',
    chartSeriesField: 'Series field',
    chartLabelField: 'Label field',
    chartAggregate: 'Aggregate',
    chartAggregateNone: 'None',
    chartAggregateSum: 'Sum',
    chartAggregateAvg: 'Average',
    chartAggregateCount: 'Count',
    chartAggregateMin: 'Min',
    chartAggregateMax: 'Max',
    chartAppearance: 'Chart appearance',
    chartTitle: 'Chart title',
    chartSubtitle: 'Subtitle',
    chartShowLegend: 'Show legend',
    chartLegendPosition: 'Legend position',
    chartShowAxes: 'Show axes',
    chartShowGrid: 'Show grid',
    chartShowLabels: 'Show labels',
    chartAxisTitleX: 'X axis title',
    chartAxisTitleY: 'Y axis title',
    chartPalette: 'Palette',
    chartPalettePlaceholder: 'Comma separated, for example #2f6fed,#16a34a',
    chartEmptyMessage: 'Empty message',
    chartTypePoint: 'Point',
    chartTypeLine: 'Line',
    chartTypeBar: 'Bar',
    chartTypeArea: 'Area',
    chartTypePie: 'Pie',
    chartVariantDefault: 'Default',
    chartVariantSmooth: 'Smooth',
    chartVariantStep: 'Step',
    chartVariantGrouped: 'Grouped',
    chartVariantStacked: 'Stacked',
    chartVariantHorizontal: 'Horizontal',
    chartVariantDonut: 'Donut',
    chartVariantScatter: 'Scatter',
    name: 'Name',
    type: 'Type',
    componentName: 'Component name',
    width: 'Width',
    height: 'Height',
    visibleExpression: 'Visible expression',
    visibleExpressionPlaceholder: 'Leave empty to always show, for example {Orders.ShowTitle}',
    enabledExpression: 'Enabled expression',
    enabledExpressionPlaceholder: 'Leave empty to always enable, for example {Orders.EnableTitle}',
    printableExpression: 'Printable expression',
    printableExpressionPlaceholder: 'Leave empty to always print, for example {Orders.PrintTitle}',
    textContent: 'Text content',
    textContentPlaceholder: 'Plain text or {DataSource.Field}',
    openExpressionEditor: 'Open expression editor',
    openExpressionEditorFor: 'Open expression editor: {field}',
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
    richTextContent: 'Rich Text Content',
    localTemplateKey: 'Local template key/name',
    localTemplateKeyPlaceholder: 'For example: invoice-detail',
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
    foregroundColor: 'Foreground color',
    foregroundColorPicker: 'Foreground color picker',
    padding: 'Padding',
    paddingTop: 'Padding top',
    paddingRight: 'Padding right',
    paddingBottom: 'Padding bottom',
    paddingLeft: 'Padding left',
    tableDataSource: 'Table data source',
    tableBindingMode: 'Binding mode',
    tableBindingFixed: 'Fixed',
    tableBindingDetail: 'Detail',
    tableBindingDataSourceId: 'Bound array property',
    tableBindingArrayPath: 'Array path',
    tableBindingArrayPathPlaceholder: 'For example: Items or Customer.Orders',
    dataSource: 'Data source',
    chooseDataSource: 'Select data source',
    columnCount: 'Columns',
    rowCount: 'Rows',
    headerRowsCount: 'Header rows',
    footerRowsCount: 'Footer rows',
    headerHeight: 'Header height',
    rowHeight: 'Detail row height',
    tableColumns: 'Columns',
    tableColumn: 'Column {index}',
    tableColumnHeader: 'Header',
    tableColumnField: 'Field',
    tableColumnWidth: 'Width',
    tableColumnType: 'Type',
    tableColumnHeaderAria: 'Column {index} header',
    tableColumnFieldAria: 'Column {index} field',
    tableColumnWidthAria: 'Column {index} width',
    tableColumnTypeAria: 'Column {index} type',
    tableCellTypeText: 'Text',
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
    pageNumberFormatFraction: '1 / N',
    pageNumberFormatPageOf: 'Page 1 of N',
    pageNumberFormatPageOnly: 'Page 1',
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
  dataSourceDefinitions: DataSource[];
  t: ReturnType<typeof createPropertyT>;
  onChange: (updates: {
    rowCount?: number;
    columnCount?: number;
    headerRowsCount?: number;
    footerRowsCount?: number;
    headerHeight?: number;
    rowHeight?: number;
    canBreak?: boolean;
    showBorder?: boolean;
    dataSource?: string;
    binding?: TableComponent['binding'];
    columns?: TableColumn[];
  }) => void;
}> = ({ table, dataSources, dataSourceDefinitions, onChange, t }) => {
  const binding = table.binding ?? { mode: 'fixed' as const };
  const source = dataSourceDefinitions.find(item => (
    item.id === binding.dataSourceId
    || item.name === binding.dataSourceId
    || item.name === table.dataSource
    || item.id === table.dataSource
  ));
  const dataSourceOptions = createDataSourceOptions(dataSources, dataSourceDefinitions);
  const fieldOptions = (source?.schema ?? source?.fields ?? []).map(field => ({
    value: field.name,
    label: field.label || field.name,
  }));
  const cellTypeOptions: Array<{ value: TableColumn['cellType']; label: string }> = [
    { value: 'text', label: t('tableCellTypeText') },
  ];
  const updateColumn = (index: number, updates: Partial<TableColumn>) => {
    onChange({
      columns: table.columns.map((column, columnIndex) => (
        columnIndex === index ? { ...column, ...updates } : column
      )),
    });
  };
  const updateBinding = (updates: Partial<NonNullable<TableComponent['binding']>>) => {
    const next = {
      ...binding,
      ...updates,
      mode: updates.mode ?? binding.mode ?? 'fixed',
    };
    onChange({
      binding: {
        mode: next.mode,
        ...(next.dataSourceId ? { dataSourceId: next.dataSourceId } : {}),
        ...(next.arrayPath ? { arrayPath: next.arrayPath } : {}),
      },
    });
  };

  return (
    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
        <Form.Item label={t('tableBindingMode')}>
          <Segmented
            aria-label={t('tableBindingMode')}
            block
            value={binding.mode ?? 'fixed'}
            options={[
              { value: 'fixed', label: t('tableBindingFixed') },
              { value: 'detail', label: t('tableBindingDetail') },
            ]}
            onChange={(value) => updateBinding({ mode: value as NonNullable<TableComponent['binding']>['mode'] })}
          />
        </Form.Item>
        <Form.Item label={t('tableBindingDataSourceId')}>
          <Select
            aria-label={t('tableBindingDataSourceId')}
            value={binding.dataSourceId || undefined}
            onChange={(value) => updateBinding({
              dataSourceId: value,
              arrayPath: value ? arrayPathForDataSource(value, dataSourceDefinitions) : binding.arrayPath,
            })}
            size="small"
            style={{ width: '100%' }}
            allowClear
            disabled={(binding.mode ?? 'fixed') !== 'detail'}
            placeholder={t('chooseDataSource')}
            options={dataSourceOptions}
          />
        </Form.Item>
        <Form.Item label={t('tableBindingArrayPath')}>
          <Input
            aria-label={t('tableBindingArrayPath')}
            value={binding.arrayPath ?? ''}
            onChange={(event) => updateBinding({ arrayPath: event.target.value })}
            size="small"
            disabled={(binding.mode ?? 'fixed') !== 'detail'}
            placeholder={t('tableBindingArrayPathPlaceholder')}
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
        <Form.Item label={t('headerHeight')}>
          <InputNumber
            aria-label={t('headerHeight')}
            value={table.headerHeight}
            onChange={(value) => onChange({ headerHeight: value ?? table.headerHeight })}
            size="small"
            style={{ width: '100%' }}
            min={0.1}
            step={0.1}
          />
        </Form.Item>
        <Form.Item label={t('rowHeight')}>
          <InputNumber
            aria-label={t('rowHeight')}
            value={table.rowHeight}
            onChange={(value) => onChange({ rowHeight: value ?? table.rowHeight })}
            size="small"
            style={{ width: '100%' }}
            min={0.1}
            step={0.1}
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

      <Divider style={{ margin: '4px 0' }} />
      <Typography.Text strong>{t('tableColumns')}</Typography.Text>
      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
        {table.columns.map((column, index) => (
          <div key={column.id} style={{ border: '1px solid #f0f0f0', borderRadius: 4, padding: 8 }}>
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
              {t('tableColumn', { index: index + 1 })}
            </Typography.Text>
            <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
              <Form.Item label={t('tableColumnHeader')}>
                <Input
                  aria-label={t('tableColumnHeaderAria', { index: index + 1 })}
                  value={column.header}
                  onChange={(event) => updateColumn(index, { header: event.target.value })}
                  size="small"
                />
              </Form.Item>
              <Form.Item label={t('tableColumnField')}>
                <Input
                  aria-label={t('tableColumnFieldAria', { index: index + 1 })}
                  value={column.field}
                  onChange={(event) => updateColumn(index, { field: event.target.value })}
                  size="small"
                  list={`table-column-fields-${column.id}`}
                />
                <datalist id={`table-column-fields-${column.id}`}>
                  {fieldOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </datalist>
              </Form.Item>
              <Form.Item label={t('tableColumnWidth')}>
                <InputNumber
                  aria-label={t('tableColumnWidthAria', { index: index + 1 })}
                  value={column.width}
                  onChange={(value) => updateColumn(index, { width: value ?? column.width })}
                  size="small"
                  style={{ width: '100%' }}
                  min={0.1}
                  step={0.1}
                />
              </Form.Item>
              <Form.Item label={t('tableColumnType')}>
                <Select
                  aria-label={t('tableColumnTypeAria', { index: index + 1 })}
                  value={column.cellType}
                  onChange={(value) => updateColumn(index, { cellType: value })}
                  size="small"
                  style={{ width: '100%' }}
                  options={cellTypeOptions}
                />
              </Form.Item>
            </Form>
          </div>
        ))}
      </Space>
    </Space>
  );
};
