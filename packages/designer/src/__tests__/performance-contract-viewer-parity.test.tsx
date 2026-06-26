/* @vitest-environment jsdom */
import React from 'react';
import { readFileSync } from 'node:fs';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Viewer } from '@report-designer/viewer';
import type { ReportTemplate, TextComponent } from '@report-designer/core';
import { Designer } from '../components/Designer';
import { useDesignerStore } from '../store/designer-store';

const baseText: Omit<TextComponent, 'id' | 'name' | 'x' | 'y' | 'width' | 'height' | 'text'> = {
  type: 'text',
  font: { family: 'Microsoft YaHei', size: 9, bold: false, italic: false, underline: false, strikethrough: false, color: '#111827' },
  textAlign: 'left',
  verticalAlign: 'middle',
  border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
  canGrow: false,
  canShrink: false,
};

function text(id: string, y: number, value: string): TextComponent {
  return {
    ...baseText,
    id,
    name: id,
    x: 0,
    y,
    width: 80,
    height: 6,
    text: value,
  };
}

function template(): ReportTemplate {
  return {
    id: 'performance-contract-print',
    name: '绩效合约打印',
    version: '2.0',
    pages: [{
      id: 'page-1',
      name: '页面 1',
      width: 210,
      height: 297,
      margins: { top: 8, right: 10, bottom: 8, left: 10 },
      orientation: 'portrait',
      bands: [{
        id: 'title',
        type: 'reportTitle',
        height: 32,
        components: [
          text('department', 0, '{DepartmentName}'),
          text('position', 8, '{PositionName}'),
          text('employee', 16, '{EmployeeName}'),
        ],
      }],
    }],
    dataSources: [],
    styles: [],
    conditionalFormats: [],
    parameters: [],
  };
}

const printData = {
  Code: 'PC20260001',
  DepartmentName: '信息部',
  PositionName: '信息主管',
  EmployeeName: '张三',
  Items: [
    { Id: 'item-1', IndicatorName: '销售额', Weight: 0.5 },
  ],
};

describe('performance contract designer and viewer parity', () => {
  it('renders PascalCase root fields consistently in Viewer and Designer preview', async () => {
    const reportTemplate = template();
    const { unmount } = render(<Viewer template={reportTemplate} data={printData} locale="zh-CN" />);

    expect(screen.getByText('信息部')).toBeInTheDocument();
    expect(screen.getByText('信息主管')).toBeInTheDocument();
    expect(screen.getByText('张三')).toBeInTheDocument();
    unmount();

    render(<Designer template={reportTemplate} data={printData} locale="zh-CN" />);
    fireEvent.click(screen.getByRole('button', { name: '预览' }));

    await waitFor(() => expect(screen.getByText('信息部')).toBeInTheDocument());
    expect(screen.getByText('信息主管')).toBeInTheDocument();
    expect(screen.getByText('张三')).toBeInTheDocument();
  });

  it('renders the real performance contract template consistently when provided through JSON', async () => {
    const templatePath = process.env.PERFORMANCE_CONTRACT_TEMPLATE_JSON;
    if (!templatePath) {
      return;
    }

    const reportTemplate = JSON.parse(readFileSync(templatePath, 'utf8')) as ReportTemplate;
    const { unmount } = render(<Viewer template={reportTemplate} data={printData} locale="zh-CN" />);

    expect(screen.getByText('信息主管')).toBeInTheDocument();
    expect(screen.getByText('张三')).toBeInTheDocument();
    unmount();

    render(<Designer template={reportTemplate} data={printData} locale="zh-CN" />);
    fireEvent.click(screen.getByRole('button', { name: '预览' }));

    await waitFor(() => expect(screen.getByText('信息主管')).toBeInTheDocument());
    expect(screen.getByText('张三')).toBeInTheDocument();
  });
});
