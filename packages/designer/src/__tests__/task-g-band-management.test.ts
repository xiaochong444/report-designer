import { describe, it, expect } from 'vitest';
import { useDesignerStore } from '../../src/store/designer-store';

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

describe('Task G: Band管理 + 页面设置', () => {
  describe('Band management', () => {
    it('should add a new band', () => {
      resetStore();
      useDesignerStore.getState().addBand('page_test', {
        type: 'reportTitle', height: 40, components: [],
      });
      const page = useDesignerStore.getState().template.pages[0];
      expect(page.bands).toHaveLength(4);
      expect(page.bands.some(b => b.type === 'reportTitle')).toBe(true);
    });

    it('should delete a band', () => {
      resetStore();
      useDesignerStore.getState().deleteBand('page_test', 'band_ph');
      const page = useDesignerStore.getState().template.pages[0];
      expect(page.bands).toHaveLength(2);
      expect(page.bands.some(b => b.id === 'band_ph')).toBe(false);
    });

    it('should move a band up', () => {
      resetStore();
      const page = useDesignerStore.getState().template.pages[0];
      const bands = [...page.bands];
      const idx = bands.findIndex(b => b.id === 'band_data');
      [bands[idx], bands[idx - 1]] = [bands[idx - 1], bands[idx]];
      useDesignerStore.getState().setPageSettings('page_test', { bands });
      const newPage = useDesignerStore.getState().template.pages[0];
      expect(newPage.bands[0].id).toBe('band_data');
      expect(newPage.bands[1].id).toBe('band_ph');
    });

    it('should move a band down', () => {
      resetStore();
      const page = useDesignerStore.getState().template.pages[0];
      const bands = [...page.bands];
      const idx = bands.findIndex(b => b.id === 'band_data');
      [bands[idx], bands[idx + 1]] = [bands[idx + 1], bands[idx]];
      useDesignerStore.getState().setPageSettings('page_test', { bands });
      const newPage = useDesignerStore.getState().template.pages[0];
      expect(newPage.bands[1].id).toBe('band_pf');
      expect(newPage.bands[2].id).toBe('band_data');
    });

    it('should resize a band', () => {
      resetStore();
      const page = useDesignerStore.getState().template.pages[0];
      const bands = page.bands.map(b =>
        b.id === 'band_data' ? { ...b, height: 100 } : b
      );
      useDesignerStore.getState().setPageSettings('page_test', { bands });
      const newPage = useDesignerStore.getState().template.pages[0];
      const dataBand = newPage.bands.find(b => b.id === 'band_data')!;
      expect(dataBand.height).toBe(100);
    });
  });

  describe('Page settings', () => {
    it('should update page orientation (swap dimensions)', () => {
      resetStore();
      useDesignerStore.getState().setPageSettings('page_test', {
        width: 297, height: 210, orientation: 'landscape',
      });
      const page = useDesignerStore.getState().template.pages[0];
      expect(page.width).toBe(297);
      expect(page.height).toBe(210);
      expect(page.orientation).toBe('landscape');
    });

    it('should update page margins', () => {
      resetStore();
      useDesignerStore.getState().setPageSettings('page_test', {
        margins: { top: 20, right: 15, bottom: 25, left: 10 },
      });
      const page = useDesignerStore.getState().template.pages[0];
      expect(page.margins.top).toBe(20);
      expect(page.margins.right).toBe(15);
      expect(page.margins.bottom).toBe(25);
      expect(page.margins.left).toBe(10);
    });

    it('should add and switch to a new page', () => {
      resetStore();
      useDesignerStore.getState().addPage();
      expect(useDesignerStore.getState().template.pages).toHaveLength(2);
      expect(useDesignerStore.getState().currentPageId).toMatch(/^page_/);
    });

    it('should not delete the only page', () => {
      resetStore();
      const onlyId = useDesignerStore.getState().template.pages[0].id;
      useDesignerStore.getState().deletePage(onlyId);
      expect(useDesignerStore.getState().template.pages).toHaveLength(1);
    });

    it('should delete a non-last page and keep others', () => {
      resetStore();
      useDesignerStore.getState().addPage();
      const firstId = useDesignerStore.getState().template.pages[0].id;
      useDesignerStore.getState().deletePage(firstId);
      expect(useDesignerStore.getState().template.pages).toHaveLength(1);
    });
  });
});
