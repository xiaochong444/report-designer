import type {
  BorderConfig,
  ConditionalFormat,
  DataField,
  DataSource,
  FontConfig,
  Margins,
  PageOrientation,
  ReportComponent,
  ReportComponentUnion,
  ReportStyle,
  TextComponent,
} from './types';

export const STANDARD_BAND_TYPES = [
  'reportTitle',
  'reportSummary',
  'pageHeader',
  'pageFooter',
  'header',
  'footer',
  'groupHeader',
  'groupFooter',
  'columnHeader',
  'columnFooter',
  'data',
  'hierarchicalData',
  'child',
  'emptyData',
  'overlay',
] as const;

export type StandardBandTypeV2 = typeof STANDARD_BAND_TYPES[number];
export type BandPrintOn = 'allPages' | 'firstPage' | 'exceptFirstPage' | 'lastPage' | 'oddPages' | 'evenPages';
export type JsonFieldTypeV2 = 'null' | 'boolean' | 'number' | 'date' | 'string';

export interface BandBehaviorV2 {
  enabled: boolean;
  visibleExpression?: string;
  printOn: BandPrintOn;
  printIfEmpty: boolean;
  printOnAllPages: boolean;
  keepTogether: boolean;
  canBreak: boolean;
  breakIfLessThan?: number;
  printAtBottom: boolean;
}

export interface DataBandOptionsV2 {
  dataSourceId?: string;
  filterExpression?: string;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  columns?: { count: number; gap: number; direction: 'downThenAcross' | 'acrossThenDown' };
}

export interface GroupBandOptionsV2 {
  name?: string;
  conditionExpression?: string;
  groupHeaderId?: string;
}

export interface DataFieldV2 {
  id: string;
  name: string;
  path: string;
  type: JsonFieldTypeV2;
  label?: string;
  nullable: boolean;
}

export interface DataSourceV2 {
  id: string;
  name: string;
  type: 'json';
  path: string;
  fields: DataFieldV2[];
  parentSourceId?: string;
  parentPath?: string;
}

export interface ReportParameterV2 {
  id: string;
  name: string;
  type: JsonFieldTypeV2;
  defaultValue?: unknown;
}

export interface ReportStyleV2 extends Omit<ReportStyle, 'font' | 'border'> {
  font?: Partial<FontConfig>;
  border?: Partial<BorderConfig>;
}

export type ReportComponentV2 = ReportComponent | ReportComponentUnion;
export type TextComponentV2 = TextComponent;

export interface ReportBandV2 {
  id: string;
  type: StandardBandTypeV2;
  name?: string;
  height: number;
  components: ReportComponentV2[];
  behavior: BandBehaviorV2;
  dataBand?: DataBandOptionsV2;
  group?: GroupBandOptionsV2;
}

export interface ReportPageV2 {
  id: string;
  width: number;
  height: number;
  margins: Margins;
  orientation: PageOrientation;
  bands: ReportBandV2[];
}

export interface ReportTemplateV2 {
  id: string;
  name: string;
  version: '2.0';
  pages: ReportPageV2[];
  dataSources: DataSourceV2[];
  styles: ReportStyleV2[];
  conditionalFormats: ConditionalFormat[];
  parameters: ReportParameterV2[];
}

export interface JsonDictionaryV2 {
  dataSources: DataSourceV2[];
}

export function mapDataFieldToV2(source: Pick<DataSource, 'id'>, field: DataField): DataFieldV2 {
  return {
    id: `${source.id}.${field.name}`,
    name: field.name,
    path: `${source.id}.${field.name}`,
    type: field.type,
    label: field.label,
    nullable: false,
  };
}
