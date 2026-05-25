import { buildReportFontCss, sanitizeRichHtml, type PageBorder, type PageWatermark, type RenderComponentBox, type RenderDocument, type RenderLine } from '@report-designer/core';

type RenderTextStyle = NonNullable<Extract<RenderComponentBox, { type: 'text' }>['style']> & {
  padding?: { top: number; right: number; bottom: number; left: number };
};

export function buildPrintHtml(document: RenderDocument): string {
  const firstPage = document.pages[0];
  const pageCss = firstPage ? `${firstPage.width}mm ${firstPage.height}mm` : '210mm 297mm';
  const fontCss = buildReportFontCss(document.fonts);
  const pages = document.pages.map((page) => `
    <div class="rd-print-page" style="width:${page.width}mm;height:${page.height}mm;background-color:${safeCssColor(page.backgroundColor, '#fff')};">
      ${page.watermark?.showBehind === false ? '' : renderPageWatermarkHtml(page.watermark)}
      ${page.items.map((band) => `
        <div class="rd-print-band" style="left:${band.x}mm;top:${band.y}mm;width:${band.width}mm;height:${band.height}mm;">
          ${band.components.map(component => renderComponentHtml(component, band.x, band.y)).join('')}
        </div>
      `).join('')}
      ${page.watermark?.showBehind === false ? renderPageWatermarkHtml(page.watermark) : ''}
      ${renderPageBorderHtml(page.pageBorder)}
    </div>
  `).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: ${pageCss}; margin: 0; }
    ${fontCss}
    html, body { margin: 0; padding: 0; }
    .rd-print-page { position: relative; page-break-after: always; overflow: hidden; background: #fff; }
    .rd-print-band, .rd-print-component { position: absolute; box-sizing: border-box; }
    .rd-print-band { z-index: 2; }
    .rd-print-watermark, .rd-print-page-border { position: absolute; box-sizing: border-box; pointer-events: none; }
  </style>
</head>
<body>${pages}</body>
</html>`;
}

function renderPageWatermarkHtml(watermark?: PageWatermark): string {
  if (!watermark?.enabled || !watermark.text) return '';
  const fontFamily = safeCssFontFamily(watermark.fontFamily);
  const horizontalAlign = safeCssEnum(watermark.horizontalAlign, ['left', 'center', 'right'], 'center');
  const verticalAlign = safeCssEnum(watermark.verticalAlign, ['top', 'middle', 'bottom'], 'middle');
  const opacity = safeCssOpacity(watermark.opacity, 0.18);
  const fontSize = safeCssNumber(watermark.fontSize, 48, { min: 0 });
  const angle = safeCssAngle(watermark.angle, -35);
  const style = [
    'inset:0',
    'display:flex',
    `justify-content:${horizontalAlignToFlex(horizontalAlign)}`,
    `align-items:${verticalAlignToFlex(verticalAlign)}`,
    `color:${safeCssColor(watermark.color, '#000000')}`,
    `opacity:${roundCss(opacity)}`,
    fontFamily ? `font-family:${fontFamily}` : undefined,
    `font-size:${roundCss(fontSize)}mm`,
    'font-weight:600',
    'line-height:1',
    'white-space:pre-wrap',
    `text-align:${horizontalAlign}`,
    `z-index:${watermark.showBehind === false ? 3 : 1}`,
  ].filter(Boolean).join(';');
  const textStyle = `display:inline-block;transform:rotate(${roundCss(angle)}deg);transform-origin:center;`;
  return `<div class="rd-print-watermark" style="${style};"><span class="rd-print-watermark-text" style="${textStyle}">${escapeHtml(watermark.text)}</span></div>`;
}

function renderPageBorderHtml(pageBorder?: PageBorder): string {
  const borderStyle = safeCssEnum(pageBorder?.style, ['none', 'solid', 'dashed', 'dotted', 'double'], 'solid');
  const borderWidth = safeCssNumber(pageBorder?.width, 0.2, { min: 0 });
  const borderOffset = safeCssNumber(pageBorder?.offset, 0, { min: 0 });
  if (!pageBorder?.enabled || borderStyle === 'none' || borderWidth <= 0) return '';
  const borderColor = safeCssColor(pageBorder.color, '#000000');
  const sides = safeBorderSides(pageBorder.sides);
  const declarations = [
    `inset:${roundCss(borderOffset)}mm`,
    sides.top ? `border-top:${roundCss(borderWidth)}mm ${borderStyle} ${borderColor}` : undefined,
    sides.right ? `border-right:${roundCss(borderWidth)}mm ${borderStyle} ${borderColor}` : undefined,
    sides.bottom ? `border-bottom:${roundCss(borderWidth)}mm ${borderStyle} ${borderColor}` : undefined,
    sides.left ? `border-left:${roundCss(borderWidth)}mm ${borderStyle} ${borderColor}` : undefined,
    'z-index:4',
  ].filter(Boolean).join(';');
  return `<div class="rd-print-page-border" style="${declarations};"></div>`;
}

export async function printRenderDocument(document: RenderDocument): Promise<void> {
  const iframe = window.document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  window.document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc || !iframe.contentWindow) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(buildPrintHtml(document));
  doc.close();
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  iframe.contentWindow.focus();
  iframe.contentWindow.print();
  iframe.remove();
}

function renderComponentHtml(component: RenderComponentBox, bandX: number, bandY: number): string {
  const style = buildComponentStyle(component, bandX, bandY);
  const dataAttribute = `data-report-component="${escapeAttribute(component.id)}"`;
  if ((component.type === 'panel' || component.type === 'subreport') && 'children' in component) {
    const children = component.children.map((child) => renderComponentHtml(child, component.x, component.y)).join('');
    return `<div class="rd-print-component rd-print-${component.type}" ${dataAttribute} style="${style}">${children}</div>`;
  }
  if (component.type === 'text' && 'content' in component) {
    const contentStyle = buildTextContentStyle(component);
    return `<div class="rd-print-component rd-print-text" ${dataAttribute} style="${style}"><div class="rd-print-text-content" style="${contentStyle}">${escapeHtml(component.content)}</div></div>`;
  }
  if (component.type === 'image' && 'src' in component) {
    const fitMode = component.fitMode === 'stretch' || component.fitMode === 'fill'
      ? 'fill'
      : component.fitMode ?? 'contain';
    return `<img class="rd-print-component rd-print-image" ${dataAttribute} src="${escapeAttribute(component.src)}" alt="" style="${style}object-fit:${fitMode};" />`;
  }
  if (component.type === 'richtext' && 'html' in component) {
    return `<div class="rd-print-component rd-print-richtext" ${dataAttribute} style="${style}overflow:hidden;">${sanitizeRichHtml(component.html)}</div>`;
  }
  if (component.type === 'barcode' && 'value' in component) {
    return `<div class="rd-print-component rd-print-barcode" ${dataAttribute} style="${style}overflow:hidden;font-family:monospace;font-size:10px;display:flex;align-items:center;justify-content:center;background:repeating-linear-gradient(90deg,#000 0 1px,#fff 1px 3px);color:#000;" data-format="${escapeAttribute(String(component.format ?? 'CODE128'))}" aria-label="${escapeAttribute(component.value)}">${component.showText ? escapeHtml(component.value) : ''}</div>`;
  }
  if (component.type === 'checkbox' && 'checked' in component) {
    return `<div class="rd-print-component rd-print-checkbox" ${dataAttribute} style="${style}display:flex;align-items:center;gap:1.5mm;"><span style="width:3.2mm;height:3.2mm;border:0.2mm solid #333;display:inline-flex;align-items:center;justify-content:center;font-size:3mm;line-height:1;">${component.checked ? '&#10003;' : ''}</span>${component.label ? `<span>${escapeHtml(component.label)}</span>` : ''}</div>`;
  }
  if (component.type === 'table' && 'rows' in component && 'columns' in component) {
    return renderTableHtml(component, dataAttribute, style);
  }
  if (component.type === 'line') {
    const line = component as RenderLine;
    return `<svg class="rd-print-component rd-print-line" ${dataAttribute} style="${style}" viewBox="0 0 ${Math.max(1, line.width)} ${Math.max(1, line.height)}" preserveAspectRatio="none"><line x1="${line.startX ?? 0}" y1="${line.startY ?? line.height / 2}" x2="${line.endX ?? line.width}" y2="${line.endY ?? line.height / 2}" stroke="${escapeAttribute(line.lineColor ?? '#000000')}" stroke-width="${Math.max(0.2, line.lineWidth ?? 0.2)}" stroke-dasharray="${lineDashArray(line.lineStyle)}" /></svg>`;
  }
  if (component.type === 'shape') {
    return `<svg class="rd-print-component rd-print-shape" ${dataAttribute} style="${style}" viewBox="0 0 ${Math.max(1, component.width)} ${Math.max(1, component.height)}" preserveAspectRatio="none">${shapeSvg(component)}</svg>`;
  }
  return `<div class="rd-print-component" ${dataAttribute} style="${style}"></div>`;
}

function renderTableHtml(component: RenderComponentBox, dataAttribute: string, style: string): string {
  if (!('rows' in component) || !('columns' in component)) return '';
  const columns = component.columns as Array<{ width: number }>;
  const rows = component.rows as Array<Array<{ row: number; column: number; content: string; rowSpan: number; colSpan: number; height: number; isHeader?: boolean; isFooter?: boolean }>>;
  const border = 'showBorder' in component && component.showBorder ? '0.2mm solid #8c8c8c' : '0.2mm dashed #d9d9d9';
  const gridStyle = [
    style,
    'display:grid',
    `grid-template-columns:${columns.map(column => `${roundCss(column.width)}mm`).join(' ')}`,
    `grid-template-rows:${rows.map(row => `${roundCss(row[0]?.height ?? 8)}mm`).join(' ')}`,
    `border:${border}`,
    'background-color:#fff',
    'overflow:hidden',
  ].join(';');
  const cells = rows.flatMap(row => row.map(cell => {
    const declarations = [
      cell.colSpan > 1 ? `grid-column:span ${cell.colSpan}` : undefined,
      cell.rowSpan > 1 ? `grid-row:span ${cell.rowSpan}` : undefined,
      cell.column + cell.colSpan >= columns.length ? undefined : `border-right:${border}`,
      cell.row + cell.rowSpan >= rows.length ? undefined : `border-bottom:${border}`,
      cell.isHeader ? 'background-color:#f0f5ff' : cell.isFooter ? 'background-color:#fff7e6' : undefined,
      'box-sizing:border-box',
      'overflow:hidden',
      'white-space:nowrap',
      'text-overflow:ellipsis',
      'padding:1mm 1.5mm',
      'font-size:10px',
      'line-height:1.2',
    ].filter(Boolean).join(';');
    return `<div class="rd-print-table-cell" style="${declarations};">${escapeHtml(cell.content)}</div>`;
  })).join('');
  return `<div class="rd-print-component rd-print-table" ${dataAttribute} style="${gridStyle};">${cells}</div>`;
}

function buildComponentStyle(component: RenderComponentBox, bandX: number, bandY: number): string {
  const border = component.style?.border;
  const declarations = [
    `left:${roundCss(component.x - bandX)}mm`,
    `top:${roundCss(component.y - bandY)}mm`,
    `width:${component.width}mm`,
    `height:${component.height}mm`,
    'box-sizing:border-box',
    `overflow:${component.overflow ? 'hidden' : 'visible'}`,
  ];

  if (component.style?.backgroundColor) declarations.push(`background-color:${component.style.backgroundColor}`);
  if (border?.sides.top) declarations.push(`border-top:${border.width}mm ${border.style} ${border.color}`);
  if (border?.sides.right) declarations.push(`border-right:${border.width}mm ${border.style} ${border.color}`);
  if (border?.sides.bottom) declarations.push(`border-bottom:${border.width}mm ${border.style} ${border.color}`);
  if (border?.sides.left) declarations.push(`border-left:${border.width}mm ${border.style} ${border.color}`);
  if (component.style?.padding) declarations.push(`padding:${paddingCssValue(component.style.padding)}`);

  if (component.type === 'text') {
    const textStyle = component.style as RenderTextStyle | undefined;
    const font = textStyle?.font;
    declarations.push('display:flex');
    declarations.push(`align-items:${verticalAlignToFlex(textStyle?.verticalAlign)}`);
    if (!component.style?.padding) declarations.push(`padding:${paddingCssValue(textStyle?.padding)}`);
    declarations.push('white-space:pre-wrap');
    if (font?.color) declarations.push(`color:${font.color}`);
    if (font?.family) declarations.push(`font-family:${font.family}`);
    declarations.push(`font-size:${roundCss((font?.size ?? 10) * 1.333)}px`);
    declarations.push(`font-weight:${font?.bold ? 700 : 400}`);
    if (font?.italic) declarations.push('font-style:italic');
    const textDecoration = textDecorationValue(font);
    if (textDecoration) declarations.push(`text-decoration:${textDecoration}`);
  }

  return `${declarations.join(';')};`;
}

function buildTextContentStyle(component: RenderComponentBox): string {
  return [
    'width:100%',
    `text-align:${component.style?.textAlign ?? 'left'}`,
    'white-space:inherit',
  ].join(';') + ';';
}

function verticalAlignToFlex(value?: 'top' | 'middle' | 'bottom'): string {
  if (value === 'middle') return 'center';
  if (value === 'bottom') return 'flex-end';
  return 'flex-start';
}

function horizontalAlignToFlex(value?: 'left' | 'center' | 'right'): string {
  if (value === 'center') return 'center';
  if (value === 'right') return 'flex-end';
  return 'flex-start';
}

function textDecorationValue(font?: RenderTextStyle['font']): string | undefined {
  const values = [font?.underline ? 'underline' : null, font?.strikethrough ? 'line-through' : null].filter(Boolean);
  return values.length > 0 ? values.join(' ') : undefined;
}

function paddingCssValue(padding?: RenderTextStyle['padding']): string {
  const top = roundCss(padding?.top ?? 0);
  const right = roundCss(padding?.right ?? 0);
  const bottom = roundCss(padding?.bottom ?? 0);
  const left = roundCss(padding?.left ?? 0);
  return `${top}mm ${right}mm ${bottom}mm ${left}mm`;
}

function roundCss(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll("'", '&#39;');
}

function safeCssColor(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  if (/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) return trimmed;
  if (/^rgba?\(\s*(?:\d{1,3}|(?:\d{1,3}(?:\.\d+)?)%)\s*,\s*(?:\d{1,3}|(?:\d{1,3}(?:\.\d+)?)%)\s*,\s*(?:\d{1,3}|(?:\d{1,3}(?:\.\d+)?)%)(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(trimmed)) return trimmed;
  const namedColors = new Set(['transparent', 'black', 'white', 'red', 'green', 'blue', 'gray', 'grey', 'yellow', 'orange', 'purple']);
  return namedColors.has(trimmed.toLowerCase()) ? trimmed.toLowerCase() : fallback;
}

function safeCssFontFamily(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (/[;"'{}<>\\]/.test(trimmed) || trimmed.includes('/*') || trimmed.includes('*/')) return 'Arial';
  return escapeAttribute(trimmed.split(',').map(part => part.trim()).filter(Boolean).join(','));
}

function safeCssNumber(value: unknown, fallback: number, options: { min?: number; max?: number } = {}): number {
  const numberValue = typeof value === 'number' || typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isFinite(numberValue)) return fallback;
  if (options.min !== undefined && numberValue < options.min) return fallback;
  if (options.max !== undefined && numberValue > options.max) return fallback;
  return numberValue;
}

function safeCssOpacity(value: unknown, fallback: number): number {
  return safeCssNumber(value, fallback, { min: 0, max: 1 });
}

function safeCssAngle(value: unknown, fallback: number): number {
  return safeCssNumber(value, fallback);
}

function safeCssEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? value as T : fallback;
}

function safeBorderSides(value: unknown): PageBorder['sides'] {
  const sides = typeof value === 'object' && value !== null ? value as Partial<PageBorder['sides']> : {};
  return {
    top: sides.top === true,
    right: sides.right === true,
    bottom: sides.bottom === true,
    left: sides.left === true,
  };
}

function lineDashArray(style?: string): string {
  if (style === 'dashed') return '6 4';
  if (style === 'dotted') return '1 3';
  return '';
}

function shapeSvg(component: RenderComponentBox): string {
  const strokeWidth = Math.max(0.2, 'borderWidth' in component && typeof component.borderWidth === 'number' ? component.borderWidth : 0.2);
  const half = strokeWidth / 2;
  const stroke = escapeAttribute('borderColor' in component && typeof component.borderColor === 'string' ? component.borderColor : '#000000');
  const fill = escapeAttribute('fillColor' in component && typeof component.fillColor === 'string' ? component.fillColor : 'transparent');
  const dash = lineDashArray('borderStyle' in component && typeof component.borderStyle === 'string' ? component.borderStyle : undefined);
  const attrs = `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-dasharray="${dash}"`;

  if ('shapeType' in component && component.shapeType === 'ellipse') {
    return `<ellipse cx="${component.width / 2}" cy="${component.height / 2}" rx="${Math.max(0, component.width / 2 - half)}" ry="${Math.max(0, component.height / 2 - half)}" ${attrs} />`;
  }
  if ('shapeType' in component && component.shapeType === 'triangle') {
    return `<polygon points="${component.width / 2},${half} ${component.width - half},${component.height - half} ${half},${component.height - half}" ${attrs} />`;
  }
  const radius = 'shapeType' in component && component.shapeType === 'roundRect' ? 3 : 0;
  return `<rect x="${half}" y="${half}" width="${Math.max(0, component.width - strokeWidth)}" height="${Math.max(0, component.height - strokeWidth)}" rx="${radius}" ${attrs} />`;
}
