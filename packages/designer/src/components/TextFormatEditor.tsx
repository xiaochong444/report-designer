import React from 'react';
import { Input, InputNumber, Select, Switch } from 'antd';
import { formatValue } from '@report-designer/core';
import type { TextFormatConfig, TextFormatType } from '@report-designer/core';
import { useDesignerI18n } from '../i18n';

interface TextFormatEditorProps {
  value?: TextFormatConfig;
  onChange: (value: TextFormatConfig) => void;
  disabled?: boolean;
  isFieldDisabled?: (path: string) => boolean;
  labelWidth?: number;
  size?: 'small' | 'middle';
}

const DATE_FORMAT_OPTIONS = [
  'yyyy-MM-dd',
  'yyyy/MM/dd',
  'MM/dd/yyyy',
  'dd/MM/yyyy',
  'yyyy.MM.dd',
];

const TIME_FORMAT_OPTIONS = [
  'HH:mm',
  'HH:mm:ss',
];

function createDefaultFormat(type: TextFormatType = 'none'): TextFormatConfig {
  switch (type) {
    case 'text':
      return { type, textTransform: 'none', trimText: false };
    case 'number':
      return {
        type,
        decimalDigits: 2,
        decimalSeparator: '.',
        useGroupSeparator: true,
        groupSeparator: ',',
        groupSize: 3,
        useAbbreviation: false,
        positivePattern: 'plain',
        negativePattern: 'minus',
      };
    case 'currency':
      return {
        type,
        decimalDigits: 2,
        decimalSeparator: '.',
        useGroupSeparator: true,
        groupSeparator: ',',
        groupSize: 3,
        useAbbreviation: false,
        positivePattern: 'plain',
        negativePattern: 'minus',
        currencySymbol: '$',
        currencySymbolPosition: 'prefix',
        currencySpace: false,
      };
    case 'percent':
      return {
        type,
        decimalDigits: 2,
        decimalSeparator: '.',
        useGroupSeparator: false,
        groupSeparator: ',',
        groupSize: 3,
        positivePattern: 'plain',
        negativePattern: 'minus',
        percentMultiplier: 100,
        percentSymbol: '%',
        percentSymbolPosition: 'suffix',
        percentSpace: false,
      };
    case 'date':
      return { type, dateFormat: 'yyyy-MM-dd' };
    case 'time':
      return { type, timeFormat: 'HH:mm:ss' };
    case 'dateTime':
      return { type, dateFormat: 'yyyy-MM-dd', timeFormat: 'HH:mm:ss' };
    case 'boolean':
      return { type, trueText: 'True', falseText: 'False', trueValues: ['true', '1'], falseValues: ['false', '0'] };
    case 'custom':
      return { type, pattern: '' };
    case 'none':
    default:
      return { type: 'none' };
  }
}

function normalizeFormat(format?: TextFormatConfig): TextFormatConfig {
  return {
    ...createDefaultFormat(format?.type ?? 'none'),
    ...format,
  };
}

