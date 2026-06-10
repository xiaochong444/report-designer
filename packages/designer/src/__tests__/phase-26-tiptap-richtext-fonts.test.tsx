/* @vitest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import type { ReportFont, RichtextComponent, TextComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { Designer } from '../components/Designer';
import { PropertyEditor } from '../components/PropertyEditor';
import { DesignerPropertyPanel } from '../components/panels/DesignerPropertyPanel';
import { useDesignerStore } from '../store/designer-store';

const tiptapMock = vi.hoisted(() => ({
  lastEditor: undefined as any,
}));

vi.mock('@tiptap/react', async () => {
  const ReactModule = await import('react');

  const createEditor = (options: { content?: string; editorProps?: { attributes?: Record<string, string> }; onUpdate?: (payload: { editor: any }) => void }) => {
    const editor: any = {
      text: typeof options.content === 'string' ? options.content.replace(/<[^>]+>/g, '') : 'Old rich text',
      attributes: options.editorProps?.attributes ?? {},
      getHTML: vi.fn(() => `<p>${editor.text}</p><script>alert(1)</script>`),
      getJSON: vi.fn(() => ({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: editor.text }],
          },
        ],
      })),
      isActive: vi.fn(() => false),
      commands: {
        setContent: vi.fn((next: string) => {
          editor.text = next;
          options.onUpdate?.({ editor });
        }),
      },
      chain: vi.fn(() => editor.chainApi),
      can: vi.fn(() => editor.chainApi),
      chainApi: {
        focus: vi.fn(() => editor.chainApi),
        setFontFamily: vi.fn(() => editor.chainApi),
        setFontSize: vi.fn(() => editor.chainApi),
        setColor: vi.fn(() => editor.chainApi),
        setTextAlign: vi.fn(() => editor.chainApi),
        toggleBold: vi.fn(() => editor.chainApi),
        toggleItalic: vi.fn(() => editor.chainApi),
        toggleUnderline: vi.fn(() => editor.chainApi),
        toggleStrike: vi.fn(() => editor.chainApi),
        toggleBulletList: vi.fn(() => editor.chainApi),
        toggleOrderedList: vi.fn(() => editor.chainApi),
        unsetAllMarks: vi.fn(() => editor.chainApi),
        clearNodes: vi.fn(() => editor.chainApi),
        run: vi.fn(() => true),
      },
    };
    tiptapMock.lastEditor = editor;
    return editor;
  };

  return {
    useEditor: vi.fn(createEditor),
    EditorContent: ({ editor }: { editor: any }) => ReactModule.createElement('div', {
      'aria-label': '富文本编辑器',
      'data-testid': 'richtext-editor-content',
      className: editor?.attributes?.class,
      contentEditable: true,
      suppressContentEditableWarning: true,
      style: editor?.attributes?.style ? Object.fromEntries(editor.attributes.style.split(';').filter(Boolean).map((rule: string) => {
        const [key, value] = rule.split(':');
        return [key.trim(), value.trim()];
      })) : undefined,
      onInput: (event: React.FormEvent<HTMLDivElement>) => editor?.commands.setContent(event.currentTarget.textContent ?? ''),
    }, editor?.text ?? ''),
  };
});

function createText(id = 'font-text'): TextComponent {
  return {
    id,
    type: 'text',
    name: 'FontText',
    x: 0,
    y: 0,
    width: 40,
    height: 10,
    text: 'Font sample',
    font: { family: 'BrandSong', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
    textAlign: 'left',
    verticalAlign: 'top',
    border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    backgroundColor: 'transparent',
    canGrow: false,
    canShrink: false,
  };
}

function createRichText(): RichtextComponent {
  return {
    id: 'rich-1',
    type: 'richtext',
    name: 'Rich1',
    x: 0,
    y: 0,
    width: 70,
    height: 20,
    html: '<p>Old rich text</p>',
  };
}

function loadTemplateWithFonts(fonts: ReportFont[]) {
  const template = createDefaultTemplate('Phase 26 Fonts');
  template.fonts = [...(template.fonts ?? []), ...fonts];
  const dataBand = template.pages[0].bands.find(band => band.type === 'data');
  if (!dataBand) throw new Error('Missing data band');
  const component = createText();
  dataBand.components = [component];

  act(() => {
    useDesignerStore.getState().loadTemplate(template);
    useDesignerStore.getState().selectComponents([component.id]);
  });

  return { template, component };
}

function openSelect(label: string, scope: HTMLElement | Document = document) {
  const target = within(scope as HTMLElement).getByLabelText(label);
  const trigger = (
    target.closest('.ant-select-selector')
    ?? target.closest('.ant-select')?.querySelector('.ant-select-selector')
    ?? target.closest('.ant-select')?.querySelector('.ant-select-content')
    ?? target.parentElement?.querySelector('.ant-select-selector')
    ?? target.parentElement?.querySelector('.ant-select-content')
  ) as HTMLElement | null;
  if (!trigger) throw new Error(`Unable to find select trigger for ${label}`);
  fireEvent.mouseDown(trigger);
}

describe('phase 26 report font registry and rich text editor shell', () => {
  it('uses report font registry options in text component font selector', async () => {
    loadTemplateWithFonts([
      {
        id: 'brand-song',
        name: 'Brand Song',
        family: 'BrandSong',
        fallback: 'serif',
        source: { url: '/fonts/brand-song.woff2', format: 'woff2' },
      },
    ]);

    render(<PropertyEditor />);

    openSelect('字体系列');

    expect(await screen.findByText('Brand Song')).toBeInTheDocument();
    expect(await screen.findByText('SimSun')).toBeInTheDocument();
  });

  it('shows a readonly code-registered report font list on the page property panel', async () => {
    const template = createDefaultTemplate('Phase 26 Page Fonts');
    act(() => {
      useDesignerStore.getState().loadTemplate(template);
      useDesignerStore.getState().selectComponents([]);
      useDesignerStore.getState().selectBand(null);
    });

    render(<DesignerPropertyPanel />);

    expect(screen.getByTestId('report-font-registry')).toBeInTheDocument();
    expect(screen.getByText('Microsoft YaHei')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '添加字体' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('删除字体')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('字体名称')).not.toBeInTheDocument();
  });

  it('opens rich text editing in a dialog from double click and the selected edit action', async () => {
    const template = createDefaultTemplate('Phase 26 Rich Text');
    template.fonts = [
      ...(template.fonts ?? []),
      {
        id: 'brand-song',
        name: 'Brand Song',
        family: 'BrandSong',
        fallback: 'serif',
      },
    ];
    const dataBand = template.pages[0].bands.find(band => band.type === 'data');
    if (!dataBand) throw new Error('Missing data band');
    const component = createRichText();
    dataBand.components = [component];

    render(<Designer template={template} locale="zh-CN" />);

    fireEvent.doubleClick(await screen.findByTestId('designer-component-richtext-content'));

    const dialogEditor = await screen.findByTestId('richtext-inline-editor');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByText('编辑富文本')).toBeInTheDocument();
    expect(dialogEditor.closest('[data-component-id]')).toBeNull();
    fireEvent.contextMenu(screen.getByLabelText('富文本编辑器'));
    expect(screen.queryByTestId('designer-band-context-menu')).not.toBeInTheDocument();
    expect(screen.getByLabelText('富文本编辑器')).toHaveStyle({ outline: 'none' });
    openSelect('富文本字体');
    expect(await screen.findByText('Brand Song')).toBeInTheDocument();

    act(() => {
      useDesignerStore.getState().selectComponents([component.id]);
    });
    fireEvent.keyDown(screen.getByLabelText('富文本编辑器'), { key: 'Backspace' });
    expect(
      useDesignerStore
        .getState()
        .template.pages[0].bands.flatMap(band => band.components)
        .some(item => item.id === component.id),
    ).toBe(true);

    const editor = screen.getByLabelText('富文本编辑器');
    editor.textContent = '新的富文本内容';
    fireEvent.input(editor);
    fireEvent.click(screen.getByRole('button', { name: '保存富文本' }));

    await waitFor(() => {
      const saved = useDesignerStore
        .getState()
        .template.pages[0].bands.flatMap(band => band.components)
        .find(item => item.id === component.id) as RichtextComponent | undefined;
      expect(saved?.html).toContain('新的富文本内容');
      expect(saved?.html).not.toContain('<script>');
      expect(saved?.document).toMatchObject({ type: 'doc' });
    });

    act(() => {
      useDesignerStore.getState().selectComponents([component.id]);
    });

    const editButton = await screen.findByRole('button', { name: '编辑富文本' });
    expect(editButton.closest('[data-component-id]')).toBeNull();
    fireEvent.click(editButton);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByText('编辑富文本')).toBeInTheDocument();
    expect(await screen.findByTestId('richtext-inline-editor')).toBeInTheDocument();
  });
});
