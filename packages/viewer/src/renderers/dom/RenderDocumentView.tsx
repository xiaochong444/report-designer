import React from 'react';
import type { RenderDocument, RenderPage } from '@report-designer/core';
import { RenderComponent, MM_TO_PX } from './renderComponent';

interface RenderDocumentViewProps {
  document: RenderDocument;
  zoom: number;
  currentPage?: number;
}

export const RenderDocumentView: React.FC<RenderDocumentViewProps> = ({ document, zoom, currentPage }) => {
  const pages = currentPage ? document.pages.filter((page) => page.pageNumber === currentPage) : document.pages;

  return (
    <div data-testid="render-document" style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
      {pages.map((page) => (
        <RenderPageView key={page.id} page={page} zoom={zoom} />
      ))}
    </div>
  );
};

const RenderPageView: React.FC<{ page: RenderPage; zoom: number }> = ({ page, zoom }) => {
  const scale = zoom / 100;
  return (
    <div
      data-testid="render-document-page"
      style={{
        width: page.width * MM_TO_PX * scale,
        height: page.height * MM_TO_PX * scale,
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        position: 'relative',
        flex: '0 0 auto',
      }}
    >
      {page.items.map((band) => (
        <div
          key={band.id}
          data-band-type={band.bandType}
          style={{
            position: 'absolute',
            left: band.x * MM_TO_PX * scale,
            top: band.y * MM_TO_PX * scale,
            width: band.width * MM_TO_PX * scale,
            height: band.height * MM_TO_PX * scale,
          }}
        >
          {band.components.map((component) => (
            <RenderComponent key={component.id} component={{ ...component, x: component.x - band.x, y: component.y - band.y }} zoom={zoom} />
          ))}
        </div>
      ))}
    </div>
  );
};
