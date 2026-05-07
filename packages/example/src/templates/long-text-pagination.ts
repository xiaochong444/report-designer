import { band, commonTextStyleIds, template, text } from './common';

const paragraph = [
  'This report uses a canGrow text component to exercise deterministic pagination.',
  'The paragraph is intentionally long enough to wrap across several measured lines in millimeter coordinates.',
  'It should grow inside the data band without overflowing the printable page area.',
].join(' ');

export const longTextPaginationTemplate = template('long-text-pagination', 'Long Text Pagination', [
  band('lt-title', 'reportTitle', 12, [
    text('lt-title-text', 'Long Text Pagination', 0, 1, 190, 8, { style: commonTextStyleIds.title, textAlign: 'center' }),
  ]),
  band('lt-header', 'header', 8, [
    text('lt-header-text', 'Narrative rows', 0, 1, 100, 5, { style: commonTextStyleIds.header }),
  ]),
  band('lt-data', 'data', 14, [
    text('lt-name', '{employees.name}', 0, 1, 36, 5, { style: commonTextStyleIds.header }),
    text('lt-paragraph', paragraph, 40, 1, 136, 8, { style: commonTextStyleIds.data, canGrow: true }),
  ], { dataBand: { dataSourceId: 'employees' } }),
  band('lt-page-footer', 'pageFooter', 8, [
    text('lt-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footer, textAlign: 'center' }),
  ]),
]);
