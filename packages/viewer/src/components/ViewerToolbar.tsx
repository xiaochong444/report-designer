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
} from '@ant-design/icons';

interface ViewerToolbarProps {
  currentPage: number;
  totalPages: number;
  zoom: number;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onPrint: () => void;
  onExportPDF: () => void;
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  currentPage,
  totalPages,
  zoom,
  onPageChange,
  onZoomChange,
  onPrint,
  onExportPDF,
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
        <Tooltip title="Print">
          <Button aria-label="Print" icon={<PrinterOutlined />} size="small" onClick={onPrint} />
        </Tooltip>
        <Tooltip title="Export PDF">
          <Button aria-label="Export PDF" icon={<DownloadOutlined />} size="small" onClick={onExportPDF} />
        </Tooltip>
      </Space>

      <div style={{ borderLeft: '1px solid #e8e8e8', height: 20 }} />

      <Space>
        <Tooltip title="Previous Page">
          <Button
            icon={<LeftOutlined />}
            size="small"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          />
        </Tooltip>
        <Select
          size="small"
          value={currentPage}
          style={{ width: 80 }}
          onChange={onPageChange}
          options={Array.from({ length: totalPages }, (_, i) => ({
            value: i + 1,
            label: `${i + 1} / ${totalPages}`,
          }))}
        />
        <Tooltip title="Next Page">
          <Button
            icon={<RightOutlined />}
            size="small"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          />
        </Tooltip>
      </Space>

      <div style={{ borderLeft: '1px solid #e8e8e8', height: 20 }} />

      <Space>
        <Tooltip title="Zoom Out">
          <Button
            icon={<ZoomOutOutlined />}
            size="small"
            disabled={zoom <= 50}
            onClick={() => onZoomChange(zoom - 25)}
          />
        </Tooltip>
        <span style={{ fontSize: 12, minWidth: 40, textAlign: 'center' }}>
          {zoom}%
        </span>
        <Tooltip title="Zoom In">
          <Button
            icon={<ZoomInOutlined />}
            size="small"
            disabled={zoom >= 300}
            onClick={() => onZoomChange(zoom + 25)}
          />
        </Tooltip>
      </Space>

      <div style={{ flex: 1 }} />

      <Tooltip title="Fullscreen">
        <Button icon={<FullscreenOutlined />} size="small" />
      </Tooltip>
    </div>
  );
};
