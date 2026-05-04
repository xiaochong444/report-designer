import React, { useEffect } from 'react';
import { Layout } from 'antd';
import type { ReportTemplate } from '@report-designer/core';
import { RibbonToolbar } from './RibbonToolbar';
import { Canvas } from './Canvas';
import { LeftPanel } from './LeftPanel';
import { PropertyEditor } from './PropertyEditor';
import { useDesignerStore } from '../store/designer-store';

const { Sider, Content } = Layout;

interface DesignerProps {
  /** Optional initial template to load */
  template?: ReportTemplate;
  /** Optional data to bind to the template */
  data?: Record<string, any[]>;
  className?: string;
}

export const Designer: React.FC<DesignerProps> = ({ template, data, className }) => {
  const loadTemplate = useDesignerStore(s => s.loadTemplate);
  const setDataSources = useDesignerStore(s => s.setDataSources);

  useEffect(() => {
    if (template) {
      loadTemplate(template);
    }
  }, [template, loadTemplate]);

  useEffect(() => {
    if (data) {
      setDataSources(data);
    }
  }, [data, setDataSources]);

  return (
    <Layout className={className} style={{ height: '100%', width: '100%' }}>
      {/* Ribbon toolbar */}
      <div style={{ padding: 0, background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}>
        <RibbonToolbar />
      </div>

      <Layout style={{ flex: 1, overflow: 'hidden' }}>
        {/* Left panel: Palette, Data, Tree */}
        <Sider width={260} theme="light" style={{ borderRight: '1px solid #e8e8e8', overflow: 'auto' }}>
          <LeftPanel />
        </Sider>

        {/* Canvas */}
        <Content style={{ overflow: 'hidden' }}>
          <Canvas />
        </Content>

        {/* Right panel: Property Editor */}
        <Sider width={280} theme="light" style={{ borderLeft: '1px solid #e8e8e8', overflow: 'auto' }}>
          <PropertyEditor />
        </Sider>
      </Layout>
    </Layout>
  );
};

export default Designer;
