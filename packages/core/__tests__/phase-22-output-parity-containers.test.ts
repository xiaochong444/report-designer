import { describe, expect, it } from 'vitest';
import { buildBandPlan, executeBandPlan, renderReport } from '../src';
import { band, makeTemplate } from './phase-2-helpers';
import type { BorderConfig, FontConfig, ReportComponent, ReportTemplate } from '../src';

function renderedNames(rows: Record<string, unknown>[], sort: Array<{ field: string; direction: 'asc' | 'desc' }>) {
  const template = makeTemplate([
    band('data', 'data', { dataBand: { dataSourceId: 'employees', sort } }),
  ]);

  return executeBandPlan(buildBandPlan(template), { employees: rows })
    .filter(item => item.kind === 'band' && item.band.id === 'data')
    .map(item => item.context.row?.Name);
}

describe('Phase 22 DataBand sorting', () => {
  it('sorts by multiple rules and keeps original order for equal keys', () => {
    expect(renderedNames([
      { Name: 'First B', Department: 'Engineering', Score: 2 },
      { Name: 'First A', Department: 'Engineering', Score: 1 },
      { Name: 'Second A', Department: 'Engineering', Score: 1 },
      { Name: 'Sales A', Department: 'Sales', Score: 1 },
    ], [
      { field: 'Department', direction: 'asc' },
      { field: 'Score', direction: 'asc' },
    ])).toEqual(['First A', 'Second A', 'First B', 'Sales A']);
  });

  it('places nullish and empty values last for ascending and first for descending', () => {
    const rows = [
      { Name: 'Has 2', Rank: 2 },
      { Name: 'Missing', Rank: null },
      { Name: 'Has 1', Rank: 1 },
      { Name: 'Empty', Rank: '' },
    ];

    expect(renderedNames(rows, [{ field: 'Rank', direction: 'asc' }])).toEqual(['Has 1', 'Has 2', 'Missing', 'Empty']);
    expect(renderedNames(rows, [{ field: 'Rank', direction: 'desc' }])).toEqual(['Missing', 'Empty', 'Has 2', 'Has 1']);
  });

  it('compares valid dates by time before falling back to locale strings', () => {
    expect(renderedNames([
      { Name: 'February', Started: '2024-02-01' },
      { Name: 'January later', Started: '2024-01-02T12:00:00Z' },
      { Name: 'January earlier', Started: new Date('2024-01-02T08:00:00Z') },
    ], [{ field: 'Started', direction: 'asc' }])).toEqual(['January earlier', 'January later', 'February']);
  });

  it('passes each original row index to sort expressions', () => {
    expect(renderedNames([
      { Name: 'First' },
      { Name: 'Second' },
      { Name: 'Third' },
    ], [{ field: 'ROWINDEX()', direction: 'desc' }])).toEqual(['Third', 'Second', 'First']);
  });

  it('applies odd and even row backgrounds to rendered data band rows', () => {
    const template = makeTemplate([
      band('data', 'data', {
        dataBand: {
          dataSourceId: 'employees',
          oddRowBackgroundColor: '#fff7e6',
          evenRowBackgroundColor: '#e6f4ff',
        },
      }),
    ]);

    const document = renderReport(template, {
      employees: [
        { Name: 'Ada' },
        { Name: 'Grace' },
        { Name: 'Linus' },
      ],
    });

    const rows = document.pages.flatMap(page => page.items.filter(item => item.bandId === 'data'));
    expect(rows.map(row => row.backgroundColor)).toEqual(['#fff7e6', '#e6f4ff', '#fff7e6']);
  });
});

const border: BorderConfig = {
  style: 'solid',
  width: 1,
  color: '#333333',
  sides: { top: true, right: true, bottom: true, left: true },
};

const font: FontConfig = {
  family: 'Arial',
  size: 10,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  color: '#111111',
};

function text(id: string, textValue: string, x: number, y: number, width = 40, height = 8): ReportComponent {
  return {
    id,
    type: 'text',
    x,
    y,
    width,
    height,
    text: textValue,
    font,
    textAlign: 'left',
    verticalAlign: 'top',
    border,
    canGrow: false,
    canShrink: false,
  };
}

function panelTemplate(component: ReportComponent): ReportTemplate {
  return makeTemplate([
    band('title', 'reportTitle', {
      height: 70,
      components: [component],
    }),
  ]);
}

