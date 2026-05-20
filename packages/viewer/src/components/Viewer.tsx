import React, { useMemo, useState } from 'react';
import { Layout } from 'antd';
import { renderReport, type RenderReportOptions, type ReportTemplate } from '@report-designer/core';
import { ViewerToolbar } from './ViewerToolbar';
import { downloadPDF, exportToPDF, printReport } from '../export';
import { RenderDocumentView } from '../renderers/dom/RenderDocumentView';

const { Content } = Layout;

interface ViewerProps {
  template: ReportTemplate;
  data: Record<string, any[]>;
  className?: string;
  subreports?: RenderReportOptions['subreports'];
}

export const Viewer: React.FC<ViewerProps> = ({ template, data, className, subreports }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  const document = useMemo(
    () => renderReport(template, data, { subreports, mode: 'preview' }),
    [template, data, subreports],
  );
  const totalPages = document.pages.length;

  const handleExportPDF = async () => {
    const pdfDocument = renderReport(template, data, { subreports, mode: 'pdf' });
    const pdfBytes = await exportToPDF(pdfDocument);
    await downloadPDF(pdfBytes, 'report.pdf');
  };

  const handlePrint = () => {
    const printDocument = renderReport(template, data, { subreports, mode: 'print' });
    void printReport(printDocument);
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
        <RenderDocumentView document={document} zoom={zoom} currentPage={currentPage} />
      </Content>
    </Layout>
  );
};

export default Viewer;
