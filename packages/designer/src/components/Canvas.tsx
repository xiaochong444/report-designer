import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import type { ReportComponent, Band } from '@report-designer/core';
import { useDesignerStore } from '../store/designer-store';

const MM_TO_PX = 3.78;
const SNAP_THRESHOLD = 5;
const HANDLE_SIZE = 8;
const GRID_MM = 5; // 网格间距 5mm
const DRAG_THRESHOLD = 3; // px，超过此距离才算真正开始拖拽
type ResizeHandle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

function mmToPx(mm: number): number { return Math.round(mm * MM_TO_PX); }
function pxToMm(px: number): number { return Math.round(px / MM_TO_PX * 10) / 10; }

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

// ---- Context Menu ----

interface ContextMenuPos { x: number; y: number; compId?: string }

// ---- Canvas ----

export const Canvas: React.FC<{ className?: string }> = ({ className }) => {
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const selectedComponentIds = useDesignerStore(s => s.selectedComponentIds);
  const selectedBandId = useDesignerStore(s => s.selectedBandId);
  const selectComponents = useDesignerStore(s => s.selectComponents);
  const selectBand = useDesignerStore(s => s.selectBand);
  const moveComponent = useDesignerStore(s => s.moveComponent);
  const moveComponentSilent = useDesignerStore(s => s.moveComponentSilent);
  const updateComponent = useDesignerStore(s => s.updateComponent);
  const updateComponentSilent = useDesignerStore(s => s.updateComponentSilent);
  const resizeBand = useDesignerStore(s => s.resizeBand);
  const resizeBandSilent = useDesignerStore(s => s.resizeBandSilent);
  const removeComponent = useDesignerStore(s => s.removeComponent);
  const undo = useDesignerStore(s => s.undo);
  const redo = useDesignerStore(s => s.redo);

  const pageRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<Mode>({ type: 'idle' });
  const [mode, setMode] = useState<Mode>({ type: 'idle' });
  const [selBox, setSelBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuPos | null>(null);
  const [clipboard, setClipboard] = useState<ReportComponent[]>([]);
  const [zoom, setZoom] = useState(1); // 缩放比例 0.25 ~ 4

  const currentPage = useMemo(() => template.pages.find(p => p.id === currentPageId), [template, currentPageId]);

  const bands = useMemo(() => {
    if (!currentPage) return [] as { band: Band; cumY: number }[];
    let y = 0;
    return currentPage.bands.map(band => { const r = { band, cumY: y }; y += band.height; return r; });
  }, [currentPage]);

  const flat = useMemo(() => {
    const items: { comp: ReportComponent; bandId: string; cumY: number }[] = [];
    for (const { band, cumY } of bands) {
      for (const comp of band.components) {
        items.push({ comp, bandId: band.id, cumY });
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

  // ---- Mouse down ----

  const handlePageMouseDown = useCallback((e: React.MouseEvent) => {
    setContextMenu(null);
    if (e.button === 2) {
      // Right click context menu
      const ch = findComponentAtPoint(e.clientX, e.clientY);
      if (ch && !selectedComponentIds.includes(ch.compId)) {
        selectComponents([ch.compId]);
      }
      if (pageRef.current) {
        const rect = pageRef.current.getBoundingClientRect();
        setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top, compId: ch?.compId });
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
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const m: Mode = { type: 'select', startX: sx, startY: sy };
    modeRef.current = m;
    setMode(m);
    setSelBox({ x: sx, y: sy, w: 0, h: 0 });
  }, [flat, bands, selectedComponentIds, selectComponents, selectBand, findComponentAtPoint, findResizeHandleAtPoint, findBandResizeAtPoint]);

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

        const dxMm = pxToMm(dxPx);
        const dyMm = pxToMm(dyPx);

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
        const dx = pxToMm(e.clientX - m.startX);
        const dy = pxToMm(e.clientY - m.startY);
        let nx = m.origX, ny = m.origY, nw = m.origW, nh = m.origH;
        if (m.handle.includes('e')) nw = Math.max(5, m.origW + dx);
        if (m.handle.includes('w')) { nw = Math.max(5, m.origW - dx); nx = m.origX + dx; }
        if (m.handle.includes('s')) nh = Math.max(5, m.origH + dy);
        if (m.handle.includes('n')) { nh = Math.max(5, m.origH - dy); ny = m.origY + dy; }
        updateComponentSilent(currentPageIdRef.current, m.bandId, m.compId,
          { x: nx, y: ny, width: nw, height: nh },
        );

      } else if (m.type === 'band-resize') {
        const dy = pxToMm(e.clientY - m.startY);
        const nh = Math.max(5, Math.round((m.origHeight + dy) * 10) / 10);
        resizeBandSilent(currentPageIdRef.current, m.bandId, nh);

      } else if (m.type === 'select') {
        if (!pageRef.current) return;
        const rect = pageRef.current.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
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
          let cumY = 0;
          for (const band of page.bands) {
            for (const comp of band.components) {
              const l = mmToPx(comp.x), t = mmToPx(cumY) + mmToPx(comp.y);
              const r = l + mmToPx(comp.width), b = t + mmToPx(comp.height);
              if (selBoxRef.current.x < r && selBoxRef.current.x + selBoxRef.current.w > l && selBoxRef.current.y < b && selBoxRef.current.y + selBoxRef.current.h > t) {
                ids.push(comp.id);
              }
            }
            cumY += band.height;
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
  }, [moveComponent, updateComponent, resizeBand, selectComponents]);

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
        for (const id of [...selectedComponentIds]) {
          const f = flat.find(x => x.comp.id === id);
          if (f) removeComponent(currentPageId, f.bandId, id);
        }
        return;
      }

      // Ctrl+C: 复制
      if (isCtrl && e.key === 'c') {
        e.preventDefault();
        const comps = selectedComponentIds
          .map(id => flat.find(f => f.comp.id === id)?.comp)
          .filter(Boolean) as ReportComponent[];
        setClipboard(comps.map(c => ({ ...c, id: `copy_${c.id}_${Date.now()}` })));
        return;
      }

      // Ctrl+V: 粘贴
      if (isCtrl && e.key === 'v') {
        e.preventDefault();
        if (clipboard.length > 0 && selectedComponentIds.length > 0) {
          // 粘贴到选中组件所在的 band
          const firstId = selectedComponentIds[0];
          const f = flat.find(x => x.comp.id === firstId);
          if (f) {
            for (const clip of clipboard) {
              const newComp = { ...clip, id: `${clip.type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, x: clip.x + 5, y: clip.y + 5 };
              const t = template.pages.find(p => p.id === currentPageId)?.bands.find(b => b.id === f.bandId);
              if (t) {
                // Use addComponent from store
                useDesignerStore.getState().addComponent(currentPageId, f.bandId, newComp);
              }
            }
          }
        }
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
        const step = e.shiftKey ? 1 : 0.5; // Shift = 1mm, normal = 0.5mm
        for (const id of selectedComponentIds) {
          const f = flat.find(x => x.comp.id === id);
          if (f) {
            let { x, y } = f.comp;
            if (e.key === 'ArrowUp') y -= step;
            if (e.key === 'ArrowDown') y += step;
            if (e.key === 'ArrowLeft') x -= step;
            if (e.key === 'ArrowRight') x += step;
            moveComponent(currentPageId, f.bandId, id, x, y, f.comp.x, f.comp.y);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentIds, flat, currentPageId, clipboard, template, removeComponent, undo, redo, selectComponents, moveComponent]);

  // ---- Zoom wheel handler ----

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => {
          const next = Math.min(4, Math.max(0.25, prev + delta));
          return Math.round(next * 100) / 100;
        });
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // ---- Click outside to close context menu ----

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu]);

  if (!currentPage) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
        没有页面选中
      </div>
    );
  }

  const isBusy = mode.type !== 'idle';
  const gridPx = mmToPx(GRID_MM) * zoom;
  const pageWidthPx = mmToPx(currentPage.width) * zoom;
  const pageHeightPx = mmToPx(currentPage.height) * zoom;

  return (
    <div ref={containerRef} className={className}
      style={{ overflowX: 'hidden', overflowY: 'auto', backgroundColor: '#e8e8e8', height: '100%', padding: 24, userSelect: isBusy ? 'none' : 'auto', position: 'relative' }}
    >
      <div style={{ position: 'relative', width: pageWidthPx + 24, margin: '0 auto' }}>
        {/* 顶部标尺 */}
        <Ruler direction="horizontal" pageWidthPx={pageWidthPx} pageHeightPx={pageHeightPx} zoom={zoom} />
        <Ruler direction="vertical" pageWidthPx={pageWidthPx} pageHeightPx={pageHeightPx} zoom={zoom} />

        <div ref={pageRef} data-page
          onMouseDown={handlePageMouseDown}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            width: pageWidthPx, minHeight: pageHeightPx,
            backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            position: 'relative', marginLeft: 24, marginTop: 24, overflow: 'hidden',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            // 网格背景
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)
            `,
            backgroundSize: `${gridPx}px ${gridPx}px`,
          }}>
        {/* Alignment guides */}
        {guides.map((g, i) => (
          <div key={i} style={{
            position: 'absolute',
            ...(g.type === 'horizontal' ? { left: 14, right: 0, top: mmToPx(flat.find(f => f.comp.id === selectedComponentIds[0])?.cumY ?? 0) + g.position - mmToPx((flat.find(f => f.comp.id === selectedComponentIds[0])?.comp.y ?? 0)), height: 1 } : { top: 0, bottom: 0, left: g.position, width: 1 }),
            backgroundColor: '#ff4d4f', zIndex: 9998, pointerEvents: 'none',
          }} />
        ))}

        {/* Bands */}
        {bands.map(({ band, cumY }) => (
          <BandView key={band.id} band={band} cumY={cumY}
            isSelected={band.id === selectedBandId}
            selectedIds={selectedComponentIds}
            onUpdateComponent={updateComponent} currentPageId={currentPageId} />
        ))}

        {/* Selection box */}
        {mode.type === 'select' && selBox && (
          <div style={{
            position: 'absolute', left: selBox.x, top: selBox.y,
            width: selBox.w, height: selBox.h,
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
            hasClipboard={clipboard.length > 0}
            onCopy={() => {
              const comps = selectedComponentIds
                .map(id => flat.find(f => f.comp.id === id)?.comp)
                .filter(Boolean) as ReportComponent[];
              setClipboard(comps.map(c => ({ ...c, id: `copy_${c.id}` })));
              setContextMenu(null);
            }}
            onPaste={() => {
              if (clipboard.length > 0 && contextMenu.compId) {
                const f = flat.find(x => x.comp.id === contextMenu.compId);
                if (f) {
                  for (const clip of clipboard) {
                    const newComp = { ...clip, id: `${clip.type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, x: clip.x + 5, y: clip.y + 5 };
                    useDesignerStore.getState().addComponent(currentPageId, f.bandId, newComp);
                  }
                }
              }
              setContextMenu(null);
            }}
            onDelete={() => {
              for (const id of [...selectedComponentIds]) {
                const f = flat.find(x => x.comp.id === id);
                if (f) removeComponent(currentPageId, f.bandId, id);
              }
              setContextMenu(null);
            }}
          />
        )}
        </div>
      </div>

      {/* 缩放控制条 - 固定在画布右下角 */}
      <ZoomBar zoom={zoom} onZoomIn={() => setZoom(z => Math.min(4, Math.round((z + 0.1) * 100) / 100))} onZoomOut={() => setZoom(z => Math.max(0.25, Math.round((z - 0.1) * 100) / 100))} onReset={() => setZoom(1)} onSetZoom={(z) => setZoom(z)} />
    </div>
  );
};

// ---- Ruler Component ----

const Ruler: React.FC<{
  direction: 'horizontal' | 'vertical';
  pageWidthPx: number;
  pageHeightPx: number;
  zoom: number;
}> = ({ direction, pageWidthPx, pageHeightPx, zoom }) => {
  const isHorizontal = direction === 'horizontal';
  const rulerSize = 24;
  const totalLen = isHorizontal ? pageWidthPx : pageHeightPx;
  const majorStep = 10; // 每 10mm 一个主刻度
  const minorStep = 1;  // 每 1mm 一个次刻度

  const ticks = useMemo(() => {
    const result: { pos: number; major: boolean; label?: string }[] = [];
    const step = 1;  // 每 1mm 一个次刻度

    for (let mm = 0; mm * zoom * MM_TO_PX < totalLen; mm += step) {
      const px = mmToPx(mm) * zoom;
      const isMajor = mm % majorStep === 0;
      result.push({
        pos: px,
        major: isMajor,
        label: isMajor ? `${mm}` : undefined,
      });
    }
    return result;
  }, [totalLen, zoom]);

  return (
    <div style={{
      position: 'absolute',
      ...(isHorizontal
        ? { left: `${rulerSize}px`, top: 0, width: `${totalLen}px`, height: `${rulerSize}px` }
        : { left: 0, top: `${rulerSize}px`, width: `${rulerSize}px`, height: `${totalLen}px` }
      ),
      overflow: 'hidden',
      backgroundColor: '#f5f5f5',
      border: isHorizontal ? undefined : '1px solid #ddd',
      zIndex: 1000,
      userSelect: 'none',
    }}>
      <svg width={isHorizontal ? totalLen : rulerSize} height={isHorizontal ? rulerSize : totalLen} style={{ display: 'block' }}>
        {ticks.map((tick, i) => {
          if (isHorizontal) {
            const tickH = tick.major ? 10 : 5;
            return (
              <g key={i}>
                <line x1={tick.pos} y1={rulerSize} x2={tick.pos} y2={rulerSize - tickH} stroke="#999" strokeWidth={tick.major ? 1 : 0.5} />
                {tick.label && (
                  <text x={tick.pos + 2} y={10} fontSize="8" fill="#666" fontFamily="Arial">{tick.label}</text>
                )}
              </g>
            );
          } else {
            const tickW = tick.major ? 10 : 5;
            return (
              <g key={i}>
                <line x1={rulerSize} y1={tick.pos} x2={rulerSize - tickW} y2={tick.pos} stroke="#999" strokeWidth={tick.major ? 1 : 0.5} />
                {tick.label && (
                  <text x={12} y={tick.pos + 3} fontSize="8" fill="#666" fontFamily="Arial" transform={`rotate(-90, 12, ${tick.pos + 3})`}>{tick.label}</text>
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
  <div style={{
    position: 'fixed', right: 40, bottom: 40,
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

const ContextMenu: React.FC<{
  x: number; y: number;
  hasSelection: boolean; hasClipboard: boolean;
  onCopy: () => void; onPaste: () => void; onDelete: () => void;
}> = ({ x, y, hasSelection, hasClipboard, onCopy, onPaste, onDelete }) => (
  <div style={{
    position: 'absolute', left: x, top: y,
    backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: 4,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10000,
    minWidth: 140, padding: '4px 0',
  }}>
    <ContextMenuItem label="复制" shortcut="Ctrl+C" disabled={!hasSelection} onClick={onCopy} />
    <ContextMenuItem label="粘贴" shortcut="Ctrl+V" disabled={!hasClipboard} onClick={onPaste} />
    <div style={{ height: 1, backgroundColor: '#eee', margin: '4px 0' }} />
    <ContextMenuItem label="删除" shortcut="Del" disabled={!hasSelection} onClick={onDelete} danger />
  </div>
);

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
  band: Band; cumY: number; isSelected: boolean; selectedIds: string[];
  onUpdateComponent: (pageId: string, bandId: string, compId: string, updates: Record<string, any>, prev?: Record<string, any>) => void;
  currentPageId: string;
}> = ({ band, cumY, isSelected, selectedIds, onUpdateComponent, currentPageId }) => {
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  return (
    <div data-band-id={band.id} style={{
      position: 'absolute', left: 0, top: mmToPx(cumY), width: '100%', height: mmToPx(band.height),
      border: '1px solid transparent',
      boxSizing: 'border-box',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, width: 14, height: '100%',
        backgroundColor: BAND_COLORS[band.type] || '#757575', opacity: 0.7,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 8, color: '#fff', writingMode: 'vertical-rl', textOrientation: 'mixed',
        letterSpacing: 1, cursor: 'default', zIndex: 1, pointerEvents: 'none',
      }}>{band.type}</div>

      <BandResizeHandle bandId={band.id} />

      {band.components
        .slice()
        .sort((a, b) => (a.zOrder ?? 0) - (b.zOrder ?? 0))
        .map(comp => (
        <ComponentView key={comp.id} component={comp} bandId={band.id}
          selected={selectedIds.includes(comp.id)} editing={editId === comp.id}
          editText={editText}
          onStartEdit={() => { setEditId(comp.id); setEditText((comp as any).text || ''); }}
          onFinishEdit={(text) => {
            onUpdateComponent(currentPageId, band.id, comp.id, { text }, { text: (comp as any).text });
            setEditId(null);
          }}
          onEditTextChange={setEditText} />
      ))}
    </div>
  );
};

// ---- Band Resize Handle ----

const BandResizeHandle: React.FC<{ bandId: string }> = ({ bandId }) => (
  <div data-band-resize data-band-id={bandId} style={{
    position: 'absolute', left: 14, right: 0, bottom: -3, height: 6,
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
  onStartEdit: () => void; onFinishEdit: (text: string) => void;
  onEditTextChange: (t: string) => void;
}> = ({ component, bandId, selected, editing, editText, onStartEdit, onFinishEdit, onEditTextChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  React.useEffect(() => { if (editing) setTimeout(() => inputRef.current?.focus(), 0); }, [editing]);

  const x = mmToPx(component.x);
  const y = mmToPx(component.y);
  const w = mmToPx(component.width);
  const h = mmToPx(component.height);

  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h,
      border: selected ? '2px solid #1890ff' : '2px solid transparent',
      borderRadius: 2,
    }}>
      <div data-component-id={component.id}
        onDoubleClick={(e) => { e.stopPropagation(); if (component.type === 'text') onStartEdit(); }}
        style={{
          position: 'absolute', inset: 0,
          boxSizing: 'border-box', cursor: editing ? 'text' : 'grab',
          overflow: 'hidden', padding: 2,
          backgroundColor: selected ? 'rgba(24,144,255,0.06)' : 'transparent',
          zIndex: selected ? 100 : 10,
          ...getCompStyle(component),
        }}>
        {editing ? (
          <input ref={inputRef} value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onFinishEdit(editText); if (e.key === 'Escape') onFinishEdit(editText); }}
            onBlur={() => onFinishEdit(editText)}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }} />
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
      return src
        ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} />
        : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc', fontSize: 10, border: '1px dashed #ddd' }}>图片</div>;
    }
    case 'barcode':
      return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc', fontSize: 10 }}>条码</div>;
    case 'checkbox':
      return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><span style={{ fontSize: 16 }}>☐</span></div>;
    case 'table':
      return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc', fontSize: 10, border: '1px dashed #ddd' }}>表格</div>;
    case 'richtext':
      return <div style={{ width: '100%', height: '100%', overflow: 'hidden', fontSize: 10, color: '#999' }}>富文本</div>;
    case 'subreport':
      return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc', fontSize: 10, border: '1px dashed #ddd' }}>子报表</div>;
    case 'panel':
      return <div style={{ width: '100%', height: '100%', border: '1px dashed #ddd' }} />;
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
      return <div style={{ width: '100%', height: '100%', overflow: 'hidden', lineHeight: 1.2, textAlign: t.textAlign || 'center', ...getFontStyle(t.font) }}>页码</div>;
    }
    case 'datetime': {
      const t = comp as any;
      return <div style={{ width: '100%', height: '100%', overflow: 'hidden', lineHeight: 1.2, textAlign: t.textAlign || 'left', ...getFontStyle(t.font) }}>日期</div>;
    }
    default:
      return '';
  }
}
