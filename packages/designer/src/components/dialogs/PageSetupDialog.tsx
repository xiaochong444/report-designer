import React, { useEffect, useState } from 'react';
import { Button, Checkbox, ColorPicker, Input, InputNumber, Modal, Radio, Segmented, Select, Space, Switch, Typography } from 'antd';
import { AlignCenterOutlined, AlignLeftOutlined, AlignRightOutlined, VerticalAlignBottomOutlined, VerticalAlignMiddleOutlined, VerticalAlignTopOutlined } from '@ant-design/icons';
import { createDefaultPageBorder, createDefaultPageWatermark, getReportFontOptions } from '@report-designer/core';
import type { Margins, PageBorder, PageOrientation, PageWatermark, ReportFontOption } from '@report-designer/core';
import { useDesignerStore } from '../../store/designer-store';
import { useDesignerI18n } from '../../i18n';
import {
  detectPaperType,
  formatUnitValue,
  getPaperPresetSize,
  getUnitStep,
  parseUnitValue,
  PAPER_PRESETS,
  type PaperType,
} from '../../page-settings';
import { FontEditor } from '../properties/FontEditor';

interface PageSetupDialogProps {
  open: boolean;
  onClose: () => void;
}

export const PageSetupDialog: React.FC<PageSetupDialogProps> = ({ open, onClose }) => {
  const { t } = useDesignerI18n();
  const template = useDesignerStore(s => s.template);
  const page = useDesignerStore(s => s.template.pages.find(item => item.id === s.currentPageId) ?? s.template.pages[0]);
  const setPageSettings = useDesignerStore(s => s.setPageSettings);
  const reportUnit = useDesignerStore(s => s.reportUnit);
  const setReportUnit = useDesignerStore(s => s.setReportUnit);
  const [orientation, setOrientation] = useState<PageOrientation>(page?.orientation ?? 'portrait');
  const [width, setWidth] = useState(page?.width ?? 210);
  const [height, setHeight] = useState(page?.height ?? 297);
  const [pageName, setPageName] = useState(page?.name ?? '');
  const [backgroundColor, setBackgroundColor] = useState(page?.backgroundColor ?? '#ffffff');
  const [watermark, setWatermark] = useState<PageWatermark>(page?.watermark ?? createDefaultPageWatermark());
  const [pageBorder, setPageBorder] = useState<PageBorder>(page?.pageBorder ?? createDefaultPageBorder());
  const [margins, setMargins] = useState<Margins>(page?.margins ?? { top: 20, right: 20, bottom: 20, left: 20 });
  const [paperType, setPaperType] = useState<PaperType>(page ? detectPaperType(page.width, page.height) : 'A4');

  useEffect(() => {
    if (!open || !page) return;
    setOrientation(page.orientation);
    setWidth(page.width);
    setHeight(page.height);
    setPageName(page.name ?? '');
    setBackgroundColor(page.backgroundColor ?? '#ffffff');
    setWatermark(page.watermark ?? createDefaultPageWatermark());
    setPageBorder(page.pageBorder ?? createDefaultPageBorder());
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
      name: pageName,
      backgroundColor,
      watermark,
      pageBorder,
      margins,
    });
    onClose();
  };

  const unitStep = getUnitStep(reportUnit);
  const sizeMin = formatUnitValue(20, reportUnit);
  const sizeMax = formatUnitValue(1000, reportUnit);
  const marginMax = formatUnitValue(100, reportUnit);
  const reportFontOptions = getReportFontOptions(template.fonts);

  return (
    <Modal
      open={open}
      title={t('pageSettings.title')}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>{t('common.cancel')}</Button>,
        <Button key="apply" type="primary" onClick={apply}>{t('common.apply')}</Button>,
      ]}
    >
      <div style={{ maxHeight: 'min(70vh, 680px)', overflowY: 'auto', paddingRight: 4 }}>
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <DialogTextField
          label={t('pageSettings.pageName')}
          ariaLabel={t('pageSettings.pageName')}
          value={pageName}
          onChange={setPageName}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 92, flex: '0 0 92px' }}>{t('pageSettings.backgroundColor')}</span>
          <Space.Compact style={{ flex: 1, minWidth: 0 }}>
            <ColorPicker value={backgroundColor} onChange={color => setBackgroundColor(color.toHexString())} />
            <Input
              aria-label={t('pageSettings.backgroundColor')}
              value={backgroundColor}
              onChange={event => setBackgroundColor(event.target.value)}
            />
          </Space.Compact>
        </div>
        <DialogSelectField
          label={t('pageSettings.paperType')}
          ariaLabel={t('pageSettings.paperType')}
          value={paperType}
          options={[
            ...PAPER_PRESETS.map((item) => ({ value: item.value, label: item.label })),
            { value: 'Custom', label: t('pageSettings.custom') },
          ]}
          onChange={handlePaperTypeChange}
        />
        <DialogSelectField
          label={t('pageSettings.reportUnit')}
          ariaLabel={t('pageSettings.reportUnit')}
          value={reportUnit}
          options={[
            { value: 'mm', label: t('pageSettings.millimeter') },
            { value: 'cm', label: t('pageSettings.centimeter') },
          ]}
          onChange={setReportUnit}
        />
        <Radio.Group value={orientation} onChange={event => handleOrientationChange(event.target.value)}>
          <Radio.Button value="portrait">{t('pageSettings.portrait')}</Radio.Button>
          <Radio.Button value="landscape">{t('pageSettings.landscape')}</Radio.Button>
        </Radio.Group>
        <DialogNumberField label={t('pageSettings.width')} value={formatUnitValue(width, reportUnit)} min={sizeMin} max={sizeMax} step={unitStep} disabled={paperType !== 'Custom'} onChange={value => setWidth(parseUnitValue(value, reportUnit, width))} />
        <DialogNumberField label={t('pageSettings.height')} value={formatUnitValue(height, reportUnit)} min={sizeMin} max={sizeMax} step={unitStep} disabled={paperType !== 'Custom'} onChange={value => setHeight(parseUnitValue(value, reportUnit, height))} />
        <DialogNumberField label={t('pageSettings.top')} value={formatUnitValue(margins.top, reportUnit)} min={0} max={marginMax} step={unitStep} onChange={value => handleMarginChange('top', value)} />
        <DialogNumberField label={t('pageSettings.right')} value={formatUnitValue(margins.right, reportUnit)} min={0} max={marginMax} step={unitStep} onChange={value => handleMarginChange('right', value)} />
        <DialogNumberField label={t('pageSettings.bottom')} value={formatUnitValue(margins.bottom, reportUnit)} min={0} max={marginMax} step={unitStep} onChange={value => handleMarginChange('bottom', value)} />
        <DialogNumberField label={t('pageSettings.left')} value={formatUnitValue(margins.left, reportUnit)} min={0} max={marginMax} step={unitStep} onChange={value => handleMarginChange('left', value)} />
        <PageWatermarkDialogFields
          reportFontOptions={reportFontOptions}
          watermark={watermark}
          onWatermarkChange={(updates) => setWatermark(current => ({ ...current, ...updates }))}
        />
        <PageAppearanceDialogFields
          pageBorder={pageBorder}
          reportUnit={reportUnit}
          unitStep={unitStep}
          onPageBorderChange={(updates) => setPageBorder(current => ({ ...current, ...updates, sides: updates.sides ? { ...current.sides, ...updates.sides } : current.sides }))}
        />
      </Space>
      </div>
    </Modal>
  );
};

