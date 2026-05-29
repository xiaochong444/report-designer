import React, { useEffect, useState } from 'react';
import { Button, Dropdown, Popover, Select, Tooltip } from 'antd';
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  ArrowDownOutlined,
  DownOutlined,
  ArrowUpOutlined,
  AppstoreOutlined,
  PartitionOutlined,
  BorderOuterOutlined,
  CheckSquareOutlined,
  ColumnHeightOutlined,
  ColumnWidthOutlined,
  CopyOutlined,
  CompressOutlined,
  DeleteOutlined,
  FontSizeOutlined,
  LineOutlined,
  PictureOutlined,
  PrinterOutlined,
  SaveOutlined,
  SettingOutlined,
  TableOutlined,
  ScissorOutlined,
  UndoOutlined,
  RedoOutlined,
  ApartmentOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignTopOutlined,
} from '@ant-design/icons';
import { type BandType, type BorderConfig, type FontConfig, type Margins, type Page, type ReportComponent, type TextComponent } from '@report-designer/core';
import { useDesignerStore } from '../../store/designer-store';
import { PageSetupDialog } from '../dialogs/PageSetupDialog';
import { useDesignerI18n } from '../../i18n';
import type { DesignerMessageKey } from '../../i18n';
import { hasTextStyleBinding } from '../../text-style-bindings';
import { BAND_COLORS, BAND_DESCRIPTION_KEYS, BAND_GLYPH_KEYS, BAND_LABEL_KEYS, SUPPORTED_INSERT_BAND_TYPES } from '../../band-metadata';

const TAB_KEYS = ['home', 'insert', 'pageLayout', 'layout', 'preview'] as const;
type RibbonTab = typeof TAB_KEYS[number];

const TAB_LABEL_KEYS: Record<RibbonTab, DesignerMessageKey> = {
  home: 'ribbon.home',
  insert: 'ribbon.insert',
  pageLayout: 'ribbon.pageLayout',
  layout: 'ribbon.layout',
  preview: 'ribbon.preview',
};

const DEFAULT_FONT: FontConfig = {
  family: 'Arial',
  size: 10,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  color: '#000000',
};

const DEFAULT_BORDER: BorderConfig = {
  style: 'none',
  width: 0.2,
  color: '#000000',
  sides: { top: false, right: false, bottom: false, left: false },
};

