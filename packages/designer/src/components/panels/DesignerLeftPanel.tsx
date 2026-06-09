import React from 'react';
import { LeftPanel, type LeftPanelTabKey } from '../LeftPanel';
import { useDesignerI18n } from '../../i18n';
import type { ExpressionCatalogExtensions } from '../../expression/expression-catalog';

interface DesignerLeftPanelProps {
  activeTab?: LeftPanelTabKey;
  expressionExtensions?: ExpressionCatalogExtensions;
  onActiveTabChange?: (key: LeftPanelTabKey) => void;
}

export const DesignerLeftPanel: React.FC<DesignerLeftPanelProps> = ({ activeTab, expressionExtensions, onActiveTabChange }) => {
  const { t } = useDesignerI18n();

  return (
    <aside className="rd-left-panel" data-testid="designer-left-panel">
      <div className="rd-panel-title">{t('leftPanel.reportExplorer')}</div>
      <div className="rd-left-panel-body">
        <LeftPanel activeTab={activeTab} expressionExtensions={expressionExtensions} onActiveTabChange={onActiveTabChange} />
      </div>
    </aside>
  );
};
