import { useCallback, useMemo, useState } from 'react';
import { Button, Layout, Select, Typography } from 'antd';
import type { ReportTemplate } from '@report-designer/core';
import { Designer } from '@report-designer/designer';
import { Viewer } from '@report-designer/viewer';
import { sampleReports } from './templates';

const { Content, Header } = Layout;
type ViewMode = 'preview' | 'designer';

function App() {
  const [sampleKey, setSampleKey] = useState(sampleReports[0].key);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [designerDrafts, setDesignerDrafts] = useState<Record<string, ReportTemplate>>({});
  const [previewDrafts, setPreviewDrafts] = useState<Record<string, ReportTemplate>>({});
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
        <Typography.Text strong style={{ minWidth: 142 }}>Report Samples</Typography.Text>
        <Select
          data-testid="sample-template-picker"
          value={sampleKey}
          onChange={setSampleKey}
          style={{ width: 260 }}
          options={sampleReports.map(report => ({ value: report.key, label: report.label }))}
        />
        <Typography.Text type="secondary">{previewTemplate.name}</Typography.Text>
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
          <Viewer template={previewTemplate} data={selected.data} />
        ) : (
          <Designer
            key={selected.key}
            template={designerTemplate}
            data={selected.data}
            onTemplateChange={handleDesignerTemplateChange}
          />
        )}
      </Content>
    </Layout>
  );
}

export default App;
