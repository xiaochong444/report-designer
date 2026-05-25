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
});
