import { create } from 'zustand';
import type {
  Band,
  BandType,
  BandEventName,
  ComponentEventName,
  ConditionalFormat,
  EventMap,
  EventScript,
  PageEventName,
  Page,
  ReportComponent,
  ReportEventName,
  ReportStyle,
  ReportTemplate,
  TableCell,
  TableComponent,
  TextComponent,
} from '@report-designer/core';
import { createDefaultTemplate, getDefaultTextStyle, normalizeTemplate } from '@report-designer/core';
import { CommandDispatcher, registerCommand } from '@report-designer/core';
import type { ReportUnit } from '../page-settings';
import { ensureTemplateBandNames, ensureTemplateComponentNames, getNextBandName, getNextComponentName, prepareBandForInsert, prepareComponentForInsert } from '../report-structure';
import {
  applyDefaultTextStyle,
  applyManualTextComponentUpdates,
  applyTextStyleToComponent,
  clearTextStyleReference,
  normalizeManualTextComponentUpdates,
  syncTextComponentStyle,
} from '../text-style-bindings';
import {
  clearTableCell,
  clearTableCellStyle,
  copyTableCellStyle,
  deleteTableColumn,
  deleteTableRow,
  equalizeTableColumns,
  equalizeTableRows,
  insertTableColumn,
  insertTableRow,
  mergeTableCellRange,
  mergeTableCellRight,
  pasteTableCellStyle,
  setTableStructure,
  splitTableCell,
  normalizeTable,
  type TableCellStyleClipboard,
} from '../table/table-structure';

export interface TableCellSelection {
  tableId: string;
  bandId: string;
  startRow: number;
  startColumn: number;
  endRow: number;
  endColumn: number;
}

export interface DesignerEventNavigationTarget {
  ownerType: 'report' | 'page' | 'band' | 'component';
  ownerId: string;
  eventName: string;
  line?: number;
  column?: number;
  nonce?: number;
}

export interface PendingEventEditorTarget extends DesignerEventNavigationTarget {
  requestId: number;
}

export interface DesignerState {
  template: ReportTemplate;
  currentPageId: string;
  mode: 'design' | 'preview';
  textStyleLibraryOpen: boolean;
  conditionalFormatLibraryOpen: boolean;
  selectedComponentIds: string[];
  selectedBandId: string | null;
  pendingBandInsertType: BandType | null;
  selectedTableCell: TableCellSelection | null;
  tableCellStyleClipboard: TableCellStyleClipboard | null;
  pendingEventEditorTarget: PendingEventEditorTarget | null;
  dataSources: Record<string, any[]>;
  dispatcher: CommandDispatcher;
  clipboard: ReportComponent[];
  reportUnit: ReportUnit;
  zoom: number;

  // Actions
  loadTemplate: (template: ReportTemplate) => void;
  updateTemplate: (updater: (template: ReportTemplate) => ReportTemplate) => void;
  replaceReportEvents: (events: EventMap<ReportEventName>) => void;
  replacePageEvents: (pageId: string, events: EventMap<PageEventName>) => void;
  replaceBandEvents: (pageId: string, bandId: string, events: EventMap<BandEventName>) => void;
  replaceComponentEvents: (pageId: string, bandId: string, componentId: string, events: EventMap<ComponentEventName>) => void;
  updateReportEvent: (eventName: ReportEventName, event: EventScript) => void;
  updatePageEvent: (pageId: string, eventName: PageEventName, event: EventScript) => void;
  updateBandEvent: (pageId: string, bandId: string, eventName: BandEventName, event: EventScript) => void;
  updateComponentEvent: (pageId: string, bandId: string, componentId: string, eventName: ComponentEventName, event: EventScript) => void;
  setCurrentPage: (pageId: string) => void;
  setMode: (mode: 'design' | 'preview') => void;
  openTextStyleLibrary: () => void;
  closeTextStyleLibrary: () => void;
  openConditionalFormatLibrary: () => void;
  closeConditionalFormatLibrary: () => void;
  selectComponents: (componentIds: string[]) => void;
  selectBand: (bandId: string | null) => void;
  beginBandInsert: (bandType: BandType) => void;
  cancelBandInsert: () => void;
  insertBandAfter: (pageId: string, afterBandId: string, bandType?: BandType) => void;
  duplicateBandAfter: (pageId: string, bandId: string) => void;
  moveBand: (pageId: string, bandId: string, targetIndex: number) => void;
  selectTableCell: (selection: TableCellSelection | null) => void;
  openEventEditorTarget: (target: DesignerEventNavigationTarget) => void;
  consumeEventEditorTarget: (requestId: number) => void;
  setDataSources: (data: Record<string, any[]>) => void;
  setReportUnit: (unit: ReportUnit) => void;
  setZoom: (zoom: number) => void;

  // Command-dispatched actions
  addComponent: (pageId: string, bandId: string, component: ReportComponent) => void;
  addComponentToPanel: (pageId: string, bandId: string, panelId: string, component: ReportComponent) => void;
  removeComponent: (pageId: string, bandId: string, componentId: string) => void;
  updateComponent: (pageId: string, bandId: string, componentId: string, updates: Record<string, any>, previous?: Record<string, any>) => void;
  updateComponentSilent: (pageId: string, bandId: string, componentId: string, updates: Record<string, any>) => void;
  moveComponent: (pageId: string, bandId: string, componentId: string, x: number, y: number, prevX?: number, prevY?: number) => void;
  moveComponentSilent: (pageId: string, bandId: string, componentId: string, x: number, y: number) => void;
  resizeBand: (pageId: string, bandId: string, newHeight: number, oldHeight?: number) => void;
  resizeBandSilent: (pageId: string, bandId: string, newHeight: number) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Alignment / Size / Layer
  alignComponents: (alignment: string) => void;
  sizeComponents: (sizeMode: string) => void;
  bringToFront: () => void;
  sendToBack: () => void;

  // Component operations
  deleteSelected: () => void;
  copySelected: () => void;
  cutSelected: () => void;
  duplicateSelected: () => void;
  pasteClipboard: () => void;
  getClipboard: () => ReportComponent[];
  moveSelectedBy: (dx: number, dy: number) => void;
  resizeSelectedBy: (dw: number, dh: number) => void;
  toggleSelectedFontStyle: (style: 'bold' | 'italic' | 'underline' | 'strikethrough') => void;
  updateSelectedTable: (updates: Parameters<typeof setTableStructure>[1]) => void;
  updateSelectedTableCell: (updates: Partial<TableCell>) => void;
  applySelectedStyle: (styleId: string | undefined) => void;
  createTextStyle: (style?: Partial<ReportStyle> & { name?: string }) => string;
  duplicateTextStyle: (styleId: string) => string | undefined;
  renameTextStyle: (styleId: string, name: string) => void;
  updateTextStyle: (styleId: string, updates: Partial<ReportStyle>) => void;
  deleteTextStyle: (styleId: string) => void;
  setDefaultTextStyle: (styleId: string | undefined) => void;
  syncTextStyleReferences: (styleId?: string) => void;
  getTextStyleUsageCount: (styleId: string) => number;
  applySelectedConditionalFormat: (formatId: string | undefined) => void;
  createConditionalFormat: (format?: Partial<ConditionalFormat> & { name?: string }) => string;
  duplicateConditionalFormat: (formatId: string) => string | undefined;
  updateConditionalFormat: (formatId: string, updates: Partial<ConditionalFormat>) => void;
  deleteConditionalFormat: (formatId: string) => void;
  insertSelectedTableColumn: (afterColumn?: number) => void;
  deleteSelectedTableColumn: (columnIndex?: number) => void;
  insertSelectedTableRow: (afterRow?: number) => void;
  deleteSelectedTableRow: (rowIndex?: number) => void;
  mergeSelectedTableCellRight: (row: number, column: number) => void;
  mergeSelectedTableCellRange: () => void;
  splitSelectedTableCell: (row: number, column: number) => void;
  clearSelectedTableCell: (row: number, column: number) => void;
  clearSelectedTableCellStyle: (row: number, column: number) => void;
  copySelectedTableCellStyle: (row: number, column: number) => void;
  pasteSelectedTableCellStyle: (row: number, column: number) => void;
  equalizeSelectedTableColumns: () => void;
  equalizeSelectedTableRows: () => void;

  // Band management
  addBand: (pageId: string, band: Omit<Band, 'id'>) => void;
  deleteBand: (pageId: string, bandId: string) => void;

  // Page management
  addPage: () => void;
  deletePage: (pageId: string) => void;
  setPageSettings: (pageId: string, settings: Partial<Page>) => void;

