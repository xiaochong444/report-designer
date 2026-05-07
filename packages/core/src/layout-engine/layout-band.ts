import { evalExpression } from '../expression-engine/evaluator';
import { AggregateRuntime } from '../aggregate-engine';
import type { RenderContext } from '../band-planner/band-plan';
import type { RenderBandBox, RenderComponentBox } from '../render-document/types';
import type { Band, ReportComponent, ReportStyle, TextComponent } from '../template-model/types';
import { formatValue } from '../text-format';
import { measureTextBox } from './measure';

export interface LayoutBandOptions {
  x: number;
  y: number;
  width: number;
  context: RenderContext;
  rowsByBand?: Record<string, Record<string, unknown>[]>;
  pageRowsByBand?: Record<string, Record<string, unknown>[]>;
  styles?: ReportStyle[];
}

export function layoutBand(band: Band, options: LayoutBandOptions): RenderBandBox {
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

function layoutComponent(component: ReportComponent, band: Band, options: LayoutBandOptions): RenderComponentBox {
  if (component.type === 'text') {
    const textComponent = component as TextComponent;
    const effective = resolveTextComponentStyle(textComponent, options.styles ?? []);
    const text = resolveText(textComponent, options.context, options.rowsByBand ?? {}, options.pageRowsByBand ?? {});
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
  component: TextComponent,
  context: RenderContext,
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

function resolveTextComponentStyle(component: TextComponent, styles: ReportStyle[]): TextComponent {
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

function resolveField(context: RenderContext, source: string, field: string): unknown {
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
