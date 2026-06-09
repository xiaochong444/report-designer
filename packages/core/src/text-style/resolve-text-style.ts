import type {
  BorderConfig,
  FontConfig,
  Padding,
  ReportComponent,
  ReportStyle,
  TextAlign,
  TextComponent,
  TextFormatConfig,
  VerticalAlign,
} from '../template-model/types';

export interface ResolvedTextStyle {
  font: FontConfig;
  border: BorderConfig;
  backgroundColor: string;
  textAlign: TextAlign;
  verticalAlign: VerticalAlign;
  padding: Padding;
  format?: TextFormatConfig;
  canGrow: boolean;
  canShrink: boolean;
}

export interface ResolvedComponentStyle {
  font?: FontConfig;
  border?: BorderConfig;
  backgroundColor?: string;
  textAlign?: TextAlign;
  verticalAlign?: VerticalAlign;
  padding?: Padding;
  format?: TextFormatConfig;
  canGrow?: boolean;
  canShrink?: boolean;
}

export type PartialBorderSides = Partial<BorderConfig['sides']>;

export type PartialBorderConfig = Omit<Partial<BorderConfig>, 'sides'> & {
  sides?: PartialBorderSides;
};

export interface TextStyleSource {
  style?: TextComponent['style'];
  font?: Partial<FontConfig>;
  border?: PartialBorderConfig;
  backgroundColor?: string;
  textAlign?: TextAlign;
  verticalAlign?: VerticalAlign;
  padding?: Partial<Padding>;
  format?: TextFormatConfig;
  canGrow?: boolean;
  canShrink?: boolean;
}

export type ComponentStyleSource = Pick<ReportComponent, 'type' | 'style' | 'backgroundColor' | 'border' | 'padding'> & {
  font?: Partial<FontConfig>;
  textAlign?: TextAlign;
  verticalAlign?: VerticalAlign;
  format?: TextFormatConfig;
  canGrow?: boolean;
  canShrink?: boolean;
};

type StyleField = keyof ResolvedComponentStyle;

const DEFAULT_FONT: FontConfig = {
  family: 'Arial',
  size: 10,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  color: '#000000',
};

const DEFAULT_BORDER: BorderConfig = {
  style: 'none',
  width: 0,
  color: '#000000',
  sides: {
    top: false,
    right: false,
    bottom: false,
    left: false,
  },
};

const DEFAULT_PADDING: Padding = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

const DEFAULT_TEXT_STYLE: ResolvedTextStyle = {
  font: DEFAULT_FONT,
  border: DEFAULT_BORDER,
  backgroundColor: 'transparent',
  textAlign: 'left',
  verticalAlign: 'top',
  padding: DEFAULT_PADDING,
  canGrow: false,
  canShrink: false,
};

const COMPONENT_STYLE_FIELDS: Partial<Record<ReportComponent['type'], StyleField[]>> = {
  text: ['font', 'border', 'backgroundColor', 'textAlign', 'verticalAlign', 'padding', 'format', 'canGrow', 'canShrink'],
  barcode: ['font', 'border', 'backgroundColor', 'padding'],
  checkbox: ['font', 'border', 'backgroundColor', 'padding'],
  pagenumber: ['font', 'border', 'backgroundColor', 'textAlign', 'verticalAlign', 'padding', 'format'],
  datetime: ['font', 'border', 'backgroundColor', 'textAlign', 'verticalAlign', 'padding', 'format'],
  image: ['border', 'backgroundColor', 'padding'],
  chart: ['border', 'backgroundColor', 'padding'],
  panel: ['border', 'backgroundColor', 'padding'],
  richtext: ['backgroundColor', 'padding'],
  subreport: ['backgroundColor', 'padding'],
  table: ['font', 'border', 'backgroundColor', 'textAlign', 'verticalAlign', 'padding', 'format'],
};

function isTextStyle(style: ReportStyle): boolean {
  return style.category === undefined || style.category === 'text';
}

function mergeFont(base: FontConfig, override?: Partial<FontConfig>): FontConfig {
  return override ? { ...base, ...override } : { ...base };
}

function mergeBorder(base: BorderConfig, override?: PartialBorderConfig): BorderConfig {
  return {
    ...base,
    ...override,
    sides: {
      ...base.sides,
      ...override?.sides,
    },
  };
}

function mergePadding(base: Padding, override?: Partial<Padding>): Padding {
  return override ? { ...base, ...override } : { ...base };
}

