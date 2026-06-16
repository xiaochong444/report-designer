import React, { useMemo, useState } from 'react';
import { Form, Input, InputNumber, Select, Switch, ColorPicker, Collapse, Space, Button, Divider, Typography, Segmented, Tooltip } from 'antd';
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BoldOutlined,
  EditOutlined,
  DisconnectOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  UnderlineOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useDesignerStore } from '../store/designer-store';
import { getReportFontOptions, supportsComponentStyle } from '@report-designer/core';
import type { BorderConfig, ChartComponent, DataSource, Padding, ReportComponent, ReportTemplate, TableComponent, TextFormatConfig } from '@report-designer/core';
import { formatUnitValue, getUnitStep, parseUnitValue } from '../page-settings';
import { ExpressionEditor } from './ExpressionEditor';
import { normalizeTable } from '../table/table-structure';
import { isTextStylePropertyLocked } from '../text-style-application';
import { TextFormatEditor } from './TextFormatEditor';
import { useDesignerI18n, type DesignerLocale } from '../i18n';
import { EventEditorDialog, type EventTreeItem } from './events/EventEditorDialog';
import { buildEventEditorDataContext } from './events/event-editor-utils';
import type { ExpressionCatalogExtensions } from '../expression/expression-catalog';
import { BorderEditor, PaddingEditor } from './properties/BoxStyleEditors';
import { FontEditor } from './properties/FontEditor';
import { BARCODE_FORMATS, QR_CODE_FORMATS } from '@report-designer/viewer';
import { isComponentNameAvailable, normalizeComponentName } from '../report-structure';
import { createArrayPathOptions } from '../data-source-paths';
import { buildChartPropertyItems } from './chart/ChartPropertyPanel';

const NO_CONDITIONAL_FORMAT = '__none__';
const EMPTY_DATA_PATHS: string[] = [];