const PageWatermarkDialogFields: React.FC<{
  watermark: PageWatermark;
  reportFontOptions: ReportFontOption[];
  onWatermarkChange: (updates: Partial<PageWatermark>) => void;
}> = ({ watermark, reportFontOptions, onWatermarkChange }) => {
  const { t } = useDesignerI18n();

  return (
    <section style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
      <Typography.Text strong style={{ display: 'block', marginBottom: 10 }}>
        {t('pageSettings.watermark')}
      </Typography.Text>
      <Space orientation="vertical" size={10} style={{ width: '100%' }}>
        <DialogSwitchField label={t('pageSettings.watermarkEnabled')} ariaLabel={t('pageSettings.watermarkEnabled')} checked={watermark.enabled} onChange={enabled => onWatermarkChange({ enabled })} />
        <DialogTextField label={t('pageSettings.watermarkText')} ariaLabel={t('pageSettings.watermarkText')} value={watermark.text} onChange={text => onWatermarkChange({ text })} />
        <DialogColorField label={t('pageSettings.watermarkColor')} ariaLabel={t('pageSettings.watermarkColor')} value={watermark.color} onChange={color => onWatermarkChange({ color })} />
        <FontEditor
          value={{ family: watermark.fontFamily, size: watermark.fontSize }}
          onChange={next => onWatermarkChange({ fontFamily: next.family || undefined, fontSize: Number(next.size ?? watermark.fontSize) })}
          reportFontOptions={reportFontOptions}
          fields={['family', 'size']}
          sizeRange={[8, 240]}
          labels={{
            fontFamily: t('pageSettings.watermarkFontFamily'),
            fontSize: t('pageSettings.watermarkFontSize'),
            textColor: t('pageSettings.watermarkColor'),
            bold: t('tableCell.bold'),
            italic: t('tableCell.italic'),
            underline: t('tableCell.underline'),
            strike: t('tableCell.strikethrough'),
          }}
        />
        <DialogNumberField label={t('pageSettings.watermarkOpacity')} value={watermark.opacity} min={0} max={1} step={0.05} onChange={value => onWatermarkChange({ opacity: Number(value ?? watermark.opacity) })} ariaLabel={t('pageSettings.watermarkOpacity')} />
        <DialogNumberField label={t('pageSettings.watermarkAngle')} value={watermark.angle} min={-180} max={180} step={1} onChange={value => onWatermarkChange({ angle: Number(value ?? watermark.angle) })} ariaLabel={t('pageSettings.watermarkAngle')} />
        <DialogSegmentedField
          label={t('pageSettings.watermarkHorizontalAlign')}
          ariaLabel={t('pageSettings.watermarkHorizontalAlign')}
          value={watermark.horizontalAlign}
          options={[
            { value: 'left', icon: <AlignLeftOutlined />, label: '' },
            { value: 'center', icon: <AlignCenterOutlined />, label: '' },
            { value: 'right', icon: <AlignRightOutlined />, label: '' },
          ]}
          onChange={value => onWatermarkChange({ horizontalAlign: value as PageWatermark['horizontalAlign'] })}
        />
        <DialogSegmentedField
          label={t('pageSettings.watermarkVerticalAlign')}
          ariaLabel={t('pageSettings.watermarkVerticalAlign')}
          value={watermark.verticalAlign}
          options={[
            { value: 'top', icon: <VerticalAlignTopOutlined />, label: '' },
            { value: 'middle', icon: <VerticalAlignMiddleOutlined />, label: '' },
            { value: 'bottom', icon: <VerticalAlignBottomOutlined />, label: '' },
          ]}
          onChange={value => onWatermarkChange({ verticalAlign: value as PageWatermark['verticalAlign'] })}
        />
        <DialogSwitchField label={t('pageSettings.watermarkShowBehind')} ariaLabel={t('pageSettings.watermarkShowBehind')} checked={watermark.showBehind} onChange={showBehind => onWatermarkChange({ showBehind })} />
      </Space>
    </section>
  );
};

