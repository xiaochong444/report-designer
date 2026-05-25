import { renderReport } from '../src/pagination/paginate';
import { createDefaultTemplate } from '../src/template-model/template';

describe('phase 32 page appearance', () => {
  it('normalizes page watermark and page border defaults', () => {
    const template = createDefaultTemplate();

    expect(template.pages[0].watermark).toEqual({
      enabled: false,
      text: '',
      fontSize: 48,
      color: '#8c8c8c',
      opacity: 0.18,
      angle: -35,
      horizontalAlign: 'center',
      verticalAlign: 'middle',
      showBehind: true,
    });
    expect(template.pages[0].pageBorder).toEqual({
      enabled: false,
      style: 'solid',
      width: 0.2,
      color: '#000000',
      sides: { top: true, right: true, bottom: true, left: true },
      offset: 0,
    });
  });

  it('copies page appearance into render pages without changing pagination coordinates', () => {
    const template = createDefaultTemplate();
    template.pages[0].watermark = {
      enabled: true,
      text: 'Internal',
      fontFamily: 'SimSun',
      fontSize: 36,
      color: '#ff4d4f',
      opacity: 0.25,
      angle: -30,
      horizontalAlign: 'center',
      verticalAlign: 'middle',
      showBehind: true,
    };
    template.pages[0].pageBorder = {
      enabled: true,
      style: 'dashed',
      width: 0.4,
      color: '#1677ff',
      sides: { top: true, right: true, bottom: true, left: true },
      offset: 5,
    };

    const document = renderReport(template, {});

    expect(document.pages[0].watermark).toEqual(template.pages[0].watermark);
    expect(document.pages[0].pageBorder).toEqual(template.pages[0].pageBorder);
    expect(document.pages[0].items[0]?.x).toBe(template.pages[0].margins.left);
  });

  it('fills page appearance defaults for templates saved before page appearance existed', () => {
    const template = createDefaultTemplate();
    delete template.pages[0].watermark;
    delete template.pages[0].pageBorder;

    const document = renderReport(template, {});

    expect(document.pages[0].watermark).toEqual({
      enabled: false,
      text: '',
      fontSize: 48,
      color: '#8c8c8c',
      opacity: 0.18,
      angle: -35,
      horizontalAlign: 'center',
      verticalAlign: 'middle',
      showBehind: true,
    });
    expect(document.pages[0].pageBorder).toEqual({
      enabled: false,
      style: 'solid',
      width: 0.2,
      color: '#000000',
      sides: { top: true, right: true, bottom: true, left: true },
      offset: 0,
    });
  });

  it('copies page appearance objects for every rendered page', () => {
    const template = createDefaultTemplate();
    template.pages[0].watermark = {
      enabled: true,
      text: 'Draft',
      fontSize: 32,
      color: '#8c8c8c',
      opacity: 0.2,
      angle: -35,
      horizontalAlign: 'center',
      verticalAlign: 'middle',
      showBehind: true,
    };
    template.pages[0].pageBorder = {
      enabled: true,
      style: 'solid',
      width: 0.3,
      color: '#000000',
      sides: { top: true, right: false, bottom: true, left: false },
      offset: 2,
    };
    const dataBand = template.pages[0].bands.find(band => band.type === 'data')!;
    dataBand.dataBand = { dataSourceId: 'employees' };

    const document = renderReport(template, {
      employees: Array.from({ length: 40 }, (_, index) => ({ Name: `Employee ${index + 1}` })),
    });

    expect(document.pages.length).toBeGreaterThan(1);
    expect(document.pages[0].watermark).toEqual(document.pages[1].watermark);
    expect(document.pages[0].watermark).not.toBe(document.pages[1].watermark);
    expect(document.pages[0].pageBorder).toEqual(document.pages[1].pageBorder);
    expect(document.pages[0].pageBorder).not.toBe(document.pages[1].pageBorder);
    expect(document.pages[0].pageBorder?.sides).not.toBe(document.pages[1].pageBorder?.sides);
  });
});