export const TextFormatEditor: React.FC<TextFormatEditorProps> = ({
  disabled = false,
  isFieldDisabled,
  labelWidth = 88,
  onChange,
  size = 'small',
  value,
}) => {
  const { t } = useDesignerI18n();
  const format = normalizeFormat(value);
  const previewText = formatValue(getPreviewValue(format.type), format);
  const fieldDisabled = (path: string) => disabled || (isFieldDisabled?.(path) ?? false);

  const updateFormat = (updates: Partial<TextFormatConfig>) => {
    onChange({ ...format, ...updates });
  };

  const changeType = (type: TextFormatType) => {
    const defaults = createDefaultFormat(type);
    onChange({
      ...defaults,
      nullValue: format.nullValue ?? defaults.nullValue,
      trueText: format.trueText ?? defaults.trueText,
      falseText: format.falseText ?? defaults.falseText,
      pattern: type === 'custom' ? format.pattern ?? '' : defaults.pattern,
    });
  };

  const formatTypeOptions: Array<{ value: TextFormatType; label: React.ReactNode }> = [
    { value: 'none', label: t('formatEditor.none') },
    { value: 'text', label: t('formatEditor.text') },
    { value: 'number', label: t('formatEditor.number') },
    { value: 'currency', label: t('formatEditor.currency') },
    { value: 'date', label: t('formatEditor.date') },
    { value: 'time', label: t('formatEditor.time') },
    { value: 'dateTime', label: t('formatEditor.dateTime') },
    { value: 'percent', label: t('formatEditor.percent') },
    { value: 'boolean', label: t('formatEditor.boolean') },
    { value: 'custom', label: t('formatEditor.custom') },
  ];

  return (
    <div data-testid="format-editor" style={{ display: 'grid', gap: 8, minWidth: 0, width: '100%' }}>
      <div
        data-testid="format-editor-preview"
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: 4,
          display: 'grid',
          gap: 4,
          padding: '8px 10px',
          background: '#fafafa',
        }}
      >
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{t('formatEditor.preview')}</span>
        <span style={{ color: '#262626', fontSize: 12, fontWeight: 600, wordBreak: 'break-all' }}>{previewText || '-'}</span>
      </div>

      <div
        data-testid="format-editor-settings"
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: 4,
          display: 'grid',
          gap: 8,
          minWidth: 0,
          padding: '8px 10px',
          background: '#ffffff',
        }}
      >
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{t('formatEditor.settings')}</span>
        <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
          <FormatField label={t('formatEditor.type')} labelWidth={labelWidth}>
            <LabeledSelect
              aria-label={t('formatEditor.type')}
              value={format.type}
              virtual={false}
              size={size}
              disabled={fieldDisabled('format.type')}
              onChange={changeType}
              options={formatTypeOptions}
            />
          </FormatField>

      {format.type === 'custom' ? (
        <FormatField label={t('formatEditor.pattern')} labelWidth={labelWidth}>
          <Input
            aria-label={t('formatEditor.pattern')}
            value={format.pattern ?? ''}
            size={size}
            disabled={fieldDisabled('format.pattern')}
            onChange={(event) => updateFormat({ pattern: event.target.value })}
            placeholder="#,##0.00 / yyyy-MM-dd"
          />
        </FormatField>
      ) : null}

      {format.type === 'text' ? (
        <>
          <FormatField label={t('formatEditor.transform')} labelWidth={labelWidth}>
            <LabeledSelect
              aria-label={t('formatEditor.transform')}
              value={format.textTransform ?? 'none'}
              virtual={false}
              size={size}
              disabled={fieldDisabled('format.textTransform')}
              onChange={(textTransform) => updateFormat({ textTransform })}
              options={[
                { value: 'none', label: t('formatEditor.transformNone') },
                { value: 'uppercase', label: t('formatEditor.uppercase') },
                { value: 'lowercase', label: t('formatEditor.lowercase') },
                { value: 'capitalize', label: t('formatEditor.capitalize') },
              ]}
            />
          </FormatField>
          <FormatField label={t('formatEditor.trimText')} labelWidth={labelWidth}>
            <CompactSwitch
              aria-label={t('formatEditor.trimText')}
              size="small"
              checked={format.trimText ?? false}
              disabled={fieldDisabled('format.trimText')}
              onChange={(trimText) => updateFormat({ trimText })}
            />
          </FormatField>
        </>
      ) : null}

      {isNumericFormat(format.type) ? (
        <>
          <FormatField label={t('formatEditor.decimalDigits')} labelWidth={labelWidth}>
            <InputNumber
              aria-label={t('formatEditor.decimalDigits')}
              value={format.decimalDigits ?? 2}
              min={0}
              max={8}
              size={size}
              disabled={fieldDisabled('format.decimalDigits')}
              style={{ width: '100%' }}
              onChange={(decimalDigits) => updateFormat({ decimalDigits: Number(decimalDigits ?? 0) })}
            />
          </FormatField>
          <FormatField label={t('formatEditor.decimalSeparator')} labelWidth={labelWidth}>
            <Input
              aria-label={t('formatEditor.decimalSeparator')}
              value={format.decimalSeparator ?? '.'}
              maxLength={4}
              size={size}
              disabled={fieldDisabled('format.decimalSeparator')}
              onChange={(event) => updateFormat({ decimalSeparator: event.target.value })}
            />
          </FormatField>
          <FormatField label={t('formatEditor.useGroupSeparator')} labelWidth={labelWidth}>
            <CompactSwitch
              aria-label={t('formatEditor.useGroupSeparator')}
              size="small"
              checked={format.useGroupSeparator ?? format.type !== 'percent'}
              disabled={fieldDisabled('format.useGroupSeparator')}
              onChange={(useGroupSeparator) => updateFormat({ useGroupSeparator })}
            />
          </FormatField>
          <FormatField label={t('formatEditor.groupSeparator')} labelWidth={labelWidth}>
            <Input
              aria-label={t('formatEditor.groupSeparator')}
              value={format.groupSeparator ?? ','}
              maxLength={4}
              size={size}
              disabled={fieldDisabled('format.groupSeparator')}
              onChange={(event) => updateFormat({ groupSeparator: event.target.value })}
            />
          </FormatField>
          <FormatField label={t('formatEditor.groupSize')} labelWidth={labelWidth}>
            <InputNumber
              aria-label={t('formatEditor.groupSize')}
              value={format.groupSize ?? 3}
              min={1}
              max={9}
              size={size}
              disabled={fieldDisabled('format.groupSize')}
              style={{ width: '100%' }}
              onChange={(groupSize) => updateFormat({ groupSize: Number(groupSize ?? 3) })}
            />
          </FormatField>
          {format.type !== 'percent' ? (
            <FormatField label={t('formatEditor.useAbbreviation')} labelWidth={labelWidth}>
              <CompactSwitch
                aria-label={t('formatEditor.useAbbreviation')}
                size="small"
                checked={format.useAbbreviation ?? false}
                disabled={fieldDisabled('format.useAbbreviation')}
                onChange={(useAbbreviation) => updateFormat({ useAbbreviation })}
              />
            </FormatField>
          ) : null}
          <FormatField label={t('formatEditor.positivePattern')} labelWidth={labelWidth}>
            <LabeledSelect
              aria-label={t('formatEditor.positivePattern')}
              value={format.positivePattern ?? 'plain'}
              virtual={false}
              size={size}
              disabled={fieldDisabled('format.positivePattern')}
              onChange={(positivePattern) => updateFormat({ positivePattern })}
              options={[
                { value: 'plain', label: t('formatEditor.positivePlain') },
                { value: 'plus', label: t('formatEditor.positivePlus') },
              ]}
            />
          </FormatField>
          <FormatField label={t('formatEditor.negativePattern')} labelWidth={labelWidth}>
            <LabeledSelect
              aria-label={t('formatEditor.negativePattern')}
              value={format.negativePattern ?? 'minus'}
              virtual={false}
              size={size}
              disabled={fieldDisabled('format.negativePattern')}
              onChange={(negativePattern) => updateFormat({ negativePattern })}
              options={[
                { value: 'minus', label: t('formatEditor.negativeMinus') },
                { value: 'parentheses', label: t('formatEditor.negativeParentheses') },
              ]}
            />
          </FormatField>
        </>
      ) : null}

      {format.type === 'currency' ? (
        <>
          <FormatField label={t('formatEditor.currencySymbol')} labelWidth={labelWidth}>
            <Input
              aria-label={t('formatEditor.currencySymbol')}
              value={format.currencySymbol ?? '$'}
              size={size}
              disabled={fieldDisabled('format.currencySymbol')}
              onChange={(event) => updateFormat({ currencySymbol: event.target.value })}
            />
          </FormatField>
          <FormatField label={t('formatEditor.currencySymbolPosition')} labelWidth={labelWidth}>
            <LabeledSelect
              aria-label={t('formatEditor.currencySymbolPosition')}
              value={format.currencySymbolPosition ?? 'prefix'}
              virtual={false}
              size={size}
              disabled={fieldDisabled('format.currencySymbolPosition')}
              onChange={(currencySymbolPosition) => updateFormat({ currencySymbolPosition })}
              options={[
                { value: 'prefix', label: t('formatEditor.prefix') },
                { value: 'suffix', label: t('formatEditor.suffix') },
              ]}
            />
          </FormatField>
          <FormatField label={t('formatEditor.currencySpace')} labelWidth={labelWidth}>
            <CompactSwitch
              aria-label={t('formatEditor.currencySpace')}
              size="small"
              checked={format.currencySpace ?? false}
              disabled={fieldDisabled('format.currencySpace')}
              onChange={(currencySpace) => updateFormat({ currencySpace })}
            />
          </FormatField>
        </>
      ) : null}

      {format.type === 'percent' ? (
        <>
          <FormatField label={t('formatEditor.percentMultiplier')} labelWidth={labelWidth}>
            <LabeledSelect
              aria-label={t('formatEditor.percentMultiplier')}
              value={format.percentMultiplier ?? 100}
              virtual={false}
              size={size}
              disabled={fieldDisabled('format.percentMultiplier')}
              onChange={(percentMultiplier) => updateFormat({ percentMultiplier })}
              options={[
                { value: 100, label: t('formatEditor.percentFraction') },
                { value: 1, label: t('formatEditor.percentWhole') },
              ]}
            />
          </FormatField>
          <FormatField label={t('formatEditor.percentSymbol')} labelWidth={labelWidth}>
            <Input
              aria-label={t('formatEditor.percentSymbol')}
              value={format.percentSymbol ?? '%'}
              size={size}
              disabled={fieldDisabled('format.percentSymbol')}
              onChange={(event) => updateFormat({ percentSymbol: event.target.value })}
            />
          </FormatField>
          <FormatField label={t('formatEditor.percentSymbolPosition')} labelWidth={labelWidth}>
            <LabeledSelect
              aria-label={t('formatEditor.percentSymbolPosition')}
              value={format.percentSymbolPosition ?? 'suffix'}
              virtual={false}
              size={size}
              disabled={fieldDisabled('format.percentSymbolPosition')}
              onChange={(percentSymbolPosition) => updateFormat({ percentSymbolPosition })}
              options={[
                { value: 'prefix', label: t('formatEditor.prefix') },
                { value: 'suffix', label: t('formatEditor.suffix') },
              ]}
            />
          </FormatField>
          <FormatField label={t('formatEditor.percentSpace')} labelWidth={labelWidth}>
            <CompactSwitch
              aria-label={t('formatEditor.percentSpace')}
              size="small"
              checked={format.percentSpace ?? false}
              disabled={fieldDisabled('format.percentSpace')}
              onChange={(percentSpace) => updateFormat({ percentSpace })}
            />
          </FormatField>
        </>
      ) : null}

      {format.type === 'date' || format.type === 'dateTime' ? (
        <FormatField label={t('formatEditor.dateFormat')} labelWidth={labelWidth}>
          <LabeledSelect
            aria-label={t('formatEditor.dateFormat')}
            value={format.dateFormat ?? 'yyyy-MM-dd'}
            virtual={false}
            size={size}
            disabled={fieldDisabled('format.dateFormat')}
            onChange={(dateFormat) => updateFormat({ dateFormat })}
            options={DATE_FORMAT_OPTIONS.map(item => ({ value: item, label: item }))}
          />
        </FormatField>
      ) : null}

      {format.type === 'time' || format.type === 'dateTime' ? (
        <FormatField label={t('formatEditor.timeFormat')} labelWidth={labelWidth}>
          <LabeledSelect
            aria-label={t('formatEditor.timeFormat')}
            value={format.timeFormat ?? 'HH:mm:ss'}
            virtual={false}
            size={size}
            disabled={fieldDisabled('format.timeFormat')}
            onChange={(timeFormat) => updateFormat({ timeFormat })}
            options={TIME_FORMAT_OPTIONS.map(item => ({ value: item, label: item }))}
          />
        </FormatField>
      ) : null}

      {format.type === 'boolean' ? (
        <>
          <FormatField label={t('formatEditor.trueText')} labelWidth={labelWidth}>
            <Input
              aria-label={t('formatEditor.trueText')}
              value={format.trueText ?? 'True'}
              size={size}
              disabled={fieldDisabled('format.trueText')}
              onChange={(event) => updateFormat({ trueText: event.target.value })}
            />
          </FormatField>
          <FormatField label={t('formatEditor.falseText')} labelWidth={labelWidth}>
            <Input
              aria-label={t('formatEditor.falseText')}
              value={format.falseText ?? 'False'}
              size={size}
              disabled={fieldDisabled('format.falseText')}
              onChange={(event) => updateFormat({ falseText: event.target.value })}
            />
          </FormatField>
          <FormatField label={t('formatEditor.trueValues')} labelWidth={labelWidth}>
            <Input
              aria-label={t('formatEditor.trueValues')}
              value={joinList(format.trueValues)}
              size={size}
              disabled={fieldDisabled('format.trueValues')}
              onChange={(event) => updateFormat({ trueValues: splitList(event.target.value) })}
              placeholder={t('formatEditor.booleanValuesPlaceholder')}
            />
          </FormatField>
          <FormatField label={t('formatEditor.falseValues')} labelWidth={labelWidth}>
            <Input
              aria-label={t('formatEditor.falseValues')}
              value={joinList(format.falseValues)}
              size={size}
              disabled={fieldDisabled('format.falseValues')}
              onChange={(event) => updateFormat({ falseValues: splitList(event.target.value) })}
              placeholder={t('formatEditor.booleanValuesPlaceholder')}
            />
          </FormatField>
        </>
      ) : null}

          {format.type !== 'none' ? (
            <FormatField label={t('formatEditor.nullValue')} labelWidth={labelWidth}>
              <Input
                aria-label={t('formatEditor.nullValue')}
                value={format.nullValue ?? ''}
                size={size}
                disabled={fieldDisabled('format.nullValue')}
                onChange={(event) => updateFormat({ nullValue: event.target.value })}
                placeholder={t('formatEditor.noValuePlaceholder')}
              />
            </FormatField>
          ) : null}
        </div>
      </div>
    </div>
  );
};

