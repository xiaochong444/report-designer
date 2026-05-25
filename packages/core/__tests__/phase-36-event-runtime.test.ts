import { describe, expect, it } from 'vitest';
import { createEventLogCollector, runEventScript } from '../src/event-engine';
import type { EventContext } from '../src/event-engine';

describe('phase 36 event runtime diagnostics', () => {
  it('adds timestamps to normal and pushed event logs', () => {
    const eventLogs = createEventLogCollector({ ownerType: 'report', ownerId: 'report-1', eventName: 'beforeRender' });

    eventLogs.info('ready');
    eventLogs.push({
      level: 'warning',
      message: 'manual',
      ownerType: 'component',
      ownerId: 'text-1',
      eventName: 'beforePrint',
    });

    expect(eventLogs.entries[0]).toMatchObject({
      level: 'info',
      message: 'ready',
      timestamp: expect.any(String),
      ownerType: 'report',
      ownerId: 'report-1',
      eventName: 'beforeRender',
    });
    expect(Date.parse(eventLogs.entries[0].timestamp)).not.toBeNaN();
    expect(eventLogs.entries[1]).toMatchObject({
      timestamp: expect.any(String),
      ownerType: 'component',
      ownerId: 'text-1',
    });
  });

  it('records script error line, column, and stack excerpt', () => {
    const eventLogs = createEventLogCollector();
    const ctx: EventContext = {
      mode: 'preview',
      data: {},
      state: {},
      target: { ownerType: 'band', ownerId: 'detail-band', eventName: 'beforePrint' },
      log: eventLogs,
    };

    runEventScript({
      event: {
        enabled: true,
        script: [
          'ctx.log.info("start");',
          'const value = 1;',
          'throw new Error("line boom");',
        ].join('\n'),
      },
      ctx,
      target: ctx.target,
      eventLogs,
    });

    const error = eventLogs.entries.find(entry => entry.level === 'error');
    expect(error).toMatchObject({
      message: 'line boom',
      line: 3,
      column: expect.any(Number),
      stackExcerpt: expect.stringContaining('line boom'),
    });
  });
});
