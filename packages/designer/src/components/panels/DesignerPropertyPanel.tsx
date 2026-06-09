import React from 'react';
import { Button, Checkbox, Collapse, ColorPicker, Form, Input, InputNumber, Segmented, Select, Space, Switch, Typography } from 'antd';
import { AlignCenterOutlined, AlignLeftOutlined, AlignRightOutlined, BoldOutlined, ItalicOutlined, StrikethroughOutlined, UnderlineOutlined, VerticalAlignBottomOutlined, VerticalAlignMiddleOutlined, VerticalAlignTopOutlined } from '@ant-design/icons';
import { createDefaultPageBorder, createDefaultPageWatermark, getReportFontOptions, normalizeReportFonts } from '@report-designer/core';
import type { EventMap, Margins, Page, PageBorder, PageEventName, PageWatermark, ReportFontOption, TableCell, TableComponent, TableRow, TextFormatConfig } from '@report-designer/core';
import { useDesignerStore } from '../../store/designer-store';
import {
  detectPaperType,
  formatUnitValue,
  getPaperPresetSize,
  getUnitStep,
  parseUnitValue,
  PAPER_PRESETS,
  type PaperType,
} from '../../page-settings';
import { useDesignerI18n } from '../../i18n';
import { BandPropertyGrid } from '../properties/BandPropertyGrid';
import { PropertyEditor } from '../PropertyEditor';
import { EventEditorDialog, type EventTreeItem } from '../events/EventEditorDialog';
import { buildEventEditorDataContext } from '../events/event-editor-utils';
import { TextFormatEditor } from '../TextFormatEditor';
import type { ExpressionCatalogExtensions } from '../../expression/expression-catalog';
import { normalizeTable } from '../../table/table-structure';
import { BorderEditor, PaddingEditor } from '../properties/BoxStyleEditors';

export const DesignerPropertyPanel: React.FC<{ expressionExtensions?: ExpressionCatalogExtensions }> = ({ expressionExtensions }) => {
  const { t } = useDesignerI18n();
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const selectedComponentIds = useDesignerStore(s => s.selectedComponentIds);
  const selectedBandId = useDesignerStore(s => s.selectedBandId);
  const selectedTableRow = useDesignerStore(s => s.selectedTableRow);
  const selectedTableCell = useDesignerStore(s => s.selectedTableCell);

  const selectedType = React.useMemo(() => {
    if (selectedTableCell) return t('selection.tableCell');
    if (selectedTableRow) return t('selection.tableRow');
    if (selectedComponentIds.length === 1) {
      const page = template.pages.find(p => p.id === currentPageId);
      const component = page?.bands.flatMap(b => b.components).find(c => c.id === selectedComponentIds[0]);
      return component ? t('selection.component') : t('selection.component');
    }
    if (selectedComponentIds.length > 1) return t('selection.components', { count: selectedComponentIds.length });
    if (selectedBandId) return t('selection.band');
    return t('pageSettings.title');
  }, [currentPageId, selectedBandId, selectedComponentIds, selectedTableCell, selectedTableRow, t, template]);

  const showTableCellProperties = Boolean(selectedTableCell);
  const showTableRowProperties = Boolean(selectedTableRow) && !showTableCellProperties;
  const showBandProperties = selectedBandId && selectedComponentIds.length === 0 && !showTableCellProperties && !showTableRowProperties;
  const showPageProperties = selectedComponentIds.length === 0 && !selectedBandId && !showTableCellProperties && !showTableRowProperties;

  return (
    <aside className="rd-property-grid" data-testid="designer-property-grid">
      <div className="rd-panel-title">{selectedType}</div>
      <div className="rd-property-grid-body">
        {showTableCellProperties ? <TableCellProperties /> : null}
        {showTableRowProperties ? <TableRowProperties /> : null}
        {showBandProperties ? (
          <div className="rd-property-grid-band">
            <BandPropertyGrid expressionExtensions={expressionExtensions} />
          </div>
        ) : null}
        {showPageProperties ? <PageProperties /> : null}
        {!showTableCellProperties && !showTableRowProperties && !showBandProperties && !showPageProperties ? <PropertyEditor expressionExtensions={expressionExtensions} /> : null}
      </div>
    </aside>
  );
};

