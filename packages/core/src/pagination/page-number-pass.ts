import type { RenderDocument, RenderText } from '../render-document/types';

export function applyPageNumberPass(document: RenderDocument): RenderDocument {
  const totalPages = document.pages.length;

  document.pages.forEach((page) => {
    page.totalPages = totalPages;
    page.items.forEach((item) => {
      item.components.forEach((component) => {
        if (component.type === 'text' && 'content' in component) {
          const text = component as RenderText;
          text.content = text.content
            .replaceAll('{PageNumber}', String(page.pageNumber))
            .replaceAll('{TotalPages}', String(totalPages));
        }
      });
    });
  });

  return document;
}
