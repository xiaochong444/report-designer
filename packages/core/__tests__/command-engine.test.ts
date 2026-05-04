import { describe, it, expect } from 'vitest';
import { CommandDispatcher, CommandError } from '../src/command-engine';
import { createDefaultTemplate } from '../src/template-model/template';

describe('Command Dispatcher', () => {
  const makeDispatcher = () => new CommandDispatcher();
  const makeTemplate = () => createDefaultTemplate();

  it('should have registered commands', () => {
    const commands = CommandDispatcher.listCommands();
    expect(commands.length).toBeGreaterThan(0);
  });

  it('should allow whitelisted commands', () => {
    expect(CommandDispatcher.isAllowed('add-component')).toBe(true);
    expect(CommandDispatcher.isAllowed('update-component')).toBe(true);
  });

  it('should reject non-whitelisted commands', () => {
    const dispatcher = makeDispatcher();
    const template = makeTemplate();
    expect(() => dispatcher.execute(template, {
      type: 'malicious-command',
      payload: {},
      execute: () => template,
      undo: () => template,
    })).toThrow(CommandError);
  });

  it('should add a component to a band', () => {
    const dispatcher = makeDispatcher();
    let template = makeTemplate();
    const page = template.pages[0];
    const dataBand = page.bands.find(b => b.type === 'data')!;

    const component = {
      id: 'comp_text_1',
      type: 'text' as const,
      x: 10,
      y: 0,
      width: 50,
      height: 10,
      style: '',
      text: '{Name}',
      font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, color: '#000' },
      textAlign: 'left' as const,
      verticalAlign: 'top' as const,
      border: { style: 'none', width: 0, color: '#000', sides: { top: false, right: false, bottom: false, left: false } },
      canGrow: true,
      canShrink: false,
    };

    template = dispatcher.execute(template, {
      type: 'add-component',
      payload: { pageId: page.id, bandId: dataBand.id, component },
      execute: () => template,
      undo: () => template,
    });

    const updatedBand = template.pages[0].bands.find(b => b.id === dataBand.id)!;
    expect(updatedBand.components.length).toBe(1);
    expect(updatedBand.components[0].id).toBe('comp_text_1');
  });

  it('should undo component addition', () => {
    const dispatcher = makeDispatcher();
    let template = makeTemplate();
    const page = template.pages[0];
    const dataBand = page.bands.find(b => b.type === 'data')!;

    const component = {
      id: 'comp_undo_1',
      type: 'text' as const,
      x: 10,
      y: 0,
      width: 50,
      height: 10,
      style: '',
      text: '{Name}',
      font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, color: '#000' },
      textAlign: 'left' as const,
      verticalAlign: 'top' as const,
      border: { style: 'none', width: 0, color: '#000', sides: { top: false, right: false, bottom: false, left: false } },
      canGrow: true,
      canShrink: false,
    };

    template = dispatcher.execute(template, {
      type: 'add-component',
      payload: { pageId: page.id, bandId: dataBand.id, component },
      execute: () => template,
      undo: () => template,
    });

    template = dispatcher.undo(template)!;
    const updatedBand = template.pages[0].bands.find(b => b.id === dataBand.id)!;
    expect(updatedBand.components.length).toBe(0);
  });

  it('should redo after undo', () => {
    const dispatcher = makeDispatcher();
    let template = makeTemplate();
    const page = template.pages[0];
    const dataBand = page.bands.find(b => b.type === 'data')!;

    const component = {
      id: 'comp_redo_1',
      type: 'text' as const,
      x: 10,
      y: 0,
      width: 50,
      height: 10,
      style: '',
      text: '{Name}',
      font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, color: '#000' },
      textAlign: 'left' as const,
      verticalAlign: 'top' as const,
      border: { style: 'none', width: 0, color: '#000', sides: { top: false, right: false, bottom: false, left: false } },
      canGrow: true,
      canShrink: false,
    };

    template = dispatcher.execute(template, {
      type: 'add-component',
      payload: { pageId: page.id, bandId: dataBand.id, component },
      execute: () => template,
      undo: () => template,
    });

    template = dispatcher.undo(template)!;
    template = dispatcher.redo(template)!;
    const updatedBand = template.pages[0].bands.find(b => b.id === dataBand.id)!;
    expect(updatedBand.components.length).toBe(1);
  });

  it('should track canUndo/canRedo state', () => {
    const dispatcher = makeDispatcher();
    let template = makeTemplate();
    const page = template.pages[0];
    const dataBand = page.bands.find(b => b.type === 'data')!;

    expect(dispatcher.canUndo()).toBe(false);

    const component = {
      id: 'comp_state_1',
      type: 'text' as const,
      x: 10,
      y: 0,
      width: 50,
      height: 10,
      style: '',
      text: '{Name}',
      font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, color: '#000' },
      textAlign: 'left' as const,
      verticalAlign: 'top' as const,
      border: { style: 'none', width: 0, color: '#000', sides: { top: false, right: false, bottom: false, left: false } },
      canGrow: true,
      canShrink: false,
    };

    template = dispatcher.execute(template, {
      type: 'add-component',
      payload: { pageId: page.id, bandId: dataBand.id, component },
      execute: () => template,
      undo: () => template,
    });

    expect(dispatcher.canUndo()).toBe(true);
    expect(dispatcher.canRedo()).toBe(false);

    dispatcher.undo(template);
    expect(dispatcher.canUndo()).toBe(false);
    expect(dispatcher.canRedo()).toBe(true);
  });

  it('should clear redo stack on new command', () => {
    const dispatcher = makeDispatcher();
    let template = makeTemplate();
    const page = template.pages[0];
    const dataBand = page.bands.find(b => b.type === 'data')!;

    const makeComp = (id: string) => ({
      id,
      type: 'text' as const,
      x: 10,
      y: 0,
      width: 50,
      height: 10,
      style: '',
      text: '{Name}',
      font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, color: '#000' },
      textAlign: 'left' as const,
      verticalAlign: 'top' as const,
      border: { style: 'none', width: 0, color: '#000', sides: { top: false, right: false, bottom: false, left: false } },
      canGrow: true,
      canShrink: false,
    });

    template = dispatcher.execute(template, {
      type: 'add-component',
      payload: { pageId: page.id, bandId: dataBand.id, component: makeComp('a') },
      execute: () => template,
      undo: () => template,
    });

    // Undo
    dispatcher.undo(template);
    expect(dispatcher.canRedo()).toBe(true);

    // New command clears redo
    template = dispatcher.execute(template, {
      type: 'add-component',
      payload: { pageId: page.id, bandId: dataBand.id, component: makeComp('b') },
      execute: () => template,
      undo: () => template,
    });

    expect(dispatcher.canRedo()).toBe(false);
  });

  it('should update component properties', () => {
    const dispatcher = makeDispatcher();
    let template = makeTemplate();
    const page = template.pages[0];
    const dataBand = page.bands.find(b => b.type === 'data')!;

    const component = {
      id: 'comp_update_1',
      type: 'text' as const,
      x: 10,
      y: 0,
      width: 50,
      height: 10,
      style: '',
      text: '{Name}',
      font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, color: '#000' },
      textAlign: 'left' as const,
      verticalAlign: 'top' as const,
      border: { style: 'none', width: 0, color: '#000', sides: { top: false, right: false, bottom: false, left: false } },
      canGrow: true,
      canShrink: false,
    };

    template = dispatcher.execute(template, {
      type: 'add-component',
      payload: { pageId: page.id, bandId: dataBand.id, component },
      execute: () => template,
      undo: () => template,
    });

    template = dispatcher.execute(template, {
      type: 'update-component',
      payload: {
        pageId: page.id,
        bandId: dataBand.id,
        componentId: 'comp_update_1',
        updates: { x: 20, text: '{FullName}' },
        previous: { x: 10, text: '{Name}' },
      },
      execute: () => template,
      undo: () => template,
    });

    const comp = template.pages[0].bands.find(b => b.id === dataBand.id)!.components[0];
    expect(comp.x).toBe(20);
    expect((comp as any).text).toBe('{FullName}');

    // Undo
    template = dispatcher.undo(template)!;
    const comp2 = template.pages[0].bands.find(b => b.id === dataBand.id)!.components[0];
    expect(comp2.x).toBe(10);
    expect((comp2 as any).text).toBe('{Name}');
  });
});