const TableCellProperties: React.FC = () => {
  const { t } = useDesignerI18n();
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const selectedTableCell = useDesignerStore(s => s.selectedTableCell);
  const updateSelectedTableCell = useDesignerStore(s => s.updateSelectedTableCell);
  const page = template.pages.find(item => item.id === currentPageId);
  const table = page?.bands
    .find(band => band.id === selectedTableCell?.bandId)
    ?.components.find(component => component.id === selectedTableCell?.tableId && component.type === 'table') as TableComponent | undefined;
  const normalizedTable = table ? normalizeTable(table) : undefined;
  const cell = selectedTableCell ? normalizedTable?.rows?.[selectedTableCell.startRow]?.cells[selectedTableCell.startColumn] : undefined;
  const format = cell?.format ?? DEFAULT_CELL_FORMAT;
  const font = cell?.font;
  const reportFontOptions = getReportFontOptions(template.fonts);
  const selectionText = selectedTableCell
    ? `${selectedTableCell.startRow + 1}:${selectedTableCell.startColumn + 1} - ${selectedTableCell.endRow + 1}:${selectedTableCell.endColumn + 1}`
    : '';

  if (!selectedTableCell || !table) return null;

  const updateCell = (updates: Partial<TableCell>) => {
    updateSelectedTableCell(updates);
  };
  const updateFont = (updates: Partial<NonNullable<TableCell['font']>>) => {
    updateCell({ font: compactFont(font, updates) });
  };

  return (
    <div className="rd-property-grid-band" data-testid="designer-table-cell-properties">
      <Collapse
        size="small"
        defaultActiveKey={['cell', 'font', 'appearance', 'format']}
        items={[{
          key: 'cell',
          label: t('tableCell.properties'),
          children: (
            <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
              <Form.Item label={t('tableCell.range')}>
                <Input aria-label={t('tableCell.range')} value={selectionText} disabled />
              </Form.Item>
              <Form.Item label={t('tableCell.text')}>
                <Input
                  aria-label={t('tableCell.text')}
                  value={cell?.text ?? ''}
                  onChange={event => updateCell({ text: event.target.value })}
                />
              </Form.Item>
              <Form.Item label={t('tableCell.rowSpan')}>
                <InputNumber
                  aria-label={t('tableCell.rowSpan')}
                  value={cell?.rowSpan ?? 1}
                  min={1}
                  style={{ width: '100%' }}
                  onChange={value => updateCell({ rowSpan: Number(value ?? 1) })}
                />
              </Form.Item>
              <Form.Item label={t('tableCell.colSpan')}>
                <InputNumber
                  aria-label={t('tableCell.colSpan')}
                  value={cell?.colSpan ?? 1}
                  min={1}
                  style={{ width: '100%' }}
                  onChange={value => updateCell({ colSpan: Number(value ?? 1) })}
                />
              </Form.Item>
            </Form>
          ),
        }, {
          key: 'font',
          label: t('tableCell.font'),
          children: (
            <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
              <Form.Item label={t('tableCell.fontFamily')}>
                <Select
                  aria-label={t('tableCell.fontFamily')}
                  value={font?.family}
                  options={reportFontOptions}
                  showSearch
                  allowClear
                  onChange={family => updateFont({ family })}
                />
              </Form.Item>
              <Form.Item label={t('tableCell.fontSize')}>
                <InputNumber
                  aria-label={t('tableCell.fontSize')}
                  value={font?.size}
                  min={1}
                  max={200}
                  step={1}
                  style={{ width: '100%' }}
                  onChange={size => updateFont({ size: size == null ? undefined : Number(size) })}
                />
              </Form.Item>
              <Form.Item label={t('tableCell.textColor')}>
                <Space.Compact style={{ width: '100%' }}>
                  <ColorPicker value={font?.color} allowClear onChange={color => updateFont({ color: color.toHexString() })} onClear={() => updateFont({ color: undefined })} />
                  <Input
                    aria-label={t('tableCell.textColor')}
                    value={font?.color ?? ''}
                    onChange={event => updateFont({ color: event.target.value })}
                  />
                </Space.Compact>
              </Form.Item>
              <Form.Item label="">
                <Space size={4} wrap>
                  <Button
                    aria-label={t('tableCell.bold')}
                    title={t('tableCell.bold')}
                    icon={<BoldOutlined />}
                    type={font?.bold ? 'primary' : 'default'}
                    onClick={() => updateFont({ bold: font?.bold ? undefined : true })}
                  />
                  <Button
                    aria-label={t('tableCell.italic')}
                    title={t('tableCell.italic')}
                    icon={<ItalicOutlined />}
                    type={font?.italic ? 'primary' : 'default'}
                    onClick={() => updateFont({ italic: font?.italic ? undefined : true })}
                  />
                  <Button
                    aria-label={t('tableCell.underline')}
                    title={t('tableCell.underline')}
                    icon={<UnderlineOutlined />}
                    type={font?.underline ? 'primary' : 'default'}
                    onClick={() => updateFont({ underline: font?.underline ? undefined : true })}
                  />
                  <Button
                    aria-label={t('tableCell.strikethrough')}
                    title={t('tableCell.strikethrough')}
                    icon={<StrikethroughOutlined />}
                    type={font?.strikethrough ? 'primary' : 'default'}
                    onClick={() => updateFont({ strikethrough: font?.strikethrough ? undefined : true })}
                  />
                </Space>
              </Form.Item>
            </Form>
          ),
        }, {
          key: 'appearance',
          label: t('tableCell.appearance'),
          children: (
            <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
              <Form.Item label={t('tableCell.backgroundColor')}>
                <ColorPicker
                  aria-label={t('tableCell.backgroundColor')}
                  value={cell?.backgroundColor}
                  allowClear
                  onChange={color => updateCell({ backgroundColor: color.toHexString() })}
                  onClear={() => updateCell({ backgroundColor: undefined })}
                />
              </Form.Item>
              <Form.Item label={t('tableCell.textAlign')}>
                <Segmented
                  aria-label={t('tableCell.textAlign')}
                  block
                  value={(cell?.textAlign ?? null) as never}
                  options={[
                    { value: 'left', icon: <AlignLeftOutlined />, label: '' },
                    { value: 'center', icon: <AlignCenterOutlined />, label: '' },
                    { value: 'right', icon: <AlignRightOutlined />, label: '' },
                  ]}
                  onChange={value => updateCell({ textAlign: value as TableCell['textAlign'] })}
                />
              </Form.Item>
              <Form.Item label={t('tableCell.verticalAlign')}>
                <Segmented
                  aria-label={t('tableCell.verticalAlign')}
                  block
                  value={(cell?.verticalAlign ?? null) as never}
                  options={[
                    { value: 'top', icon: <VerticalAlignTopOutlined />, label: '' },
                    { value: 'middle', icon: <VerticalAlignMiddleOutlined />, label: '' },
                    { value: 'bottom', icon: <VerticalAlignBottomOutlined />, label: '' },
                  ]}
                  onChange={value => updateCell({ verticalAlign: value as TableCell['verticalAlign'] })}
                />
              </Form.Item>
              <BorderEditor value={cell?.border} labels={tableBorderLabels(t)} onChange={nextBorder => updateCell({ border: nextBorder })} />
              <PaddingEditor value={cell?.padding} labels={tablePaddingLabels(t)} onChange={nextPadding => updateCell({ padding: nextPadding })} />
            </Form>
          ),
        }, {
          key: 'format',
          label: t('tableCell.format'),
          children: (
            <TextFormatEditor
              value={format}
              onChange={(value: TextFormatConfig) => updateCell({ format: value })}
            />
          ),
        }]}
      />
    </div>
  );
};

