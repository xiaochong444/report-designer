import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BgColorsOutlined,
  BoldOutlined,
  CheckOutlined,
  CopyOutlined,
  DeleteOutlined,
  FontColorsOutlined,
  ItalicOutlined,
  PlusOutlined,
  StrikethroughOutlined,
  UnderlineOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  ColorPicker,
  Empty,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { BorderConfig, FontConfig, ReportStyle, TextFormatConfig } from '@report-designer/core';
import { useDesignerStore } from '../store/designer-store';
import { useDesignerI18n } from '../i18n';
import { TextFormatEditor } from './TextFormatEditor';

interface TextStyleLibraryDialogProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY_FONT: FontConfig = {
  family: 'Arial',
  size: 10,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  color: '#000000',
};

const EMPTY_BORDER: BorderConfig = {
  style: 'none',
  width: 0,
  color: '#000000',
  sides: { top: false, right: false, bottom: false, left: false },
};

const EMPTY_FORMAT: TextFormatConfig = {
  type: 'none',
};

const EMPTY_PADDING = { top: 0, right: 0, bottom: 0, left: 0 };

const STYLE_LIST_COLUMN_WIDTH = 248;
const PROPERTY_COLUMN_WIDTH = 388;

function mergeBorder(border?: Partial<BorderConfig>): BorderConfig {
  return {
    ...EMPTY_BORDER,
    ...border,
    sides: {
      ...EMPTY_BORDER.sides,
      ...border?.sides,
    },
  };
}

function mergePadding(padding?: ReportStyle['padding']) {
  return {
    ...EMPTY_PADDING,
    ...padding,
  };
}

function mergeFont(font?: ReportStyle['font']): FontConfig {
  return {
    ...EMPTY_FONT,
    ...font,
  };
}

function filterStyles(styles: ReportStyle[], search: string) {
  const keyword = search.trim().toLowerCase();
  if (!keyword) {
    return styles;
  }
  return styles.filter(style => (
    style.name.toLowerCase().includes(keyword) || style.id.toLowerCase().includes(keyword)
  ));
}

