import React from 'react';
import { LeftPanel } from '../LeftPanel';
import { useDesignerI18n } from '../../i18n';
import type { ExpressionCatalogExtensions } from '../../expression/expression-catalog';

export const DesignerLeftPanel: React.FC<{ expressionExtensions?: ExpressionCatalogExtensions }> = ({ expressionExtensions }) => {
  const { t } = useDesignerI18n();

  return (
    <aside className="rd-left-panel" data-testid="designer-left-panel">
      <div className="rd-panel-title">{t('leftPanel.reportExplorer')}</div>
      <div className="rd-left-panel-body">
        <LeftPanel expressionExtensions={expressionExtensions} />
      </div>
    </aside>
  );
};
