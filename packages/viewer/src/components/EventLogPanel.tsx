import React from 'react';
import { Alert, Drawer, Flex, Tag, Typography } from 'antd';
import type { EventLogEntry } from '@report-designer/core';

interface EventLogPanelProps {
  open: boolean;
  logs: EventLogEntry[];
  onClose: () => void;
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

export const EventLogPanel: React.FC<EventLogPanelProps> = ({ logs, onClose, open }) => (
  <Drawer
    title="Event Logs"
    open={open}
    onClose={onClose}
    size={420}
    placement="right"
  >
    {logs.length === 0 ? (
      <Alert type="info" message="No event logs" />
    ) : (
      <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {logs.map((entry, index) => (
          <div
            key={`${entry.timestamp}-${entry.ownerType}-${entry.ownerId}-${entry.eventName}-${index}`}
            role="listitem"
            style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}
          >
            <Flex vertical gap={4} style={{ width: '100%' }}>
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
  </Drawer>
);
