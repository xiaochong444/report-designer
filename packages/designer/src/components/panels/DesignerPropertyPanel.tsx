import React from 'react';
import { Button, Checkbox, Collapse, ColorPicker, Form, Input, InputNumber, Segmented, Select, Space, Switch, Typography } from 'antd';
import { AlignCenterOutlined, AlignLeftOutlined, AlignRightOutlined, DeleteOutlined, PlusOutlined, VerticalAlignBottomOutlined, VerticalAlignMiddleOutlined, VerticalAlignTopOutlined } from '@ant-design/icons';
import { createDefaultPageBorder, createDefaultPageWatermark, normalizeReportFonts } from '@report-designer/core';
import type { Margins, Page, PageBorder, PageWatermark, ReportFont } from '@report-designer/core';
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

export const DesignerPropertyPanel: React.FC = () => {
  const { t } = useDesignerI18n();
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const selectedComponentIds = useDesignerStore(s => s.selectedComponentIds);
  const selectedBandId = useDesignerStore(s => s.selectedBandId);

  const selectedType = React.useMemo(() => {
    if (selectedComponentIds.length === 1) {
      const page = template.pages.find(p => p.id === currentPageId);
      const component = page?.bands.flatMap(b => b.components).find(c => c.id === selectedComponentIds[0]);
      return component ? t('selection.component') : t('selection.component');
    }
    if (selectedComponentIds.length > 1) return t('selection.components', { count: selectedComponentIds.length });
    if (selectedBandId) return t('selection.band');
    return t('pageSettings.title');
  }, [currentPageId, selectedBandId, selectedComponentIds, t, template]);

  const showBandProperties = selectedBandId && selectedComponentIds.length === 0;
  const showPageProperties = selectedComponentIds.length === 0 && !selectedBandId;

  return (
    <aside className="rd-property-grid" data-testid="designer-property-grid">
      <div className="rd-panel-title">{selectedType}</div>
      <div className="rd-property-grid-body">
        {showBandProperties ? (
          <div className="rd-property-grid-band">
            <BandPropertyGrid />
          </div>
        ) : null}
        {showPageProperties ? <PageProperties /> : null}
        {!showBandProperties && !showPageProperties ? <PropertyEditor /> : null}
      </div>
    </aside>
  );
};

