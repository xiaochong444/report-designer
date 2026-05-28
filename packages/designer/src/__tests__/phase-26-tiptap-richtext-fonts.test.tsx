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

  const createEditor = (options: { content?: string; onUpdate?: (payload: { editor: any }) => void }) => {
    const editor: any = {
      text: typeof options.content === 'string' ? options.content.replace(/<[^>]+>/g, '') : 'Old rich text',
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
    EditorContent: ({ editor }: { editor: any }) => ReactModule.createElement('textarea', {
      'aria-label': '富文本编辑器',
      'data-testid': 'richtext-editor-content',
      value: editor?.text ?? '',
      onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => editor?.commands.setContent(event.target.value),
    }),
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

  it('shows a report font registry group on the page property panel and adds custom fonts', async () => {
    const template = createDefaultTemplate('Phase 26 Page Fonts');
    act(() => {
      useDesignerStore.getState().loadTemplate(template);
      useDesignerStore.getState().selectComponents([]);
      useDesignerStore.getState().selectBand(null);
    });

    render(<DesignerPropertyPanel />);

    expect(screen.getByTestId('report-font-registry')).toBeInTheDocument();
    expect(screen.getByText('Microsoft YaHei')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '添加字体' }));

    await waitFor(() => {
      expect(useDesignerStore.getState().template.fonts?.some(font => !font.builtin)).toBe(true);
    });
    expect(screen.getByDisplayValue('自定义字体 1')).toBeInTheDocument();
  });

  it('opens a rich text inline editor with report fonts and saves html plus document', async () => {
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

    expect(await screen.findByTestId('richtext-inline-editor')).toBeInTheDocument();
    openSelect('富文本字体');
    expect(await screen.findByText('Brand Song')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('富文本编辑器'), { target: { value: '新的富文本内容' } });
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
  });
});
