import React from 'react';
import { Button, Collapse, Form, InputNumber, Select, Typography } from 'antd';
import type { Margins, Page } from '@report-designer/core';
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
  const unitStep = getUnitStep(reportUnit);
  const sizeMin = formatUnitValue(20, reportUnit);
  const sizeMax = formatUnitValue(1000, reportUnit);
  const marginMax = formatUnitValue(100, reportUnit);
  const updatePage = (settings: Partial<Page>) => setPageSettings(page.id, settings);
  const updateMargin = (field: keyof Margins, value?: number | string | null) => {
    updatePage({ margins: { ...margins, [field]: parseUnitValue(value, reportUnit, margins[field]) } });
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

  return (
    <div className="rd-property-grid-band" data-testid="designer-page-properties">
      <Collapse
        size="small"
        defaultActiveKey={['page', 'margins']}
        items={[
          {
            key: 'page',
            label: t('pageSettings.page'),
            children: (
              <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
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
        ]}
      />
    </div>
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
