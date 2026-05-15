import type {
  ReportTemplate, Band, ReportComponent,
  TextComponent, ImageComponent, BarcodeComponent, Padding,
  ConditionalFormat, ReportStyle, FontConfig, BorderConfig, TextFormatConfig,
} from '../template-model/types';
import { evalExpression } from '../expression-engine';
import type { EvalContext } from '../expression-engine/evaluator';
import { applyConditionalFormatsToStyle } from '../conditional-format';

/** A fully resolved/rendered component */
export interface RenderedComponent {
  id: string;
  type: 'text' | 'image' | 'barcode';
  x: number;
  y: number;
  width: number;
  height: number;
  /** Resolved text content (for text components) */
  content?: string;
  /** Resolved image src (for image components) */
  imageSrc?: string;
  /** Resolved barcode value */
  barcodeValue?: string;
  /** Resolved styling */
  style: RenderedStyle;
}

export interface RenderedStyle {
  font?: FontConfig;
  background?: string;
  border?: BorderConfig;
  padding?: Padding;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  format?: TextFormatConfig;
  canGrow?: boolean;
  canShrink?: boolean;
  enabled?: boolean;
}

export interface RenderedBand {
  id: string;
  type: string;
  height: number;
  components: RenderedComponent[];
  /** Band type metadata */
  isDataBand?: boolean;
  isGroupHeader?: boolean;
  isGroupFooter?: boolean;
}

export interface RenderedPage {
  id: string;
  bands: RenderedBand[];
}

export interface RenderTree {
  pages: RenderedPage[];
  templateId: string;
  /** Total pages after pagination */
  totalPages: number;
  /** Rendered data rows per data source */
  rowCount: Record<string, number>;
}

/** Resolve an expression string or return static value */
export function resolveValue(
  value: string | undefined,
  ctx: EvalContext,
): any {
  if (!value) return value;
  // If it looks like an expression
  if (value.includes('{') || value.includes('(') || value.includes('=')) {
    try {
      return evalExpression(value, ctx.resolveField.bind(ctx), ctx.rowIndex, ctx.variables);
    } catch {
      return value;
    }
  }
  return value;
}

/** Look up a style by ID from the template's style list */
function getStyleById(comp: ReportComponent, styles: ReportStyle[]): ReportStyle | undefined {
  if (!comp.style) return undefined;
  return styles.find(s => s.id === comp.style);
}

/** Convert template component to rendered style */
function componentStyleToRendered(comp: ReportComponent, templateStyles: ReportStyle[]): RenderedStyle {
  if (comp.type === 'text') {
    const tc = comp as TextComponent;

    return {
      font: tc.font,
      background: tc.backgroundColor,
      border: tc.border,
      padding: tc.padding,
      textAlign: tc.textAlign,
      verticalAlign: tc.verticalAlign,
      format: tc.format,
      canGrow: tc.canGrow,
      canShrink: tc.canShrink,
    };
  }

  const refStyle = getStyleById(comp, templateStyles);
  if (!refStyle) {
    return {};
  }

  return {
    font: refStyle.font ? {
      family: 'Arial',
      size: 10,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      color: '#000000',
      ...refStyle.font,
    } : undefined,
    background: refStyle.backgroundColor,
    border: refStyle.border ? {
      style: refStyle.border.style ?? 'none',
      width: refStyle.border.width ?? 0,
      color: refStyle.border.color ?? '#000000',
      sides: {
        top: false,
        right: false,
        bottom: false,
        left: false,
        ...(refStyle.border.sides ?? {}),
      },
    } : undefined,
  };
}

/** Render a single component with expression resolution */
function renderComponent(
  comp: ReportComponent,
  ctx: EvalContext,
  formats: ConditionalFormat[],
  templateStyles: ReportStyle[],
): RenderedComponent {
  const baseStyle = componentStyleToRendered(comp, templateStyles);
  const style = applyConditionalFormatsToStyle(baseStyle, formats, comp, ctx);

  const rendered: RenderedComponent = {
    id: comp.id,
    type: comp.type as 'text' | 'image' | 'barcode',
    x: comp.x,
    y: comp.y,
    width: comp.width,
    height: comp.height,
    style,
  };

  if (comp.type === 'text') {
    const textComp = comp as TextComponent;
    const resolved = resolveValue(textComp.text, ctx);
    rendered.content = resolved != null ? String(resolved) : '';
  }

  if (comp.type === 'image') {
    const imgComp = comp as ImageComponent;
    const resolved = resolveValue(imgComp.src, ctx);
    rendered.imageSrc = resolved ? String(resolved) : '';
  }

  if (comp.type === 'barcode') {
    const bcComp = comp as BarcodeComponent;
    const resolved = resolveValue(bcComp.value, ctx);
    rendered.barcodeValue = resolved ? String(resolved) : '';
  }

  return rendered;
}

/** Render a single band */
function renderBand(
  band: Band,
  ctx: EvalContext,
  formats: ConditionalFormat[],
  templateStyles: ReportStyle[],
): RenderedBand {
  const components = band.components
    .map(c => renderComponent(c, ctx, formats, templateStyles))
    .filter(component => component.style.enabled !== false);
  return {
    id: band.id,
    type: band.type,
    height: band.height,
    components,
    isDataBand: band.type === 'data',
    isGroupHeader: band.type === 'groupHeader',
    isGroupFooter: band.type === 'groupFooter',
  };
}

/** Main renderer: produces a RenderTree from template + data */
export function renderTemplate(
  template: ReportTemplate,
  data: Record<string, any[]>,
): RenderTree {
  const formats = template.conditionalFormats || [];
  const templateStyles = template.styles || [];
  const pages: RenderedPage[] = [];
  const rowCount: Record<string, number> = {};

  for (const page of template.pages) {
    const renderedBands: RenderedBand[] = [];

    for (const band of page.bands) {
      // Static bands (title, header, footer) - render once with no data context
      if (band.type === 'reportTitle' || band.type === 'pageHeader' || band.type === 'pageFooter') {
        const ctx: EvalContext = {
          resolveField: () => null,
          rowIndex: 0,
          variables: {},
        };
        renderedBands.push(renderBand(band, ctx, formats, templateStyles));
        continue;
      }

      // Data band - render per row
      if (band.type === 'data' && band.dataBand?.dataSourceId) {
        const sourceId = band.dataBand.dataSourceId;
        const rows = data[sourceId] || [];
        rowCount[sourceId] = (rowCount[sourceId] || 0) + rows.length;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const ctx: EvalContext = {
            resolveField: (source: string, field: string) => {
              if (source && row[source] && typeof row[source] === 'object') {
                return row[source][field];
              }
              return row[field] ?? row[source] ?? null;
            },
            rowIndex: i,
            variables: { rowIndex: i, row: row },
          };
          renderedBands.push(renderBand(band, ctx, formats, templateStyles));
        }
        continue;
      }

      // Default: render once
      const ctx: EvalContext = {
        resolveField: () => null,
        rowIndex: 0,
        variables: {},
      };
      renderedBands.push(renderBand(band, ctx, formats, templateStyles));
    }

    pages.push({
      id: page.id,
      bands: renderedBands,
    });
  }

  return {
    pages,
    templateId: template.id,
    totalPages: pages.length,
    rowCount,
  };
}

/** Get a summary of the render tree for debugging */
export function renderTreeSummary(tree: RenderTree): string {
  const lines: string[] = [];
  for (const page of tree.pages) {
    lines.push(`Page ${page.id}:`);
    for (const band of page.bands) {
      lines.push(`  Band ${band.id} (${band.type}): ${band.components.length} components`);
    }
  }
  return lines.join('\n');
}