const PageAppearanceDialogFields: React.FC<{
  pageBorder: PageBorder;
  reportUnit: 'mm' | 'cm';
  unitStep: number;
  onPageBorderChange: (updates: Partial<PageBorder>) => void;
}> = ({ pageBorder, reportUnit, unitStep, onPageBorderChange }) => {
  const { t } = useDesignerI18n();
  const borderWidthMax = formatUnitValue(10, reportUnit);
  const borderOffsetMax = formatUnitValue(50, reportUnit);

  return (
    <section style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
      <Typography.Text strong style={{ display: 'block', marginBottom: 10 }}>
        {t('pageSettings.appearance')}
      </Typography.Text>
      <Space orientation="vertical" size={10} style={{ width: '100%' }}>
        <DialogSwitchField label={t('pageSettings.pageBorder')} ariaLabel={t('pageSettings.pageBorderEnabled')} checked={pageBorder.enabled} onChange={enabled => onPageBorderChange({ enabled })} />
        <DialogSelectField
          label={t('pageSettings.borderStyle')}
          ariaLabel={t('pageSettings.borderStyle')}
          value={pageBorder.style}
          options={[
            { value: 'solid', label: t('pageSettings.borderSolid') },
            { value: 'dashed', label: t('pageSettings.borderDashed') },
            { value: 'dotted', label: t('pageSettings.borderDotted') },
            { value: 'double', label: t('pageSettings.borderDouble') },
          ]}
          onChange={style => onPageBorderChange({ style: style as PageBorder['style'] })}
        />
        <DialogColorField label={t('pageSettings.borderColor')} ariaLabel={t('pageSettings.borderColor')} value={pageBorder.color} onChange={color => onPageBorderChange({ color })} />
        <DialogNumberField label={t('pageSettings.borderWidth')} value={formatUnitValue(pageBorder.width, reportUnit)} min={0} max={borderWidthMax} step={unitStep} onChange={value => onPageBorderChange({ width: parseUnitValue(value, reportUnit, pageBorder.width) })} ariaLabel={t('pageSettings.borderWidth')} />
        <DialogNumberField label={t('pageSettings.borderOffset')} value={formatUnitValue(pageBorder.offset ?? 0, reportUnit)} min={0} max={borderOffsetMax} step={unitStep} onChange={value => onPageBorderChange({ offset: parseUnitValue(value, reportUnit, pageBorder.offset ?? 0) })} ariaLabel={t('pageSettings.borderOffset')} />
        <DialogCheckboxGroupField
          label={t('pageSettings.borderSides')}
          value={Object.entries(pageBorder.sides).filter(([, enabled]) => enabled).map(([side]) => side)}
          options={[
            { value: 'top', label: t('pageSettings.top') },
            { value: 'right', label: t('pageSettings.right') },
            { value: 'bottom', label: t('pageSettings.bottom') },
            { value: 'left', label: t('pageSettings.left') },
          ]}
          onChange={values => onPageBorderChange({
            sides: {
              top: values.includes('top'),
              right: values.includes('right'),
              bottom: values.includes('bottom'),
              left: values.includes('left'),
            },
          })}
        />
      </Space>
    </section>
  );
};

