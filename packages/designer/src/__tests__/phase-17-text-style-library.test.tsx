/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import type { ReportStyle, TextComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { useDesignerStore } from '../store/designer-store';

function createText(id: string, overrides: Partial<TextComponent> = {}): TextComponent {
  return {
    id,
    type: 'text',
    x: 10,
    y: 10,
    width: 40,
    height: 10,
    text: 'Sample',
    font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
    textAlign: 'left',
    verticalAlign: 'top',
    border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    backgroundColor: 'transparent',
    canGrow: false,
    canShrink: false,
    ...overrides,
  };
}

function loadTemplate(styles?: ReportStyle[], components: TextComponent[] = []) {
  const template = createDefaultTemplate('Phase 17 Text Styles');
  if (styles) {
    template.styles = styles;
  }
  const dataBand = template.pages[0].bands.find(band => band.type === 'data');
  if (!dataBand) {
    throw new Error('Missing data band');
  }
  dataBand.components = components;
  const store = useDesignerStore.getState();
  store.loadTemplate(template);
  return { template, pageId: template.pages[0].id, bandId: dataBand.id };
}

function selectedText(id = 'text-1') {
  const state = useDesignerStore.getState();
  const page = state.template.pages[0];
  return page.bands.flatMap(band => band.components).find(component => component.id === id) as TextComponent | undefined;
}

describe('Phase 17 text style library store behavior', () => {
  beforeEach(() => {
    const store = useDesignerStore.getState();
    store.loadTemplate(createDefaultTemplate('Phase 17 Reset'));
    store.selectComponents([]);
    store.selectBand(null);
  });

  it('copies selected style values into text components and records style bindings', () => {
    const style: ReportStyle = {
      id: 'style-a',
      name: 'Style A',
      category: 'text',
      font: { family: 'Calibri', size: 14, bold: true, italic: true, underline: false, strikethrough: false, color: '#224466' },
      backgroundColor: '#ffeecc',
      textAlign: 'center',
      verticalAlign: 'middle',
      border: { style: 'solid', width: 0.4, color: '#112233', sides: { top: true, right: true, bottom: false, left: false } },
      padding: { top: 1, right: 2, bottom: 3, left: 4 },
      format: { type: 'number', pattern: '#,##0.00', nullValue: '-', trueText: 'Y', falseText: 'N' },
      canGrow: true,
      canShrink: true,
    };
    loadTemplate([style], [createText('text-1')]);
    useDesignerStore.getState().selectComponents(['text-1']);

    useDesignerStore.getState().applySelectedStyle('style-a');

    expect(selectedText()).toMatchObject({
      style: 'style-a',
      backgroundColor: '#ffeecc',
      textAlign: 'center',
      verticalAlign: 'middle',
      canGrow: true,
      canShrink: true,
      format: { type: 'number', pattern: '#,##0.00', nullValue: '-', trueText: 'Y', falseText: 'N' },
      font: { family: 'Calibri', size: 14, bold: true, italic: true, color: '#224466' },
      border: { style: 'solid', width: 0.4, color: '#112233', sides: { top: true, right: true, bottom: false, left: false } },
      padding: { top: 1, right: 2, bottom: 3, left: 4 },
    });
    expect(selectedText()?.styleBindings).toEqual(expect.arrayContaining([
      'font.family',
      'font.size',
      'font.bold',
      'font.italic',
      'font.underline',
      'font.strikethrough',
      'font.color',
      'backgroundColor',
      'textAlign',
      'verticalAlign',
      'border.style',
      'border.width',
      'border.color',
      'border.sides.top',
      'border.sides.right',
      'padding.top',
      'padding.right',
      'padding.bottom',
      'padding.left',
      'format.type',
      'format.pattern',
      'format.nullValue',
      'format.trueText',
      'format.falseText',
      'canGrow',
      'canShrink',
    ]));
  });

  it('syncs only style-bound fields when a referenced text style changes', () => {
    const style: ReportStyle = {
      id: 'style-a',
      name: 'Style A',
      category: 'text',
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      backgroundColor: '#ffffff',
      textAlign: 'left',
      verticalAlign: 'top',
      border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
      canGrow: false,
      canShrink: false,
    };
    const component = createText('text-1', {
      style: 'style-a',
      styleBindings: ['font.size', 'font.bold', 'backgroundColor'],
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#00aa00' },
      backgroundColor: '#ffffff',
    });
    loadTemplate([style], [component]);

    useDesignerStore.getState().updateTextStyle('style-a', {
      font: { ...style.font, size: 18, bold: true, color: '#aa0000' },
      backgroundColor: '#eeeeee',
      textAlign: 'right',
    });

    expect(selectedText()).toMatchObject({
      style: 'style-a',
      font: { family: 'Arial', size: 18, bold: true, color: '#00aa00' },
      backgroundColor: '#eeeeee',
      textAlign: 'left',
    });
    expect(selectedText()?.styleBindings).toEqual(['font.size', 'font.bold', 'backgroundColor']);
  });

  it('drops bindings for manual text changes so later style sync keeps the manual overrides', () => {
    const style: ReportStyle = {
      id: 'style-a',
      name: 'Style A',
      category: 'text',
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      backgroundColor: '#ffffff',
      textAlign: 'center',
      verticalAlign: 'top',
      border: { style: 'solid', width: 0.2, color: '#111111', sides: { top: true, right: true, bottom: true, left: true } },
      canGrow: false,
      canShrink: false,
    };
    loadTemplate([style], [createText('text-1', {
      style: 'style-a',
      styleBindings: ['font.size', 'textAlign', 'border.style', 'border.width', 'border.sides.top', 'border.sides.right', 'border.sides.bottom', 'border.sides.left'],
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      textAlign: 'center',
      border: { style: 'solid', width: 0.2, color: '#111111', sides: { top: true, right: true, bottom: true, left: true } },
    })]);
    useDesignerStore.getState().selectComponents(['text-1']);

    useDesignerStore.getState().setFontSize(24);
    useDesignerStore.getState().setTextAlign('right');
    useDesignerStore.getState().setBorderAll(false);

    expect(selectedText()?.font.size).toBe(24);
    expect(selectedText()?.textAlign).toBe('right');
    expect(selectedText()?.border).toMatchObject({
      style: 'none',
      width: 0,
      sides: { top: false, right: false, bottom: false, left: false },
    });
    expect(selectedText()?.styleBindings).not.toEqual(expect.arrayContaining([
      'font.size',
      'textAlign',
      'border.style',
      'border.width',
      'border.sides.top',
      'border.sides.right',
      'border.sides.bottom',
      'border.sides.left',
    ]));

    useDesignerStore.getState().updateTextStyle('style-a', {
      ...style,
      font: { ...style.font, size: 9 },
      textAlign: 'left',
      border: { ...style.border, style: 'double', width: 0.6, sides: { top: true, right: false, bottom: true, left: false } },
    });

    expect(selectedText()?.font.size).toBe(24);
    expect(selectedText()?.textAlign).toBe('right');
    expect(selectedText()?.border).toMatchObject({
      style: 'none',
      width: 0,
      sides: { top: false, right: false, bottom: false, left: false },
    });
  });

  it('manages text style CRUD, default style selection, usage counts, and delete cleanup', () => {
    const baseStyle: ReportStyle = {
      id: 'style-base',
      name: 'Base',
      category: 'text',
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      backgroundColor: 'transparent',
      textAlign: 'left',
      verticalAlign: 'top',
      border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
      canGrow: false,
      canShrink: false,
    };
    loadTemplate([baseStyle], [createText('text-1', { style: 'style-base', styleBindings: ['font.family'] })]);

    const store = useDesignerStore.getState();
    const createdId = store.createTextStyle({ name: 'Created' });
    const duplicateId = store.duplicateTextStyle('style-base');

    store.renameTextStyle(createdId, 'Created Renamed');
    store.setDefaultTextStyle(createdId);

    expect(store.getTextStyleUsageCount('style-base')).toBe(1);
    expect(store.getTextStyleUsageCount(createdId)).toBe(0);
    expect(useDesignerStore.getState().template.styles.find(style => style.id === createdId)?.name).toBe('Created Renamed');
    expect(useDesignerStore.getState().template.styles.find(style => style.id === createdId)?.isDefault).toBe(true);
    expect(useDesignerStore.getState().template.styles.find(style => style.id === 'style-base')?.isDefault).toBe(false);
    expect(useDesignerStore.getState().template.styles.find(style => style.id === duplicateId)?.name).toContain('Base');

    store.deleteTextStyle('style-base');

    expect(useDesignerStore.getState().template.styles.some(style => style.id === 'style-base')).toBe(false);
    expect(selectedText()?.style).toBeUndefined();
    expect(selectedText()?.styleBindings).toBeUndefined();
  });

  it('applies the default text style when adding a new text component', () => {
    const defaultStyle: ReportStyle = {
      id: 'style-default',
      name: 'Default Style',
      category: 'text',
      isDefault: true,
      font: { family: 'Tahoma', size: 11, bold: true, italic: false, underline: false, strikethrough: false, color: '#123456' },
      backgroundColor: '#f0f0f0',
      textAlign: 'center',
      verticalAlign: 'middle',
      border: { style: 'solid', width: 0.2, color: '#654321', sides: { top: true, right: true, bottom: true, left: true } },
      padding: { top: 1, right: 1, bottom: 1, left: 1 },
      canGrow: true,
      canShrink: false,
    };
    const { pageId, bandId } = loadTemplate([defaultStyle], []);

    useDesignerStore.getState().addComponent(pageId, bandId, createText('text-new', {
      font: { family: 'Arial', size: 8, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      textAlign: 'left',
      verticalAlign: 'top',
      backgroundColor: 'transparent',
    }));

    expect(selectedText('text-new')).toMatchObject({
      style: 'style-default',
      font: { family: 'Tahoma', size: 11, bold: true, color: '#123456' },
      backgroundColor: '#f0f0f0',
      textAlign: 'center',
      verticalAlign: 'middle',
      border: { style: 'solid', width: 0.2, color: '#654321', sides: { top: true, right: true, bottom: true, left: true } },
      padding: { top: 1, right: 1, bottom: 1, left: 1 },
      canGrow: true,
      canShrink: false,
    });
    expect(selectedText('text-new')?.styleBindings).toEqual(expect.arrayContaining([
      'font.family',
      'backgroundColor',
      'textAlign',
      'verticalAlign',
      'border.sides.left',
      'padding.left',
      'canGrow',
      'canShrink',
    ]));
  });
});
