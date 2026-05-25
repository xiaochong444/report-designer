import { describe, expect, it } from 'vitest';
import { PDFFont, PDFPage } from 'pdf-lib';
import { vi } from 'vitest';
import { exportRenderDocumentToPDF } from '../export/pdf/export-render-document';
import { barcodePattern, dataUrlToUint8Array, stripHtmlToPdfText } from '../export/pdf/pdf-component-rendering';
import { makeRenderDocument } from './phase-4-helpers';

describe('Phase 4 PDF export', () => {
  it('exports a RenderDocument PDF byte array', async () => {
    const bytes = await exportRenderDocumentToPDF(makeRenderDocument());

    expect(bytes.byteLength).toBeGreaterThan(500);
  });

  it('draws the page background before page content when exporting PDF', async () => {
    const document = makeRenderDocument();
    document.pages[0].backgroundColor = '#fff7e6';
    const drawRectangle = vi.spyOn(PDFPage.prototype, 'drawRectangle');

    await exportRenderDocumentToPDF(document);

    expect(drawRectangle).toHaveBeenNthCalledWith(1, expect.objectContaining({
      x: 0,
      y: 0,
      width: expect.closeTo(595.275, 2),
      height: expect.closeTo(841.89, 2),
    }));
    drawRectangle.mockRestore();
  });

  it('draws behind watermark after background and before page content when exporting PDF', async () => {
    const document = makeRenderDocument();
    document.pages[0].backgroundColor = '#fff7e6';
    document.pages[0].watermark = {
      enabled: true,
      text: 'Internal',
      fontFamily: 'SimSun',
      fontSize: 36,
      color: '#ff4d4f',
      opacity: 0.25,
      angle: -30,
      horizontalAlign: 'center',
      verticalAlign: 'middle',
      showBehind: true,
    };
    document.pages[0].pageBorder = {
      enabled: true,
      style: 'dashed',
      width: 0.4,
      color: '#1677ff',
      sides: { top: true, right: false, bottom: true, left: true },
      offset: 5,
    };
    const drawRectangle = vi.spyOn(PDFPage.prototype, 'drawRectangle');
    const drawText = vi.spyOn(PDFPage.prototype, 'drawText');
    const drawLine = vi.spyOn(PDFPage.prototype, 'drawLine');

    await exportRenderDocumentToPDF(document);

    expect(drawRectangle.mock.calls[0]?.[0]).toEqual(expect.objectContaining({
      x: 0,
      y: 0,
      width: expect.closeTo(595.275, 2),
      height: expect.closeTo(841.89, 2),
    }));
    const watermarkCallIndex = drawText.mock.calls.findIndex(([text]) => text === 'Internal');
    const itemCallIndex = drawText.mock.calls.findIndex(([text]) => text === 'Hello PDF');
    expect(watermarkCallIndex).toBeGreaterThanOrEqual(0);
    expect(itemCallIndex).toBeGreaterThanOrEqual(0);
    expect(drawText.mock.calls[watermarkCallIndex]?.[1]).toEqual(expect.objectContaining({
      size: expect.closeTo(102.047, 2),
      opacity: 0.25,
      rotate: expect.any(Object),
    }));
    const backgroundOrder = drawRectangle.mock.invocationCallOrder[0];
    const watermarkOrder = drawText.mock.invocationCallOrder[watermarkCallIndex];
    const itemOrder = drawText.mock.invocationCallOrder[itemCallIndex];
    const borderLineCalls = drawLine.mock.calls.filter(([options]) => Math.abs((options.thickness ?? 0) - 1.134) < 0.01);
    expect(borderLineCalls).toHaveLength(3);
    const firstBorderLineOrder = drawLine.mock.invocationCallOrder.find((_, index) => Math.abs((drawLine.mock.calls[index]?.[0].thickness ?? 0) - 1.134) < 0.01);
    expect(backgroundOrder).toBeLessThan(watermarkOrder);
    expect(watermarkOrder).toBeLessThan(itemOrder);
    expect(itemOrder).toBeLessThan(firstBorderLineOrder ?? 0);

    drawRectangle.mockRestore();
    drawText.mockRestore();
    drawLine.mockRestore();
  });

  it('draws foreground watermark after page content and before page border when exporting PDF', async () => {
    const document = makeRenderDocument();
    document.pages[0].backgroundColor = '#fff7e6';
    document.pages[0].watermark = {
      enabled: true,
      text: 'Internal',
      fontFamily: 'SimSun',
      fontSize: 36,
      color: '#ff4d4f',
      opacity: 0.25,
      angle: -30,
      horizontalAlign: 'center',
      verticalAlign: 'middle',
      showBehind: false,
    };
    document.pages[0].pageBorder = {
      enabled: true,
      style: 'dashed',
      width: 0.4,
      color: '#1677ff',
      sides: { top: true, right: false, bottom: true, left: true },
      offset: 5,
    };
    const drawRectangle = vi.spyOn(PDFPage.prototype, 'drawRectangle');
    const drawText = vi.spyOn(PDFPage.prototype, 'drawText');
    const drawLine = vi.spyOn(PDFPage.prototype, 'drawLine');

    await exportRenderDocumentToPDF(document);

    const watermarkCallIndex = drawText.mock.calls.findIndex(([text]) => text === 'Internal');
    const itemCallIndex = drawText.mock.calls.findIndex(([text]) => text === 'Hello PDF');
    expect(watermarkCallIndex).toBeGreaterThanOrEqual(0);
    expect(itemCallIndex).toBeGreaterThanOrEqual(0);
    const backgroundOrder = drawRectangle.mock.invocationCallOrder[0];
    const itemOrder = drawText.mock.invocationCallOrder[itemCallIndex];
    const watermarkOrder = drawText.mock.invocationCallOrder[watermarkCallIndex];
    const firstBorderLineOrder = drawLine.mock.invocationCallOrder.find((_, index) => Math.abs((drawLine.mock.calls[index]?.[0].thickness ?? 0) - 1.134) < 0.01);
    expect(backgroundOrder).toBeLessThan(itemOrder);
    expect(itemOrder).toBeLessThan(watermarkOrder);
    expect(watermarkOrder).toBeLessThan(firstBorderLineOrder ?? 0);

    drawRectangle.mockRestore();
    drawText.mockRestore();
    drawLine.mockRestore();
  });

  it('draws double page borders as two PDF lines per enabled side', async () => {
    const document = makeRenderDocument();
    document.pages[0].pageBorder = {
      enabled: true,
      style: 'double',
      width: 0.4,
      color: '#1677ff',
      sides: { top: true, right: true, bottom: true, left: true },
      offset: 5,
    };
    const drawLine = vi.spyOn(PDFPage.prototype, 'drawLine');

    await exportRenderDocumentToPDF(document);

    const thickness = 0.4 * 72 / 25.4;
    const borderLines = drawLine.mock.calls
      .map(([options]) => options)
      .filter((options) => Math.abs((options.thickness ?? 0) - thickness) < 0.01);
    expect(borderLines).toHaveLength(8);

    const pageHeight = 297 * 72 / 25.4;
    const expectedGap = Math.max(thickness * 2, 1);
    const topLines = borderLines.filter((options) => (
      Math.abs(options.start.y - options.end.y) < 0.01
      && options.start.y > pageHeight / 2
    ));
    const topYs = topLines.map((options) => options.start.y).sort((a, b) => b - a);
    expect(topYs).toHaveLength(2);
    expect(topYs[0] - topYs[1]).toBeCloseTo(expectedGap, 2);

    drawLine.mockRestore();
  });

  it('uses safe PDF text when exporting a Chinese page watermark', async () => {
    const document = makeRenderDocument();
    document.pages[0].watermark = {
      enabled: true,
      text: '内部',
      fontFamily: 'SimSun',
      fontSize: 18,
      color: '#000000',
      opacity: 0.2,
      angle: 0,
      horizontalAlign: 'center',
      verticalAlign: 'middle',
      showBehind: true,
    };
    const drawText = vi.spyOn(PDFPage.prototype, 'drawText');

    await expect(exportRenderDocumentToPDF(document)).resolves.toBeInstanceOf(Uint8Array);

    expect(drawText.mock.calls.some(([text]) => text === '??')).toBe(true);

    drawText.mockRestore();
  });

  it('centers the PDF watermark draw position around the text box for middle alignment', async () => {
    const document = makeRenderDocument();
    document.pages[0].watermark = {
      enabled: true,
      text: 'Internal',
      fontFamily: 'Arial',
      fontSize: 18,
      color: '#000000',
      opacity: 0.2,
      angle: -30,
      horizontalAlign: 'center',
      verticalAlign: 'middle',
      showBehind: true,
    };
    const drawText = vi.spyOn(PDFPage.prototype, 'drawText');
    const widthOfTextAtSize = vi.spyOn(PDFFont.prototype, 'widthOfTextAtSize').mockReturnValue(120);
    const heightAtSize = vi.spyOn(PDFFont.prototype, 'heightAtSize').mockReturnValue(40);

    await exportRenderDocumentToPDF(document);

    const watermarkCall = drawText.mock.calls.find(([text]) => text === 'Internal');
    expect(watermarkCall?.[1]).toEqual(expect.objectContaining({
      x: expect.closeTo((210 * 72 / 25.4) / 2 - 60, 2),
      y: expect.closeTo((297 * 72 / 25.4) / 2 - 20, 2),
    }));

    drawText.mockRestore();
    widthOfTextAtSize.mockRestore();
    heightAtSize.mockRestore();
  });

  it('provides deterministic browser-compatible helpers for component PDF rendering', () => {
    const bytes = dataUrlToUint8Array('data:image/png;base64,iVBORw0KGgo=');

    expect(Array.from(bytes.slice(0, 4))).toEqual([137, 80, 78, 71]);
    expect(stripHtmlToPdfText('<p>Hello <strong>PDF</strong></p><script>alert(1)</script>')).toBe('Hello PDF');
    expect(barcodePattern('ORD-1001')).toEqual(barcodePattern('ORD-1001'));
    expect(barcodePattern('ORD-1001')).not.toEqual(barcodePattern('ORD-1002'));
  });

  it('exports containers and common components from the render document', async () => {
    const document = makeRenderDocument();
    document.pages[0].items[0].components.push({
      id: 'panel-1',
      type: 'panel',
      x: 30,
      y: 30,
      width: 120,
      height: 80,
      style: { backgroundColor: '#ffffff' },
      children: [
        { id: 'image-1', type: 'image', x: 35, y: 35, width: 20, height: 20, src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lxwQ2wAAAABJRU5ErkJggg==', style: {} },
        { id: 'rich-1', type: 'richtext', x: 60, y: 35, width: 40, height: 10, html: '<strong>Rich</strong> PDF', style: {} },
        { id: 'barcode-1', type: 'barcode', x: 35, y: 60, width: 40, height: 15, value: 'ORD-1001', showText: true, style: {} },
        { id: 'checkbox-1', type: 'checkbox', x: 80, y: 60, width: 30, height: 8, checked: true, label: 'Paid', style: {} },
        { id: 'line-1', type: 'line', x: 35, y: 82, width: 40, height: 5, lineColor: '#ff0000', lineWidth: 0.3, lineStyle: 'dashed', style: {} },
        { id: 'shape-1', type: 'shape', x: 80, y: 80, width: 20, height: 12, shapeType: 'ellipse', fillColor: '#eeeeee', borderColor: '#333333', borderWidth: 0.4, style: {} },
      ],
    });
    document.pages[0].items[0].components.push({
      id: 'subreport-1',
      type: 'subreport',
      x: 30,
      y: 120,
      width: 60,
      height: 30,
      templateUrl: 'child-report.json',
      missing: false,
      style: {},
      children: [
        { id: 'sub-text-1', type: 'text', x: 35, y: 125, width: 30, height: 8, content: 'Nested', style: {} },
      ],
    });

    const bytes = await exportRenderDocumentToPDF(document);

    expect(bytes.byteLength).toBeGreaterThan(900);
  });
});
