import type { RenderComponentBox, RenderDocument } from '@report-designer/core';

export function buildPrintHtml(document: RenderDocument): string {
  const firstPage = document.pages[0];
  const pageCss = firstPage ? `${firstPage.width}mm ${firstPage.height}mm` : '210mm 297mm';
  const pages = document.pages.map((page) => `
    <div class="rd-print-page" style="width:${page.width}mm;height:${page.height}mm;">
      ${page.items.map((band) => `
        <div class="rd-print-band" style="left:${band.x}mm;top:${band.y}mm;width:${band.width}mm;height:${band.height}mm;">
          ${band.components.map(renderComponentHtml).join('')}
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

function renderComponentHtml(component: RenderComponentBox): string {
  const style = `left:${component.x}mm;top:${component.y}mm;width:${component.width}mm;height:${component.height}mm;`;
  if (component.type === 'text' && 'content' in component) {
    return `<div class="rd-print-component" style="${style}">${escapeHtml(component.content)}</div>`;
  }
  return `<div class="rd-print-component" style="${style}"></div>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
