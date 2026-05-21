import { describe, expect, it } from 'vitest';
import { buildPrintHtml } from '../print/print-frame';
import { makeRenderDocument } from './phase-4-helpers';

describe('Phase 4 print frame', () => {
  it('builds static printable HTML with A4 page rules and one div per page', () => {
    const html = buildPrintHtml(makeRenderDocument());

    expect(html).toContain('@page { size: 210mm 297mm; margin: 0; }');
    expect(html).toContain('class="rd-print-page"');
    expect(html.match(/class="rd-print-page"/g)).toHaveLength(1);
  });

  it('keeps print text styling aligned with the DOM preview renderer', () => {
    const html = buildPrintHtml(makeRenderDocument());

    expect(html).toContain('font-family:Arial');
    expect(html).toContain('font-size:14.663px');
    expect(html).toContain('color:#000000');
    expect(html).toContain('background-color:#f5f5f5');
    expect(html).toContain('border-top:0.2mm solid #000000');
    expect(html).toContain('text-align:left');
    expect(html).toContain('white-space:pre-wrap');
    expect(html).toContain('padding:0mm 0mm 0mm 0mm');
  });

  it('renders component coordinates relative to their containing band', () => {
    const html = buildPrintHtml(makeRenderDocument());

    expect(html).toContain('class="rd-print-band" style="left:20mm;top:20mm;width:170mm;height:20mm;"');
    expect(html).toContain('class="rd-print-component');
    expect(html).toContain('left:5mm;top:5mm');
    expect(html).not.toContain('left:25mm;top:25mm');
  });

  it('prints rich text html and image components from the render document', () => {
    const document = makeRenderDocument();
    document.pages[0].items[0].components.push(
      {
        id: 'rich1',
        type: 'richtext',
        x: 10,
        y: 10,
        width: 60,
        height: 12,
        html: '<strong>Rich Print</strong>',
        style: {},
      },
      {
        id: 'image1',
        type: 'image',
        x: 80,
        y: 10,
        width: 20,
        height: 12,
        src: 'data:image/png;base64,ZmFrZQ==',
        style: {},
      },
    );

    const html = buildPrintHtml(document);

    expect(html).toContain('<strong>Rich Print</strong>');
    expect(html).toContain('class="rd-print-component rd-print-richtext"');
    expect(html).toContain('class="rd-print-component rd-print-image"');
    expect(html).toContain('src="data:image/png;base64,ZmFrZQ=="');
  });

  it('prints common non-text components from the render document', () => {
    const document = makeRenderDocument();
    document.pages[0].items[0].components.push(
      {
        id: 'barcode1',
        type: 'barcode',
        x: 10,
        y: 10,
        width: 40,
        height: 12,
        value: 'ORD-1001',
        format: 'CODE128',
        showText: true,
        style: {},
      },
      {
        id: 'check1',
        type: 'checkbox',
        x: 10,
        y: 24,
        width: 40,
        height: 8,
        checked: true,
        label: 'Paid',
        style: {},
      },
      {
        id: 'line1',
        type: 'line',
        x: 10,
        y: 34,
        width: 40,
        height: 5,
        startX: 0,
        startY: 0,
        endX: 40,
        endY: 5,
        lineColor: '#ff0000',
        lineWidth: 0.3,
        lineStyle: 'dashed',
        style: {},
      },
      {
        id: 'shape1',
        type: 'shape',
        x: 10,
        y: 42,
        width: 20,
        height: 12,
        shapeType: 'roundRect',
        fillColor: '#eeeeee',
        borderColor: '#333333',
        borderWidth: 0.4,
        borderStyle: 'solid',
        style: {},
      },
    );

    const html = buildPrintHtml(document);

    expect(html).toContain('class="rd-print-component rd-print-barcode"');
    expect(html).toContain('ORD-1001');
    expect(html).toContain('class="rd-print-component rd-print-checkbox"');
    expect(html).toContain('Paid');
    expect(html).toContain('class="rd-print-component rd-print-line"');
    expect(html).toContain('<line');
    expect(html).toContain('class="rd-print-component rd-print-shape"');
    expect(html).toContain('<rect');
  });

  it('prints table components from the render document', () => {
    const document = makeRenderDocument();
    document.pages[0].items[0].components.push({
      id: 'table1',
      type: 'table',
      x: 10,
      y: 10,
      width: 80,
      height: 24,
      columns: [
        { id: 'name', header: 'Name', field: 'name', width: 50, cellType: 'text' },
        { id: 'salary', header: 'Salary', field: 'salary', width: 30, cellType: 'text' },
      ],
      rows: [
        [
          { row: 0, column: 0, content: 'Name', isHeader: true, height: 8, rowSpan: 1, colSpan: 1 },
          { row: 0, column: 1, content: 'Salary', isHeader: true, height: 8, rowSpan: 1, colSpan: 1 },
        ],
        [
          { row: 1, column: 0, content: 'Alice', field: 'name', height: 8, rowSpan: 1, colSpan: 1 },
          { row: 1, column: 1, content: '98000', field: 'salary', height: 8, rowSpan: 1, colSpan: 1 },
        ],
      ],
      showBorder: true,
      style: {},
    } as any);

    const html = buildPrintHtml(document);

    expect(html).toContain('class="rd-print-component rd-print-table"');
    expect(html).toContain('grid-template-columns:50mm 30mm');
    expect(html).toContain('Alice');
    expect(html).toContain('98000');
  });

  it('applies centered print text alignment to a full-width text content box', () => {
    const document = makeRenderDocument();
    const component = document.pages[0].items[0].components[0];
    if (component.type === 'text') {
      component.content = 'Centered Print Title';
      component.style = {
        ...component.style,
        textAlign: 'center',
      };
    }

    const html = buildPrintHtml(document);

    expect(html).toContain('class="rd-print-text-content"');
    expect(html).toContain('style="width:100%;text-align:center;white-space:inherit;"');
    expect(html).toContain('Centered Print Title');
  });

  it('prints panel and subreport children with preview-equivalent coordinate semantics', () => {
    const document = makeRenderDocument();
    document.pages[0].items[0].components.push({
      id: 'panel-1',
      type: 'panel',
      x: 30,
      y: 30,
      width: 80,
      height: 40,
      style: { backgroundColor: '#ffffff' },
      children: [
        {
          id: 'panel-text-1',
          type: 'text',
          x: 35,
          y: 36,
          width: 30,
          height: 8,
          content: 'Panel child',
          style: {},
        },
      ],
    });
    document.pages[0].items[0].components.push({
      id: 'subreport-1',
      type: 'subreport',
      x: 120,
      y: 30,
      width: 60,
      height: 30,
      templateUrl: 'child-report.json',
      missing: false,
      style: {},
      children: [
        {
          id: 'subreport-text-1',
          type: 'text',
          x: 125,
          y: 35,
          width: 30,
          height: 8,
          content: 'Sub child',
          style: {},
        },
      ],
    });

    const html = buildPrintHtml(document);

    expect(html).toContain('data-report-component="panel-1"');
    expect(html).toContain('data-report-component="panel-text-1"');
    expect(html).toContain('data-report-component="subreport-1"');
    expect(html).toContain('data-report-component="subreport-text-1"');
    expect(html).toContain('data-report-component="panel-1" style="left:10mm;top:10mm;width:80mm;height:40mm;');
    expect(html).toContain('data-report-component="panel-text-1" style="left:5mm;top:6mm;width:30mm;height:8mm;');
    expect(html).toContain('data-report-component="subreport-1" style="left:100mm;top:10mm;width:60mm;height:30mm;');
    expect(html).toContain('data-report-component="subreport-text-1" style="left:5mm;top:5mm;width:30mm;height:8mm;');
  });
});
