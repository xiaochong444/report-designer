import React from 'react';
import { Collapse, Form, InputNumber, Select, Typography } from 'antd';
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
import { BandPropertyGrid } from '../properties/BandPropertyGrid';
import { PropertyEditor } from '../PropertyEditor';

export const DesignerPropertyPanel: React.FC = () => {
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const selectedComponentIds = useDesignerStore(s => s.selectedComponentIds);
  const selectedBandId = useDesignerStore(s => s.selectedBandId);

  const selectedType = React.useMemo(() => {
    if (selectedComponentIds.length === 1) {
      const page = template.pages.find(p => p.id === currentPageId);
      const component = page?.bands.flatMap(b => b.components).find(c => c.id === selectedComponentIds[0]);
      return component ? `${component.type} component` : 'Component';
    }
    if (selectedComponentIds.length > 1) return `${selectedComponentIds.length} components`;
    if (selectedBandId) return 'Band';
    return 'Page Settings';
  }, [currentPageId, selectedBandId, selectedComponentIds, template]);

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
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const setPageSettings = useDesignerStore(s => s.setPageSettings);
  const reportUnit = useDesignerStore(s => s.reportUnit);
  const setReportUnit = useDesignerStore(s => s.setReportUnit);
  const page = template.pages.find(item => item.id === currentPageId) ?? template.pages[0];

  if (!page) {
    return (
      <div className="rd-property-grid-band" data-testid="designer-page-properties">
        <Typography.Text type="secondary">No page selected</Typography.Text>
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
            label: 'Page',
            children: (
              <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label="Paper type">
                  <Select
                    aria-label="Paper type"
                    value={paperType}
                    virtual={false}
                    options={[
                      ...PAPER_PRESETS.map((item) => ({ value: item.value, label: item.label })),
                      { value: 'Custom', label: 'Custom' },
                    ]}
                    onChange={updatePaperType}
                  />
                </Form.Item>
                <Form.Item label="Report unit">
                  <Select
                    aria-label="Report unit"
                    value={reportUnit}
                    virtual={false}
                    options={[
                      { value: 'mm', label: 'Millimeter' },
                      { value: 'cm', label: 'Centimeter' },
                    ]}
                    onChange={setReportUnit}
                  />
                </Form.Item>
                <Form.Item label="Width">
                  <InputNumber
                    aria-label="Page width"
                    value={formatUnitValue(page.width, reportUnit)}
                    min={sizeMin}
                    max={sizeMax}
                    step={unitStep}
                    disabled={paperType !== 'Custom'}
                    style={{ width: '100%' }}
                    onChange={value => updatePage({ width: parseUnitValue(value, reportUnit, page.width) })}
                  />
                </Form.Item>
                <Form.Item label="Height">
                  <InputNumber
                    aria-label="Page height"
                    value={formatUnitValue(page.height, reportUnit)}
                    min={sizeMin}
                    max={sizeMax}
                    step={unitStep}
                    disabled={paperType !== 'Custom'}
                    style={{ width: '100%' }}
                    onChange={value => updatePage({ height: parseUnitValue(value, reportUnit, page.height) })}
                  />
                </Form.Item>
                <Form.Item label="Orientation">
                  <Select
                    aria-label="Page orientation"
                    value={page.orientation}
                    virtual={false}
                    options={[
                      { value: 'portrait', label: 'Portrait' },
                      { value: 'landscape', label: 'Landscape' },
                    ]}
                    onChange={updateOrientation}
                  />
                </Form.Item>
              </Form>
            ),
          },
          {
            key: 'margins',
            label: 'Margins',
            children: (
              <Form layout="horizontal" size="small" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Form.Item label="Top">
                  <InputNumber value={formatUnitValue(margins.top, reportUnit)} min={0} max={marginMax} step={unitStep} style={{ width: '100%' }} onChange={value => updateMargin('top', value)} />
                </Form.Item>
                <Form.Item label="Right">
                  <InputNumber value={formatUnitValue(margins.right, reportUnit)} min={0} max={marginMax} step={unitStep} style={{ width: '100%' }} onChange={value => updateMargin('right', value)} />
                </Form.Item>
                <Form.Item label="Bottom">
                  <InputNumber value={formatUnitValue(margins.bottom, reportUnit)} min={0} max={marginMax} step={unitStep} style={{ width: '100%' }} onChange={value => updateMargin('bottom', value)} />
                </Form.Item>
                <Form.Item label="Left">
                  <InputNumber value={formatUnitValue(margins.left, reportUnit)} min={0} max={marginMax} step={unitStep} style={{ width: '100%' }} onChange={value => updateMargin('left', value)} />
                </Form.Item>
              </Form>
            ),
          },
        ]}
      />
    </div>
  );
};
