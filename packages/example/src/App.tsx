import { useMemo, useState } from 'react';
import { Layout, Select, Typography } from 'antd';
import { Viewer } from '@report-designer/viewer';
import { sampleReports } from './templates';

const { Content, Header } = Layout;

function App() {
  const [sampleKey, setSampleKey] = useState(sampleReports[0].key);
  const selected = useMemo(
    () => sampleReports.find(report => report.key === sampleKey) ?? sampleReports[0],
    [sampleKey],
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
      </Header>
      <Content style={{ minHeight: 0 }}>
        <Viewer template={selected.template} data={selected.data} />
      </Content>
    </Layout>
  );
}

export default App;