function isNumericFormat(type: TextFormatType): boolean {
  return type === 'number' || type === 'currency' || type === 'percent';
}

function getPreviewValue(type: TextFormatType): unknown {
  switch (type) {
    case 'text':
      return ' sample text ';
    case 'date':
      return '2026-05-07T09:08:07Z';
    case 'time':
      return '2026-05-07T09:08:07Z';
    case 'dateTime':
      return '2026-05-07T09:08:07Z';
    case 'percent':
      return 0.2567;
    case 'boolean':
      return true;
    case 'number':
    case 'currency':
    case 'custom':
      return 1234567.89;
    case 'none':
    default:
      return 1234567.89;
  }
}

function splitList(value: string): string[] {
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

function joinList(value: string[] | undefined): string {
  return value?.join(', ') ?? '';
}

const CompactSwitch: React.FC<{
  'aria-label': string;
  checked: boolean;
  disabled?: boolean;
  size?: 'small' | 'default';
  onChange: (checked: boolean) => void;
}> = ({
  'aria-label': ariaLabel,
  checked,
  disabled,
  onChange,
  size,
}) => (
  <span
    data-testid="format-switch-control"
    style={{
      alignItems: 'center',
      display: 'inline-flex',
      justifySelf: 'start',
      minWidth: 0,
      width: 'fit-content',
    }}
  >
    <Switch
      aria-label={ariaLabel}
      checked={checked}
      disabled={disabled}
      size={size}
      style={{ flex: '0 0 auto', minWidth: size === 'small' ? 36 : 44, width: size === 'small' ? 36 : 44 }}
      onChange={onChange}
    />
  </span>
);

interface LabeledSelectProps<Value extends string | number> {
  'aria-label': string;
  disabled?: boolean;
  options: Array<{ value: Value; label: React.ReactNode }>;
  size?: 'small' | 'middle' | 'large';
  style?: React.CSSProperties;
  value?: Value;
  virtual?: boolean;
  onChange: (value: Value) => void;
}

function LabeledSelect<Value extends string | number>({
  'aria-label': ariaLabel,
  disabled,
  onChange,
  options,
  size,
  style,
  value,
  virtual,
}: LabeledSelectProps<Value>) {
  return (
    <div data-format-select="" aria-label={ariaLabel} aria-disabled={disabled ? 'true' : undefined}>
      <Select<Value>
        disabled={disabled}
        options={options}
        size={size}
        style={{ width: '100%', ...style }}
        value={value}
        virtual={virtual}
        onChange={(nextValue) => onChange(nextValue)}
      />
    </div>
  );
}

const FormatField: React.FC<React.PropsWithChildren<{ label: string; labelWidth: number }>> = ({
  children,
  label,
  labelWidth,
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: `${labelWidth}px minmax(0, 1fr)`, gap: 10, alignItems: 'center' }}>
    <span style={{ fontSize: 12, color: '#595959' }}>{label}</span>
    {children}
  </div>
);