const DialogNumberField: React.FC<{
  label: string;
  ariaLabel?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onChange: (value: number | string | null) => void;
}> = ({ label, ariaLabel, value, min, max, step, disabled, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ width: 92, flex: '0 0 92px' }}>{label}</span>
    <InputNumber aria-label={ariaLabel} min={min} max={max} step={step} disabled={disabled} value={value} onChange={onChange} style={{ flex: 1, minWidth: 0 }} />
  </div>
);

const DialogTextField: React.FC<{
  label: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, ariaLabel, value, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ width: 92, flex: '0 0 92px' }}>{label}</span>
    <Input aria-label={ariaLabel} value={value} onChange={event => onChange(event.target.value)} />
  </div>
);

const DialogSelectField: React.FC<{
  label: string;
  ariaLabel: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: any) => void;
}> = ({ label, ariaLabel, value, options, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ width: 92, flex: '0 0 92px' }}>{label}</span>
    <Select aria-label={ariaLabel} value={value} options={options} virtual={false} onChange={onChange} />
  </div>
);

const DialogColorField: React.FC<{
  label: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, ariaLabel, value, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ width: 92, flex: '0 0 92px' }}>{label}</span>
    <Space.Compact style={{ flex: 1, minWidth: 0 }}>
      <ColorPicker value={value} onChange={color => onChange(color.toHexString())} />
      <Input aria-label={ariaLabel} value={value} onChange={event => onChange(event.target.value)} />
    </Space.Compact>
  </div>
);

const DialogSwitchField: React.FC<{
  label: string;
  ariaLabel: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, ariaLabel, checked, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ width: 92, flex: '0 0 92px' }}>{label}</span>
    <Switch aria-label={ariaLabel} checked={checked} onChange={onChange} />
  </div>
);

const DialogSegmentedField: React.FC<{
  label: string;
  ariaLabel: string;
  value: string;
  options: Array<{ value: string; label: React.ReactNode; icon?: React.ReactNode }>;
  onChange: (value: string) => void;
}> = ({ label, ariaLabel, value, options, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ width: 92, flex: '0 0 92px' }}>{label}</span>
    <Segmented aria-label={ariaLabel} value={value} options={options} onChange={value => onChange(String(value))} style={{ flex: 1 }} />
  </div>
);

const DialogCheckboxGroupField: React.FC<{
  label: string;
  value: string[];
  options: Array<{ value: string; label: React.ReactNode }>;
  onChange: (value: string[]) => void;
}> = ({ label, value, options, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ width: 92, flex: '0 0 92px' }}>{label}</span>
    <Checkbox.Group value={value} options={options} onChange={values => onChange(values.map(String))} />
  </div>
);
