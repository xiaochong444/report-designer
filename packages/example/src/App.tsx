import { useCallback, useMemo, useState } from 'react';
import { Button, Layout, Select, Typography } from 'antd';
import { renderReport, type EventLogEntry, type ReportTemplate } from '@report-designer/core';
import { Designer, type DesignerEventNavigationTarget, type DesignerLocale } from '@report-designer/designer';
import { printReport, Viewer } from '@report-designer/viewer';
import { sampleReports } from './templates';

const { Content, Header } = Layout;
type ViewMode = 'preview' | 'designer';

const exampleMessages: Record<DesignerLocale, {
  reportSamples: string;
  openDesigner: string;
  returnPreview: string;
  silentPrint: string;
  silentPrintSent: string;
  silentPrintFailed: string;
  pdfPrintValidation: string;
  pdfPrintValidationSent: string;
  pdfPrintValidationFailed: string;
}> = {
  'zh-CN': {
    reportSamples: '报表示例',
    openDesigner: '打开设计器',
    returnPreview: '返回预览',
    silentPrint: '静默打印测试',
    silentPrintSent: '已发送给本机打印 Host',
    silentPrintFailed: '静默打印失败',
    pdfPrintValidation: 'PDF 打印验证',
    pdfPrintValidationSent: '已打开 PDF 保存窗口',
    pdfPrintValidationFailed: 'PDF 打印验证失败',
  },
  'en-US': {
    reportSamples: 'Report Samples',
    openDesigner: 'Open Designer',
    returnPreview: 'Return to Preview',
    silentPrint: 'Silent Print Test',
    silentPrintSent: 'Sent to local print host',
    silentPrintFailed: 'Silent print failed',
    pdfPrintValidation: 'PDF Print Validation',
    pdfPrintValidationSent: 'PDF save window opened',
    pdfPrintValidationFailed: 'PDF print validation failed',
  },
};

function App() {
  const [sampleKey, setSampleKey] = useState(sampleReports[0].key);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [locale, setLocale] = useState<DesignerLocale>('zh-CN');
  const [eventNavigationTarget, setEventNavigationTarget] = useState<DesignerEventNavigationTarget | undefined>();
  const [designerDrafts, setDesignerDrafts] = useState<Record<string, ReportTemplate>>({});
  const [previewDrafts, setPreviewDrafts] = useState<Record<string, ReportTemplate>>({});
  const [silentPrintStatus, setSilentPrintStatus] = useState('');
  const [silentPrintLoading, setSilentPrintLoading] = useState(false);
  const [pdfPrintStatus, setPdfPrintStatus] = useState('');
  const [pdfPrintLoading, setPdfPrintLoading] = useState(false);
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
  const handleEventLogSelect = useCallback((entry: EventLogEntry) => {
    setEventNavigationTarget({
      ownerType: entry.ownerType,
      ownerId: entry.ownerId,
      eventName: entry.eventName,
      line: entry.line,
      column: entry.column,
      nonce: Date.now(),
    });
    setViewMode('designer');
  }, []);
  const handleSilentPrint = useCallback(async () => {
    setSilentPrintLoading(true);
    setSilentPrintStatus('');
    try {
      const printDocument = renderReport(previewTemplate, selected.data, {
        subreports: 'subreports' in selected ? selected.subreports : undefined,
        mode: 'print',
      });
      await printReport(printDocument, {
        adapter: 'chrome-extension',
        chromeExtension: {
          backend: 'nativeMessaging',
          jobName: previewTemplate.name,
          silent: true,
        },
      });
      setSilentPrintStatus(labels.silentPrintSent);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSilentPrintStatus(`${labels.silentPrintFailed}: ${message}`);
    } finally {
      setSilentPrintLoading(false);
    }
  }, [labels.silentPrintFailed, labels.silentPrintSent, previewTemplate, selected]);
  const handlePdfPrintValidation = useCallback(async () => {
    setPdfPrintLoading(true);
    setPdfPrintStatus('');
    try {
      const printDocument = renderReport(previewTemplate, selected.data, {
        subreports: 'subreports' in selected ? selected.subreports : undefined,
        mode: 'print',
      });
      await printReport(printDocument, {
        adapter: 'chrome-extension',
        chromeExtension: {
          backend: 'nativeMessaging',
          jobName: previewTemplate.name,
          printerId: 'Microsoft Print to PDF',
          silent: false,
        },
      });
      setPdfPrintStatus(labels.pdfPrintValidationSent);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPdfPrintStatus(`${labels.pdfPrintValidationFailed}: ${message}`);
    } finally {
      setPdfPrintLoading(false);
    }
  }, [labels.pdfPrintValidationFailed, labels.pdfPrintValidationSent, previewTemplate, selected]);

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
          {viewMode === 'preview' ? (
            <>
              {silentPrintStatus ? (
                <Typography.Text
                  type={silentPrintStatus.startsWith(labels.silentPrintFailed) ? 'danger' : 'success'}
                  style={{ fontSize: 12, maxWidth: 220 }}
                  ellipsis
                >
                  {silentPrintStatus}
                </Typography.Text>
              ) : null}
              {pdfPrintStatus ? (
                <Typography.Text
                  type={pdfPrintStatus.startsWith(labels.pdfPrintValidationFailed) ? 'danger' : 'success'}
                  style={{ fontSize: 12, maxWidth: 220 }}
                  ellipsis
                >
                  {pdfPrintStatus}
                </Typography.Text>
              ) : null}
              <Button
                data-testid="silent-print-demo-button"
                size="small"
                loading={silentPrintLoading}
                onClick={() => void handleSilentPrint()}
              >
                {labels.silentPrint}
              </Button>
              <Button
                data-testid="pdf-print-validation-button"
                size="small"
                loading={pdfPrintLoading}
                onClick={() => void handlePdfPrintValidation()}
              >
                {labels.pdfPrintValidation}
              </Button>
            </>
          ) : null}
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
          <Viewer
            template={previewTemplate}
            data={selected.data}
            subreports={'subreports' in selected ? selected.subreports : undefined}
            locale={locale}
            onEventLogSelect={handleEventLogSelect}
          />
        ) : (
          <Designer
            key={selected.key}
            template={designerTemplate}
            data={selected.data}
            subreports={'subreports' in selected ? selected.subreports : undefined}
            locale={locale}
            eventNavigationTarget={eventNavigationTarget}
            onTemplateChange={handleDesignerTemplateChange}
          />
        )}
      </Content>
    </Layout>
  );
}

export default App;