export const PropertyEditor: React.FC<{ expressionExtensions?: ExpressionCatalogExtensions }> = ({ expressionExtensions }) => {
  const { locale, t: globalT } = useDesignerI18n();
  const t = React.useMemo(() => createPropertyT(locale), [locale]);
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const selectedComponentIds = useDesignerStore(s => s.selectedComponentIds);
  const updateComponent = useDesignerStore(s => s.updateComponent);
  const updateSelectedTable = useDesignerStore(s => s.updateSelectedTable);
  const applySelectedStyle = useDesignerStore(s => s.applySelectedStyle);
  const unbindSelectedStyle = useDesignerStore(s => s.unbindSelectedStyle);
  const applySelectedConditionalFormat = useDesignerStore(s => s.applySelectedConditionalFormat);
  const replaceComponentEvents = useDesignerStore(s => s.replaceComponentEvents);
  const openConditionalFormatLibrary = useDesignerStore(s => s.openConditionalFormatLibrary);
  const reportUnit = useDesignerStore(s => s.reportUnit);
  const pendingEventEditorTarget = useDesignerStore(s => s.pendingEventEditorTarget);
  const consumeEventEditorTarget = useDesignerStore(s => s.consumeEventEditorTarget);
  const runtimeDataSources = useDesignerStore(s => s.dataSources);
  const [eventEditorDataTemplate, setEventEditorDataTemplate] = React.useState<ReportTemplate | null>(null);

  const { component, bandId } = useMemo(() => {
    if (selectedComponentIds.length !== 1) return { component: null, bandId: null };
    const page = template.pages.find(p => p.id === currentPageId);
    if (!page) return { component: null, bandId: null };
    for (const band of page.bands) {
      const comp = findComponentInTree(band.components, selectedComponentIds[0]);
      if (comp) return { component: comp, bandId: band.id };
    }
    return { component: null, bandId: null };
  }, [template, currentPageId, selectedComponentIds]);
  const componentId = component?.id;

  const [expressionTarget, setExpressionTarget] = useState<{ field: string; label: string } | null>(null);
  const [eventEditorOpen, setEventEditorOpen] = useState(false);
  const [eventEditorTarget, setEventEditorTarget] = useState<typeof pendingEventEditorTarget>(null);
  const [componentNameError, setComponentNameError] = useState<string | null>(null);
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

  React.useEffect(() => {
    setComponentNameError(null);
  }, [component?.id]);

  React.useEffect(() => {
    if (!eventEditorOpen) return;
    setEventEditorDataTemplate(template);
  }, [eventEditorOpen, template]);

  const dictionaryItems = React.useMemo(
    () => (eventEditorOpen && eventEditorDataTemplate ? buildDictionaryEventItems(eventEditorDataTemplate) : []),
    [eventEditorDataTemplate, eventEditorOpen],
  );
  const componentItems = React.useMemo(
    () => (eventEditorOpen && eventEditorDataTemplate ? buildComponentEventItems(eventEditorDataTemplate) : []),
    [eventEditorDataTemplate, eventEditorOpen],
  );
  const currentPage = React.useMemo(
    () => template.pages.find(p => p.id === currentPageId),
    [currentPageId, template.pages],
  );
  const bandDataPathSignature = React.useMemo(() => currentPage?.bands.map(b => b.dataBand?.dataSourceId ?? b.dataSource ?? '').join('|') ?? '', [currentPage?.bands]);
  const bandDataPaths = React.useMemo(() => currentPage?.bands.reduce<string[]>((acc, b) => {
    const dataSourceId = b.dataBand?.dataSourceId ?? b.dataSource;
    if (dataSourceId && !acc.includes(dataSourceId)) acc.push(dataSourceId);
    return acc;
  }, []) ?? EMPTY_DATA_PATHS, [bandDataPathSignature]);
  const dataSourceOptions = React.useMemo(
    () => createArrayPathOptions(template.dataSources, runtimeDataSources, bandDataPaths),
    [template.dataSources, runtimeDataSources, bandDataPaths],
  );
  const reportFontOptions = React.useMemo(() => getReportFontOptions(template.fonts), [template.fonts]);

  const handleChange = React.useCallback((field: string, value: any) => {
    if (!componentId || !bandId || !currentPageId) return;
    const currentBand = useDesignerStore.getState().template.pages
      .find(p => p.id === currentPageId)
      ?.bands.find(b => b.id === bandId);
    const currentComponent = currentBand ? findComponentInTree(currentBand.components, componentId) : null;
    updateComponent(currentPageId, bandId, componentId, { [field]: value }, { [field]: (currentComponent as any)?.[field] });
  }, [bandId, componentId, currentPageId, updateComponent]);

  const handleChangeMany = React.useCallback((updates: Record<string, any>) => {
    if (!componentId || !bandId || !currentPageId) return;
    const currentBand = useDesignerStore.getState().template.pages
      .find(p => p.id === currentPageId)
      ?.bands.find(b => b.id === bandId);
    const currentComponent = currentBand ? findComponentInTree(currentBand.components, componentId) : null;
    const previous = Object.fromEntries(
      Object.keys(updates).map(field => [field, (currentComponent as any)?.[field]]),
    );
    updateComponent(currentPageId, bandId, componentId, updates, previous);
  }, [bandId, componentId, currentPageId, updateComponent]);

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

  const handleNameChange = (value: string) => {
    const name = normalizeComponentName(value);
    if (!name) {
      setComponentNameError(t('componentNameRequired'));
      return;
    }

    if (name && !isComponentNameAvailable(template, name, component.id)) {
      setComponentNameError(t('componentNameDuplicate'));
      return;
    }

    setComponentNameError(null);
    handleChange('name', value);
  };

  const openFieldExpressionEditor = (field: string, label: string) => {
    setExpressionTarget({ field, label });
  };

  // ---- Border helpers ----
  const border = normalizeOptionalBorder(comp.border as BorderConfig | undefined);

  // ---- Font helpers ----
  const font = comp.font ?? { family: '', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' };
  const handleFontField = (field: string, value: any) => {
    handleChange('font', { ...font, [field]: value });
  };

  const format = (comp.format ?? { type: 'none' }) as TextFormatConfig;

  // ---- Padding helpers ----
  const padding = normalizeOptionalPadding(comp.padding as Padding | undefined);

  const supportsSharedStyle = supportsComponentStyle(component);
  const supportsFontProperties = ['text', 'barcode', 'checkbox', 'pagenumber', 'datetime', 'table'].includes(component.type);
  const supportsBorderProperties = ['text', 'image', 'chart', 'barcode', 'qrcode', 'checkbox', 'panel', 'pagenumber', 'datetime', 'table'].includes(component.type);
  const supportsAppearanceProperties = ['text', 'image', 'chart', 'barcode', 'qrcode', 'checkbox', 'richtext', 'panel', 'subreport', 'pagenumber', 'datetime', 'table'].includes(component.type);
  const supportsForegroundColor = component.type === 'barcode' || component.type === 'qrcode' || component.type === 'checkbox';
  const isTextStyleLocked = (pathOrPrefix: string) => (
    supportsSharedStyle ? isTextStylePropertyLocked(component as { style?: string }, pathOrPrefix) : false
  );
  const backgroundLocked = isTextStyleLocked('backgroundColor');

  return (
    <div style={{ padding: 8 }}>
      <Collapse
        defaultActiveKey={['general', 'position', 'behavior', 'text', 'font', 'border', 'appearance', 'events', 'table', 'line', 'shape', 'pagenumber', 'datetime', 'chartBasic', 'chartData']}
        size="small"
        items={[
          // ---- 基本信息 ----
          {
            key: 'general',
            label: t('general'),
            children: (
              <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item
                  label={t('name')}
                  validateStatus={componentNameError ? 'error' : undefined}
                  help={componentNameError}
                >
                  <Input
                    aria-label={t('name')}
                    value={comp.name || ''}
                    onChange={(e) => handleNameChange(e.target.value)}
                    size="small"
                    placeholder={t('componentName')}
                  />
                </Form.Item>
                <Form.Item label={t('type')}>
                  <Input aria-label={t('type')} value={comp.type} size="small" disabled />
                </Form.Item>
                {supportsSharedStyle ? (
                  <Form.Item label={t('textStyle')}>
                    <Space.Compact data-testid="text-style-select-row" style={{ width: '100%', minWidth: 0 }}>
                      <Select
                        data-testid="text-style-select"
                        aria-label={t('textStyle')}
                        value={comp.style}
                        onChange={(value) => (value ? applySelectedStyle(value) : unbindSelectedStyle())}
                        onClear={() => unbindSelectedStyle()}
                        size="small"
                        style={{ flex: 1, width: '100%', minWidth: 0 }}
                        allowClear
                        virtual={false}
                        placeholder={t('chooseStyle')}
                        options={template.styles.map(style => ({ value: style.id, label: style.name }))}
                      />
                      <Tooltip title={t('unbindStyle')}>
                        <Button
                          aria-label={t('unbindStyle')}
                          icon={<DisconnectOutlined />}
                          onClick={unbindSelectedStyle}
                          disabled={!comp.style}
                          size="small"
                          style={{ width: 32, flex: '0 0 32px' }}
                        />
                      </Tooltip>
                    </Space.Compact>
                  </Form.Item>
                ) : null}
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

          // ---- 文本内容（图表不走此组，由下方 chartItems spread）----
          component.type !== 'chart' ? {
          key: 'text',
          label: t('text'),
          children: component.type === 'text' ? (
              <Form size="small" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
                <Form.Item label={t('textContent')}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      aria-label={t('textContent')}
                      value={comp.text || ''}
                      onChange={(e) => handleChange('text', e.target.value)}
                      size="small"
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
                <Form.Item label={t('conditionalFormat')}>
                  <Space.Compact data-testid="conditional-format-select-row" style={{ width: '100%', minWidth: 0 }}>
                    <Select
                      data-testid="conditional-format-select"
                      aria-label={t('conditionalFormat')}
                      value={comp.conditionalFormat ?? undefined}
                      onChange={(value) => applySelectedConditionalFormat(value === NO_CONDITIONAL_FORMAT ? undefined : value)}
                      size="small"
                      style={{ flex: 1, width: '100%', minWidth: 0 }}
                      virtual={false}
                      placeholder={t('chooseConditionalFormat')}
                      options={[
                        { value: NO_CONDITIONAL_FORMAT, label: t('none') },
                        ...template.conditionalFormats.map(format => ({ value: format.id, label: format.name })),
                      ]}
                    />
                    <Tooltip title={t('manage')}>
                      <Button
                        aria-label={t('manage')}
                        icon={<EditOutlined />}
                        onClick={openConditionalFormatLibrary}
                        size="small"
                        style={{ width: 32, flex: '0 0 32px' }}
                      />
                    </Tooltip>
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
                onChangeMany={handleChangeMany}
                onOpenExpressionEditor={openFieldExpressionEditor}
                t={t}
                dataSourceOptions={dataSourceOptions}
                dataSourceDefinitions={template.dataSources}
              />
            ),
          } : null,

          // ---- 图表属性（扁平展开，取消原 chart 包装层）----
          ...(component.type === 'chart' ? buildChartPropertyItems({
            chart: comp as ChartComponent,
            dataSourceOptions,
            dataSourceDefinitions: template.dataSources,
            reportFontOptions,
            onChange: handleChange,
            onChangeMany: handleChangeMany,
            t,
          }) : []),

          // ---- 字体 ----
          supportsFontProperties ? {
            key: 'font',
            label: t('font'),
            children: (
              <FontEditor
                value={font}
                onChange={(next) => handleChange('font', next)}
                reportFontOptions={reportFontOptions}
                sizeRange={[6, 72]}
                disabled={(field) => isTextStyleLocked(`font.${field}`)}
                labels={{
                  fontFamily: t('fontFamily'),
                  fontSize: t('fontSize'),
                  textColor: t('textColor'),
                  bold: t('bold'),
                  italic: t('italic'),
                  underline: t('underline'),
                  strike: t('strike'),
                }}
              />
            ),
          } : null,

          // ---- 边框 ----
          supportsBorderProperties ? {
            key: 'border',
            label: t('border'),
            children: (
              <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <BorderEditor
                  value={border}
                  labels={propertyBorderLabels(t)}
                  onChange={nextBorder => handleChange('border', nextBorder)}
                  disabled={isTextStyleLocked}
                  formatWidth={value => formatUnitValue(value, reportUnit)}
                  parseWidth={(value, fallback) => parseUnitValue(value, reportUnit, fallback)}
                  minWidth={formatUnitValue(0.1, reportUnit)}
                  maxWidth={formatUnitValue(5, reportUnit)}
                  step={fineUnitStep}
                />
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
                    onClear={() => handleChange('backgroundColor', undefined)}
                    allowClear
                    disabled={backgroundLocked}
                  />
                </Form.Item>
                <Divider style={{ margin: '4px 0' }} />
                <PaddingEditor
                  value={padding}
                  labels={propertyPaddingLabels(t)}
                  onChange={nextPadding => handleChange('padding', nextPadding)}
                  disabled={isTextStyleLocked}
                  formatValue={value => formatUnitValue(value, reportUnit)}
                  parseValue={(value, fallback) => parseUnitValue(value, reportUnit, fallback)}
                  min={0}
                  step={unitStep}
                />
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
        expressionExtensions={expressionExtensions}
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
  onChangeMany: (updates: Record<string, any>) => void;
  onOpenExpressionEditor: (field: string, label: string) => void;
  t: ReturnType<typeof createPropertyT>;
  dataSourceOptions: Array<{ value: string; label: string }>;
  dataSourceDefinitions: DataSource[];
}> = ({ component, comp, dataSourceDefinitions, dataSourceOptions, onChange, onChangeMany, onOpenExpressionEditor, t }) => {
  switch (component.type) {
    case 'chart':
      // 图表属性由主组件通过 buildChartPropertyItems 直接展开到外层 Collapse，
      // 不再走 text 包装组，避免折叠面板嵌套。
      return null;
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
              options={BARCODE_FORMATS.map(value => ({ value, label: value }))}
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
    case 'qrcode':
      return (
        <Form size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
          <Form.Item label={t('qrcodeContent')}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                aria-label={t('qrcodeContent')}
                value={comp.value || ''}
                onChange={(event) => onChange('value', event.target.value)}
                size="small"
                placeholder={t('expressionLikePlaceholder')}
              />
              <ExpressionFieldButton
                label={t('qrcodeContent')}
                t={t}
                onClick={() => onOpenExpressionEditor('value', t('qrcodeContent'))}
              />
            </Space.Compact>
          </Form.Item>
          <Form.Item label={t('qrcodeFormat')}>
            <Select
              aria-label={t('qrcodeFormat')}
              value={comp.format || 'QR_CODE'}
              onChange={(value) => onChange('format', value)}
              size="small"
              virtual={false}
              options={QR_CODE_FORMATS.map(value => ({ value, label: value }))}
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

function findComponentInTree(components: ReportComponent[], componentId: string): ReportComponent | undefined {
  for (const component of components) {
    if (component.id === componentId) return component;
    if ('components' in component && Array.isArray((component as ReportComponent & { components?: ReportComponent[] }).components)) {
      const child = findComponentInTree((component as ReportComponent & { components?: ReportComponent[] }).components ?? [], componentId);
      if (child) return child;
    }
  }
  return undefined;
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
    insertable: false,
    children: page.bands.map(band => ({
      key: band.id,
      title: band.name || band.id,
      insertable: false,
      children: buildComponentTreeItems(band.components),
    })),
  }));
}

function buildComponentTreeItems(components: ReportComponent[]): EventTreeItem[] {
  return components.flatMap(component => {
    const children = component.type === 'panel'
      ? buildComponentTreeItems((component as ReportComponent & { components?: ReportComponent[] }).components ?? [])
      : undefined;
    const item: EventTreeItem = {
      key: component.id,
      title: component.name ? `${component.name} (${component.type})` : `${component.type}: ${component.id}`,
      name: component.name,
      type: component.type,
      insertable: Boolean(component.name),
      children,
    };

    if (!item.name && !children?.length) {
      return [];
    }

    return [item];
  });
}

function normalizeOptionalBorder(border?: BorderConfig): BorderConfig | undefined {
  if (!border) return undefined;
  const hasSide = Boolean(border.sides?.top || border.sides?.right || border.sides?.bottom || border.sides?.left);
  if ((border.style == null || border.style === 'none') && !hasSide) {
    return undefined;
  }
  return border;
}

function normalizeOptionalPadding(padding?: Padding): Padding | undefined {
  if (!padding) return undefined;
  return padding.top || padding.right || padding.bottom || padding.left ? padding : undefined;
}

function propertyBorderLabels(t: ReturnType<typeof createPropertyT>) {
  return {
    style: t('borderStyle'),
    none: t('borderNone'),
    solid: t('borderSolid'),
    dashed: t('borderDashed'),
    dotted: t('borderDotted'),
    double: t('borderDouble'),
    width: t('borderWidth'),
    color: t('borderColor'),
    sides: t('applySides'),
    sideLabels: {
      top: t('top'),
      right: t('right'),
      bottom: t('bottom'),
      left: t('left'),
    },
  };
}

function propertyPaddingLabels(t: ReturnType<typeof createPropertyT>) {
  return {
    title: t('padding'),
    top: t('top'),
    right: t('right'),
    bottom: t('bottom'),
    left: t('left'),
    ariaTop: t('paddingTop'),
    ariaRight: t('paddingRight'),
    ariaBottom: t('paddingBottom'),
    ariaLeft: t('paddingLeft'),
  };
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
    chartArrayPathTooltip: '用于主从报表场景，指定当前行中的子数组字段名（如 Items）。留空则使用数据源顶级数组。',
    chartArrayPathPlaceholder: '如 Items 或 Orders.Lines',
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
    chartTypeColumn: '柱状图',
    chartTypeColumnParallel: '分组柱状图',
    chartTypeColumnPercent: '百分比柱状图',
    chartTypeBar: '条形图',
    chartTypeBarParallel: '分组条形图',
    chartTypeBarPercent: '百分比条形图',
    chartTypeLine: '折线图',
    chartTypeArea: '面积图',
    chartTypeAreaPercent: '百分比面积图',
    chartTypePie: '饼图',
    chartTypeDonut: '环形图',
    chartTypeRose: '玫瑰图',
    chartTypeScatter: '散点图',
    chartTypeRadar: '雷达图',
    chartTypeFunnel: '漏斗图',
    chartTypeDualAxis: '双轴图',
    chartTypeHeatmap: '热力图',
    chartTypeHistogram: '直方图',
    chartTypeBoxPlot: '箱线图',
    chartTypeTreeMap: '矩形树图',
    chartTypeSunburst: '旭日图',
    chartTypeCirclePacking: '圆形填充图',
    chartLabelType: '标签类型',
    chartLabelTypeName: '名称',
    chartLabelTypeValue: '数值',
    chartLabelTypePercent: '百分比',
    chartLabelTypeNameValue: '名称+数值',
    chartAxisLabelRotation: '轴标签旋转',
    chartTheme: '主题设置',
    chartBaseTheme: '基础主题',
    chartThemeLight: '浅色',
    chartThemeDark: '深色',
    chartMarkStyle: '样式设置',
    chartBarWidth: '柱宽',
    chartCornerRadius: '圆角',
    chartFillOpacity: '填充透明度',
    chartCurveType: '曲线类型',
    chartCurveLinear: '直线',
    chartCurveMonotone: '平滑',
    chartCurveStep: '阶梯',
    chartShowPoint: '显示节点',
    chartPointSize: '节点大小',
    chartInnerRadius: '内径',
    chartOuterRadius: '外径',
    chartRoseType: '玫瑰类型',
    chartRoseRadius: '半径',
    chartRoseArea: '面积',
    chartShowTrendLine: '显示趋势线',
    chartTrendLineType: '趋势线类型',
    chartTrendPolynomial: '多项式',
    chartTrendExponential: '指数',
    chartRadarShape: '雷达形状',
    chartRadarPolygon: '多边形',
    chartRadarCircle: '圆形',
    chartShowRadarArea: '填充雷达区域',
    chartRadarAreaOpacity: '雷达填充透明度',
    chartFunnelDirection: '漏斗方向',
    chartVertical: '垂直',
    chartHorizontal: '水平',
    chartFunnelShape: '漏斗形状',
    chartFunnelTrapezoid: '梯形',
    chartFunnelTriangle: '三角形',
    chartFunnelRect: '矩形',
    chartShowConversionRate: '显示转化率',
    name: '名称',
    type: '类型',
    componentName: '组件名称',
    componentNameDuplicate: '组件名称不能重复',
    componentNameRequired: '组件名称不能为空',
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
    unbindStyle: '解除绑定',
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
    qrcodeContent: '二维码内容',
    qrcodeFormat: '二维码类型',
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
    chartArrayPathTooltip: 'For master-detail reports, specifies the sub-array field on the current row (e.g. Items). Leave empty to use the top-level data source array.',
    chartArrayPathPlaceholder: 'e.g. Items or Orders.Lines',
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
    chartTypeColumn: 'Column',
    chartTypeColumnParallel: 'Grouped Column',
    chartTypeColumnPercent: 'Percent Column',
    chartTypeBar: 'Bar',
    chartTypeBarParallel: 'Grouped Bar',
    chartTypeBarPercent: 'Percent Bar',
    chartTypeLine: 'Line',
    chartTypeArea: 'Area',
    chartTypeAreaPercent: 'Percent Area',
    chartTypePie: 'Pie',
    chartTypeDonut: 'Donut',
    chartTypeRose: 'Rose',
    chartTypeScatter: 'Scatter',
    chartTypeRadar: 'Radar',
    chartTypeFunnel: 'Funnel',
    chartTypeDualAxis: 'Dual Axis',
    chartTypeHeatmap: 'Heatmap',
    chartTypeHistogram: 'Histogram',
    chartTypeBoxPlot: 'Box Plot',
    chartTypeTreeMap: 'Tree Map',
    chartTypeSunburst: 'Sunburst',
    chartTypeCirclePacking: 'Circle Packing',
    chartLabelType: 'Label type',
    chartLabelTypeName: 'Name',
    chartLabelTypeValue: 'Value',
    chartLabelTypePercent: 'Percent',
    chartLabelTypeNameValue: 'Name+Value',
    chartAxisLabelRotation: 'Axis label rotation',
    chartTheme: 'Theme',
    chartBaseTheme: 'Base theme',
    chartThemeLight: 'Light',
    chartThemeDark: 'Dark',
    chartMarkStyle: 'Mark Style',
    chartBarWidth: 'Bar width',
    chartCornerRadius: 'Corner radius',
    chartFillOpacity: 'Fill opacity',
    chartCurveType: 'Curve type',
    chartCurveLinear: 'Linear',
    chartCurveMonotone: 'Smooth',
    chartCurveStep: 'Step',
    chartShowPoint: 'Show points',
    chartPointSize: 'Point size',
    chartInnerRadius: 'Inner radius',
    chartOuterRadius: 'Outer radius',
    chartRoseType: 'Rose type',
    chartRoseRadius: 'Radius',
    chartRoseArea: 'Area',
    chartShowTrendLine: 'Show trend line',
    chartTrendLineType: 'Trend line type',
    chartTrendPolynomial: 'Polynomial',
    chartTrendExponential: 'Exponential',
    chartRadarShape: 'Radar shape',
    chartRadarPolygon: 'Polygon',
    chartRadarCircle: 'Circle',
    chartShowRadarArea: 'Fill radar area',
    chartRadarAreaOpacity: 'Radar area opacity',
    chartFunnelDirection: 'Funnel direction',
    chartVertical: 'Vertical',
    chartHorizontal: 'Horizontal',
    chartFunnelShape: 'Funnel shape',
    chartFunnelTrapezoid: 'Trapezoid',
    chartFunnelTriangle: 'Triangle',
    chartFunnelRect: 'Rectangle',
    chartShowConversionRate: 'Show conversion rate',
    name: 'Name',
    type: 'Type',
    componentName: 'Component name',
    componentNameDuplicate: 'Component name must be unique',
    componentNameRequired: 'Component name is required',
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
    unbindStyle: 'Unbind style',
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
    qrcodeContent: 'QR code content',
    qrcodeFormat: 'QR code type',
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
  t: ReturnType<typeof createPropertyT>;
  onChange: (updates: {
    rowCount?: number;
    columnCount?: number;
    canBreak?: boolean;
  }) => void;
}> = ({ table, onChange, t }) => {
  const rowCount = table.rows?.length ?? table.rowCount ?? 1;
  const columnCount = table.rows?.[0]?.cells.length ?? table.columnCount ?? 1;

  return (
    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
        <Form.Item label={t('columnCount')}>
          <InputNumber
            aria-label={t('columnCount')}
            value={columnCount}
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
            value={rowCount}
            onChange={(value) => onChange({ rowCount: value ?? 1 })}
            size="small"
            style={{ width: '100%' }}
            min={1}
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
      </Form>

    </Space>
  );
};
