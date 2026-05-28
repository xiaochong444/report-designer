/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ReportStyle, TextComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { Designer } from '../components/Designer';
import { PropertyEditor } from '../components/PropertyEditor';
import { DesignerRibbon } from '../components/ribbon/DesignerRibbon';
import { DesignerI18nProvider } from '../i18n';
import type { DesignerLocale } from '../i18n';
import { useDesignerStore } from '../store/designer-store';
import { Modal } from 'antd';
import { TEXT_STYLE_BINDING_PATHS } from '../text-style-bindings';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })),
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

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

async function renderDesignerWithSelection(template: ReturnType<typeof createDefaultTemplate>, componentId?: string, locale: DesignerLocale = 'en-US') {
  render(<Designer template={template} locale={locale} />);
  await waitFor(() => expect(useDesignerStore.getState().template.id).toBe(template.id));
  await act(async () => {
    useDesignerStore.getState().selectComponents(componentId ? [componentId] : []);
  });
}

function expectAntdControlDisabled(element: HTMLElement) {
  const disabledContainer = element.closest('.ant-select-disabled, .ant-input-number-disabled, .ant-picker-disabled, .ant-color-picker-trigger-disabled');
  if (disabledContainer) {
    expect(disabledContainer).toBeTruthy();
    return;
  }

  if ('disabled' in element) {
    expect(element).toBeDisabled();
    return;
  }

  expect(element).toHaveAttribute('aria-disabled', 'true');
}

async function findTextStyleLibraryDialog() {
  const title = await screen.findByText(/Text Style Library|文本样式库/);
  const dialog = title.closest('.ant-modal') as HTMLElement | null;
  if (!dialog) {
    throw new Error('Unable to locate Text Style Library modal container');
  }
  return dialog;
}

async function openTextStyleLibraryFromManage() {
  const styleSelect = await screen.findByLabelText(/Text style|文本样式/);
  const compact = styleSelect.closest('.ant-space-compact') as HTMLElement | null;
  if (!compact) {
    throw new Error('Unable to locate text style property editor controls');
  }
  fireEvent.click(within(compact).getByRole('button', { name: /Manage|管\s*理/ }));
  return await findTextStyleLibraryDialog();
}

async function openTextStyleLibraryFromRibbon() {
  fireEvent.click(await screen.findByText('Style Designer'));
  return await findTextStyleLibraryDialog();
}

async function openSelect(label: string, scope: HTMLElement | Document = document) {
  const target = within(scope as HTMLElement).getByLabelText(label);
  const trigger = (
    target.closest('.ant-select-selector')
    ?? target.closest('.ant-select')?.querySelector('.ant-select-selector')
    ?? target.closest('[data-format-select]')?.querySelector('.ant-select-selector')
    ?? target.querySelector?.('.ant-select-selector')
    ?? target.parentElement?.querySelector('.ant-select-selector')
  ) as HTMLElement | null;
  if (!trigger) {
    throw new Error(`Unable to find select trigger for ${label}`);
  }
  fireEvent.mouseDown(trigger);
}

async function chooseSelectOption(label: string, optionText: string, scope: HTMLElement | Document = document) {
  await openSelect(label, scope);
  const option = await screen.findByText(optionText);
  fireEvent.click(option);
}

