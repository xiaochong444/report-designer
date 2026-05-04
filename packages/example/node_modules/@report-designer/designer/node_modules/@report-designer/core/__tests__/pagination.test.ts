import { describe, it, expect } from 'vitest';
import { paginate, paginatedPageHeight } from '../src/pagination';
import { createDefaultTemplate } from '../src/template-model/template';

describe('Pagination', () => {
  it('should paginate a static template', () => {
    const template = createDefaultTemplate();
    const pages = paginate(template, {});
    expect(pages.length).toBeGreaterThan(0);
    expect(pages[0].pageNumber).toBe(1);
  });

  it('should include page headers and footers on each page', () => {
    const template = createDefaultTemplate();
    const pages = paginate(template, {});
    for (const page of pages) {
      const hasHeader = page.bands.some(b => b.type === 'pageHeader');
      const hasFooter = page.bands.some(b => b.type === 'pageFooter');
      expect(hasHeader).toBe(true);
      expect(hasFooter).toBe(true);
    }
  });

  it('should paginate data bands across pages when content exceeds height', () => {
    const template = createDefaultTemplate();
    template.pages[0].height = 50; // Small page to force pagination
    template.pages[0].bands.find(b => b.type === 'pageHeader')!.height = 10;
    template.pages[0].bands.find(b => b.type === 'pageFooter')!.height = 10;
    const dataBand = template.pages[0].bands.find(b => b.type === 'data')!;
    dataBand.height = 10;
    dataBand.dataSource = 'items';

    const data = {
      items: Array.from({ length: 20 }, (_, i) => ({ name: `Item ${i}`, value: i * 10 })),
    };
    const pages = paginate(template, data);
    expect(pages.length).toBeGreaterThan(1);
  });

  it('should compute page height correctly', () => {
    const template = createDefaultTemplate();
    const pages = paginate(template, {});
    for (const page of pages) {
      const height = paginatedPageHeight(page);
      expect(height).toBeGreaterThan(0);
    }
  });
});
