import React, { useEffect, useState } from 'react';
import { Button, InputNumber, Modal, Radio, Space } from 'antd';
import type { Margins, PageOrientation } from '@report-designer/core';
import { useDesignerStore } from '../../store/designer-store';

interface PageSetupDialogProps {
  open: boolean;
  onClose: () => void;
}

export const PageSetupDialog: React.FC<PageSetupDialogProps> = ({ open, onClose }) => {
  const page = useDesignerStore(s => s.template.pages.find(item => item.id === s.currentPageId) ?? s.template.pages[0]);
  const setPageSettings = useDesignerStore(s => s.setPageSettings);
  const [orientation, setOrientation] = useState<PageOrientation>(page?.orientation ?? 'portrait');
  const [width, setWidth] = useState(page?.width ?? 210);
  const [height, setHeight] = useState(page?.height ?? 297);
  const [margins, setMargins] = useState<Margins>(page?.margins ?? { top: 20, right: 20, bottom: 20, left: 20 });

  useEffect(() => {
    if (!open || !page) return;
    setOrientation(page.orientation);
    setWidth(page.width);
    setHeight(page.height);
    setMargins(page.margins);
  }, [open, page]);

  const handleOrientationChange = (next: PageOrientation) => {
    const shortSide = Math.min(width, height);
    const longSide = Math.max(width, height);
    setOrientation(next);
    setWidth(next === 'portrait' ? shortSide : longSide);
    setHeight(next === 'portrait' ? longSide : shortSide);
  };

  const handleMarginChange = (field: keyof Margins, value?: number | string | null) => {
    setMargins(current => ({ ...current, [field]: Number(value ?? current[field]) }));
  };

  const apply = () => {
    if (!page) return;
    setPageSettings(page.id, {
      orientation,
      width,
      height,
      margins,
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
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Radio.Group value={orientation} onChange={event => handleOrientationChange(event.target.value)}>
          <Radio.Button value="portrait">Portrait</Radio.Button>
          <Radio.Button value="landscape">Landscape</Radio.Button>
        </Radio.Group>
        <DialogNumberField label="Width" value={width} min={20} max={1000} onChange={value => setWidth(Number(value ?? width))} />
        <DialogNumberField label="Height" value={height} min={20} max={1000} onChange={value => setHeight(Number(value ?? height))} />
        <DialogNumberField label="Top" value={margins.top} min={0} max={100} onChange={value => handleMarginChange('top', value)} />
        <DialogNumberField label="Right" value={margins.right} min={0} max={100} onChange={value => handleMarginChange('right', value)} />
        <DialogNumberField label="Bottom" value={margins.bottom} min={0} max={100} onChange={value => handleMarginChange('bottom', value)} />
        <DialogNumberField label="Left" value={margins.left} min={0} max={100} onChange={value => handleMarginChange('left', value)} />
      </Space>
    </Modal>
  );
};

const DialogNumberField: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number | string | null) => void;
}> = ({ label, value, min, max, onChange }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '72px minmax(0, 1fr) 28px', alignItems: 'center', gap: 8 }}>
    <span>{label}</span>
    <InputNumber min={min} max={max} value={value} onChange={onChange} style={{ width: '100%' }} />
    <span style={{ color: '#666' }}>mm</span>
  </div>
);