describe('Phase 22 container RenderDocument contract', () => {
  it('layouts panel children relative to the panel content box and preserves container style', () => {
    const document = renderReport(panelTemplate({
      id: 'panel-1',
      type: 'panel',
      x: 10,
      y: 12,
      width: 100,
      height: 50,
      backgroundColor: '#ffeecc',
      padding: { top: 3, right: 2, bottom: 1, left: 2 },
      border,
      components: [text('panel-child', 'Inside', 4, 6)],
    }));

    const panel = document.pages[0].items[0].components[0];

    expect(panel).toMatchObject({
      id: 'panel-1',
      type: 'panel',
      x: 30,
      y: 32,
      width: 100,
      height: 50,
      style: {
        backgroundColor: '#ffeecc',
        border,
      },
      overflow: false,
    });
    expect(panel.children).toHaveLength(1);
    expect(panel.children[0]).toMatchObject({
      id: 'panel-child',
      type: 'text',
      x: 36,
      y: 41,
      content: 'Inside',
    });
  });

  it('renders a visible placeholder when a subreport registry entry is missing', () => {
    const document = renderReport(panelTemplate({
      id: 'sub-missing',
      type: 'subreport',
      x: 5,
      y: 7,
      width: 90,
      height: 24,
      backgroundColor: '#fff7e6',
      border: { style: 'solid', width: 0.4, color: '#445566', sides: { top: true, right: true, bottom: true, left: true } },
      templateUrl: 'missing-report',
      parameters: {},
    } as any));

    const subreport = document.pages[0].items[0].components[0];

    expect(subreport).toMatchObject({
      id: 'sub-missing',
      type: 'subreport',
      x: 25,
      y: 27,
      width: 90,
      height: 24,
      templateUrl: 'missing-report',
      missing: true,
      style: {
        backgroundColor: '#fff7e6',
        border: { style: 'solid', width: 0.4, color: '#445566', sides: { top: true, right: true, bottom: true, left: true } },
      },
    });
    expect(subreport.children).toHaveLength(1);
    expect(subreport.children[0]).toMatchObject({
      type: 'text',
      content: 'Missing subreport: missing-report',
    });
  });

  it('renders the first page of a registered local subreport inside the subreport container', () => {
    const childTemplate = panelTemplate(text('sub-child', 'Child report', 2, 3));
    const document = renderReport(
      panelTemplate({
        id: 'sub-local',
        type: 'subreport',
        x: 8,
        y: 9,
        width: 80,
        height: 30,
        templateUrl: 'child-report',
        parameters: {},
      }),
      {},
      { subreports: { 'child-report': childTemplate } },
    );

    const subreport = document.pages[0].items[0].components[0];

    expect(subreport).toMatchObject({
      id: 'sub-local',
      type: 'subreport',
      x: 28,
      y: 29,
      width: 80,
      templateUrl: 'child-report',
      missing: false,
    });
    expect(subreport.children).toHaveLength(1);
    expect(subreport.children[0]).toMatchObject({
      id: 'sub-child',
      type: 'text',
      x: 50,
      y: 52,
      content: 'Child report',
    });
  });

  it('passes evaluated subreport parameters into the registered local template', () => {
    const childTemplate = panelTemplate(text('sub-param', '{Parameters.orderNo}', 2, 3));
    const document = renderReport(
      makeTemplate([
        band('orders-band', 'data', {
          height: 40,
          dataBand: { dataSourceId: 'orders' },
          components: [{
            id: 'sub-param-container',
            type: 'subreport',
            x: 8,
            y: 9,
            width: 80,
            height: 30,
            templateUrl: 'child-report',
            parameters: { orderNo: '{orders.OrderNo}' },
          }],
        }),
      ]),
      { orders: [{ OrderNo: 'A-1001' }] },
      { subreports: { 'child-report': childTemplate } },
    );

    const subreport = document.pages[0].items[0].components[0];

    expect(subreport.children[0]).toMatchObject({
      id: 'sub-param',
      type: 'text',
      content: 'A-1001',
    });
  });

  it('keeps all registered local subreport pages by stacking their components inside the container', () => {
    const childTemplate = makeTemplate([
      band('child-data', 'data', {
        height: 40,
        dataBand: { dataSourceId: 'children' },
        components: [text('sub-row', '{children.Name}', 0, 0, 50, 8)],
      }),
    ]);
    childTemplate.pages[0].height = 60;
    childTemplate.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReport(
      panelTemplate({
        id: 'sub-multipage',
        type: 'subreport',
        x: 4,
        y: 5,
        width: 80,
        height: 30,
        templateUrl: 'child-report',
        parameters: {},
      }),
      { children: [{ Name: 'First page' }, { Name: 'Second page' }] },
      { subreports: { 'child-report': childTemplate } },
    );

    const subreport = document.pages[0].items[0].components[0];

    expect(subreport.children.map(child => 'content' in child ? child.content : '')).toEqual(['First page', 'Second page']);
    expect(subreport.children[1].y).toBeGreaterThan(subreport.children[0].y + childTemplate.pages[0].height - 1);
    expect(subreport.height).toBeGreaterThan(60);
  });

  it('marks containers as overflowed when children exceed their bounds', () => {
    const document = renderReport(panelTemplate({
      id: 'panel-overflow',
      type: 'panel',
      x: 10,
      y: 12,
      width: 30,
      height: 12,
      border,
      components: [text('panel-overflow-child', 'Outside', 24, 6, 20, 8)],
    }));

    const panel = document.pages[0].items[0].components[0];

    expect(panel).toMatchObject({
      id: 'panel-overflow',
      type: 'panel',
      overflow: true,
    });
  });
});
