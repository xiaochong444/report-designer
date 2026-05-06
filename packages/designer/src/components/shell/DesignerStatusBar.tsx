import React from 'react';
import { useDesignerStore } from '../../store/designer-store';
import { formatUnitValue, getReportUnitSymbol } from '../../page-settings';

export const DesignerStatusBar: React.FC = () => {
  const template = useDesignerStore(s => s.template);
  const currentPageId = useDesignerStore(s => s.currentPageId);
  const selectedComponentIds = useDesignerStore(s => s.selectedComponentIds);
  const selectedBandId = useDesignerStore(s => s.selectedBandId);
  const reportUnit = useDesignerStore(s => s.reportUnit);
  const zoom = useDesignerStore(s => s.zoom);

  const currentPage = template.pages.find(p => p.id === currentPageId) ?? template.pages[0];
  const unitSymbol = getReportUnitSymbol(reportUnit);
  const margins = currentPage?.margins ?? { top: 0, right: 0, bottom: 0, left: 0 };
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
            {formatUnitValue(currentPage.width, reportUnit)} x {formatUnitValue(currentPage.height, reportUnit)} {unitSymbol}
          </div>
          <div className="rd-status-item">
            Margins {formatUnitValue(margins.top, reportUnit)}/{formatUnitValue(margins.right, reportUnit)}/{formatUnitValue(margins.bottom, reportUnit)}/{formatUnitValue(margins.left, reportUnit)} {unitSymbol}
          </div>
        </>
      )}
      <div className="rd-status-spacer" />
      <div className="rd-status-item">Grid {formatUnitValue(5, reportUnit)} {unitSymbol}</div>
      <div className="rd-status-item">Snap on</div>
      <div className="rd-status-item">{Math.round(zoom * 100)}%</div>
    </div>
  );
};
