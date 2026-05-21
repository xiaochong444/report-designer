import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { sanitizeRichHtml, type ReportComponent, type Band, type PanelComponent, type ReportFont, type RichTextDocument, type TableComponent } from '@report-designer/core';
import { useDesignerStore } from '../store/designer-store';
import { normalizeTable } from '../table/table-structure';
import { createDefaultComponent, createFieldExpressionComponent } from '../component-factory';
import { RichTextInlineEditor } from './richtext/RichTextInlineEditor';
import { useDesignerI18n } from '../i18n';

const MM_TO_PX = 3.78;
const SNAP_THRESHOLD = 5;
const HANDLE_SIZE = 8;
const GRID_MM = 5; // 网格间距 5mm
const BAND_HEADER_MM = 7;
const RULER_SIZE = 24;
const DRAG_THRESHOLD = 3; // px，超过此距离才算真正开始拖拽
type ResizeHandle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

function mmToPx(mm: number): number {
  const numeric = Number(mm);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round(numeric * MM_TO_PX);
}
function safeCssNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}
function pxToMm(px: number, zoom = 1): number { return Math.round(px / (MM_TO_PX * zoom) * 10) / 10; }

// ---- Interaction Mode (互斥) ----

type Mode =
  | { type: 'idle' }
  | { type: 'move'; compIds: string[]; bandMap: Record<string, string>; origPositions: Record<string, { x: number; y: number }>; startClientX: number; startClientY: number; dragStarted: boolean }
  | { type: 'resize'; compId: string; bandId: string; handle: ResizeHandle; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number }
  | { type: 'select'; startX: number; startY: number }
  | { type: 'band-resize'; bandId: string; startY: number; origHeight: number };

// ---- Alignment Guide ----

interface GuideLine { type: 'horizontal' | 'vertical'; position: number; }

function computeGuides(
  compId: string, xMm: number, yMm: number, wMm: number, hMm: number,
  others: { id: string; x: number; y: number; w: number; h: number; bandId: string }[],
): GuideLine[] {
  const guides: GuideLine[] = [];
  for (const o of others) {
    if (o.id === compId) continue;
    const yChecks = [
      { a: yMm, b: o.y }, { a: yMm + hMm, b: o.y + o.h },
      { a: yMm + hMm / 2, b: o.y + o.h / 2 },
      { a: yMm, b: o.y + o.h }, { a: yMm + hMm, b: o.y },
    ];
    for (const c of yChecks) {
      if (Math.abs(mmToPx(c.a) - mmToPx(c.b)) <= SNAP_THRESHOLD) {
        guides.push({ type: 'horizontal', position: mmToPx(c.a) });
      }
    }
    const xChecks = [
      { a: xMm, b: o.x }, { a: xMm + wMm, b: o.x + o.w },
      { a: xMm + wMm / 2, b: o.x + o.w / 2 },
      { a: xMm, b: o.x + o.w }, { a: xMm + wMm, b: o.x },
    ];
    for (const c of xChecks) {
      if (Math.abs(mmToPx(c.a) - mmToPx(c.b)) <= SNAP_THRESHOLD) {
        guides.push({ type: 'vertical', position: mmToPx(c.a) });
      }
    }
  }
  return guides;
}

