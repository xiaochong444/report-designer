import React from 'react';
import { LeftPanel } from '../LeftPanel';
import { useDesignerI18n } from '../../i18n';

export const DesignerLeftPanel: React.FC = () => {
  const { t } = useDesignerI18n();

  return (
    <aside className="rd-left-panel" data-testid="designer-left-panel">
      <div className="rd-panel-title">{t('leftPanel.reportExplorer')}</div>
      <div className="rd-left-panel-body">
        <LeftPanel />
      </div>
    </aside>
  );
};
