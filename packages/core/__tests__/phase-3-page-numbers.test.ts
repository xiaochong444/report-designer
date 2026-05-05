import { describe, expect, it } from 'vitest';
import { renderReportV2 } from '../src';
import { band, makeTemplate } from './phase-2-helpers';
import { textComponent } from './render-v2-helpers';

describe('Phase 3 page numbers', () => {
  it('resolves page number expressions after pagination', () => {
    const footerText = textComponent({
      id: 'page-number',
      text: '{PageNumber}/{TotalPages}',
      width: 30,
      height: 6,
      canGrow: false,
    });
    const template = makeTemplate([
      band('data', 'data', { height: 20, dataBand: { dataSourceId: 'employees' } }),
      band('page-footer', 'pageFooter', { height: 10, components: [footerText] }),
    ]);
    template.pages[0].height = 70;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReportV2(template, {
      employees: Array.from({ length: 5 }, (_, index) => ({ Name: `N${index}` })),
    });

    const values = document.pages.map((page) => {
      const footer = page.items.find((item) => item.bandType === 'pageFooter')!;
      return footer.components.find((component) => component.id === 'page-number')?.content;
    });

    expect(values).toEqual(['1/3', '2/3', '3/3']);
  });
});
