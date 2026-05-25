import React, { useMemo } from 'react';
import { Button, Space, Select, Tooltip } from 'antd';
import {
  PrinterOutlined,
  DownloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  LeftOutlined,
  RightOutlined,
  BugOutlined,
} from '@ant-design/icons';
import type { ViewerMessages } from '../i18n';

interface ViewerToolbarProps {
  currentPage: number;
  totalPages: number;
  zoom: number;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onPrint: () => void;
  onExportPDF: () => void;
  eventLogCount?: number;
  onShowEventLogs?: () => void;
  messages: ViewerMessages;
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  currentPage,
  totalPages,
  zoom,
  onPageChange,
  onZoomChange,
  onPrint,
  onExportPDF,
  eventLogCount = 0,
  messages,
  onShowEventLogs,
}) => {
  return (
    <div style={{
      padding: '4px 12px',
      background: '#fafafa',
      borderBottom: '1px solid #e8e8e8',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <Space>
        <Tooltip title={messages.print}>
          <Button aria-label={messages.print} icon={<PrinterOutlined />} size="small" onClick={onPrint} />
        </Tooltip>
        <Tooltip title={messages.exportPdf}>
          <Button aria-label={messages.exportPdf} icon={<DownloadOutlined />} size="small" onClick={onExportPDF} />
        </Tooltip>
      </Space>

      <div style={{ borderLeft: '1px solid #e8e8e8', height: 20 }} />

      <Space>
        <Tooltip title={messages.previousPage}>
          <Button
            aria-label={messages.previousPage}
            icon={<LeftOutlined />}
            size="small"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          />
        </Tooltip>
        <Select
          aria-label={messages.currentPage}
          size="small"
          value={currentPage}
          style={{ width: 80 }}
          onChange={onPageChange}
          options={Array.from({ length: totalPages }, (_, i) => ({
            value: i + 1,
            label: `${i + 1} / ${totalPages}`,
          }))}
        />
        <Tooltip title={messages.nextPage}>
          <Button
            aria-label={messages.nextPage}
            icon={<RightOutlined />}
            size="small"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          />
        </Tooltip>
      </Space>

      <div style={{ borderLeft: '1px solid #e8e8e8', height: 20 }} />

      <Space>
        <Tooltip title={messages.zoomOut}>
          <Button
            aria-label={messages.zoomOut}
            icon={<ZoomOutOutlined />}
            size="small"
            disabled={zoom <= 50}
            onClick={() => onZoomChange(zoom - 25)}
          />
        </Tooltip>
        <span style={{ fontSize: 12, minWidth: 40, textAlign: 'center' }}>
          {zoom}%
        </span>
        <Tooltip title={messages.zoomIn}>
          <Button
            aria-label={messages.zoomIn}
            icon={<ZoomInOutlined />}
            size="small"
            disabled={zoom >= 300}
            onClick={() => onZoomChange(zoom + 25)}
          />
        </Tooltip>
      </Space>

      <div style={{ flex: 1 }} />

      {eventLogCount > 0 ? (
        <Tooltip title={messages.eventLogs}>
          <Button
            aria-label={messages.eventLogs}
            icon={<BugOutlined />}
            size="small"
            onClick={onShowEventLogs}
          >
            {eventLogCount}
          </Button>
        </Tooltip>
      ) : null}

      <Tooltip title={messages.fullscreen}>
        <Button aria-label={messages.fullscreen} icon={<FullscreenOutlined />} size="small" />
      </Tooltip>
    </div>
  );
};
