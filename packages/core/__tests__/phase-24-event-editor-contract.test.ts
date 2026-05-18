import { describe, expect, it } from 'vitest';
import {
  EVENT_SCRIPT_DTS,
  eventEditorContextTypeByEvent,
  eventEditorHelpers,
  getEventEditorContextType,
} from '../src/event-engine';

describe('phase 24 event editor contract', () => {
  it('exposes script DTS for the event editing context', () => {
    expect(EVENT_SCRIPT_DTS).toContain('declare const ctx: EventContext');
    expect(EVENT_SCRIPT_DTS).toContain('interface EventContext');
    expect(EVENT_SCRIPT_DTS).toContain('log: EventLogCollector');
    expect(EVENT_SCRIPT_DTS).toContain('setValue');
    expect(EVENT_SCRIPT_DTS).toContain('createText');
    expect(EVENT_SCRIPT_DTS).toContain('createImage');
    expect(EVENT_SCRIPT_DTS).toContain('createBarcode');
    expect(EVENT_SCRIPT_DTS).toContain('hide?: () => void');
    expect(EVENT_SCRIPT_DTS).toContain('setValue?: (value: unknown) => void');
    expect(EVENT_SCRIPT_DTS).toMatch(
      /interface ComponentGetValueEventContext extends ComponentEventContext \{[\s\S]*setValue\(value: unknown\): void;[\s\S]*\}/,
    );
  });

  it('returns context types for known event targets', () => {
    expect(getEventEditorContextType('report', 'beforePreview')).toBe('ReportEventContext');
    expect(getEventEditorContextType('band', 'beforeRow')).toBe('BandEventContext');
    expect(getEventEditorContextType('component', 'beforePrint')).toBe('ComponentEventContext');
    expect(getEventEditorContextType('component', 'getValue')).toBe('ComponentGetValueEventContext');
  });

  it('describes helpers in the editor order with snippets, descriptions, and DTS methods', () => {
    expect(eventEditorHelpers.map((helper) => helper.id)).toEqual([
      'ctx.log.info',
      'ctx.log.warning',
      'ctx.log.error',
      'ctx.hide',
      'ctx.cancel',
      'ctx.setValue',
      'ctx.bindText',
      'ctx.getComponent',
      'ctx.setComponentProperty',
      'ctx.createText',
      'ctx.createImage',
      'ctx.createBarcode',
    ]);

    for (const helper of eventEditorHelpers) {
      expect(helper.snippet).toContain('ctx.');
      expect(helper.descriptionKey).toMatch(/^events\.helper\./);

      const methodName = helper.id.replace(/^ctx\./, '').split('.').at(-1);
      expect(EVENT_SCRIPT_DTS).toContain(methodName);
    }
  });

  it('maps all current event names to editor context types', () => {
    expect(Object.keys(eventEditorContextTypeByEvent.report)).toEqual([
      'beforePreview',
      'beforePrint',
      'beforeRender',
      'afterRender',
      'beforeData',
      'afterData',
    ]);
    expect(Object.keys(eventEditorContextTypeByEvent.band)).toEqual([
      'beforePrint',
      'afterPrint',
      'beforeRow',
      'afterRow',
    ]);
    expect(Object.keys(eventEditorContextTypeByEvent.component)).toEqual([
      'getValue',
      'beforePrint',
      'afterPrint',
    ]);
  });

  it('provides snippets that run after default placeholder expansion', () => {
    const ctx = {
      log: {
        info() {},
        warning() {},
        error() {},
      },
      hide() {},
      cancel() {},
      setValue() {},
      bindText() {},
      getComponent() {},
      setComponentProperty() {},
      createText() {},
      createImage() {},
      createBarcode() {},
    };

    for (const helper of eventEditorHelpers) {
      const expanded = helper.snippet.replace(/\$\{\d+:([^}]+)\}/g, '$1');
      expect(() => new Function('ctx', expanded)(ctx), helper.id).not.toThrow();
    }
  });
});
