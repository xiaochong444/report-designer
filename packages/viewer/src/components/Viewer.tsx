import React, { useMemo, useState } from 'react';
import { Layout } from 'antd';
import { renderReport, type EventLogEntry, type RenderReportOptions, type ReportTemplate } from '@report-designer/core';
import { ViewerToolbar } from './ViewerToolbar';
import { downloadPDF, exportToPDF, printReport, type PrintReportOptions } from '../export';
import { RenderDocumentView } from '../renderers/dom/RenderDocumentView';
import { EventLogPanel } from './EventLogPanel';
import { getViewerMessages, type ViewerLocale } from '../i18n';

const { Content } = Layout;

interface ViewerProps {
  template: ReportTemplate;
  data: Record<string, any[]>;
  className?: string;
  subreports?: RenderReportOptions['subreports'];
  expressionVariables?: RenderReportOptions['expressionVariables'];
  expressionFunctions?: RenderReportOptions['expressionFunctions'];
  printOptions?: PrintReportOptions;
  onEventLogSelect?: (entry: EventLogEntry) => void;
  onEventLogsClear?: () => void;
  onEventLogsExport?: (logs: EventLogEntry[]) => void;
  locale?: ViewerLocale;
}

export const Viewer: React.FC<ViewerProps> = ({
  template,
  data,
  className,
  locale = 'en-US',
  onEventLogSelect,
  onEventLogsClear,
  onEventLogsExport,
  subreports,
  expressionVariables,
  expressionFunctions,
  printOptions,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [eventLogOpen, setEventLogOpen] = useState(false);
  const [eventLogsCleared, setEventLogsCleared] = useState(false);
  const [outputEventLogs, setOutputEventLogs] = useState<EventLogEntry[]>([]);
  const previewScrollRef = React.useRef<HTMLElement | null>(null);
  const messages = getViewerMessages(locale);

  const document = useMemo(
    () => renderReport(template, data, { subreports, expressionVariables, expressionFunctions, mode: 'preview' }),
    [template, data, subreports, expressionVariables, expressionFunctions],
  );
  const totalPages = document.pages.length;
  const eventLogs = eventLogsCleared ? [] : [...(document.eventLogs ?? []), ...outputEventLogs];

  React.useEffect(() => {
    setEventLogsCleared(false);
    setOutputEventLogs([]);
  }, [document]);

  const handleExportPDF = async () => {
    const pdfDocument = renderReport(template, data, { subreports, expressionVariables, expressionFunctions, mode: 'pdf' });
    setEventLogsCleared(false);
    setOutputEventLogs(pdfDocument.eventLogs ?? []);
    const pdfBytes = await exportToPDF(pdfDocument);
    await downloadPDF(pdfBytes, 'report.pdf');
  };

  const handlePrint = () => {
    const printDocument = renderReport(template, data, { subreports, expressionVariables, expressionFunctions, mode: 'print' });
    setEventLogsCleared(false);
    setOutputEventLogs(printDocument.eventLogs ?? []);
    void printReport(printDocument, printOptions);
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
          eventLogCount={eventLogs.length}
          onShowEventLogs={() => setEventLogOpen(true)}
          messages={messages}
        />
      </div>

      <Content
        ref={previewScrollRef}
        data-testid="viewer-preview-scroll"
        style={{ overflow: 'auto', backgroundColor: '#e8e8e8', padding: 24 }}
      >
        <RenderDocumentView document={document} zoom={zoom} currentPage={currentPage} scrollContainerRef={previewScrollRef} />
      </Content>
      <EventLogPanel
        open={eventLogOpen}
        logs={eventLogs}
        onClose={() => setEventLogOpen(false)}
        onSelect={onEventLogSelect}
        onExport={onEventLogsExport}
        messages={messages}
        onClear={() => {
          setEventLogsCleared(true);
          onEventLogsClear?.();
        }}
      />
    </Layout>
  );
};

export default Viewer;
