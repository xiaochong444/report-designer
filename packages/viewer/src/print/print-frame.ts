import type { RenderComponentBox, RenderDocument } from '@report-designer/core';

type RenderTextStyle = NonNullable<Extract<RenderComponentBox, { type: 'text' }>['style']> & {
  padding?: { top: number; right: number; bottom: number; left: number };
};

export function buildPrintHtml(document: RenderDocument): string {
  const firstPage = document.pages[0];
  const pageCss = firstPage ? `${firstPage.width}mm ${firstPage.height}mm` : '210mm 297mm';
  const pages = document.pages.map((page) => `
    <div class="rd-print-page" style="width:${page.width}mm;height:${page.height}mm;">
      ${page.items.map((band) => `
        <div class="rd-print-band" style="left:${band.x}mm;top:${band.y}mm;width:${band.width}mm;height:${band.height}mm;">
          ${band.components.map(component => renderComponentHtml(component, band.x, band.y)).join('')}
        </div>
      `).join('')}
    </div>
  `).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: ${pageCss}; margin: 0; }
    html, body { margin: 0; padding: 0; }
    .rd-print-page { position: relative; page-break-after: always; overflow: hidden; background: #fff; }
    .rd-print-band, .rd-print-component { position: absolute; box-sizing: border-box; }
  </style>
</head>
<body>${pages}</body>
</html>`;
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
  if (component.type === 'text' && 'content' in component) {
    const contentStyle = buildTextContentStyle(component);
    return `<div class="rd-print-component rd-print-text" style="${style}"><div class="rd-print-text-content" style="${contentStyle}">${escapeHtml(component.content)}</div></div>`;
  }
  return `<div class="rd-print-component" style="${style}"></div>`;
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

  if (component.type === 'text') {
    const textStyle = component.style as RenderTextStyle | undefined;
    const font = textStyle?.font;
    declarations.push('display:flex');
    declarations.push(`align-items:${verticalAlignToFlex(textStyle?.verticalAlign)}`);
    declarations.push(`padding:${paddingCssValue(textStyle?.padding)}`);
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
