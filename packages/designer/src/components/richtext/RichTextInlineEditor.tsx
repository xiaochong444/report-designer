import React, { useMemo, useState } from 'react';
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BoldOutlined,
  ClearOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  SaveOutlined,
  StrikethroughOutlined,
  UnderlineOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Button, ColorPicker, InputNumber, Select, Space, Tooltip } from 'antd';
import type { ReportFont, RichTextDocument } from '@report-designer/core';
import { getReportFontOptions, sanitizeRichHtml } from '@report-designer/core';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color, FontFamily, FontSize, TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useDesignerI18n } from '../../i18n';

interface RichTextInlineEditorProps {
  html: string;
  document?: RichTextDocument;
  fonts?: ReportFont[];
  onSave: (value: { html: string; document: RichTextDocument }) => void;
  onCancel: () => void;
}

const FONT_SIZE_OPTIONS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72].map(value => ({
  label: String(value),
  value,
}));

export const RichTextInlineEditor: React.FC<RichTextInlineEditorProps> = ({
  html,
  document,
  fonts,
  onSave,
  onCancel,
}) => {
  const { t } = useDesignerI18n();
  const [fontSize, setFontSize] = useState<number>(12);
  const fontOptions = useMemo(() => getReportFontOptions(fonts), [fonts]);
  const content = document ?? (html || '<p></p>');
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      TextAlign.configure({ types: ['paragraph'] }),
      Underline,
      Link.configure({ openOnClick: false, autolink: false, linkOnPaste: false }),
      Placeholder.configure({ placeholder: '' }),
    ],
    content,
    editorProps: {
      attributes: {
        'aria-label': t('richText.editor'),
        class: 'rd-richtext-inline-surface',
      },
    },
  });

  const run = (command: (chain: any) => void) => {
    if (!editor) return;
    const chain = editor.chain().focus();
    command(chain);
  };

  const applyFontFamily = (family: string) => {
    run(chain => chain.setFontFamily(family).run());
  };

  const applyFontSize = (size: number | null) => {
    if (!size) return;
    setFontSize(size);
    run(chain => chain.setFontSize(`${size}px`).run());
  };

  const applyColor = (_: unknown, css: string) => {
    run(chain => chain.setColor(css).run());
  };

  const save = () => {
    if (!editor) return;
    onSave({
      html: sanitizeRichHtml(editor.getHTML()),
      document: editor.getJSON() as RichTextDocument,
    });
  };

  const iconButton = (
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    active = false,
  ) => (
    <Tooltip title={label}>
      <Button
        aria-label={label}
        size="small"
        type={active ? 'primary' : 'default'}
        icon={icon}
        onMouseDown={event => event.preventDefault()}
        onClick={onClick}
      />
    </Tooltip>
  );

  return (
    <div
      data-testid="richtext-inline-editor"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: 96,
        background: '#ffffff',
        border: '1px solid #1677ff',
        boxShadow: '0 4px 14px rgba(22,119,255,0.18)',
      }}
      onPointerDown={event => event.stopPropagation()}
      onMouseDown={event => event.stopPropagation()}
    >
      <Space
        size={4}
        wrap
        style={{
          flex: '0 0 auto',
          padding: 4,
          borderBottom: '1px solid #e5e7eb',
          background: '#f8fafc',
        }}
      >
        <Select
          aria-label={t('richText.font')}
          size="small"
          style={{ width: 132 }}
          placeholder={t('richText.font')}
          options={fontOptions}
          onChange={applyFontFamily}
        />
        <InputNumber
          aria-label={t('richText.fontSize')}
          size="small"
          min={6}
          max={120}
          value={fontSize}
          controls
          style={{ width: 70 }}
          onChange={applyFontSize}
        />
        <ColorPicker size="small" onChange={applyColor} />
        {iconButton(t('richText.bold'), <BoldOutlined />, () => run(chain => chain.toggleBold().run()), Boolean(editor?.isActive('bold')))}
        {iconButton(t('richText.italic'), <ItalicOutlined />, () => run(chain => chain.toggleItalic().run()), Boolean(editor?.isActive('italic')))}
        {iconButton(t('richText.underline'), <UnderlineOutlined />, () => run(chain => chain.toggleUnderline().run()), Boolean(editor?.isActive('underline')))}
        {iconButton(t('richText.strike'), <StrikethroughOutlined />, () => run(chain => chain.toggleStrike().run()), Boolean(editor?.isActive('strike')))}
        {iconButton(t('richText.alignLeft'), <AlignLeftOutlined />, () => run(chain => chain.setTextAlign('left').run()))}
        {iconButton(t('richText.alignCenter'), <AlignCenterOutlined />, () => run(chain => chain.setTextAlign('center').run()))}
        {iconButton(t('richText.alignRight'), <AlignRightOutlined />, () => run(chain => chain.setTextAlign('right').run()))}
        {iconButton(t('richText.bulletList'), <UnorderedListOutlined />, () => run(chain => chain.toggleBulletList().run()))}
        {iconButton(t('richText.orderedList'), <OrderedListOutlined />, () => run(chain => chain.toggleOrderedList().run()))}
        {iconButton(t('richText.clearFormat'), <ClearOutlined />, () => run(chain => chain.unsetAllMarks().clearNodes().run()))}
        <Button aria-label={t('richText.save')} size="small" type="primary" icon={<SaveOutlined />} onClick={save}>
          {t('richText.save')}
        </Button>
        <Button aria-label={t('richText.cancel')} size="small" onClick={onCancel}>
          {t('richText.cancel')}
        </Button>
      </Space>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 4 }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
