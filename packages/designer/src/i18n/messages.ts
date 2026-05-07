export type DesignerLocale = 'zh-CN' | 'en-US';

export type DesignerMessageKey =
  | 'common.cancel'
  | 'common.delete'
  | 'common.done'
  | 'common.duplicate'
  | 'common.new'
  | 'common.save'
  | 'common.search'
  | 'common.default'
  | 'shell.new'
  | 'shell.open'
  | 'shell.save'
  | 'shell.undo'
  | 'shell.redo'
  | 'shell.untitledReport'
  | 'shell.designerName'
  | 'ribbon.home'
  | 'ribbon.insert'
  | 'ribbon.pageLayout'
  | 'ribbon.preview'
  | 'ribbon.file'
  | 'ribbon.history'
  | 'ribbon.clipboard'
  | 'ribbon.font'
  | 'ribbon.align'
  | 'ribbon.borders'
  | 'ribbon.styles'
  | 'ribbon.data'
  | 'ribbon.bands'
  | 'ribbon.components'
  | 'ribbon.pageSetup'
  | 'ribbon.size'
  | 'ribbon.margins'
  | 'ribbon.newReport'
  | 'ribbon.openTemplate'
  | 'ribbon.saveTemplate'
  | 'ribbon.copy'
  | 'ribbon.paste'
  | 'ribbon.deleteSelected'
  | 'ribbon.allBorders'
  | 'ribbon.styleDesigner'
  | 'ribbon.jsonDataSource'
  | 'ribbon.bandWizard'
  | 'ribbon.groupWizard'
  | 'ribbon.text'
  | 'ribbon.table'
  | 'ribbon.image'
  | 'ribbon.checkbox'
  | 'ribbon.line'
  | 'ribbon.addPage'
  | 'ribbon.pageSettings'
  | 'ribbon.settings'
  | 'ribbon.a4Portrait'
  | 'ribbon.a4Landscape'
  | 'ribbon.normalMargins'
  | 'ribbon.narrowMargins'
  | 'ribbon.wideMargins'
  | 'ribbon.printPreview'
  | 'styleLibrary.title'
  | 'styleLibrary.searchPlaceholder'
  | 'styleLibrary.preview'
  | 'styleLibrary.previewDescription'
  | 'styleLibrary.previewSample'
  | 'styleLibrary.properties'
  | 'styleLibrary.apply'
  | 'styleLibrary.applyToSelected'
  | 'styleLibrary.setDefault'
  | 'styleLibrary.general'
  | 'styleLibrary.typography'
  | 'styleLibrary.layout'
  | 'styleLibrary.format'
  | 'styleLibrary.border'
  | 'styleLibrary.padding'
  | 'styleLibrary.name'
  | 'styleLibrary.textColor'
  | 'styleLibrary.background'
  | 'styleLibrary.style'
  | 'styleLibrary.align'
  | 'styleLibrary.vertical'
  | 'styleLibrary.auto'
  | 'styleLibrary.canGrow'
  | 'styleLibrary.canShrink'
  | 'styleLibrary.type'
  | 'styleLibrary.pattern'
  | 'styleLibrary.null'
  | 'styleLibrary.true'
  | 'styleLibrary.false'
  | 'styleLibrary.borderStyle'
  | 'styleLibrary.borderWidth'
  | 'styleLibrary.borderColor'
  | 'styleLibrary.applySides'
  | 'styleLibrary.sideTop'
  | 'styleLibrary.sideRight'
  | 'styleLibrary.sideBottom'
  | 'styleLibrary.sideLeft'
  | 'styleLibrary.borderPreview'
  | 'styleLibrary.noStyles'
  | 'styleLibrary.selectStyle'
  | 'styleLibrary.usedBy'
  | 'styleLibrary.deleteTitle'
  | 'styleLibrary.deleteInUse'
  | 'styleLibrary.deleteUnused'
  | 'styleLibrary.newStyleName'
  | 'styleLibrary.fontFamily'
  | 'styleLibrary.fontSize'
  | 'styleLibrary.bold'
  | 'styleLibrary.italic'
  | 'styleLibrary.underline'
  | 'styleLibrary.strike'
  | 'styleLibrary.left'
  | 'styleLibrary.center'
  | 'styleLibrary.right'
  | 'styleLibrary.verticalTop'
  | 'styleLibrary.verticalMiddle'
  | 'styleLibrary.verticalBottom'
  | 'styleLibrary.formatNone'
  | 'styleLibrary.formatNumber'
  | 'styleLibrary.formatCurrency'
  | 'styleLibrary.formatDate'
  | 'styleLibrary.formatTime'
  | 'styleLibrary.formatPercent'
  | 'styleLibrary.formatBoolean'
  | 'styleLibrary.formatCustom'
  | 'styleLibrary.borderNone'
  | 'styleLibrary.borderSolid'
  | 'styleLibrary.borderDashed'
  | 'styleLibrary.borderDotted'
  | 'styleLibrary.borderDouble'
  | 'styleLibrary.noValuePlaceholder';