export const DesignerRibbon: React.FC = () => {
  const { t } = useDesignerI18n();
  const [activeTab, setActiveTab] = useState<RibbonTab>('home');
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    deleteSelected,
    copySelected,
    cutSelected,
    duplicateSelected,
    pasteClipboard,
    getClipboard,
    setFontBold,
    setFontSize,
    setTextAlign,
    setBorderAll,
    alignComponents,
    sizeComponents,
    bringToFront,
    sendToBack,
    getSelectedFont,
    getSelectedTextAlign,
    openTextStyleLibrary,
    openConditionalFormatLibrary,
    setMode,
    beginBandInsert,
  } = useDesignerStore();

  const selectedCount = useDesignerStore(s => s.selectedComponentIds.length);
  const selectedComponentIds = useDesignerStore(s => s.selectedComponentIds);
  const template = useDesignerStore(s => s.template);
  const mode = useDesignerStore(s => s.mode);
  const fontInfo = getSelectedFont();
  const textAlign = getSelectedTextAlign();
  const hasSelection = selectedCount > 0;
  const hasMultiSelection = selectedCount >= 2;
  const hasDistributableSelection = selectedCount >= 3;
  const hasClipboard = getClipboard().length > 0;
  const selectedTextComponents = selectedCount > 0
    ? template.pages
      .flatMap(page => page.bands)
      .flatMap(band => band.components)
      .filter((component): component is TextComponent => (
        selectedComponentIds.includes(component.id) && component.type === 'text'
      ))
    : [];
  const isTextStyleLocked = (pathOrPrefix: string) => selectedTextComponents.some(component => hasTextStyleBinding(component, pathOrPrefix));
  const fontSizeDisabled = !fontInfo || isTextStyleLocked('font.size');
  const fontBoldDisabled = !fontInfo || isTextStyleLocked('font.bold');
  const textAlignDisabled = textAlign === null || isTextStyleLocked('textAlign');
  const borderDisabled = selectedCount === 0 || isTextStyleLocked('border');

  useEffect(() => {
    if (mode === 'preview') {
      setActiveTab('preview');
    } else if (activeTab === 'preview') {
      setActiveTab('home');
    }
  }, [mode, activeTab]);

  const saveTemplate = () => {
    const json = JSON.stringify(useDesignerStore.getState().template, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name || 'report'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleTabClick = (tab: RibbonTab) => {
    setActiveTab(tab);
    setMode(tab === 'preview' ? 'preview' : 'design');
  };

  const addComponentToCurrentBand = (component: ReportComponent) => {
    const state = useDesignerStore.getState();
    const page = state.template.pages.find(item => item.id === state.currentPageId);
    if (!page) return;

    const targetBand = page.bands.find(band => band.id === state.selectedBandId)
      ?? page.bands.find(band => band.type === 'data')
      ?? page.bands[0];

    if (!targetBand) return;

    state.addComponent(page.id, targetBand.id, component);
    state.selectBand(null);
    state.selectComponents([component.id]);
  };

  const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const createTextComponent = (overrides: Partial<TextComponent> = {}): TextComponent => ({
    id: createId('text'),
    type: 'text',
    name: t('leftPanel.componentText'),
    x: 10,
    y: 8,
    width: 45,
    height: 10,
    text: t('leftPanel.componentText'),
    font: DEFAULT_FONT,
    textAlign: 'left',
    verticalAlign: 'top',
    border: DEFAULT_BORDER,
    canGrow: false,
    canShrink: false,
    ...overrides,
  });

  const addText = () => addComponentToCurrentBand(createTextComponent());

  const addImage = () => addComponentToCurrentBand({
    id: createId('image'),
    type: 'image',
    name: t('leftPanel.componentImage'),
    x: 10,
    y: 8,
    width: 35,
    height: 25,
    src: '',
    fitMode: 'contain',
  } as ReportComponent);

  const addCheckbox = () => addComponentToCurrentBand({
    id: createId('checkbox'),
    type: 'checkbox',
    name: t('leftPanel.componentCheckbox'),
    x: 10,
    y: 8,
    width: 25,
    height: 8,
    checked: 'false',
    label: t('leftPanel.componentCheckbox'),
  } as ReportComponent);

  const addLine = () => addComponentToCurrentBand({
    id: createId('line'),
    type: 'line',
    name: t('leftPanel.componentLine'),
    x: 10,
    y: 8,
    width: 50,
    height: 1,
    startX: 0,
    startY: 0,
    endX: 50,
    endY: 0,
    lineColor: '#000000',
    lineWidth: 0.2,
    lineStyle: 'solid',
  } as ReportComponent);

  const addTable = () => {
    const state = useDesignerStore.getState();
    const dataSource = state.template.dataSources[0];
    const sourceFields = dataSource?.schema ?? dataSource?.fields ?? [];
    const columns = (sourceFields.length ? sourceFields.slice(0, 3) : [
      { name: 'field1', type: 'string' as const, label: t('ribbon.defaultField', { index: 1 }) },
      { name: 'field2', type: 'string' as const, label: t('ribbon.defaultField', { index: 2 }) },
      { name: 'field3', type: 'string' as const, label: t('ribbon.defaultField', { index: 3 }) },
    ]).map((field, index) => ({
      id: createId(`col_${index + 1}`),
      header: field.label || field.name || t('ribbon.defaultField', { index: index + 1 }),
      field: field.name,
      width: 30,
      cellType: 'text' as const,
    }));

    addComponentToCurrentBand({
      id: createId('table'),
      type: 'table',
      name: t('leftPanel.componentTable'),
      x: 10,
      y: 8,
      width: Math.max(60, columns.length * 30),
      height: 36,
      dataSource: dataSource?.id || '',
      columns,
      rowCount: 3,
      columnCount: columns.length,
      headerRowsCount: 1,
      footerRowsCount: 0,
      headerHeight: 8,
      rowHeight: 8,
      showBorder: true,
    } as ReportComponent);
  };

  const updateCurrentPage = (settings: Partial<Page>) => {
    const state = useDesignerStore.getState();
    if (!state.currentPageId) return;
    state.setPageSettings(state.currentPageId, settings);
  };

  const setPagePreset = (width: number, height: number, orientation: Page['orientation']) => {
    updateCurrentPage({ width, height, orientation });
  };

  const setMargins = (margins: Margins) => updateCurrentPage({ margins });

  const renderMultiSelectLayoutGroups = () => (
    <>
      <RibbonGroup title={t('ribbon.arrange')}>
        <RibbonButton label={t('ribbon.bringToFront')} icon={<ArrowUpOutlined aria-hidden />} onClick={bringToFront} disabled={!hasSelection} />
        <RibbonButton label={t('ribbon.sendToBack')} icon={<ArrowDownOutlined aria-hidden />} onClick={sendToBack} disabled={!hasSelection} />
      </RibbonGroup>

      <RibbonGroup title={t('ribbon.align')}>
        <RibbonButton label={t('ribbon.alignLeft')} icon={<AlignLeftOutlined aria-hidden />} onClick={() => alignComponents('left')} disabled={!hasMultiSelection} />
        <RibbonButton label={t('ribbon.alignCenter')} icon={<AlignCenterOutlined aria-hidden />} onClick={() => alignComponents('center-h')} disabled={!hasMultiSelection} />
        <RibbonButton label={t('ribbon.alignRight')} icon={<AlignRightOutlined aria-hidden />} onClick={() => alignComponents('right')} disabled={!hasMultiSelection} />
        <RibbonButton label={t('ribbon.alignTop')} icon={<VerticalAlignTopOutlined aria-hidden />} onClick={() => alignComponents('top')} disabled={!hasMultiSelection} />
        <RibbonButton label={t('ribbon.alignMiddle')} icon={<VerticalAlignMiddleOutlined aria-hidden />} onClick={() => alignComponents('center-v')} disabled={!hasMultiSelection} />
        <RibbonButton label={t('ribbon.alignBottom')} icon={<VerticalAlignBottomOutlined aria-hidden />} onClick={() => alignComponents('bottom')} disabled={!hasMultiSelection} />
      </RibbonGroup>

      <RibbonGroup title={t('ribbon.distribute')}>
        <RibbonButton label={t('ribbon.distributeHorizontal')} icon={<ColumnWidthOutlined aria-hidden />} onClick={() => alignComponents('distribute-h')} disabled={!hasDistributableSelection} />
        <RibbonButton label={t('ribbon.distributeVertical')} icon={<ColumnHeightOutlined aria-hidden />} onClick={() => alignComponents('distribute-v')} disabled={!hasDistributableSelection} />
      </RibbonGroup>

      <RibbonGroup title={t('ribbon.sizeTools')}>
        <RibbonButton label={t('ribbon.sameWidth')} icon={<ColumnWidthOutlined aria-hidden />} onClick={() => sizeComponents('same-width')} disabled={!hasMultiSelection} />
        <RibbonButton label={t('ribbon.sameHeight')} icon={<ColumnHeightOutlined aria-hidden />} onClick={() => sizeComponents('same-height')} disabled={!hasMultiSelection} />
        <RibbonButton label={t('ribbon.sameSize')} icon={<CompressOutlined aria-hidden />} onClick={() => sizeComponents('same-size')} disabled={!hasMultiSelection} />
      </RibbonGroup>

      <RibbonGroup title={t('ribbon.borders')}>
        <Tooltip title={t('ribbon.allBorders')}>
          <Button aria-label={t('ribbon.allBorders')} size="small" icon={<BorderOuterOutlined aria-hidden />} disabled={borderDisabled} onClick={() => setBorderAll(true)} />
        </Tooltip>
      </RibbonGroup>
    </>
  );

  const renderRibbonGroups = () => {
    const bandMenuItems = SUPPORTED_INSERT_BAND_TYPES.map(type => ({
      key: type,
      label: (
        <Popover
          placement="right"
          trigger="hover"
          mouseEnterDelay={0}
          mouseLeaveDelay={0}
          classNames={{ root: 'rd-band-help-popover' }}
          content={<BandDescriptionPanel type={type} />}
        >
          <span className="rd-band-menu-item" data-band-type={type} data-testid={`band-menu-item-${type}`}>
            <BandGlyph type={type} />
            <span>{t(BAND_LABEL_KEYS[type])}</span>
          </span>
        </Popover>
      ),
    }));

    if (activeTab === 'insert') {
      return (
        <>
          <RibbonGroup title={t('ribbon.bands')}>
            <Dropdown
              trigger={['click']}
              menu={{
                items: bandMenuItems,
                onClick: ({ key }) => beginBandInsert(key as BandType),
              }}
            >
              <Button
                aria-label={t('ribbon.insertBand')}
                size="small"
                icon={<RibbonComboIcon main={<ApartmentOutlined aria-hidden />} suffix={<DownOutlined aria-hidden />} />}
              />
            </Dropdown>
          </RibbonGroup>

          <RibbonGroup title={t('ribbon.components')}>
            <RibbonButton label={t('ribbon.text')} icon={<FontSizeOutlined aria-hidden />} onClick={addText} />
            <RibbonButton label={t('ribbon.table')} icon={<TableOutlined aria-hidden />} onClick={addTable} />
            <RibbonButton label={t('ribbon.image')} icon={<PictureOutlined aria-hidden />} onClick={addImage} />
            <RibbonButton label={t('ribbon.checkbox')} icon={<CheckSquareOutlined aria-hidden />} onClick={addCheckbox} />
            <RibbonButton label={t('ribbon.line')} icon={<LineOutlined aria-hidden />} onClick={addLine} />
          </RibbonGroup>
        </>
      );
    }

    if (activeTab === 'pageLayout') {
      return (
        <>
          <RibbonGroup title={t('ribbon.pageSetup')}>
            <RibbonButton label={t('ribbon.pageSettings')} icon={<SettingOutlined aria-hidden />} onClick={() => setPageDialogOpen(true)} />
          </RibbonGroup>

          <RibbonGroup title={t('ribbon.size')}>
            <RibbonButton label={t('ribbon.a4Portrait')} icon={<ColumnHeightOutlined aria-hidden />} onClick={() => setPagePreset(210, 297, 'portrait')} />
            <RibbonButton label={t('ribbon.a4Landscape')} icon={<ColumnWidthOutlined aria-hidden />} onClick={() => setPagePreset(297, 210, 'landscape')} />
          </RibbonGroup>

          <RibbonGroup title={t('ribbon.margins')}>
            <RibbonButton label={t('ribbon.normalMargins')} icon={<BorderOuterOutlined aria-hidden />} onClick={() => setMargins({ top: 10, right: 10, bottom: 10, left: 10 })} />
            <RibbonButton label={t('ribbon.narrowMargins')} icon={<CompressOutlined aria-hidden />} onClick={() => setMargins({ top: 5, right: 5, bottom: 5, left: 5 })} />
            <RibbonButton label={t('ribbon.wideMargins')} icon={<AppstoreOutlined aria-hidden />} onClick={() => setMargins({ top: 20, right: 20, bottom: 20, left: 20 })} />
          </RibbonGroup>
        </>
      );
    }

    if (activeTab === 'layout') {
      return renderMultiSelectLayoutGroups();
    }

    if (activeTab === 'preview') {
      return (
        <>
          <RibbonGroup title={t('ribbon.printPreview')}>
            <Tooltip title={t('ribbon.printPreview')}>
              <Button size="small" icon={<PrinterOutlined />} type="primary" onClick={() => setMode('preview')}>
                {t('ribbon.preview')}
              </Button>
            </Tooltip>
          </RibbonGroup>
        </>
      );
    }

    return (
      <>
        <RibbonGroup title={t('ribbon.file')}>
          <Tooltip title={t('ribbon.saveTemplate')}>
            <Button size="small" icon={<SaveOutlined />} onClick={saveTemplate} />
          </Tooltip>
        </RibbonGroup>

        <RibbonGroup title={t('ribbon.history')}>
          <Tooltip title={t('shell.undo')}>
            <Button size="small" icon={<UndoOutlined />} disabled={!canUndo()} onClick={undo} />
          </Tooltip>
          <Tooltip title={t('shell.redo')}>
            <Button size="small" icon={<RedoOutlined />} disabled={!canRedo()} onClick={redo} />
          </Tooltip>
        </RibbonGroup>

        <RibbonGroup title={t('ribbon.clipboard')}>
          <RibbonButton label={t('ribbon.copy')} icon={<CopyOutlined aria-hidden />} onClick={copySelected} disabled={!hasSelection} />
          <RibbonButton label={t('ribbon.cut')} icon={<ScissorOutlined aria-hidden />} onClick={cutSelected} disabled={!hasSelection} />
          <RibbonButton label={t('ribbon.paste')} icon={<SaveOutlined aria-hidden rotate={90} />} onClick={pasteClipboard} disabled={!hasClipboard} />
          <RibbonButton label={t('ribbon.duplicate')} icon={<CopyOutlined aria-hidden />} onClick={duplicateSelected} disabled={!hasSelection} />
          <RibbonButton label={t('ribbon.deleteSelected')} icon={<DeleteOutlined aria-hidden />} onClick={deleteSelected} disabled={!hasSelection} danger />
        </RibbonGroup>

        <RibbonGroup title={t('ribbon.font')}>
          <Select
            size="small"
            aria-label={t('ribbon.fontSizeControl')}
            value={fontInfo?.size || 12}
            style={{ width: 64 }}
            suffixIcon={<FontSizeOutlined />}
            disabled={fontSizeDisabled}
            onChange={setFontSize}
            options={[8, 9, 10, 11, 12, 14, 16, 18, 20, 24].map(size => ({ value: size, label: String(size) }))}
          />
          <Button aria-label={t('ribbon.boldControl')} size="small" disabled={fontBoldDisabled} type={fontInfo?.bold ? 'primary' : 'default'} onClick={() => setFontBold(!fontInfo?.bold)}>
            B
          </Button>
        </RibbonGroup>

        <RibbonGroup title={t('ribbon.align')}>
          <Button aria-label={`${t('ribbon.text')} ${t('styleLibrary.left')}`} size="small" icon={<AlignLeftOutlined aria-hidden />} disabled={textAlignDisabled} type={textAlign === 'left' ? 'primary' : 'default'} onClick={() => setTextAlign('left')} />
          <Button aria-label={`${t('ribbon.text')} ${t('styleLibrary.center')}`} size="small" icon={<AlignCenterOutlined aria-hidden />} disabled={textAlignDisabled} type={textAlign === 'center' ? 'primary' : 'default'} onClick={() => setTextAlign('center')} />
          <Button aria-label={`${t('ribbon.text')} ${t('styleLibrary.right')}`} size="small" icon={<AlignRightOutlined aria-hidden />} disabled={textAlignDisabled} type={textAlign === 'right' ? 'primary' : 'default'} onClick={() => setTextAlign('right')} />
        </RibbonGroup>

        <RibbonGroup title={t('ribbon.styles')}>
          <Button size="small" icon={<AppstoreOutlined />} onClick={openTextStyleLibrary}>
            {t('ribbon.styleDesigner')}
          </Button>
          <Button
            aria-label={t('ribbon.conditionalFormats')}
            size="small"
            icon={<PartitionOutlined aria-hidden />}
            onClick={openConditionalFormatLibrary}
          >
            {t('ribbon.conditionalFormats')}
          </Button>
        </RibbonGroup>
      </>
    );
  };

  return (
    <div className="rd-ribbon" data-testid="designer-ribbon">
      <div className="rd-ribbon-tabs">
        {TAB_KEYS.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? 'rd-ribbon-tab rd-ribbon-tab-active' : 'rd-ribbon-tab'}
            type="button"
            onClick={() => handleTabClick(tab)}
          >
            {t(TAB_LABEL_KEYS[tab])}
          </button>
        ))}
      </div>

      <div className="rd-ribbon-content" data-testid="designer-ribbon-content">
        {renderRibbonGroups()}
      </div>
      <PageSetupDialog open={pageDialogOpen} onClose={() => setPageDialogOpen(false)} />
    </div>
  );
};

