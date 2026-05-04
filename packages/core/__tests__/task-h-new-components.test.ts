import { describe, it, expect } from 'vitest';
import type {
  LineComponent,
  ShapeComponent,
  PageNumberComponent,
  DateTimeComponent,
  ReportComponentUnion,
} from '@report-designer/core';

describe('Task H: 线条/形状/页码/日期组件', () => {
  describe('LineComponent', () => {
    it('should have correct type', () => {
      const line: LineComponent = {
        id: 'line_1',
        type: 'line',
        x: 10,
        y: 20,
        width: 50,
        height: 10,
        startX: 0,
        startY: 0,
        endX: 50,
        endY: 0,
        lineColor: '#000000',
        lineWidth: 0.2,
        lineStyle: 'solid',
      };
      expect(line.type).toBe('line');
      expect(line.startX).toBe(0);
      expect(line.endX).toBe(50);
    });

    it('should support different line styles', () => {
      const styles: Array<'solid' | 'dashed' | 'dotted'> = ['solid', 'dashed', 'dotted'];
      for (const s of styles) {
        const line: LineComponent = {
          id: 'line_1',
          type: 'line',
          x: 0, y: 0, width: 50, height: 10,
          startX: 0, startY: 0, endX: 50, endY: 0,
          lineColor: '#000', lineWidth: 0.2,
          lineStyle: s,
        };
        expect(line.lineStyle).toBe(s);
      }
    });
  });

  describe('ShapeComponent', () => {
    it('should have correct type for rectangle', () => {
      const shape: ShapeComponent = {
        id: 'shape_1',
        type: 'shape',
        x: 10, y: 20, width: 30, height: 30,
        shapeType: 'rectangle',
        fillColor: 'transparent',
        borderColor: '#000000',
        borderWidth: 0.2,
        borderStyle: 'solid',
      };
      expect(shape.type).toBe('shape');
      expect(shape.shapeType).toBe('rectangle');
    });

    it('should support all shape types', () => {
      const types: Array<'rectangle' | 'ellipse' | 'roundRect' | 'triangle'> = ['rectangle', 'ellipse', 'roundRect', 'triangle'];
      for (const t of types) {
        const shape: ShapeComponent = {
          id: 'shape_1',
          type: 'shape',
          x: 0, y: 0, width: 30, height: 30,
          shapeType: t,
          fillColor: '#fff',
          borderColor: '#000',
          borderWidth: 0.2,
          borderStyle: 'solid',
        };
        expect(shape.shapeType).toBe(t);
      }
    });
  });

  describe('PageNumberComponent', () => {
    it('should have correct type', () => {
      const pn: PageNumberComponent = {
        id: 'pn_1',
        type: 'pagenumber',
        x: 10, y: 20, width: 30, height: 15,
        format: '1/N',
        font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
        textAlign: 'center',
      };
      expect(pn.type).toBe('pagenumber');
      expect(pn.format).toBe('1/N');
    });

    it('should support all format options', () => {
      const formats: Array<'1' | '1/N' | 'Page 1 of N' | 'Page 1'> = ['1', '1/N', 'Page 1 of N', 'Page 1'];
      for (const f of formats) {
        const pn: PageNumberComponent = {
          id: 'pn_1',
          type: 'pagenumber',
          x: 0, y: 0, width: 30, height: 15,
          format: f,
          font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000' },
          textAlign: 'center',
        };
        expect(pn.format).toBe(f);
      }
    });
  });

  describe('DateTimeComponent', () => {
    it('should have correct type', () => {
      const dt: DateTimeComponent = {
        id: 'dt_1',
        type: 'datetime',
        x: 10, y: 20, width: 50, height: 15,
        format: 'yyyy-MM-dd HH:mm:ss',
        font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
        textAlign: 'left',
      };
      expect(dt.type).toBe('datetime');
      expect(dt.format).toBe('yyyy-MM-dd HH:mm:ss');
    });
  });

  describe('ReportComponentUnion', () => {
    it('should accept all new component types', () => {
      const comps: ReportComponentUnion[] = [
        { id: 'l1', type: 'line', x: 0, y: 0, width: 50, height: 10, startX: 0, startY: 0, endX: 50, endY: 0, lineColor: '#000', lineWidth: 0.2, lineStyle: 'solid' },
        { id: 's1', type: 'shape', x: 0, y: 0, width: 30, height: 30, shapeType: 'rectangle', fillColor: 'transparent', borderColor: '#000', borderWidth: 0.2, borderStyle: 'solid' },
        { id: 'p1', type: 'pagenumber', x: 0, y: 0, width: 30, height: 15, format: '1/N', font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000' }, textAlign: 'center' },
        { id: 'd1', type: 'datetime', x: 0, y: 0, width: 50, height: 15, format: 'yyyy-MM-dd', font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000' }, textAlign: 'left' },
      ];
      expect(comps).toHaveLength(4);
      expect(comps.map(c => c.type)).toEqual(['line', 'shape', 'pagenumber', 'datetime']);
    });
  });
});
