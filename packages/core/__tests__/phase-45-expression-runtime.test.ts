import { describe, expect, it } from 'vitest';
import { renderReport, renderTemplate } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

const textBase = {
  font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
  textAlign: 'left' as const,
  verticalAlign: 'top' as const,
  border: { style: 'none' as const, width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
  canGrow: false,
  canShrink: false,
};

describe('phase 45 expression runtime extensions', () => {
  it('renders custom expression functions and variables through renderReport', () => {
    const template = makeTemplate([
      band('data', 'data', {
        dataBand: { dataSourceId: 'employees' },
        components: [{
          id: 'discount',
          type: 'text',
          x: 0,
          y: 0,
          width: 120,
          height: 8,
          text: 'CONCAT("Tenant ", {TenantName}, ": ", DISCOUNT({employees.Salary}, 0.8))',
          ...textBase,
        }],
      }),
    ]);

    const document = renderReport(template, { employees: [{ Salary: 200 }] }, {
      expressionVariables: { TenantName: '演示租户' },
      expressionFunctions: {
        DISCOUNT: ([price, rate]) => Number(price) * Number(rate),
      },
    });

    expect(document.pages[0].items[0].components[0].content).toBe('Tenant 演示租户: 160');
  });

  it('uses custom functions and variables when conditional formats are evaluated', () => {
    const template = makeTemplate([
      band('data', 'data', {
        dataBand: { dataSourceId: 'employees' },
        components: [{
          id: 'salary',
          type: 'text',
          conditionalFormat: 'tenant-high',
          x: 0,
          y: 0,
          width: 80,
          height: 8,
          text: '{employees.Salary}',
          ...textBase,
        }],
      }),
    ]);
    template.conditionalFormats = [{
      id: 'tenant-high',
      name: 'Tenant High',
      applyTo: [],
      rules: [{
        id: 'rule',
        expression: 'DISCOUNT({employees.Salary}, 0.8) > {TenantLimit}',
        overrides: { fontColor: '#ff0000' },
      }],
    }];

    const document = renderReport(template, { employees: [{ Salary: 200 }] }, {
      expressionVariables: { TenantLimit: 100 },
      expressionFunctions: {
        DISCOUNT: ([price, rate]) => Number(price) * Number(rate),
      },
    });

    expect(document.pages[0].items[0].components[0].style?.font?.color).toBe('#ff0000');
  });

  it('uses custom functions and variables in data band filters before pagination', () => {
    const template = makeTemplate([
      band('data', 'data', {
        dataBand: {
          dataSourceId: 'employees',
          filterExpression: 'IN_TENANT({employees.Tenant}, {TenantName})',
        },
        components: [{
          id: 'name',
          type: 'text',
          x: 0,
          y: 0,
          width: 80,
          height: 8,
          text: '{employees.Name}',
          ...textBase,
        }],
      }),
    ]);

    const document = renderReport(template, {
      employees: [
        { Name: 'Ada', Tenant: '演示租户' },
        { Name: 'Grace', Tenant: '其他租户' },
      ],
    }, {
      expressionVariables: { TenantName: '演示租户' },
      expressionFunctions: {
        IN_TENANT: ([tenant, currentTenant]) => tenant === currentTenant,
      },
    });

    const contents = document.pages.flatMap(page => page.items.flatMap(item => item.components.map(component => component.content)));
    expect(contents).toEqual(['Ada']);
  });

  it('uses custom functions and variables when resolving subreport parameters', () => {
    const childTemplate = makeTemplate([
      band('child-title', 'reportTitle', {
        components: [{
          id: 'child-param',
          type: 'text',
          x: 0,
          y: 0,
          width: 120,
          height: 8,
          text: '{Parameters.masked}',
          ...textBase,
        }],
      }),
    ]);
    const template = makeTemplate([
      band('orders-band', 'data', {
        dataBand: { dataSourceId: 'employees' },
        components: [{
          id: 'sub',
          type: 'subreport',
          x: 0,
          y: 0,
          width: 120,
          height: 30,
          templateUrl: 'child',
          parameters: {
            masked: 'CONCAT(MASKPHONE({employees.Phone}), " - ", {TenantName})',
          },
        }],
      }),
    ]);

    const document = renderReport(template, { employees: [{ Phone: '13812345678' }] }, {
      subreports: { child: childTemplate },
      expressionVariables: { TenantName: '演示租户' },
      expressionFunctions: {
        MASKPHONE: ([phone]) => String(phone).replace(/^(\d{3})\d{4}(\d+)$/, '$1****$2'),
      },
    });

    const subreport = document.pages[0].items[0].components[0];
    expect(subreport.children[0].content).toBe('138****5678 - 演示租户');
  });

  it('keeps custom expression extensions available to the legacy render tree', () => {
    const template = makeTemplate([
      band('data', 'data', {
        dataBand: { dataSourceId: 'employees' },
        components: [{
          id: 'masked',
          type: 'text',
          x: 0,
          y: 0,
          width: 100,
          height: 8,
          text: 'CONCAT(MASKPHONE({employees.Phone}), " - ", {TenantName})',
          ...textBase,
        }],
      }),
    ]);

    const tree = renderTemplate(template, { employees: [{ Phone: '13812345678' }] }, {
      expressionVariables: { TenantName: '演示租户' },
      expressionFunctions: {
        MASKPHONE: ([phone]) => String(phone).replace(/^(\d{3})\d{4}(\d+)$/, '$1****$2'),
      },
    });

    expect(tree.pages[0].bands[0].components[0].content).toBe('138****5678 - 演示租户');
  });
});