export const TextStyleLibraryDialog: React.FC<TextStyleLibraryDialogProps> = ({ open, onClose }) => {
  const { t } = useDesignerI18n();
  const template = useDesignerStore(s => s.template);
  const selectedComponentIds = useDesignerStore(s => s.selectedComponentIds);
  const createTextStyle = useDesignerStore(s => s.createTextStyle);
  const duplicateTextStyle = useDesignerStore(s => s.duplicateTextStyle);
  const renameTextStyle = useDesignerStore(s => s.renameTextStyle);
  const updateTextStyle = useDesignerStore(s => s.updateTextStyle);
  const deleteTextStyle = useDesignerStore(s => s.deleteTextStyle);
  const setDefaultTextStyle = useDesignerStore(s => s.setDefaultTextStyle);
  const applySelectedStyle = useDesignerStore(s => s.applySelectedStyle);
  const getTextStyleUsageCount = useDesignerStore(s => s.getTextStyleUsageCount);

  const [search, setSearch] = useState('');
  const [selectedStyleId, setSelectedStyleId] = useState<string>();
  const [draftName, setDraftName] = useState('');
  const searchRef = useRef(search);
  const visibleSelectedStyleIdRef = useRef<string | undefined>(undefined);

  const filteredStyles = useMemo(() => {
    return filterStyles(template.styles, search);
  }, [search, template.styles]);

  const selectedStyle = useMemo(() => {
    return (
      filteredStyles.find(style => style.id === selectedStyleId)
      ?? filteredStyles[0]
      ?? template.styles.find(style => style.id === selectedStyleId)
      ?? template.styles[0]
    );
  }, [filteredStyles, selectedStyleId, template.styles]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setSelectedStyleId(current => {
      if (current && template.styles.some(style => style.id === current)) {
        return current;
      }
      return filteredStyles[0]?.id ?? template.styles[0]?.id;
    });
  }, [filteredStyles, open, template.styles]);

  useEffect(() => {
    setDraftName(selectedStyle?.name ?? '');
  }, [selectedStyle?.id, selectedStyle?.name]);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  useEffect(() => {
    visibleSelectedStyleIdRef.current = filteredStyles.some(style => style.id === selectedStyle?.id)
      ? selectedStyle?.id
      : filteredStyles[0]?.id;
  }, [filteredStyles, selectedStyle?.id]);

  const updateSelectedStyle = (updates: Partial<ReportStyle>) => {
    if (!selectedStyle) {
      return;
    }
    updateTextStyle(selectedStyle.id, updates);
  };

  const handleCreate = () => {
    const createdId = createTextStyle({ name: t('styleLibrary.newStyleName') });
    setSearch('');
    setSelectedStyleId(createdId);
  };

  const handleDuplicate = () => {
    if (!selectedStyle) {
      return;
    }
    const duplicateId = duplicateTextStyle(selectedStyle.id);
    if (duplicateId) {
      setSearch('');
      setSelectedStyleId(duplicateId);
    }
  };

  const commitDraftName = (nextName = draftName) => {
    if (!selectedStyle) {
      return;
    }
    const trimmedName = nextName.trim();
    if (!trimmedName) {
      setDraftName(selectedStyle.name);
      return;
    }
    if (trimmedName === selectedStyle.name) {
      return;
    }
    renameTextStyle(selectedStyle.id, trimmedName);
  };

  const handleDelete = () => {
    if (!selectedStyle) {
      return;
    }
    const deletingId = selectedStyle.id;
    const usageCount = getTextStyleUsageCount(deletingId);
    Modal.confirm({
      title: t('styleLibrary.deleteTitle', { name: selectedStyle.name }),
      content: usageCount > 0
        ? t('styleLibrary.deleteInUse', { count: usageCount })
        : t('styleLibrary.deleteUnused'),
      okText: t('common.delete'),
      okButtonProps: { danger: true },
      cancelText: t('common.cancel'),
      onOk: () => {
        const latestTemplate = useDesignerStore.getState().template;
        const latestSearch = searchRef.current;
        const latestVisibleStyles = filterStyles(latestTemplate.styles, latestSearch);
        const latestVisibleSelectedStyleId = visibleSelectedStyleIdRef.current;
        const deletingVisibleIndex = latestVisibleStyles.findIndex(style => style.id === deletingId);

        deleteTextStyle(deletingId);

        const stylesAfterDelete = useDesignerStore.getState().template.styles;
        const visibleStylesAfterDelete = filterStyles(stylesAfterDelete, latestSearch);
        if (
          latestVisibleSelectedStyleId
          && latestVisibleSelectedStyleId !== deletingId
          && visibleStylesAfterDelete.some(style => style.id === latestVisibleSelectedStyleId)
        ) {
          setSelectedStyleId(latestVisibleSelectedStyleId);
          return;
        }

        const fallbackStyle = (
          deletingVisibleIndex >= 0
            ? visibleStylesAfterDelete[deletingVisibleIndex] ?? visibleStylesAfterDelete[deletingVisibleIndex - 1]
            : undefined
        ) ?? visibleStylesAfterDelete[0] ?? stylesAfterDelete[0];
        setSelectedStyleId(fallbackStyle?.id);
      },
    });
  };

  const font = mergeFont(selectedStyle?.font);
  const border = mergeBorder(selectedStyle?.border);
  const padding = mergePadding(selectedStyle?.padding);
  const format = selectedStyle?.format ?? EMPTY_FORMAT;

  const setFontFlag = (field: 'bold' | 'italic' | 'underline' | 'strikethrough', nextValue: boolean) => {
    updateSelectedStyle({ font: { ...font, [field]: nextValue } });
  };

  const setBorderSide = (field: 'top' | 'right' | 'bottom' | 'left', nextValue: boolean) => {
    updateSelectedStyle({
      border: {
        ...border,
        sides: {
          ...border.sides,
          [field]: nextValue,
        },
      },
    });
  };

  return (
    <Modal
      open={open}
      title={t('styleLibrary.title')}
      onCancel={onClose}
      onOk={onClose}
      width={1120}
      style={{ top: 16 }}
      okText={t('common.done')}
      destroyOnHidden
      styles={{ body: { paddingTop: 10, overflow: 'hidden' } }}
    >
      <div
        data-testid="style-library-shell"
        style={{
          display: 'flex',
          gap: 16,
          height: 620,
          maxHeight: 'calc(100vh - 170px)',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <section
          style={{
            display: 'flex',
            flex: `0 0 ${STYLE_LIST_COLUMN_WIDTH}px`,
            flexDirection: 'column',
            gap: 10,
            minWidth: 0,
            minHeight: 0,
          }}
        >
          <Input.Search
            aria-label={t('styleLibrary.aria.search')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('styleLibrary.searchPlaceholder')}
            allowClear
          />
          <Space size={8}>
            <ToolbarIconButton ariaLabel={t('common.new')} icon={<PlusOutlined />} onClick={handleCreate} tooltip={t('common.new')} />
            <ToolbarIconButton ariaLabel={t('common.duplicate')} icon={<CopyOutlined />} onClick={handleDuplicate} disabled={!selectedStyle} tooltip={t('common.duplicate')} />
            <ToolbarIconButton ariaLabel={t('common.delete')} icon={<DeleteOutlined />} danger onClick={handleDelete} disabled={!selectedStyle} tooltip={t('common.delete')} />
          </Space>
          <div style={{ border: '1px solid #e7e9ee', borderRadius: 8, overflow: 'hidden', minHeight: 0, flex: '1 1 0px', background: '#fff' }}>
            <div
              data-testid="style-library-style-list-scroll"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                height: '100%',
                minHeight: 0,
                overflowX: 'hidden',
                overflowY: 'auto',
                padding: 6,
              }}
            >
              {filteredStyles.length ? (
                filteredStyles.map((style) => {
                  const active = style.id === selectedStyle?.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyleId(style.id)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) auto',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        minHeight: 34,
                        padding: '6px 10px',
                        border: 'none',
                        borderRadius: 8,
                        background: active ? '#e6f4ff' : 'transparent',
                        color: '#1f1f1f',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: active ? 600 : 400 }}>
                        {style.name}
                      </span>
                      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        {style.isDefault ? <Tag color="blue" style={{ marginInlineEnd: 0 }}>{t('common.default')}</Tag> : null}
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          {getTextStyleUsageCount(style.id)}
                        </Typography.Text>
                      </span>
                    </button>
                  );
                })
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '1 1 auto' }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('styleLibrary.noStyles')} />
                </div>
              )}
            </div>
          </div>
        </section>

        <section
          data-testid="style-library-preview-column"
          style={{
            display: 'flex',
            flex: '1 1 0px',
            flexDirection: 'column',
            gap: 12,
            minWidth: 0,
            minHeight: 0,
            alignSelf: 'start',
          }}
        >
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>{t('styleLibrary.preview')}</Typography.Title>
            <Typography.Text type="secondary">{t('styleLibrary.previewDescription')}</Typography.Text>
          </div>
          <div
            style={{
              borderRadius: 10,
              border: `${Math.max(border.width ?? 0, 0.2)}px ${border.style === 'none' ? 'solid' : border.style} ${border.color}`,
              background: selectedStyle?.backgroundColor === 'transparent' ? '#ffffff' : selectedStyle?.backgroundColor,
              color: font.color,
              fontFamily: font.family,
              fontSize: font.size,
              fontWeight: font.bold ? 700 : 400,
              fontStyle: font.italic ? 'italic' : 'normal',
              textDecoration: [
                font.underline ? 'underline' : '',
                font.strikethrough ? 'line-through' : '',
              ].filter(Boolean).join(' ') || 'none',
              textAlign: selectedStyle?.textAlign ?? 'left',
              padding: `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`,
              minHeight: 180,
              display: 'flex',
              alignItems: selectedStyle?.verticalAlign === 'bottom' ? 'flex-end' : selectedStyle?.verticalAlign === 'middle' ? 'center' : 'flex-start',
              justifyContent: selectedStyle?.textAlign === 'center' ? 'center' : selectedStyle?.textAlign === 'right' ? 'flex-end' : 'flex-start',
              boxShadow: 'inset 0 0 0 1px rgba(15, 23, 42, 0.03)',
            }}
          >
            {t('styleLibrary.previewSample')}
          </div>
          <PanelCard title={selectedStyle?.name ?? t('styleLibrary.selectStyle')}>
            <Typography.Text type="secondary">
              {t('styleLibrary.usedBy', { count: selectedStyle ? getTextStyleUsageCount(selectedStyle.id) : 0 })}
            </Typography.Text>
          </PanelCard>
        </section>

        <section
          data-testid="style-library-property-section"
          style={{
            display: 'flex',
            flex: `0 0 ${PROPERTY_COLUMN_WIDTH}px`,
            flexDirection: 'column',
            gap: 10,
            height: '100%',
            minWidth: 0,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <PanelCard padded={false}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 12px' }}>
              <Typography.Text strong>{t('styleLibrary.properties')}</Typography.Text>
              <Space size={8}>
                <ToolbarIconButton
                  ariaLabel={t('styleLibrary.setDefault')}
                  icon={<CheckOutlined />}
                  onClick={() => selectedStyle && setDefaultTextStyle(selectedStyle.id)}
                  disabled={!selectedStyle}
                  tooltip={t('styleLibrary.setDefault')}
                />
                <Button
                  type="primary"
                  size="small"
                  aria-label={t('styleLibrary.applyToSelected')}
                  disabled={!selectedStyle || selectedComponentIds.length === 0}
                  onClick={() => selectedStyle && applySelectedStyle(selectedStyle.id)}
                >
                  {t('styleLibrary.apply')}
                </Button>
              </Space>
            </div>
          </PanelCard>

          {selectedStyle ? (
            <div
              data-testid="style-library-property-scroll"
              style={{
                display: 'flex',
                flex: '1 1 0px',
                flexDirection: 'column',
                gap: 8,
                overflowX: 'hidden',
                overflowY: 'scroll',
                scrollbarGutter: 'stable',
                paddingRight: 4,
                paddingBottom: 8,
                minHeight: 0,
              }}
            >
              <PanelCard title={t('styleLibrary.general')}>
                <div style={{ display: 'grid', gap: 10 }}>
                  <CompactField label={t('styleLibrary.name')}>
                    <Input
                      aria-label={t('styleLibrary.aria.name')}
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      onBlur={() => commitDraftName()}
                      onPressEnter={() => commitDraftName()}
                    />
                  </CompactField>
                </div>
              </PanelCard>

              <PanelCard title={t('styleLibrary.typography')}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 96px', gap: 8 }}>
                    <Select
                      aria-label={t('styleLibrary.aria.fontFamily')}
                      value={font.family}
                      virtual={false}
                      onChange={(value) => updateSelectedStyle({ font: { ...font, family: value } })}
                      options={[
                        'Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Tahoma', 'Georgia',
                        'Microsoft YaHei', 'SimSun', 'SimHei', 'KaiTi',
                      ].map(value => ({ value, label: value }))}
                    />
                    <InputNumber
                      aria-label={t('styleLibrary.aria.fontSize')}
                      value={font.size}
                      min={6}
                      max={72}
                      style={{ width: '100%' }}
                      onChange={(value) => updateSelectedStyle({ font: { ...font, size: Number(value ?? font.size) } })}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8 }}>
                    <Space.Compact block>
                      <Tooltip title={t('styleLibrary.textColor')}>
                        <Button icon={<FontColorsOutlined />} aria-label={t('styleLibrary.aria.textColorIcon')} />
                      </Tooltip>
                      <ColorPicker
                        aria-label={t('styleLibrary.aria.textColor')}
                        value={font.color}
                        onChange={(value) => updateSelectedStyle({ font: { ...font, color: value.toHexString() } })}
                        style={{ width: '100%', justifyContent: 'space-between' }}
                      />
                    </Space.Compact>
                    <Space.Compact block>
                      <Tooltip title={t('styleLibrary.background')}>
                        <Button icon={<BgColorsOutlined />} aria-label={t('styleLibrary.aria.backgroundIcon')} />
                      </Tooltip>
                      <ColorPicker
                        aria-label={t('styleLibrary.aria.background')}
                        value={selectedStyle.backgroundColor}
                        onChange={(value) => updateSelectedStyle({ backgroundColor: value.toHexString() })}
                        style={{ width: '100%', justifyContent: 'space-between' }}
                      />
                    </Space.Compact>
                  </div>
                  <IconRow label={t('styleLibrary.style')}>
                    <IconToggleGroup
                      items={[
                        { label: t('styleLibrary.bold'), active: font.bold, icon: <BoldOutlined />, onClick: () => setFontFlag('bold', !font.bold) },
                        { label: t('styleLibrary.italic'), active: font.italic, icon: <ItalicOutlined />, onClick: () => setFontFlag('italic', !font.italic) },
                        { label: t('styleLibrary.underline'), active: font.underline, icon: <UnderlineOutlined />, onClick: () => setFontFlag('underline', !font.underline) },
                        { label: t('styleLibrary.strike'), active: font.strikethrough, icon: <StrikethroughOutlined />, onClick: () => setFontFlag('strikethrough', !font.strikethrough) },
                      ]}
                    />
                  </IconRow>
                </div>
              </PanelCard>

              <PanelCard title={t('styleLibrary.layout')}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <IconRow label={t('styleLibrary.align')}>
                    <IconToggleGroup
                      items={[
                        { label: t('styleLibrary.left'), active: (selectedStyle.textAlign ?? 'left') === 'left', icon: <AlignLeftOutlined />, onClick: () => updateSelectedStyle({ textAlign: 'left' }) },
                        { label: t('styleLibrary.center'), active: selectedStyle.textAlign === 'center', icon: <AlignCenterOutlined />, onClick: () => updateSelectedStyle({ textAlign: 'center' }) },
                        { label: t('styleLibrary.right'), active: selectedStyle.textAlign === 'right', icon: <AlignRightOutlined />, onClick: () => updateSelectedStyle({ textAlign: 'right' }) },
                      ]}
                    />
                  </IconRow>
                  <IconRow label={t('styleLibrary.vertical')}>
                    <IconToggleGroup
                      items={[
                        { label: t('styleLibrary.verticalTop'), active: (selectedStyle.verticalAlign ?? 'top') === 'top', icon: <VerticalAlignGlyph position="top" />, onClick: () => updateSelectedStyle({ verticalAlign: 'top' }) },
                        { label: t('styleLibrary.verticalMiddle'), active: selectedStyle.verticalAlign === 'middle', icon: <VerticalAlignGlyph position="middle" />, onClick: () => updateSelectedStyle({ verticalAlign: 'middle' }) },
                        { label: t('styleLibrary.verticalBottom'), active: selectedStyle.verticalAlign === 'bottom', icon: <VerticalAlignGlyph position="bottom" />, onClick: () => updateSelectedStyle({ verticalAlign: 'bottom' }) },
                      ]}
                    />
                  </IconRow>
                  <IconRow label={t('styleLibrary.auto')}>
                    <Space size={8}>
                      <ToggleChip
                        ariaLabel={t('styleLibrary.canGrow')}
                        active={selectedStyle.canGrow ?? false}
                        onClick={() => updateSelectedStyle({ canGrow: !(selectedStyle.canGrow ?? false) })}
                      >
                        {t('styleLibrary.canGrow')}
                      </ToggleChip>
                      <ToggleChip
                        ariaLabel={t('styleLibrary.canShrink')}
                        active={selectedStyle.canShrink ?? false}
                        onClick={() => updateSelectedStyle({ canShrink: !(selectedStyle.canShrink ?? false) })}
                      >
                        {t('styleLibrary.canShrink')}
                      </ToggleChip>
                    </Space>
                  </IconRow>
                </div>
              </PanelCard>

              <PanelCard title={t('styleLibrary.format')}>
                <TextFormatEditor
                  value={format}
                  onChange={(nextFormat) => updateSelectedStyle({ format: nextFormat })}
                  labelWidth={104}
                />
              </PanelCard>

              <PanelCard title={t('styleLibrary.border')}>
                <BorderEditor
                  border={border}
                  onChange={(nextBorder) => updateSelectedStyle({ border: nextBorder })}
                  onSideChange={setBorderSide}
                />
              </PanelCard>

              <PanelCard title={t('styleLibrary.padding')}>
                <PaddingEditor
                  padding={padding}
                  onChange={(nextPadding) => updateSelectedStyle({ padding: nextPadding })}
                />
              </PanelCard>
            </div>
          ) : (
            <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('styleLibrary.selectStyle')} />
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
};

