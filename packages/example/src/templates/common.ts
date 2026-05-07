import type { BorderConfig, FontConfig, ReportBandV2, ReportStyleV2, ReportTemplateV2, TextComponentV2 } from '@report-designer/core';

type TextOptions = Omit<Partial<TextComponentV2>, 'font' | 'border'> & {
  font?: Partial<FontConfig>;
  border?: BorderConfig;
};

export const dataFields = {
  employees: [
    field('employees.id', 'id', 'number'),
    field('employees.name', 'name', 'string'),
    field('employees.department', 'department', 'string'),
    field('employees.salary', 'salary', 'number'),
    field('employees.hireDate', 'hireDate', 'date'),
  ],
  invoiceLines: [
    field('invoiceLines.sku', 'sku', 'string'),
    field('invoiceLines.name', 'name', 'string'),
    field('invoiceLines.qty', 'qty', 'number'),
    field('invoiceLines.unitPrice', 'unitPrice', 'number'),
    field('invoiceLines.lineTotal', 'lineTotal', 'number'),
  ],
  orderLines: [
    field('orderLines.orderNo', 'orderNo', 'string'),
    field('orderLines.customer', 'customer', 'string'),
    field('orderLines.orderDate', 'orderDate', 'date'),
    field('orderLines.sku', 'sku', 'string'),
    field('orderLines.name', 'name', 'string'),
    field('orderLines.qty', 'qty', 'number'),
    field('orderLines.unitPrice', 'unitPrice', 'number'),
    field('orderLines.lineTotal', 'lineTotal', 'number'),
  ],
};

export const commonTextStyleIds = {
  title: 'text-title',
  pageHeader: 'text-page-header',
  header: 'text-header',
  data: 'text-data',
  footer: 'text-footer',
  group: 'text-group',
} as const;

export const commonTextStyles: ReportStyleV2[] = [
  {
    id: commonTextStyleIds.title,
    name: 'Title',
    category: 'text',
    font: { size: 15, bold: true },
    backgroundColor: 'transparent',
    verticalAlign: 'middle',
  },
  {
    id: commonTextStyleIds.pageHeader,
    name: 'Page Header',
    category: 'text',
    font: { size: 8, color: '#4b5563' },
    backgroundColor: 'transparent',
    verticalAlign: 'middle',
  },
  {
    id: commonTextStyleIds.header,
    name: 'Header',
    category: 'text',
    font: { bold: true },
    backgroundColor: 'transparent',
    verticalAlign: 'middle',
  },
  {
    id: commonTextStyleIds.data,
    name: 'Data',
    category: 'text',
    font: { size: 9, color: '#1f2937' },
    backgroundColor: 'transparent',
    verticalAlign: 'middle',
    isDefault: true,
  },
  {
    id: commonTextStyleIds.footer,
    name: 'Footer',
    category: 'text',
    font: { size: 9, color: '#1f2937' },
    backgroundColor: 'transparent',
    verticalAlign: 'middle',
  },
  {
    id: commonTextStyleIds.group,
    name: 'Group',
    category: 'text',
    font: { bold: true, color: '#0f4c9c' },
    backgroundColor: 'transparent',
    verticalAlign: 'middle',
  },
];

export function template(
  id: string,
  name: string,
  bands: ReportBandV2[],
  height = 297,
  extraStyles: ReportStyleV2[] = [],
): ReportTemplateV2 {
  const styles = cloneStyles([...commonTextStyles, ...extraStyles]);

  return {
    id,
    name,
    version: '2.0',
    pages: [
      {
        id: `${id}-page`,
        width: 210,
        height,
        margins: { top: 8, right: 10, bottom: 8, left: 10 },
        orientation: 'portrait',
        bands: syncBandsWithTextStyles(bands, styles),
      },
    ],
    dataSources: [
      { id: 'employees', name: 'employees', type: 'json', path: 'employees', fields: dataFields.employees },
      { id: 'invoiceLines', name: 'invoiceLines', type: 'json', path: 'invoiceLines', fields: dataFields.invoiceLines },
      { id: 'orderLines', name: 'orderLines', type: 'json', path: 'orderLines', fields: dataFields.orderLines },
    ],
    styles,
    conditionalFormats: [],
    parameters: [],
  };
}

export function band(id: string, type: ReportBandV2['type'], height: number, components: TextComponentV2[] = [], overrides: Partial<ReportBandV2> = {}): ReportBandV2 {
  return {
    id,
    type,
    height,
    components,
    behavior: {
      enabled: true,
      printOn: 'allPages',
      printIfEmpty: true,
      printOnAllPages: type === 'pageHeader' || type === 'pageFooter' || type === 'groupHeader',
      keepTogether: false,
      canBreak: type === 'data' || type === 'child',
      printAtBottom: type === 'pageFooter',
    },
    ...overrides,
  };
}

export function text(id: string, content: string, x: number, y: number, width: number, height: number, options: TextOptions = {}): TextComponentV2 {
  return {
    id,
    type: 'text',
    x,
    y,
    width,
    height,
    text: content,
    font: {
      family: 'Arial',
      size: 9,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      color: '#1f2937',
      ...options.font,
    },
    textAlign: options.textAlign ?? 'left',
    verticalAlign: options.verticalAlign ?? 'middle',
    border: options.border ?? {
      style: 'none',
      width: 0,
      color: '#cfd6df',
      sides: { top: false, right: false, bottom: false, left: false },
    },
    canGrow: options.canGrow ?? false,
    canShrink: options.canShrink ?? false,
    ...options,
  };
}

export function moneyExpression(source: string, fieldName: string): string {
  return `FORMAT("N2", {${source}.${fieldName}})`;
}

