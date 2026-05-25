import { describe, expect, it } from 'vitest';
import { createDefaultTemplate } from '../src/template-model/template';
import { renderReport } from '../src/pagination/paginate';

describe('phase 37 page events', () => {
  it('runs page before and after print events with page context', () => {
    const template = createDefaultTemplate('Page Events');
    const page = template.pages[0];
    page.events = {
      beforePrint: { enabled: true, script: 'ctx.log.info("page before " + ctx.page.id);' },
      afterPrint: { enabled: true, script: 'ctx.log.info("page after " + ctx.page.id);' },
    };

    const document = renderReport(template, {}, { mode: 'preview' });

    expect(document.eventLogs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ownerType: 'page',
        ownerId: page.id,
        eventName: 'beforePrint',
        level: 'info',
        message: `page before ${page.id}`,
      }),
      expect.objectContaining({
        ownerType: 'page',
        ownerId: page.id,
        eventName: 'afterPrint',
        level: 'info',
        message: `page after ${page.id}`,
      }),
    ]));
  });
});