export type DesignerMessages = Record<DesignerMessageKey, string>;

export const designerMessages: Record<DesignerLocale, DesignerMessages> = {
  'zh-CN': {
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.done': '完成',
    'common.duplicate': '复制',
    'common.new': '新建',
    'common.save': '保存',
    'common.search': '搜索',
    'common.default': '默认',
    'shell.new': '新建',
    'shell.open': '打开',
    'shell.save': '保存',
    'shell.undo': '撤销',
    'shell.redo': '重做',
    'shell.untitledReport': '未命名报表',
    'shell.designerName': '报表设计器',
    'ribbon.home': '主页',
    'ribbon.insert': '插入',
    'ribbon.pageLayout': '页面布局',
    'ribbon.preview': '预览',
    'ribbon.file': '文件',
    'ribbon.history': '历史',
    'ribbon.clipboard': '剪贴板',
    'ribbon.font': '字体',
    'ribbon.align': '对齐',
    'ribbon.borders': '边框',
    'ribbon.styles': '样式',
    'ribbon.data': '数据',
    'ribbon.bands': '带区',
    'ribbon.components': '组件',
    'ribbon.pageSetup': '页面设置',
    'ribbon.size': '纸张',
    'ribbon.margins': '页边距',
    'ribbon.newReport': '新建报表',
    'ribbon.openTemplate': '打开 JSON 模板',
    'ribbon.saveTemplate': '保存 JSON 模板',
    'ribbon.copy': '复制',
    'ribbon.paste': '粘贴',
    'ribbon.deleteSelected': '删除选中对象',
    'ribbon.allBorders': '全部边框',
    'ribbon.styleDesigner': '样式设计器',
    'ribbon.jsonDataSource': 'JSON 数据源',
    'ribbon.bandWizard': '带区向导',
    'ribbon.groupWizard': '分组向导',
    'ribbon.text': '文本',
    'ribbon.table': '表格',
    'ribbon.image': '图片',
    'ribbon.checkbox': '复选框',
    'ribbon.line': '线条',
    'ribbon.addPage': '添加页面',
    'ribbon.pageSettings': '页面设置',
    'ribbon.settings': '设置',
    'ribbon.a4Portrait': 'A4 纵向',
    'ribbon.a4Landscape': 'A4 横向',
    'ribbon.normalMargins': '普通',
    'ribbon.narrowMargins': '窄',
    'ribbon.wideMargins': '宽',
    'ribbon.printPreview': '打印预览',
    'styleLibrary.title': '文本样式库',
    'styleLibrary.searchPlaceholder': '搜索样式',
    'styleLibrary.preview': '预览',
    'styleLibrary.previewDescription': '所选样式的简单文本预览。',
    'styleLibrary.previewSample': '快速文本预览 123,456.78',
    'styleLibrary.properties': '属性',
    'styleLibrary.apply': '应用',
    'styleLibrary.applyToSelected': '应用到选中项',
    'styleLibrary.setDefault': '设为默认',
    'styleLibrary.general': '常规',
    'styleLibrary.typography': '字体',
    'styleLibrary.layout': '布局',
    'styleLibrary.format': '格式',
    'styleLibrary.border': '边框',
    'styleLibrary.padding': '内边距',
    'styleLibrary.name': '名称',
    'styleLibrary.textColor': '文本颜色',
    'styleLibrary.background': '背景色',
    'styleLibrary.style': '样式',
    'styleLibrary.align': '水平',
    'styleLibrary.vertical': '垂直',
    'styleLibrary.auto': '自动',
    'styleLibrary.canGrow': '可增大',
    'styleLibrary.canShrink': '可缩小',
    'styleLibrary.type': '类型',
    'styleLibrary.pattern': '格式',
    'styleLibrary.null': '空值',
    'styleLibrary.true': '真值',
    'styleLibrary.false': '假值',
    'styleLibrary.borderStyle': '样式',
    'styleLibrary.borderWidth': '宽度',
    'styleLibrary.borderColor': '颜色',
    'styleLibrary.applySides': '应用边',
    'styleLibrary.sideTop': '上',
    'styleLibrary.sideRight': '右',
    'styleLibrary.sideBottom': '下',
    'styleLibrary.sideLeft': '左',
    'styleLibrary.borderPreview': '边框应用边预览',
    'styleLibrary.noStyles': '没有样式',
    'styleLibrary.selectStyle': '选择一个样式进行编辑',
    'styleLibrary.usedBy': '被 {count} 个文本组件使用。',
    'styleLibrary.deleteTitle': '删除“{name}”？',
    'styleLibrary.deleteInUse': '该样式当前被 {count} 个文本组件引用。删除后会清除引用组件的样式关联。',
    'styleLibrary.deleteUnused': '删除后无法恢复。',
    'styleLibrary.newStyleName': '新建样式',
    'styleLibrary.fontFamily': '字体系列',
    'styleLibrary.fontSize': '字号',
    'styleLibrary.bold': '加粗',
    'styleLibrary.italic': '斜体',
    'styleLibrary.underline': '下划线',
    'styleLibrary.strike': '删除线',
    'styleLibrary.left': '左对齐',
    'styleLibrary.center': '居中',
    'styleLibrary.right': '右对齐',
    'styleLibrary.verticalTop': '垂直靠上',
    'styleLibrary.verticalMiddle': '垂直居中',
    'styleLibrary.verticalBottom': '垂直靠下',
    'styleLibrary.formatNone': '无',
    'styleLibrary.formatNumber': '数字',
    'styleLibrary.formatCurrency': '货币',
    'styleLibrary.formatDate': '日期',
    'styleLibrary.formatTime': '时间',
    'styleLibrary.formatPercent': '百分比',
    'styleLibrary.formatBoolean': '布尔值',
    'styleLibrary.formatCustom': '自定义',
    'styleLibrary.borderNone': '无',
    'styleLibrary.borderSolid': '实线',
    'styleLibrary.borderDashed': '虚线',
    'styleLibrary.borderDotted': '点线',
    'styleLibrary.borderDouble': '双线',
    'styleLibrary.noValuePlaceholder': '无值',
  },
  'en-US': {
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.done': 'Done',
    'common.duplicate': 'Duplicate',
    'common.new': 'New',
    'common.save': 'Save',
    'common.search': 'Search',
    'common.default': 'Default',
    'shell.new': 'New',
    'shell.open': 'Open',
    'shell.save': 'Save',
    'shell.undo': 'Undo',
    'shell.redo': 'Redo',
    'shell.untitledReport': 'Untitled Report',
    'shell.designerName': 'Report Designer',
    'ribbon.home': 'Home',
    'ribbon.insert': 'Insert',
    'ribbon.pageLayout': 'Page Layout',
    'ribbon.preview': 'Preview',
    'ribbon.file': 'File',
    'ribbon.history': 'History',
    'ribbon.clipboard': 'Clipboard',
    'ribbon.font': 'Font',
    'ribbon.align': 'Align',
    'ribbon.borders': 'Borders',
    'ribbon.styles': 'Styles',
    'ribbon.data': 'Data',
    'ribbon.bands': 'Bands',
    'ribbon.components': 'Components',
    'ribbon.pageSetup': 'Page Setup',
    'ribbon.size': 'Size',
    'ribbon.margins': 'Margins',
    'ribbon.newReport': 'New report',
    'ribbon.openTemplate': 'Open JSON template',
    'ribbon.saveTemplate': 'Save JSON template',
    'ribbon.copy': 'Copy',
    'ribbon.paste': 'Paste',
    'ribbon.deleteSelected': 'Delete selected objects',
    'ribbon.allBorders': 'All borders',
    'ribbon.styleDesigner': 'Style Designer',
    'ribbon.jsonDataSource': 'JSON data source',
    'ribbon.bandWizard': 'Band wizard',
    'ribbon.groupWizard': 'Group wizard',
    'ribbon.text': 'Text',
    'ribbon.table': 'Table',
    'ribbon.image': 'Image',
    'ribbon.checkbox': 'Check',
    'ribbon.line': 'Line',
    'ribbon.addPage': 'Add page',
    'ribbon.pageSettings': 'Page settings',
    'ribbon.settings': 'Settings',
    'ribbon.a4Portrait': 'A4 Portrait',
    'ribbon.a4Landscape': 'A4 Landscape',
    'ribbon.normalMargins': 'Normal',
    'ribbon.narrowMargins': 'Narrow',
    'ribbon.wideMargins': 'Wide',
    'ribbon.printPreview': 'Print Preview',
    'styleLibrary.title': 'Text Style Library',
    'styleLibrary.searchPlaceholder': 'Search styles',
    'styleLibrary.preview': 'Preview',
    'styleLibrary.previewDescription': 'Simple text preview for the selected style.',
    'styleLibrary.previewSample': 'The quick brown fox jumps over 123,456.78',
    'styleLibrary.properties': 'Properties',
    'styleLibrary.apply': 'Apply',
    'styleLibrary.applyToSelected': 'Apply to Selected',
    'styleLibrary.setDefault': 'Set Default',
    'styleLibrary.general': 'General',
    'styleLibrary.typography': 'Typography',
    'styleLibrary.layout': 'Layout',
    'styleLibrary.format': 'Format',
    'styleLibrary.border': 'Border',
    'styleLibrary.padding': 'Padding',
    'styleLibrary.name': 'Name',
    'styleLibrary.textColor': 'Text Color',
    'styleLibrary.background': 'Background',
    'styleLibrary.style': 'Style',
    'styleLibrary.align': 'Align',
    'styleLibrary.vertical': 'Vertical',
    'styleLibrary.auto': 'Auto',
    'styleLibrary.canGrow': 'Grow',
    'styleLibrary.canShrink': 'Shrink',
    'styleLibrary.type': 'Type',
    'styleLibrary.pattern': 'Pattern',
    'styleLibrary.null': 'Null',
    'styleLibrary.true': 'True',
    'styleLibrary.false': 'False',
    'styleLibrary.borderStyle': 'Style',
    'styleLibrary.borderWidth': 'Width',
    'styleLibrary.borderColor': 'Color',
    'styleLibrary.applySides': 'Apply sides',
    'styleLibrary.sideTop': 'Top',
    'styleLibrary.sideRight': 'Right',
    'styleLibrary.sideBottom': 'Bottom',
    'styleLibrary.sideLeft': 'Left',
    'styleLibrary.borderPreview': 'Border side preview',
    'styleLibrary.noStyles': 'No styles',
    'styleLibrary.selectStyle': 'Select a style to edit',
    'styleLibrary.usedBy': 'Used by {count} text component(s).',
    'styleLibrary.deleteTitle': 'Delete "{name}"?',
    'styleLibrary.deleteInUse': 'This style is used by {count} text component(s). Deleting it clears the style reference from those components.',
    'styleLibrary.deleteUnused': 'This action cannot be undone.',
    'styleLibrary.newStyleName': 'New Style',
    'styleLibrary.fontFamily': 'Font family',
    'styleLibrary.fontSize': 'Font size',
    'styleLibrary.bold': 'Bold',
    'styleLibrary.italic': 'Italic',
    'styleLibrary.underline': 'Underline',
    'styleLibrary.strike': 'Strike',
    'styleLibrary.left': 'Left',
    'styleLibrary.center': 'Center',
    'styleLibrary.right': 'Right',
    'styleLibrary.verticalTop': 'Vertical Top',
    'styleLibrary.verticalMiddle': 'Vertical Middle',
    'styleLibrary.verticalBottom': 'Vertical Bottom',
    'styleLibrary.formatNone': 'None',
    'styleLibrary.formatNumber': 'Number',
    'styleLibrary.formatCurrency': 'Currency',
    'styleLibrary.formatDate': 'Date',
    'styleLibrary.formatTime': 'Time',
    'styleLibrary.formatPercent': 'Percent',
    'styleLibrary.formatBoolean': 'Boolean',
    'styleLibrary.formatCustom': 'Custom',
    'styleLibrary.borderNone': 'None',
    'styleLibrary.borderSolid': 'Solid',
    'styleLibrary.borderDashed': 'Dashed',
    'styleLibrary.borderDotted': 'Dotted',
    'styleLibrary.borderDouble': 'Double',
    'styleLibrary.noValuePlaceholder': 'No value',
  },
};