const PanelCard: React.FC<React.PropsWithChildren<{ title?: string; padded?: boolean }>> = ({ children, title, padded = true }) => (
  <div
    style={{
      border: '1px solid #e7e9ee',
      borderRadius: 8,
      background: '#fff',
      flexShrink: 0,
      overflow: 'hidden',
    }}
  >
    {title ? (
      <div style={{ padding: '10px 12px 0', display: 'grid', gap: 2 }}>
        <Typography.Text strong>{title}</Typography.Text>
      </div>
    ) : null}
    <div style={{ padding: padded ? '10px 12px 12px' : 0 }}>
      {children}
    </div>
  </div>
);

const CompactField: React.FC<React.PropsWithChildren<{ label: string }>> = ({ label, children }) => (
  <label style={{ display: 'grid', gridTemplateColumns: '72px minmax(0, 1fr)', gap: 10, alignItems: 'center' }}>
    <span style={{ fontSize: 12, color: '#595959' }}>{label}</span>
    {children}
  </label>
);

const IconRow: React.FC<React.PropsWithChildren<{ label: string }>> = ({ label, children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '72px minmax(0, 1fr)', gap: 10, alignItems: 'center' }}>
    <span style={{ fontSize: 12, color: '#595959' }}>{label}</span>
    {children}
  </div>
);

