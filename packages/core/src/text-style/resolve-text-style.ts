import type {
  BorderConfig,
  FontConfig,
  Padding,
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

export function resolveTextStyle(component: TextStyleSource, styles: ReportStyle[]): ResolvedTextStyle {
  const style = getTextStyleById(styles, component.style) ?? getDefaultTextStyle(styles);

  const mergedFromStyle: ResolvedTextStyle = {
    font: mergeFont(DEFAULT_TEXT_STYLE.font, style?.font),
    border: mergeBorder(DEFAULT_TEXT_STYLE.border, style?.border),
    backgroundColor: style?.backgroundColor ?? DEFAULT_TEXT_STYLE.backgroundColor,
    textAlign: style?.textAlign ?? DEFAULT_TEXT_STYLE.textAlign,
    verticalAlign: style?.verticalAlign ?? DEFAULT_TEXT_STYLE.verticalAlign,
    padding: mergePadding(DEFAULT_TEXT_STYLE.padding, style?.padding),
    format: style?.format,
    canGrow: style?.canGrow ?? DEFAULT_TEXT_STYLE.canGrow,
    canShrink: style?.canShrink ?? DEFAULT_TEXT_STYLE.canShrink,
  };

  return {
    font: mergeFont(mergedFromStyle.font, component.font),
    border: mergeBorder(mergedFromStyle.border, component.border),
    backgroundColor: component.backgroundColor ?? mergedFromStyle.backgroundColor,
    textAlign: component.textAlign ?? mergedFromStyle.textAlign,
    verticalAlign: component.verticalAlign ?? mergedFromStyle.verticalAlign,
    padding: mergePadding(mergedFromStyle.padding, component.padding),
    format: component.format ?? mergedFromStyle.format,
    canGrow: component.canGrow ?? mergedFromStyle.canGrow,
    canShrink: component.canShrink ?? mergedFromStyle.canShrink,
  };
}
