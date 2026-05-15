import React, { useEffect, useState } from 'react';
import { Button, Select, Tooltip } from 'antd';
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  AppstoreOutlined,
  PartitionOutlined,
  BorderOuterOutlined,
  CheckSquareOutlined,
  DeleteOutlined,
  FileAddOutlined,
  FolderOpenOutlined,
  FontSizeOutlined,
  LineOutlined,
  PlusOutlined,
  PictureOutlined,
  PrinterOutlined,
  SaveOutlined,
  SettingOutlined,
  TableOutlined,
  UndoOutlined,
  RedoOutlined,
  DatabaseOutlined,
  ApartmentOutlined,
  GroupOutlined,
} from '@ant-design/icons';
import type { BorderConfig, FontConfig, Margins, Page, ReportComponent, TextComponent } from '@report-designer/core';
import { useDesignerStore } from '../../store/designer-store';
import { BandWizardDialog } from '../dialogs/BandWizardDialog';
import { GroupWizardDialog } from '../dialogs/GroupWizardDialog';
import { JsonDataSourceDialog } from '../dialogs/JsonDataSourceDialog';
import { PageSetupDialog } from '../dialogs/PageSetupDialog';
import { useDesignerI18n } from '../../i18n';

const TAB_KEYS = ['home', 'insert', 'pageLayout', 'preview'] as const;
type RibbonTab = typeof TAB_KEYS[number];

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
  const [dataDialogOpen, setDataDialogOpen] = useState(false);
  const [bandDialogOpen, setBandDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    deleteSelected,
    copySelected,
    pasteClipboard,
    getClipboard,
    setFontBold,
    setFontSize,
    setTextAlign,
    setBorderAll,
    addPage,
    getSelectedFont,
    getSelectedTextAlign,
    openTextStyleLibrary,
    openConditionalFormatLibrary,
    setMode,
  } = useDesignerStore();

  const selectedCount = useDesignerStore(s => s.selectedComponentIds.length);
  const template = useDesignerStore(s => s.template);
  const mode = useDesignerStore(s => s.mode);
  const fontInfo = getSelectedFont();
  const textAlign = getSelectedTextAlign();

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
    name: 'Text',
    x: 10,
    y: 8,
    width: 45,
    height: 10,
    text: 'Text',
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
    name: 'Image',
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
    name: 'CheckBox',
    x: 10,
    y: 8,
    width: 25,
    height: 8,
    checked: 'false',
    label: 'Check',
  } as ReportComponent);

  const addLine = () => addComponentToCurrentBand({
    id: createId('line'),
    type: 'line',
    name: 'Line',
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
      { name: 'field1', type: 'string' as const, label: 'Field 1' },
      { name: 'field2', type: 'string' as const, label: 'Field 2' },
      { name: 'field3', type: 'string' as const, label: 'Field 3' },
    ]).map((field, index) => ({
      id: createId(`col_${index + 1}`),
      header: field.label || field.name,
      field: field.name,
      width: 30,
      cellType: 'text' as const,
    }));

    addComponentToCurrentBand({
      id: createId('table'),
      type: 'table',
      name: 'Table',
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

  const renderRibbonGroups = () => {
    if (activeTab === 'insert') {
      return (
        <>
          <RibbonGroup title={t('ribbon.data')}>
            <Tooltip title={t('ribbon.jsonDataSource')}>
              <Button size="small" icon={<DatabaseOutlined />} onClick={() => setDataDialogOpen(true)}>
                JSON
              </Button>
            </Tooltip>
          </RibbonGroup>

          <RibbonGroup title={t('ribbon.bands')}>
            <Tooltip title={t('ribbon.bandWizard')}>
              <Button size="small" icon={<ApartmentOutlined />} onClick={() => setBandDialogOpen(true)}>
                {t('ribbon.bands')}
              </Button>
            </Tooltip>
            <Tooltip title={t('ribbon.groupWizard')}>
              <Button size="small" icon={<GroupOutlined />} onClick={() => setGroupDialogOpen(true)}>
                {t('ribbon.groupWizard')}
              </Button>
            </Tooltip>
          </RibbonGroup>

          <RibbonGroup title={t('ribbon.components')}>
            <Button size="small" icon={<FontSizeOutlined />} onClick={addText}>{t('ribbon.text')}</Button>
            <Button size="small" icon={<TableOutlined />} onClick={addTable}>{t('ribbon.table')}</Button>
            <Button size="small" icon={<PictureOutlined />} onClick={addImage}>{t('ribbon.image')}</Button>
            <Button size="small" icon={<CheckSquareOutlined />} onClick={addCheckbox}>{t('ribbon.checkbox')}</Button>
            <Button size="small" icon={<LineOutlined />} onClick={addLine}>{t('ribbon.line')}</Button>
          </RibbonGroup>
        </>
      );
    }

    if (activeTab === 'pageLayout') {
      return (
        <>
          <RibbonGroup title={t('ribbon.pageSetup')}>
            <Tooltip title={t('ribbon.addPage')}>
              <Button size="small" icon={<PlusOutlined />} onClick={addPage} />
            </Tooltip>
            <Tooltip title={t('ribbon.pageSettings')}>
              <Button size="small" icon={<SettingOutlined />} onClick={() => setPageDialogOpen(true)}>
                {t('ribbon.pageSettings')}
              </Button>
            </Tooltip>
          </RibbonGroup>

          <RibbonGroup title={t('ribbon.size')}>
            <Button size="small" onClick={() => setPagePreset(210, 297, 'portrait')}>{t('ribbon.a4Portrait')}</Button>
            <Button size="small" onClick={() => setPagePreset(297, 210, 'landscape')}>{t('ribbon.a4Landscape')}</Button>
          </RibbonGroup>

          <RibbonGroup title={t('ribbon.margins')}>
            <Button size="small" onClick={() => setMargins({ top: 10, right: 10, bottom: 10, left: 10 })}>{t('ribbon.normalMargins')}</Button>
            <Button size="small" onClick={() => setMargins({ top: 5, right: 5, bottom: 5, left: 5 })}>{t('ribbon.narrowMargins')}</Button>
            <Button size="small" onClick={() => setMargins({ top: 20, right: 20, bottom: 20, left: 20 })}>{t('ribbon.wideMargins')}</Button>
          </RibbonGroup>
        </>
      );
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
          <Tooltip title={t('ribbon.newReport')}>
            <Button size="small" icon={<FileAddOutlined />} />
          </Tooltip>
          <Tooltip title={t('ribbon.openTemplate')}>
            <Button size="small" icon={<FolderOpenOutlined />} />
          </Tooltip>
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
          <Button size="small" onClick={copySelected} disabled={selectedCount === 0}>{t('ribbon.copy')}</Button>
          <Button size="small" onClick={pasteClipboard} disabled={getClipboard().length === 0}>{t('ribbon.paste')}</Button>
          <Tooltip title={t('ribbon.deleteSelected')}>
            <Button size="small" danger icon={<DeleteOutlined />} onClick={deleteSelected} disabled={selectedCount === 0} />
          </Tooltip>
        </RibbonGroup>

        <RibbonGroup title={t('ribbon.font')}>
          <Select
            size="small"
            value={fontInfo?.size || 12}
            style={{ width: 64 }}
            suffixIcon={<FontSizeOutlined />}
            disabled={!fontInfo}
            onChange={setFontSize}
            options={[8, 9, 10, 11, 12, 14, 16, 18, 20, 24].map(size => ({ value: size, label: String(size) }))}
          />
          <Button size="small" disabled={!fontInfo} type={fontInfo?.bold ? 'primary' : 'default'} onClick={() => setFontBold(!fontInfo?.bold)}>
            B
          </Button>
        </RibbonGroup>

        <RibbonGroup title={t('ribbon.align')}>
          <Button size="small" icon={<AlignLeftOutlined />} disabled={textAlign === null} type={textAlign === 'left' ? 'primary' : 'default'} onClick={() => setTextAlign('left')} />
          <Button size="small" icon={<AlignCenterOutlined />} disabled={textAlign === null} type={textAlign === 'center' ? 'primary' : 'default'} onClick={() => setTextAlign('center')} />
          <Button size="small" icon={<AlignRightOutlined />} disabled={textAlign === null} type={textAlign === 'right' ? 'primary' : 'default'} onClick={() => setTextAlign('right')} />
          <Tooltip title={t('ribbon.allBorders')}>
            <Button size="small" icon={<BorderOuterOutlined />} disabled={selectedCount === 0} onClick={() => setBorderAll(true)} />
          </Tooltip>
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
            {t(tab === 'home' ? 'ribbon.home' : tab === 'insert' ? 'ribbon.insert' : tab === 'pageLayout' ? 'ribbon.pageLayout' : 'ribbon.preview')}
          </button>
        ))}
      </div>

      <div className="rd-ribbon-content" data-testid="designer-ribbon-content">
        {renderRibbonGroups()}
      </div>
      <JsonDataSourceDialog open={dataDialogOpen} onClose={() => setDataDialogOpen(false)} />
      <BandWizardDialog open={bandDialogOpen} onClose={() => setBandDialogOpen(false)} />
      <GroupWizardDialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)} />
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