const PageProperties: React.FC = () => {
  const { t } = useDesignerI18n();
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const setPageSettings = useDesignerStore(s => s.setPageSettings);
  const updateTemplate = useDesignerStore(s => s.updateTemplate);
  const reportUnit = useDesignerStore(s => s.reportUnit);
  const setReportUnit = useDesignerStore(s => s.setReportUnit);
  const replaceReportEvents = useDesignerStore(s => s.replaceReportEvents);
  const [eventEditorOpen, setEventEditorOpen] = React.useState(false);
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
  const updateFonts = (fonts: ReportFont[]) => {
    updateTemplate(current => ({ ...current, fonts: normalizeReportFonts(fonts) }));
  };
  const updateFont = (fontId: string, updates: Partial<ReportFont>) => {
    updateFonts(reportFonts.map(font => font.id === fontId ? { ...font, ...updates } : font));
  };
  const addFont = () => {
    const customCount = reportFonts.filter(font => !font.builtin).length + 1;
    updateFonts([
      ...reportFonts,
      {
        id: `custom-font-${customCount}`,
        name: 'Custom Font',
        family: `CustomFont${customCount}`,
        fallback: 'sans-serif',
      },
    ]);
  };
  const removeFont = (fontId: string) => {
    updateFonts(reportFonts.filter(font => font.id !== fontId || font.builtin));
  };

  return (
    <div className="rd-property-grid-band" data-testid="designer-page-properties">
      <Collapse
        size="small"
        defaultActiveKey={['page', 'appearance', 'margins', 'fonts']}
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
            key: 'appearance',
            label: t('pageSettings.appearance'),
            children: (
              <PageAppearanceControls
                pageBorder={pageBorder}
                reportUnit={reportUnit}
                unitStep={unitStep}
                watermark={watermark}
                onPageBorderChange={updatePageBorder}
                onWatermarkChange={updateWatermark}
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
              <>
                <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  {Object.keys(template.events ?? {}).length} {t('events.title')}
                </Typography.Text>
                <Button size="small" onClick={() => setEventEditorOpen(true)}>
                  {t('events.edit')}
                </Button>
                <EventEditorDialog
                  open={eventEditorOpen}
                  targetType="report"
                  events={template.events}
                  dataContext={buildEventEditorDataContext(template, { targetType: 'report' })}
                  dictionaryItems={buildDictionaryEventItems(template)}
                  componentItems={buildComponentEventItems(template)}
                  onCancel={() => setEventEditorOpen(false)}
                  onSave={(events) => {
                    replaceReportEvents(events);
                    setEventEditorOpen(false);
                  }}
                />
              </>
            ),
          },
          {
            key: 'fonts',
            label: t('pageSettings.fonts'),
            children: (
              <Space data-testid="report-font-registry" orientation="vertical" size={8} style={{ width: '100%' }}>
                <Button aria-label={t('pageSettings.addFont')} size="small" icon={<PlusOutlined />} onClick={addFont}>
                  {t('pageSettings.addFont')}
                </Button>
                {reportFonts.map(font => (
                  <div key={font.id} style={{ border: '1px solid #f0f0f0', borderRadius: 4, padding: 8 }}>
                    <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Typography.Text strong style={{ fontFamily: `${font.family}, ${font.fallback ?? 'sans-serif'}` }}>
                          {font.name}
                        </Typography.Text>
                        <Button
                          aria-label={t('pageSettings.removeFont')}
                          icon={<DeleteOutlined />}
                          size="small"
                          disabled={font.builtin}
                          onClick={() => removeFont(font.id)}
                        />
                      </Space>
                      <Input
                        aria-label={t('pageSettings.fontName')}
                        value={font.name}
                        disabled={font.builtin}
                        onChange={event => updateFont(font.id, { name: event.target.value })}
                        size="small"
                      />
                      <Input
                        aria-label={t('pageSettings.fontFamily')}
                        value={font.family}
                        disabled={font.builtin}
                        onChange={event => updateFont(font.id, { family: event.target.value })}
                        size="small"
                      />
                      <Input
                        aria-label={t('pageSettings.fontFallback')}
                        value={font.fallback}
                        disabled={font.builtin}
                        onChange={event => updateFont(font.id, { fallback: event.target.value })}
                        size="small"
                      />
                      <Input
                        aria-label={t('pageSettings.fontUrl')}
                        value={font.source?.url ?? ''}
                        disabled={font.builtin}
                        onChange={event => updateFont(font.id, {
                          source: event.target.value ? { ...(font.source ?? {}), url: event.target.value } : undefined,
                        })}
                        size="small"
                      />
                    </Space>
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

const PageAppearanceControls: React.FC<{
  watermark: PageWatermark;
  pageBorder: PageBorder;
  reportUnit: 'mm' | 'cm';
  unitStep: number;
  onWatermarkChange: (updates: Partial<PageWatermark>) => void;
  onPageBorderChange: (updates: Partial<PageBorder>) => void;
}> = ({ watermark, pageBorder, reportUnit, unitStep, onWatermarkChange, onPageBorderChange }) => {
  const { t } = useDesignerI18n();
  const borderWidthMax = formatUnitValue(10, reportUnit);
  const borderOffsetMax = formatUnitValue(50, reportUnit);

  return (
    <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
      <Form.Item label={t('pageSettings.watermark')}>
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
      <Form.Item label={t('pageSettings.pageBorder')}>
        <Switch
          aria-label={t('pageSettings.pageBorderEnabled')}
          checked={pageBorder.enabled}
          onChange={enabled => onPageBorderChange({ enabled })}
        />
      </Form.Item>
      <Form.Item label={t('pageSettings.borderStyle')}>
        <Segmented
          aria-label={t('pageSettings.borderStyle')}
          value={pageBorder.style}
          block
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