export function getTextStyleById(styles: ReportStyle[], id?: string): ReportStyle | undefined {
  if (!id) {
    return undefined;
  }

  return styles.find(style => style.id === id && isTextStyle(style));
}

export function getDefaultTextStyle(styles: ReportStyle[]): ReportStyle | undefined {
  return styles.find(style => isTextStyle(style) && style.isDefault);
}

export function getComponentStyleById(styles: ReportStyle[], id?: string): ReportStyle | undefined {
  if (!id) {
    return undefined;
  }

  return styles.find(style => style.id === id && isTextStyle(style));
}

export function getComponentStyleFields(type: ReportComponent['type']): StyleField[] {
  return COMPONENT_STYLE_FIELDS[type] ?? [];
}

export function supportsComponentStyle(component: Pick<ReportComponent, 'type'>): boolean {
  return getComponentStyleFields(component.type).length > 0;
}

export function componentStyleHasField(component: Pick<ReportComponent, 'type'>, field: StyleField): boolean {
  return getComponentStyleFields(component.type).includes(field);
}

export function resolveComponentStyle(component: ComponentStyleSource, styles: ReportStyle[]): ResolvedComponentStyle {
  const fields = getComponentStyleFields(component.type);
  const referencedStyle = getComponentStyleById(styles, component.style);
  const source = referencedStyle ?? component;
  const resolved: ResolvedComponentStyle = {};

  if (fields.includes('font') && source.font) {
    resolved.font = mergeFont(DEFAULT_TEXT_STYLE.font, source.font);
  }
  if (fields.includes('border') && source.border) {
    resolved.border = mergeBorder(DEFAULT_TEXT_STYLE.border, source.border);
  }
  if (fields.includes('backgroundColor') && source.backgroundColor !== undefined) {
    resolved.backgroundColor = source.backgroundColor;
  }
  if (fields.includes('textAlign') && source.textAlign !== undefined) {
    resolved.textAlign = source.textAlign;
  }
  if (fields.includes('verticalAlign') && source.verticalAlign !== undefined) {
    resolved.verticalAlign = source.verticalAlign;
  }
  if (fields.includes('padding') && source.padding) {
    resolved.padding = mergePadding(DEFAULT_TEXT_STYLE.padding, source.padding);
  }
  if (fields.includes('format') && source.format !== undefined) {
    resolved.format = source.format;
  }
  if (fields.includes('canGrow') && source.canGrow !== undefined) {
    resolved.canGrow = source.canGrow;
  }
  if (fields.includes('canShrink') && source.canShrink !== undefined) {
    resolved.canShrink = source.canShrink;
  }

  return resolved;
}

export function resolveTextStyle(component: TextStyleSource, styles: ReportStyle[]): ResolvedTextStyle {
  const referencedStyle = getTextStyleById(styles, component.style);

  if (referencedStyle) {
    return {
      font: mergeFont(DEFAULT_TEXT_STYLE.font, referencedStyle.font),
      border: mergeBorder(DEFAULT_TEXT_STYLE.border, referencedStyle.border),
      backgroundColor: referencedStyle.backgroundColor ?? DEFAULT_TEXT_STYLE.backgroundColor,
      textAlign: referencedStyle.textAlign ?? DEFAULT_TEXT_STYLE.textAlign,
      verticalAlign: referencedStyle.verticalAlign ?? DEFAULT_TEXT_STYLE.verticalAlign,
      padding: mergePadding(DEFAULT_TEXT_STYLE.padding, referencedStyle.padding),
      format: referencedStyle.format,
      canGrow: referencedStyle.canGrow ?? DEFAULT_TEXT_STYLE.canGrow,
      canShrink: referencedStyle.canShrink ?? DEFAULT_TEXT_STYLE.canShrink,
    };
  }

  return {
    font: mergeFont(DEFAULT_TEXT_STYLE.font, component.font),
    border: mergeBorder(DEFAULT_TEXT_STYLE.border, component.border),
    backgroundColor: component.backgroundColor ?? DEFAULT_TEXT_STYLE.backgroundColor,
    textAlign: component.textAlign ?? DEFAULT_TEXT_STYLE.textAlign,
    verticalAlign: component.verticalAlign ?? DEFAULT_TEXT_STYLE.verticalAlign,
    padding: mergePadding(DEFAULT_TEXT_STYLE.padding, component.padding),
    format: component.format,
    canGrow: component.canGrow ?? DEFAULT_TEXT_STYLE.canGrow,
    canShrink: component.canShrink ?? DEFAULT_TEXT_STYLE.canShrink,
  };
}
