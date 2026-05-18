import { describe, expect, it } from 'vitest';
import {
  createEventLogCollector,
  createEventRuntimeState,
  runEventScript,
  validateEventScript,
} from '../src/event-engine';
import type { EventContext } from '../src/event-engine';

describe('phase 23 event engine', () => {
  it('runs enabled scripts only through ctx and records logs', () => {
    const eventLogs = createEventLogCollector();
    const ctx: EventContext = {
      mode: 'preview',
      data: { total: 1 },
      state: {},
      target: {
        ownerType: 'component',
        ownerId: 'text1',
        eventName: 'getValue',
      },
      log: eventLogs,
    };

    runEventScript({
      event: { enabled: true, script: "ctx.state.total = ctx.data.total + 1; ctx.log.info('updated');" },
      ctx,
      target: ctx.target,
      eventLogs,
    });

    expect(ctx.state.total).toBe(2);
    expect(eventLogs.entries).toEqual([
      expect.objectContaining({
        level: 'info',
        message: 'updated',
        ownerType: 'component',
        ownerId: 'text1',
        eventName: 'getValue',
      }),
    ]);
  });

  it('does not run disabled scripts', () => {
    const eventLogs = createEventLogCollector();
    const ctx: EventContext = {
      mode: 'preview',
      data: {},
      state: { touched: false },
      target: {
        ownerType: 'report',
        ownerId: 'report1',
        eventName: 'beforePreview',
      },
      log: eventLogs,
    };

    runEventScript({
      event: { enabled: false, script: 'ctx.state.touched = true;' },
      ctx,
      target: ctx.target,
      eventLogs,
    });

    expect(ctx.state.touched).toBe(false);
    expect(eventLogs.entries).toHaveLength(0);
  });

  it('rejects blocked tokens during validation', () => {
    const result = validateEventScript('fetch("/api")');

    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('fetch');
  });

  it('captures thrown errors into event logs without throwing', () => {
    const eventLogs = createEventLogCollector();
    const ctx: EventContext = {
      mode: 'print',
      data: {},
      state: {},
      target: {
        ownerType: 'band',
        ownerId: 'detail',
        eventName: 'beforePrint',
      },
      log: eventLogs,
    };

    expect(() =>
      runEventScript({
        event: { enabled: true, script: "throw new Error('boom');" },
        ctx,
        target: ctx.target,
        eventLogs,
      }),
    ).not.toThrow();

    expect(eventLogs.entries).toEqual([
      expect.objectContaining({
        level: 'error',
        message: expect.stringContaining('boom'),
        ownerType: 'band',
        ownerId: 'detail',
        eventName: 'beforePrint',
      }),
    ]);
  });

  it('records an error after max event count is exceeded', () => {
    const eventLogs = createEventLogCollector();
    const runtimeState = createEventRuntimeState({ maxEventCount: 1 });
    const ctx: EventContext = {
      mode: 'preview',
      data: {},
      state: { count: 0 },
      target: {
        ownerType: 'report',
        ownerId: 'report1',
        eventName: 'beforeRender',
      },
      log: eventLogs,
      runtime: runtimeState,
    };

    runEventScript({
      event: { enabled: true, script: 'ctx.state.count += 1;' },
      ctx,
      target: ctx.target,
      eventLogs,
      runtimeState,
    });
    runEventScript({
      event: { enabled: true, script: 'ctx.state.count += 1;' },
      ctx,
      target: ctx.target,
      eventLogs,
      runtimeState,
    });

    expect(ctx.state.count).toBe(1);
    expect(eventLogs.entries).toEqual([
      expect.objectContaining({
        level: 'error',
        message: expect.stringContaining('maxEventCount'),
      }),
    ]);
  });
});