describe('Phase 17 text style library store behavior', () => {
  beforeEach(() => {
    const store = useDesignerStore.getState();
    store.loadTemplate(createDefaultTemplate('Phase 17 Reset'));
    store.selectComponents([]);
    store.selectBand(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
      'format.decimalDigits',
      'format.decimalSeparator',
      'format.useGroupSeparator',
      'format.groupSeparator',
      'format.useAbbreviation',
      'format.positivePattern',
      'format.currencySymbol',
      'format.currencySymbolPosition',
      'format.percentSymbol',
      'format.trueValues',
      'format.dateFormat',
      'format.textTransform',
      'format.nullValue',
      'format.trueText',
      'format.falseText',
      'canGrow',
      'canShrink',
    ]));
  });

  it('shows structured format controls in the property panel and only exposes pattern for custom formats', async () => {
    const { pageId, bandId } = loadTemplate(undefined, [createText('text-1')]);
    useDesignerStore.getState().selectComponents(['text-1']);
    render(<PropertyEditor />);

    await act(async () => {
      useDesignerStore.getState().updateComponent(pageId, bandId, 'text-1', {
        format: { type: 'number', decimalDigits: 2, useGroupSeparator: true },
      });
    });
    expect(screen.getByLabelText('小数位数')).toBeInTheDocument();
    expect(screen.getByLabelText('小数分隔符')).toBeInTheDocument();
    expect(screen.getByLabelText('使用分组分隔符')).toBeInTheDocument();
    expect(screen.getByLabelText('分组分隔符')).toBeInTheDocument();
    expect(screen.getByLabelText('数字缩写')).toBeInTheDocument();
    expect(screen.getByLabelText('正数格式')).toBeInTheDocument();
    expect(screen.getByText('预览')).toBeInTheDocument();
    expect(screen.getByTestId('format-editor-preview')).toBeInTheDocument();
    expect(screen.getByTestId('format-editor-settings')).toBeInTheDocument();
    expect(screen.getByTestId('property-format-editor-full-width')).toBeInTheDocument();
    expect(screen.getAllByTestId('format-switch-control')[0]).toHaveStyle({ justifySelf: 'start' });
    expect(screen.queryByLabelText('格式模式')).not.toBeInTheDocument();

    await act(async () => {
      useDesignerStore.getState().updateComponent(pageId, bandId, 'text-1', {
        format: { type: 'custom', pattern: '#,##0.00' },
      });
    });
    expect(screen.getByLabelText('格式模式')).toBeInTheDocument();
  });

  it('localizes the component property panel to English', () => {
    loadTemplate(undefined, [createText('text-1')]);
    useDesignerStore.getState().selectComponents(['text-1']);

    render(
      <DesignerI18nProvider locale="en-US">
        <PropertyEditor />
      </DesignerI18nProvider>,
    );

    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Position and Size')).toBeInTheDocument();
    expect(screen.getByText('Text Content')).toBeInTheDocument();
    expect(screen.getByText('Font')).toBeInTheDocument();
    expect(screen.getByText('Border')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Text content')).toBeInTheDocument();
    expect(screen.getByLabelText('Text style')).toBeInTheDocument();
    expect(screen.queryByText('Data Binding')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Bound field')).not.toBeInTheDocument();
    expect(screen.queryByText('基本信息')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('名称')).not.toBeInTheDocument();
  });

  it('uses the same structured format controls in the style library', async () => {
    const style: ReportStyle = {
      id: 'style-format',
      name: 'Format Style',
      category: 'text',
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      backgroundColor: 'transparent',
      border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      format: { type: 'currency', currencySymbol: '¥', decimalDigits: 0 } as any,
    };
    const { template } = loadTemplate([style], [createText('text-1')]);
    await renderDesignerWithSelection(template, 'text-1', 'zh-CN');

    const dialog = await openTextStyleLibraryFromManage();
    expect(within(dialog).getAllByText('预览').length).toBeGreaterThan(0);
    expect(within(dialog).getByTestId('format-editor-settings')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('货币符号')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('小数位数')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('小数分隔符')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('正数格式')).toBeInTheDocument();
    expect(within(dialog).queryByLabelText('样式格式模式')).not.toBeInTheDocument();
  });

  it('syncs all available style fields when a referenced text style changes', () => {
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
      font: { family: 'Arial', size: 18, bold: true, color: '#aa0000' },
      backgroundColor: '#eeeeee',
      textAlign: 'right',
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
      'border.sides.bottom',
      'border.sides.left',
      'canGrow',
      'canShrink',
    ]));
  });

  it('keeps style-bound component properties locked against manual updates', () => {
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

    expect(selectedText()?.font.size).toBe(10);
    expect(selectedText()?.textAlign).toBe('center');
    expect(selectedText()?.border).toMatchObject({
      style: 'solid',
      width: 0.2,
      sides: { top: true, right: true, bottom: true, left: true },
    });
    expect(selectedText()?.styleBindings).toEqual(expect.arrayContaining([
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

    expect(selectedText()?.font.size).toBe(9);
    expect(selectedText()?.textAlign).toBe('left');
    expect(selectedText()?.border).toMatchObject({
      style: 'double',
      width: 0.6,
      sides: { top: true, right: false, bottom: true, left: false },
    });
  });

  it('edits historical styles that do not have border metadata', () => {
    const historicalStyle = {
      id: 'historical-style',
      name: 'Historical Style',
      category: 'text',
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
    } as ReportStyle;
    loadTemplate([historicalStyle], [createText('text-1', {
      style: 'historical-style',
      styleBindings: ['font.size'],
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
    })]);

    expect(() => {
      useDesignerStore.getState().updateTextStyle('historical-style', {
        font: { ...historicalStyle.font, size: 22 },
      });
    }).not.toThrow();
    expect(useDesignerStore.getState().template.styles.find(style => style.id === 'historical-style')?.font.size).toBe(22);
    expect(selectedText()?.font.size).toBe(22);
  });

  it('applies historical styles that do not have border metadata', () => {
    const historicalStyle = {
      id: 'historical-style',
      name: 'Historical Style',
      category: 'text',
      font: { family: 'Arial', size: 18, bold: true, italic: false, underline: false, strikethrough: false, color: '#123456' },
      textAlign: 'center',
    } as ReportStyle;
    loadTemplate([historicalStyle], [createText('text-1')]);
    useDesignerStore.getState().selectComponents(['text-1']);

    expect(() => {
      useDesignerStore.getState().applySelectedStyle('historical-style');
    }).not.toThrow();
    expect(selectedText()).toMatchObject({
      style: 'historical-style',
      font: { size: 18, bold: true, color: '#123456' },
      textAlign: 'center',
    });
  });

  it('locks every style-managed text property after selecting a style with missing optional metadata', () => {
    const historicalStyle = {
      id: 'minimal-style',
      name: 'Minimal Style',
      category: 'text',
      font: { family: 'Arial', size: 18, bold: true, italic: false, underline: false, strikethrough: false, color: '#123456' },
      textAlign: 'center',
    } as ReportStyle;
    loadTemplate([historicalStyle], [createText('text-1')]);
    useDesignerStore.getState().selectComponents(['text-1']);

    useDesignerStore.getState().applySelectedStyle('minimal-style');

    expect(selectedText()?.styleBindings).toEqual(TEXT_STYLE_BINDING_PATHS);
    expect(selectedText()).toMatchObject({
      style: 'minimal-style',
      textAlign: 'center',
      verticalAlign: 'top',
      backgroundColor: 'transparent',
      canGrow: false,
      canShrink: false,
      border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      format: { type: 'none', pattern: '', nullValue: '', trueText: '', falseText: '' },
    });

    useDesignerStore.getState().updateComponent(
      useDesignerStore.getState().template.pages[0].id,
      useDesignerStore.getState().template.pages[0].bands.find(band => band.type === 'data')!.id,
      'text-1',
      {
        textAlign: 'right',
        verticalAlign: 'bottom',
        padding: { top: 9, right: 9, bottom: 9, left: 9 },
        border: { style: 'solid', width: 1, color: '#ff0000', sides: { top: true, right: true, bottom: true, left: true } },
        format: { type: 'number', pattern: '#,##0.00', nullValue: '-', trueText: 'Y', falseText: 'N' },
      },
    );

    expect(selectedText()).toMatchObject({
      textAlign: 'center',
      verticalAlign: 'top',
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
      format: { type: 'none', pattern: '', nullValue: '', trueText: '', falseText: '' },
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

  it('opens the Style Designer dialog from the ribbon Home tab', async () => {
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
    const template = createDefaultTemplate('Style Designer Ribbon');
    template.styles = [style];

    await renderDesignerWithSelection(template);

    const dialog = await openTextStyleLibraryFromRibbon();

    expect(dialog).toBeInTheDocument();
  });

  it('renders the text style library in Chinese by default', async () => {
    const template = createDefaultTemplate('Style Designer Chinese');

    render(<Designer template={template} />);

    fireEvent.click(await screen.findByText('样式设计器'));
    const dialog = await findTextStyleLibraryDialog();

    expect(within(dialog).getByText('文本样式库')).toBeInTheDocument();
    expect(within(dialog).queryByText('Text Style Library')).not.toBeInTheDocument();
  });

  it('renders the text style library in English when requested', async () => {
    const template = createDefaultTemplate('Style Designer English');

    render(<Designer template={template} locale="en-US" />);

    fireEvent.click(await screen.findByText('Style Designer'));
    const dialog = await findTextStyleLibraryDialog();

    expect(within(dialog).getByText('Text Style Library')).toBeInTheDocument();
    expect(within(dialog).queryByText('文本样式库')).not.toBeInTheDocument();
  });

  it('opens the same Style Designer dialog from the property panel Manage button', async () => {
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
    const template = createDefaultTemplate('Style Designer Property');
    template.styles = [style];
    template.pages[0].bands.find(band => band.type === 'data')!.components = [createText('text-1', { style: 'style-a' })];

    await renderDesignerWithSelection(template, 'text-1');

    const dialog = await openTextStyleLibraryFromManage();

    expect(dialog).toBeInTheDocument();
  });

  it('disables only the property fields that are controlled by style bindings', async () => {
    const style: ReportStyle = {
      id: 'style-a',
      name: 'Style A',
      category: 'text',
      font: { family: 'Arial', size: 10, bold: true, italic: false, underline: false, strikethrough: false, color: '#111111' },
      backgroundColor: '#f5f5f5',
      textAlign: 'center',
      verticalAlign: 'middle',
      border: { style: 'solid', width: 0.2, color: '#333333', sides: { top: true, right: true, bottom: true, left: true } },
      padding: { top: 1, right: 2, bottom: 3, left: 4 },
      format: { type: 'number', pattern: '#,##0.00' },
      canGrow: true,
      canShrink: false,
    };
    const template = createDefaultTemplate('Style Binding Disable');
    template.styles = [style];
    template.pages[0].bands.find(band => band.type === 'data')!.components = [createText('text-1', {
      style: 'style-a',
      format: style.format,
      styleBindings: [
        'format.type',
        'textAlign',
        'canGrow',
        'font.size',
        'border.width',
        'border.sides.top',
        'backgroundColor',
        'padding.top',
      ],
    })];

    await renderDesignerWithSelection(template, 'text-1');

    expectAntdControlDisabled(await screen.findByLabelText('Format Type'));
    expect(screen.queryByLabelText('Pattern')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Decimal digits')).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Align left' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Center horizontally' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Align right' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Align top' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Center vertically' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Align bottom' })).toBeEnabled();
    expect(screen.getByRole('switch', { name: 'Can grow' })).toBeDisabled();
    expect(screen.getByRole('switch', { name: 'Can shrink' })).toBeEnabled();
    expect(screen.getByLabelText('Font family')).not.toHaveAttribute('aria-disabled', 'true');
    expectAntdControlDisabled(screen.getByLabelText('Font size'));
    expect(screen.getByLabelText('Border style')).not.toHaveAttribute('aria-disabled', 'true');
    expectAntdControlDisabled(screen.getByLabelText('Border width'));
    expectAntdControlDisabled(screen.getByLabelText('Background color'));
    expectAntdControlDisabled(screen.getByLabelText('Padding top'));
    expect(screen.getByLabelText('Padding right')).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: 'Top' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Right' })).toBeEnabled();
  });

  it('disables every style-managed property control in the component property panel after selecting a style', async () => {
    const style: ReportStyle = {
      id: 'style-a',
      name: 'Style A',
      category: 'text',
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      textAlign: 'center',
    } as ReportStyle;
    const template = createDefaultTemplate('Style Binding Complete Disable');
    template.styles = [style];
    template.pages[0].bands.find(band => band.type === 'data')!.components = [createText('text-1')];

    await renderDesignerWithSelection(template, 'text-1');

    fireEvent.mouseDown(await screen.findByLabelText('Text style'));
    fireEvent.click(await screen.findByText('Style A'));

    await waitFor(() => expect(selectedText()?.styleBindings).toEqual(TEXT_STYLE_BINDING_PATHS));

    expect(screen.getByRole('button', { name: 'Align left' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Center horizontally' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Align right' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Align top' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Center vertically' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Align bottom' })).toBeDisabled();
    expectAntdControlDisabled(screen.getByLabelText('Padding top'));
    expectAntdControlDisabled(screen.getByLabelText('Padding right'));
    expectAntdControlDisabled(screen.getByLabelText('Padding bottom'));
    expectAntdControlDisabled(screen.getByLabelText('Padding left'));
    expectAntdControlDisabled(screen.getByLabelText('Border style'));
    expectAntdControlDisabled(screen.getByLabelText('Border width'));
    expectAntdControlDisabled(screen.getByLabelText('Border color'));
    expect(screen.getByRole('checkbox', { name: 'Top' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Right' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Bottom' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Left' })).toBeDisabled();
    expectAntdControlDisabled(screen.getByLabelText('Format Type'));
    expect(screen.getByRole('switch', { name: 'Can grow' })).toBeDisabled();
    expect(screen.getByRole('switch', { name: 'Can shrink' })).toBeDisabled();
    expectAntdControlDisabled(screen.getByLabelText('Font size'));
    expectAntdControlDisabled(screen.getByLabelText('Font family'));
    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Italic' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Underline' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Strike' })).toBeDisabled();
    expectAntdControlDisabled(screen.getByLabelText('Font color'));
    expectAntdControlDisabled(screen.getByLabelText('Background color'));
  });

  it('disables style-managed property controls in the standalone property panel', () => {
    const style: ReportStyle = {
      id: 'style-a',
      name: 'Style A',
      category: 'text',
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      textAlign: 'center',
    } as ReportStyle;
    loadTemplate([style], [createText('text-1')]);
    useDesignerStore.getState().selectComponents(['text-1']);
    useDesignerStore.getState().applySelectedStyle('style-a');

    render(<PropertyEditor />);

    expectAntdControlDisabled(screen.getByLabelText('字体系列'));
    expectAntdControlDisabled(screen.getByLabelText('字号'));
    expect(screen.getByRole('button', { name: '加粗' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '斜体' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '下划线' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '删除线' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '左对齐' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '水平居中' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '右对齐' })).toBeDisabled();
    expectAntdControlDisabled(screen.getByLabelText('边框样式'));
    expectAntdControlDisabled(screen.getByLabelText('内边距上'));
    expectAntdControlDisabled(screen.getByLabelText('格式类型'));
  });

  it('disables ribbon entries for style-managed text properties', () => {
    const style: ReportStyle = {
      id: 'style-a',
      name: 'Style A',
      category: 'text',
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
      textAlign: 'center',
    } as ReportStyle;
    loadTemplate([style], [createText('text-1')]);
    useDesignerStore.getState().selectComponents(['text-1']);
    useDesignerStore.getState().applySelectedStyle('style-a');

    render(
      <DesignerI18nProvider locale="en-US">
        <DesignerRibbon />
      </DesignerI18nProvider>,
    );

    expectAntdControlDisabled(screen.getByLabelText('Ribbon font size'));
    expect(screen.getByRole('button', { name: 'Ribbon bold' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Text Left' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Text Center' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Text Right' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Layout' }));
    expect(screen.getByRole('button', { name: 'All borders' })).toBeDisabled();
  });

  it('updates referenced text components when a style is edited in the dialog', async () => {
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
    const template = createDefaultTemplate('Style Designer Sync');
    template.styles = [style];
    template.pages[0].bands.find(band => band.type === 'data')!.components = [createText('text-1', {
      style: 'style-a',
      styleBindings: ['font.size'],
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
    })];

    await renderDesignerWithSelection(template, 'text-1');

    const dialog = await openTextStyleLibraryFromRibbon();
    fireEvent.click(within(dialog).getByRole('button', { name: /Style A/ }));
    fireEvent.change(within(dialog).getByLabelText('样式字号'), { target: { value: '22' } });

    await waitFor(() => expect(selectedText()?.font.size).toBe(22));
  });

  it('shows icon-based controls for text style and vertical alignment in the visible property area', async () => {
    const style: ReportStyle = {
      id: 'style-a',
      name: 'Style A',
      category: 'text',
      font: { family: 'Arial', size: 10, bold: true, italic: true, underline: true, strikethrough: false, color: '#000000' },
      backgroundColor: '#ffffff',
      textAlign: 'center',
      verticalAlign: 'middle',
      border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
      canGrow: false,
      canShrink: false,
    };
    const template = createDefaultTemplate('Style Designer Visible Controls');
    template.styles = [style];

    await renderDesignerWithSelection(template);

    const dialog = await openTextStyleLibraryFromRibbon();

    expect(within(dialog).getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Italic' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Underline' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Vertical Top' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Vertical Middle' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Vertical Bottom' })).toBeInTheDocument();
  });

  it('constrains the right property pane and exposes an internal scroll region', async () => {
    const style: ReportStyle = {
      id: 'style-a',
      name: 'Style A',
      category: 'text',
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      backgroundColor: '#ffffff',
      textAlign: 'left',
      verticalAlign: 'top',
      border: { style: 'solid', width: 0.2, color: '#222222', sides: { top: true, right: true, bottom: true, left: true } },
      format: { type: 'number', pattern: '#,##0.00', nullValue: '-', trueText: 'Yes', falseText: 'No' },
      padding: { top: 2, right: 2, bottom: 2, left: 2 },
      canGrow: true,
      canShrink: true,
    };
    const template = createDefaultTemplate('Style Designer Scroll Pane');
    template.styles = [style];

    await renderDesignerWithSelection(template);

    const dialog = await openTextStyleLibraryFromRibbon();
    const shell = within(dialog).getByTestId('style-library-shell');
    const styleListScroll = within(dialog).getByTestId('style-library-style-list-scroll');
    const scrollPane = within(dialog).getByTestId('style-library-property-scroll');
    const propertySection = within(dialog).getByTestId('style-library-property-section');
    const generalPanel = within(dialog).getByText('General').closest('div')?.parentElement;

    expect(shell).toHaveStyle({ display: 'flex' });
    expect(shell.getAttribute('style')).toContain('height');
    expect(styleListScroll).toHaveStyle({ overflowY: 'auto' });
    expect(propertySection).toHaveStyle({ display: 'flex' });
    expect(propertySection).toHaveStyle({ overflow: 'hidden' });
    expect(scrollPane).toHaveStyle({ overflowY: 'scroll' });
    expect(scrollPane).toHaveStyle({ overflowX: 'hidden' });
    expect(scrollPane.getAttribute('style')).toContain('flex: 1 1 0px');
    expect(generalPanel).toHaveStyle({ flexShrink: '0' });
  });

  it('shows visible direction labels for padding inputs', async () => {
    const style: ReportStyle = {
      id: 'style-a',
      name: 'Style A',
      category: 'text',
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      backgroundColor: '#ffffff',
      textAlign: 'left',
      verticalAlign: 'top',
      border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
      padding: { top: 1, right: 2, bottom: 3, left: 4 },
      canGrow: false,
      canShrink: false,
    };
    const template = createDefaultTemplate('Style Designer Padding Labels');
    template.styles = [style];

    await renderDesignerWithSelection(template);

    const dialog = await openTextStyleLibraryFromRibbon();

    expect(within(dialog).getByLabelText('样式内边距上').closest('label')).toHaveTextContent('Top');
    expect(within(dialog).getByLabelText('样式内边距右').closest('label')).toHaveTextContent('Right');
    expect(within(dialog).getByLabelText('样式内边距下').closest('label')).toHaveTextContent('Bottom');
    expect(within(dialog).getByLabelText('样式内边距左').closest('label')).toHaveTextContent('Left');
  });

  it('creates a new style from the dialog even when search is filtering and allows inline renaming', async () => {
    const style: ReportStyle = {
      id: 'style-a',
      name: 'Header',
      category: 'text',
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      backgroundColor: '#ffffff',
      textAlign: 'left',
      verticalAlign: 'top',
      border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
      canGrow: false,
      canShrink: false,
    };
    const template = createDefaultTemplate('Style Designer Create');
    template.styles = [style];

    await renderDesignerWithSelection(template);

    const dialog = await openTextStyleLibraryFromRibbon();
    fireEvent.change(within(dialog).getByLabelText('样式搜索'), { target: { value: 'missing-style' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'New' }));

    await waitFor(() => expect(within(dialog).getByLabelText('样式名称')).toHaveValue('New Style'));
    expect(within(dialog).getAllByText('New Style').length).toBeGreaterThan(0);

    fireEvent.change(within(dialog).getByLabelText('样式名称'), { target: { value: 'Summary Text' } });
    fireEvent.blur(within(dialog).getByLabelText('样式名称'));

    await waitFor(() => {
      const currentStyles = useDesignerStore.getState().template.styles.map(item => item.name);
      expect(currentStyles).toContain('Summary Text');
    });
  });

  it('shows a delete confirmation and keeps the style when cancelled', async () => {
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
    const template = createDefaultTemplate('Style Designer Delete Confirm');
    template.styles = [style];
    template.pages[0].bands.find(band => band.type === 'data')!.components = [createText('text-1', {
      style: 'style-a',
      styleBindings: ['font.family'],
    })];

    let capturedConfig: Parameters<typeof Modal.confirm>[0] | undefined;
    vi.spyOn(Modal, 'confirm').mockImplementation((config) => {
      capturedConfig = config;
      return {
        destroy: () => {},
        update: () => {},
      };
    });

    await renderDesignerWithSelection(template, 'text-1');

    const dialog = await openTextStyleLibraryFromRibbon();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(Modal.confirm).toHaveBeenCalledTimes(1);
    const config = capturedConfig;
    expect(String(config?.title)).toContain('Delete');
    expect(String(config?.content)).toContain('clears the style reference');
    await act(async () => {
      await config?.onCancel?.();
    });

    expect(useDesignerStore.getState().template.styles.some(item => item.id === 'style-a')).toBe(true);
    expect(selectedText()?.style).toBe('style-a');

    await act(async () => {
      await config?.onOk?.();
    });

    expect(useDesignerStore.getState().template.styles.some(item => item.id === 'style-a')).toBe(false);
    expect(selectedText()?.style).toBeUndefined();
  });

  it('tracks the current visible selection when deleting a previously confirmed style', async () => {
    const styles: ReportStyle[] = [
      {
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
      },
      {
        id: 'style-b',
        name: 'Style B',
        category: 'text',
        font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
        backgroundColor: '#ffffff',
        textAlign: 'left',
        verticalAlign: 'top',
        border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
        canGrow: false,
        canShrink: false,
      },
      {
        id: 'style-c',
        name: 'Style C',
        category: 'text',
        font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
        backgroundColor: '#ffffff',
        textAlign: 'left',
        verticalAlign: 'top',
        border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
        canGrow: false,
        canShrink: false,
      },
    ];
    const template = createDefaultTemplate('Style Designer Delete Selection');
    template.styles = styles;

    let capturedConfig: Parameters<typeof Modal.confirm>[0] | undefined;
    vi.spyOn(Modal, 'confirm').mockImplementation((config) => {
      capturedConfig = config;
      return {
        destroy: () => {},
        update: () => {},
      };
    });

    await renderDesignerWithSelection(template);

    const dialog = await openTextStyleLibraryFromRibbon();
    fireEvent.click(within(dialog).getByRole('button', { name: /Style A/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    fireEvent.change(within(dialog).getByLabelText('样式搜索'), { target: { value: 'Style C' } });

    await waitFor(() => expect(within(dialog).getByLabelText('样式名称')).toHaveValue('Style C'));

    await act(async () => {
      await capturedConfig?.onOk?.();
    });

    expect(useDesignerStore.getState().template.styles.map(style => style.id)).toEqual(['style-b', 'style-c']);
    await waitFor(() => expect(within(dialog).getByLabelText('样式名称')).toHaveValue('Style C'));
  });

  it('edits extended format fields and border sides in the style dialog', async () => {
    const style: ReportStyle = {
      id: 'style-a',
      name: 'Style A',
      category: 'text',
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      backgroundColor: '#ffffff',
      textAlign: 'left',
      verticalAlign: 'top',
      border: { style: 'solid', width: 0.2, color: '#222222', sides: { top: true, right: false, bottom: false, left: false } },
      format: { type: 'number', pattern: '#,##0.00', nullValue: '-', trueText: 'Yes', falseText: 'No' },
      canGrow: false,
      canShrink: false,
    };
    const template = createDefaultTemplate('Style Designer Extended Fields');
    template.styles = [style];
    template.pages[0].bands.find(band => band.type === 'data')!.components = [createText('text-1', {
      style: 'style-a',
      styleBindings: ['format.nullValue', 'border.sides.right'],
      format: { type: style.format!.type, ...style.format },
      border: {
        style: style.border.style ?? 'none',
        width: style.border.width ?? 0,
        color: style.border.color ?? '#000000',
        sides: { top: false, right: false, bottom: false, left: false, ...(style.border.sides ?? {}) },
      },
    })];

    await renderDesignerWithSelection(template, 'text-1');

    const dialog = await openTextStyleLibraryFromManage();

    fireEvent.change(within(dialog).getByLabelText('Null text'), { target: { value: '(empty)' } });
    fireEvent.change(within(dialog).getByLabelText('Decimal digits'), { target: { value: '3' } });
    expect(within(dialog).getByLabelText('样式边框样式')).toBeInTheDocument();
    expect(within(dialog).getByText('Apply sides')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Border side preview')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Right' }));
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Bottom' }));

    await waitFor(() => {
      const updatedStyle = useDesignerStore.getState().template.styles.find(item => item.id === 'style-a');
      expect(updatedStyle?.format).toMatchObject({
        nullValue: '(empty)',
        decimalDigits: 3,
      });
      expect(updatedStyle?.border).toMatchObject({
        style: 'solid',
        sides: { top: true, right: true, bottom: true, left: false },
      });
    });

    expect(selectedText()?.format).toMatchObject({
      nullValue: '(empty)',
    });
    expect(selectedText()?.border.sides.right).toBe(true);
  });
});
