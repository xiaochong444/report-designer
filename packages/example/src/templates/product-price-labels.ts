import { band, commonTextStyleIds, template, text } from './common';

export const productPriceLabelsData = {
  productLabels: [
    { sku: 'PL-1001', name: 'Organic Apples', category: 'Fresh Produce', price: 3.99, unit: 'lb' },
    { sku: 'PL-1002', name: 'Whole Milk', category: 'Dairy', price: 4.59, unit: 'gal' },
    { sku: 'PL-1003', name: 'Sourdough Bread', category: 'Bakery', price: 5.49, unit: 'loaf' },
    { sku: 'PL-1004', name: 'Free Range Eggs', category: 'Dairy', price: 6.29, unit: 'dozen' },
    { sku: 'PL-1005', name: 'Arabica Coffee', category: 'Pantry', price: 12.99, unit: 'bag' },
    { sku: 'PL-1006', name: 'Greek Yogurt', category: 'Dairy', price: 1.89, unit: 'cup' },
    { sku: 'PL-1007', name: 'Cherry Tomatoes', category: 'Fresh Produce', price: 2.79, unit: 'box' },
    { sku: 'PL-1008', name: 'Sparkling Water', category: 'Beverage', price: 7.99, unit: 'pack' },
    { sku: 'PL-1009', name: 'Dark Chocolate', category: 'Snacks', price: 3.49, unit: 'bar' },
    { sku: 'PL-1010', name: 'Olive Oil', category: 'Pantry', price: 10.99, unit: 'bottle' },
    { sku: 'PL-1011', name: 'Granola Mix', category: 'Breakfast', price: 4.99, unit: 'bag' },
    { sku: 'PL-1012', name: 'Herbal Tea', category: 'Beverage', price: 5.99, unit: 'box' },
  ],
};

export const productPriceLabelsTemplate = template('product-price-labels', 'Product Price Labels', [
  band('ppl-title', 'reportTitle', 12, [
    text('ppl-title-text', 'Product Price Labels', 0, 1, 170, 8, { style: commonTextStyleIds.title }),
  ]),
  band('ppl-page-header', 'pageHeader', 7, [
    text('ppl-page-header-text', 'Three-column price labels driven by a DataBand', 0, 0, 150, 5, { style: commonTextStyleIds.pageHeader }),
  ]),
  band('ppl-column-header', 'columnHeader', 6, [
    text('ppl-column-header-text', 'FRESH MARKET', 0, 1, 50, 4, { style: commonTextStyleIds.pageHeader, font: { size: 7, bold: true, color: '#92400e' } }),
  ]),
  band('ppl-data', 'data', 32, [
    text('ppl-card-border', '', 0, 0, 50, 30, {
      backgroundColor: '#fffdf7',
      border: { style: 'solid', width: 0.3, color: '#d97706', sides: { top: true, right: true, bottom: true, left: true } },
    }),
    text('ppl-category', '{productLabels.category}', 3, 2, 44, 4, { style: commonTextStyleIds.pageHeader, font: { size: 7, color: '#92400e', bold: true } }),
    text('ppl-name', '{productLabels.name}', 3, 7, 44, 6, { style: commonTextStyleIds.header, font: { size: 8, bold: true, color: '#111827' } }),
    text('ppl-price', '${productLabels.price}', 3, 14, 28, 10, { style: commonTextStyleIds.data, font: { size: 17, bold: true, color: '#b91c1c' } }),
    text('ppl-unit', '/ {productLabels.unit}', 31, 18, 16, 4, { style: commonTextStyleIds.data, font: { size: 7, color: '#6b7280' } }),
    text('ppl-sku', '{productLabels.sku}', 3, 25, 44, 4, { style: commonTextStyleIds.pageHeader, font: { size: 7, color: '#6b7280' } }),
  ], {
    dataBand: {
      dataSourceId: 'productLabels',
      columns: { count: 3, gap: 5, direction: 'acrossThenDown' },
    },
  }),
  band('ppl-page-footer', 'pageFooter', 8, [
    text('ppl-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footerCenter }),
  ]),
]);
