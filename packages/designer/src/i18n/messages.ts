export type DesignerLocale = 'zh-CN' | 'en-US';

export type DesignerMessageKey =
  | 'common.cancel'
  | 'common.delete'
  | 'common.done'
  | 'common.ok'
  | 'common.duplicate'
  | 'common.new'
  | 'common.apply'
  | 'common.save'
  | 'common.search'
  | 'common.default'
  | 'canvas.noPageSelected'
  | 'canvas.zoomOut'
  | 'canvas.zoomReset'
  | 'canvas.zoomIn'
  | 'canvas.imagePlaceholder'
  | 'canvas.subreportPlaceholder'
  | 'canvas.localTemplatePlaceholder'
  | 'expressionEditor.title'
  | 'expressionEditor.category.expression'
  | 'expressionEditor.category.expressionSubtitle'
  | 'expressionEditor.category.data'
  | 'expressionEditor.category.dataSubtitle'
  | 'expressionEditor.category.system'
  | 'expressionEditor.category.systemSubtitle'
  | 'expressionEditor.category.aggregates'
  | 'expressionEditor.category.aggregatesSubtitle'
  | 'expressionEditor.category.html'
  | 'expressionEditor.category.htmlSubtitle'
  | 'expressionEditor.example'
  | 'expressionEditor.validate'
  | 'expressionEditor.validation.braces'
  | 'expressionEditor.validation.parens'
  | 'expressionEditor.validation.passed'
  | 'expressionEditor.tree.aggregateFunctions'
  | 'expressionEditor.tree.pageReportTotals'
  | 'expressionEditor.tree.logicFunctions'
  | 'expressionEditor.tree.moneyFunctions'
  | 'expressionEditor.html.tag'
  | 'expressionEditor.html.bold'
  | 'expressionEditor.html.italic'
  | 'expressionEditor.html.lineBreak'
  | 'expressionEditor.inline.expression'
  | 'expressionEditor.inline.valid'
  | 'expressionEditor.inline.invalid'
  | 'expressionEditor.inline.syntax'
  | 'shell.save'
  | 'shell.undo'
  | 'shell.redo'
  | 'shell.untitledReport'
  | 'shell.designerName'
  | 'ribbon.home'
  | 'ribbon.insert'
  | 'ribbon.pageLayout'
  | 'ribbon.layout'
  | 'ribbon.preview'
  | 'ribbon.file'
  | 'ribbon.history'
  | 'ribbon.clipboard'
  | 'ribbon.font'
  | 'ribbon.fontSizeControl'
  | 'ribbon.boldControl'
  | 'ribbon.align'
  | 'ribbon.borders'
  | 'ribbon.styles'
  | 'ribbon.data'
  | 'ribbon.bands'
  | 'ribbon.components'
  | 'ribbon.pageSetup'
  | 'ribbon.size'
  | 'ribbon.margins'
  | 'ribbon.saveTemplate'
  | 'ribbon.copy'
  | 'ribbon.cut'
  | 'ribbon.paste'
  | 'ribbon.duplicate'
  | 'ribbon.deleteSelected'
  | 'ribbon.arrange'
  | 'ribbon.bringToFront'
  | 'ribbon.sendToBack'
  | 'ribbon.alignLeft'
  | 'ribbon.alignCenter'
  | 'ribbon.alignRight'
  | 'ribbon.alignTop'
  | 'ribbon.alignMiddle'
  | 'ribbon.alignBottom'
  | 'ribbon.distribute'
  | 'ribbon.distributeHorizontal'
  | 'ribbon.distributeVertical'
  | 'ribbon.sizeTools'
  | 'ribbon.sameWidth'
  | 'ribbon.sameHeight'
  | 'ribbon.sameSize'
  | 'ribbon.allBorders'
  | 'ribbon.styleDesigner'
  | 'ribbon.conditionalFormats'
  | 'ribbon.jsonDataSource'
  | 'ribbon.insertBand'
  | 'ribbon.bandWizard'
  | 'ribbon.groupWizard'
  | 'ribbon.text'
  | 'ribbon.defaultField'
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
  | 'bandWizard.title'
  | 'bandWizard.createBands'
  | 'bandWizard.generatedHeaderName'
  | 'bandWizard.generatedCountName'
  | 'bandWizard.dataSource'
  | 'bandWizard.preset.headerDataFooter'
  | 'bandWizard.preset.dataOnly'
  | 'groupWizard.title'
  | 'groupWizard.createGroup'
  | 'groupWizard.generatedHeaderName'
  | 'groupWizard.generatedCountName'
  | 'groupWizard.generatedSumName'
  | 'jsonDataSource.title'
  | 'jsonDataSource.addDataSources'
  | 'jsonDataSource.invalidJson'
  | 'jsonDataSource.column.name'
  | 'jsonDataSource.column.path'
  | 'jsonDataSource.column.fields'
  | 'jsonDataSource.rootArray'
  | 'status.selection.components'
  | 'status.selection.band'
  | 'status.selection.none'
  | 'status.pageOf'
  | 'status.margins'
  | 'status.grid'
  | 'status.snapOn'
  | 'propertyPanel.noObjectSelected'
  | 'band.type.reportTitle'
  | 'band.type.reportSummary'
  | 'band.type.pageHeader'
  | 'band.type.pageFooter'
  | 'band.type.header'
  | 'band.type.footer'
  | 'band.type.columnHeader'
  | 'band.type.columnFooter'
  | 'band.type.groupHeader'
  | 'band.type.groupFooter'
  | 'band.type.data'
  | 'band.type.hierarchicalData'
  | 'band.type.child'
  | 'band.type.emptyData'
  | 'band.type.overlay'
  | 'band.description.reportTitle'
  | 'band.description.reportSummary'
  | 'band.description.pageHeader'
  | 'band.description.pageFooter'
  | 'band.description.header'
  | 'band.description.footer'
  | 'band.description.columnHeader'
  | 'band.description.columnFooter'
  | 'band.description.groupHeader'
  | 'band.description.groupFooter'
  | 'band.description.data'
  | 'band.description.hierarchicalData'
  | 'band.description.child'
  | 'band.description.emptyData'
  | 'band.description.overlay'
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
  | 'styleLibrary.aria.search'
  | 'styleLibrary.aria.name'
  | 'styleLibrary.aria.fontFamily'
  | 'styleLibrary.aria.fontSize'
  | 'styleLibrary.aria.textColorIcon'
  | 'styleLibrary.aria.textColor'
  | 'styleLibrary.aria.backgroundIcon'
  | 'styleLibrary.aria.background'
  | 'styleLibrary.aria.borderStyle'
  | 'styleLibrary.aria.borderWidth'
  | 'styleLibrary.aria.borderColor'
  | 'styleLibrary.aria.paddingTop'
  | 'styleLibrary.aria.paddingRight'
  | 'styleLibrary.aria.paddingBottom'
  | 'styleLibrary.aria.paddingLeft'
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
  | 'formatEditor.previewText'
  | 'formatEditor.booleanTrueDefault'
  | 'formatEditor.booleanFalseDefault'
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
  | 'leftPanel.page'
  | 'leftPanel.componentsHint'
  | 'leftPanel.componentText'
  | 'leftPanel.componentImage'
  | 'leftPanel.componentChart'
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
  | 'selection.tableCell'
  | 'contextMenu.section.edit'
  | 'contextMenu.section.arrange'
  | 'contextMenu.section.tableStructure'
  | 'contextMenu.section.tableCell'
  | 'contextMenu.section.tableStyle'
  | 'contextMenu.copy'
  | 'contextMenu.cut'
  | 'contextMenu.paste'
  | 'contextMenu.duplicate'
  | 'contextMenu.bringToFront'
  | 'contextMenu.sendToBack'
  | 'contextMenu.delete'
  | 'contextMenu.table.insertColumnRight'
  | 'contextMenu.table.insertColumnLeft'
  | 'contextMenu.table.deleteColumn'
  | 'contextMenu.table.insertRowBelow'
  | 'contextMenu.table.insertRowAbove'
  | 'contextMenu.table.deleteRow'
  | 'contextMenu.table.mergeRight'
  | 'contextMenu.table.mergeSelected'
  | 'contextMenu.table.splitCell'
  | 'contextMenu.table.clearCell'
  | 'contextMenu.table.clearCellStyle'
  | 'contextMenu.table.copyCellStyle'
  | 'contextMenu.table.pasteCellStyle'
  | 'contextMenu.table.equalizeColumns'
  | 'contextMenu.table.equalizeRows'
  | 'contextMenu.table.toggleBorder'
  | 'contextMenu.table.setHeaderRow'
  | 'contextMenu.table.setFooterRow'
  | 'bandProperties.name'
  | 'bandProperties.id'
  | 'bandProperties.basic'
  | 'bandProperties.data'
  | 'bandProperties.group'
  | 'bandProperties.events'
  | 'bandProperties.height'
  | 'bandProperties.behavior'
  | 'bandProperties.enabled'
  | 'bandProperties.visibleExpression'
  | 'bandProperties.printOn'
  | 'bandProperties.printOn.allPages'
  | 'bandProperties.printOn.firstPage'
  | 'bandProperties.printOn.exceptFirstPage'
  | 'bandProperties.printOn.lastPage'
  | 'bandProperties.printOn.oddPages'
  | 'bandProperties.printOn.evenPages'
  | 'bandProperties.filterExpression'
  | 'bandProperties.groupName'
  | 'bandProperties.groupExpression'
  | 'bandProperties.printOnAllPages'
  | 'bandProperties.keepTogether'
  | 'bandProperties.canBreak'
  | 'bandProperties.printAtBottom'
  | 'bandProperties.printIfEmpty'
  | 'bandProperties.breakIfLessThan'
  | 'tableCell.properties'
  | 'tableCell.range'
  | 'tableCell.text'
  | 'tableCell.rowSpan'
  | 'tableCell.colSpan'
  | 'tableCell.appearance'
  | 'tableCell.font'
  | 'tableCell.fontFamily'
  | 'tableCell.fontSize'
  | 'tableCell.textColor'
  | 'tableCell.bold'
  | 'tableCell.italic'
  | 'tableCell.underline'
  | 'tableCell.strikethrough'
  | 'tableCell.backgroundColor'
  | 'tableCell.textAlign'
  | 'tableCell.verticalAlign'
  | 'tableCell.borderStyle'
  | 'tableCell.borderColor'
  | 'tableCell.borderWidth'
  | 'tableCell.padding'
  | 'tableCell.paddingTop'
  | 'tableCell.paddingRight'
  | 'tableCell.paddingBottom'
  | 'tableCell.paddingLeft'
  | 'tableCell.format'
  | 'pageSettings.title'
  | 'pageSettings.noPage'
  | 'pageSettings.page'
  | 'pageSettings.pageName'
  | 'pageSettings.backgroundColor'
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
  | 'pageSettings.appearance'
  | 'pageSettings.watermark'
  | 'pageSettings.watermarkEnabled'
  | 'pageSettings.watermarkText'
  | 'pageSettings.watermarkColor'
  | 'pageSettings.watermarkFontSize'
  | 'pageSettings.watermarkFontFamily'
  | 'pageSettings.watermarkOpacity'
  | 'pageSettings.watermarkAngle'
  | 'pageSettings.watermarkHorizontalAlign'
  | 'pageSettings.watermarkVerticalAlign'
  | 'pageSettings.watermarkShowBehind'
  | 'pageSettings.pageBorder'
  | 'pageSettings.pageBorderEnabled'
  | 'pageSettings.borderStyle'
  | 'pageSettings.borderSolid'
  | 'pageSettings.borderDashed'
  | 'pageSettings.borderDotted'
  | 'pageSettings.borderDouble'
  | 'pageSettings.borderColor'
  | 'pageSettings.borderWidth'
  | 'pageSettings.borderOffset'
  | 'pageSettings.borderSides'
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
  | 'events.reportTitle'
  | 'events.pageTitle'
  | 'events.editReport'
  | 'events.editPage'
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
  | 'events.scriptTemplates'
  | 'events.typeWarnings'
  | 'events.diagnosticLine'
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
  | 'events.example.logMessage.detail'
  | 'events.template.setValue'
  | 'events.template.setValue.detail'
  | 'events.template.hideComponent'
  | 'events.template.hideComponent.detail'
  | 'events.template.createText'
  | 'events.template.createText.detail'
  | 'events.template.bindText'
  | 'events.template.bindText.detail'
  | 'events.template.setComponentProperty'
  | 'events.template.setComponentProperty.detail'
  | 'events.template.readRow'
  | 'events.template.readRow.detail'
  | 'events.template.reportState'
  | 'events.template.reportState.detail'
  | 'events.template.logMessage'
  | 'events.template.logMessage.detail'
  | 'conditionalFormat.title'
  | 'conditionalFormat.search'
  | 'conditionalFormat.new'
  | 'conditionalFormat.duplicate'
  | 'conditionalFormat.delete'
  | 'conditionalFormat.applyToSelected'
  | 'conditionalFormat.done'
  | 'conditionalFormat.cancel'
  | 'conditionalFormat.confirm'
  | 'conditionalFormat.empty'
  | 'conditionalFormat.newFormatName'
  | 'conditionalFormat.ruleCount'
  | 'conditionalFormat.deleteTitle'
  | 'conditionalFormat.deleteDescription'
  | 'conditionalFormat.name'
  | 'conditionalFormat.rules'
  | 'conditionalFormat.enabled'
  | 'conditionalFormat.disabled'
  | 'conditionalFormat.noRules'
  | 'conditionalFormat.conditionField'
  | 'conditionalFormat.dataType'
  | 'conditionalFormat.operator'
  | 'conditionalFormat.value'
  | 'conditionalFormat.expression'
  | 'conditionalFormat.breakIfTrue'
  | 'conditionalFormat.formatting'
  | 'conditionalFormat.bold'
  | 'conditionalFormat.italic'
  | 'conditionalFormat.underline'
  | 'conditionalFormat.textColor'
  | 'conditionalFormat.backgroundColor'
  | 'conditionalFormat.borderStyle'
  | 'conditionalFormat.borderNone'
  | 'conditionalFormat.borderSolid'
  | 'conditionalFormat.borderDashed'
  | 'conditionalFormat.borderDotted'
  | 'conditionalFormat.borderDouble'
  | 'conditionalFormat.selectOrCreate'
  | 'conditionalFormat.typeString'
  | 'conditionalFormat.typeNumber'
  | 'conditionalFormat.typeDate'
  | 'conditionalFormat.typeBoolean'
  | 'conditionalFormat.typeExpression'
  | 'conditionalFormat.opEqualTo'
  | 'conditionalFormat.opNotEqualTo'
  | 'conditionalFormat.opBetween'
  | 'conditionalFormat.opNotBetween'
  | 'conditionalFormat.opGreaterThan'
  | 'conditionalFormat.opGreaterThanOrEqualTo'
  | 'conditionalFormat.opLessThan'
  | 'conditionalFormat.opLessThanOrEqualTo'
  | 'conditionalFormat.opContaining'
  | 'conditionalFormat.opNotContaining'
  | 'conditionalFormat.opBeginningWith'
  | 'conditionalFormat.opEndingWith';

