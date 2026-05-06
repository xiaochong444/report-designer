import { evalExpression } from '../expression-engine/evaluator';
import { AggregateRuntime } from '../aggregate-engine';
import type { RenderContextV2 } from '../band-planner/band-plan';
import type { RenderBandBox, RenderComponentBox } from '../render-document/types';
import type { ReportBandV2, ReportComponentV2, ReportStyleV2, TextComponentV2 } from '../template-model/v2-types';
import { formatValue } from '../text-format';
import { measureTextBox } from './measure';

export interface LayoutBandOptions {
  x: number;
  y: number;
  width: number;
  context: RenderContextV2;
  rowsByBand?: Record<string, Record<string, unknown>[]>;
  pageRowsByBand?: Record<string, Record<string, unknown>[]>;
  styles?: ReportStyleV2[];
}

export function layoutBand(band: ReportBandV2, options: LayoutBandOptions): RenderBandBox {
  const components = band.components.map((component) => layoutComponent(component, band, options));
  const contentHeight = components.reduce((height, component) => Math.max(height, component.y - options.y + component.height), band.height);

  return {
    id: `${band.id}-${options.y}`,
    bandId: band.id,
    bandType: band.type,
    x: options.x,
    y: options.y,
    width: options.width,
    height: Math.max(band.height, contentHeight),
    components,
    overflow: components.some((component) => component.overflow),
  };
}

function layoutComponent(component: ReportComponentV2, band: ReportBandV2, options: LayoutBandOptions): RenderComponentBox {
  if (component.type === 'text' && 'text' in component) {
    const effective = resolveTextComponentStyle(component as TextComponentV2, options.styles ?? []);
    const text = resolveText(component, options.context, options.rowsByBand ?? {}, options.pageRowsByBand ?? {});
    const measured = measureTextBox(effective, text);
    return {
      id: component.id,
      type: 'text',
      x: options.x + component.x,
      y: options.y + component.y,
      width: component.width,
      height: measured.height,
      content: text,
      overflow: measured.overflow,
      style: {
        font: effective.font,
        border: effective.border,
        backgroundColor: effective.backgroundColor,
        textAlign: effective.textAlign,
        verticalAlign: effective.verticalAlign,
      },
    };
  }

  return {
    id: component.id,
    type: component.type,
    x: options.x + component.x,
    y: options.y + component.y,
    width: component.width,
    height: component.height,
  };
}

function resolveText(
  component: TextComponentV2,
  context: RenderContextV2,
  rowsByBand: Record<string, Record<string, unknown>[]>,
  pageRowsByBand: Record<string, Record<string, unknown>[]>,
): string {
  if (component.text.includes('{PageNumber}') || component.text.includes('{TotalPages}')) {
    return component.text;
  }

  if (!component.text.includes('{') && !component.text.includes('(') && !component.text.includes('=')) {
    return component.text;
  }

  try {
    const value = evalExpression(
      component.text,
      (source, field) => resolveField(context, source, field),
      context.rowIndex,
      { row: context.row, groupValues: context.groupValues },
      new AggregateRuntime({ rowsByBand: context.rowsByBand ?? rowsByBand, pageRowsByBand }),
    );
    return formatValue(value, component.format);
  } catch {
    return component.text;
  }
}

function resolveTextComponentStyle(component: TextComponentV2, styles: ReportStyleV2[]): TextComponentV2 {
  const style = component.style ? styles.find(item => item.id === component.style) : undefined;
  if (!style) return component;

  return {
    ...component,
    font: {
      ...component.font,
      ...(style.font ?? {}),
    },
    border: {
      ...component.border,
      ...(style.border ?? {}),
      sides: {
        ...component.border.sides,
        ...(style.border?.sides ?? {}),
      },
    },
    backgroundColor: style.backgroundColor ?? component.backgroundColor,
  };
}

function resolveField(context: RenderContextV2, source: string, field: string): unknown {
  if (source === 'Group' || source === 'Groups') {
    return context.groupValues[field];
  }

  const row = context.row ?? {};
  const scoped = row[source];
  if (scoped && typeof scoped === 'object' && !Array.isArray(scoped)) {
    return (scoped as Record<string, unknown>)[field];
  }

  return row[field] ?? row[`${source}.${field}`] ?? context.groupValues[field];
}
