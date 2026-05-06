import { useMemo, useState } from 'react';
import { Button, Layout, Select, Typography } from 'antd';
import type { ReportTemplate, ReportTemplateV2 } from '@report-designer/core';
import { Designer } from '@report-designer/designer';
import { Viewer } from '@report-designer/viewer';
import { sampleReports } from './templates';

const { Content, Header } = Layout;
type ViewMode = 'preview' | 'designer';

function App() {
  const [sampleKey, setSampleKey] = useState(sampleReports[0].key);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const selected = useMemo(
    () => sampleReports.find(report => report.key === sampleKey) ?? sampleReports[0],
    [sampleKey],
  );
  const designerTemplate = useMemo(
    () => toDesignerTemplate(selected.template),
    [selected.template],
  );

  return (
    <Layout style={{ height: '100vh', minWidth: 900, background: '#eef1f5' }}>
      <Header
        style={{
          height: 42,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: '#f8fafc',
          borderBottom: '1px solid #cfd6df',
        }}
      >
        <Typography.Text strong style={{ minWidth: 142 }}>Report Samples</Typography.Text>
        <Select
          data-testid="sample-template-picker"
          value={sampleKey}
          onChange={setSampleKey}
          style={{ width: 260 }}
          options={sampleReports.map(report => ({ value: report.key, label: report.label }))}
        />
        <Typography.Text type="secondary">{selected.template.name}</Typography.Text>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {viewMode === 'preview' ? (
            <Button size="small" type="primary" onClick={() => setViewMode('designer')}>
              打开设计器
            </Button>
          ) : (
            <Button size="small" onClick={() => setViewMode('preview')}>
              返回预览
            </Button>
          )}
        </div>
      </Header>
      <Content style={{ minHeight: 0 }}>
        {viewMode === 'preview' ? (
          <Viewer template={selected.template} data={selected.data} />
        ) : (
          <Designer key={selected.key} template={designerTemplate} data={selected.data} />
        )}
      </Content>
    </Layout>
  );
}

export default App;

function toDesignerTemplate(template: ReportTemplateV2): ReportTemplate {
  return {
    id: template.id,
    name: template.name,
    version: '1.0',
    pages: template.pages.map(page => ({
      id: page.id,
      width: page.width,
      height: page.height,
      margins: page.margins,
      orientation: page.orientation,
      bands: page.bands.map(band => ({
        id: band.id,
        type: toDesignerBandType(band.type),
        height: band.height,
        components: band.components,
        dataSource: band.dataBand?.dataSourceId,
        groupField: band.group?.conditionExpression,
        sort: band.dataBand?.sort,
      })),
    })),
    dataSources: template.dataSources.map(source => ({
      id: source.id,
      name: source.name,
      type: 'json',
      schema: source.fields.map(field => ({
        name: field.name,
        type: field.type === 'null' ? 'string' : field.type,
        label: field.label,
      })),
    })),
    styles: template.styles.map(style => ({
      id: style.id,
      name: style.name,
      font: {
        family: 'Arial',
        size: 9,
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        color: '#1f2937',
        ...style.font,
      },
      border: {
        style: style.border?.style ?? 'none',
        width: style.border?.width ?? 0,
        color: style.border?.color ?? '#cfd6df',
        sides: {
          top: false,
          right: false,
          bottom: false,
          left: false,
          ...style.border?.sides,
        },
      },
      backgroundColor: style.backgroundColor,
    })),
    conditionalFormats: template.conditionalFormats,
  } as ReportTemplate;
}

function toDesignerBandType(type: ReportTemplateV2['pages'][number]['bands'][number]['type']): ReportTemplate['pages'][number]['bands'][number]['type'] {
  const supported = new Set([
    'reportTitle',
    'reportSummary',
    'pageHeader',
    'pageFooter',
    'header',
    'footer',
    'columnHeader',
    'columnFooter',
    'groupHeader',
    'groupFooter',
    'data',
    'child',
  ]);
  return supported.has(type) ? type as ReportTemplate['pages'][number]['bands'][number]['type'] : 'data';
}
