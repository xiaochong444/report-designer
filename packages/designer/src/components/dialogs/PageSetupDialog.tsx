import React, { useState } from 'react';
import { Button, InputNumber, Modal, Radio, Space } from 'antd';
import type { PageOrientation } from '@report-designer/core';
import { useDesignerStore } from '../../store/designer-store';

interface PageSetupDialogProps {
  open: boolean;
  onClose: () => void;
}

export const PageSetupDialog: React.FC<PageSetupDialogProps> = ({ open, onClose }) => {
  const page = useDesignerStore(s => s.template.pages.find(item => item.id === s.currentPageId) ?? s.template.pages[0]);
  const setPageSettings = useDesignerStore(s => s.setPageSettings);
  const [orientation, setOrientation] = useState<PageOrientation>(page?.orientation ?? 'portrait');
  const [margin, setMargin] = useState(page?.margins.top ?? 20);

  const apply = () => {
    if (!page) return;
    setPageSettings(page.id, {
      orientation,
      width: orientation === 'portrait' ? 210 : 297,
      height: orientation === 'portrait' ? 297 : 210,
      margins: { top: margin, right: margin, bottom: margin, left: margin },
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Page Setup"
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button key="apply" type="primary" onClick={apply}>Apply</Button>,
      ]}
    >
      <Space orientation="vertical" size={16}>
        <Radio.Group value={orientation} onChange={event => setOrientation(event.target.value)}>
          <Radio.Button value="portrait">Portrait</Radio.Button>
          <Radio.Button value="landscape">Landscape</Radio.Button>
        </Radio.Group>
        <InputNumber addonBefore="Margins" addonAfter="mm" min={0} max={50} value={margin} onChange={value => setMargin(value ?? 0)} />
      </Space>
    </Modal>
  );
};
