import { create } from 'zustand';
import type { ReportTemplate, ReportComponent, Band, Page } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { CommandDispatcher } from '@report-designer/core';

export interface DesignerState {
  template: ReportTemplate;
  currentPageId: string;
  selectedComponentIds: string[];
  selectedBandId: string | null;
  dataSources: Record<string, any[]>;
  dispatcher: CommandDispatcher;

  // Actions
  loadTemplate: (template: ReportTemplate) => void;
  setCurrentPage: (pageId: string) => void;
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
}

export const useDesignerStore = create<DesignerState>((set, get) => {
  const dispatcher = new CommandDispatcher();

  return {
    template: createDefaultTemplate(),
    currentPageId: '',
    selectedComponentIds: [],
    selectedBandId: null,
    dataSources: {},
    dispatcher,

  loadTemplate: (template) => {
    set({
      template,
      currentPageId: template.pages[0]?.id || '',
      selectedComponentIds: [],
      selectedBandId: null,
    });
  },

  setCurrentPage: (pageId) => set({ currentPageId: pageId }),

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
  };
});

function findBand(template: ReportTemplate, pageId: string, bandId: string): Band | undefined {
  const page = template.pages.find(p => p.id === pageId);
  if (!page) return undefined;
  return page.bands.find(b => b.id === bandId);
}
