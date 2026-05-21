export type DesignerLocale = 'zh-CN' | 'en-US';

export type DesignerMessageKey =
  | 'common.cancel'
  | 'common.delete'
  | 'common.done'
  | 'common.duplicate'
  | 'common.new'
  | 'common.apply'
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
  | 'ribbon.conditionalFormats'
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
  | 'formatEditor.type'
  | 'formatEditor.preview'
  | 'formatEditor.settings'
  | 'formatEditor.none'
  | 'formatEditor.text'
  | 'formatEditor.number'
  | 'formatEditor.currency'
  | 'formatEditor.date'
  | 'formatEditor.time'
  | 'formatEditor.dateTime'
  | 'formatEditor.percent'
  | 'formatEditor.boolean'
  | 'formatEditor.custom'
  | 'formatEditor.pattern'
  | 'formatEditor.decimalDigits'
  | 'formatEditor.decimalSeparator'
  | 'formatEditor.useGroupSeparator'
  | 'formatEditor.groupSeparator'
  | 'formatEditor.groupSize'
  | 'formatEditor.useAbbreviation'
  | 'formatEditor.positivePattern'
  | 'formatEditor.positivePlain'
  | 'formatEditor.positivePlus'
  | 'formatEditor.negativePattern'
  | 'formatEditor.negativeMinus'
  | 'formatEditor.negativeParentheses'
  | 'formatEditor.currencySymbol'
  | 'formatEditor.currencySymbolPosition'
  | 'formatEditor.prefix'
  | 'formatEditor.suffix'
  | 'formatEditor.currencySpace'
  | 'formatEditor.percentMultiplier'
  | 'formatEditor.percentFraction'
  | 'formatEditor.percentWhole'
  | 'formatEditor.percentSymbol'
  | 'formatEditor.percentSymbolPosition'
  | 'formatEditor.percentSpace'
  | 'formatEditor.dateFormat'
  | 'formatEditor.timeFormat'
  | 'formatEditor.transform'
  | 'formatEditor.transformNone'
  | 'formatEditor.uppercase'
  | 'formatEditor.lowercase'
  | 'formatEditor.capitalize'
  | 'formatEditor.trimText'
  | 'formatEditor.nullValue'
  | 'formatEditor.trueText'
  | 'formatEditor.falseText'
  | 'formatEditor.trueValues'
  | 'formatEditor.falseValues'
  | 'formatEditor.booleanValuesPlaceholder'
  | 'formatEditor.noValuePlaceholder'
  | 'styleLibrary.borderNone'
  | 'styleLibrary.borderSolid'
  | 'styleLibrary.borderDashed'
  | 'styleLibrary.borderDotted'
  | 'styleLibrary.borderDouble'
  | 'styleLibrary.noValuePlaceholder'
  | 'leftPanel.reportExplorer'
  | 'leftPanel.components'
  | 'leftPanel.dictionary'
  | 'leftPanel.report'
  | 'leftPanel.componentsHint'
  | 'leftPanel.componentText'
  | 'leftPanel.componentImage'
  | 'leftPanel.componentBarcode'
  | 'leftPanel.componentTable'
  | 'leftPanel.componentCheckbox'
  | 'leftPanel.componentRichText'
  | 'leftPanel.componentSubreport'
  | 'leftPanel.componentPanel'
  | 'leftPanel.componentLine'
  | 'leftPanel.componentShape'
  | 'leftPanel.componentPageNumber'
  | 'leftPanel.componentDateTime'
  | 'leftPanel.groupCommon'
  | 'leftPanel.groupData'
  | 'leftPanel.groupGraphics'
  | 'leftPanel.groupAdvanced'
  | 'leftPanel.searchComponents'
  | 'leftPanel.searchDictionary'
  | 'leftPanel.searchReportTree'
  | 'leftPanel.dataSources'
  | 'leftPanel.variables'
  | 'leftPanel.noVariables'
  | 'leftPanel.systemVariables'
  | 'leftPanel.functions'
  | 'leftPanel.resources'
  | 'leftPanel.noResources'
  | 'selection.component'
  | 'selection.components'
  | 'selection.band'
  | 'contextMenu.copy'
  | 'contextMenu.cut'
  | 'contextMenu.paste'
  | 'contextMenu.duplicate'
  | 'contextMenu.bringToFront'
  | 'contextMenu.sendToBack'
  | 'contextMenu.delete'
  | 'contextMenu.table.insertColumnRight'
  | 'contextMenu.table.deleteColumn'
  | 'contextMenu.table.insertRowBelow'
  | 'contextMenu.table.deleteRow'
  | 'contextMenu.table.mergeRight'
  | 'contextMenu.table.splitCell'
  | 'contextMenu.table.clearCell'
  | 'contextMenu.table.equalizeColumns'
  | 'contextMenu.table.equalizeRows'
  | 'contextMenu.table.toggleBorder'
  | 'pageSettings.title'
  | 'pageSettings.noPage'
  | 'pageSettings.page'
  | 'pageSettings.paperType'
  | 'pageSettings.reportUnit'
  | 'pageSettings.custom'
  | 'pageSettings.millimeter'
  | 'pageSettings.centimeter'
  | 'pageSettings.width'
  | 'pageSettings.height'
  | 'pageSettings.orientation'
  | 'pageSettings.portrait'
  | 'pageSettings.landscape'
  | 'pageSettings.margins'
  | 'pageSettings.top'
  | 'pageSettings.right'
  | 'pageSettings.bottom'
  | 'pageSettings.left'
  | 'pageSettings.fonts'
  | 'pageSettings.addFont'
  | 'pageSettings.removeFont'
  | 'pageSettings.fontName'
  | 'pageSettings.fontFamily'
  | 'pageSettings.fontFallback'
  | 'pageSettings.fontUrl'
  | 'richText.font'
  | 'richText.fontSize'
  | 'richText.bold'
  | 'richText.italic'
  | 'richText.underline'
  | 'richText.strike'
  | 'richText.textColor'
  | 'richText.alignLeft'
  | 'richText.alignCenter'
  | 'richText.alignRight'
  | 'richText.bulletList'
  | 'richText.orderedList'
  | 'richText.clearFormat'
  | 'richText.save'
  | 'richText.cancel'
  | 'richText.editor'
  | 'dataBand.dataSource'
  | 'dataBand.sort.title'
  | 'dataBand.sort.addRule'
  | 'dataBand.sort.fieldAria'
  | 'dataBand.sort.ascending'
  | 'dataBand.sort.descending'
  | 'dataBand.sort.moveUp'
  | 'dataBand.sort.moveDown'
  | 'dataBand.sort.deleteRule'
  | 'dataBand.sort.noFields'
  | 'events.title'
  | 'events.script'
  | 'events.validate'
  | 'events.apply'
  | 'events.cancel'
  | 'events.enabled'
  | 'events.off'
  | 'events.helper'
  | 'events.editorLoading'
  | 'events.contextHelpers'
  | 'events.examples'
  | 'events.typeWarnings'
  | 'events.fields'
  | 'events.components'
  | 'events.validationPassed'
  | 'events.edit'
  | 'events.beforePreview'
  | 'events.beforePrint'
  | 'events.beforeRender'
  | 'events.afterRender'
  | 'events.beforeData'
  | 'events.afterData'
  | 'events.beforeRow'
  | 'events.afterRow'
  | 'events.getValue'
  | 'events.afterPrint'
  | 'events.helper.log.info'
  | 'events.helper.log.warning'
  | 'events.helper.log.error'
  | 'events.helper.flow.hide'
  | 'events.helper.flow.cancel'
  | 'events.helper.value.setValue'
  | 'events.helper.mutation.bindText'
  | 'events.helper.mutation.getComponent'
  | 'events.helper.mutation.setComponentProperty'
  | 'events.helper.dynamic.createText'
  | 'events.helper.dynamic.createImage'
  | 'events.helper.dynamic.createBarcode'
  | 'events.example.setValue'
  | 'events.example.setValue.detail'
  | 'events.example.hideComponent'
  | 'events.example.hideComponent.detail'
  | 'events.example.readRow'
  | 'events.example.readRow.detail'
  | 'events.example.reportState'
  | 'events.example.reportState.detail'
  | 'events.example.logMessage'
  | 'events.example.logMessage.detail';