const TableRowProperties: React.FC = () => {
  const { t } = useDesignerI18n();
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const selectedTableRow = useDesignerStore(s => s.selectedTableRow);
  const updateSelectedTableRow = useDesignerStore(s => s.updateSelectedTableRow);
  const page = template.pages.find(item => item.id === currentPageId);
  const table = page?.bands
    .find(band => band.id === selectedTableRow?.bandId)
    ?.components.find(component => component.id === selectedTableRow?.tableId && component.type === 'table') as TableComponent | undefined;
  const normalizedTable = table ? normalizeTable(table) : undefined;
  const row = selectedTableRow ? normalizedTable?.rows?.[selectedTableRow.row] : undefined;
  const format = row?.format ?? DEFAULT_CELL_FORMAT;
  const font = row?.font;
  const reportFontOptions = getReportFontOptions(template.fonts);

  if (!selectedTableRow || !table || !row) return null;

  const updateRow = (updates: Partial<TableRow>) => {
    updateSelectedTableRow(updates);
  };
  const updateFont = (updates: Partial<NonNullable<TableRow['font']>>) => {
    updateRow({ font: compactFont(font, updates) });
  };

  return (
    <div className="rd-property-grid-band" data-testid="designer-table-row-properties">
      <Collapse
        size="small"
        defaultActiveKey={['row', 'font', 'appearance', 'format']}
        items={[{
          key: 'row',
          label: t('tableRow.properties'),
          children: (
            <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
              <Form.Item label={t('tableRow.index')}>
                <Input aria-label={t('tableRow.index')} value={String(selectedTableRow.row + 1)} disabled />
              </Form.Item>
              <Form.Item label={t('tableRow.height')}>
                <InputNumber
                  aria-label={t('tableRow.height')}
                  value={row.height ?? 8}
                  min={0.1}
                  step={0.5}
                  style={{ width: '100%' }}
                  onChange={value => updateRow({ height: Number(value ?? row.height ?? 8) })}
                />
              </Form.Item>
            </Form>
          ),
        }, {
          key: 'font',
          label: t('tableCell.font'),
          children: (
            <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
              <Form.Item label={t('tableCell.fontFamily')}>
                <Select
                  aria-label={t('tableCell.fontFamily')}
                  value={font?.family}
                  options={reportFontOptions}
                  showSearch
                  allowClear
                  onChange={family => updateFont({ family })}
                />
              </Form.Item>
              <Form.Item label={t('tableCell.fontSize')}>
                <InputNumber
                  aria-label={t('tableCell.fontSize')}
                  value={font?.size}
                  min={1}
                  max={200}
                  step={1}
                  style={{ width: '100%' }}
                  onChange={size => updateFont({ size: size == null ? undefined : Number(size) })}
                />
              </Form.Item>
              <Form.Item label={t('tableCell.textColor')}>
                <Space.Compact style={{ width: '100%' }}>
                  <ColorPicker value={font?.color} allowClear onChange={color => updateFont({ color: color.toHexString() })} onClear={() => updateFont({ color: undefined })} />
                  <Input
                    aria-label={t('tableCell.textColor')}
                    value={font?.color ?? ''}
                    onChange={event => updateFont({ color: event.target.value })}
                  />
                </Space.Compact>
              </Form.Item>
              <Form.Item label="">
                <Space size={4} wrap>
                  <Button aria-label={t('tableCell.bold')} title={t('tableCell.bold')} icon={<BoldOutlined />} type={font?.bold ? 'primary' : 'default'} onClick={() => updateFont({ bold: font?.bold ? undefined : true })} />
                  <Button aria-label={t('tableCell.italic')} title={t('tableCell.italic')} icon={<ItalicOutlined />} type={font?.italic ? 'primary' : 'default'} onClick={() => updateFont({ italic: font?.italic ? undefined : true })} />
                  <Button aria-label={t('tableCell.underline')} title={t('tableCell.underline')} icon={<UnderlineOutlined />} type={font?.underline ? 'primary' : 'default'} onClick={() => updateFont({ underline: font?.underline ? undefined : true })} />
                  <Button aria-label={t('tableCell.strikethrough')} title={t('tableCell.strikethrough')} icon={<StrikethroughOutlined />} type={font?.strikethrough ? 'primary' : 'default'} onClick={() => updateFont({ strikethrough: font?.strikethrough ? undefined : true })} />
                </Space>
              </Form.Item>
            </Form>
          ),
        }, {
          key: 'appearance',
          label: t('tableCell.appearance'),
          children: (
            <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
              <Form.Item label={t('tableCell.backgroundColor')}>
                <ColorPicker
                  aria-label={t('tableCell.backgroundColor')}
                  value={row.backgroundColor}
                  allowClear
                  onChange={color => updateRow({ backgroundColor: color.toHexString() })}
                  onClear={() => updateRow({ backgroundColor: undefined })}
                />
              </Form.Item>
              <Form.Item label={t('tableCell.textAlign')}>
                <Segmented
                  aria-label={t('tableCell.textAlign')}
                  block
                  value={(row.textAlign ?? null) as never}
                  options={[
                    { value: 'left', icon: <AlignLeftOutlined />, label: '' },
                    { value: 'center', icon: <AlignCenterOutlined />, label: '' },
                    { value: 'right', icon: <AlignRightOutlined />, label: '' },
                  ]}
                  onChange={value => updateRow({ textAlign: value as TableRow['textAlign'] })}
                />
              </Form.Item>
              <Form.Item label={t('tableCell.verticalAlign')}>
                <Segmented
                  aria-label={t('tableCell.verticalAlign')}
                  block
                  value={(row.verticalAlign ?? null) as never}
                  options={[
                    { value: 'top', icon: <VerticalAlignTopOutlined />, label: '' },
                    { value: 'middle', icon: <VerticalAlignMiddleOutlined />, label: '' },
                    { value: 'bottom', icon: <VerticalAlignBottomOutlined />, label: '' },
                  ]}
                  onChange={value => updateRow({ verticalAlign: value as TableRow['verticalAlign'] })}
                />
              </Form.Item>
              <BorderEditor value={row.border} labels={tableBorderLabels(t)} onChange={nextBorder => updateRow({ border: nextBorder })} />
              <PaddingEditor value={row.padding} labels={tablePaddingLabels(t)} onChange={nextPadding => updateRow({ padding: nextPadding })} />
            </Form>
          ),
        }, {
          key: 'format',
          label: t('tableCell.format'),
          children: (
            <TextFormatEditor
              value={format}
              onChange={(value: TextFormatConfig) => updateRow({ format: value })}
            />
          ),
        }]}
      />
    </div>
  );
};