  // Font / text helpers (for toolbar)
  setFontBold: (bold: boolean) => void;
  setFontSize: (size: number) => void;
  setTextAlign: (align: 'left' | 'center' | 'right') => void;
  setBorderAll: (enabled: boolean) => void;
  getSelectedFont: () => { family?: string; size?: number; bold?: boolean; italic?: boolean; underline?: boolean; strikethrough?: boolean; color?: string } | null;
  getSelectedTextAlign: () => ('left' | 'center' | 'right') | null;
}

const DEFAULT_PAGE_WIDTH = 210; // A4
const DEFAULT_PAGE_HEIGHT = 297;

const UPDATE_COMPONENTS_COMMAND = 'update-components';
const INSERT_BAND_COMMAND = 'insert-band';
const DELETE_BAND_COMMAND = 'delete-band';
const MOVE_BAND_COMMAND = 'move-band';

const DEFAULT_BAND_HEIGHTS: Record<BandType, number> = {
  reportTitle: 40,
  reportSummary: 30,
  pageHeader: 20,
  pageFooter: 20,
  header: 20,
  footer: 20,
  columnHeader: 18,
  columnFooter: 18,
  groupHeader: 25,
  groupFooter: 25,
  data: 20,
  hierarchicalData: 20,
  child: 15,
  emptyData: 20,
  overlay: 20,
};

if (!CommandDispatcher.isAllowed(UPDATE_COMPONENTS_COMMAND)) {
  registerCommand(
    UPDATE_COMPONENTS_COMMAND,
    (state, payload) => applyComponentUpdates(state, payload.updates ?? []),
    (state, payload) => applyComponentUpdates(state, payload.previous ?? []),
  );
}

if (!CommandDispatcher.isAllowed(INSERT_BAND_COMMAND)) {
  registerCommand(
    INSERT_BAND_COMMAND,
    (state, payload) => insertBandInTemplate(state, payload.pageId, payload.afterBandId, payload.band),
    (state, payload) => ({
      ...state,
      pages: state.pages.map(page => page.id === payload.pageId
        ? { ...page, bands: page.bands.filter(band => band.id !== payload.band.id) }
        : page),
    }),
  );
}

if (!CommandDispatcher.isAllowed(DELETE_BAND_COMMAND)) {
  registerCommand(
    DELETE_BAND_COMMAND,
    (state, payload) => ({
      ...state,
      pages: state.pages.map(page => page.id === payload.pageId
        ? { ...page, bands: page.bands.filter(band => band.id !== payload.band.id) }
        : page),
    }),
    (state, payload) => ({
      ...state,
      pages: state.pages.map(page => {
        if (page.id !== payload.pageId) return page;
        const index = Math.max(0, Math.min(payload.index ?? page.bands.length, page.bands.length));
        return {
          ...page,
          bands: [
            ...page.bands.slice(0, index),
            payload.band,
            ...page.bands.slice(index),
          ],
        };
      }),
    }),
  );
}

if (!CommandDispatcher.isAllowed(MOVE_BAND_COMMAND)) {
  registerCommand(
    MOVE_BAND_COMMAND,
    (state, payload) => moveBandInTemplate(state, payload.pageId, payload.bandId, payload.targetIndex),
    (state, payload) => moveBandInTemplate(state, payload.pageId, payload.bandId, payload.fromIndex),
  );
}

