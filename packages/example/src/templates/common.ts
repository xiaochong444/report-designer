import { isRepeatOnEveryPageBandType, resolveTextStyle, type BorderConfig, type FontConfig, type Band, type ReportComponent, type ReportStyle, type ReportTemplate, type TextComponent } from '@report-designer/core';

type TextOptions = Omit<Partial<TextComponent>, 'font' | 'border'> & {
  font?: Partial<FontConfig>;
  border?: BorderConfig;
};

export const commonTextStyleIds = {
  title: 'text-title',
  pageHeader: 'text-page-header',
  header: 'text-header',
  headerRight: 'text-header-right',
  data: 'text-data',
  dataGrow: 'text-data-grow',
  dataBottomBorder: 'text-data-bottom-border',
  dataRight: 'text-data-right',
  footer: 'text-footer',
  footerCenter: 'text-footer-center',
  footerRight: 'text-footer-right',
  group: 'text-group',
} as const;

export const commonTextStyles: ReportStyle[] = [
  {
    id: commonTextStyleIds.title,
    name: 'Title',
    category: 'text',
    font: { size: 15, bold: true },
    backgroundColor: 'transparent',
    textAlign: 'center',
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
    id: commonTextStyleIds.headerRight,
    name: 'Header Right',
    category: 'text',
    font: { bold: true },
    backgroundColor: 'transparent',
    textAlign: 'right',
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
    id: commonTextStyleIds.dataRight,
    name: 'Data Right',
    category: 'text',
    font: { size: 9, color: '#1f2937' },
    backgroundColor: 'transparent',
    textAlign: 'right',
    verticalAlign: 'middle',
  },
  {
    id: commonTextStyleIds.dataGrow,
    name: 'Data Grow',
    category: 'text',
    font: { size: 9, color: '#1f2937' },
    backgroundColor: 'transparent',
    verticalAlign: 'middle',
    canGrow: true,
  },
  {
    id: commonTextStyleIds.dataBottomBorder,
    name: 'Data Bottom Border',
    category: 'text',
    font: { size: 9, color: '#1f2937' },
    backgroundColor: 'transparent',
    verticalAlign: 'middle',
    border: {
      style: 'solid',
      width: 0.2,
      color: '#9ca3af',
      sides: { top: false, right: false, bottom: true, left: false },
    },
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
    id: commonTextStyleIds.footerCenter,
    name: 'Footer Center',
    category: 'text',
    font: { size: 9, color: '#1f2937' },
    backgroundColor: 'transparent',
    textAlign: 'center',
    verticalAlign: 'middle',
  },
  {
    id: commonTextStyleIds.footerRight,
    name: 'Footer Right',
    category: 'text',
    font: { size: 9, color: '#1f2937' },
    backgroundColor: 'transparent',
    textAlign: 'right',
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
  bands: Band[],
  height = 297,
  extraStyles: ReportStyle[] = [],
): ReportTemplate {
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
    dataSources: [],
    styles,
    conditionalFormats: [],
    parameters: [],
  };
}

export function band(id: string, type: Band['type'], height: number, components: ReportComponent[] = [], overrides: Partial<Band> = {}): Band {
  return {
    id,
    type,
    height,
    components,
    behavior: {
      enabled: true,
      printOn: 'allPages',
      printIfEmpty: true,
      printOnAllPages: isRepeatOnEveryPageBandType(type),
      keepTogether: false,
      canBreak: type === 'data',
      printAtBottom: type === 'pageFooter',
    },
    ...overrides,
  };
}

export function text(id: string, content: string, x: number, y: number, width: number, height: number, options: TextOptions = {}): TextComponent {
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

function cloneStyles(styles: ReportStyle[]): ReportStyle[] {
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

function syncBandsWithTextStyles(bands: Band[], styles: ReportStyle[]): Band[] {
  return bands.map(bandDefinition => ({
    ...bandDefinition,
    components: bandDefinition.components.map(component => (
      component.type === 'text'
        ? applyTextStyleSnapshot(component, styles)
        : component
    )),
  }));
}

function applyTextStyleSnapshot(component: TextComponent, styles: ReportStyle[]): TextComponent {
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

  const resolved = resolveTextStyle(component, styles);
  return {
    ...component,
    font: resolved.font,
    border: resolved.border,
    backgroundColor: resolved.backgroundColor,
    textAlign: resolved.textAlign,
    verticalAlign: resolved.verticalAlign,
    padding: resolved.padding,
    format: resolved.format,
    canGrow: resolved.canGrow,
    canShrink: resolved.canShrink,
  };
}