const ToolbarIconButton: React.FC<{
  ariaLabel: string;
  icon: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}> = ({ ariaLabel, danger, disabled, icon, onClick, tooltip }) => (
  <Tooltip title={tooltip}>
    <Button
      aria-label={ariaLabel}
      icon={icon}
      size="small"
      onClick={onClick}
      disabled={disabled}
      danger={danger}
    />
  </Tooltip>
);

const IconToggleGroup: React.FC<{
  items: Array<{
    label: string;
    active: boolean;
    icon: React.ReactNode;
    onClick: () => void;
  }>;
}> = ({ items }) => (
  <Space size={6} wrap>
    {items.map(item => (
      <Tooltip key={item.label} title={item.label}>
        <Button
          size="small"
          type={item.active ? 'primary' : 'default'}
          icon={item.icon}
          aria-label={item.label}
          onClick={item.onClick}
        />
      </Tooltip>
    ))}
  </Space>
);

const ToggleChip: React.FC<React.PropsWithChildren<{
  ariaLabel: string;
  active: boolean;
  onClick: () => void;
}>> = ({ active, ariaLabel, children, onClick }) => (
  <Button
    size="small"
    type={active ? 'primary' : 'default'}
    aria-label={ariaLabel}
    onClick={onClick}
  >
    {children}
  </Button>
);