const RibbonGroup: React.FC<React.PropsWithChildren<{ title: string }>> = ({ title, children }) => (
  <div className="rd-ribbon-group">
    <div className="rd-ribbon-group-controls">{children}</div>
    <span className="rd-ribbon-divider" />
    <div className="rd-ribbon-group-title">{title}</div>
  </div>
);

const RibbonButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}> = ({ label, icon, disabled, danger, onClick }) => (
  <Tooltip title={label}>
    <Button
      aria-label={label}
      size="small"
      icon={icon}
      disabled={disabled}
      danger={danger}
      onClick={onClick}
    />
  </Tooltip>
);

const RibbonComboIcon: React.FC<{ main: React.ReactNode; suffix: React.ReactNode }> = ({ main, suffix }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
    {main}
    <span style={{ fontSize: 10 }}>{suffix}</span>
  </span>
);

const BandGlyph: React.FC<{ type: BandType }> = ({ type }) => {
  const color = BAND_COLORS[type];
  const glyph = BAND_GLYPH_KEYS[type];

  return (
    <span
      className="rd-band-glyph"
      aria-hidden
      data-testid={`band-menu-glyph-${type}`}
      data-band-color={color}
      data-band-glyph={glyph}
      style={{ borderColor: color, color }}
    >
      <span className={`rd-band-glyph-mark rd-band-glyph-${glyph}`} />
    </span>
  );
};

const BandDescriptionPanel: React.FC<{ type: BandType }> = ({ type }) => {
  const { t } = useDesignerI18n();
  const color = BAND_COLORS[type];

  return (
    <aside
      className="rd-band-menu-description"
      data-testid="band-menu-description"
      style={{ borderTopColor: color }}
    >
      <div className="rd-band-menu-description-title">{t(BAND_LABEL_KEYS[type])}</div>
      <div className="rd-band-menu-description-text">{t(BAND_DESCRIPTION_KEYS[type])}</div>
    </aside>
  );
};