export const useDesignerStore = create<DesignerState>((set, get) => {
  const dispatcher = new CommandDispatcher();
  const updateSelectedTableComponents = (updater: (table: TableComponent) => TableComponent) => {
    const { template, currentPageId, selectedComponentIds, dispatcher } = get();
    if (selectedComponentIds.length === 0) return;
    const page = template.pages.find(p => p.id === currentPageId);
    if (!page) return;

    const selected = new Set(selectedComponentIds);
    const updates: ComponentUpdatePayload[] = [];
    const previous: ComponentUpdatePayload[] = [];

    for (const band of page.bands) {
      for (const component of band.components) {
        if (!selected.has(component.id) || component.type !== 'table') continue;
        const nextTable = updater(component as TableComponent);
        if (JSON.stringify(nextTable) === JSON.stringify(component)) continue;

        const target = {
          pageId: currentPageId,
          bandId: band.id,
          componentId: component.id,
        };
        updates.push({
          ...target,
          updates: nextTable,
        });
        previous.push({
          ...target,
          updates: component,
        });
      }
    }

    if (updates.length === 0) return;

    const nextTemplate = dispatcher.execute(template, {
      type: UPDATE_COMPONENTS_COMMAND,
      payload: {
        pageId: currentPageId,
        updates,
        previous,
      },
      execute: () => template,
      undo: () => template,
    });
    set({ template: nextTemplate });
  };

  const updateSelectedTableCellComponent = (updates: Partial<TableCell>) => {
    const { template, currentPageId, selectedTableCell, dispatcher } = get();
    if (!selectedTableCell) return;

    const normalizedSelection = normalizeTableCellSelection(selectedTableCell);
    const band = findBand(template, currentPageId, normalizedSelection.bandId);
    const component = band?.components.find(item => item.id === normalizedSelection.tableId);
    if (!component || component.type !== 'table') return;

    const nextTable = updateTableCell(component as TableComponent, normalizedSelection, updates);
    if (JSON.stringify(nextTable) === JSON.stringify(component)) return;

    const nextTemplate = dispatcher.execute(template, {
      type: 'update-component',
      payload: {
        pageId: currentPageId,
        bandId: normalizedSelection.bandId,
        componentId: normalizedSelection.tableId,
        updates: nextTable,
        previous: component,
      },
      execute: () => template,
      undo: () => template,
    });
    set({ template: nextTemplate });
  };

  return {
    template: ensureTemplateComponentNames(ensureTemplateBandNames(createDefaultTemplate())),
    currentPageId: '',
    mode: 'design',
    textStyleLibraryOpen: false,
    conditionalFormatLibraryOpen: false,
    selectedComponentIds: [],
    selectedBandId: null,
    pendingBandInsertType: null,
    selectedTableCell: null,
    tableCellStyleClipboard: null,
    pendingEventEditorTarget: null,
    dataSources: {},
    dispatcher,
    clipboard: [],
    reportUnit: 'mm',
    zoom: 1,

  loadTemplate: (template) => {
    const normalizedTemplate = ensureTemplateComponentNames(ensureTemplateBandNames(normalizeTemplate(template)));
    set({
      template: normalizedTemplate,
      currentPageId: normalizedTemplate.pages[0]?.id || '',
      mode: 'design',
      textStyleLibraryOpen: false,
      conditionalFormatLibraryOpen: false,
      selectedComponentIds: [],
      selectedBandId: null,
      pendingBandInsertType: null,
      selectedTableCell: null,
      tableCellStyleClipboard: null,
      pendingEventEditorTarget: null,
      clipboard: [],
      reportUnit: 'mm',
      zoom: 1,
    });
  },

  updateTemplate: (updater) => set(state => ({ template: updater(state.template) })),

  replaceReportEvents: (events) => set(state => ({
    template: { ...state.template, events: cleanEventMap(events) as EventMap<ReportEventName> },
  })),

  replacePageEvents: (pageId, events) => set(state => ({
    template: {
      ...state.template,
      pages: state.template.pages.map(page => page.id === pageId
        ? { ...page, events: cleanEventMap(events) as EventMap<PageEventName> }
        : page),
    },
  })),

  replaceBandEvents: (pageId, bandId, events) => set(state => ({
    template: {
      ...state.template,
      pages: state.template.pages.map(page => page.id === pageId ? {
        ...page,
        bands: page.bands.map(band => band.id === bandId ? {
          ...band,
          events: cleanEventMap(events) as EventMap<BandEventName>,
        } : band),
      } : page),
    },
  })),

  replaceComponentEvents: (pageId, bandId, componentId, events) => set(state => ({
    template: {
      ...state.template,
      pages: state.template.pages.map(page => page.id === pageId ? {
        ...page,
        bands: page.bands.map(band => band.id === bandId ? {
          ...band,
          components: band.components.map(component => (
            component.id === componentId
              ? { ...component, events: cleanEventMap(events) as EventMap<ComponentEventName> }
              : component
          )),
        } : band),
      } : page),
    },
  })),

  updateReportEvent: (eventName, event) => {
    const events = { ...(get().template.events ?? {}), [eventName]: event };
    get().replaceReportEvents(events);
  },

  updatePageEvent: (pageId, eventName, event) => {
    const page = get().template.pages.find(item => item.id === pageId);
    const events = { ...(page?.events ?? {}), [eventName]: event };
    get().replacePageEvents(pageId, events);
  },

  updateBandEvent: (pageId, bandId, eventName, event) => {
    const band = findBand(get().template, pageId, bandId);
    const events = { ...(band?.events ?? {}), [eventName]: event };
    get().replaceBandEvents(pageId, bandId, events);
  },

  updateComponentEvent: (pageId, bandId, componentId, eventName, event) => {
    const band = findBand(get().template, pageId, bandId);
    const component = band?.components.find(item => item.id === componentId);
    const events = { ...(component?.events ?? {}), [eventName]: event };
    get().replaceComponentEvents(pageId, bandId, componentId, events);
  },

  setCurrentPage: (pageId) => set({ currentPageId: pageId }),

  setMode: (mode) => set({ mode }),

  openTextStyleLibrary: () => set({ textStyleLibraryOpen: true }),

  closeTextStyleLibrary: () => set({ textStyleLibraryOpen: false }),

  openConditionalFormatLibrary: () => set({ conditionalFormatLibraryOpen: true }),

  closeConditionalFormatLibrary: () => set({ conditionalFormatLibraryOpen: false }),

  selectComponents: (componentIds) => set({ selectedComponentIds: componentIds, selectedTableCell: null }),

  selectBand: (bandId) => set({ selectedBandId: bandId, selectedTableCell: null }),

  beginBandInsert: (bandType) => set({
    pendingBandInsertType: bandType,
    selectedComponentIds: [],
    selectedBandId: null,
    selectedTableCell: null,
  }),

  cancelBandInsert: () => set({ pendingBandInsertType: null }),

  insertBandAfter: (pageId, afterBandId, bandType) => {
    const { template, dispatcher, pendingBandInsertType } = get();
    const page = template.pages.find(item => item.id === pageId);
    const type = bandType ?? pendingBandInsertType;
    if (!page || !type) return;

    const band = createBandForInsert(page.bands, type);
    const newTemplate = dispatcher.execute(template, {
      type: INSERT_BAND_COMMAND,
      payload: { pageId, afterBandId, band },
      execute: () => template,
      undo: () => template,
    });
    set({
      template: newTemplate,
      selectedComponentIds: [],
      selectedBandId: band.id,
      selectedTableCell: null,
      pendingBandInsertType: null,
    });
  },

  duplicateBandAfter: (pageId, bandId) => {
    const { template, dispatcher } = get();
    const page = template.pages.find(item => item.id === pageId);
    const source = page?.bands.find(band => band.id === bandId);
    if (!page || !source) return;

    const band = cloneBandForInsert(page.bands, source, template);
    const newTemplate = dispatcher.execute(template, {
      type: INSERT_BAND_COMMAND,
      payload: { pageId, afterBandId: bandId, band },
      execute: () => template,
      undo: () => template,
    });
    set({
      template: newTemplate,
      selectedComponentIds: [],
      selectedBandId: band.id,
      selectedTableCell: null,
      pendingBandInsertType: null,
    });
  },

  moveBand: (pageId, bandId, targetIndex) => {
    const { template, dispatcher } = get();
    const page = template.pages.find(item => item.id === pageId);
    const fromIndex = page?.bands.findIndex(band => band.id === bandId) ?? -1;
    if (!page || fromIndex < 0) return;
    const normalizedTargetIndex = clampBandIndex(targetIndex, page.bands.length);
    if (fromIndex === normalizedTargetIndex) {
      set({
        selectedBandId: bandId,
        selectedComponentIds: [],
        selectedTableCell: null,
      });
      return;
    }

    const newTemplate = dispatcher.execute(template, {
      type: MOVE_BAND_COMMAND,
      payload: { pageId, bandId, fromIndex, targetIndex: normalizedTargetIndex },
      execute: () => template,
      undo: () => template,
    });
    set({
      template: newTemplate,
      selectedBandId: bandId,
      selectedComponentIds: [],
      selectedTableCell: null,
      pendingBandInsertType: null,
    });
  },

  selectTableCell: (selection) => set({
    selectedTableCell: selection ? normalizeTableCellSelection(selection) : null,
    selectedComponentIds: selection ? [selection.tableId] : get().selectedComponentIds,
    selectedBandId: selection ? null : get().selectedBandId,
  }),

  openEventEditorTarget: (target) => set(state => ({
    pendingEventEditorTarget: {
      ...target,
      requestId: target.nonce ?? Date.now(),
    },
  })),

  consumeEventEditorTarget: (requestId) => set(state => (
    state.pendingEventEditorTarget?.requestId === requestId
      ? { pendingEventEditorTarget: null }
      : {}
  )),

  setDataSources: (data) => set({ dataSources: data }),

  setReportUnit: (reportUnit) => set({ reportUnit }),

  setZoom: (zoom) => set({ zoom }),

  addComponent: (pageId, bandId, component) => {
    const { template, dispatcher } = get();
    const styledComponent = isTextComponent(component)
      ? applyDefaultTextStyle(component, template.styles)
      : component;
    const normalizedComponent = prepareComponentForInsert(template, styledComponent);
    const newTemplate = dispatcher.execute(template, {
      type: 'add-component',
      payload: { pageId, bandId, component: normalizedComponent },
      execute: () => template,
      undo: () => template,
    });
    set({ template: newTemplate, selectedComponentIds: [normalizedComponent.id], selectedBandId: undefined });
  },

  addComponentToPanel: (pageId, bandId, panelId, component) => {
    const { template, dispatcher } = get();
    const band = findBand(template, pageId, bandId);
    const panel = band?.components.find(item => item.id === panelId && item.type === 'panel') as (ReportComponent & { components?: ReportComponent[] }) | undefined;
    if (!panel) return;
    const styledComponent = isTextComponent(component)
      ? applyDefaultTextStyle(component, template.styles)
      : component;
    const normalizedComponent = prepareComponentForInsert(template, styledComponent);
    const previous = { ...panel, components: [...(panel.components ?? [])] };
    const nextComponents = [...(panel.components ?? []), normalizedComponent];
    const newTemplate = dispatcher.execute(template, {
      type: 'update-component',
      payload: { pageId, bandId, componentId: panelId, updates: { components: nextComponents }, previous },
      execute: () => template,
      undo: () => template,
    });
    set({ template: newTemplate, selectedComponentIds: [panelId], selectedBandId: undefined });
  },

  removeComponent: (pageId, bandId, componentId) => {
    const { template, dispatcher } = get();
    const band = findBand(template, pageId, bandId);
    const comp = band?.components.find(c => c.id === componentId);
    const newTemplate = dispatcher.execute(template, {
      type: 'remove-component',
      payload: { pageId, bandId, componentId, component: comp },
      execute: () => template,
      undo: () => template,
    });
    set({ template: newTemplate });
  },

  updateComponent: (pageId, bandId, componentId, updates, previous) => {
    const { template, dispatcher } = get();
    const band = findBand(template, pageId, bandId);
    const comp = band?.components.find(c => c.id === componentId);
    const normalizedUpdates = comp && isTextComponent(comp)
      ? normalizeManualTextComponentUpdates(comp, updates)
      : updates;
    const prevData = previous || (comp ? { ...comp } : undefined);
    const newTemplate = dispatcher.execute(template, {
      type: 'update-component',
      payload: { pageId, bandId, componentId, updates: normalizedUpdates, previous: prevData },
      execute: () => template,
      undo: () => template,
    });
    set({ template: newTemplate });
  },

  moveComponent: (pageId, bandId, componentId, x, y, prevX, prevY) => {
    const { template, dispatcher } = get();
    const newTemplate = dispatcher.execute(template, {
      type: 'move-component',
      payload: { pageId, bandId, componentId, x, y, prevX, prevY },
      execute: () => template,
      undo: () => template,
    });
    set({ template: newTemplate });
  },

  updateComponentSilent: (pageId, bandId, componentId, updates) => {
    const { template } = get();
    const newTemplate = {
      ...template,
      pages: template.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return {
              ...b,
              components: b.components.map(c => {
                if (c.id !== componentId) return c;
                return { ...c, ...updates };
              }),
            };
          }),
        };
      }),
    };
    set({ template: newTemplate });
  },

  moveComponentSilent: (pageId, bandId, componentId, x, y) => {
    const { template } = get();
    const newTemplate = {
      ...template,
      pages: template.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return {
              ...b,
              components: b.components.map(c => {
                if (c.id !== componentId) return c;
                return { ...c, x, y };
              }),
            };
          }),
        };
      }),
    };
    set({ template: newTemplate });
  },

  resizeBand: (pageId, bandId, newHeight, oldHeight) => {
    const { template, dispatcher } = get();
    const band = findBand(template, pageId, bandId);
    const normalizedHeight = normalizeBandHeight(newHeight, band);
    const newTemplate = dispatcher.execute(template, {
      type: 'resize-band',
      payload: { pageId, bandId, newHeight: normalizedHeight, oldHeight },
      execute: () => template,
      undo: () => template,
    });
    set({ template: newTemplate });
  },

  resizeBandSilent: (pageId, bandId, newHeight) => {
    const { template } = get();
    const newTemplate = {
      ...template,
      pages: template.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return { ...b, height: normalizeBandHeight(newHeight, b) };
          }),
        };
      }),
    };
    set({ template: newTemplate });
  },

  undo: () => {
    const { template, dispatcher } = get();
    const newTemplate = dispatcher.undo(template);
    if (newTemplate) set({ template: newTemplate });
  },

  redo: () => {
    const { template, dispatcher } = get();
    const newTemplate = dispatcher.redo(template);
    if (newTemplate) set({ template: newTemplate });
  },

  canUndo: () => get().dispatcher.canUndo(),

  canRedo: () => get().dispatcher.canRedo(),

  alignComponents: (alignment) => {
    const { template, currentPageId, selectedComponentIds, dispatcher } = get();
    if (selectedComponentIds.length < 2) return;

    // Find all selected components in the same band
    const page = template.pages.find(p => p.id === currentPageId);
    if (!page) return;

    // Group by band
    const byBand = new Map<string, string[]>();
    for (const id of selectedComponentIds) {
      for (const band of page.bands) {
        if (band.components.some(c => c.id === id)) {
          if (!byBand.has(band.id)) byBand.set(band.id, []);
          byBand.get(band.id)!.push(id);
          break;
        }
      }
    }

    let newTemplate = template;
    for (const [bandId, compIds] of byBand) {
      const band = page.bands.find(b => b.id === bandId);
      if (!band) continue;
      const comps = compIds.map(id => band.components.find(c => c.id === id)!).filter(Boolean);
      if (comps.length < 2) continue;

      const updates: Record<string, any>[] = [];
      const previous: Record<string, any>[] = [];

      switch (alignment) {
        case 'left': {
          const minX = Math.min(...comps.map(c => c.x));
          for (const c of comps) {
            previous.push({ x: c.x });
            updates.push({ x: minX });
          }
          break;
        }
        case 'right': {
          const maxX = Math.max(...comps.map(c => c.x + c.width));
          for (const c of comps) {
            previous.push({ x: c.x });
            updates.push({ x: maxX - c.width });
          }
          break;
        }
        case 'center-h': {
          const minX = Math.min(...comps.map(c => c.x));
          const maxX = Math.max(...comps.map(c => c.x + c.width));
          const center = (minX + maxX) / 2;
          for (const c of comps) {
            previous.push({ x: c.x });
            updates.push({ x: center - c.width / 2 });
          }
          break;
        }
        case 'top': {
          const minY = Math.min(...comps.map(c => c.y));
          for (const c of comps) {
            previous.push({ y: c.y });
            updates.push({ y: minY });
          }
          break;
        }
        case 'bottom': {
          const maxY = Math.max(...comps.map(c => c.y + c.height));
          for (const c of comps) {
            previous.push({ y: c.y });
            updates.push({ y: maxY - c.height });
          }
          break;
        }
        case 'center-v': {
          const minY = Math.min(...comps.map(c => c.y));
          const maxY = Math.max(...comps.map(c => c.y + c.height));
          const center = (minY + maxY) / 2;
          for (const c of comps) {
            previous.push({ y: c.y });
            updates.push({ y: center - c.height / 2 });
          }
          break;
        }
        case 'distribute-h': {
          if (comps.length < 3) continue;
          const sorted = [...comps].sort((a, b) => a.x - b.x);
          const minLeft = sorted[0].x;
          const maxRight = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width;
          const totalWidth = sorted.reduce((sum, c) => sum + c.width, 0);
          const gap = (maxRight - minLeft - totalWidth) / (sorted.length - 1);
          let cursor = minLeft;
          for (let i = 0; i < sorted.length; i += 1) {
            const c = sorted[i];
            previous.push({ x: c.x });
            updates.push({ x: Math.round(cursor * 10) / 10 });
            cursor += c.width + gap;
          }
          break;
        }
        case 'distribute-v': {
          if (comps.length < 3) continue;
          const sorted = [...comps].sort((a, b) => a.y - b.y);
          const minTop = sorted[0].y;
          const maxBottom = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
          const totalHeight = sorted.reduce((sum, c) => sum + c.height, 0);
          const gap = (maxBottom - minTop - totalHeight) / (sorted.length - 1);
          let cursor = minTop;
          for (let i = 0; i < sorted.length; i += 1) {
            const c = sorted[i];
            previous.push({ y: c.y });
            updates.push({ y: Math.round(cursor * 10) / 10 });
            cursor += c.height + gap;
          }
          break;
        }
      }

      if (updates.length > 0) {
        newTemplate = dispatcher.execute(newTemplate, {
          type: 'align-components',
          payload: { pageId: currentPageId, bandId, componentIds: compIds, alignment, updates, previous },
          execute: () => newTemplate,
          undo: () => newTemplate,
        });
      }
    }

    set({ template: newTemplate });
  },

  sizeComponents: (sizeMode) => {
    const { template, currentPageId, selectedComponentIds, dispatcher } = get();
    if (selectedComponentIds.length < 2) return;

    const page = template.pages.find(p => p.id === currentPageId);
    if (!page) return;

    // Group by band
    const byBand = new Map<string, string[]>();
    for (const id of selectedComponentIds) {
      for (const band of page.bands) {
        if (band.components.some(c => c.id === id)) {
          if (!byBand.has(band.id)) byBand.set(band.id, []);
          byBand.get(band.id)!.push(id);
          break;
        }
      }
    }

    let newTemplate = template;
    for (const [bandId, compIds] of byBand) {
      const band = page.bands.find(b => b.id === bandId);
      if (!band) continue;
      const comps = compIds.map(id => band.components.find(c => c.id === id)!).filter(Boolean);
      if (comps.length < 2) continue;

      const first = comps[0];
      const updates: Record<string, any>[] = [];
      const previous: Record<string, any>[] = [];

      switch (sizeMode) {
        case 'same-width':
          for (const c of comps) {
            previous.push({ width: c.width });
            updates.push({ width: first.width });
          }
          break;
        case 'same-height':
          for (const c of comps) {
            previous.push({ height: c.height });
            updates.push({ height: first.height });
          }
          break;
        case 'same-size':
          for (const c of comps) {
            previous.push({ width: c.width, height: c.height });
            updates.push({ width: first.width, height: first.height });
          }
          break;
      }

      if (updates.length > 0) {
        newTemplate = dispatcher.execute(newTemplate, {
          type: 'size-components',
          payload: { pageId: currentPageId, bandId, componentIds: compIds, sizeMode, updates, previous },
          execute: () => newTemplate,
          undo: () => newTemplate,
        });
      }
    }

    set({ template: newTemplate });
  },

  bringToFront: () => {
    const { template, currentPageId, selectedComponentIds, dispatcher } = get();
    if (selectedComponentIds.length === 0) return;

    const page = template.pages.find(p => p.id === currentPageId);
    if (!page) return;

    let newTemplate = template;
    for (const band of page.bands) {
      const bandComps = band.components.filter(c => selectedComponentIds.includes(c.id));
      if (bandComps.length === 0) continue;

      const orderedComps = [...bandComps].sort((a, b) => selectedComponentIds.indexOf(a.id) - selectedComponentIds.indexOf(b.id));
      const zOrders = band.components.map(c => c.zOrder ?? 0);
      const maxZ = zOrders.length > 0 ? Math.max(...zOrders) : 0;
      newTemplate = dispatcher.execute(newTemplate, {
        type: 'align-components',
        payload: {
          pageId: currentPageId,
          bandId: band.id,
          componentIds: orderedComps.map(comp => comp.id),
          alignment: 'bring-to-front',
          updates: orderedComps.map((comp, index) => ({ zOrder: maxZ + index + 1 })),
          previous: orderedComps.map(comp => ({ zOrder: comp.zOrder })),
        },
        execute: () => newTemplate,
        undo: () => newTemplate,
      });
    }

    set({ template: newTemplate });
  },

  sendToBack: () => {
    const { template, currentPageId, selectedComponentIds, dispatcher } = get();
    if (selectedComponentIds.length === 0) return;

    const page = template.pages.find(p => p.id === currentPageId);
    if (!page) return;

    let newTemplate = template;
    for (const band of page.bands) {
      const bandComps = band.components.filter(c => selectedComponentIds.includes(c.id));
      if (bandComps.length === 0) continue;

      const orderedComps = [...bandComps].sort((a, b) => selectedComponentIds.indexOf(a.id) - selectedComponentIds.indexOf(b.id));
      const zOrders = band.components.map(c => c.zOrder ?? 0);
      const minZ = zOrders.length > 0 ? Math.min(...zOrders) : 0;
      newTemplate = dispatcher.execute(newTemplate, {
        type: 'align-components',
        payload: {
          pageId: currentPageId,
          bandId: band.id,
          componentIds: orderedComps.map(comp => comp.id),
          alignment: 'send-to-back',
          updates: orderedComps.map((comp, index) => ({ zOrder: minZ - orderedComps.length + index })),
          previous: orderedComps.map(comp => ({ zOrder: comp.zOrder })),
        },
        execute: () => newTemplate,
        undo: () => newTemplate,
      });
    }

    set({ template: newTemplate });
  },

  deleteSelected: () => {
    const { template, currentPageId, selectedComponentIds, selectedBandId, dispatcher } = get();
    const page = template.pages.find(p => p.id === currentPageId);
    if (!page) return;

    if (selectedBandId && selectedComponentIds.length === 0) {
      const bandIndex = page.bands.findIndex(band => band.id === selectedBandId);
      const band = bandIndex >= 0 ? page.bands[bandIndex] : undefined;
      if (!band) return;
      const newTemplate = dispatcher.execute(template, {
        type: DELETE_BAND_COMMAND,
        payload: { pageId: currentPageId, band, index: bandIndex },
        execute: () => template,
        undo: () => template,
      });
      set({
        template: newTemplate,
        selectedBandId: null,
        selectedComponentIds: [],
        selectedTableCell: null,
      });
      return;
    }

    let newTemplate = template;
    for (const band of page.bands) {
      const components = band.components.filter(c => selectedComponentIds.includes(c.id));
      if (components.length === 0) continue;
      for (const component of components) {
        newTemplate = dispatcher.execute(newTemplate, {
          type: 'remove-component',
          payload: { pageId: currentPageId, bandId: band.id, componentId: component.id, component },
          execute: () => newTemplate,
          undo: () => newTemplate,
        });
      }
    }
    set({ template: newTemplate, selectedComponentIds: [] });
  },

  copySelected: () => {
    const { template, currentPageId, selectedComponentIds } = get();
    const page = template.pages.find(p => p.id === currentPageId);
    if (!page) return;
    const comps: ReportComponent[] = [];
    for (const band of page.bands) {
      for (const comp of band.components) {
        if (selectedComponentIds.includes(comp.id)) {
          comps.push({ ...comp });
        }
      }
    }
    set({ clipboard: comps });
  },

  cutSelected: () => {
    get().copySelected();
    get().deleteSelected();
  },

  duplicateSelected: () => {
    get().copySelected();
    get().pasteClipboard();
  },

  pasteClipboard: () => {
    const { template, currentPageId, selectedComponentIds, clipboard, dispatcher } = get();
    if (clipboard.length === 0) return;
    const page = template.pages.find(p => p.id === currentPageId);
    if (!page) return;
    const pasteBandId = selectedComponentIds.length > 0
      ? page.bands.find(b => b.components.some(c => c.id === selectedComponentIds[0]))?.id
      : page.bands.find(b => b.type === 'data')?.id ?? page.bands[0]?.id;
    if (!pasteBandId) return;
    const newComponents = clipboard.map(comp => {
      const preparedComp = prepareComponentForInsert(template, { ...comp, name: comp.name });
      return {
        ...preparedComp,
        id: `${comp.type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        x: comp.x + 5,
        y: comp.y + 5,
      };
    });
    let newTemplate = template;
    for (const component of newComponents) {
      newTemplate = dispatcher.execute(newTemplate, {
        type: 'add-component',
        payload: { pageId: currentPageId, bandId: pasteBandId, component },
        execute: () => newTemplate,
        undo: () => newTemplate,
      });
    }
    const newIds = newComponents.map(component => component.id);
    set({ template: newTemplate, selectedComponentIds: newIds });
  },

  getClipboard: () => get().clipboard,

  moveSelectedBy: (dx, dy) => {
    const { template, currentPageId, selectedComponentIds, dispatcher } = get();
    const page = template.pages.find(p => p.id === currentPageId);
    if (!page || selectedComponentIds.length === 0) return;

    let newTemplate = template;
    for (const band of page.bands) {
      const comps = band.components.filter(comp => selectedComponentIds.includes(comp.id));
      if (comps.length === 0) continue;
      const updates = comps.map(comp => ({
        x: Math.round((comp.x + dx) * 10) / 10,
        y: Math.round((comp.y + dy) * 10) / 10,
      }));
      const previous = comps.map(comp => ({ x: comp.x, y: comp.y }));
      newTemplate = dispatcher.execute(newTemplate, {
        type: 'align-components',
        payload: { pageId: currentPageId, bandId: band.id, componentIds: comps.map(comp => comp.id), alignment: 'move', updates, previous },
        execute: () => newTemplate,
        undo: () => newTemplate,
      });
    }
    set({ template: newTemplate });
  },

  resizeSelectedBy: (dw, dh) => {
    const { template, currentPageId, selectedComponentIds, dispatcher } = get();
    const page = template.pages.find(p => p.id === currentPageId);
    if (!page || selectedComponentIds.length === 0) return;

    let newTemplate = template;
    for (const band of page.bands) {
      const comps = band.components.filter(comp => selectedComponentIds.includes(comp.id));
      if (comps.length === 0) continue;
      const updates = comps.map(comp => ({
        width: Math.max(1, Math.round((comp.width + dw) * 10) / 10),
        height: Math.max(1, Math.round((comp.height + dh) * 10) / 10),
      }));
      const previous = comps.map(comp => ({ width: comp.width, height: comp.height }));
      newTemplate = dispatcher.execute(newTemplate, {
        type: 'size-components',
        payload: { pageId: currentPageId, bandId: band.id, componentIds: comps.map(comp => comp.id), sizeMode: 'nudge-size', updates, previous },
        execute: () => newTemplate,
        undo: () => newTemplate,
      });
    }
    set({ template: newTemplate });
  },

  toggleSelectedFontStyle: (style) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const newTemplate = mapSelectedComponents(template, currentPageId, selectedComponentIds, comp => {
      const font = (comp as any).font;
      if (!font) return comp;
      const fontUpdates = { [style]: !font[style] };
      if (isTextComponent(comp)) {
        return applyManualTextComponentUpdates(comp, { font: fontUpdates });
      }
      return { ...comp, font: { ...font, ...fontUpdates } };
    });
    set({ template: newTemplate });
  },

  updateSelectedTable: (updates) => {
    updateSelectedTableComponents(table => setTableStructure(table, updates));
  },

  updateSelectedTableCell: (updates) => {
    updateSelectedTableCellComponent(updates);
  },

  applySelectedStyle: (styleId) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const style = styleId ? template.styles.find(item => item.id === styleId) : undefined;
    const newTemplate = mapSelectedComponents(template, currentPageId, selectedComponentIds, comp => {
      if (!isTextComponent(comp)) return comp;
      if (!styleId || !style) {
        return clearTextStyleReference(comp);
      }
      return applyTextStyleToComponent(comp, style);
    });
    set({ template: newTemplate });
  },

  createTextStyle: (style) => {
    const { template } = get();
    const nextStyle = createTextStyleDraft(template, style);
    set({ template: { ...template, styles: [...template.styles, nextStyle] } });
    return nextStyle.id;
  },

  duplicateTextStyle: (styleId) => {
    const { template } = get();
    const style = template.styles.find(item => item.id === styleId);
    if (!style) return undefined;

    const duplicate = cloneTextStyle(style, {
      id: createTextStyleId(),
      name: `${style.name} Copy`,
      isDefault: false,
    });

    set({ template: { ...template, styles: [...template.styles, duplicate] } });
    return duplicate.id;
  },

  renameTextStyle: (styleId, name) => {
    const { template } = get();
    set({
      template: {
        ...template,
        styles: template.styles.map(style => (
          style.id === styleId ? { ...style, name } : style
        )),
      },
    });
  },

  updateTextStyle: (styleId, updates) => {
    const { template } = get();
    const styles = template.styles.map(style => (
      style.id === styleId ? mergeTextStyle(style, updates) : style
    ));
    const nextTemplate = syncTextStyleReferencesInTemplate({ ...template, styles }, styleId);
    set({ template: nextTemplate });
  },

  deleteTextStyle: (styleId) => {
    const { template } = get();
    const nextTemplate = clearTextStyleReferencesInTemplate({
      ...template,
      styles: template.styles.filter(style => style.id !== styleId),
    }, styleId);
    set({ template: nextTemplate });
  },

  setDefaultTextStyle: (styleId) => {
    const { template } = get();
    set({
      template: {
        ...template,
        styles: template.styles.map(style => ({
          ...style,
          isDefault: styleId ? style.id === styleId : false,
        })),
      },
    });
  },

  syncTextStyleReferences: (styleId) => {
    const { template } = get();
    set({ template: syncTextStyleReferencesInTemplate(template, styleId) });
  },

  getTextStyleUsageCount: (styleId) => {
    const { template } = get();
    return countTextStyleUsage(template, styleId);
  },

  applySelectedConditionalFormat: (formatId) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const exists = formatId ? template.conditionalFormats.some(item => item.id === formatId) : false;
    const nextFormatId = exists ? formatId : undefined;
    const newTemplate = mapSelectedComponents(template, currentPageId, selectedComponentIds, component => {
      const nextComponent = { ...component } as ReportComponent;
      if (nextFormatId) {
        nextComponent.conditionalFormat = nextFormatId;
      } else {
        delete nextComponent.conditionalFormat;
      }
      return nextComponent;
    });
    set({ template: newTemplate });
  },

  createConditionalFormat: (format) => {
    const { template } = get();
    const nextFormat = createConditionalFormatDraft(template, format);
    set({ template: { ...template, conditionalFormats: [...template.conditionalFormats, nextFormat] } });
    return nextFormat.id;
  },

  duplicateConditionalFormat: (formatId) => {
    const { template } = get();
    const format = template.conditionalFormats.find(item => item.id === formatId);
    if (!format) return undefined;

    const duplicate = cloneConditionalFormat(format, {
      id: createConditionalFormatId(),
      name: `${format.name} Copy`,
    });
    set({ template: { ...template, conditionalFormats: [...template.conditionalFormats, duplicate] } });
    return duplicate.id;
  },

  updateConditionalFormat: (formatId, updates) => {
    const { template } = get();
    set({
      template: {
        ...template,
        conditionalFormats: template.conditionalFormats.map(format => (
          format.id === formatId ? mergeConditionalFormat(format, updates) : format
        )),
      },
    });
  },

  deleteConditionalFormat: (formatId) => {
    const { template } = get();
    const nextTemplate = clearConditionalFormatReferencesInTemplate({
      ...template,
      conditionalFormats: template.conditionalFormats.filter(format => format.id !== formatId),
    }, formatId);
    set({ template: nextTemplate });
  },

  insertSelectedTableColumn: (afterColumn) => {
    updateSelectedTableComponents(table => insertTableColumn(table, afterColumn));
  },

  deleteSelectedTableColumn: (columnIndex) => {
    updateSelectedTableComponents(table => deleteTableColumn(table, columnIndex));
  },

  insertSelectedTableRow: (afterRow) => {
    updateSelectedTableComponents(table => insertTableRow(table, afterRow));
  },

  deleteSelectedTableRow: (rowIndex) => {
    updateSelectedTableComponents(table => deleteTableRow(table, rowIndex));
  },

  mergeSelectedTableCellRight: (row, column) => {
    updateSelectedTableComponents(table => mergeTableCellRight(table, row, column));
  },

  mergeSelectedTableCellRange: () => {
    const { selectedTableCell } = get();
    if (!selectedTableCell) return;
    const selection = normalizeTableCellSelection(selectedTableCell);
    updateSelectedTableComponents(table => mergeTableCellRange(
      table,
      selection.startRow,
      selection.startColumn,
      selection.endRow,
      selection.endColumn,
    ));
  },

  splitSelectedTableCell: (row, column) => {
    updateSelectedTableComponents(table => splitTableCell(table, row, column));
  },

  clearSelectedTableCell: (row, column) => {
    updateSelectedTableComponents(table => clearTableCell(table, row, column));
  },

  clearSelectedTableCellStyle: (row, column) => {
    updateSelectedTableComponents(table => clearTableCellStyle(table, row, column));
  },

  copySelectedTableCellStyle: (row, column) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const page = template.pages.find(item => item.id === currentPageId);
    const selected = new Set(selectedComponentIds);
    const table = page?.bands
      .flatMap(band => band.components)
      .find(component => selected.has(component.id) && component.type === 'table') as TableComponent | undefined;
    if (!table) return;

    set({ tableCellStyleClipboard: copyTableCellStyle(table, row, column) });
  },

  pasteSelectedTableCellStyle: (row, column) => {
    const { tableCellStyleClipboard } = get();
    updateSelectedTableComponents(table => pasteTableCellStyle(table, row, column, tableCellStyleClipboard));
  },

  equalizeSelectedTableColumns: () => {
    updateSelectedTableComponents(table => equalizeTableColumns(table));
  },

  equalizeSelectedTableRows: () => {
    updateSelectedTableComponents(table => equalizeTableRows(table));
  },

  addBand: (pageId, band) => {
    const { template } = get();
    const newBand: Band = prepareBandForInsert(template, {
      ...band,
      id: `band_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      components: [],
    });
    const newTemplate = {
      ...template,
      pages: template.pages.map(p => {
        if (p.id !== pageId) return p;
        return { ...p, bands: [...p.bands, newBand] };
      }),
    };
    set({ template: newTemplate });
  },

  deleteBand: (pageId, bandId) => {
    const { template, dispatcher } = get();
    const page = template.pages.find(item => item.id === pageId);
    const bandIndex = page?.bands.findIndex(band => band.id === bandId) ?? -1;
    const band = page && bandIndex >= 0 ? page.bands[bandIndex] : undefined;
    if (!band) return;
    const newTemplate = dispatcher.execute(template, {
      type: DELETE_BAND_COMMAND,
      payload: { pageId, band, index: bandIndex },
      execute: () => template,
      undo: () => template,
    });
    set({
      template: newTemplate,
      selectedBandId: get().selectedBandId === bandId ? null : get().selectedBandId,
      selectedComponentIds: [],
      selectedTableCell: null,
    });
  },

  addPage: () => {
    const { template } = get();
    const existingBands = template.pages.flatMap(page => page.bands);
    const pageHeaderBand = { ...createBandForInsert(existingBands, 'pageHeader'), height: 20 };
    const dataBand = { ...createBandForInsert([...existingBands, pageHeaderBand], 'data'), height: 50 };
    const pageFooterBand = { ...createBandForInsert([...existingBands, pageHeaderBand, dataBand], 'pageFooter'), height: 20 };
    const newPage: Page = {
      id: `page_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      width: DEFAULT_PAGE_WIDTH,
      height: DEFAULT_PAGE_HEIGHT,
      margins: { top: 10, right: 10, bottom: 10, left: 10 },
      orientation: 'portrait',
      bands: [pageHeaderBand, dataBand, pageFooterBand],
    };
    set({ template: { ...template, pages: [...template.pages, newPage] }, currentPageId: newPage.id, selectedComponentIds: [] });
  },

  deletePage: (pageId) => {
    const { template, currentPageId } = get();
    if (template.pages.length <= 1) return;
    const newPages = template.pages.filter(p => p.id !== pageId);
    set({
      template: { ...template, pages: newPages },
      currentPageId: currentPageId === pageId ? newPages[0].id : currentPageId,
      selectedComponentIds: [],
    });
  },

  setPageSettings: (pageId, settings) => {
    const { template } = get();
    const newTemplate = {
      ...template,
      pages: template.pages.map(p => {
        if (p.id !== pageId) return p;
        return { ...p, ...settings } as Page;
      }),
    };
    set({ template: newTemplate });
  },

  setFontBold: (bold) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const newTemplate = mapSelectedComponents(template, currentPageId, selectedComponentIds, comp => {
      const font = (comp as any).font;
      if (!font) return comp;
      if (isTextComponent(comp)) {
        return applyManualTextComponentUpdates(comp, { font: { bold } });
      }
      return { ...comp, font: { ...font, bold } };
    });
    set({ template: newTemplate });
  },

  setFontSize: (size) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const newTemplate = mapSelectedComponents(template, currentPageId, selectedComponentIds, comp => {
      const font = (comp as any).font;
      if (!font) return comp;
      if (isTextComponent(comp)) {
        return applyManualTextComponentUpdates(comp, { font: { size } });
      }
      return { ...comp, font: { ...font, size } };
    });
    set({ template: newTemplate });
  },

  setTextAlign: (align) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const newTemplate = mapSelectedComponents(template, currentPageId, selectedComponentIds, comp => {
      if ((comp as any).textAlign === undefined) return comp;
      if (isTextComponent(comp)) {
        return applyManualTextComponentUpdates(comp, { textAlign: align });
      }
      return { ...comp, textAlign: align };
    });
    set({ template: newTemplate });
  },

  setBorderAll: (enabled) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const newTemplate = mapSelectedComponents(template, currentPageId, selectedComponentIds, comp => {
      const border = (comp as any).border;
      if (!border) return comp;
      const borderUpdates = {
        style: enabled ? 'solid' : 'none',
        width: enabled ? (border.width || 0.2) : 0,
        sides: { top: enabled, right: enabled, bottom: enabled, left: enabled },
      };
      if (isTextComponent(comp)) {
        return applyManualTextComponentUpdates(comp, { border: borderUpdates });
      }
      return {
        ...comp,
        border: {
          ...border,
          ...borderUpdates,
        },
      };
    });
    set({ template: newTemplate });
  },

  getSelectedFont: () => {
    const { template, currentPageId, selectedComponentIds } = get();
    if (selectedComponentIds.length !== 1) return null;
    const page = template.pages.find(p => p.id === currentPageId);
    if (!page) return null;
    for (const band of page.bands) {
      for (const comp of band.components) {
        if (selectedComponentIds.includes(comp.id) && (comp as any).font) {
          const f = (comp as any).font;
          return { family: f.family, size: f.size, bold: f.bold, italic: f.italic, underline: f.underline, strikethrough: f.strikethrough, color: f.color };
        }
      }
    }
    return null;
  },

  getSelectedTextAlign: () => {
    const { template, currentPageId, selectedComponentIds } = get();
    if (selectedComponentIds.length !== 1) return null;
    const page = template.pages.find(p => p.id === currentPageId);
    if (!page) return null;
    for (const band of page.bands) {
      for (const comp of band.components) {
        if (selectedComponentIds.includes(comp.id) && (comp as any).textAlign !== undefined) {
          return (comp as any).textAlign as 'left' | 'center' | 'right';
        }
      }
    }
    return null;
  },
  };
});

function findBand(template: ReportTemplate, pageId: string, bandId: string): Band | undefined {
  const page = template.pages.find(p => p.id === pageId);
  if (!page) return undefined;
  return page.bands.find(b => b.id === bandId);
}

function getMinimumBandHeight(band?: Band): number {
  if (!band || band.components.length === 0) return 5;
  const componentBottom = Math.max(...band.components.map(component => component.y + component.height));
  return Math.max(5, Math.round(componentBottom * 10) / 10);
}

function normalizeBandHeight(height: number, band?: Band): number {
  const numericHeight = Number.isFinite(height) ? height : 5;
  return Math.max(getMinimumBandHeight(band), Math.round(numericHeight * 10) / 10);
}

function insertBandInTemplate(template: ReportTemplate, pageId: string, afterBandId: string, band: Band): ReportTemplate {
  return {
    ...template,
    pages: template.pages.map(page => {
      if (page.id !== pageId) return page;
      const targetIndex = page.bands.findIndex(item => item.id === afterBandId);
      if (targetIndex < 0) return { ...page, bands: [...page.bands, band] };
      return {
        ...page,
        bands: [
          ...page.bands.slice(0, targetIndex + 1),
          band,
          ...page.bands.slice(targetIndex + 1),
        ],
      };
    }),
  };
}

function clampBandIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (!Number.isFinite(index)) return length - 1;
  return Math.max(0, Math.min(Math.round(index), length - 1));
}

function moveBandInTemplate(template: ReportTemplate, pageId: string, bandId: string, targetIndex: number): ReportTemplate {
  return {
    ...template,
    pages: template.pages.map(page => {
      if (page.id !== pageId) return page;
      const fromIndex = page.bands.findIndex(band => band.id === bandId);
      if (fromIndex < 0) return page;
      const normalizedTargetIndex = clampBandIndex(targetIndex, page.bands.length);
      if (fromIndex === normalizedTargetIndex) return page;
      const bands = [...page.bands];
      const [band] = bands.splice(fromIndex, 1);
      bands.splice(normalizedTargetIndex, 0, band);
      return { ...page, bands };
    }),
  };
}

function createBandForInsert(existingBands: Band[], type: BandType): Band {
  const takenNames = new Set(existingBands.map(band => band.name?.trim()).filter(Boolean) as string[]);
  const band: Band = {
    id: `band_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    name: getNextBandName(type, takenNames),
    height: DEFAULT_BAND_HEIGHTS[type] ?? 20,
    components: [],
    behavior: createBandBehavior(type),
  };

  if (type === 'data' || type === 'hierarchicalData') {
    band.dataBand = {};
  }

  if (type === 'groupHeader' || type === 'groupFooter') {
    band.group = {};
  }

  return band;
}

function cloneBandForInsert(existingBands: Band[], source: Band, template: ReportTemplate): Band {
  const nextBand = createBandForInsert(existingBands, source.type);
  const takenNames = collectComponentNames(template);
  return {
    ...source,
    id: nextBand.id,
    name: nextBand.name,
    components: source.components.map(component => cloneComponentForBandCopy(component, takenNames)),
    behavior: source.behavior ? { ...source.behavior } : nextBand.behavior,
    dataBand: source.dataBand ? { ...source.dataBand, sort: source.dataBand.sort ? [...source.dataBand.sort] : undefined } : nextBand.dataBand,
    group: source.group ? { ...source.group } : nextBand.group,
    events: source.events ? { ...source.events } : undefined,
  };
}

function collectComponentNames(template: ReportTemplate): Set<string> {
  const names = new Set<string>();
  const visit = (components: ReportComponent[]) => {
    for (const component of components) {
      if (component.name?.trim()) {
        names.add(component.name.trim());
      }
      if ('components' in component && Array.isArray((component as ReportComponent & { components?: ReportComponent[] }).components)) {
        visit((component as ReportComponent & { components?: ReportComponent[] }).components ?? []);
      }
    }
  };
  for (const page of template.pages) {
    for (const band of page.bands) {
      visit(band.components);
    }
  }
  return names;
}

function cloneComponentForBandCopy(component: ReportComponent, takenNames: Set<string>): ReportComponent {
  const cloned = JSON.parse(JSON.stringify(component)) as ReportComponent;
  cloned.id = `component_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  cloned.name = getNextComponentName(cloned.type, takenNames);

  if ('components' in cloned && Array.isArray((cloned as ReportComponent & { components?: ReportComponent[] }).components)) {
    (cloned as ReportComponent & { components?: ReportComponent[] }).components = (cloned as ReportComponent & { components?: ReportComponent[] }).components
      ?.map(child => cloneComponentForBandCopy(child, takenNames));
  }

  return cloned;
}

function createBandBehavior(type: BandType): NonNullable<Band['behavior']> {
  return {
    enabled: true,
    printOn: 'allPages',
    printIfEmpty: true,
    printOnAllPages: type === 'pageHeader' || type === 'pageFooter' || type === 'groupHeader',
    keepTogether: false,
    canBreak: type === 'data' || type === 'hierarchicalData' || type === 'child',
    breakIfLessThan: undefined,
    printAtBottom: type === 'pageFooter',
    autoGrow: true,
    autoShrink: false,
  };
}

interface ComponentUpdatePayload {
  pageId: string;
  bandId: string;
  componentId: string;
  updates: Record<string, any>;
}

function applyComponentUpdates(template: ReportTemplate, updates: ComponentUpdatePayload[]): ReportTemplate {
  if (updates.length === 0) return template;
  const updatesByComponent = new Map(
    updates.map(update => [`${update.pageId}/${update.bandId}/${update.componentId}`, update]),
  );

  return {
    ...template,
    pages: template.pages.map(page => ({
      ...page,
      bands: page.bands.map(band => ({
        ...band,
        components: band.components.map(component => {
          const update = updatesByComponent.get(`${page.id}/${band.id}/${component.id}`);
          return update ? { ...component, ...update.updates } : component;
        }),
      })),
    })),
  };
}

function cleanEventMap<TName extends string>(events: EventMap<TName>): EventMap<TName> | undefined {
  const next: EventMap<TName> = {};
  for (const [key, event] of Object.entries(events) as Array<[TName, EventScript]>) {
    if (event.enabled || event.script.trim()) {
      next[key] = event;
    }
  }
  return Object.keys(next).length ? next : undefined;
}

function isTextComponent(component: ReportComponent): component is TextComponent {
  return component.type === 'text';
}

function createTextStyleId() {
  return `text-style_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const FALLBACK_TEXT_STYLE_FONT = {
  family: 'Arial',
  size: 10,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  color: '#000000',
};

const FALLBACK_TEXT_STYLE_BORDER = {
  style: 'none' as const,
  width: 0,
  color: '#000000',
  sides: { top: false, right: false, bottom: false, left: false },
};

const FALLBACK_TEXT_STYLE_PADDING = { top: 0, right: 0, bottom: 0, left: 0 };

function cloneTextStyle(style: ReportStyle, overrides?: Partial<ReportStyle>): ReportStyle {
  const baseFont = style.font ?? FALLBACK_TEXT_STYLE_FONT;
  const baseBorder = style.border ?? FALLBACK_TEXT_STYLE_BORDER;
  const overrideBorder = overrides?.border;

  return {
    ...style,
    ...overrides,
    font: { ...baseFont, ...overrides?.font },
    border: {
      ...baseBorder,
      ...overrideBorder,
      sides: {
        ...FALLBACK_TEXT_STYLE_BORDER.sides,
        ...baseBorder.sides,
        ...overrideBorder?.sides,
      },
    },
    padding: overrides && 'padding' in overrides
      ? (overrides.padding ? { ...(style.padding ?? FALLBACK_TEXT_STYLE_PADDING), ...overrides.padding } : undefined)
      : (style.padding ? { ...style.padding } : undefined),
    format: overrides && 'format' in overrides
      ? (overrides.format ? { ...(style.format ?? { type: 'none' }), ...overrides.format } : undefined)
      : (style.format ? { ...style.format } : undefined),
  };
}

function createTextStyleDraft(
  template: ReportTemplate,
  style?: Partial<ReportStyle> & { name?: string },
): ReportStyle {
  const baseStyle = getDefaultTextStyle(template.styles)
    ?? template.styles[0]
    ?? {
      id: 'text-normal',
      name: 'Normal',
      category: 'text' as const,
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      border: { style: 'none' as const, width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
      backgroundColor: 'transparent',
      textAlign: 'left' as const,
      verticalAlign: 'top' as const,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      canGrow: false,
      canShrink: false,
      isDefault: false,
    };

  return cloneTextStyle(baseStyle, {
    ...style,
    id: createTextStyleId(),
    name: style?.name ?? 'Text Style',
    category: 'text',
    isDefault: false,
  });
}

function mergeTextStyle(style: ReportStyle, updates: Partial<ReportStyle>): ReportStyle {
  return cloneTextStyle(style, updates);
}

function mapAllTextComponents(
  template: ReportTemplate,
  mapper: (component: TextComponent) => TextComponent,
): ReportTemplate {
  return {
    ...template,
    pages: template.pages.map(page => ({
      ...page,
      bands: page.bands.map(band => ({
        ...band,
        components: band.components.map(component => (
          isTextComponent(component) ? mapper(component) : component
        )),
      })),
    })),
  };
}

function syncTextStyleReferencesInTemplate(template: ReportTemplate, styleId?: string): ReportTemplate {
  const stylesById = new Map(template.styles.map(style => [style.id, style]));

  return mapAllTextComponents(template, component => {
    if (!component.style) return component;
    if (styleId && component.style !== styleId) return component;

    const style = stylesById.get(component.style);
    if (!style) {
      return clearTextStyleReference(component);
    }

    return syncTextComponentStyle(component, style);
  });
}

function clearTextStyleReferencesInTemplate(template: ReportTemplate, styleId: string): ReportTemplate {
  return mapAllTextComponents(template, component => (
    component.style === styleId ? clearTextStyleReference(component) : component
  ));
}

function countTextStyleUsage(template: ReportTemplate, styleId: string): number {
  let count = 0;

  for (const page of template.pages) {
    for (const band of page.bands) {
      for (const component of band.components) {
        if (isTextComponent(component) && component.style === styleId) {
          count += 1;
        }
      }
    }
  }

  return count;
}

function createConditionalFormatId() {
  return `cf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createConditionRuleId() {
  return `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function cloneConditionRule(rule: ConditionalFormat['rules'][number]): ConditionalFormat['rules'][number] {
  return {
    ...rule,
    overrides: { ...(rule.overrides ?? {}) },
  };
}

function cloneConditionalFormat(
  format: ConditionalFormat,
  overrides?: Partial<ConditionalFormat>,
): ConditionalFormat {
  return {
    ...format,
    ...overrides,
    applyTo: overrides?.applyTo ? [...overrides.applyTo] : [...(format.applyTo ?? [])],
    rules: (overrides?.rules ?? format.rules ?? []).map(cloneConditionRule),
  };
}

function createConditionalFormatDraft(
  template: ReportTemplate,
  format?: Partial<ConditionalFormat> & { name?: string },
): ConditionalFormat {
  const nextIndex = template.conditionalFormats.length + 1;
  return cloneConditionalFormat({
    id: createConditionalFormatId(),
    name: format?.name ?? `Conditional Format ${nextIndex}`,
    applyTo: [],
    rules: [{
      id: createConditionRuleId(),
      expression: 'true',
      conditionType: 'expression',
      enabled: true,
      breakIfTrue: false,
      overrides: {},
    }],
  }, format);
}

function mergeConditionalFormat(
  format: ConditionalFormat,
  updates: Partial<ConditionalFormat>,
): ConditionalFormat {
  return cloneConditionalFormat(format, updates);
}

function clearConditionalFormatReferencesInTemplate(template: ReportTemplate, formatId: string): ReportTemplate {
  return {
    ...template,
    pages: template.pages.map(page => ({
      ...page,
      bands: page.bands.map(band => ({
        ...band,
        components: band.components.map(component => {
          if (component.conditionalFormat !== formatId) return component;
          const nextComponent = { ...component } as ReportComponent;
          delete nextComponent.conditionalFormat;
          return nextComponent;
        }),
      })),
    })),
  };
}

function mapSelectedComponents(
  template: ReportTemplate,
  pageId: string,
  selectedComponentIds: string[],
  mapper: (component: ReportComponent) => ReportComponent,
): ReportTemplate {
  if (selectedComponentIds.length === 0) return template;
  const selected = new Set(selectedComponentIds);
  return {
    ...template,
    pages: template.pages.map(page => {
      if (page.id !== pageId) return page;
      return {
        ...page,
        bands: page.bands.map(band => ({
          ...band,
          components: band.components.map(component => (
            selected.has(component.id) ? mapper(component) : component
          )),
        })),
      };
    }),
  };
}

function normalizeTableCellSelection(selection: TableCellSelection): TableCellSelection {
  const startRow = Math.min(selection.startRow, selection.endRow);
  const endRow = Math.max(selection.startRow, selection.endRow);
  const startColumn = Math.min(selection.startColumn, selection.endColumn);
  const endColumn = Math.max(selection.startColumn, selection.endColumn);
  return { ...selection, startRow, startColumn, endRow, endColumn };
}

function updateTableCell(
  table: TableComponent,
  selection: TableCellSelection,
  updates: Partial<TableCell>,
): TableComponent {
  const normalized = normalizeTable(table);
  const normalizedSelection = normalizeTableCellSelection(selection);
  const selectedKeys = new Set<string>();
  const nextCells: TableCell[] = [];
  for (let row = normalizedSelection.startRow; row <= normalizedSelection.endRow; row += 1) {
    for (let column = normalizedSelection.startColumn; column <= normalizedSelection.endColumn; column += 1) {
      selectedKeys.add(`${row}-${column}`);
      const existing = normalized.cells?.find(cell => cell.row === row && cell.column === column) ?? { row, column };
      const nextCell = clampTableCellSpan({ ...existing, ...updates }, existing, updates, normalized);
      nextCells.push(nextCell);
      markCoveredTableCells(nextCell, selectedKeys);
    }
  }
  const cells = (normalized.cells ?? []).filter(cell => !selectedKeys.has(`${cell.row}-${cell.column}`));
  return {
    ...normalized,
    cells: [...cells, ...nextCells].sort((a, b) => a.row - b.row || a.column - b.column),
  };
}

function clampTableCellSpan(
  cell: TableCell,
  existing: TableCell,
  updates: Partial<TableCell>,
  table: TableComponent,
): TableCell {
  const rowCount = table.rowCount ?? 1;
  const columnCount = table.columnCount ?? table.columns.length;
  const shouldWriteRowSpan = existing.rowSpan !== undefined || updates.rowSpan !== undefined;
  const shouldWriteColSpan = existing.colSpan !== undefined || updates.colSpan !== undefined;
  return {
    ...cell,
    ...(shouldWriteRowSpan ? { rowSpan: Math.max(1, Math.min(cell.rowSpan ?? 1, rowCount - cell.row)) } : {}),
    ...(shouldWriteColSpan ? { colSpan: Math.max(1, Math.min(cell.colSpan ?? 1, columnCount - cell.column)) } : {}),
  };
}

function markCoveredTableCells(cell: TableCell, selectedKeys: Set<string>): void {
  const rowSpan = cell.rowSpan ?? 1;
  const colSpan = cell.colSpan ?? 1;
  for (let row = cell.row; row < cell.row + rowSpan; row += 1) {
    for (let column = cell.column; column < cell.column + colSpan; column += 1) {
      selectedKeys.add(`${row}-${column}`);
    }
  }
}
