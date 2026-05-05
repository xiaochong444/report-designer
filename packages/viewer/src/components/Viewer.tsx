import React, { useMemo, useState } from 'react';
import { Layout } from 'antd';
import type { ReportTemplate, ReportTemplateV2 } from '@report-designer/core';
import { migrateV1ToV2, renderReportV2 } from '@report-designer/core';
import { ViewerToolbar } from './ViewerToolbar';
import { downloadPDF, exportToPDF, printReport } from '../export';
import { RenderDocumentView } from '../renderers/dom/RenderDocumentView';

const { Content } = Layout;

interface ViewerProps {
  template: ReportTemplate | ReportTemplateV2;
  data: Record<string, any[]>;
  className?: string;
}

export const Viewer: React.FC<ViewerProps> = ({ template, data, className }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  const templateV2 = useMemo(
    () => template.version === '2.0' ? template as ReportTemplateV2 : migrateV1ToV2(template as ReportTemplate),
    [template],
  );
  const document = useMemo(
    () => renderReportV2(templateV2, data),
    [templateV2, data],
  );
  const totalPages = document.pages.length;

  const handleExportPDF = async () => {
    const pdfBytes = await exportToPDF(document);
    await downloadPDF(pdfBytes, 'report.pdf');
  };

  const handlePrint = () => {
    void printReport(document);
  };

  return (
    <Layout className={className} style={{ height: '100%', width: '100%' }}>
      <div style={{ background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}>
        <ViewerToolbar
          currentPage={currentPage}
          totalPages={totalPages}
          zoom={zoom}
          onPageChange={setCurrentPage}
          onZoomChange={setZoom}
          onPrint={handlePrint}
          onExportPDF={handleExportPDF}
        />
      </div>

      <Content style={{ overflow: 'auto', backgroundColor: '#e8e8e8', padding: 24 }}>
        <RenderDocumentView document={document} zoom={zoom} />
      </Content>
    </Layout>
  );
};

export default Viewer;