export type DesignerMessages = Record<DesignerMessageKey, string>;

export const designerMessages: Record<DesignerLocale, DesignerMessages> = {
  'zh-CN': {
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.done': '完成',
    'common.duplicate': '复制',
    'common.new': '新建',
    'common.apply': '应用',
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
    'ribbon.conditionalFormats': '条件格式',
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
    'formatEditor.type': '格式类型',
    'formatEditor.preview': '预览',
    'formatEditor.settings': '设置',
    'formatEditor.none': '无格式',
    'formatEditor.text': '文本',
    'formatEditor.number': '数字',
    'formatEditor.currency': '货币',
    'formatEditor.date': '日期',
    'formatEditor.time': '时间',
    'formatEditor.dateTime': '日期时间',
    'formatEditor.percent': '百分比',
    'formatEditor.boolean': '布尔值',
    'formatEditor.custom': '自定义',
    'formatEditor.pattern': '格式模式',
    'formatEditor.decimalDigits': '小数位数',
    'formatEditor.decimalSeparator': '小数分隔符',
    'formatEditor.useGroupSeparator': '使用分组分隔符',
    'formatEditor.groupSeparator': '分组分隔符',
    'formatEditor.groupSize': '分组大小',
    'formatEditor.useAbbreviation': '数字缩写',
    'formatEditor.positivePattern': '正数格式',
    'formatEditor.positivePlain': '1234',
    'formatEditor.positivePlus': '+1234',
    'formatEditor.negativePattern': '负数格式',
    'formatEditor.negativeMinus': '-1234',
    'formatEditor.negativeParentheses': '(1234)',
    'formatEditor.currencySymbol': '货币符号',
    'formatEditor.currencySymbolPosition': '符号位置',
    'formatEditor.prefix': '前缀',
    'formatEditor.suffix': '后缀',
    'formatEditor.currencySpace': '符号空格',
    'formatEditor.percentMultiplier': '百分比输入',
    'formatEditor.percentFraction': '0.25 显示 25%',
    'formatEditor.percentWhole': '25 显示 25%',
    'formatEditor.percentSymbol': '百分比符号',
    'formatEditor.percentSymbolPosition': '符号位置',
    'formatEditor.percentSpace': '符号空格',
    'formatEditor.dateFormat': '日期格式',
    'formatEditor.timeFormat': '时间格式',
    'formatEditor.transform': '文本转换',
    'formatEditor.transformNone': '不转换',
    'formatEditor.uppercase': '大写',
    'formatEditor.lowercase': '小写',
    'formatEditor.capitalize': '首字母大写',
    'formatEditor.trimText': '去除首尾空格',
    'formatEditor.nullValue': '空值文本',
    'formatEditor.trueText': '真值文本',
    'formatEditor.falseText': '假值文本',
    'formatEditor.trueValues': '真值输入',
    'formatEditor.falseValues': '假值输入',
    'formatEditor.booleanValuesPlaceholder': '多个值用逗号分隔',
    'formatEditor.noValuePlaceholder': '空值时显示',
    'styleLibrary.borderNone': '无',
    'styleLibrary.borderSolid': '实线',
    'styleLibrary.borderDashed': '虚线',
    'styleLibrary.borderDotted': '点线',
    'styleLibrary.borderDouble': '双线',
    'styleLibrary.noValuePlaceholder': '无值',
    'leftPanel.reportExplorer': '报表树',
    'leftPanel.components': '组件',
    'leftPanel.dictionary': '字典',
    'leftPanel.report': '报表',
    'leftPanel.componentsHint': '将常用报表组件拖入选中的带区。',
    'leftPanel.componentText': '文本',
    'leftPanel.componentImage': '图片',
    'leftPanel.componentBarcode': '条码',
    'leftPanel.componentTable': '表格',
    'leftPanel.componentCheckbox': '复选框',
    'leftPanel.componentRichText': '富文本',
    'leftPanel.componentSubreport': '子报表',
    'leftPanel.componentPanel': '面板',
    'leftPanel.componentLine': '线条',
    'leftPanel.componentShape': '形状',
    'leftPanel.componentPageNumber': '页码',
    'leftPanel.componentDateTime': '日期时间',
    'leftPanel.groupCommon': '常用',
    'leftPanel.groupData': '数据',
    'leftPanel.groupGraphics': '图形',
    'leftPanel.groupAdvanced': '高级',
    'leftPanel.searchComponents': '搜索组件',
    'leftPanel.searchDictionary': '搜索数据源和字段',
    'leftPanel.searchReportTree': '搜索报表树',
    'leftPanel.dataSources': '数据源',
    'leftPanel.variables': '变量',
    'leftPanel.noVariables': '暂无变量',
    'leftPanel.systemVariables': '系统变量',
    'leftPanel.functions': '函数',
    'leftPanel.resources': '资源',
    'leftPanel.noResources': '暂无资源',
    'selection.component': '组件',
    'selection.components': '{count} 个组件',
    'selection.band': '带区',
    'contextMenu.copy': '复制',
    'contextMenu.cut': '剪切',
    'contextMenu.paste': '粘贴',
    'contextMenu.duplicate': '复制一份',
    'contextMenu.bringToFront': '置于顶层',
    'contextMenu.sendToBack': '置于底层',
    'contextMenu.delete': '删除',
    'contextMenu.table.insertColumnRight': '插入列到右侧',
    'contextMenu.table.deleteColumn': '删除列',
    'contextMenu.table.insertRowBelow': '插入行到下方',
    'contextMenu.table.deleteRow': '删除行',
    'contextMenu.table.mergeRight': '合并右侧单元格',
    'contextMenu.table.splitCell': '拆分单元格',
    'contextMenu.table.clearCell': '清空单元格',
    'contextMenu.table.equalizeColumns': '均分列宽',
    'contextMenu.table.equalizeRows': '均分行高',
    'contextMenu.table.toggleBorder': '切换表格边框',
    'pageSettings.title': '页面设置',
    'pageSettings.noPage': '未选择页面',
    'pageSettings.page': '页面',
    'pageSettings.paperType': '纸张类型',
    'pageSettings.reportUnit': '报表单位',
    'pageSettings.custom': '自定义',
    'pageSettings.millimeter': '毫米',
    'pageSettings.centimeter': '厘米',
    'pageSettings.width': '宽度',
    'pageSettings.height': '高度',
    'pageSettings.orientation': '方向',
    'pageSettings.portrait': '纵向',
    'pageSettings.landscape': '横向',
    'pageSettings.margins': '页边距',
    'pageSettings.top': '上',
    'pageSettings.right': '右',
    'pageSettings.bottom': '下',
    'pageSettings.left': '左',
    'pageSettings.fonts': '字体',
    'pageSettings.addFont': '添加字体',
    'pageSettings.removeFont': '删除字体',
    'pageSettings.fontName': '字体名称',
    'pageSettings.fontFamily': 'CSS 字体族',
    'pageSettings.fontFallback': '备用字体',
    'pageSettings.fontUrl': '字体地址',
    'richText.font': '富文本字体',
    'richText.fontSize': '富文本字号',
    'richText.bold': '加粗',
    'richText.italic': '斜体',
    'richText.underline': '下划线',
    'richText.strike': '删除线',
    'richText.textColor': '文字颜色',
    'richText.alignLeft': '左对齐',
    'richText.alignCenter': '居中',
    'richText.alignRight': '右对齐',
    'richText.bulletList': '项目符号',
    'richText.orderedList': '编号列表',
    'richText.clearFormat': '清除格式',
    'richText.save': '保存富文本',
    'richText.cancel': '取消富文本',
    'richText.editor': '富文本编辑器',
    'dataBand.dataSource': '数据源',
    'dataBand.sort.title': '排序',
    'dataBand.sort.addRule': '添加排序规则',
    'dataBand.sort.fieldAria': '排序字段 {index}',
    'dataBand.sort.ascending': '升序',
    'dataBand.sort.descending': '降序',
    'dataBand.sort.moveUp': '上移排序规则 {index}',
    'dataBand.sort.moveDown': '下移排序规则 {index}',
    'dataBand.sort.deleteRule': '删除排序规则 {index}',
    'dataBand.sort.noFields': '当前数据源没有可排序字段',
    'events.title': '事件',
    'events.script': '脚本',
    'events.validate': '校验',
    'events.apply': '应用',
    'events.cancel': '取消',
    'events.enabled': '启用',
    'events.off': '关闭',
    'events.helper': '辅助',
    'events.editorLoading': '正在加载脚本编辑器',
    'events.contextHelpers': '上下文辅助',
    'events.examples': '示例',
    'events.typeWarnings': '类型警告',
    'events.fields': '字段',
    'events.components': '组件',
    'events.validationPassed': '校验通过',
    'events.edit': '编辑事件',
    'events.beforePreview': '预览前',
    'events.beforePrint': '打印前',
    'events.beforeRender': '渲染前',
    'events.afterRender': '渲染后',
    'events.beforeData': '取数前',
    'events.afterData': '取数后',
    'events.beforeRow': '行前',
    'events.afterRow': '行后',
    'events.getValue': '取值',
    'events.afterPrint': '打印后',
    'events.helper.log.info': '记录普通信息',
    'events.helper.log.warning': '记录警告信息',
    'events.helper.log.error': '记录错误信息',
    'events.helper.flow.hide': '隐藏当前组件',
    'events.helper.flow.cancel': '取消当前事件',
    'events.helper.value.setValue': '设置事件值',
    'events.helper.mutation.bindText': '绑定文本组件表达式',
    'events.helper.mutation.getComponent': '获取组件',
    'events.helper.mutation.setComponentProperty': '设置组件属性',
    'events.helper.dynamic.createText': '创建文本组件',
    'events.helper.dynamic.createImage': '创建图片组件',
    'events.helper.dynamic.createBarcode': '创建条码组件',
    'events.example.setValue': '设置事件值',
    'events.example.setValue.detail': '为取值事件写入返回值',
    'events.example.hideComponent': '隐藏组件',
    'events.example.hideComponent.detail': '在运行时隐藏当前组件',
    'events.example.readRow': '读取当前行',
    'events.example.readRow.detail': '读取带区事件的当前数据行',
    'events.example.reportState': '写入报表状态',
    'events.example.reportState.detail': '在报表事件中记录可复用状态',
    'events.example.logMessage': '记录日志',
    'events.example.logMessage.detail': '向事件日志写入调试信息',
  },
  'en-US': {
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.done': 'Done',
    'common.duplicate': 'Duplicate',
    'common.new': 'New',
    'common.apply': 'Apply',
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
    'ribbon.conditionalFormats': 'Conditional Formats',
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
    'formatEditor.type': 'Format Type',
    'formatEditor.preview': 'Preview',
    'formatEditor.settings': 'Settings',
    'formatEditor.none': 'None',
    'formatEditor.text': 'Text',
    'formatEditor.number': 'Number',
    'formatEditor.currency': 'Currency',
    'formatEditor.date': 'Date',
    'formatEditor.time': 'Time',
    'formatEditor.dateTime': 'Date/Time',
    'formatEditor.percent': 'Percent',
    'formatEditor.boolean': 'Boolean',
    'formatEditor.custom': 'Custom',
    'formatEditor.pattern': 'Pattern',
    'formatEditor.decimalDigits': 'Decimal digits',
    'formatEditor.decimalSeparator': 'Decimal separator',
    'formatEditor.useGroupSeparator': 'Use group separator',
    'formatEditor.groupSeparator': 'Group separator',
    'formatEditor.groupSize': 'Group size',
    'formatEditor.useAbbreviation': 'Abbreviation',
    'formatEditor.positivePattern': 'Positive format',
    'formatEditor.positivePlain': '1234',
    'formatEditor.positivePlus': '+1234',
    'formatEditor.negativePattern': 'Negative format',
    'formatEditor.negativeMinus': '-1234',
    'formatEditor.negativeParentheses': '(1234)',
    'formatEditor.currencySymbol': 'Currency symbol',
    'formatEditor.currencySymbolPosition': 'Symbol position',
    'formatEditor.prefix': 'Prefix',
    'formatEditor.suffix': 'Suffix',
    'formatEditor.currencySpace': 'Symbol space',
    'formatEditor.percentMultiplier': 'Percent input',
    'formatEditor.percentFraction': '0.25 shows 25%',
    'formatEditor.percentWhole': '25 shows 25%',
    'formatEditor.percentSymbol': 'Percent symbol',
    'formatEditor.percentSymbolPosition': 'Symbol position',
    'formatEditor.percentSpace': 'Symbol space',
    'formatEditor.dateFormat': 'Date format',
    'formatEditor.timeFormat': 'Time format',
    'formatEditor.transform': 'Text transform',
    'formatEditor.transformNone': 'No transform',
    'formatEditor.uppercase': 'Uppercase',
    'formatEditor.lowercase': 'Lowercase',
    'formatEditor.capitalize': 'Capitalize',
    'formatEditor.trimText': 'Trim text',
    'formatEditor.nullValue': 'Null text',
    'formatEditor.trueText': 'True text',
    'formatEditor.falseText': 'False text',
    'formatEditor.trueValues': 'True inputs',
    'formatEditor.falseValues': 'False inputs',
    'formatEditor.booleanValuesPlaceholder': 'Separate multiple values with commas',
    'formatEditor.noValuePlaceholder': 'Text for null values',
    'styleLibrary.borderNone': 'None',
    'styleLibrary.borderSolid': 'Solid',
    'styleLibrary.borderDashed': 'Dashed',
    'styleLibrary.borderDotted': 'Dotted',
    'styleLibrary.borderDouble': 'Double',
    'styleLibrary.noValuePlaceholder': 'No value',
    'leftPanel.reportExplorer': 'Report Explorer',
    'leftPanel.components': 'Components',
    'leftPanel.dictionary': 'Dictionary',
    'leftPanel.report': 'Report',
    'leftPanel.componentsHint': 'Drag common report controls into the selected band.',
    'leftPanel.componentText': 'Text',
    'leftPanel.componentImage': 'Image',
    'leftPanel.componentBarcode': 'Barcode',
    'leftPanel.componentTable': 'Table',
    'leftPanel.componentCheckbox': 'Checkbox',
    'leftPanel.componentRichText': 'Rich Text',
    'leftPanel.componentSubreport': 'Subreport',
    'leftPanel.componentPanel': 'Panel',
    'leftPanel.componentLine': 'Line',
    'leftPanel.componentShape': 'Shape',
    'leftPanel.componentPageNumber': 'Page #',
    'leftPanel.componentDateTime': 'Date/Time',
    'leftPanel.groupCommon': 'Common',
    'leftPanel.groupData': 'Data',
    'leftPanel.groupGraphics': 'Graphics',
    'leftPanel.groupAdvanced': 'Advanced',
    'leftPanel.searchComponents': 'Search components',
    'leftPanel.searchDictionary': 'Search data sources and fields',
    'leftPanel.searchReportTree': 'Search report tree',
    'leftPanel.dataSources': 'Data sources',
    'leftPanel.variables': 'Variables',
    'leftPanel.noVariables': 'No variables',
    'leftPanel.systemVariables': 'System variables',
    'leftPanel.functions': 'Functions',
    'leftPanel.resources': 'Resources',
    'leftPanel.noResources': 'No resources',
    'selection.component': 'Component',
    'selection.components': '{count} components',
    'selection.band': 'Band',
    'contextMenu.copy': 'Copy',
    'contextMenu.cut': 'Cut',
    'contextMenu.paste': 'Paste',
    'contextMenu.duplicate': 'Duplicate',
    'contextMenu.bringToFront': 'Bring to Front',
    'contextMenu.sendToBack': 'Send to Back',
    'contextMenu.delete': 'Delete',
    'contextMenu.table.insertColumnRight': 'Insert Column Right',
    'contextMenu.table.deleteColumn': 'Delete Column',
    'contextMenu.table.insertRowBelow': 'Insert Row Below',
    'contextMenu.table.deleteRow': 'Delete Row',
    'contextMenu.table.mergeRight': 'Merge Cell Right',
    'contextMenu.table.splitCell': 'Split Cell',
    'contextMenu.table.clearCell': 'Clear Cell',
    'contextMenu.table.equalizeColumns': 'Distribute Columns',
    'contextMenu.table.equalizeRows': 'Distribute Rows',
    'contextMenu.table.toggleBorder': 'Toggle Table Border',
    'pageSettings.title': 'Page Settings',
    'pageSettings.noPage': 'No page selected',
    'pageSettings.page': 'Page',
    'pageSettings.paperType': 'Paper type',
    'pageSettings.reportUnit': 'Report unit',
    'pageSettings.custom': 'Custom',
    'pageSettings.millimeter': 'Millimeter',
    'pageSettings.centimeter': 'Centimeter',
    'pageSettings.width': 'Width',
    'pageSettings.height': 'Height',
    'pageSettings.orientation': 'Orientation',
    'pageSettings.portrait': 'Portrait',
    'pageSettings.landscape': 'Landscape',
    'pageSettings.margins': 'Margins',
    'pageSettings.top': 'Top',
    'pageSettings.right': 'Right',
    'pageSettings.bottom': 'Bottom',
    'pageSettings.left': 'Left',
    'pageSettings.fonts': 'Fonts',
    'pageSettings.addFont': 'Add font',
    'pageSettings.removeFont': 'Remove font',
    'pageSettings.fontName': 'Font name',
    'pageSettings.fontFamily': 'CSS font family',
    'pageSettings.fontFallback': 'Fallback font',
    'pageSettings.fontUrl': 'Font URL',
    'richText.font': 'Rich text font',
    'richText.fontSize': 'Rich text font size',
    'richText.bold': 'Bold',
    'richText.italic': 'Italic',
    'richText.underline': 'Underline',
    'richText.strike': 'Strike',
    'richText.textColor': 'Text color',
    'richText.alignLeft': 'Align left',
    'richText.alignCenter': 'Align center',
    'richText.alignRight': 'Align right',
    'richText.bulletList': 'Bullet list',
    'richText.orderedList': 'Numbered list',
    'richText.clearFormat': 'Clear format',
    'richText.save': 'Save rich text',
    'richText.cancel': 'Cancel rich text',
    'richText.editor': 'Rich text editor',
    'dataBand.dataSource': 'Data source',
    'dataBand.sort.title': 'Sorting',
    'dataBand.sort.addRule': 'Add sort rule',
    'dataBand.sort.fieldAria': 'Sort field {index}',
    'dataBand.sort.ascending': 'Ascending',
    'dataBand.sort.descending': 'Descending',
    'dataBand.sort.moveUp': 'Move sort rule {index} up',
    'dataBand.sort.moveDown': 'Move sort rule {index} down',
    'dataBand.sort.deleteRule': 'Delete sort rule {index}',
    'dataBand.sort.noFields': 'The current data source has no sortable fields',
    'events.title': 'Events',
    'events.script': 'Script',
    'events.validate': 'Validate',
    'events.apply': 'Apply',
    'events.cancel': 'Cancel',
    'events.enabled': 'Enabled',
    'events.off': 'Off',
    'events.helper': 'Helpers',
    'events.editorLoading': 'Loading script editor',
    'events.contextHelpers': 'Context helpers',
    'events.examples': 'Examples',
    'events.typeWarnings': 'Type warnings',
    'events.fields': 'Fields',
    'events.components': 'Components',
    'events.validationPassed': 'Validation passed',
    'events.edit': 'Edit events',
    'events.beforePreview': 'Before Preview',
    'events.beforePrint': 'Before Print',
    'events.beforeRender': 'Before Render',
    'events.afterRender': 'After Render',
    'events.beforeData': 'Before Data',
    'events.afterData': 'After Data',
    'events.beforeRow': 'Before Row',
    'events.afterRow': 'After Row',
    'events.getValue': 'Get Value',
    'events.afterPrint': 'After Print',
    'events.helper.log.info': 'Write an info log entry',
    'events.helper.log.warning': 'Write a warning log entry',
    'events.helper.log.error': 'Write an error log entry',
    'events.helper.flow.hide': 'Hide the current component',
    'events.helper.flow.cancel': 'Cancel the current event',
    'events.helper.value.setValue': 'Set the event value',
    'events.helper.mutation.bindText': 'Bind a text component expression',
    'events.helper.mutation.getComponent': 'Get a component',
    'events.helper.mutation.setComponentProperty': 'Set a component property',
    'events.helper.dynamic.createText': 'Create a text component',
    'events.helper.dynamic.createImage': 'Create an image component',
    'events.helper.dynamic.createBarcode': 'Create a barcode component',
    'events.example.setValue': 'Set event value',
    'events.example.setValue.detail': 'Write the return value for a get value event',
    'events.example.hideComponent': 'Hide component',
    'events.example.hideComponent.detail': 'Hide the current component at runtime',
    'events.example.readRow': 'Read current row',
    'events.example.readRow.detail': 'Read the current data row in a band event',
    'events.example.reportState': 'Write report state',
    'events.example.reportState.detail': 'Store reusable state in a report event',
    'events.example.logMessage': 'Log message',
    'events.example.logMessage.detail': 'Write debug information to the event log',
  },
};
