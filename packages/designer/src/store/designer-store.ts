import { create } from 'zustand';
import type { ReportTemplate, ReportComponent, Band, Page, TableComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { CommandDispatcher } from '@report-designer/core';
import {
  clearTableCell,
  deleteTableColumn,
  deleteTableRow,
  equalizeTableColumns,
  equalizeTableRows,
  insertTableColumn,
  insertTableRow,
  mergeTableCellRight,
  setTableStructure,
  splitTableCell,
} from '../table/table-structure';

export interface DesignerState {
  template: ReportTemplate;
  currentPageId: string;
  mode: 'design' | 'preview';
  selectedComponentIds: string[];
  selectedBandId: string | null;
  dataSources: Record<string, any[]>;
  dispatcher: CommandDispatcher;
  clipboard: ReportComponent[];

  // Actions
  loadTemplate: (template: ReportTemplate) => void;
  updateTemplate: (updater: (template: ReportTemplate) => ReportTemplate) => void;
  setCurrentPage: (pageId: string) => void;
  setMode: (mode: 'design' | 'preview') => void;
  selectComponents: (componentIds: string[]) => void;
  selectBand: (bandId: string | null) => void;
  setDataSources: (data: Record<string, any[]>) => void;

  // Command-dispatched actions
  addComponent: (pageId: string, bandId: string, component: ReportComponent) => void;
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
  updateSelectedTable: (updates: {
    rowCount?: number;
    columnCount?: number;
    headerRowsCount?: number;
    footerRowsCount?: number;
    canBreak?: boolean;
    showBorder?: boolean;
    dataSource?: string;
  }) => void;
  insertSelectedTableColumn: (afterColumn?: number) => void;
  deleteSelectedTableColumn: (columnIndex?: number) => void;
  insertSelectedTableRow: (afterRow?: number) => void;
  deleteSelectedTableRow: (rowIndex?: number) => void;
  mergeSelectedTableCellRight: (row: number, column: number) => void;
  splitSelectedTableCell: (row: number, column: number) => void;
  clearSelectedTableCell: (row: number, column: number) => void;
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

export const useDesignerStore = create<DesignerState>((set, get) => {
  const dispatcher = new CommandDispatcher();

  return {
    template: createDefaultTemplate(),
    currentPageId: '',
    mode: 'design',
    selectedComponentIds: [],
    selectedBandId: null,
    dataSources: {},
    dispatcher,
    clipboard: [],

  loadTemplate: (template) => {
    set({
      template,
      currentPageId: template.pages[0]?.id || '',
      mode: 'design',
      selectedComponentIds: [],
      selectedBandId: null,
    });
  },

  updateTemplate: (updater) => set(state => ({ template: updater(state.template) })),

  setCurrentPage: (pageId) => set({ currentPageId: pageId }),

  setMode: (mode) => set({ mode }),

  selectComponents: (componentIds) => set({ selectedComponentIds: componentIds }),

  selectBand: (bandId) => set({ selectedBandId: bandId }),

  setDataSources: (data) => set({ dataSources: data }),

  addComponent: (pageId, bandId, component) => {
    const { template, dispatcher } = get();
    const newTemplate = dispatcher.execute(template, {
      type: 'add-component',
      payload: { pageId, bandId, component },
      execute: () => template,
      undo: () => template,
    });
    set({ template: newTemplate });
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
    const prevData = previous || (comp ? { ...comp } : undefined);
    const newTemplate = dispatcher.execute(template, {
      type: 'update-component',
      payload: { pageId, bandId, componentId, updates, previous: prevData },
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
    const newTemplate = dispatcher.execute(template, {
      type: 'resize-band',
      payload: { pageId, bandId, newHeight, oldHeight },
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
            return { ...b, height: newHeight };
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
          const spacing = (maxRight - minLeft) / (sorted.length - 1);
          for (let i = 0; i < sorted.length; i++) {
            const c = sorted[i];
            previous.push({ x: c.x });
            updates.push({ x: minLeft + spacing * i });
          }
          break;
        }
        case 'distribute-v': {
          if (comps.length < 3) continue;
          const sorted = [...comps].sort((a, b) => a.y - b.y);
          const minTop = sorted[0].y;
          const maxBottom = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
          const spacing = (maxBottom - minTop) / (sorted.length - 1);
          for (let i = 0; i < sorted.length; i++) {
            const c = sorted[i];
            previous.push({ y: c.y });
            updates.push({ y: minTop + spacing * i });
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

      const maxZ = Math.max(...band.components.map(c => c.zOrder ?? 0), 0);
      for (const comp of bandComps) {
        newTemplate = dispatcher.execute(newTemplate, {
          type: 'bring-to-front',
          payload: { pageId: currentPageId, bandId: band.id, componentId: comp.id, zOrder: maxZ + 1, previousZOrder: comp.zOrder ?? 0 },
          execute: () => newTemplate,
          undo: () => newTemplate,
        });
      }
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

      const minZ = Math.min(...band.components.map(c => c.zOrder ?? 0), 0);
      for (const comp of bandComps) {
        newTemplate = dispatcher.execute(newTemplate, {
          type: 'send-to-back',
          payload: { pageId: currentPageId, bandId: band.id, componentId: comp.id, zOrder: minZ - 1, previousZOrder: comp.zOrder ?? 0 },
          execute: () => newTemplate,
          undo: () => newTemplate,
        });
      }
    }

    set({ template: newTemplate });
  },

  deleteSelected: () => {
    const { template, currentPageId, selectedComponentIds } = get();
    const page = template.pages.find(p => p.id === currentPageId);
    if (!page) return;
    let newTemplate = template;
    for (const band of page.bands) {
      for (const id of selectedComponentIds) {
        if (band.components.some(c => c.id === id)) {
          newTemplate = {
            ...newTemplate,
            pages: newTemplate.pages.map(p => {
              if (p.id !== currentPageId) return p;
              return {
                ...p,
                bands: p.bands.map(b => {
                  if (b.id !== band.id) return b;
                  return { ...b, components: b.components.filter(c => c.id !== id) };
                }),
              };
            }),
          };
        }
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
    const { template, currentPageId, selectedComponentIds, clipboard } = get();
    if (clipboard.length === 0) return;
    const page = template.pages.find(p => p.id === currentPageId);
    if (!page) return;
    let newTemplate = template;
    const pasteBandId = selectedComponentIds.length > 0
      ? page.bands.find(b => b.components.some(c => c.id === selectedComponentIds[0]))?.id
      : page.bands.find(b => b.type === 'data')?.id;
    if (!pasteBandId) return;
    const newIds: string[] = [];
    for (const comp of clipboard) {
      const newComp = { ...comp, id: `${comp.type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, x: comp.x + 5, y: comp.y + 5 };
      newIds.push(newComp.id);
      const band = page.bands.find(b => b.id === pasteBandId)!;
      newTemplate = {
        ...newTemplate,
        pages: newTemplate.pages.map(p => {
          if (p.id !== currentPageId) return p;
          return {
            ...p,
            bands: p.bands.map(b => {
              if (b.id !== pasteBandId) return b;
              return { ...b, components: [...b.components, newComp] };
            }),
          };
        }),
      };
    }
    set({ template: newTemplate, selectedComponentIds: newIds });
  },

  getClipboard: () => get().clipboard,

  moveSelectedBy: (dx, dy) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const page = template.pages.find(p => p.id === currentPageId);
    if (!page || selectedComponentIds.length === 0) return;

    const newTemplate = mapSelectedComponents(template, currentPageId, selectedComponentIds, comp => ({
      ...comp,
      x: Math.round((comp.x + dx) * 10) / 10,
      y: Math.round((comp.y + dy) * 10) / 10,
    }));
    set({ template: newTemplate });
  },

  resizeSelectedBy: (dw, dh) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const page = template.pages.find(p => p.id === currentPageId);
    if (!page || selectedComponentIds.length === 0) return;

    const newTemplate = mapSelectedComponents(template, currentPageId, selectedComponentIds, comp => ({
      ...comp,
      width: Math.max(1, Math.round((comp.width + dw) * 10) / 10),
      height: Math.max(1, Math.round((comp.height + dh) * 10) / 10),
    }));
    set({ template: newTemplate });
  },

  toggleSelectedFontStyle: (style) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const newTemplate = mapSelectedComponents(template, currentPageId, selectedComponentIds, comp => {
      const font = (comp as any).font;
      if (!font) return comp;
      return { ...comp, font: { ...font, [style]: !font[style] } };
    });
    set({ template: newTemplate });
  },

  updateSelectedTable: (updates) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const newTemplate = mapSelectedComponents(template, currentPageId, selectedComponentIds, comp => {
      if (comp.type !== 'table') return comp;
      return setTableStructure(comp as TableComponent, updates);
    });
    set({ template: newTemplate });
  },

  insertSelectedTableColumn: (afterColumn) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const newTemplate = mapSelectedComponents(template, currentPageId, selectedComponentIds, comp => (
      comp.type === 'table' ? insertTableColumn(comp as TableComponent, afterColumn) : comp
    ));
    set({ template: newTemplate });
  },

  deleteSelectedTableColumn: (columnIndex) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const newTemplate = mapSelectedComponents(template, currentPageId, selectedComponentIds, comp => (
      comp.type === 'table' ? deleteTableColumn(comp as TableComponent, columnIndex) : comp
    ));
    set({ template: newTemplate });
  },

  insertSelectedTableRow: (afterRow) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const newTemplate = mapSelectedComponents(template, currentPageId, selectedComponentIds, comp => (
      comp.type === 'table' ? insertTableRow(comp as TableComponent, afterRow) : comp
    ));
    set({ template: newTemplate });
  },

  deleteSelectedTableRow: (rowIndex) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const newTemplate = mapSelectedComponents(template, currentPageId, selectedComponentIds, comp => (
      comp.type === 'table' ? deleteTableRow(comp as TableComponent, rowIndex) : comp
    ));
    set({ template: newTemplate });
  },

  mergeSelectedTableCellRight: (row, column) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const newTemplate = mapSelectedComponents(template, currentPageId, selectedComponentIds, comp => (
      comp.type === 'table' ? mergeTableCellRight(comp as TableComponent, row, column) : comp
    ));
    set({ template: newTemplate });
  },

  splitSelectedTableCell: (row, column) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const newTemplate = mapSelectedComponents(template, currentPageId, selectedComponentIds, comp => (
      comp.type === 'table' ? splitTableCell(comp as TableComponent, row, column) : comp
    ));
    set({ template: newTemplate });
  },

  clearSelectedTableCell: (row, column) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const newTemplate = mapSelectedComponents(template, currentPageId, selectedComponentIds, comp => (
      comp.type === 'table' ? clearTableCell(comp as TableComponent, row, column) : comp
    ));
    set({ template: newTemplate });
  },

  equalizeSelectedTableColumns: () => {
    const { template, currentPageId, selectedComponentIds } = get();
    const newTemplate = mapSelectedComponents(template, currentPageId, selectedComponentIds, comp => (
      comp.type === 'table' ? equalizeTableColumns(comp as TableComponent) : comp
    ));
    set({ template: newTemplate });
  },

  equalizeSelectedTableRows: () => {
    const { template, currentPageId, selectedComponentIds } = get();
    const newTemplate = mapSelectedComponents(template, currentPageId, selectedComponentIds, comp => (
      comp.type === 'table' ? equalizeTableRows(comp as TableComponent) : comp
    ));
    set({ template: newTemplate });
  },

  addBand: (pageId, band) => {
    const { template, dispatcher } = get();
    const newBand: Band = { ...band, id: `band_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, components: [] };
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
    const { template } = get();
    const newTemplate = {
      ...template,
      pages: template.pages.map(p => {
        if (p.id !== pageId) return p;
        return { ...p, bands: p.bands.filter(b => b.id !== bandId) };
      }),
    };
    set({ template: newTemplate });
  },

  addPage: () => {
    const { template, dispatcher } = get();
    const newPage: Page = {
      id: `page_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      width: DEFAULT_PAGE_WIDTH,
      height: DEFAULT_PAGE_HEIGHT,
      margins: { top: 10, right: 10, bottom: 10, left: 10 },
      orientation: 'portrait',
      bands: [
        { id: `band_ph_${Date.now()}`, type: 'pageHeader', height: 20, components: [] },
        { id: `band_data_${Date.now()}`, type: 'data', height: 50, components: [] },
        { id: `band_pf_${Date.now()}`, type: 'pageFooter', height: 20, components: [] },
      ],
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
    const page = template.pages.find(p => p.id === currentPageId);
    if (!page) return;
    let newTemplate = template;
    for (const band of page.bands) {
      for (const comp of band.components) {
        if (selectedComponentIds.includes(comp.id) && (comp as any).font) {
          newTemplate = {
            ...newTemplate,
            pages: newTemplate.pages.map(p => {
              if (p.id !== currentPageId) return p;
              return {
                ...p,
                bands: p.bands.map(b => {
                  if (b.id !== band.id) return b;
                  return {
                    ...b,
                    components: b.components.map(c => {
                      if (c.id !== comp.id) return c;
                      return { ...c, font: { ...(c as any).font, bold } };
                    }),
                  };
                }),
              };
            }),
          };
        }
      }
    }
    set({ template: newTemplate });
  },

  setFontSize: (size) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const page = template.pages.find(p => p.id === currentPageId);
    if (!page) return;
    let newTemplate = template;
    for (const band of page.bands) {
      for (const comp of band.components) {
        if (selectedComponentIds.includes(comp.id) && (comp as any).font) {
          newTemplate = {
            ...newTemplate,
            pages: newTemplate.pages.map(p => {
              if (p.id !== currentPageId) return p;
              return {
                ...p,
                bands: p.bands.map(b => {
                  if (b.id !== band.id) return b;
                  return {
                    ...b,
                    components: b.components.map(c => {
                      if (c.id !== comp.id) return c;
                      return { ...c, font: { ...(c as any).font, size } };
                    }),
                  };
                }),
              };
            }),
          };
        }
      }
    }
    set({ template: newTemplate });
  },

  setTextAlign: (align) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const page = template.pages.find(p => p.id === currentPageId);
    if (!page) return;
    let newTemplate = template;
    for (const band of page.bands) {
      for (const comp of band.components) {
        if (selectedComponentIds.includes(comp.id) && (comp as any).textAlign !== undefined) {
          newTemplate = {
            ...newTemplate,
            pages: newTemplate.pages.map(p => {
              if (p.id !== currentPageId) return p;
              return {
                ...p,
                bands: p.bands.map(b => {
                  if (b.id !== band.id) return b;
                  return {
                    ...b,
                    components: b.components.map(c => {
                      if (c.id !== comp.id) return c;
                      return { ...c, textAlign: align };
                    }),
                  };
                }),
              };
            }),
          };
        }
      }
    }
    set({ template: newTemplate });
  },

  setBorderAll: (enabled) => {
    const { template, currentPageId, selectedComponentIds } = get();
    const page = template.pages.find(p => p.id === currentPageId);
    if (!page) return;
    let newTemplate = template;
    for (const band of page.bands) {
      for (const comp of band.components) {
        if (selectedComponentIds.includes(comp.id) && (comp as any).border) {
          const border = (comp as any).border;
          const newBorder = {
            ...border,
            style: enabled ? 'solid' : 'none',
            width: enabled ? (border.width || 0.2) : 0,
            sides: { top: enabled, right: enabled, bottom: enabled, left: enabled },
          };
          newTemplate = {
            ...newTemplate,
            pages: newTemplate.pages.map(p => {
              if (p.id !== currentPageId) return p;
              return {
                ...p,
                bands: p.bands.map(b => {
                  if (b.id !== band.id) return b;
                  return {
                    ...b,
                    components: b.components.map(c => {
                      if (c.id !== comp.id) return c;
                      return { ...c, border: newBorder };
                    }),
                  };
                }),
              };
            }),
          };
        }
      }
    }
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