export type DesignerMessages = Record<DesignerMessageKey, string>;

export const designerMessages: Record<DesignerLocale, DesignerMessages> = {
  'zh-CN': {
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.done': '完成',
    'common.ok': '确定',
    'common.duplicate': '复制',
    'common.new': '新建',
    'common.apply': '应用',
    'common.save': '保存',
    'common.search': '搜索',
    'common.default': '默认',
    'canvas.noPageSelected': '未选择页面',
    'canvas.zoomOut': '缩小',
    'canvas.zoomReset': '重置为 100%',
    'canvas.zoomIn': '放大',
    'canvas.imagePlaceholder': '图片',
    'canvas.subreportPlaceholder': '子报表',
    'canvas.localTemplatePlaceholder': '本地模板',
    'expressionEditor.title': '文本',
    'expressionEditor.category.expression': '表达式',
    'expressionEditor.category.expressionSubtitle': 'Expression',
    'expressionEditor.category.data': '数据列',
    'expressionEditor.category.dataSubtitle': 'Data Column',
    'expressionEditor.category.system': '系统变量',
    'expressionEditor.category.systemSubtitle': 'System',
    'expressionEditor.category.aggregates': '聚合',
    'expressionEditor.category.aggregatesSubtitle': 'Aggregate',
    'expressionEditor.category.html': 'HTML',
    'expressionEditor.category.htmlSubtitle': 'Html',
    'expressionEditor.example': '示例: Text: {Expression}, {DataSource.Field}',
    'expressionEditor.validate': '校验',
    'expressionEditor.validation.braces': '大括号数量不匹配',
    'expressionEditor.validation.parens': '括号数量不匹配',
    'expressionEditor.validation.passed': '表达式校验通过',
    'expressionEditor.tree.aggregateFunctions': '聚合函数',
    'expressionEditor.tree.pageReportTotals': '页/报表合计',
    'expressionEditor.tree.logicFunctions': '条件函数',
    'expressionEditor.tree.moneyFunctions': '金额大写',
    'expressionEditor.html.tag': 'HTML 标签',
    'expressionEditor.html.bold': '加粗',
    'expressionEditor.html.italic': '斜体',
    'expressionEditor.html.lineBreak': '换行',
    'expressionEditor.inline.expression': '表达式',
    'expressionEditor.inline.valid': '表达式有效',
    'expressionEditor.inline.invalid': '表达式无效',
    'expressionEditor.inline.syntax': '报表表达式语法',
    'shell.save': '保存',
    'shell.undo': '撤销',
    'shell.redo': '重做',
    'shell.untitledReport': '未命名报表',
    'shell.designerName': '报表设计器',
    'ribbon.home': '主页',
    'ribbon.insert': '插入',
    'ribbon.pageLayout': '页面布局',
    'ribbon.layout': '布局',
    'ribbon.preview': '预览',
    'ribbon.file': '文件',
    'ribbon.history': '历史',
    'ribbon.clipboard': '剪贴板',
    'ribbon.font': '字体',
    'ribbon.fontSizeControl': '工具栏字号',
    'ribbon.boldControl': '工具栏加粗',
    'ribbon.align': '对齐',
    'ribbon.borders': '边框',
    'ribbon.styles': '样式',
    'ribbon.data': '数据',
    'ribbon.bands': '带区',
    'ribbon.components': '组件',
    'ribbon.pageSetup': '页面设置',
    'ribbon.size': '纸张',
    'ribbon.margins': '页边距',
    'ribbon.saveTemplate': '保存 JSON 模板',
    'ribbon.copy': '复制',
    'ribbon.cut': '剪切',
    'ribbon.paste': '粘贴',
    'ribbon.duplicate': '复制一份',
    'ribbon.deleteSelected': '删除选中对象',
    'ribbon.arrange': '排列',
    'ribbon.bringToFront': '置于顶层',
    'ribbon.sendToBack': '置于底层',
    'ribbon.alignLeft': '左对齐',
    'ribbon.alignCenter': '水平居中',
    'ribbon.alignRight': '右对齐',
    'ribbon.alignTop': '上对齐',
    'ribbon.alignMiddle': '垂直居中',
    'ribbon.alignBottom': '下对齐',
    'ribbon.distribute': '分布',
    'ribbon.distributeHorizontal': '水平分布',
    'ribbon.distributeVertical': '垂直分布',
    'ribbon.sizeTools': '尺寸',
    'ribbon.sameWidth': '等宽',
    'ribbon.sameHeight': '等高',
    'ribbon.sameSize': '等尺寸',
    'ribbon.allBorders': '全部边框',
    'ribbon.styleDesigner': '样式设计器',
    'ribbon.conditionalFormats': '条件格式',
    'ribbon.jsonDataSource': 'JSON 数据源',
    'ribbon.insertBand': '插入带区',
    'ribbon.bandWizard': '带区向导',
    'ribbon.groupWizard': '分组向导',
    'ribbon.text': '文本',
    'ribbon.defaultField': '字段 {index}',
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
    'bandWizard.title': '带区向导',
    'bandWizard.createBands': '创建带区',
    'bandWizard.generatedHeaderName': '{field} 表头',
    'bandWizard.generatedCountName': '计数',
    'bandWizard.dataSource': '数据源',
    'bandWizard.preset.headerDataFooter': '表头 + 数据带 + 表尾',
    'bandWizard.preset.dataOnly': '仅数据带',
    'groupWizard.title': '分组向导',
    'groupWizard.createGroup': '创建分组',
    'groupWizard.generatedHeaderName': '分组头',
    'groupWizard.generatedCountName': '分组计数',
    'groupWizard.generatedSumName': '分组合计',
    'jsonDataSource.title': 'JSON 数据源',
    'jsonDataSource.addDataSources': '添加数据源',
    'jsonDataSource.invalidJson': 'JSON 格式不正确',
    'jsonDataSource.column.name': '名称',
    'jsonDataSource.column.path': '路径',
    'jsonDataSource.column.fields': '字段',
    'jsonDataSource.rootArray': '根数组',
    'status.selection.components': '已选择 {count} 个组件',
    'status.selection.band': '已选择 1 个带区',
    'status.selection.none': '无选择',
    'status.pageOf': '第 {current} 页，共 {total} 页',
    'status.margins': '边距',
    'status.grid': '网格',
    'status.snapOn': '吸附开启',
    'propertyPanel.noObjectSelected': '未选择对象',
    'band.type.reportTitle': '报表标题带',
    'band.type.reportSummary': '报表汇总带',
    'band.type.pageHeader': '页眉带',
    'band.type.pageFooter': '页脚带',
    'band.type.header': '表头带',
    'band.type.footer': '表尾带',
    'band.type.columnHeader': '列头带',
    'band.type.columnFooter': '列尾带',
    'band.type.groupHeader': '分组头带',
    'band.type.groupFooter': '分组尾带',
    'band.type.data': '数据带',
    'band.type.hierarchicalData': '层级数据带',
    'band.type.child': '子带',
    'band.type.emptyData': '空数据带',
    'band.type.overlay': '覆盖带',
    'band.description.reportTitle': '该带区用于输出报表标题、封面信息及只在报表开头出现的内容。它在报表第一页顶部输出。',
    'band.description.reportSummary': '该带区用于输出报表汇总、总计及结束说明。它在报表所有数据输出完成后输出。',
    'band.description.pageHeader': '该带区用于输出页眉，如页码、日期及其他附加信息。它在每页的顶部输出。',
    'band.description.pageFooter': '该带区用于输出页脚，如页码、打印时间及签名区域。它在每页的底部输出。',
    'band.description.header': '该带区用于输出数据明细的表头或列标题。通常放在数据带之前，并可随数据重复输出。',
    'band.description.footer': '该带区用于输出数据明细后的页内小计或说明。通常放在数据带之后输出。',
    'band.description.columnHeader': '该带区用于多列报表的列头内容，在每个分栏顶部输出。',
    'band.description.columnFooter': '该带区用于多列报表的列尾内容，在每个分栏底部输出。',
    'band.description.groupHeader': '该带区用于输出分组标题。分组条件变化时，它会在对应数据前输出。',
    'band.description.groupFooter': '该带区用于输出分组合计和分组结束信息。它会在对应分组数据之后输出。',
    'band.description.data': '该带区用于绑定数据表并逐行输出明细记录。分页、排序和过滤都围绕该带区展开。',
    'band.description.hierarchicalData': '该带区用于输出具有父子层级的数据。渲染时会按层级关系展开明细。',
    'band.description.child': '该带区用于输出当前数据行的子内容。通常紧跟在主数据带之后。',
    'band.description.emptyData': '该带区用于在数据为空时输出提示或占位内容。只有目标数据没有记录时输出。',
    'band.description.overlay': '该带区用于输出覆盖层内容，如背景标记、套打参考或页面浮层元素。',
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
    'styleLibrary.aria.search': '样式搜索',
    'styleLibrary.aria.name': '样式名称',
    'styleLibrary.aria.fontFamily': '样式字体系列',
    'styleLibrary.aria.fontSize': '样式字号',
    'styleLibrary.aria.textColorIcon': '文本颜色图标',
    'styleLibrary.aria.textColor': '样式文本颜色',
    'styleLibrary.aria.backgroundIcon': '背景色图标',
    'styleLibrary.aria.background': '样式背景色',
    'styleLibrary.aria.borderStyle': '样式边框样式',
    'styleLibrary.aria.borderWidth': '样式边框宽度',
    'styleLibrary.aria.borderColor': '样式边框颜色',
    'styleLibrary.aria.paddingTop': '样式内边距上',
    'styleLibrary.aria.paddingRight': '样式内边距右',
    'styleLibrary.aria.paddingBottom': '样式内边距下',
    'styleLibrary.aria.paddingLeft': '样式内边距左',
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
    'formatEditor.previewText': ' 示例文本 ',
    'formatEditor.booleanTrueDefault': '是',
    'formatEditor.booleanFalseDefault': '否',
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
    'leftPanel.page': '页面',
    'leftPanel.componentsHint': '将常用报表组件拖入选中的带区。',
    'leftPanel.componentText': '文本',
    'leftPanel.componentImage': '图片',
    'leftPanel.componentChart': '图表',
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
    'selection.tableCell': '表格单元格',
    'contextMenu.section.edit': '编辑',
    'contextMenu.section.arrange': '排列',
    'contextMenu.section.tableStructure': '结构',
    'contextMenu.section.tableCell': '单元格',
    'contextMenu.section.tableStyle': '样式',
    'contextMenu.copy': '复制',
    'contextMenu.cut': '剪切',
    'contextMenu.paste': '粘贴',
    'contextMenu.duplicate': '复制一份',
    'contextMenu.bringToFront': '置于顶层',
    'contextMenu.sendToBack': '置于底层',
    'contextMenu.delete': '删除',
    'contextMenu.table.insertColumnRight': '插入列到右侧',
    'contextMenu.table.insertColumnLeft': '插入列到左侧',
    'contextMenu.table.deleteColumn': '删除列',
    'contextMenu.table.insertRowBelow': '插入行到下方',
    'contextMenu.table.insertRowAbove': '插入行到上方',
    'contextMenu.table.deleteRow': '删除行',
    'contextMenu.table.mergeRight': '合并右侧单元格',
    'contextMenu.table.mergeSelected': '合并选中单元格',
    'contextMenu.table.splitCell': '拆分单元格',
    'contextMenu.table.clearCell': '清空单元格',
    'contextMenu.table.clearCellStyle': '清空单元格样式',
    'contextMenu.table.copyCellStyle': '复制单元格样式',
    'contextMenu.table.pasteCellStyle': '粘贴单元格样式',
    'contextMenu.table.equalizeColumns': '均分列宽',
    'contextMenu.table.equalizeRows': '均分行高',
    'contextMenu.table.toggleBorder': '切换表格边框',
    'contextMenu.table.setHeaderRow': '设为表头行',
    'contextMenu.table.setFooterRow': '设为表尾行',
    'bandProperties.name': '名称',
    'bandProperties.id': '标识',
    'bandProperties.basic': '基础',
    'bandProperties.data': '数据',
    'bandProperties.group': '分组',
    'bandProperties.events': '事件',
    'bandProperties.height': '高度',
    'bandProperties.behavior': '分页/打印行为',
    'bandProperties.enabled': '启用',
    'bandProperties.visibleExpression': '可见表达式',
    'bandProperties.printOn': '打印页面',
    'bandProperties.printOn.allPages': '所有页面',
    'bandProperties.printOn.firstPage': '第一页',
    'bandProperties.printOn.exceptFirstPage': '除第一页外',
    'bandProperties.printOn.lastPage': '最后一页',
    'bandProperties.printOn.oddPages': '奇数页',
    'bandProperties.printOn.evenPages': '偶数页',
    'bandProperties.filterExpression': '过滤表达式',
    'bandProperties.groupName': '分组名称',
    'bandProperties.groupExpression': '分组表达式',
    'bandProperties.printOnAllPages': '每页重复打印',
    'bandProperties.keepTogether': '保持整体',
    'bandProperties.canBreak': '允许跨页',
    'bandProperties.printAtBottom': '打印在底部',
    'bandProperties.printIfEmpty': '空数据时打印',
    'bandProperties.breakIfLessThan': '不足高度换页',
    'tableCell.properties': '单元格属性',
    'tableCell.range': '范围',
    'tableCell.text': '文本内容',
    'tableCell.rowSpan': '合并行数',
    'tableCell.colSpan': '合并列数',
    'tableCell.appearance': '外观',
    'tableCell.font': '字体',
    'tableCell.fontFamily': '字体系列',
    'tableCell.fontSize': '字号',
    'tableCell.textColor': '字体颜色',
    'tableCell.bold': '加粗',
    'tableCell.italic': '斜体',
    'tableCell.underline': '下划线',
    'tableCell.strikethrough': '删除线',
    'tableCell.backgroundColor': '背景色',
    'tableCell.textAlign': '水平对齐',
    'tableCell.verticalAlign': '垂直对齐',
    'tableCell.borderStyle': '边框样式',
    'tableCell.borderColor': '边框颜色',
    'tableCell.borderWidth': '边框宽度',
    'tableCell.padding': '内边距',
    'tableCell.paddingTop': '上',
    'tableCell.paddingRight': '右',
    'tableCell.paddingBottom': '下',
    'tableCell.paddingLeft': '左',
    'tableCell.format': '格式',
    'pageSettings.title': '页面设置',
    'pageSettings.noPage': '未选择页面',
    'pageSettings.page': '页面',
    'pageSettings.pageName': '页面名称',
    'pageSettings.backgroundColor': '背景色',
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
    'pageSettings.appearance': '页面外观',
    'pageSettings.watermark': '水印',
    'pageSettings.watermarkEnabled': '启用',
    'pageSettings.watermarkText': '文本',
    'pageSettings.watermarkColor': '颜色',
    'pageSettings.watermarkFontSize': '字号',
    'pageSettings.watermarkFontFamily': '字体',
    'pageSettings.watermarkOpacity': '透明度',
    'pageSettings.watermarkAngle': '角度',
    'pageSettings.watermarkHorizontalAlign': '水平',
    'pageSettings.watermarkVerticalAlign': '垂直',
    'pageSettings.watermarkShowBehind': '置于内容后',
    'pageSettings.pageBorder': '页面边框',
    'pageSettings.pageBorderEnabled': '启用页面边框',
    'pageSettings.borderStyle': '边框样式',
    'pageSettings.borderSolid': '实线',
    'pageSettings.borderDashed': '虚线',
    'pageSettings.borderDotted': '点线',
    'pageSettings.borderDouble': '双线',
    'pageSettings.borderColor': '边框颜色',
    'pageSettings.borderWidth': '边框宽度',
    'pageSettings.borderOffset': '边框偏移',
    'pageSettings.borderSides': '边框边',
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
    'events.reportTitle': '报表事件',
    'events.pageTitle': '页面事件',
    'events.editReport': '编辑报表事件',
    'events.editPage': '编辑页面事件',
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
    'events.scriptTemplates': '脚本模板',
    'events.typeWarnings': '类型警告',
    'events.diagnosticLine': '第 {line} 行',
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
    'events.template.setValue': '设置事件值',
    'events.template.setValue.detail': '为取值事件写入返回值',
    'events.template.hideComponent': '隐藏组件',
    'events.template.hideComponent.detail': '在运行时隐藏当前组件',
    'events.template.createText': '创建文本组件',
    'events.template.createText.detail': '在当前带区运行时创建一个文本组件',
    'events.template.bindText': '绑定文本表达式',
    'events.template.bindText.detail': '把指定文本组件绑定到字段或表达式',
    'events.template.setComponentProperty': '修改组件属性',
    'events.template.setComponentProperty.detail': '在事件中修改指定组件的属性',
    'events.template.readRow': '读取当前行',
    'events.template.readRow.detail': '读取带区事件的当前数据行',
    'events.template.reportState': '写入报表状态',
    'events.template.reportState.detail': '在报表事件中记录可复用状态',
    'events.template.logMessage': '记录日志',
    'events.template.logMessage.detail': '向事件日志写入调试信息',
    'conditionalFormat.title': '条件格式库',
    'conditionalFormat.search': '搜索条件格式',
    'conditionalFormat.new': '新建',
    'conditionalFormat.duplicate': '复制',
    'conditionalFormat.delete': '删除',
    'conditionalFormat.applyToSelected': '应用到选中项',
    'conditionalFormat.done': '完成',
    'conditionalFormat.cancel': '取消',
    'conditionalFormat.confirm': '确认',
    'conditionalFormat.empty': '没有条件格式',
    'conditionalFormat.newFormatName': '新建条件格式',
    'conditionalFormat.ruleCount': '{count} 条规则',
    'conditionalFormat.deleteTitle': '删除“{name}”？',
    'conditionalFormat.deleteDescription': '删除后会清除已选择该条件格式的组件引用。',
    'conditionalFormat.name': '名称',
    'conditionalFormat.rules': '规则',
    'conditionalFormat.enabled': '已启用',
    'conditionalFormat.disabled': '已禁用',
    'conditionalFormat.noRules': '没有规则',
    'conditionalFormat.conditionField': '条件字段',
    'conditionalFormat.dataType': '数据类型',
    'conditionalFormat.operator': '操作符',
    'conditionalFormat.value': '值',
    'conditionalFormat.expression': '表达式',
    'conditionalFormat.breakIfTrue': '满足后停止',
    'conditionalFormat.formatting': '格式设置',
    'conditionalFormat.bold': '加粗',
    'conditionalFormat.italic': '斜体',
    'conditionalFormat.underline': '下划线',
    'conditionalFormat.textColor': '文本颜色',
    'conditionalFormat.backgroundColor': '背景色',
    'conditionalFormat.borderStyle': '边框样式',
    'conditionalFormat.borderNone': '无',
    'conditionalFormat.borderSolid': '实线',
    'conditionalFormat.borderDashed': '虚线',
    'conditionalFormat.borderDotted': '点线',
    'conditionalFormat.borderDouble': '双线',
    'conditionalFormat.selectOrCreate': '选择或新建一个条件格式',
    'conditionalFormat.typeString': '文本',
    'conditionalFormat.typeNumber': '数字',
    'conditionalFormat.typeDate': '日期',
    'conditionalFormat.typeBoolean': '布尔值',
    'conditionalFormat.typeExpression': '表达式',
    'conditionalFormat.opEqualTo': '等于',
    'conditionalFormat.opNotEqualTo': '不等于',
    'conditionalFormat.opBetween': '介于',
    'conditionalFormat.opNotBetween': '不介于',
    'conditionalFormat.opGreaterThan': '大于',
    'conditionalFormat.opGreaterThanOrEqualTo': '大于等于',
    'conditionalFormat.opLessThan': '小于',
    'conditionalFormat.opLessThanOrEqualTo': '小于等于',
    'conditionalFormat.opContaining': '包含',
    'conditionalFormat.opNotContaining': '不包含',
    'conditionalFormat.opBeginningWith': '开头为',
    'conditionalFormat.opEndingWith': '结尾为',
  },
  'en-US': {
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.done': 'Done',
    'common.ok': 'OK',
    'common.duplicate': 'Duplicate',
    'common.new': 'New',
    'common.apply': 'Apply',
    'common.save': 'Save',
    'common.search': 'Search',
    'common.default': 'Default',
    'canvas.noPageSelected': 'No page selected',
    'canvas.zoomOut': 'Zoom out',
    'canvas.zoomReset': 'Reset to 100%',
    'canvas.zoomIn': 'Zoom in',
    'canvas.imagePlaceholder': 'Image',
    'canvas.subreportPlaceholder': 'Subreport',
    'canvas.localTemplatePlaceholder': 'Local template',
    'expressionEditor.title': 'Text',
    'expressionEditor.category.expression': 'Expression',
    'expressionEditor.category.expressionSubtitle': 'Build content',
    'expressionEditor.category.data': 'Data Column',
    'expressionEditor.category.dataSubtitle': 'JSON fields',
    'expressionEditor.category.system': 'System',
    'expressionEditor.category.systemSubtitle': 'Variables',
    'expressionEditor.category.aggregates': 'Aggregate',
    'expressionEditor.category.aggregatesSubtitle': 'Totals',
    'expressionEditor.category.html': 'HTML',
    'expressionEditor.category.htmlSubtitle': 'Tags',
    'expressionEditor.example': 'Example: Text: {Expression}, {DataSource.Field}',
    'expressionEditor.validate': 'Validate',
    'expressionEditor.validation.braces': 'Brace count does not match',
    'expressionEditor.validation.parens': 'Parenthesis count does not match',
    'expressionEditor.validation.passed': 'Expression validation passed',
    'expressionEditor.tree.aggregateFunctions': 'Aggregate functions',
    'expressionEditor.tree.pageReportTotals': 'Page/report totals',
    'expressionEditor.tree.logicFunctions': 'Logic functions',
    'expressionEditor.tree.moneyFunctions': 'Money uppercase',
    'expressionEditor.html.tag': 'HTML Tag',
    'expressionEditor.html.bold': 'Bold',
    'expressionEditor.html.italic': 'Italic',
    'expressionEditor.html.lineBreak': 'Line break',
    'expressionEditor.inline.expression': 'Expression',
    'expressionEditor.inline.valid': 'Valid expression',
    'expressionEditor.inline.invalid': 'Invalid expression',
    'expressionEditor.inline.syntax': 'Report expression syntax',
    'shell.save': 'Save',
    'shell.undo': 'Undo',
    'shell.redo': 'Redo',
    'shell.untitledReport': 'Untitled Report',
    'shell.designerName': 'Report Designer',
    'ribbon.home': 'Home',
    'ribbon.insert': 'Insert',
    'ribbon.pageLayout': 'Page Layout',
    'ribbon.layout': 'Layout',
    'ribbon.preview': 'Preview',
    'ribbon.file': 'File',
    'ribbon.history': 'History',
    'ribbon.clipboard': 'Clipboard',
    'ribbon.font': 'Font',
    'ribbon.fontSizeControl': 'Ribbon font size',
    'ribbon.boldControl': 'Ribbon bold',
    'ribbon.align': 'Align',
    'ribbon.borders': 'Borders',
    'ribbon.styles': 'Styles',
    'ribbon.data': 'Data',
    'ribbon.bands': 'Bands',
    'ribbon.components': 'Components',
    'ribbon.pageSetup': 'Page Setup',
    'ribbon.size': 'Size',
    'ribbon.margins': 'Margins',
    'ribbon.saveTemplate': 'Save JSON template',
    'ribbon.copy': 'Copy',
    'ribbon.cut': 'Cut',
    'ribbon.paste': 'Paste',
    'ribbon.duplicate': 'Duplicate',
    'ribbon.deleteSelected': 'Delete selected objects',
    'ribbon.arrange': 'Arrange',
    'ribbon.bringToFront': 'Bring to Front',
    'ribbon.sendToBack': 'Send to Back',
    'ribbon.alignLeft': 'Align Left',
    'ribbon.alignCenter': 'Align Center',
    'ribbon.alignRight': 'Align Right',
    'ribbon.alignTop': 'Align Top',
    'ribbon.alignMiddle': 'Align Middle',
    'ribbon.alignBottom': 'Align Bottom',
    'ribbon.distribute': 'Distribute',
    'ribbon.distributeHorizontal': 'Distribute Horizontal',
    'ribbon.distributeVertical': 'Distribute Vertical',
    'ribbon.sizeTools': 'Size',
    'ribbon.sameWidth': 'Same Width',
    'ribbon.sameHeight': 'Same Height',
    'ribbon.sameSize': 'Same Size',
    'ribbon.allBorders': 'All borders',
    'ribbon.styleDesigner': 'Style Designer',
    'ribbon.conditionalFormats': 'Conditional Formats',
    'ribbon.jsonDataSource': 'JSON data source',
    'ribbon.insertBand': 'Insert band',
    'ribbon.bandWizard': 'Band wizard',
    'ribbon.groupWizard': 'Group wizard',
    'ribbon.text': 'Text',
    'ribbon.defaultField': 'Field {index}',
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
    'bandWizard.title': 'Band Wizard',
    'bandWizard.createBands': 'Create bands',
    'bandWizard.generatedHeaderName': '{field} Header',
    'bandWizard.generatedCountName': 'Count',
    'bandWizard.dataSource': 'Data source',
    'bandWizard.preset.headerDataFooter': 'HeaderBand + DataBand + FooterBand',
    'bandWizard.preset.dataOnly': 'DataBand only',
    'groupWizard.title': 'Group Wizard',
    'groupWizard.createGroup': 'Create group',
    'groupWizard.generatedHeaderName': 'Group Header',
    'groupWizard.generatedCountName': 'Group Count',
    'groupWizard.generatedSumName': 'Group Sum',
    'jsonDataSource.title': 'JSON Data Source',
    'jsonDataSource.addDataSources': 'Add data sources',
    'jsonDataSource.invalidJson': 'Invalid JSON',
    'jsonDataSource.column.name': 'Name',
    'jsonDataSource.column.path': 'Path',
    'jsonDataSource.column.fields': 'Fields',
    'jsonDataSource.rootArray': 'root array',
    'status.selection.components': '{count} component(s)',
    'status.selection.band': '1 band',
    'status.selection.none': 'No selection',
    'status.pageOf': 'Page {current} of {total}',
    'status.margins': 'Margins',
    'status.grid': 'Grid',
    'status.snapOn': 'Snap on',
    'propertyPanel.noObjectSelected': 'No object selected',
    'band.type.reportTitle': 'ReportTitleBand',
    'band.type.reportSummary': 'ReportSummaryBand',
    'band.type.pageHeader': 'PageHeaderBand',
    'band.type.pageFooter': 'PageFooterBand',
    'band.type.header': 'HeaderBand',
    'band.type.footer': 'FooterBand',
    'band.type.columnHeader': 'ColumnHeaderBand',
    'band.type.columnFooter': 'ColumnFooterBand',
    'band.type.groupHeader': 'GroupHeaderBand',
    'band.type.groupFooter': 'GroupFooterBand',
    'band.type.data': 'DataBand',
    'band.type.hierarchicalData': 'HierarchicalDataBand',
    'band.type.child': 'ChildBand',
    'band.type.emptyData': 'EmptyDataBand',
    'band.type.overlay': 'OverlayBand',
    'band.description.reportTitle': 'Outputs the report title, cover information, and content that appears once at the beginning of the report.',
    'band.description.reportSummary': 'Outputs report summaries, grand totals, and closing notes after all report data has been rendered.',
    'band.description.pageHeader': 'Outputs page header content, such as page number, date, and other supplemental information, at the top of every page.',
    'band.description.pageFooter': 'Outputs page footer content, such as page number, print time, and signature areas, at the bottom of every page.',
    'band.description.header': 'Outputs table headers or column captions for detail data. It is usually placed before a DataBand and may repeat with data.',
    'band.description.footer': 'Outputs subtotal or note content after detail data. It is usually placed after a DataBand.',
    'band.description.columnHeader': 'Outputs header content for multi-column reports at the top of each column.',
    'band.description.columnFooter': 'Outputs footer content for multi-column reports at the bottom of each column.',
    'band.description.groupHeader': 'Outputs group header content before grouped records when the group condition changes.',
    'band.description.groupFooter': 'Outputs group totals and closing information after the records in a group.',
    'band.description.data': 'Binds to a data table and outputs detail records row by row. Pagination, sorting, and filtering are centered on this band.',
    'band.description.hierarchicalData': 'Outputs parent-child data in a hierarchy and expands detail records according to their relationships.',
    'band.description.child': 'Outputs child content for the current data row. It is usually placed immediately after the parent DataBand.',
    'band.description.emptyData': 'Outputs placeholder or message content when the target data has no records.',
    'band.description.overlay': 'Outputs overlay content such as background marks, preprinted-form references, or floating page elements.',
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
    'styleLibrary.aria.search': 'Search styles',
    'styleLibrary.aria.name': 'Style name',
    'styleLibrary.aria.fontFamily': 'Style font family',
    'styleLibrary.aria.fontSize': 'Style font size',
    'styleLibrary.aria.textColorIcon': 'Text color icon',
    'styleLibrary.aria.textColor': 'Style text color',
    'styleLibrary.aria.backgroundIcon': 'Background color icon',
    'styleLibrary.aria.background': 'Style background color',
    'styleLibrary.aria.borderStyle': 'Style border style',
    'styleLibrary.aria.borderWidth': 'Style border width',
    'styleLibrary.aria.borderColor': 'Style border color',
    'styleLibrary.aria.paddingTop': 'Top padding',
    'styleLibrary.aria.paddingRight': 'Right padding',
    'styleLibrary.aria.paddingBottom': 'Bottom padding',
    'styleLibrary.aria.paddingLeft': 'Left padding',
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
    'formatEditor.previewText': ' sample text ',
    'formatEditor.booleanTrueDefault': 'True',
    'formatEditor.booleanFalseDefault': 'False',
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
    'leftPanel.page': 'Page',
    'leftPanel.componentsHint': 'Drag common report controls into the selected band.',
    'leftPanel.componentText': 'Text',
    'leftPanel.componentImage': 'Image',
    'leftPanel.componentChart': 'Chart',
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
    'selection.tableCell': 'Table Cell',
    'contextMenu.section.edit': 'Edit',
    'contextMenu.section.arrange': 'Arrange',
    'contextMenu.section.tableStructure': 'Structure',
    'contextMenu.section.tableCell': 'Cell',
    'contextMenu.section.tableStyle': 'Style',
    'contextMenu.copy': 'Copy',
    'contextMenu.cut': 'Cut',
    'contextMenu.paste': 'Paste',
    'contextMenu.duplicate': 'Duplicate',
    'contextMenu.bringToFront': 'Bring to Front',
    'contextMenu.sendToBack': 'Send to Back',
    'contextMenu.delete': 'Delete',
    'contextMenu.table.insertColumnRight': 'Insert Column Right',
    'contextMenu.table.insertColumnLeft': 'Insert Column Left',
    'contextMenu.table.deleteColumn': 'Delete Column',
    'contextMenu.table.insertRowBelow': 'Insert Row Below',
    'contextMenu.table.insertRowAbove': 'Insert Row Above',
    'contextMenu.table.deleteRow': 'Delete Row',
    'contextMenu.table.mergeRight': 'Merge Cell Right',
    'contextMenu.table.mergeSelected': 'Merge Selected Cells',
    'contextMenu.table.splitCell': 'Split Cell',
    'contextMenu.table.clearCell': 'Clear Cell',
    'contextMenu.table.clearCellStyle': 'Clear Cell Style',
    'contextMenu.table.copyCellStyle': 'Copy Cell Style',
    'contextMenu.table.pasteCellStyle': 'Paste Cell Style',
    'contextMenu.table.equalizeColumns': 'Distribute Columns',
    'contextMenu.table.equalizeRows': 'Distribute Rows',
    'contextMenu.table.toggleBorder': 'Toggle Table Border',
    'contextMenu.table.setHeaderRow': 'Set Header Row',
    'contextMenu.table.setFooterRow': 'Set Footer Row',
    'bandProperties.name': 'Name',
    'bandProperties.id': 'Id',
    'bandProperties.basic': 'Basic',
    'bandProperties.data': 'Data',
    'bandProperties.group': 'Group',
    'bandProperties.events': 'Events',
    'bandProperties.height': 'Height',
    'bandProperties.behavior': 'Pagination / Print Behavior',
    'bandProperties.enabled': 'Enabled',
    'bandProperties.visibleExpression': 'Visible Expression',
    'bandProperties.printOn': 'Print On',
    'bandProperties.printOn.allPages': 'All Pages',
    'bandProperties.printOn.firstPage': 'First Page',
    'bandProperties.printOn.exceptFirstPage': 'Except First Page',
    'bandProperties.printOn.lastPage': 'Last Page',
    'bandProperties.printOn.oddPages': 'Odd Pages',
    'bandProperties.printOn.evenPages': 'Even Pages',
    'bandProperties.filterExpression': 'Filter Expression',
    'bandProperties.groupName': 'Group Name',
    'bandProperties.groupExpression': 'Group Expression',
    'bandProperties.printOnAllPages': 'Repeat on Each Page',
    'bandProperties.keepTogether': 'Keep Together',
    'bandProperties.canBreak': 'Can Break',
    'bandProperties.printAtBottom': 'Print at Bottom',
    'bandProperties.printIfEmpty': 'Print if Empty',
    'bandProperties.breakIfLessThan': 'Break if Less Than',
    'tableCell.properties': 'Cell Properties',
    'tableCell.range': 'Range',
    'tableCell.text': 'Text Content',
    'tableCell.rowSpan': 'Row Span',
    'tableCell.colSpan': 'Column Span',
    'tableCell.appearance': 'Appearance',
    'tableCell.font': 'Font',
    'tableCell.fontFamily': 'Font family',
    'tableCell.fontSize': 'Font size',
    'tableCell.textColor': 'Font color',
    'tableCell.bold': 'Bold',
    'tableCell.italic': 'Italic',
    'tableCell.underline': 'Underline',
    'tableCell.strikethrough': 'Strikethrough',
    'tableCell.backgroundColor': 'Background Color',
    'tableCell.textAlign': 'Horizontal Align',
    'tableCell.verticalAlign': 'Vertical Align',
    'tableCell.borderStyle': 'Border Style',
    'tableCell.borderColor': 'Border Color',
    'tableCell.borderWidth': 'Border Width',
    'tableCell.padding': 'Padding',
    'tableCell.paddingTop': 'Top',
    'tableCell.paddingRight': 'Right',
    'tableCell.paddingBottom': 'Bottom',
    'tableCell.paddingLeft': 'Left',
    'tableCell.format': 'Format',
    'pageSettings.title': 'Page Settings',
    'pageSettings.noPage': 'No page selected',
    'pageSettings.page': 'Page',
    'pageSettings.pageName': 'Page name',
    'pageSettings.backgroundColor': 'Background color',
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
    'pageSettings.appearance': 'Page appearance',
    'pageSettings.watermark': 'Watermark',
    'pageSettings.watermarkEnabled': 'Enable',
    'pageSettings.watermarkText': 'Text',
    'pageSettings.watermarkColor': 'Color',
    'pageSettings.watermarkFontSize': 'Size',
    'pageSettings.watermarkFontFamily': 'Font',
    'pageSettings.watermarkOpacity': 'Opacity',
    'pageSettings.watermarkAngle': 'Angle',
    'pageSettings.watermarkHorizontalAlign': 'H Align',
    'pageSettings.watermarkVerticalAlign': 'V Align',
    'pageSettings.watermarkShowBehind': 'Behind',
    'pageSettings.pageBorder': 'Page border',
    'pageSettings.pageBorderEnabled': 'Enable page border',
    'pageSettings.borderStyle': 'Border style',
    'pageSettings.borderSolid': 'Solid',
    'pageSettings.borderDashed': 'Dashed',
    'pageSettings.borderDotted': 'Dotted',
    'pageSettings.borderDouble': 'Double',
    'pageSettings.borderColor': 'Border color',
    'pageSettings.borderWidth': 'Border width',
    'pageSettings.borderOffset': 'Border offset',
    'pageSettings.borderSides': 'Border sides',
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
    'events.reportTitle': 'Report Events',
    'events.pageTitle': 'Page Events',
    'events.editReport': 'Edit Report Events',
    'events.editPage': 'Edit Page Events',
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
    'events.scriptTemplates': 'Script templates',
    'events.typeWarnings': 'Type warnings',
    'events.diagnosticLine': 'Line {line}',
    'events.fields': 'Fields',
    'events.components': 'Components',
    'events.validationPassed': 'Validation passed',
    'events.edit': 'Edit Events',
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
    'events.template.setValue': 'Set event value',
    'events.template.setValue.detail': 'Write the return value for a get value event',
    'events.template.hideComponent': 'Hide component',
    'events.template.hideComponent.detail': 'Hide the current component at runtime',
    'events.template.createText': 'Create text component',
    'events.template.createText.detail': 'Create a text component in the current band at runtime',
    'events.template.bindText': 'Bind text expression',
    'events.template.bindText.detail': 'Bind a text component to a field or expression',
    'events.template.setComponentProperty': 'Set component property',
    'events.template.setComponentProperty.detail': 'Change a component property from the event script',
    'events.template.readRow': 'Read current row',
    'events.template.readRow.detail': 'Read the current data row in a band event',
    'events.template.reportState': 'Write report state',
    'events.template.reportState.detail': 'Store reusable state in a report event',
    'events.template.logMessage': 'Log message',
    'events.template.logMessage.detail': 'Write debug information to the event log',
    'conditionalFormat.title': 'Conditional Format Library',
    'conditionalFormat.search': 'Search conditional formats',
    'conditionalFormat.new': 'New',
    'conditionalFormat.duplicate': 'Duplicate',
    'conditionalFormat.delete': 'Delete',
    'conditionalFormat.applyToSelected': 'Apply to Selected',
    'conditionalFormat.done': 'Done',
    'conditionalFormat.cancel': 'Cancel',
    'conditionalFormat.confirm': 'Confirm',
    'conditionalFormat.empty': 'No conditional formats',
    'conditionalFormat.newFormatName': 'New Conditional Format',
    'conditionalFormat.ruleCount': '{count} rule(s)',
    'conditionalFormat.deleteTitle': 'Delete "{name}"?',
    'conditionalFormat.deleteDescription': 'Deleting it clears this conditional format from referenced components.',
    'conditionalFormat.name': 'Name',
    'conditionalFormat.rules': 'Rules',
    'conditionalFormat.enabled': 'Enabled',
    'conditionalFormat.disabled': 'Disabled',
    'conditionalFormat.noRules': 'No rules',
    'conditionalFormat.conditionField': 'Condition field',
    'conditionalFormat.dataType': 'Data type',
    'conditionalFormat.operator': 'Operator',
    'conditionalFormat.value': 'Value',
    'conditionalFormat.expression': 'Expression',
    'conditionalFormat.breakIfTrue': 'Break if True',
    'conditionalFormat.formatting': 'Formatting',
    'conditionalFormat.bold': 'Bold',
    'conditionalFormat.italic': 'Italic',
    'conditionalFormat.underline': 'Underline',
    'conditionalFormat.textColor': 'Text color',
    'conditionalFormat.backgroundColor': 'Background color',
    'conditionalFormat.borderStyle': 'Border style',
    'conditionalFormat.borderNone': 'None',
    'conditionalFormat.borderSolid': 'Solid',
    'conditionalFormat.borderDashed': 'Dashed',
    'conditionalFormat.borderDotted': 'Dotted',
    'conditionalFormat.borderDouble': 'Double',
    'conditionalFormat.selectOrCreate': 'Select or create a conditional format',
    'conditionalFormat.typeString': 'Text',
    'conditionalFormat.typeNumber': 'Number',
    'conditionalFormat.typeDate': 'Date',
    'conditionalFormat.typeBoolean': 'Boolean',
    'conditionalFormat.typeExpression': 'Expression',
    'conditionalFormat.opEqualTo': 'Equal to',
    'conditionalFormat.opNotEqualTo': 'Not equal to',
    'conditionalFormat.opBetween': 'Between',
    'conditionalFormat.opNotBetween': 'Not between',
    'conditionalFormat.opGreaterThan': 'Greater than',
    'conditionalFormat.opGreaterThanOrEqualTo': 'Greater than or equal to',
    'conditionalFormat.opLessThan': 'Less than',
    'conditionalFormat.opLessThanOrEqualTo': 'Less than or equal to',
    'conditionalFormat.opContaining': 'Containing',
    'conditionalFormat.opNotContaining': 'Not containing',
    'conditionalFormat.opBeginningWith': 'Beginning with',
    'conditionalFormat.opEndingWith': 'Ending with',
  },
};