const VerticalAlignGlyph: React.FC<{ position: 'top' | 'middle' | 'bottom' }> = ({ position }) => {
  const top = position === 'top' ? 2 : position === 'middle' ? 8 : 14;
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'relative',
        display: 'inline-block',
        width: 14,
        height: 18,
      }}
    >
      <span style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1.5, background: 'currentColor', opacity: 0.5, borderRadius: 999 }} />
      <span style={{ position: 'absolute', left: 0, right: 0, top: 8, height: 1.5, background: 'currentColor', opacity: 0.5, borderRadius: 999 }} />
      <span style={{ position: 'absolute', left: 0, right: 0, top: 16, height: 1.5, background: 'currentColor', opacity: 0.5, borderRadius: 999 }} />
      <span style={{ position: 'absolute', left: 2, right: 2, top, height: 3.5, background: 'currentColor', borderRadius: 999 }} />
    </span>
  );
};

const BorderEditor: React.FC<{
  border: BorderConfig;
  onChange: (border: BorderConfig) => void;
  onSideChange: (side: 'top' | 'right' | 'bottom' | 'left', enabled: boolean) => void;
}> = ({ border, onChange, onSideChange }) => {
  const { t } = useDesignerI18n();
  const previewBorder = (enabled: boolean) => (
    enabled && border.style !== 'none'
      ? `${Math.max(border.width ?? 0, 0.2)}px ${border.style} ${border.color}`
      : '1px solid #edf0f4'
  );

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <CompactField label={t('styleLibrary.borderStyle')}>
        <Select
          aria-label={t('styleLibrary.aria.borderStyle')}
          value={border.style}
          virtual={false}
          onChange={(value) => onChange({ ...border, style: value })}
          options={[
            { value: 'none', label: t('styleLibrary.borderNone') },
            { value: 'solid', label: t('styleLibrary.borderSolid') },
            { value: 'dashed', label: t('styleLibrary.borderDashed') },
            { value: 'dotted', label: t('styleLibrary.borderDotted') },
            { value: 'double', label: t('styleLibrary.borderDouble') },
          ]}
        />
      </CompactField>
      <CompactField label={t('styleLibrary.borderWidth')}>
        <InputNumber
          aria-label={t('styleLibrary.aria.borderWidth')}
          value={border.width}
          min={0}
          max={5}
          step={0.1}
          style={{ width: '100%' }}
          onChange={(value) => onChange({ ...border, width: Number(value ?? border.width) })}
        />
      </CompactField>
      <CompactField label={t('styleLibrary.borderColor')}>
        <ColorPicker
          aria-label={t('styleLibrary.aria.borderColor')}
          value={border.color}
          onChange={(value) => onChange({ ...border, color: value.toHexString() })}
          style={{ width: 32 }}
        />
      </CompactField>
      <div style={{ height: 1, background: '#edf0f4', margin: '2px 0 0' }} />
      <div style={{ display: 'grid', gap: 8 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('styleLibrary.applySides')}</Typography.Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Checkbox checked={border.sides.top} onChange={(event) => onSideChange('top', event.target.checked)}>{t('styleLibrary.sideTop')}</Checkbox>
          <Checkbox checked={border.sides.right} onChange={(event) => onSideChange('right', event.target.checked)}>{t('styleLibrary.sideRight')}</Checkbox>
          <Checkbox checked={border.sides.bottom} onChange={(event) => onSideChange('bottom', event.target.checked)}>{t('styleLibrary.sideBottom')}</Checkbox>
          <Checkbox checked={border.sides.left} onChange={(event) => onSideChange('left', event.target.checked)}>{t('styleLibrary.sideLeft')}</Checkbox>
        </div>
        <div
          aria-label={t('styleLibrary.borderPreview')}
          style={{
            justifySelf: 'center',
            width: 60,
            height: 40,
            background: '#ffffff',
            borderTop: previewBorder(border.sides.top),
            borderRight: previewBorder(border.sides.right),
            borderBottom: previewBorder(border.sides.bottom),
            borderLeft: previewBorder(border.sides.left),
          }}
        />
      </div>
    </div>
  );
};