const DEFAULT_CELL_FORMAT: TextFormatConfig = { type: 'none' };

function compactFont<T extends TableCell['font'] | TableRow['font']>(
  font: T | undefined,
  updates: Partial<NonNullable<T>>,
): T | undefined {
  const next = { ...(font ?? {}) } as Record<string, unknown>;
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false) {
      delete next[key];
    } else {
      next[key] = value;
    }
  });

  return Object.keys(next).length > 0 ? next as T : undefined;
}

function tableBorderLabels(t: ReturnType<typeof useDesignerI18n>['t']) {
  return {
    style: t('tableCell.borderStyle'),
    inherit: t('tableCell.borderInherited'),
    none: t('styleLibrary.borderNone'),
    solid: t('pageSettings.borderSolid'),
    dashed: t('pageSettings.borderDashed'),
    dotted: t('pageSettings.borderDotted'),
    double: t('pageSettings.borderDouble'),
    width: t('tableCell.borderWidth'),
    color: t('tableCell.borderColor'),
    sides: t('styleLibrary.applySides'),
    sideLabels: {
      top: t('tableCell.paddingTop'),
      right: t('tableCell.paddingRight'),
      bottom: t('tableCell.paddingBottom'),
      left: t('tableCell.paddingLeft'),
    },
    sideAriaLabels: {
      top: t('tableCell.borderSideTop'),
      right: t('tableCell.borderSideRight'),
      bottom: t('tableCell.borderSideBottom'),
      left: t('tableCell.borderSideLeft'),
    },
  };
}

function tablePaddingLabels(t: ReturnType<typeof useDesignerI18n>['t']) {
  return {
    title: t('tableCell.padding'),
    top: t('tableCell.paddingTop'),
    right: t('tableCell.paddingRight'),
    bottom: t('tableCell.paddingBottom'),
    left: t('tableCell.paddingLeft'),
    ariaTop: t('tableCell.paddingTop'),
    ariaRight: t('tableCell.paddingRight'),
    ariaBottom: t('tableCell.paddingBottom'),
    ariaLeft: t('tableCell.paddingLeft'),
  };
}

