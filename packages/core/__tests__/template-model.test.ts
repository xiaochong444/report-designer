import { describe, it, expect } from 'vitest';
import { createDefaultTemplate, validateTemplate } from '../src/template-model';
import type { TextComponent, Band } from '../src/template-model';

describe('template-model', () => {
  describe('createDefaultTemplate', () => {
    it('should create a template with default A4 page', () => {
      const template = createDefaultTemplate();
      expect(template.version).toBe('1.0');
      expect(template.pages).toHaveLength(1);
      expect(template.pages[0].width).toBe(210);
      expect(template.pages[0].height).toBe(297);
      expect(template.pages[0].orientation).toBe('portrait');
      expect(template.pages[0].margins).toEqual({
        top: 20, right: 20, bottom: 20, left: 20
      });
    });

    it('should create template with default bands', () => {
      const template = createDefaultTemplate();
      const bandTypes = template.pages[0].bands.map(b => b.type);
      expect(bandTypes).toContain('reportTitle');
      expect(bandTypes).toContain('pageHeader');
      expect(bandTypes).toContain('data');
      expect(bandTypes).toContain('pageFooter');
    });

    it('should create template with empty dataSources and default text styles', () => {
      const template = createDefaultTemplate();
      expect(template.dataSources).toEqual([]);
      expect(template.styles.map(style => style.name)).toEqual([
        'Normal',
        'Title',
        'Header',
        'Data',
        'Footer',
        'Group',
      ]);
      expect(template.styles.filter(style => style.isDefault)).toHaveLength(1);
      expect(template.styles.find(style => style.name === 'Header')?.border.style).toBe('solid');
      expect(template.styles.find(style => style.name === 'Footer')?.border.style).toBe('solid');
      expect(template.conditionalFormats).toEqual([]);
    });
  });

  describe('validateTemplate', () => {
    it('should pass for a valid template', () => {
      const template = createDefaultTemplate();
      const result = validateTemplate(template);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for template without pages', () => {
      const template = createDefaultTemplate();
      template.pages = [];
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('pages');
    });

    it('should fail for page with zero dimensions', () => {
      const template = createDefaultTemplate();
      template.pages[0].width = 0;
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
    });

    it('should fail for component with negative dimensions', () => {
      const template = createDefaultTemplate();
      const textComp: TextComponent = {
        id: 'test-1',
        type: 'text',
        x: 10, y: 10,
        width: -5, height: 10,
        text: 'Hello',
        font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, color: '#000000' },
        textAlign: 'left',
        verticalAlign: 'top',
        border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
        canGrow: false,
        canShrink: false,
      };
      template.pages[0].bands[0].components.push(textComp);
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
    });

    it('should fail for band with duplicate id', () => {
      const template = createDefaultTemplate();
      const band: Band = {
        id: template.pages[0].bands[0].id,
        type: 'reportSummary',
        height: 30,
        components: [],
      };
      template.pages[0].bands.push(band);
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
    });
  });
});
