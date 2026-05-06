import React from 'react';
import { Collapse, Form, InputNumber, Select, Typography } from 'antd';
import type { Margins, Page } from '@report-designer/core';
import { useDesignerStore } from '../../store/designer-store';
import { PropertyGridV2 } from '../properties/PropertyGridV2';
import { PropertyEditor } from '../PropertyEditor';

export const StimulsoftPropertyGrid: React.FC = () => {
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
            <PropertyGridV2 />
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
  const page = template.pages.find(item => item.id === currentPageId) ?? template.pages[0];

  if (!page) {
    return (
      <div className="rd-property-grid-band" data-testid="designer-page-properties">
        <Typography.Text type="secondary">No page selected</Typography.Text>
      </div>
    );
  }

  const margins = page.margins ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const updatePage = (settings: Partial<Page>) => setPageSettings(page.id, settings);
  const updateMargin = (field: keyof Margins, value?: number | string | null) => {
    updatePage({ margins: { ...margins, [field]: Number(value ?? margins[field]) } });
  };
  const updateOrientation = (orientation: Page['orientation']) => {
    const shortSide = Math.min(page.width, page.height);
    const longSide = Math.max(page.width, page.height);
    updatePage({
      orientation,
      width: orientation === 'portrait' ? shortSide : longSide,
      height: orientation === 'portrait' ? longSide : shortSide,
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
                <Form.Item label="Width (mm)">
                  <InputNumber
                    aria-label="Page width"
                    value={page.width}
                    min={20}
                    max={1000}
                    step={1}
                    style={{ width: '100%' }}
                    onChange={value => updatePage({ width: Number(value ?? page.width) })}
                  />
                </Form.Item>
                <Form.Item label="Height (mm)">
                  <InputNumber
                    aria-label="Page height"
                    value={page.height}
                    min={20}
                    max={1000}
                    step={1}
                    style={{ width: '100%' }}
                    onChange={value => updatePage({ height: Number(value ?? page.height) })}
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
                <Form.Item label="Top (mm)">
                  <InputNumber value={margins.top} min={0} max={100} step={0.5} style={{ width: '100%' }} onChange={value => updateMargin('top', value)} />
                </Form.Item>
                <Form.Item label="Right (mm)">
                  <InputNumber value={margins.right} min={0} max={100} step={0.5} style={{ width: '100%' }} onChange={value => updateMargin('right', value)} />
                </Form.Item>
                <Form.Item label="Bottom (mm)">
                  <InputNumber value={margins.bottom} min={0} max={100} step={0.5} style={{ width: '100%' }} onChange={value => updateMargin('bottom', value)} />
                </Form.Item>
                <Form.Item label="Left (mm)">
                  <InputNumber value={margins.left} min={0} max={100} step={0.5} style={{ width: '100%' }} onChange={value => updateMargin('left', value)} />
                </Form.Item>
              </Form>
            ),
          },
        ]}
      />
    </div>
  );
};
