import { describe, it, expect } from 'vitest';
import { useDesignerStore } from '../../src/store/designer-store';
import type { ReportComponent } from '@report-designer/core';

function resetStore() {
  useDesignerStore.setState({
    template: {
      id: 'tpl_test',
      name: 'Test Template',
      version: '2.0',
      pages: [{
        id: 'page_test',
        width: 210, height: 297,
        margins: { top: 10, right: 10, bottom: 10, left: 10 },
        orientation: 'portrait',
        bands: [
          { id: 'band_ph', type: 'pageHeader', height: 20, components: [] },
          { id: 'band_data', type: 'data', height: 50, components: [] },
          { id: 'band_pf', type: 'pageFooter', height: 20, components: [] },
        ],
      }],
      dataSources: [],
      styles: [],
      conditionalFormats: [],
      parameters: [],
    },
    currentPageId: 'page_test',
    selectedComponentIds: [],
    selectedBandId: null,
    dataSources: {},
    clipboard: [],
  });
}

function addTextComp(id: string) {
  const state = useDesignerStore.getState();
  const comp: ReportComponent = {
    id,
    type: 'text',
    x: 10, y: 10, width: 40, height: 15,
    text: 'Test',
    font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000' },
    textAlign: 'left',
    verticalAlign: 'middle',
    border: { style: 'none', width: 0, color: '#000', sides: { top: false, right: false, bottom: false, left: false } },
    canGrow: false, canShrink: false,
  } as ReportComponent;
  useDesignerStore.getState().addComponent('page_test', 'band_data', comp);
}

describe('Task E: 工具栏功能连接', () => {
  describe('Font operations', () => {
    it('should toggle bold', () => {
      resetStore();
      addTextComp('test_bold');
      useDesignerStore.getState().selectComponents(['test_bold']);

      useDesignerStore.getState().setFontBold(true);
      let font = useDesignerStore.getState().getSelectedFont();
      expect(font?.bold).toBe(true);

      useDesignerStore.getState().setFontBold(false);
      font = useDesignerStore.getState().getSelectedFont();
      expect(font?.bold).toBe(false);
    });

    it('should set font size', () => {
      resetStore();
      addTextComp('test_size');
      useDesignerStore.getState().selectComponents(['test_size']);

      useDesignerStore.getState().setFontSize(18);
      const font = useDesignerStore.getState().getSelectedFont();
      expect(font?.size).toBe(18);
    });

    it('should set text alignment', () => {
      resetStore();
      addTextComp('test_align');
      useDesignerStore.getState().selectComponents(['test_align']);

      useDesignerStore.getState().setTextAlign('right');
      expect(useDesignerStore.getState().getSelectedTextAlign()).toBe('right');

      useDesignerStore.getState().setTextAlign('center');
      expect(useDesignerStore.getState().getSelectedTextAlign()).toBe('center');
    });

    it('should return null font when no selection', () => {
      resetStore();
      expect(useDesignerStore.getState().getSelectedFont()).toBe(null);
    });
  });

  describe('Copy/Paste operations', () => {
    it('should copy and paste component', () => {
      resetStore();
      addTextComp('test_copy');
      useDesignerStore.getState().selectComponents(['test_copy']);
      useDesignerStore.getState().copySelected();

      expect(useDesignerStore.getState().getClipboard()).toHaveLength(1);

      useDesignerStore.getState().pasteClipboard();
      const page = useDesignerStore.getState().template.pages[0];
      const allComps = page.bands.flatMap(b => b.components);
      expect(allComps).toHaveLength(2);
      expect(useDesignerStore.getState().selectedComponentIds).toHaveLength(1);
    });

    it('should return empty clipboard when nothing copied', () => {
      resetStore();
      expect(useDesignerStore.getState().getClipboard()).toHaveLength(0);
    });
  });

  describe('Delete operation', () => {
    it('should delete selected component', () => {
      resetStore();
      addTextComp('test_delete');
      useDesignerStore.getState().selectComponents(['test_delete']);
      useDesignerStore.getState().deleteSelected();

      const page = useDesignerStore.getState().template.pages[0];
      const allComps = page.bands.flatMap(b => b.components);
      expect(allComps).toHaveLength(0);
      expect(useDesignerStore.getState().selectedComponentIds).toHaveLength(0);
    });
  });

  describe('Border toggle', () => {
    it('should set border on all sides', () => {
      resetStore();
      addTextComp('test_border');
      useDesignerStore.getState().selectComponents(['test_border']);

      useDesignerStore.getState().setBorderAll(true);
      const page = useDesignerStore.getState().template.pages[0];
      const band = page.bands.find(b => b.id === 'band_data')!;
      const comp = band.components[0] as any;
      expect(comp.border.style).toBe('solid');
      expect(comp.border.sides.top).toBe(true);
      expect(comp.border.sides.right).toBe(true);
      expect(comp.border.sides.bottom).toBe(true);
      expect(comp.border.sides.left).toBe(true);
    });
  });

  describe('Page management', () => {
    it('should add a new page', () => {
      resetStore();
      useDesignerStore.getState().addPage();
      expect(useDesignerStore.getState().template.pages).toHaveLength(2);
    });

    it('should not delete last page', () => {
      resetStore();
      const id = useDesignerStore.getState().template.pages[0].id;
      useDesignerStore.getState().deletePage(id);
      expect(useDesignerStore.getState().template.pages).toHaveLength(1);
    });

    it('should delete non-last page', () => {
      resetStore();
      useDesignerStore.getState().addPage();
      const firstId = useDesignerStore.getState().template.pages[0].id;
      useDesignerStore.getState().deletePage(firstId);
      expect(useDesignerStore.getState().template.pages).toHaveLength(1);
    });
  });

  describe('Page settings', () => {
    it('should update page width and height', () => {
      resetStore();
      useDesignerStore.getState().setPageSettings('page_test', { width: 300, height: 400 });
      const page = useDesignerStore.getState().template.pages[0];
      expect(page.width).toBe(300);
      expect(page.height).toBe(400);
    });
  });
});
