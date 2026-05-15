/* @vitest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { ConditionalFormat, ReportComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { ConditionalFormatManager } from '../components/ConditionalFormatManager';
import { DesignerShell } from '../components/shell/DesignerShell';
import { PropertyEditor } from '../components/PropertyEditor';
import { DesignerI18nProvider } from '../i18n';
import { useDesignerStore } from '../store/designer-store';

function textComponent(overrides: Partial<ReportComponent> = {}) {
  return {
    id: 'text-1',
    type: 'text',
    name: 'Text1',
    x: 10,
    y: 10,
    width: 50,
    height: 8,
    text: '{Orders.Amount}',
    font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
    textAlign: 'left',
    verticalAlign: 'top',
    border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    canGrow: false,
    canShrink: false,
    ...overrides,
  } as ReportComponent;
}

function loadTemplate(format?: ConditionalFormat) {
  const template = createDefaultTemplate('Phase 20 Conditional Format');
  template.dataSources = [{
    id: 'Orders',
    name: 'Orders',
    type: 'json',
    schema: [{ name: 'Amount', type: 'number' }, { name: 'Status', type: 'string' }],
  }];
  template.conditionalFormats = format ? [format] : [];
  template.pages[0].bands.find(band => band.type === 'data')!.components = [textComponent()];
  act(() => {
    useDesignerStore.getState().loadTemplate(template);
    useDesignerStore.getState().selectComponents(['text-1']);
  });
  return template;
}

function selectedText() {
  return useDesignerStore.getState().template.pages[0].bands.flatMap(band => band.components)[0] as any;
}

async function findDialogByTitle(title: string) {
  const heading = await screen.findByText(title);
  return heading.closest('.ant-modal-root') as HTMLElement;
}

describe('Phase 20 conditional format library', () => {
  it('lets a selected component choose and clear a conditional format from the property panel', async () => {
    loadTemplate({
      id: 'cf_high',
      name: 'High Amount',
      applyTo: [],
      rules: [{ id: 'rule_1', expression: '{Orders.Amount} > 1000', overrides: { backgroundColor: '#fff1f0' } }],
    });
    render(<PropertyEditor />);

    fireEvent.mouseDown(screen.getByLabelText('条件格式'));
    fireEvent.click(await screen.findByText('High Amount'));

    expect(selectedText().conditionalFormat).toBe('cf_high');

    fireEvent.mouseDown(screen.getByLabelText('条件格式'));
    fireEvent.click(await screen.findByText('无'));

    expect(selectedText().conditionalFormat).toBeUndefined();
  });

  it('creates, edits, duplicates, and deletes reusable conditional formats in the library dialog', async () => {
    loadTemplate();
    const close = () => {};
    render(
      <DesignerI18nProvider locale="zh-CN">
        <ConditionalFormatManager open onClose={close} />
      </DesignerI18nProvider>,
    );

    const dialog = await findDialogByTitle('条件格式库');
    fireEvent.click(within(dialog).getByRole('button', { name: '新建' }));

    await waitFor(() => expect(useDesignerStore.getState().template.conditionalFormats).toHaveLength(1));
    fireEvent.change(within(dialog).getByLabelText('名称'), { target: { value: 'High Amount' } });
    fireEvent.change(within(dialog).getByLabelText('条件字段'), { target: { value: '{Orders.Amount}' } });
    fireEvent.mouseDown(within(dialog).getByLabelText('数据类型'));
    fireEvent.click(await screen.findByText('数字'));
    fireEvent.mouseDown(within(dialog).getByLabelText('操作符'));
    fireEvent.click(await screen.findByText('大于'));
    fireEvent.change(within(dialog).getByLabelText('值'), { target: { value: '1000' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '加粗' }));
    fireEvent.change(within(dialog).getByLabelText('背景色'), { target: { value: '#fff1f0' } });
    fireEvent.click(within(dialog).getByRole('checkbox', { name: '满足后停止' }));

    const edited = useDesignerStore.getState().template.conditionalFormats[0];
    expect(edited.name).toBe('High Amount');
    expect(edited.rules[0]).toMatchObject({
      conditionType: 'value',
      field: '{Orders.Amount}',
      dataType: 'number',
      operator: 'greaterThan',
      value: 1000,
      breakIfTrue: true,
    });
    expect(edited.rules[0].overrides).toMatchObject({
      fontWeight: true,
      backgroundColor: '#fff1f0',
    });

    fireEvent.click(within(dialog).getByRole('button', { name: '复制' }));
    expect(useDesignerStore.getState().template.conditionalFormats).toHaveLength(2);

    act(() => {
      useDesignerStore.getState().applySelectedConditionalFormat('cf_missing');
    });
    const duplicateId = useDesignerStore.getState().template.conditionalFormats[1].id;
    act(() => {
      useDesignerStore.getState().applySelectedConditionalFormat(duplicateId);
    });
    expect(selectedText().conditionalFormat).toBe(duplicateId);

    fireEvent.click(within(dialog).getByRole('button', { name: '删除' }));
    fireEvent.click(await screen.findByRole('button', { name: '确认' }));

    expect(useDesignerStore.getState().template.conditionalFormats.find(format => format.id === duplicateId)).toBeUndefined();
    expect(selectedText().conditionalFormat).toBeUndefined();
  });

  it('opens the condition format settings window from Home and applies the selected format to the component', async () => {
    loadTemplate({
      id: 'cf_warn',
      name: 'Warning Amount',
      applyTo: [],
      rules: [{ id: 'rule_warn', expression: '{Orders.Amount} > 1000', overrides: { backgroundColor: '#fff1f0' } }],
    });

    render(
      <DesignerI18nProvider locale="zh-CN">
        <DesignerShell />
      </DesignerI18nProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: '条件格式' }));
    const dialog = await findDialogByTitle('条件格式库');

    expect(dialog).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: '应用到选中项' }));

    await waitFor(() => expect(selectedText().conditionalFormat).toBe('cf_warn'));
  }, 10000);

  it('shows every supported value condition type and operation in the settings window', async () => {
    loadTemplate();
    render(
      <DesignerI18nProvider locale="zh-CN">
        <ConditionalFormatManager open onClose={() => {}} />
      </DesignerI18nProvider>,
    );

    const dialog = await findDialogByTitle('条件格式库');
    fireEvent.click(within(dialog).getByRole('button', { name: '新建' }));

    fireEvent.mouseDown(within(dialog).getByLabelText('数据类型'));
    for (const label of ['文本', '数字', '日期', '布尔值', '表达式']) {
      expect((await screen.findAllByText(label)).length).toBeGreaterThan(0);
    }

    fireEvent.mouseDown(within(dialog).getByLabelText('操作符'));
    for (const label of ['等于', '不等于', '介于', '不介于', '大于', '大于等于', '小于', '小于等于', '包含', '不包含', '开头为', '结尾为']) {
      expect((await screen.findAllByText(label)).length).toBeGreaterThan(0);
    }
  });

  it('localizes the conditional format property and dialog to English', () => {
    loadTemplate({
      id: 'cf_warn',
      name: 'Warning',
      applyTo: [],
      rules: [{ id: 'rule_warn', expression: '{Orders.Amount} > 1000', overrides: {} }],
    });
    render(
      <DesignerI18nProvider locale="en-US">
        <PropertyEditor />
        <ConditionalFormatManager open onClose={() => {}} />
      </DesignerI18nProvider>,
    );

    expect(screen.getByLabelText('Conditional format')).toBeInTheDocument();
    expect(screen.getByText('Conditional Format Library')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply to Selected' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Break if True' })).toBeInTheDocument();
    expect(screen.getByText('Rules')).toBeInTheDocument();
    expect(screen.queryByText('条件格式库')).not.toBeInTheDocument();
  });
});
