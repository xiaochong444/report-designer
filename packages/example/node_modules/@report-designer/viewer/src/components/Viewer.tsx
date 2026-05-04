import React, { useState, useMemo } from 'react';
import { Layout } from 'antd';
import type { ReportTemplate, PaginatedPage } from '@report-designer/core';
import { paginate } from '@report-designer/core';
import { ViewerToolbar } from './ViewerToolbar';
import { exportToPDF, printReport, downloadPDF } from '../export';

const { Content } = Layout;

/** Convert mm to pixels (96 DPI: 1mm = 3.78px) */
const MM_TO_PX = 3.78;

interface ViewerProps {
  template: ReportTemplate;
  data: Record<string, any[]>;
  className?: string;
}

export const Viewer: React.FC<ViewerProps> = ({ template, data, className }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  const paginatedPages = useMemo(
    () => paginate(template, data),
    [template, data],
  );

  const totalPages = paginatedPages.length;
  const currentPaginatedPage = paginatedPages.find(p => p.pageNumber === currentPage);

  const handleExportPDF = async () => {
    const pdfBytes = await exportToPDF(paginatedPages);
    await downloadPDF(pdfBytes, 'report.pdf');
  };

  return (
    <Layout className={className} style={{ height: '100%', width: '100%' }}>
      {/* Toolbar */}
      <div style={{ background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}>
        <ViewerToolbar
          currentPage={currentPage}
          totalPages={totalPages}
          zoom={zoom}
          onPageChange={setCurrentPage}
          onZoomChange={setZoom}
          onPrint={printReport}
          onExportPDF={handleExportPDF}
        />
      </div>

      {/* Page preview */}
      <Content style={{ overflow: 'auto', backgroundColor: '#e8e8e8', padding: 24 }}>
        {currentPaginatedPage && (
          <PagePreview
            page={currentPaginatedPage}
            zoom={zoom}
          />
        )}
      </Content>
    </Layout>
  );
};

interface PagePreviewProps {
  page: PaginatedPage;
  zoom: number;
}

const PagePreview: React.FC<PagePreviewProps> = ({ page, zoom }) => {
  const scale = zoom / 100;
  const pxWidth = page.width * MM_TO_PX * scale;
  const pxHeight = page.height * MM_TO_PX * scale;

  return (
    <div style={{
      width: pxWidth,
      height: pxHeight,
      backgroundColor: 'white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      position: 'relative',
      margin: '0 auto',
    }}>
      {/* Page number */}
      <div style={{
        position: 'absolute',
        top: 4,
        right: 8,
        fontSize: 10 * scale,
        color: '#999',
      }}>
        Page {page.pageNumber}
      </div>

      {page.bands.map(band => (
        <div
          key={band.id}
          style={{
            position: 'absolute',
            left: band.absoluteX * MM_TO_PX * scale,
            top: band.absoluteY * MM_TO_PX * scale,
            width: (page.width - band.absoluteX * 2) * MM_TO_PX * scale,
            height: band.height * MM_TO_PX * scale,
            border: '1px dashed #eee',
            boxSizing: 'border-box',
          }}
        >
          {/* Band type label */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 50 * scale,
            height: '100%',
            backgroundColor: getBandColor(band.type),
            opacity: 0.3,
            fontSize: 8 * scale,
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            writingMode: 'vertical-rl',
          }}>
            {band.type}
          </div>

          {band.components.map(comp => (
            <div
              key={comp.id}
              style={{
                position: 'absolute',
                left: comp.absoluteX * MM_TO_PX * scale,
                top: comp.absoluteY * MM_TO_PX * scale,
                width: comp.width * MM_TO_PX * scale,
                height: comp.height * MM_TO_PX * scale,
                overflow: 'hidden',
                padding: 2 * scale,
                fontSize: 11 * scale,
                boxSizing: 'border-box',
              }}
            >
              {comp.content || ''}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const BAND_COLORS: Record<string, string> = {
  reportTitle: '#8b4513',
  reportSummary: '#6b4423',
  pageHeader: '#2e7d32',
  pageFooter: '#1565c0',
  data: '#6a1b9a',
  groupHeader: '#00838f',
  groupFooter: '#4527a0',
  child: '#ad1457',
};

function getBandColor(type: string): string {
  return BAND_COLORS[type] || '#757575';
}
