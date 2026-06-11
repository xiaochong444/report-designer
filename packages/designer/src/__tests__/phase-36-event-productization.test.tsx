/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DesignerI18nProvider } from '../i18n';
import { EventEditorDialog } from '../components/events/EventEditorDialog';
import { buildEventScriptTemplates } from '../components/events/event-script-templates';

vi.mock('@monaco-editor/react', () => ({
  default: (props: Record<string, unknown>) => (
    <textarea
      aria-label={props['aria-label'] as string}
      value={props.value as string}
      onChange={(event) => (props.onChange as (value: string | undefined) => void)(event.target.value)}
    />
  ),
}));

function toggleTreeNode(title: string) {
  const node = screen.getByText(title).closest('.ant-tree-treenode');
  const switcher = node?.querySelector<HTMLElement>('.ant-tree-switcher');
  if (!switcher) {
    throw new Error(`Missing tree switcher for ${title}`);
  }
  fireEvent.click(switcher);
}

describe('phase 36 event productization', () => {
  it('builds localized script templates for the active event', () => {
    const templates = buildEventScriptTemplates('component', 'getValue', key => key);

    expect(templates.map(item => item.label)).toEqual(expect.arrayContaining([
      'events.template.setValue',
      'events.template.hideComponent',
      'events.template.createText',
      'events.template.bindText',
      'events.template.setComponentProperty',
      'events.template.logMessage',
    ]));
    expect(templates.find(item => item.id === 'component.getValue.setValue')).toMatchObject({
      insertText: 'ctx.setValue?.("");',
      detail: 'events.template.setValue.detail',
    });
    expect(templates.find(item => item.id === 'component.bindText')).toMatchObject({
      insertText: 'ctx.bindText?.("Text1", "{orders.Amount}");',
      detail: 'events.template.bindText.detail',
    });
  });

  it('inserts a script template from the dialog and saves it', () => {
    let saved: unknown;

    render(
      <DesignerI18nProvider locale="en-US">
        <EventEditorDialog
          open
          targetType="component"
          events={{}}
          onCancel={() => undefined}
          onSave={(events) => { saved = events; }}
        />
      </DesignerI18nProvider>,
    );

    expect(screen.getByText('Script templates')).toBeInTheDocument();
    expect(screen.queryByText('Set event value')).not.toBeInTheDocument();
    toggleTreeNode('Script templates');
    fireEvent.click(screen.getByText('Set event value'));
    expect(screen.getByLabelText('Script')).toHaveValue('ctx.setValue?.("");');

    fireEvent.click(screen.getByText('Apply'));
    expect(saved).toMatchObject({
      getValue: { enabled: true, script: 'ctx.setValue?.("");' },
    });
  });

  it('renders Chinese template group labels', () => {
    render(
      <DesignerI18nProvider locale="zh-CN">
        <EventEditorDialog
          open
          targetType="report"
          events={{}}
          onCancel={() => undefined}
          onSave={() => undefined}
        />
      </DesignerI18nProvider>,
    );

    expect(screen.getByText('脚本模板')).toBeInTheDocument();
    expect(screen.queryByText('写入报表状态')).not.toBeInTheDocument();
    toggleTreeNode('脚本模板');
    expect(screen.getByText('写入报表状态')).toBeInTheDocument();
    expect(screen.getByText('创建文本组件')).toBeInTheDocument();
  });
});