function getCursorForHandle(handle: ResizeHandle): string {
  return { nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize', w: 'w-resize', e: 'e-resize', sw: 'sw-resize', s: 's-resize', se: 'se-resize' }[handle];
}

function getHandlePos(handle: ResizeHandle, w: number, h: number): React.CSSProperties {
  const half = HANDLE_SIZE / 2;
  switch (handle) {
    case 'nw': return { left: -half, top: -half };
    case 'n': return { left: w / 2 - half, top: -half };
    case 'ne': return { right: -half, top: -half };
    case 'w': return { left: -half, top: h / 2 - half };
    case 'e': return { right: -half, top: h / 2 - half };
    case 'sw': return { left: -half, bottom: -half };
    case 's': return { left: w / 2 - half, bottom: -half };
    case 'se': return { right: -half, bottom: -half };
  }
}

const BAND_COLORS: Record<string, string> = {
  reportTitle: '#8b4513', reportSummary: '#6b4423',
  pageHeader: '#2e7d32', pageFooter: '#1565c0',
  data: '#6a1b9a', groupHeader: '#00838f', groupFooter: '#4527a0', child: '#ad1457',
};

const BAND_LABELS: Record<string, string> = {
  reportTitle: 'ReportTitleBand',
  reportSummary: 'ReportSummaryBand',
  pageHeader: 'PageHeaderBand',
  pageFooter: 'PageFooterBand',
  header: 'HeaderBand',
  footer: 'FooterBand',
  columnHeader: 'ColumnHeaderBand',
  columnFooter: 'ColumnFooterBand',
  groupHeader: 'GroupHeaderBand',
  groupFooter: 'GroupFooterBand',
  data: 'DataBand',
  child: 'ChildBand',
  emptyData: 'EmptyDataBand',
  overlay: 'OverlayBand',
};

function findPanelDropTarget(band: Band, xMm: number, yMm: number): { panelId: string; xMm: number; yMm: number } | null {
  const panels = band.components
    .filter((component): component is PanelComponent => component.type === 'panel')
    .slice()
    .sort((a, b) => (b.zOrder ?? 0) - (a.zOrder ?? 0));

  for (const panel of panels) {
    const insideX = xMm >= panel.x && xMm <= panel.x + panel.width;
    const insideY = yMm >= panel.y && yMm <= panel.y + panel.height;
    if (!insideX || !insideY) continue;
    const padding = panel.padding ?? { top: 0, right: 0, bottom: 0, left: 0 };
    const contentWidth = Math.max(0, panel.width - padding.left - padding.right);
    const contentHeight = Math.max(0, panel.height - padding.top - padding.bottom);
    return {
      panelId: panel.id,
      xMm: Math.max(0, Math.min(contentWidth, Math.round((xMm - panel.x - padding.left) * 10) / 10)),
      yMm: Math.max(0, Math.min(contentHeight, Math.round((yMm - panel.y - padding.top) * 10) / 10)),
    };
  }

  return null;
}

// ---- Context Menu ----

interface ContextMenuPos {
  x: number;
  y: number;
  compId?: string;
  tableCell?: { row: number; column: number };
}

// ---- Canvas ----

export const Canvas: React.FC<{ className?: string }> = ({ className }) => {
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const selectedComponentIds = useDesignerStore(s => s.selectedComponentIds);
  const selectedBandId = useDesignerStore(s => s.selectedBandId);
  const storeClipboard = useDesignerStore(s => s.clipboard);
  const selectComponents = useDesignerStore(s => s.selectComponents);
  const selectBand = useDesignerStore(s => s.selectBand);
  const moveComponent = useDesignerStore(s => s.moveComponent);
  const moveComponentSilent = useDesignerStore(s => s.moveComponentSilent);
  const updateComponent = useDesignerStore(s => s.updateComponent);
  const addComponent = useDesignerStore(s => s.addComponent);
  const addComponentToPanel = useDesignerStore(s => s.addComponentToPanel);
  const updateComponentSilent = useDesignerStore(s => s.updateComponentSilent);
  const resizeBand = useDesignerStore(s => s.resizeBand);
  const resizeBandSilent = useDesignerStore(s => s.resizeBandSilent);
  const copySelected = useDesignerStore(s => s.copySelected);
  const cutSelected = useDesignerStore(s => s.cutSelected);
  const duplicateSelected = useDesignerStore(s => s.duplicateSelected);
  const pasteClipboard = useDesignerStore(s => s.pasteClipboard);
  const deleteSelected = useDesignerStore(s => s.deleteSelected);
  const moveSelectedBy = useDesignerStore(s => s.moveSelectedBy);
  const resizeSelectedBy = useDesignerStore(s => s.resizeSelectedBy);
  const toggleSelectedFontStyle = useDesignerStore(s => s.toggleSelectedFontStyle);
  const setTextAlign = useDesignerStore(s => s.setTextAlign);
  const setDesignerMode = useDesignerStore(s => s.setMode);
  const zoom = useDesignerStore(s => s.zoom);
  const setZoom = useDesignerStore(s => s.setZoom);
  const undo = useDesignerStore(s => s.undo);
  const redo = useDesignerStore(s => s.redo);

  const pageRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<Mode>({ type: 'idle' });
  const [mode, setMode] = useState<Mode>({ type: 'idle' });
  const [selBox, setSelBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuPos | null>(null);

  const currentPage = useMemo(() => template.pages.find(p => p.id === currentPageId), [template, currentPageId]);

  const bands = useMemo(() => {
    if (!currentPage) return [] as { band: Band; cumY: number; visualY: number }[];
    let contentY = 0;
    let visualY = 0;
    return currentPage.bands.map(band => {
      const r = { band, cumY: contentY, visualY };
      contentY += band.height;
      visualY += band.height + BAND_HEADER_MM;
      return r;
    });
  }, [currentPage]);

  const bandLabelIndexes = useMemo(() => {
    const counters: Record<string, number> = {};
    const result: Record<string, number> = {};
    for (const { band } of bands) {
      const key = band.type;
      counters[key] = (counters[key] ?? 0) + 1;
      result[band.id] = counters[key];
    }
    return result;
  }, [bands]);

  const flat = useMemo(() => {
    const items: { comp: ReportComponent; bandId: string; cumY: number; visualY: number }[] = [];
    for (const { band, cumY, visualY } of bands) {
      for (const comp of band.components) {
        items.push({ comp, bandId: band.id, cumY, visualY });
      }
    }
    return items;
  }, [bands]);

  const others = useMemo(() =>
    flat.map(f => ({ id: f.comp.id, x: f.comp.x, y: f.comp.y, w: f.comp.width, h: f.comp.height, bandId: f.bandId }))
  , [flat]);

  // Refs for stable access during drag (prevent effect re-subscribe)
  const flatRef = useRef(flat);
  flatRef.current = flat;
  const othersRef = useRef(others);
  othersRef.current = others;
  const currentPageIdRef = useRef(currentPageId);
  currentPageIdRef.current = currentPageId;
  const selBoxRef = useRef(selBox);
  selBoxRef.current = selBox;

  // ---- Hit tests ----

  const findResizeHandleAtPoint = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const handleEl = el.closest('[data-resize-handle]') as HTMLElement | null;
    if (!handleEl) return null;
    return {
      compId: handleEl.dataset.compId!,
      bandId: handleEl.dataset.bandId!,
      handle: handleEl.dataset.handleName as ResizeHandle,
    };
  }, []);

  const findBandResizeAtPoint = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const handleEl = el.closest('[data-band-resize]') as HTMLElement | null;
    if (!handleEl) return null;
    return { bandId: handleEl.dataset.bandId! };
  }, []);

  const findComponentAtPoint = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const compEl = el.closest('[data-component-id]') as HTMLElement | null;
    if (!compEl) return null;
    const compId = compEl.dataset.componentId;
    if (!compId) return null;
    const f = flat.find(x => x.comp.id === compId);
    if (!f) return null;
    return { compId: f.comp.id, bandId: f.bandId };
  }, [flat]);

  const findTableCellAtPoint = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const cellEl = el.closest('[data-table-row][data-table-column]') as HTMLElement | null;
    if (!cellEl) return null;
    const row = Number(cellEl.dataset.tableRow);
    const column = Number(cellEl.dataset.tableColumn);
    if (!Number.isInteger(row) || !Number.isInteger(column)) return null;
    return { row, column };
  }, []);

  // ---- Mouse down ----

  const handlePageMouseDown = useCallback((e: React.MouseEvent) => {
    setContextMenu(null);
    if (e.button === 2) {
      // Right click context menu
      const ch = findComponentAtPoint(e.clientX, e.clientY);
      const tableCell = findTableCellAtPoint(e.clientX, e.clientY);
      if (ch && !selectedComponentIds.includes(ch.compId)) {
        selectComponents([ch.compId]);
      }
      if (pageRef.current) {
        const rect = pageRef.current.getBoundingClientRect();
        setContextMenu({ x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom, compId: ch?.compId, tableCell: tableCell ?? undefined });
      }
      return;
    }
    if (e.button !== 0) return;

    // 1. Resize handle
    const hr = findResizeHandleAtPoint(e.clientX, e.clientY);
    if (hr && selectedComponentIds.includes(hr.compId)) {
      e.preventDefault();
      e.stopPropagation();
      const f = flat.find(x => x.comp.id === hr.compId);
      if (!f) return;
      const m: Mode = {
        type: 'resize', compId: hr.compId, bandId: hr.bandId, handle: hr.handle,
        startX: e.clientX, startY: e.clientY,
        origX: f.comp.x, origY: f.comp.y, origW: f.comp.width, origH: f.comp.height,
      };
      modeRef.current = m;
      setMode(m);
      return;
    }

    // 2. Band resize handle
    const br = findBandResizeAtPoint(e.clientX, e.clientY);
    if (br) {
      e.preventDefault();
      e.stopPropagation();
      const bp = bands.find(b => b.band.id === br.bandId);
      if (!bp) return;
      const m: Mode = {
        type: 'band-resize', bandId: br.bandId,
        startY: e.clientY, origHeight: bp.band.height,
      };
      modeRef.current = m;
      setMode(m);
      return;
    }

    // 3. Component hit
    const ch = findComponentAtPoint(e.clientX, e.clientY);
    if (ch) {
      e.preventDefault();
      e.stopPropagation();

      // Clear band selection when selecting a component
      selectBand(null);

      if (e.ctrlKey || e.metaKey) {
        const cur = [...selectedComponentIds];
        const idx = cur.indexOf(ch.compId);
        if (idx >= 0) cur.splice(idx, 1); else cur.push(ch.compId);
        selectComponents(cur);
      } else if (!selectedComponentIds.includes(ch.compId)) {
        selectComponents([ch.compId]);
      }

      // Get latest selection from store (zustand is sync, but React closure is stale)
      const currentSelection = useDesignerStore.getState().selectedComponentIds;
      const ids = currentSelection.length > 0 ? [...currentSelection] : [ch.compId];
      const bandMap: Record<string, string> = {};
      const origPositions: Record<string, { x: number; y: number }> = {};
      for (const id of ids) {
        const item = flat.find(x => x.comp.id === id);
        if (item) {
          bandMap[id] = item.bandId;
          origPositions[id] = { x: item.comp.x, y: item.comp.y };
        }
      }

      const m: Mode = {
        type: 'move', compIds: ids, bandMap, origPositions,
        startClientX: e.clientX, startClientY: e.clientY,
        dragStarted: false,
      };
      modeRef.current = m;
      setMode(m);
      return;
    }

    // 4. Empty canvas = selection box
    if (!pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    selectComponents([]);
    selectBand(null);
    const sx = (e.clientX - rect.left) / zoom;
    const sy = (e.clientY - rect.top) / zoom;
    const m: Mode = { type: 'select', startX: sx, startY: sy };
    modeRef.current = m;
    setMode(m);
    setSelBox({ x: sx, y: sy, w: 0, h: 0 });
  }, [flat, bands, selectedComponentIds, selectComponents, selectBand, findComponentAtPoint, findTableCellAtPoint, findResizeHandleAtPoint, findBandResizeAtPoint, zoom]);

  // ---- Global mouse move/up ----

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const m = modeRef.current;
      if (m.type === 'idle') return;

      if (m.type === 'move') {
        const dxPx = e.clientX - m.startClientX;
        const dyPx = e.clientY - m.startClientY;
        const dist = Math.sqrt(dxPx * dxPx + dyPx * dyPx);

        if (!m.dragStarted) {
          if (dist < DRAG_THRESHOLD) return; // 未超过阈值，不开始拖拽
          // 超过阈值，激活拖拽模式
          modeRef.current = { ...m, dragStarted: true };
        }

        const dxMm = pxToMm(dxPx, zoom);
        const dyMm = pxToMm(dyPx, zoom);

        // Move all selected components
        const pageId = currentPageIdRef.current;
        for (const compId of m.compIds) {
          const orig = m.origPositions[compId];
          if (!orig) continue;
          const newX = orig.x + dxMm;
          const newY = orig.y + dyMm;
          moveComponentSilent(pageId, m.bandMap[compId], compId, newX, newY);
        }

        // 对齐引导线 (for the first selected component)
        const firstId = m.compIds[0];
        const firstOrig = m.origPositions[firstId];
        const fc = flatRef.current.find(f => f.comp.id === firstId);
        if (fc && firstOrig) {
          const g = computeGuides(firstId, firstOrig.x + dxMm, firstOrig.y + dyMm, fc.comp.width, fc.comp.height, othersRef.current);
          setGuides(g);
        }

      } else if (m.type === 'resize') {
        const dx = pxToMm(e.clientX - m.startX, zoom);
        const dy = pxToMm(e.clientY - m.startY, zoom);
        let nx = m.origX, ny = m.origY, nw = m.origW, nh = m.origH;
        if (m.handle.includes('e')) nw = Math.max(5, m.origW + dx);
        if (m.handle.includes('w')) { nw = Math.max(5, m.origW - dx); nx = m.origX + dx; }
        if (m.handle.includes('s')) nh = Math.max(5, m.origH + dy);
        if (m.handle.includes('n')) { nh = Math.max(5, m.origH - dy); ny = m.origY + dy; }
        updateComponentSilent(currentPageIdRef.current, m.bandId, m.compId,
          { x: nx, y: ny, width: nw, height: nh },
        );

      } else if (m.type === 'band-resize') {
        const dy = pxToMm(e.clientY - m.startY, zoom);
        const nh = Math.max(5, Math.round((m.origHeight + dy) * 10) / 10);
        resizeBandSilent(currentPageIdRef.current, m.bandId, nh);

      } else if (m.type === 'select') {
        if (!pageRef.current) return;
        const rect = pageRef.current.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / zoom;
        const cy = (e.clientY - rect.top) / zoom;
        setSelBox({
          x: Math.min(m.startX, cx), y: Math.min(m.startY, cy),
          w: Math.abs(cx - m.startX), h: Math.abs(cy - m.startY),
        });
      }
    };

    const handleMouseUp = () => {
      const m = modeRef.current;
      if (m.type === 'select' && selBoxRef.current) {
        const page = useDesignerStore.getState().template.pages.find(p => p.id === currentPageIdRef.current);
        if (page) {
          const ids: string[] = [];
          let visualY = 0;
          const marginLeft = mmToPx(page.margins?.left ?? 0);
          const marginTop = mmToPx(page.margins?.top ?? 0);
          for (const band of page.bands) {
            for (const comp of band.components) {
              const l = marginLeft + mmToPx(comp.x);
              const t = marginTop + mmToPx(visualY) + mmToPx(BAND_HEADER_MM) + mmToPx(comp.y);
              const r = l + mmToPx(comp.width), b = t + mmToPx(comp.height);
              if (selBoxRef.current.x < r && selBoxRef.current.x + selBoxRef.current.w > l && selBoxRef.current.y < b && selBoxRef.current.y + selBoxRef.current.h > t) {
                ids.push(comp.id);
              }
            }
            visualY += band.height + BAND_HEADER_MM;
          }
          if (ids.length > 0) selectComponents(ids);
        }
      } else if (m.type === 'move') {
        const state = useDesignerStore.getState();
        const page = state.template.pages.find(p => p.id === currentPageIdRef.current);
        for (const compId of m.compIds) {
          const band = page?.bands.find(b => b.id === m.bandMap[compId]);
          const comp = band?.components.find(c => c.id === compId);
          const orig = m.origPositions[compId];
          if (comp && orig && (comp.x !== orig.x || comp.y !== orig.y)) {
            moveComponent(currentPageIdRef.current, m.bandMap[compId], compId, comp.x, comp.y, orig.x, orig.y);
          }
        }
      } else if (m.type === 'resize') {
        const state = useDesignerStore.getState();
        const page = state.template.pages.find(p => p.id === currentPageIdRef.current);
        const band = page?.bands.find(b => b.id === m.bandId);
        const comp = band?.components.find(c => c.id === m.compId);
        if (comp) {
          updateComponent(currentPageIdRef.current, m.bandId, m.compId,
            { x: comp.x, y: comp.y, width: comp.width, height: comp.height },
            { x: m.origX, y: m.origY, width: m.origW, height: m.origH },
          );
        }
      } else if (m.type === 'band-resize') {
        const state = useDesignerStore.getState();
        const page = state.template.pages.find(p => p.id === currentPageIdRef.current);
        const band = page?.bands.find(b => b.id === m.bandId);
        if (band) {
          if (band.height !== m.origHeight) {
            resizeBand(currentPageIdRef.current, m.bandId, band.height, m.origHeight);
          }
        }
      }
      modeRef.current = { type: 'idle' };
      setMode({ type: 'idle' });
      setSelBox(null);
      setGuides([]);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [moveComponent, updateComponent, resizeBand, selectComponents, zoom]);

  // ---- Keyboard shortcuts ----

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略编辑模式
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const isCtrl = e.ctrlKey || e.metaKey;

      // Delete / Backspace: 删除
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
        return;
      }

      // Ctrl+C: 复制
      if (isCtrl && e.key === 'c') {
        e.preventDefault();
        copySelected();
        return;
      }

      // Ctrl+X: 剪切
      if (isCtrl && e.key === 'x') {
        e.preventDefault();
        cutSelected();
        return;
      }

      // Ctrl+V: 粘贴
      if (isCtrl && e.key === 'v') {
        e.preventDefault();
        pasteClipboard();
        return;
      }

      // Ctrl+D: 复制一份
      if (isCtrl && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      // Ctrl+Z: 撤销
      if (isCtrl && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Y / Ctrl+Shift+Z: 重做
      if (isCtrl && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      if (isCtrl && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl+A: 全选
      if (isCtrl && e.key === 'a') {
        e.preventDefault();
        selectComponents(flat.map(f => f.comp.id));
        return;
      }

      // F5 / Ctrl+F5: 预览
      if (e.key === 'F5') {
        e.preventDefault();
        setDesignerMode('preview');
        return;
      }

      // Ctrl+B/I/U/S: 字体样式
      if (isCtrl && ['b', 'i', 'u', 's'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        const key = e.key.toLowerCase();
        if (key === 'b') toggleSelectedFontStyle('bold');
        if (key === 'i') toggleSelectedFontStyle('italic');
        if (key === 'u') toggleSelectedFontStyle('underline');
        if (key === 's') toggleSelectedFontStyle('strikethrough');
        return;
      }

      // Ctrl+L/E/R: 文本左/中/右对齐
      if (isCtrl && ['l', 'e', 'r'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        const key = e.key.toLowerCase();
        if (key === 'l') setTextAlign('left');
        if (key === 'e') setTextAlign('center');
        if (key === 'r') setTextAlign('right');
        return;
      }

      // Ctrl+Shift+Arrow: 对齐
      if (isCtrl && e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedComponentIds.length >= 2) {
        e.preventDefault();
        if (e.key === 'ArrowLeft') useDesignerStore.getState().alignComponents('left');
        if (e.key === 'ArrowRight') useDesignerStore.getState().alignComponents('right');
        if (e.key === 'ArrowUp') useDesignerStore.getState().alignComponents('top');
        if (e.key === 'ArrowDown') useDesignerStore.getState().alignComponents('bottom');
        return;
      }

      // Ctrl+Alt+ArrowUp/Down: 置顶/置底
      if (isCtrl && e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && selectedComponentIds.length > 0) {
        e.preventDefault();
        if (e.key === 'ArrowUp') useDesignerStore.getState().bringToFront();
        if (e.key === 'ArrowDown') useDesignerStore.getState().sendToBack();
        return;
      }

      // Arrow keys: 微移
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedComponentIds.length > 0) {
        e.preventDefault();
        const step = e.altKey ? 0.5 : e.ctrlKey || e.metaKey ? GRID_MM : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        if (e.shiftKey) {
          resizeSelectedBy(dx, dy);
        } else {
          moveSelectedBy(dx, dy);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentIds, flat, undo, redo, selectComponents, copySelected, cutSelected, duplicateSelected, pasteClipboard, deleteSelected, moveSelectedBy, resizeSelectedBy, toggleSelectedFontStyle, setTextAlign, setDesignerMode]);

  // ---- Zoom wheel handler ----

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const next = Math.min(4, Math.max(0.25, zoom + delta));
        setZoom(Math.round(next * 100) / 100);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [setZoom, zoom]);

  // ---- Click outside to close context menu ----

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu]);

  const getDropPosition = useCallback((event: React.DragEvent) => {
    if (!pageRef.current) return null;
    const rect = pageRef.current.getBoundingClientRect();
    const clientX = Number.isFinite(event.clientX) ? event.clientX : rect.left;
    const clientY = Number.isFinite(event.clientY) ? event.clientY : rect.top;
    const pageX = pxToMm(clientX - rect.left, zoom);
    const pageY = pxToMm(clientY - rect.top, zoom);
    const margins = currentPage?.margins ?? { top: 0, right: 0, bottom: 0, left: 0 };
    const printableWidth = currentPage ? Math.max(0, currentPage.width - margins.left - margins.right) : 0;
    const xMm = Math.max(0, Math.min(printableWidth, Math.round((pageX - margins.left) * 10) / 10));
    const yMm = Math.round((pageY - margins.top) * 10) / 10;

    for (const { band, visualY } of bands) {
      const bandTop = visualY;
      const bodyTop = visualY + BAND_HEADER_MM;
      const bandBottom = bodyTop + band.height;
      if (yMm >= bandTop && yMm <= bandBottom) {
        const bandX = xMm;
        const bandY = Math.max(0, Math.min(band.height, Math.round((yMm - bodyTop) * 10) / 10));
        const panelTarget = findPanelDropTarget(band, bandX, bandY);
        if (panelTarget) {
          return {
            targetBandId: band.id,
            targetPanelId: panelTarget.panelId,
            xMm: panelTarget.xMm,
            yMm: panelTarget.yMm,
          };
        }
        return {
          targetBandId: band.id,
          xMm: bandX,
          yMm: bandY,
        };
      }
    }

    const fallbackBand = currentPage?.bands.find(band => band.type === 'data') ?? currentPage?.bands[0];
    return fallbackBand ? { targetBandId: fallbackBand.id, xMm, yMm: 0 } : null;
  }, [bands, currentPage?.bands, zoom]);

  const handleCanvasDragOver = useCallback((event: React.DragEvent) => {
    const types = Array.from(event.dataTransfer.types ?? []);
    const hasSupportedPayload = types.includes('componentType') || types.includes('fieldBinding');
    if (!hasSupportedPayload) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleCanvasDrop = useCallback((event: React.DragEvent) => {
    const position = getDropPosition(event);
    if (!position || !currentPageId) return;

    const fieldBinding = event.dataTransfer.getData('fieldBinding');
    const componentType = event.dataTransfer.getData('componentType');
    if (!fieldBinding && !componentType) return;

    event.preventDefault();
    if (fieldBinding) {
      try {
        const field = JSON.parse(fieldBinding);
        const component = createFieldExpressionComponent(field, position.xMm, position.yMm);
        if ('targetPanelId' in position && position.targetPanelId) {
          addComponentToPanel(currentPageId, position.targetBandId, position.targetPanelId, component);
        } else {
          addComponent(currentPageId, position.targetBandId, component);
        }
        return;
      } catch {
        return;
      }
    }

    const component = createDefaultComponent(componentType, position.xMm, position.yMm);
    if ('targetPanelId' in position && position.targetPanelId) {
      addComponentToPanel(currentPageId, position.targetBandId, position.targetPanelId, component);
    } else {
      addComponent(currentPageId, position.targetBandId, component);
    }
  }, [addComponent, addComponentToPanel, currentPageId, getDropPosition]);

  if (!currentPage) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
        没有页面选中
      </div>
    );
  }

  const isBusy = mode.type !== 'idle';
  const gridPx = mmToPx(GRID_MM);
  const rawPageWidthPx = mmToPx(currentPage.width);
  const rawPageHeightPx = mmToPx(currentPage.height);
  const scaledPageWidthPx = Math.round(rawPageWidthPx * zoom);
  const scaledPageHeightPx = Math.round(rawPageHeightPx * zoom);
  const margins = currentPage.margins ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const rawMarginLeftPx = mmToPx(margins.left);
  const rawMarginTopPx = mmToPx(margins.top);
  const rawMarginRightPx = mmToPx(margins.right);
  const rawMarginBottomPx = mmToPx(margins.bottom);
  const scaledMarginLeftPx = Math.round(rawMarginLeftPx * zoom);
  const scaledMarginTopPx = Math.round(rawMarginTopPx * zoom);
  const printableWidthMm = Math.max(0, currentPage.width - margins.left - margins.right);
  const printableHeightMm = Math.max(0, currentPage.height - margins.top - margins.bottom);
  const rawPrintableWidthPx = mmToPx(printableWidthMm);
  const rawPrintableHeightPx = mmToPx(printableHeightMm);

  return (
    <div ref={containerRef} className={className}
      style={{ overflowX: 'hidden', overflowY: 'auto', backgroundColor: '#e8e8e8', height: '100%', padding: 24, userSelect: isBusy ? 'none' : 'auto', position: 'relative' }}
    >
      <div data-testid="designer-canvas-page-stack" style={{ position: 'relative', width: safeCssNumber(scaledPageWidthPx + RULER_SIZE), height: safeCssNumber(scaledPageHeightPx + RULER_SIZE), margin: 0 }}>
        {/* 顶部标尺 */}
        <Ruler
          direction="horizontal"
          lengthMm={printableWidthMm}
          lengthPx={scaledPageWidthPx}
          printableOffsetPx={scaledMarginLeftPx}
          offsetPx={RULER_SIZE}
          crossOffsetPx={0}
          zoom={zoom}
        />
        <Ruler
          direction="vertical"
          lengthMm={printableHeightMm}
          lengthPx={scaledPageHeightPx}
          printableOffsetPx={scaledMarginTopPx}
          offsetPx={RULER_SIZE}
          crossOffsetPx={0}
          zoom={zoom}
        />

        <div ref={pageRef} data-page data-testid="designer-page-sheet"
          onMouseDown={handlePageMouseDown}
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            width: safeCssNumber(rawPageWidthPx), height: safeCssNumber(rawPageHeightPx),
            backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            position: 'relative', marginLeft: RULER_SIZE, marginTop: RULER_SIZE, overflow: 'hidden',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}>
          <div
            data-testid="designer-page-content-area"
            style={{
              position: 'absolute',
              left: rawMarginLeftPx,
              top: rawMarginTopPx,
              width: safeCssNumber(rawPrintableWidthPx),
              height: safeCssNumber(rawPrintableHeightPx),
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)
              `,
              backgroundSize: `${gridPx}px ${gridPx}px`,
              overflow: 'visible',
            }}
          >
            {/* Alignment guides */}
            {guides.map((g, i) => {
              const selectedFlat = flat.find(f => f.comp.id === selectedComponentIds[0]);
              return (
                <div key={i} style={{
                  position: 'absolute',
                  ...(g.type === 'horizontal' ? { left: 0, right: 0, top: safeCssNumber(mmToPx(selectedFlat?.visualY ?? 0) + mmToPx(BAND_HEADER_MM) + g.position - mmToPx((selectedFlat?.comp.y ?? 0))), height: 1 } : { top: 0, bottom: 0, left: safeCssNumber(g.position), width: 1 }),
                  backgroundColor: '#ff4d4f', zIndex: 9998, pointerEvents: 'none',
                }} />
              );
            })}

            {/* Bands */}
            {bands.map(({ band, visualY }) => (
              <BandView key={band.id} band={band} visualY={visualY}
                labelIndex={bandLabelIndexes[band.id] ?? 1}
                isSelected={band.id === selectedBandId}
                selectedIds={selectedComponentIds}
                fonts={template.fonts}
                onUpdateComponent={updateComponent} currentPageId={currentPageId} />
            ))}
          </div>

        {/* Selection box */}
        {mode.type === 'select' && selBox && (
          <div style={{
            position: 'absolute', left: safeCssNumber(selBox.x), top: safeCssNumber(selBox.y),
            width: safeCssNumber(selBox.w), height: safeCssNumber(selBox.h),
            border: '1px dashed #1890ff', backgroundColor: 'rgba(24,144,255,0.08)',
            pointerEvents: 'none', zIndex: 9999,
          }} />
        )}

        {/* Context menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            hasSelection={selectedComponentIds.length > 0}
            hasClipboard={storeClipboard.length > 0}
            selectedType={flat.find(f => f.comp.id === (contextMenu.compId ?? selectedComponentIds[0]))?.comp.type}
            tableCell={contextMenu.tableCell}
            onCopy={() => { copySelected(); setContextMenu(null); }}
            onCut={() => { cutSelected(); setContextMenu(null); }}
            onPaste={() => { pasteClipboard(); setContextMenu(null); }}
            onDuplicate={() => { duplicateSelected(); setContextMenu(null); }}
            onBringToFront={() => { useDesignerStore.getState().bringToFront(); setContextMenu(null); }}
            onSendToBack={() => { useDesignerStore.getState().sendToBack(); setContextMenu(null); }}
            onInsertTableColumn={() => { useDesignerStore.getState().insertSelectedTableColumn(contextMenu.tableCell?.column); setContextMenu(null); }}
            onDeleteTableColumn={() => { useDesignerStore.getState().deleteSelectedTableColumn(contextMenu.tableCell?.column); setContextMenu(null); }}
            onInsertTableRow={() => { useDesignerStore.getState().insertSelectedTableRow(contextMenu.tableCell?.row); setContextMenu(null); }}
            onDeleteTableRow={() => { useDesignerStore.getState().deleteSelectedTableRow(contextMenu.tableCell?.row); setContextMenu(null); }}
            onMergeTableCellRight={() => {
              if (contextMenu.tableCell) {
                useDesignerStore.getState().mergeSelectedTableCellRight(contextMenu.tableCell.row, contextMenu.tableCell.column);
              }
              setContextMenu(null);
            }}
            onSplitTableCell={() => {
              if (contextMenu.tableCell) {
                useDesignerStore.getState().splitSelectedTableCell(contextMenu.tableCell.row, contextMenu.tableCell.column);
              }
              setContextMenu(null);
            }}
            onClearTableCell={() => {
              if (contextMenu.tableCell) {
                useDesignerStore.getState().clearSelectedTableCell(contextMenu.tableCell.row, contextMenu.tableCell.column);
              }
              setContextMenu(null);
            }}
            onEqualizeTableColumns={() => { useDesignerStore.getState().equalizeSelectedTableColumns(); setContextMenu(null); }}
            onEqualizeTableRows={() => { useDesignerStore.getState().equalizeSelectedTableRows(); setContextMenu(null); }}
            onToggleTableBorder={() => {
              const table = flat.find(f => f.comp.id === (contextMenu.compId ?? selectedComponentIds[0]))?.comp as TableComponent | undefined;
              if (table?.type === 'table') useDesignerStore.getState().updateSelectedTable({ showBorder: !table.showBorder });
              setContextMenu(null);
            }}
            onDelete={() => {
              deleteSelected();
              setContextMenu(null);
            }}
          />
        )}
        </div>
      </div>

      {/* 缩放控制条 */}
      <ZoomBar zoom={zoom} onZoomIn={() => setZoom(Math.min(4, Math.round((zoom + 0.1) * 100) / 100))} onZoomOut={() => setZoom(Math.max(0.25, Math.round((zoom - 0.1) * 100) / 100))} onReset={() => setZoom(1)} onSetZoom={(z) => setZoom(z)} />
    </div>
  );
};

// ---- Ruler Component ----

const Ruler: React.FC<{
  direction: 'horizontal' | 'vertical';
  lengthMm: number;
  lengthPx: number;
  printableOffsetPx: number;
  offsetPx: number;
  crossOffsetPx: number;
  zoom: number;
}> = ({ direction, lengthMm, lengthPx, printableOffsetPx, offsetPx, crossOffsetPx, zoom }) => {
  const isHorizontal = direction === 'horizontal';

  const ticks = useMemo(() => {
    const result: { pos: number; major: boolean; medium: boolean; label?: string }[] = [];

    for (let mm = 0; mm <= Math.floor(lengthMm); mm += 1) {
      const px = printableOffsetPx + mmToPx(mm) * zoom;
      const isMajor = mm % 10 === 0;
      result.push({
        pos: px,
        major: isMajor,
        medium: !isMajor && mm % 5 === 0,
        label: isMajor ? `${mm}` : undefined,
      });
    }
    return result;
  }, [lengthMm, printableOffsetPx, zoom]);

  return (
    <div
      data-testid={`designer-ruler-${direction}`}
      data-printable-offset-px={Math.round(printableOffsetPx)}
      style={{
      position: 'absolute',
      ...(isHorizontal
        ? { left: `${offsetPx}px`, top: `${crossOffsetPx}px`, width: `${lengthPx}px`, height: `${RULER_SIZE}px` }
        : { left: `${crossOffsetPx}px`, top: `${offsetPx}px`, width: `${RULER_SIZE}px`, height: `${lengthPx}px` }
      ),
      overflow: 'hidden',
      backgroundColor: '#f1f1f1',
      borderRight: isHorizontal ? undefined : '1px solid #b9b9b9',
      borderBottom: isHorizontal ? '1px solid #b9b9b9' : undefined,
      zIndex: 1000,
      userSelect: 'none',
    }}>
      <svg width={isHorizontal ? lengthPx : RULER_SIZE} height={isHorizontal ? RULER_SIZE : lengthPx} style={{ display: 'block' }}>
        {ticks.map((tick, i) => {
          if (isHorizontal) {
            const tickH = tick.major ? 16 : tick.medium ? 11 : 6;
            return (
              <g key={i}>
                <line x1={tick.pos} y1={RULER_SIZE} x2={tick.pos} y2={RULER_SIZE - tickH} stroke={tick.major ? '#555' : '#8f8f8f'} strokeWidth={tick.major ? 1 : 0.5} />
                {tick.label && (
                  <text x={tick.pos + 4} y={11} fontSize="8" fill="#444" fontFamily="Arial">{tick.label}</text>
                )}
              </g>
            );
          } else {
            const tickW = tick.major ? 16 : tick.medium ? 11 : 6;
            return (
              <g key={i}>
                <line x1={RULER_SIZE} y1={tick.pos} x2={RULER_SIZE - tickW} y2={tick.pos} stroke={tick.major ? '#555' : '#8f8f8f'} strokeWidth={tick.major ? 1 : 0.5} />
                {tick.label && (
                  <text x={2} y={tick.pos + 3} fontSize="8" fill="#444" fontFamily="Arial">{tick.label}</text>
                )}
              </g>
            );
          }
        })}
      </svg>
    </div>
  );
};

// ---- Zoom Bar Component ----

const ZoomBar: React.FC<{
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onSetZoom: (z: number) => void;
}> = ({ zoom, onZoomIn, onZoomOut, onReset, onSetZoom }) => (
  <div data-testid="designer-zoom-bar" style={{
    position: 'absolute', left: 32, bottom: 16,
    backgroundColor: '#fff', border: '1px solid #d9d9d9', borderRadius: 4,
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 10000,
    display: 'flex', alignItems: 'center', padding: '2px 4px', gap: 2,
  }}>
    <button onClick={onZoomOut} title="缩小"
      style={zoomBtnStyle}>{'−'}</button>
    <span onClick={onReset} title="重置为 100%"
      style={{ fontSize: 11, color: '#555', cursor: 'pointer', padding: '0 6px', minWidth: 40, textAlign: 'center' }}>
      {Math.round(zoom * 100)}%
    </span>
    <button onClick={onZoomIn} title="放大"
      style={zoomBtnStyle}>{'+'}</button>
    <div style={{ width: 1, height: 18, backgroundColor: '#d9d9d9', margin: '0 2px' }} />
    <button onClick={() => onSetZoom(0.5)} title="50%" style={{ ...zoomBtnStyle, width: 28, fontSize: 10 }}>50%</button>
    <button onClick={() => onSetZoom(1)} title="100%" style={{ ...zoomBtnStyle, width: 34, fontSize: 10 }}>100%</button>
    <button onClick={() => onSetZoom(2)} title="200%" style={{ ...zoomBtnStyle, width: 34, fontSize: 10 }}>200%</button>
  </div>
);

const zoomBtnStyle: React.CSSProperties = {
  width: 24, height: 24, border: '1px solid #d9d9d9', borderRadius: 3,
  backgroundColor: '#fff', cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', fontSize: 14,
  padding: 0, lineHeight: 1, color: '#555',
};

// ---- Context Menu Component ----

interface ContextMenuProps {
  x: number; y: number;
  hasSelection: boolean; hasClipboard: boolean;
  selectedType?: ReportComponent['type'];
  tableCell?: { row: number; column: number };
  onCopy: () => void; onCut: () => void; onPaste: () => void; onDuplicate: () => void; onDelete: () => void;
  onBringToFront: () => void; onSendToBack: () => void;
  onInsertTableColumn: () => void; onDeleteTableColumn: () => void;
  onInsertTableRow: () => void; onDeleteTableRow: () => void; onToggleTableBorder: () => void;
  onMergeTableCellRight: () => void; onSplitTableCell: () => void; onClearTableCell: () => void;
  onEqualizeTableColumns: () => void; onEqualizeTableRows: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  hasSelection,
  hasClipboard,
  selectedType,
  tableCell,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
  onInsertTableColumn,
  onDeleteTableColumn,
  onInsertTableRow,
  onDeleteTableRow,
  onToggleTableBorder,
  onMergeTableCellRight,
  onSplitTableCell,
  onClearTableCell,
  onEqualizeTableColumns,
  onEqualizeTableRows,
}) => {
  const { t } = useDesignerI18n();
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: 4,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10000,
      minWidth: 210, padding: '4px 0',
    }}>
      <ContextMenuItem label={t('contextMenu.copy')} shortcut="Ctrl+C" disabled={!hasSelection} onClick={onCopy} />
      <ContextMenuItem label={t('contextMenu.cut')} shortcut="Ctrl+X" disabled={!hasSelection} onClick={onCut} />
      <ContextMenuItem label={t('contextMenu.paste')} shortcut="Ctrl+V" disabled={!hasClipboard} onClick={onPaste} />
      <ContextMenuItem label={t('contextMenu.duplicate')} shortcut="Ctrl+D" disabled={!hasSelection} onClick={onDuplicate} />
      <div style={{ height: 1, backgroundColor: '#eee', margin: '4px 0' }} />
      <ContextMenuItem label={t('contextMenu.bringToFront')} shortcut="Ctrl+Alt+↑" disabled={!hasSelection} onClick={onBringToFront} />
      <ContextMenuItem label={t('contextMenu.sendToBack')} shortcut="Ctrl+Alt+↓" disabled={!hasSelection} onClick={onSendToBack} />
      {selectedType === 'table' && (
        <>
          <div style={{ height: 1, backgroundColor: '#eee', margin: '4px 0' }} />
          <ContextMenuItem label={t('contextMenu.table.insertColumnRight')} onClick={onInsertTableColumn} />
          <ContextMenuItem label={t('contextMenu.table.deleteColumn')} onClick={onDeleteTableColumn} />
          <ContextMenuItem label={t('contextMenu.table.insertRowBelow')} onClick={onInsertTableRow} />
          <ContextMenuItem label={t('contextMenu.table.deleteRow')} onClick={onDeleteTableRow} />
          <div style={{ height: 1, backgroundColor: '#eee', margin: '4px 0' }} />
          <ContextMenuItem label={t('contextMenu.table.mergeRight')} disabled={!tableCell} onClick={onMergeTableCellRight} />
          <ContextMenuItem label={t('contextMenu.table.splitCell')} disabled={!tableCell} onClick={onSplitTableCell} />
          <ContextMenuItem label={t('contextMenu.table.clearCell')} disabled={!tableCell} onClick={onClearTableCell} />
          <ContextMenuItem label={t('contextMenu.table.equalizeColumns')} onClick={onEqualizeTableColumns} />
          <ContextMenuItem label={t('contextMenu.table.equalizeRows')} onClick={onEqualizeTableRows} />
          <ContextMenuItem label={t('contextMenu.table.toggleBorder')} onClick={onToggleTableBorder} />
        </>
      )}
      <div style={{ height: 1, backgroundColor: '#eee', margin: '4px 0' }} />
      <ContextMenuItem label={t('contextMenu.delete')} shortcut="Del" disabled={!hasSelection} onClick={onDelete} danger />
    </div>
  );
};

const ContextMenuItem: React.FC<{
  label: string; shortcut?: string; disabled?: boolean; danger?: boolean;
  onClick: () => void;
}> = ({ label, shortcut, disabled, danger, onClick }) => (
  <div
    onClick={disabled ? undefined : onClick}
    style={{
      padding: '4px 16px', cursor: disabled ? 'default' : 'pointer',
      color: disabled ? '#ccc' : danger ? '#ff4d4f' : '#333',
      fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: disabled ? 'transparent' : 'transparent',
    }}
    onMouseEnter={(e) => { if (!disabled) (e.target as HTMLElement).style.backgroundColor = '#f0f0f0'; }}
    onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = 'transparent'; }}
  >
    <span>{label}</span>
    {shortcut && <span style={{ color: '#999', fontSize: 11 }}>{shortcut}</span>}
  </div>
);

// ---- Band View ----

const BandView: React.FC<{
  band: Band; visualY: number; labelIndex: number; isSelected: boolean; selectedIds: string[];
  fonts?: ReportFont[];
  onUpdateComponent: (pageId: string, bandId: string, compId: string, updates: Record<string, any>, prev?: Record<string, any>) => void;
  currentPageId: string;
}> = ({ band, visualY, labelIndex, isSelected, selectedIds, fonts, onUpdateComponent, currentPageId }) => {
  const [editId, setEditId] = useState<string | null>(null);
  const [editKind, setEditKind] = useState<'text' | 'richtext' | null>(null);
  const [editText, setEditText] = useState('');
  const selectBand = useDesignerStore((state) => state.selectBand);
  const selectComponents = useDesignerStore((state) => state.selectComponents);
  const baseColor = BAND_COLORS[band.type] || '#757575';
  const baseLabel = BAND_LABELS[band.type] ?? band.type;
  const bandLabel = `${baseLabel}${labelIndex}`;
  const headerHeight = mmToPx(BAND_HEADER_MM);
  const bodyHeight = mmToPx(band.height);

  const handleBandMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (
      target.closest('[data-component-id]') ||
      target.closest('[data-resize-handle]') ||
      target.closest('[data-band-resize]')
    ) {
      return;
    }
    event.stopPropagation();
    selectComponents([]);
    selectBand(band.id);
  };

  return (
    <div data-band-id={band.id} data-testid={`designer-band-frame-${band.type}`} onMouseDown={handleBandMouseDown} style={{
      position: 'absolute', left: 0, top: safeCssNumber(mmToPx(visualY)), width: '100%', height: safeCssNumber(headerHeight + bodyHeight),
      border: isSelected ? '1px solid #4d90fe' : '1px solid rgba(0,0,0,0.12)',
      boxSizing: 'border-box',
      backgroundColor: `${baseColor}10`,
    }}>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: safeCssNumber(headerHeight),
        backgroundColor: `${baseColor}44`,
        borderBottom: `1px solid ${baseColor}66`,
        display: 'flex', alignItems: 'center',
        padding: '0 3px',
        fontSize: 12, lineHeight: `${headerHeight}px`, color: '#111',
        cursor: 'default', zIndex: 3, pointerEvents: 'none',
        boxSizing: 'border-box',
      }}>
        <span>{bandLabel}</span>
        <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' }}>
          {baseLabel}
        </span>
      </div>

      <BandResizeHandle bandId={band.id} />

      <div data-testid={`designer-band-body-${band.type}`} style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: headerHeight,
        height: safeCssNumber(bodyHeight),
      }}>
        {band.components
          .slice()
          .sort((a, b) => (a.zOrder ?? 0) - (b.zOrder ?? 0))
          .map(comp => (
          <ComponentView key={comp.id} component={comp} bandId={band.id}
            selected={selectedIds.includes(comp.id)} editing={editId === comp.id}
            editingKind={editId === comp.id ? editKind : null}
            editText={editText}
            fonts={fonts}
            onStartTextEdit={() => { setEditId(comp.id); setEditKind('text'); setEditText((comp as any).text || ''); }}
            onStartRichTextEdit={() => { setEditId(comp.id); setEditKind('richtext'); }}
            onFinishEdit={(text) => {
              onUpdateComponent(currentPageId, band.id, comp.id, { text }, { text: (comp as any).text });
              setEditId(null);
              setEditKind(null);
            }}
            onFinishRichText={(value) => {
              onUpdateComponent(
                currentPageId,
                band.id,
                comp.id,
                { html: value.html, document: value.document },
                { html: (comp as any).html, document: (comp as any).document },
              );
              setEditId(null);
              setEditKind(null);
            }}
            onCancelEdit={() => { setEditId(null); setEditKind(null); }}
            onEditTextChange={setEditText} />
        ))}
      </div>
    </div>
  );
};

// ---- Band Resize Handle ----

const BandResizeHandle: React.FC<{ bandId: string }> = ({ bandId }) => (
  <div data-band-resize data-band-id={bandId} style={{
    position: 'absolute', left: 0, right: 0, bottom: -3, height: 6,
    cursor: 'ns-resize', backgroundColor: 'transparent', zIndex: 2,
  }}
    onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = '#1890ff44'; }}
    onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = 'transparent'; }}
  />
);

// ---- Component View ----

const ComponentView: React.FC<{
  component: ReportComponent; bandId: string;
  selected: boolean; editing: boolean; editText: string;
  editingKind: 'text' | 'richtext' | null;
  fonts?: ReportFont[];
  onStartTextEdit: () => void; onStartRichTextEdit: () => void;
  onFinishEdit: (text: string) => void;
  onFinishRichText: (value: { html: string; document: RichTextDocument }) => void;
  onCancelEdit: () => void;
  onEditTextChange: (t: string) => void;
}> = ({
  component,
  bandId,
  selected,
  editing,
  editText,
  editingKind,
  fonts,
  onStartTextEdit,
  onStartRichTextEdit,
  onFinishEdit,
  onFinishRichText,
  onCancelEdit,
  onEditTextChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  React.useEffect(() => { if (editing && editingKind === 'text') setTimeout(() => inputRef.current?.focus(), 0); }, [editing, editingKind]);

  const x = safeCssNumber(mmToPx(component.x));
  const y = safeCssNumber(mmToPx(component.y));
  const w = safeCssNumber(mmToPx(component.width));
  const h = safeCssNumber(mmToPx(component.height));

  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h,
      border: selected ? '2px solid #1890ff' : '2px solid transparent',
      borderRadius: 2,
    }}>
      <div data-component-id={component.id}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (component.type === 'text') onStartTextEdit();
          if (component.type === 'richtext') onStartRichTextEdit();
        }}
        style={{
          position: 'absolute', inset: 0,
          boxSizing: 'border-box', cursor: editing ? 'text' : 'grab',
          overflow: 'hidden', padding: 2,
          backgroundColor: selected ? 'rgba(24,144,255,0.06)' : 'transparent',
          zIndex: selected ? 100 : 10,
          ...getCompStyle(component),
        }}>
        {editing && editingKind === 'text' ? (
          <input ref={inputRef} value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onFinishEdit(editText); if (e.key === 'Escape') onFinishEdit(editText); }}
            onBlur={() => onFinishEdit(editText)}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }} />
        ) : editing && editingKind === 'richtext' && component.type === 'richtext' ? (
          <RichTextInlineEditor
            html={String((component as any).html ?? '')}
            document={(component as any).document}
            fonts={fonts}
            onSave={onFinishRichText}
            onCancel={onCancelEdit}
          />
        ) : getCompContent(component)}
      </div>

      {selected && !editing && RESIZE_HANDLES.map(handle => (
        <div key={handle}
          data-resize-handle="" data-comp-id={component.id} data-band-id={bandId} data-handle-name={handle}
          style={{
            position: 'absolute', ...getHandlePos(handle, w, h),
            width: HANDLE_SIZE, height: HANDLE_SIZE,
            backgroundColor: '#1890ff', border: '1.5px solid #fff', borderRadius: 1,
            zIndex: 200, cursor: getCursorForHandle(handle),
          }} />
      ))}
    </div>
  );
};

// ---- Helpers ----

function getCompStyle(comp: ReportComponent): React.CSSProperties {
  if (comp.type === 'panel') {
    const panel = comp as any;
    const pad = comp.padding;
    return {
      backgroundColor: comp.backgroundColor || 'transparent',
      ...borderToCss(panel.border),
      ...(pad ? {
        paddingTop: `${pad.top * MM_TO_PX}px`,
        paddingRight: `${pad.right * MM_TO_PX}px`,
        paddingBottom: `${pad.bottom * MM_TO_PX}px`,
        paddingLeft: `${pad.left * MM_TO_PX}px`,
      } : {}),
    };
  }

  if (comp.type === 'text') {
    const t = comp as any;
    const decorations: string[] = [];
    if (t.font?.underline) decorations.push('underline');
    if (t.font?.strikethrough) decorations.push('line-through');
    const pad = comp.padding;
    return {
      fontFamily: t.font?.family || 'Arial, sans-serif',
      fontSize: t.font?.size ? `${t.font.size * 1.33}px` : '16px',
      fontWeight: t.font?.bold ? 'bold' : 'normal',
      fontStyle: t.font?.italic ? 'italic' : 'normal',
      color: t.font?.color || '#000',
      textAlign: t.textAlign || 'left',
      textDecoration: decorations.length > 0 ? decorations.join(' ') : 'none',
      backgroundColor: comp.backgroundColor || 'transparent',
      ...(pad ? {
        paddingTop: `${pad.top * MM_TO_PX}px`,
        paddingRight: `${pad.right * MM_TO_PX}px`,
        paddingBottom: `${pad.bottom * MM_TO_PX}px`,
        paddingLeft: `${pad.left * MM_TO_PX}px`,
      } : {}),
      ...(t.border && t.border.style !== 'none' ? {
        borderTop: t.border.sides.top ? `${t.border.width}mm ${t.border.style} ${t.border.color}` : 'none',
        borderRight: t.border.sides.right ? `${t.border.width}mm ${t.border.style} ${t.border.color}` : 'none',
        borderBottom: t.border.sides.bottom ? `${t.border.width}mm ${t.border.style} ${t.border.color}` : 'none',
        borderLeft: t.border.sides.left ? `${t.border.width}mm ${t.border.style} ${t.border.color}` : 'none',
      } : {}),
    };
  }
  return {};
}

function borderToCss(border: any): React.CSSProperties {
  if (!border || border.style === 'none') return {};
  const width = border.width ?? 0;
  const style = border.style ?? 'solid';
  const color = border.color ?? '#000000';
  return {
    borderTop: border.sides?.top ? `${width}mm ${style} ${color}` : 'none',
    borderRight: border.sides?.right ? `${width}mm ${style} ${color}` : 'none',
    borderBottom: border.sides?.bottom ? `${width}mm ${style} ${color}` : 'none',
    borderLeft: border.sides?.left ? `${width}mm ${style} ${color}` : 'none',
  };
}

function getFontStyle(font: any): React.CSSProperties {
  if (!font) return {};
  return {
    fontFamily: font.family || 'Arial',
    fontSize: font.size ? `${font.size * 1.33}px` : '16px',
    fontWeight: font.bold ? 'bold' : 'normal',
    fontStyle: font.italic ? 'italic' : 'normal',
    color: font.color || '#000',
  };
}

function getCompContent(comp: ReportComponent): React.ReactNode {
  switch (comp.type) {
    case 'text':
      return <div style={{ width: '100%', height: '100%', overflow: 'hidden', lineHeight: 1.2 }}>{(comp as any).text || ''}</div>;
    case 'image': {
      const src = (comp as any).src || '';
      const fitMode = (comp as any).fitMode === 'stretch' || (comp as any).fitMode === 'fill'
        ? 'fill'
        : (comp as any).fitMode || 'contain';
      return src
        ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: fitMode }} draggable={false} />
        : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc', fontSize: 10, border: '1px dashed #ddd' }}>图片</div>;
    }
    case 'barcode': {
      const t = comp as any;
      const value = String(t.value || '');
      return (
        <div
          data-testid="designer-component-barcode-content"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'stretch',
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.2)',
            backgroundColor: '#fff',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              flex: 1,
              minHeight: 0,
              background: 'repeating-linear-gradient(90deg, #111 0 1px, transparent 1px 3px, #111 3px 5px, transparent 5px 8px)',
            }}
          />
          {t.showText ? (
            <div style={{ fontSize: 9, lineHeight: '11px', textAlign: 'center', color: '#111', fontFamily: 'monospace' }}>
              {value}
            </div>
          ) : null}
        </div>
      );
    }
    case 'checkbox': {
      const t = comp as any;
      const checked = readDesignBoolean(t.checked);
      return (
        <div data-testid="designer-component-checkbox-content" style={{ display: 'flex', alignItems: 'center', height: '100%', gap: 4, overflow: 'hidden' }}>
          <span style={{ width: 13, height: 13, border: '1px solid #333', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, lineHeight: 1, flex: '0 0 auto' }}>
            {checked ? '✓' : ''}
          </span>
          {t.label ? <span style={{ fontSize: 11, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.label}</span> : null}
        </div>
      );
    }
    case 'table':
      return <TablePreview table={comp as TableComponent} />;
    case 'richtext':
      return (
        <div
          data-testid="designer-component-richtext-content"
          style={{ width: '100%', height: '100%', overflow: 'hidden' }}
          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml((comp as any).html || '') }}
        />
      );
    case 'subreport':
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: 10, border: '1px dashed #cbd5e1', backgroundColor: '#f8fafc' }}>
          {`Subreport: ${(comp as any).templateUrl || 'local template'}`}
        </div>
      );
    case 'panel':
      return <PanelChildrenPreview panel={comp as any} />;
    case 'line': {
      const t = comp as any;
      const lw = (t.lineWidth ?? 0.2) * MM_TO_PX;
      const sx = (t.startX ?? 0) * MM_TO_PX;
      const sy = (t.startY ?? 0) * MM_TO_PX;
      const ex = (t.endX ?? comp.width) * MM_TO_PX;
      const ey = (t.endY ?? comp.height) * MM_TO_PX;
      const dash = t.lineStyle === 'dashed' ? '6,4' : t.lineStyle === 'dotted' ? '2,2' : undefined;
      return (
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          <line x1={sx} y1={sy} x2={ex} y2={ey}
            stroke={t.lineColor || '#000'}
            strokeWidth={lw}
            strokeDasharray={dash}
            strokeLinecap="round" />
        </svg>
      );
    }
    case 'shape': {
      const t = comp as any;
      const bw = (t.borderWidth ?? 0) * MM_TO_PX;
      const bc = t.borderColor || '#000';
      const fc = t.fillColor || 'transparent';
      const bs = t.borderStyle || 'solid';
      const dash = bs === 'dashed' ? '6,4' : bs === 'dotted' ? '2,2' : undefined;
      const wp = comp.width * MM_TO_PX;
      const hp = comp.height * MM_TO_PX;
      if (t.shapeType === 'rectangle') {
        return <svg width="100%" height="100%"><rect x={bw/2} y={bw/2} width={wp-bw} height={hp-bw} fill={fc} stroke={bc} strokeWidth={bw} strokeDasharray={dash} /></svg>;
      } else if (t.shapeType === 'ellipse') {
        return <svg width="100%" height="100%"><ellipse cx={wp/2} cy={hp/2} rx={wp/2-bw/2} ry={hp/2-bw/2} fill={fc} stroke={bc} strokeWidth={bw} strokeDasharray={dash} /></svg>;
      } else if (t.shapeType === 'roundRect') {
        const r = Math.min(wp, hp) * 0.15;
        return <svg width="100%" height="100%"><rect x={bw/2} y={bw/2} width={wp-bw} height={hp-bw} rx={r} ry={r} fill={fc} stroke={bc} strokeWidth={bw} strokeDasharray={dash} /></svg>;
      } else if (t.shapeType === 'triangle') {
        return <svg width="100%" height="100%"><polygon points={`${wp/2},${bw} ${wp-bw},${hp-bw} ${bw},${hp-bw}`} fill={fc} stroke={bc} strokeWidth={bw} strokeDasharray={dash} /></svg>;
      }
      return null;
    }
    case 'pagenumber': {
      const t = comp as any;
      return <div data-testid="designer-component-pagenumber-content" style={{ ...textLikePreviewStyle(t, 'center') }}>{designPageNumberText(t.format)}</div>;
    }
    case 'datetime': {
      const t = comp as any;
      return <div data-testid="designer-component-datetime-content" style={{ ...textLikePreviewStyle(t, 'left') }}>{formatDesignDateTime(new Date(), t.format || 'yyyy-MM-dd')}</div>;
    }
    default:
      return '';
  }
}

function textLikePreviewStyle(component: { font?: unknown; textAlign?: string; verticalAlign?: string }, fallbackAlign: 'left' | 'center' | 'right'): React.CSSProperties {
  return {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    lineHeight: 1.2,
    textAlign: (component.textAlign as React.CSSProperties['textAlign']) || fallbackAlign,
    display: 'flex',
    alignItems: verticalAlignToFlex(component.verticalAlign),
    ...getFontStyle(component.font),
  };
}

function verticalAlignToFlex(value?: string): React.CSSProperties['alignItems'] {
  if (value === 'top') return 'flex-start';
  if (value === 'bottom') return 'flex-end';
  return 'center';
}

const PanelChildrenPreview: React.FC<{ panel: ReportComponent & { components?: ReportComponent[] } }> = ({ panel }) => {
  const children = (panel.components ?? [])
    .slice()
    .sort((a, b) => (a.zOrder ?? 0) - (b.zOrder ?? 0));

  return (
    <div
      data-testid="designer-panel-content"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {children.map(child => (
        <PanelChildPreview key={child.id} component={child} />
      ))}
    </div>
  );
};

const PanelChildPreview: React.FC<{ component: ReportComponent }> = ({ component }) => (
  <div
    style={{
      position: 'absolute',
      left: safeCssNumber(mmToPx(component.x)),
      top: safeCssNumber(mmToPx(component.y)),
      width: safeCssNumber(mmToPx(component.width)),
      height: safeCssNumber(mmToPx(component.height)),
      boxSizing: 'border-box',
      overflow: 'hidden',
      padding: 2,
      ...getCompStyle(component),
    }}
  >
    {getCompContent(component)}
  </div>
);

function readDesignBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', ''].includes(normalized)) return false;
  return Boolean(value);
}

function designPageNumberText(format?: string): string {
  switch (format) {
    case '1':
      return '1';
    case 'Page 1':
      return 'Page 1';
    case 'Page 1 of N':
      return 'Page 1 of 1';
    case '1/N':
    default:
      return '1/1';
  }
}

function formatDesignDateTime(date: Date, pattern: string): string {
  const parts: Record<string, string> = {
    yyyy: String(date.getFullYear()).padStart(4, '0'),
    MM: String(date.getMonth() + 1).padStart(2, '0'),
    dd: String(date.getDate()).padStart(2, '0'),
    HH: String(date.getHours()).padStart(2, '0'),
    mm: String(date.getMinutes()).padStart(2, '0'),
    ss: String(date.getSeconds()).padStart(2, '0'),
  };
  return pattern.replace(/yyyy|MM|dd|HH|mm|ss/g, token => parts[token] ?? token);
}

const TablePreview: React.FC<{ table: TableComponent }> = ({ table }) => {
  const normalized = normalizeTable(table);
  const rowCount = normalized.rowCount ?? 3;
  const columnCount = normalized.columnCount ?? normalized.columns.length;
  const headerRowsCount = normalized.headerRowsCount ?? 1;
  const footerRowsCount = normalized.footerRowsCount ?? 0;
  const cellBorder = normalized.showBorder ? '1px solid #8c8c8c' : '1px dashed #d9d9d9';
  const coveredCells = new Set<string>();

  for (const cell of normalized.cells ?? []) {
    const rowSpan = Math.max(1, Math.min(cell.rowSpan ?? 1, rowCount - cell.row));
    const colSpan = Math.max(1, Math.min(cell.colSpan ?? 1, columnCount - cell.column));
    for (let r = cell.row; r < cell.row + rowSpan; r += 1) {
      for (let c = cell.column; c < cell.column + colSpan; c += 1) {
        if (r === cell.row && c === cell.column) continue;
        coveredCells.add(`${r}-${c}`);
      }
    }
  }

  const cells: React.ReactNode[] = [];
  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      if (coveredCells.has(`${row}-${column}`)) continue;

    const customCell = normalized.cells?.find(cell => cell.row === row && cell.column === column);
    const rowSpan = customCell ? Math.max(1, Math.min(customCell.rowSpan ?? 1, rowCount - row)) : 1;
    const colSpan = customCell ? Math.max(1, Math.min(customCell.colSpan ?? 1, columnCount - column)) : 1;
    const isHeader = row < headerRowsCount;
    const isFooter = row >= rowCount - footerRowsCount;
    const label = customCell?.text
      ?? (isHeader ? normalized.columns[column]?.header || `Header ${column + 1}` : '');

    cells.push(
      <div
        key={`${row}-${column}`}
        data-table-row={row}
        data-table-column={column}
        data-testid={`designer-table-cell-${row}-${column}`}
        style={{
          gridColumn: colSpan > 1 ? `span ${colSpan}` : undefined,
          gridRow: rowSpan > 1 ? `span ${rowSpan}` : undefined,
          minWidth: 0,
          minHeight: 0,
          borderRight: column + colSpan >= columnCount ? 'none' : cellBorder,
          borderBottom: row + rowSpan >= rowCount ? 'none' : cellBorder,
          backgroundColor: isHeader ? '#f0f5ff' : isFooter ? '#fff7e6' : '#fff',
          color: isHeader || isFooter ? '#333' : '#999',
          fontSize: 10,
          lineHeight: 1.2,
          padding: '2px 3px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {label || (row === headerRowsCount && column === 0 ? normalized.dataSource || 'Data' : '')}
      </div>
    );
    }
  }

  return (
    <div
      data-testid="designer-table-grid"
      style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))`,
        border: cellBorder,
        boxSizing: 'border-box',
        backgroundColor: '#fff',
      }}
    >
      {cells}
    </div>
  );
};
