/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DesignerI18nProvider } from '../i18n';
import { EventEditorDialog } from '../components/events/EventEditorDialog';

describe('phase 23 event editor', () => {
  it('shows localized report events and saves a script', () => {
    let saved: unknown;

    render(
      <DesignerI18nProvider locale="en-US">
        <EventEditorDialog
          open
          targetType="report"
          events={{ beforeRender: { enabled: true, script: 'ctx.log.info("hello");' } }}
          dictionaryItems={[{ key: 'orders.Amount', title: 'orders.Amount' }]}
          componentItems={[{ key: 'Title', title: 'Title' }]}
          onCancel={() => undefined}
          onSave={(events) => { saved = events; }}
        />
      </DesignerI18nProvider>,
    );

    expect(screen.getByText('Before Render')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Script'), { target: { value: 'ctx.log.info("saved");' } });
    fireEvent.click(screen.getByText('Apply'));

    expect(saved).toMatchObject({
      beforeRender: { enabled: true, script: 'ctx.log.info("saved");' },
    });
  });

  it('validates blocked script tokens', () => {
    render(
      <DesignerI18nProvider locale="en-US">
        <EventEditorDialog
          open
          targetType="component"
          events={{ beforePrint: { enabled: true, script: 'fetch("/api")' } }}
          onCancel={() => undefined}
          onSave={() => undefined}
        />
      </DesignerI18nProvider>,
    );

    fireEvent.click(screen.getByText('Validate'));

    expect(screen.getByText('Script contains blocked token: fetch.')).toBeInTheDocument();
  });

  it('renders Chinese labels', () => {
    render(
      <DesignerI18nProvider locale="zh-CN">
        <EventEditorDialog
          open
          targetType="band"
          events={{}}
          onCancel={() => undefined}
          onSave={() => undefined}
        />
      </DesignerI18nProvider>,
    );

    expect(screen.getAllByText('事件').length).toBeGreaterThan(0);
    expect(screen.getByText('打印前')).toBeInTheDocument();
  });
});
