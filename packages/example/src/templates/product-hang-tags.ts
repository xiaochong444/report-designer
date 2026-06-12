import { band, barcode, commonTextStyleIds, template, text } from './common';

export const productHangTagsData = {
  hangTags: [
    { styleNo: 'KZ-86021', productName: '特种绣花针织裤', color: '藏青', size: 'M', retailPrice: 199 },
    { styleNo: 'KZ-86022', productName: '弹力修身休闲裤', color: '米白', size: 'L', retailPrice: 169 },
    { styleNo: 'KZ-86023', productName: '轻薄防晒外套', color: '浅蓝', size: 'M', retailPrice: 229 },
    { styleNo: 'KZ-86024', productName: '纯棉圆领T恤', color: '黑色', size: 'XL', retailPrice: 89 },
    { styleNo: 'KZ-86025', productName: '亚麻休闲衬衫', color: '卡其', size: 'L', retailPrice: 179 },
    { styleNo: 'KZ-86026', productName: '运动束脚裤', color: '深灰', size: 'M', retailPrice: 149 },
    { styleNo: 'KZ-86027', productName: '牛仔半身裙', color: '靛蓝', size: 'S', retailPrice: 199 },
    { styleNo: 'KZ-86028', productName: '针织开衫', color: '杏色', size: 'M', retailPrice: 159 },
    { styleNo: 'KZ-86029', productName: '连帽卫衣', color: '酒红', size: 'L', retailPrice: 189 },
    { styleNo: 'KZ-86030', productName: '工装短裤', color: '军绿', size: 'M', retailPrice: 129 },
    { styleNo: 'KZ-86031', productName: '雪纺连衣裙', color: '粉色', size: 'S', retailPrice: 259 },
    { styleNo: 'KZ-86032', productName: '羊毛呢大衣', color: '驼色', size: 'L', retailPrice: 599 },
  ],
};

export const productHangTagsTemplate = template('product-hang-tags', '商品吊牌批量打印', [
  band('pht-title', 'reportTitle', 12, [
    text('pht-title-text', '商品吊牌批量打印', 0, 1, 190, 8, { style: commonTextStyleIds.title, textAlign: 'center' }),
  ]),
  band('pht-page-header', 'pageHeader', 7, [
    text('pht-page-header-text', '三列标签布局，含款号条码', 0, 0, 150, 5, { style: commonTextStyleIds.pageHeader }),
  ]),
  band('pht-column-header', 'columnHeader', 6, [
    text('pht-column-header-text', 'SUMMER 2026', 0, 1, 50, 4, {
      style: commonTextStyleIds.pageHeader,
      font: { size: 7, bold: true, color: '#92400e' },
      textAlign: 'center',
    }),
  ]),
  band('pht-data', 'data', 36, [
    text('pht-card-border', '', 0, 0, 50, 34, {
      backgroundColor: '#fffdf7',
      border: { style: 'solid', width: 0.3, color: '#d97706', sides: { top: true, right: true, bottom: true, left: true } },
    }),
    text('pht-style', '{hangTags.styleNo}', 3, 2, 44, 4, {
      style: commonTextStyleIds.pageHeader,
      font: { size: 7, color: '#6b7280' },
    }),
    text('pht-name', '{hangTags.productName}', 3, 7, 44, 6, {
      style: commonTextStyleIds.header,
      font: { size: 8, bold: true, color: '#111827' },
    }),
    text('pht-spec', '{hangTags.color} / {hangTags.size}', 3, 14, 44, 4, {
      style: commonTextStyleIds.data,
      font: { size: 7, color: '#6b7280' },
    }),
    text('pht-price', '¥{hangTags.retailPrice}', 3, 19, 28, 8, {
      style: commonTextStyleIds.data,
      font: { size: 14, bold: true, color: '#b91c1c' },
    }),
    barcode('pht-barcode', '{hangTags.styleNo}', 3, 27, 44, 6, { showText: false }),
  ], {
    dataBand: {
      dataSourceId: 'hangTags',
      columns: { count: 3, gap: 5, direction: 'acrossThenDown' },
    },
  }),
  band('pht-page-footer', 'pageFooter', 8, [
    text('pht-page-number', '{PageNumber}/{TotalPages}', 70, 1, 50, 6, { style: commonTextStyleIds.footerCenter }),
  ]),
]);
