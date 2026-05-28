import React from 'react';
import { useDesignerStore } from '../../store/designer-store';
import { formatUnitValue, getReportUnitSymbol } from '../../page-settings';
import { useDesignerI18n } from '../../i18n';

export const DesignerStatusBar: React.FC = () => {
  const { t } = useDesignerI18n();
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
    ? t('status.selection.components', { count: selectedComponentIds.length })
    : selectedBandId
      ? t('status.selection.band')
      : t('status.selection.none');

  return (
    <div className="rd-status-bar" data-testid="designer-status-bar">
      <div className="rd-status-item">{selectedLabel}</div>
      {currentPage && (
        <>
          <div className="rd-status-item">
            {t('status.pageOf', { current: template.pages.findIndex(p => p.id === currentPage.id) + 1, total: template.pages.length })}
          </div>
          <div className="rd-status-item">
            {formatUnitValue(currentPage.width, reportUnit)} x {formatUnitValue(currentPage.height, reportUnit)} {unitSymbol}
          </div>
          <div className="rd-status-item">
            {t('status.margins')} {formatUnitValue(margins.top, reportUnit)}/{formatUnitValue(margins.right, reportUnit)}/{formatUnitValue(margins.bottom, reportUnit)}/{formatUnitValue(margins.left, reportUnit)} {unitSymbol}
          </div>
        </>
      )}
      <div className="rd-status-spacer" />
      <div className="rd-status-item">{t('status.grid')} {formatUnitValue(5, reportUnit)} {unitSymbol}</div>
      <div className="rd-status-item">{t('status.snapOn')}</div>
      <div className="rd-status-item">{Math.round(zoom * 100)}%</div>
    </div>
  );
};