const PaddingEditor: React.FC<{
  padding: { top: number; right: number; bottom: number; left: number };
  onChange: (padding: { top: number; right: number; bottom: number; left: number }) => void;
}> = ({ padding, onChange }) => {
  const { t } = useDesignerI18n();
  const updateField = (field: 'top' | 'right' | 'bottom' | 'left', value: number | null) => {
    onChange({ ...padding, [field]: Number(value ?? padding[field]) });
  };

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        <PaddingField label={t('styleLibrary.sideTop')}>
          <InputNumber aria-label={t('styleLibrary.aria.paddingTop')} value={padding.top} min={0} style={{ width: '100%' }} onChange={(value) => updateField('top', value)} />
        </PaddingField>
        <PaddingField label={t('styleLibrary.sideRight')}>
          <InputNumber aria-label={t('styleLibrary.aria.paddingRight')} value={padding.right} min={0} style={{ width: '100%' }} onChange={(value) => updateField('right', value)} />
        </PaddingField>
        <PaddingField label={t('styleLibrary.sideBottom')}>
          <InputNumber aria-label={t('styleLibrary.aria.paddingBottom')} value={padding.bottom} min={0} style={{ width: '100%' }} onChange={(value) => updateField('bottom', value)} />
        </PaddingField>
        <PaddingField label={t('styleLibrary.sideLeft')}>
          <InputNumber aria-label={t('styleLibrary.aria.paddingLeft')} value={padding.left} min={0} style={{ width: '100%' }} onChange={(value) => updateField('left', value)} />
        </PaddingField>
      </div>
    </div>
  );
};

const PaddingField: React.FC<React.PropsWithChildren<{ label: string }>> = ({ children, label }) => (
  <label style={{ display: 'grid', gridTemplateColumns: '18px minmax(0, 1fr)', gap: 6, alignItems: 'center' }}>
    <span style={{ fontSize: 12, color: '#595959', textAlign: 'center' }}>{label}</span>
    {children}
  </label>
);
