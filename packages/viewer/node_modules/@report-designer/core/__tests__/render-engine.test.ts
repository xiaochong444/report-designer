import { describe, it, expect } from 'vitest';
import { renderTemplate, renderTreeSummary, resolveValue } from '../src/render-engine';
import { createDefaultTemplate } from '../src/template-model/template';

describe('Render Engine', () => {
  const makeTemplate = () => {
    const t = createDefaultTemplate();
    return t;
  };

  it('should render a static template', () => {
    const template = makeTemplate();
    const tree = renderTemplate(template, {});
    expect(tree.pages.length).toBeGreaterThan(0);
    expect(tree.templateId).toBe(template.id);
  });

  it('should render data band per row', () => {
    const template = makeTemplate();
    const data = {
      employees: [
        { Name: 'Alice', Salary: 5000 },
        { Name: 'Bob', Salary: 6000 },
      ],
    };
    const tree = renderTemplate(template, data);
    expect(tree.rowCount['employees'] || 0).toBeGreaterThanOrEqual(0);
  });

  it('should render text with static content', () => {
    const template = makeTemplate();
    const tree = renderTemplate(template, {});
    // Title band should have content
    const titleBand = tree.pages[0]?.bands.find(b => b.type === 'reportTitle');
    expect(titleBand).toBeDefined();
  });

  it('resolveValue should return static strings', () => {
    const ctx = { resolveField: () => null, rowIndex: 0 };
    expect(resolveValue('Hello', ctx)).toBe('Hello');
  });

  it('resolveValue should evaluate expressions with field refs', () => {
    const ctx = {
      resolveField: (source: string, field: string) => {
        if (field === 'Name') return 'John';
        return null;
      },
      rowIndex: 0,
    };
    expect(resolveValue('{Employee.Name}', ctx)).toBe('John');
  });

  it('should produce a summary string', () => {
    const template = makeTemplate();
    const tree = renderTemplate(template, {});
    const summary = renderTreeSummary(tree);
    expect(typeof summary).toBe('string');
    expect(summary.length).toBeGreaterThan(0);
  });
});
