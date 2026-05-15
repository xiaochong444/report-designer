import { describe, expect, it } from 'vitest';
import { sampleReports } from '../templates';
import { commonTextStyles, template } from '../templates/common';

describe('example sample paper defaults', () => {
  it('uses A4 paper for every bundled sample report', () => {
    for (const sample of sampleReports) {
      const firstPage = sample.template.pages[0];
      expect(firstPage?.width).toBe(210);
      expect(firstPage?.height).toBe(297);
      expect(firstPage?.orientation).toBe('portrait');
    }
  });

  it('clones the common text style seed for each generated template', () => {
    const originalLength = commonTextStyles.length;
    const first = template('seed-a', 'Seed A', []);
    const second = template('seed-b', 'Seed B', []);

    expect(first.styles).not.toBe(second.styles);
    expect(first.styles[0]).not.toBe(second.styles[0]);
    expect(first.styles[0]?.font).not.toBe(second.styles[0]?.font);

    first.styles.push({
      id: 'local-only',
      name: 'Local Only',
      category: 'text',
      font: { size: 11 },
    });

    expect(commonTextStyles).toHaveLength(originalLength);
    expect(second.styles).toHaveLength(originalLength);
  });

  it('bundles a common components sample with panel children and a local subreport key', () => {
    const sample = sampleReports.find(report => report.key === 'commonComponents');

    expect(sample?.label).toBe('Common Components');

    const components = sample?.template.pages.flatMap(page => page.bands.flatMap(band => band.components)) ?? [];
    const panel = components.find(component => component.type === 'panel') as any;
    const subreport = components.find(component => component.type === 'subreport') as any;

    expect(panel?.components?.map((component: any) => component.type)).toEqual(expect.arrayContaining([
      'text',
      'image',
      'line',
      'shape',
      'checkbox',
      'barcode',
      'richtext',
      'subreport',
    ]));
    expect(subreport?.templateUrl).toBe('common-components-detail');
    expect(sample?.subreports?.['common-components-detail']?.name).toBe('Common Components Detail');
  });
});
