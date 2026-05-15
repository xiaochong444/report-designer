import { useCallback, useMemo, useState } from 'react';
import { Button, Layout, Select, Typography } from 'antd';
import type { ReportTemplate } from '@report-designer/core';
import { Designer, type DesignerLocale } from '@report-designer/designer';
import { Viewer } from '@report-designer/viewer';
import { sampleReports } from './templates';

const { Content, Header } = Layout;
type ViewMode = 'preview' | 'designer';

const exampleMessages: Record<DesignerLocale, {
  reportSamples: string;
  openDesigner: string;
  returnPreview: string;
}> = {
  'zh-CN': {
    reportSamples: '报表示例',
    openDesigner: '打开设计器',
    returnPreview: '返回预览',
  },
  'en-US': {
    reportSamples: 'Report Samples',
    openDesigner: 'Open Designer',
    returnPreview: 'Return to Preview',
  },
};

function App() {
  const [sampleKey, setSampleKey] = useState(sampleReports[0].key);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [locale, setLocale] = useState<DesignerLocale>('zh-CN');
  const [designerDrafts, setDesignerDrafts] = useState<Record<string, ReportTemplate>>({});
  const [previewDrafts, setPreviewDrafts] = useState<Record<string, ReportTemplate>>({});
  const labels = exampleMessages[locale];
  const selected = useMemo(
    () => sampleReports.find(report => report.key === sampleKey) ?? sampleReports[0],
    [sampleKey],
  );
  const previewTemplate = previewDrafts[selected.key] ?? selected.template;
  const designerTemplate = useMemo(() => designerDrafts[selected.key] ?? previewTemplate, [designerDrafts, previewTemplate, selected.key]);
  const handleDesignerTemplateChange = useCallback((next: ReportTemplate) => {
    setDesignerDrafts(current => (
      current[selected.key] === next ? current : { ...current, [selected.key]: next }
    ));
    setPreviewDrafts(current => ({
      ...current,
      [selected.key]: next,
    }));
  }, [selected.key]);

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
        <Typography.Text strong style={{ minWidth: 92 }}>{labels.reportSamples}</Typography.Text>
        <Select
          data-testid="sample-template-picker"
          value={sampleKey}
          onChange={setSampleKey}
          style={{ width: 260 }}
          options={sampleReports.map(report => ({ value: report.key, label: report.label }))}
        />
        <Typography.Text type="secondary">{previewTemplate.name}</Typography.Text>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <div data-testid="example-locale-picker">
            <Select
              value={locale}
              onChange={(value: DesignerLocale) => setLocale(value)}
              style={{ width: 126 }}
              virtual={false}
              options={[
                { value: 'zh-CN', label: '中文' },
                { value: 'en-US', label: 'English' },
              ]}
            />
          </div>
          {viewMode === 'preview' ? (
            <Button size="small" type="primary" onClick={() => setViewMode('designer')}>
              {labels.openDesigner}
            </Button>
          ) : (
            <Button size="small" onClick={() => setViewMode('preview')}>
              {labels.returnPreview}
            </Button>
          )}
        </div>
      </Header>
      <Content style={{ minHeight: 0 }}>
        {viewMode === 'preview' ? (
          <Viewer template={previewTemplate} data={selected.data} subreports={'subreports' in selected ? selected.subreports : undefined} />
        ) : (
          <Designer
            key={selected.key}
            template={designerTemplate}
            data={selected.data}
            locale={locale}
            onTemplateChange={handleDesignerTemplateChange}
          />
        )}
      </Content>
    </Layout>
  );
}

export default App;
