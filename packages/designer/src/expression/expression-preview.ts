import { evalExpression, type JsonFieldType, type ReportTemplate } from '@report-designer/core';

export type ExpressionPreviewResult =
  | { ok: true; value: unknown }
  | { ok: false; message: string };

export function previewReportExpression(expression: string, template: ReportTemplate): ExpressionPreviewResult {
  try {
    const sampleRows = buildSampleRows(template);
    const value = evalExpression(expression, (source, field) => sampleRows[source]?.[field]);
    return { ok: true, value };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function buildSampleRows(template: ReportTemplate): Record<string, Record<string, unknown>> {
  const rows: Record<string, Record<string, unknown>> = {};

  for (const source of template.dataSources) {
    const firstSample = Array.isArray((source as { sampleRows?: unknown[] }).sampleRows)
      ? (source as { sampleRows?: unknown[] }).sampleRows?.[0]
      : undefined;

    if (firstSample && typeof firstSample === 'object') {
      rows[source.id] = firstSample as Record<string, unknown>;
      continue;
    }

    rows[source.id] = {};
    for (const field of source.schema ?? source.fields ?? []) {
      rows[source.id][field.name] = defaultFieldValue(field.type);
    }
  }

  return rows;
}

function defaultFieldValue(type: JsonFieldType | undefined): unknown {
  if (type === 'number') return 0;
  if (type === 'boolean') return false;
  if (type === 'date') return new Date().toISOString();
  if (type === 'null') return null;
  return '';
}
