import React from 'react';
import { useDesignerStore } from '../../store/designer-store';

export const DesignerStatusBar: React.FC = () => {
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const selectedComponentIds = useDesignerStore(s => s.selectedComponentIds);
  const selectedBandId = useDesignerStore(s => s.selectedBandId);

  const currentPage = template.pages.find(p => p.id === currentPageId) ?? template.pages[0];
  const selectedLabel = selectedComponentIds.length > 0
    ? `${selectedComponentIds.length} component${selectedComponentIds.length === 1 ? '' : 's'}`
    : selectedBandId
      ? '1 band'
      : 'No selection';

  return (
    <div className="rd-status-bar" data-testid="designer-status-bar">
      <div className="rd-status-item">{selectedLabel}</div>
      {currentPage && (
        <>
          <div className="rd-status-item">
            Page {template.pages.findIndex(p => p.id === currentPage.id) + 1} of {template.pages.length}
          </div>
          <div className="rd-status-item">
            {currentPage.width} x {currentPage.height} mm
          </div>
          <div className="rd-status-item">
            Margins {currentPage.margins.top}/{currentPage.margins.right}/{currentPage.margins.bottom}/{currentPage.margins.left} mm
          </div>
        </>
      )}
      <div className="rd-status-spacer" />
      <div className="rd-status-item">Grid 5 mm</div>
      <div className="rd-status-item">Snap on</div>
      <div className="rd-status-item">100%</div>
    </div>
  );
};
