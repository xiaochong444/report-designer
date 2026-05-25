import React from 'react';
import { AimOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { Alert, Button, Drawer, Flex, Radio, Tag, Tooltip, Typography } from 'antd';
import type { EventLogEntry } from '@report-designer/core';

interface EventLogPanelProps {
  open: boolean;
  logs: EventLogEntry[];
  onClose: () => void;
  onSelect?: (entry: EventLogEntry) => void;
  onClear?: () => void;
  onExport?: (logs: EventLogEntry[]) => void;
}

const ownerLabel: Record<EventLogEntry['ownerType'], string> = {
  report: 'Report',
  band: 'Band',
  component: 'Component',
};

const tagColor: Record<EventLogEntry['level'], string> = {
  info: 'blue',
  warning: 'gold',
  error: 'red',
};

export const EventLogPanel: React.FC<EventLogPanelProps> = ({
  logs,
  onClear,
  onClose,
  onExport,
  onSelect,
  open,
}) => {
  const [levelFilter, setLevelFilter] = React.useState<EventLogEntry['level'] | 'all'>('all');
  const filteredLogs = levelFilter === 'all' ? logs : logs.filter(entry => entry.level === levelFilter);

  return (
    <Drawer
      title="Event Logs"
      open={open}
      onClose={onClose}
      size={420}
      placement="right"
    >
      <Flex vertical gap={12}>
        <Flex wrap gap={8} align="center" justify="space-between">
          <Radio.Group
            size="small"
            optionType="button"
            buttonStyle="solid"
            value={levelFilter}
            onChange={event => setLevelFilter(event.target.value)}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Info', value: 'info' },
              { label: 'Warning', value: 'warning' },
              { label: 'Error', value: 'error' },
            ]}
          />
          <Flex gap={6}>
            {onExport ? (
              <Tooltip title="Export Event Logs">
                <Button
                  aria-label="Export Event Logs"
                  size="small"
                  icon={<DownloadOutlined />}
                  disabled={filteredLogs.length === 0}
                  onClick={() => onExport(filteredLogs)}
                />
              </Tooltip>
            ) : null}
            {onClear ? (
              <Tooltip title="Clear Event Logs">
                <Button
                  aria-label="Clear Event Logs"
                  size="small"
                  icon={<DeleteOutlined />}
                  disabled={logs.length === 0}
                  onClick={onClear}
                />
              </Tooltip>
            ) : null}
          </Flex>
        </Flex>
        {filteredLogs.length === 0 ? (
          <Alert type="info" title="No event logs" />
        ) : (
          <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredLogs.map((entry, index) => (
              <div
                key={`${entry.timestamp}-${entry.ownerType}-${entry.ownerId}-${entry.eventName}-${index}`}
                role="listitem"
                style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}
              >
                <Flex vertical gap={4} style={{ width: '100%' }}>
                  <Flex wrap gap={6} align="center" justify="space-between">
                    <Flex wrap gap={6} align="center">
                      <Tag color={tagColor[entry.level]}>{entry.level.toUpperCase()}</Tag>
                      <Typography.Text type="secondary">
                        {ownerLabel[entry.ownerType]} {entry.ownerId}
                      </Typography.Text>
                      <Typography.Text type="secondary">{entry.eventName}</Typography.Text>
                      {entry.line ? (
                        <Typography.Text type="secondary">
                          Line {entry.line}{entry.column ? `:${entry.column}` : ''}
                        </Typography.Text>
                      ) : null}
                    </Flex>
                    {onSelect ? (
                      <Tooltip title="Open Event">
                        <Button
                          aria-label="Open Event"
                          size="small"
                          icon={<AimOutlined />}
                          onClick={() => onSelect(entry)}
                        />
                      </Tooltip>
                    ) : null}
                  </Flex>
                  <Typography.Text>{entry.message}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {entry.timestamp}
                  </Typography.Text>
                  {entry.stackExcerpt ? (
                    <Typography.Text code style={{ whiteSpace: 'pre-wrap' }}>
                      {entry.stackExcerpt}
                    </Typography.Text>
                  ) : null}
                </Flex>
              </div>
            ))}
          </div>
        )}
      </Flex>
    </Drawer>
  );
};