function field(id: string, name: string, type: 'string' | 'number' | 'date' | 'boolean') {
  return { id, name, path: id, type, nullable: false };
}

function cloneStyles(styles: ReportStyleV2[]): ReportStyleV2[] {
  return styles.map(style => ({
    ...style,
    font: style.font ? { ...style.font } : undefined,
    border: style.border ? {
      ...style.border,
      sides: style.border.sides ? { ...style.border.sides } : undefined,
    } : undefined,
    padding: style.padding ? { ...style.padding } : undefined,
  }));
}

function syncBandsWithTextStyles(bands: ReportBandV2[], styles: ReportStyleV2[]): ReportBandV2[] {
  return bands.map(bandDefinition => ({
    ...bandDefinition,
    components: bandDefinition.components.map(component => (
      component.type === 'text'
        ? applyTextStyleSnapshot(component, styles)
        : component
    )),
  }));
}

function applyTextStyleSnapshot(component: TextComponentV2, styles: ReportStyleV2[]): TextComponentV2 {
  if (!component.style) {
    return component;
  }

  const style = styles.find(candidate => (
    candidate.id === component.style
    && (candidate.category === undefined || candidate.category === 'text')
  ));

  if (!style) {
    return component;
  }

  const next: TextComponentV2 = {
    ...component,
    font: { ...component.font },
    border: {
      ...component.border,
      sides: { ...component.border.sides },
    },
    padding: component.padding ? { ...component.padding } : undefined,
    format: component.format ? { ...component.format } : undefined,
  };
  const bindings: string[] = [];

  if (style.font) {
    if (style.font.family !== undefined) {
      next.font.family = style.font.family;
      bindings.push('font.family');
    }
    if (style.font.size !== undefined) {
      next.font.size = style.font.size;
      bindings.push('font.size');
    }
    if (style.font.bold !== undefined) {
      next.font.bold = style.font.bold;
      bindings.push('font.bold');
    }
    if (style.font.italic !== undefined) {
      next.font.italic = style.font.italic;
      bindings.push('font.italic');
    }
    if (style.font.underline !== undefined) {
      next.font.underline = style.font.underline;
      bindings.push('font.underline');
    }
    if (style.font.strikethrough !== undefined) {
      next.font.strikethrough = style.font.strikethrough;
      bindings.push('font.strikethrough');
    }
    if (style.font.color !== undefined) {
      next.font.color = style.font.color;
      bindings.push('font.color');
    }
  }

  if (style.backgroundColor !== undefined) {
    next.backgroundColor = style.backgroundColor;
    bindings.push('backgroundColor');
  }

  if (style.textAlign !== undefined) {
    next.textAlign = style.textAlign;
    bindings.push('textAlign');
  }

  if (style.verticalAlign !== undefined) {
    next.verticalAlign = style.verticalAlign;
    bindings.push('verticalAlign');
  }

  if (style.border) {
    if (style.border.style !== undefined) {
      next.border.style = style.border.style;
      bindings.push('border.style');
    }
    if (style.border.width !== undefined) {
      next.border.width = style.border.width;
      bindings.push('border.width');
    }
    if (style.border.color !== undefined) {
      next.border.color = style.border.color;
      bindings.push('border.color');
    }
    if (style.border.sides?.top !== undefined) {
      next.border.sides.top = style.border.sides.top;
      bindings.push('border.sides.top');
    }
    if (style.border.sides?.right !== undefined) {
      next.border.sides.right = style.border.sides.right;
      bindings.push('border.sides.right');
    }
    if (style.border.sides?.bottom !== undefined) {
      next.border.sides.bottom = style.border.sides.bottom;
      bindings.push('border.sides.bottom');
    }
    if (style.border.sides?.left !== undefined) {
      next.border.sides.left = style.border.sides.left;
      bindings.push('border.sides.left');
    }
  }

  if (style.padding) {
    const padding = next.padding ?? { top: 0, right: 0, bottom: 0, left: 0 };

    if (style.padding.top !== undefined) {
      padding.top = style.padding.top;
      bindings.push('padding.top');
    }
    if (style.padding.right !== undefined) {
      padding.right = style.padding.right;
      bindings.push('padding.right');
    }
    if (style.padding.bottom !== undefined) {
      padding.bottom = style.padding.bottom;
      bindings.push('padding.bottom');
    }
    if (style.padding.left !== undefined) {
      padding.left = style.padding.left;
      bindings.push('padding.left');
    }

    next.padding = padding;
  }

  if (style.format) {
    const format = next.format ?? { type: 'none' as const };

    if (style.format.type !== undefined) {
      format.type = style.format.type;
      bindings.push('format.type');
    }
    if (style.format.pattern !== undefined) {
      format.pattern = style.format.pattern;
      bindings.push('format.pattern');
    }
    if (style.format.nullValue !== undefined) {
      format.nullValue = style.format.nullValue;
      bindings.push('format.nullValue');
    }
    if (style.format.trueText !== undefined) {
      format.trueText = style.format.trueText;
      bindings.push('format.trueText');
    }
    if (style.format.falseText !== undefined) {
      format.falseText = style.format.falseText;
      bindings.push('format.falseText');
    }

    next.format = format;
  }

  if (style.canGrow !== undefined) {
    next.canGrow = style.canGrow;
    bindings.push('canGrow');
  }

  if (style.canShrink !== undefined) {
    next.canShrink = style.canShrink;
    bindings.push('canShrink');
  }

  if (bindings.length > 0) {
    next.styleBindings = bindings;
  } else {
    delete next.styleBindings;
  }

  return next;
}