const PageProperties: React.FC = () => {
  const { t } = useDesignerI18n();
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const setPageSettings = useDesignerStore(s => s.setPageSettings);
  const reportUnit = useDesignerStore(s => s.reportUnit);
  const setReportUnit = useDesignerStore(s => s.setReportUnit);
  const replaceReportEvents = useDesignerStore(s => s.replaceReportEvents);
  const replacePageEvents = useDesignerStore(s => s.replacePageEvents);
  const pendingEventEditorTarget = useDesignerStore(s => s.pendingEventEditorTarget);
  const consumeEventEditorTarget = useDesignerStore(s => s.consumeEventEditorTarget);
  const [eventEditorOpen, setEventEditorOpen] = React.useState(false);
  const [eventEditorTarget, setEventEditorTarget] = React.useState<typeof pendingEventEditorTarget>(null);
  const page = template.pages.find(item => item.id === currentPageId) ?? template.pages[0];

  if (!page) {
    return (
      <div className="rd-property-grid-band" data-testid="designer-page-properties">
        <Typography.Text type="secondary">{t('pageSettings.noPage')}</Typography.Text>
      </div>
    );
  }

  const margins = page.margins ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const paperType = detectPaperType(page.width, page.height);
  const reportFonts = normalizeReportFonts(template.fonts);
  const unitStep = getUnitStep(reportUnit);
  const sizeMin = formatUnitValue(20, reportUnit);
  const sizeMax = formatUnitValue(1000, reportUnit);
  const marginMax = formatUnitValue(100, reportUnit);
  const reportFontOptions = getReportFontOptions(template.fonts);
  const updatePage = (settings: Partial<Page>) => setPageSettings(page.id, settings);
  const watermark = page.watermark ?? createDefaultPageWatermark();
  const pageBorder = page.pageBorder ?? createDefaultPageBorder();
  const updateMargin = (field: keyof Margins, value?: number | string | null) => {
    updatePage({ margins: { ...margins, [field]: parseUnitValue(value, reportUnit, margins[field]) } });
  };
  const updateWatermark = (updates: Partial<PageWatermark>) => {
    updatePage({ watermark: { ...watermark, ...updates } });
  };
  const updatePageBorder = (updates: Partial<PageBorder>) => {
    updatePage({ pageBorder: { ...pageBorder, ...updates, sides: updates.sides ? { ...pageBorder.sides, ...updates.sides } : pageBorder.sides } });
  };
  const updateOrientation = (orientation: Page['orientation']) => {
    if (paperType !== 'Custom') {
      updatePage({
        orientation,
        ...getPaperPresetSize(paperType, orientation, page.width, page.height),
      });
      return;
    }

    const shortSide = Math.min(page.width, page.height);
    const longSide = Math.max(page.width, page.height);
    updatePage({
      orientation,
      width: orientation === 'portrait' ? shortSide : longSide,
      height: orientation === 'portrait' ? longSide : shortSide,
    });
  };
  const updatePaperType = (value: PaperType) => {
    if (value === 'Custom') {
      return;
    }
    updatePage({
      ...getPaperPresetSize(value, page.orientation, page.width, page.height),
    });
  };
  const pendingTarget = (pendingEventEditorTarget?.ownerType === 'report' || pendingEventEditorTarget?.ownerType === 'page')
    ? pendingEventEditorTarget
    : null;

  React.useEffect(() => {
    if (!pendingTarget) return;
    setEventEditorTarget(pendingTarget);
    setEventEditorOpen(true);
    consumeEventEditorTarget(pendingTarget.requestId);
  }, [consumeEventEditorTarget, pendingTarget]);

  return (
    <div className="rd-property-grid-band" data-testid="designer-page-properties">
      <Collapse
        size="small"
        defaultActiveKey={['page', 'watermark', 'appearance', 'margins', 'events', 'fonts']}
        items={[
          {
            key: 'page',
            label: t('pageSettings.page'),
            children: (
              <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label={t('pageSettings.pageName')}>
                  <Input
                    aria-label={t('pageSettings.pageName')}
                    value={page.name ?? ''}
                    onChange={event => updatePage({ name: event.target.value })}
                  />
                </Form.Item>
                <Form.Item label={t('pageSettings.backgroundColor')}>
                  <Space.Compact style={{ width: '100%' }}>
                    <ColorPicker
                      value={page.backgroundColor ?? '#ffffff'}
                      onChange={color => updatePage({ backgroundColor: color.toHexString() })}
                    />
                    <Input
                      aria-label={t('pageSettings.backgroundColor')}
                      value={page.backgroundColor ?? '#ffffff'}
                      onChange={event => updatePage({ backgroundColor: event.target.value })}
                    />
                  </Space.Compact>
                </Form.Item>
                <Form.Item label={t('pageSettings.paperType')}>
                  <Select
                    aria-label={t('pageSettings.paperType')}
                    value={paperType}
                    virtual={false}
                    options={[
                      ...PAPER_PRESETS.map((item) => ({ value: item.value, label: item.label })),
                      { value: 'Custom', label: t('pageSettings.custom') },
                    ]}
                    onChange={updatePaperType}
                  />
                </Form.Item>
                <Form.Item label={t('pageSettings.reportUnit')}>
                  <Select
                    aria-label={t('pageSettings.reportUnit')}
                    value={reportUnit}
                    virtual={false}
                    options={[
                      { value: 'mm', label: t('pageSettings.millimeter') },
                      { value: 'cm', label: t('pageSettings.centimeter') },
                    ]}
                    onChange={setReportUnit}
                  />
                </Form.Item>
                <Form.Item label={t('pageSettings.width')}>
                  <InputNumber
                    aria-label={t('pageSettings.width')}
                    value={formatUnitValue(page.width, reportUnit)}
                    min={sizeMin}
                    max={sizeMax}
                    step={unitStep}
                    disabled={paperType !== 'Custom'}
                    style={{ width: '100%' }}
                    onChange={value => updatePage({ width: parseUnitValue(value, reportUnit, page.width) })}
                  />
                </Form.Item>
                <Form.Item label={t('pageSettings.height')}>
                  <InputNumber
                    aria-label={t('pageSettings.height')}
                    value={formatUnitValue(page.height, reportUnit)}
                    min={sizeMin}
                    max={sizeMax}
                    step={unitStep}
                    disabled={paperType !== 'Custom'}
                    style={{ width: '100%' }}
                    onChange={value => updatePage({ height: parseUnitValue(value, reportUnit, page.height) })}
                  />
                </Form.Item>
                <Form.Item label={t('pageSettings.orientation')}>
                  <Select
                    aria-label={t('pageSettings.orientation')}
                    value={page.orientation}
                    virtual={false}
                    options={[
                      { value: 'portrait', label: t('pageSettings.portrait') },
                      { value: 'landscape', label: t('pageSettings.landscape') },
                    ]}
                    onChange={updateOrientation}
                  />
                </Form.Item>
              </Form>
            ),
          },
          {
            key: 'watermark',
            label: t('pageSettings.watermark'),
            children: (
              <PageWatermarkControls
                reportFontOptions={reportFontOptions}
                watermark={watermark}
                onWatermarkChange={updateWatermark}
              />
            ),
          },
          {
            key: 'appearance',
            label: t('pageSettings.appearance'),
            children: (
              <PageAppearanceControls
                pageBorder={pageBorder}
                reportUnit={reportUnit}
                unitStep={unitStep}
                onPageBorderChange={updatePageBorder}
              />
            ),
          },
          {
            key: 'margins',
            label: t('pageSettings.margins'),
            children: (
              <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label={t('pageSettings.top')}>
                  <InputNumber value={formatUnitValue(margins.top, reportUnit)} min={0} max={marginMax} step={unitStep} style={{ width: '100%' }} onChange={value => updateMargin('top', value)} />
                </Form.Item>
                <Form.Item label={t('pageSettings.right')}>
                  <InputNumber value={formatUnitValue(margins.right, reportUnit)} min={0} max={marginMax} step={unitStep} style={{ width: '100%' }} onChange={value => updateMargin('right', value)} />
                </Form.Item>
                <Form.Item label={t('pageSettings.bottom')}>
                  <InputNumber value={formatUnitValue(margins.bottom, reportUnit)} min={0} max={marginMax} step={unitStep} style={{ width: '100%' }} onChange={value => updateMargin('bottom', value)} />
                </Form.Item>
                <Form.Item label={t('pageSettings.left')}>
                  <InputNumber value={formatUnitValue(margins.left, reportUnit)} min={0} max={marginMax} step={unitStep} style={{ width: '100%' }} onChange={value => updateMargin('left', value)} />
                </Form.Item>
              </Form>
            ),
          },
          {
            key: 'events',
            label: t('events.title'),
            children: (
              <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                <Typography.Text type="secondary">
                  {Object.keys(page.events ?? {}).length} {t('events.pageTitle')}
                </Typography.Text>
                <Button size="small" onClick={() => {
                  setEventEditorTarget({ ownerType: 'page', ownerId: page.id, eventName: 'beforePrint', requestId: Date.now() });
                  setEventEditorOpen(true);
                }}>
                  {t('events.editPage')}
                </Button>
                <Typography.Text type="secondary">
                  {Object.keys(template.events ?? {}).length} {t('events.reportTitle')}
                </Typography.Text>
                <Button size="small" onClick={() => {
                  setEventEditorTarget({ ownerType: 'report', ownerId: template.id, eventName: 'beforeRender', requestId: Date.now() });
                  setEventEditorOpen(true);
                }}>
                  {t('events.editReport')}
                </Button>
                {eventEditorTarget ? (
                  <EventEditorDialog
                    open={eventEditorOpen}
                    targetType={eventEditorTarget.ownerType === 'page' ? 'page' : 'report'}
                    events={eventEditorTarget.ownerType === 'page' ? page.events : template.events}
                    initialEventName={eventEditorTarget.eventName}
                    initialCursor={{ line: eventEditorTarget.line, column: eventEditorTarget.column }}
                    dataContext={buildEventEditorDataContext(template, {
                      targetType: eventEditorTarget.ownerType === 'page' ? 'page' : 'report',
                      pageId: page.id,
                    })}
                    dictionaryItems={buildDictionaryEventItems(template)}
                    componentItems={buildComponentEventItems(template)}
                    onCancel={() => {
                      setEventEditorOpen(false);
                      setEventEditorTarget(null);
                    }}
                    onSave={(events) => {
                      if (eventEditorTarget.ownerType === 'page') {
                        replacePageEvents(page.id, events as EventMap<PageEventName>);
                      } else {
                        replaceReportEvents(events);
                      }
                      setEventEditorOpen(false);
                      setEventEditorTarget(null);
                    }}
                  />
                ) : null}
              </Space>
            ),
          },
          {
            key: 'fonts',
            label: t('pageSettings.fonts'),
            children: (
              <Space data-testid="report-font-registry" orientation="vertical" size={8} style={{ width: '100%' }}>
                {reportFonts.map(font => (
                  <div key={font.id} style={{ border: '1px solid #f0f0f0', borderRadius: 4, padding: 8 }}>
                    <Typography.Text strong style={{ display: 'block', fontFamily: `${font.family}, ${font.fallback ?? 'sans-serif'}` }}>
                      {font.name}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                      {font.family}{font.fallback ? `, ${font.fallback}` : ''}
                    </Typography.Text>
                    {font.source?.url || font.source?.dataUrl ? (
                      <Typography.Text type="secondary" ellipsis style={{ display: 'block', fontSize: 12 }}>
                        {font.source.dataUrl ? 'data:' : font.source.url}
                      </Typography.Text>
                    ) : null}
                  </div>
                ))}
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
};

const PageWatermarkControls: React.FC<{
  watermark: PageWatermark;
  reportFontOptions: ReportFontOption[];
  onWatermarkChange: (updates: Partial<PageWatermark>) => void;
}> = ({ watermark, reportFontOptions, onWatermarkChange }) => {
  const { t } = useDesignerI18n();

  return (
    <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
      <Form.Item label={t('pageSettings.watermarkEnabled')}>
        <Switch
          aria-label={t('pageSettings.watermarkEnabled')}
          checked={watermark.enabled}
          onChange={enabled => onWatermarkChange({ enabled })}
        />
      </Form.Item>
      <Form.Item label={t('pageSettings.watermarkText')}>
        <Input
          aria-label={t('pageSettings.watermarkText')}
          value={watermark.text}
          onChange={event => onWatermarkChange({ text: event.target.value })}
        />
      </Form.Item>
      <Form.Item label={t('pageSettings.watermarkColor')}>
        <Space.Compact style={{ width: '100%' }}>
          <ColorPicker value={watermark.color} onChange={color => onWatermarkChange({ color: color.toHexString() })} />
          <Input
            aria-label={t('pageSettings.watermarkColor')}
            value={watermark.color}
            onChange={event => onWatermarkChange({ color: event.target.value })}
          />
        </Space.Compact>
      </Form.Item>
      <Form.Item label={t('pageSettings.watermarkFontSize')}>
        <InputNumber
          aria-label={t('pageSettings.watermarkFontSize')}
          value={watermark.fontSize}
          min={8}
          max={240}
          step={1}
          style={{ width: '100%' }}
          onChange={value => onWatermarkChange({ fontSize: Number(value ?? watermark.fontSize) })}
        />
      </Form.Item>
      <Form.Item label={t('pageSettings.watermarkFontFamily')}>
        <Select
          aria-label={t('pageSettings.watermarkFontFamily')}
          value={watermark.fontFamily ?? undefined}
          allowClear
          showSearch
          virtual={false}
          style={{ width: '100%' }}
          options={reportFontOptions.map(font => ({
            value: font.value,
            label: <span style={{ fontFamily: font.fontFamily }}>{font.label}</span>,
          }))}
          onChange={fontFamily => onWatermarkChange({ fontFamily })}
        />
      </Form.Item>
      <Form.Item label={t('pageSettings.watermarkOpacity')}>
        <InputNumber
          aria-label={t('pageSettings.watermarkOpacity')}
          value={watermark.opacity}
          min={0}
          max={1}
          step={0.05}
          style={{ width: '100%' }}
          onChange={value => onWatermarkChange({ opacity: Number(value ?? watermark.opacity) })}
        />
      </Form.Item>
      <Form.Item label={t('pageSettings.watermarkAngle')}>
        <InputNumber
          aria-label={t('pageSettings.watermarkAngle')}
          value={watermark.angle}
          min={-180}
          max={180}
          step={1}
          style={{ width: '100%' }}
          onChange={value => onWatermarkChange({ angle: Number(value ?? watermark.angle) })}
        />
      </Form.Item>
      <Form.Item label={t('pageSettings.watermarkHorizontalAlign')}>
        <Segmented
          aria-label={t('pageSettings.watermarkHorizontalAlign')}
          value={watermark.horizontalAlign}
          block
          options={[
            { value: 'left', icon: <AlignLeftOutlined />, label: '' },
            { value: 'center', icon: <AlignCenterOutlined />, label: '' },
            { value: 'right', icon: <AlignRightOutlined />, label: '' },
          ]}
          onChange={value => onWatermarkChange({ horizontalAlign: value as PageWatermark['horizontalAlign'] })}
        />
      </Form.Item>
      <Form.Item label={t('pageSettings.watermarkVerticalAlign')}>
        <Segmented
          aria-label={t('pageSettings.watermarkVerticalAlign')}
          value={watermark.verticalAlign}
          block
          options={[
            { value: 'top', icon: <VerticalAlignTopOutlined />, label: '' },
            { value: 'middle', icon: <VerticalAlignMiddleOutlined />, label: '' },
            { value: 'bottom', icon: <VerticalAlignBottomOutlined />, label: '' },
          ]}
          onChange={value => onWatermarkChange({ verticalAlign: value as PageWatermark['verticalAlign'] })}
        />
      </Form.Item>
      <Form.Item label={t('pageSettings.watermarkShowBehind')}>
        <Switch
          aria-label={t('pageSettings.watermarkShowBehind')}
          checked={watermark.showBehind}
          onChange={showBehind => onWatermarkChange({ showBehind })}
        />
      </Form.Item>
    </Form>
  );
};

const PageAppearanceControls: React.FC<{
  pageBorder: PageBorder;
  reportUnit: 'mm' | 'cm';
  unitStep: number;
  onPageBorderChange: (updates: Partial<PageBorder>) => void;
}> = ({ pageBorder, reportUnit, unitStep, onPageBorderChange }) => {
  const { t } = useDesignerI18n();
  const borderWidthMax = formatUnitValue(10, reportUnit);
  const borderOffsetMax = formatUnitValue(50, reportUnit);

  return (
    <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
      <Form.Item label={t('pageSettings.pageBorder')}>
        <Switch
          aria-label={t('pageSettings.pageBorderEnabled')}
          checked={pageBorder.enabled}
          onChange={enabled => onPageBorderChange({ enabled })}
        />
      </Form.Item>
      <Form.Item label={t('pageSettings.borderStyle')}>
        <Select
          aria-label={t('pageSettings.borderStyle')}
          value={pageBorder.style}
          virtual={false}
          style={{ width: '100%' }}
          options={[
            { value: 'solid', label: t('pageSettings.borderSolid') },
            { value: 'dashed', label: t('pageSettings.borderDashed') },
            { value: 'dotted', label: t('pageSettings.borderDotted') },
            { value: 'double', label: t('pageSettings.borderDouble') },
          ]}
          onChange={style => onPageBorderChange({ style: style as PageBorder['style'] })}
        />
      </Form.Item>
      <Form.Item label={t('pageSettings.borderColor')}>
        <Space.Compact style={{ width: '100%' }}>
          <ColorPicker value={pageBorder.color} onChange={color => onPageBorderChange({ color: color.toHexString() })} />
          <Input
            aria-label={t('pageSettings.borderColor')}
            value={pageBorder.color}
            onChange={event => onPageBorderChange({ color: event.target.value })}
          />
        </Space.Compact>
      </Form.Item>
      <Form.Item label={t('pageSettings.borderWidth')}>
        <InputNumber
          aria-label={t('pageSettings.borderWidth')}
          value={formatUnitValue(pageBorder.width, reportUnit)}
          min={0}
          max={borderWidthMax}
          step={unitStep}
          style={{ width: '100%' }}
          onChange={value => onPageBorderChange({ width: parseUnitValue(value, reportUnit, pageBorder.width) })}
        />
      </Form.Item>
      <Form.Item label={t('pageSettings.borderOffset')}>
        <InputNumber
          aria-label={t('pageSettings.borderOffset')}
          value={formatUnitValue(pageBorder.offset ?? 0, reportUnit)}
          min={0}
          max={borderOffsetMax}
          step={unitStep}
          style={{ width: '100%' }}
          onChange={value => onPageBorderChange({ offset: parseUnitValue(value, reportUnit, pageBorder.offset ?? 0) })}
        />
      </Form.Item>
      <Form.Item label={t('pageSettings.borderSides')}>
        <Checkbox.Group
          value={Object.entries(pageBorder.sides).filter(([, enabled]) => enabled).map(([side]) => side)}
          options={[
            { value: 'top', label: t('pageSettings.top') },
            { value: 'right', label: t('pageSettings.right') },
            { value: 'bottom', label: t('pageSettings.bottom') },
            { value: 'left', label: t('pageSettings.left') },
          ]}
          onChange={values => onPageBorderChange({
            sides: {
              top: values.includes('top'),
              right: values.includes('right'),
              bottom: values.includes('bottom'),
              left: values.includes('left'),
            },
          })}
        />
      </Form.Item>
    </Form>
  );
};

function buildDictionaryEventItems(template: { dataSources: Array<{ id: string; name?: string; fields?: Array<{ name: string; label?: string }>; schema?: Array<{ name: string; label?: string }> }> }): EventTreeItem[] {
  return template.dataSources.map(source => ({
    key: source.id,
    title: source.name || source.id,
    children: (source.schema ?? source.fields ?? []).map(field => ({
      key: `${source.id}.${field.name}`,
      title: field.label || field.name,
    })),
  }));
}

function buildComponentEventItems(template: { pages: Array<{ id: string; bands: Array<{ id: string; name?: string; components: Array<{ id: string; name?: string }> }> }> }): EventTreeItem[] {
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
