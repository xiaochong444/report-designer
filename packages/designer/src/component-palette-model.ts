import type { ComponentType } from '@report-designer/core';
import type { DesignerMessageKey } from './i18n';

export interface ComponentPaletteItem {
  type: ComponentType;
  labelKey: DesignerMessageKey;
}

export interface ComponentPaletteGroup {
  key: 'common' | 'data' | 'graphics';
  labelKey: DesignerMessageKey;
  types: ComponentType[];
}

export const COMPONENT_TYPES: ComponentPaletteItem[] = [
  { type: 'text', labelKey: 'leftPanel.componentText' },
  { type: 'richtext', labelKey: 'leftPanel.componentRichText' },
  { type: 'image', labelKey: 'leftPanel.componentImage' },
  { type: 'table', labelKey: 'leftPanel.componentTable' },
  { type: 'chart', labelKey: 'leftPanel.componentChart' },
  { type: 'barcode', labelKey: 'leftPanel.componentBarcode' },
  { type: 'qrcode', labelKey: 'leftPanel.componentQRCode' },
  { type: 'checkbox', labelKey: 'leftPanel.componentCheckbox' },
  { type: 'pagenumber', labelKey: 'leftPanel.componentPageNumber' },
  { type: 'datetime', labelKey: 'leftPanel.componentDateTime' },
  { type: 'line', labelKey: 'leftPanel.componentLine' },
  { type: 'shape', labelKey: 'leftPanel.componentShape' },
  { type: 'panel', labelKey: 'leftPanel.componentPanel' },
];

export const COMPONENT_GROUPS: ComponentPaletteGroup[] = [
  { key: 'common', labelKey: 'leftPanel.groupCommon', types: ['text', 'richtext', 'image', 'table', 'chart'] },
  { key: 'data', labelKey: 'leftPanel.groupData', types: ['barcode', 'qrcode', 'checkbox', 'pagenumber', 'datetime'] },
  { key: 'graphics', labelKey: 'leftPanel.groupGraphics', types: ['line', 'shape', 'panel'] },
];
