import React, { useEffect, useState } from 'react';
import { Button, InputNumber, Modal, Radio, Select, Space } from 'antd';
import type { Margins, PageOrientation } from '@report-designer/core';
import { useDesignerStore } from '../../store/designer-store';
import {
  detectPaperType,
  formatUnitValue,
  getPaperPresetSize,
  getUnitStep,
  parseUnitValue,
  PAPER_PRESETS,
  type PaperType,
} from '../../page-settings';

interface PageSetupDialogProps {
  open: boolean;
  onClose: () => void;
}

export const PageSetupDialog: React.FC<PageSetupDialogProps> = ({ open, onClose }) => {
  const page = useDesignerStore(s => s.template.pages.find(item => item.id === s.currentPageId) ?? s.template.pages[0]);
  const setPageSettings = useDesignerStore(s => s.setPageSettings);
  const reportUnit = useDesignerStore(s => s.reportUnit);
  const setReportUnit = useDesignerStore(s => s.setReportUnit);
  const [orientation, setOrientation] = useState<PageOrientation>(page?.orientation ?? 'portrait');
  const [width, setWidth] = useState(page?.width ?? 210);
  const [height, setHeight] = useState(page?.height ?? 297);
  const [margins, setMargins] = useState<Margins>(page?.margins ?? { top: 20, right: 20, bottom: 20, left: 20 });
  const [paperType, setPaperType] = useState<PaperType>(page ? detectPaperType(page.width, page.height) : 'A4');

  useEffect(() => {
    if (!open || !page) return;
    setOrientation(page.orientation);
    setWidth(page.width);
    setHeight(page.height);
    setMargins(page.margins);
    setPaperType(detectPaperType(page.width, page.height));
  }, [open, page]);

  const handleOrientationChange = (next: PageOrientation) => {
    setOrientation(next);
    if (paperType !== 'Custom') {
      const nextSize = getPaperPresetSize(paperType, next, width, height);
      setWidth(nextSize.width);
      setHeight(nextSize.height);
      return;
    }

    const shortSide = Math.min(width, height);
    const longSide = Math.max(width, height);
    setWidth(next === 'portrait' ? shortSide : longSide);
    setHeight(next === 'portrait' ? longSide : shortSide);
  };

  const handleMarginChange = (field: keyof Margins, value?: number | string | null) => {
    setMargins(current => ({ ...current, [field]: parseUnitValue(value, reportUnit, current[field]) }));
  };

  const handlePaperTypeChange = (value: PaperType) => {
    setPaperType(value);
    if (value === 'Custom') {
      return;
    }
    const nextSize = getPaperPresetSize(value, orientation, width, height);
    setWidth(nextSize.width);
    setHeight(nextSize.height);
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

  const unitStep = getUnitStep(reportUnit);
  const sizeMin = formatUnitValue(20, reportUnit);
  const sizeMax = formatUnitValue(1000, reportUnit);
  const marginMax = formatUnitValue(100, reportUnit);

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
        <DialogSelectField
          label="Paper type"
          ariaLabel="Paper type"
          value={paperType}
          options={[
            ...PAPER_PRESETS.map((item) => ({ value: item.value, label: item.label })),
            { value: 'Custom', label: 'Custom' },
          ]}
          onChange={handlePaperTypeChange}
        />
        <DialogSelectField
          label="Report unit"
          ariaLabel="Report unit"
          value={reportUnit}
          options={[
            { value: 'mm', label: 'Millimeter' },
            { value: 'cm', label: 'Centimeter' },
          ]}
          onChange={setReportUnit}
        />
        <Radio.Group value={orientation} onChange={event => handleOrientationChange(event.target.value)}>
          <Radio.Button value="portrait">Portrait</Radio.Button>
          <Radio.Button value="landscape">Landscape</Radio.Button>
        </Radio.Group>
        <DialogNumberField label="Width" value={formatUnitValue(width, reportUnit)} min={sizeMin} max={sizeMax} step={unitStep} disabled={paperType !== 'Custom'} onChange={value => setWidth(parseUnitValue(value, reportUnit, width))} />
        <DialogNumberField label="Height" value={formatUnitValue(height, reportUnit)} min={sizeMin} max={sizeMax} step={unitStep} disabled={paperType !== 'Custom'} onChange={value => setHeight(parseUnitValue(value, reportUnit, height))} />
        <DialogNumberField label="Top" value={formatUnitValue(margins.top, reportUnit)} min={0} max={marginMax} step={unitStep} onChange={value => handleMarginChange('top', value)} />
        <DialogNumberField label="Right" value={formatUnitValue(margins.right, reportUnit)} min={0} max={marginMax} step={unitStep} onChange={value => handleMarginChange('right', value)} />
        <DialogNumberField label="Bottom" value={formatUnitValue(margins.bottom, reportUnit)} min={0} max={marginMax} step={unitStep} onChange={value => handleMarginChange('bottom', value)} />
        <DialogNumberField label="Left" value={formatUnitValue(margins.left, reportUnit)} min={0} max={marginMax} step={unitStep} onChange={value => handleMarginChange('left', value)} />
      </Space>
    </Modal>
  );
};

const DialogNumberField: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onChange: (value: number | string | null) => void;
}> = ({ label, value, min, max, step, disabled, onChange }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '72px minmax(0, 1fr)', alignItems: 'center', gap: 8 }}>
    <span>{label}</span>
    <InputNumber min={min} max={max} step={step} disabled={disabled} value={value} onChange={onChange} style={{ width: '100%' }} />
  </div>
);

const DialogSelectField: React.FC<{
  label: string;
  ariaLabel: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: any) => void;
}> = ({ label, ariaLabel, value, options, onChange }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '72px minmax(0, 1fr)', alignItems: 'center', gap: 8 }}>
    <span>{label}</span>
    <Select aria-label={ariaLabel} value={value} options={options} virtual={false} onChange={onChange} />
  </div>
);
