# 静默打印联调说明

## 目标

使用 Chrome 扩展把 Viewer 生成的 PDF 提交给 Chrome `printing` API。当前项目不再使用早期 Windows 打印辅助程序。

## 扩展安装

1. 打开 `chrome://extensions/`。
2. 启用开发者模式。
3. 选择 `extensions/chrome-silent-print` 加载已解压扩展。
4. 在扩展选项页配置允许访问的 Web 应用 origin。开发环境默认允许 localhost、`127.0.0.1`、`::1` 和 `file://`。

固定开发扩展 ID：

```text
ehppgngdhfmokcmjihddljjfjmcponik
```

## Viewer 打印配置

```ts
await printReport(renderDocument, {
  adapter: 'chrome-extension',
  chromeExtension: {
    backend: 'chromePrinting',
    printerId: 'printer-01',
    copies: 1,
    silent: true,
  },
});
```

`printerId` 应来自 Chrome 可用打印机或企业打印机策略配置。

## 联调检查

1. 确认扩展已安装并启用。
2. 确认当前 Web 应用 origin 在扩展允许列表中。
3. 打开示例 Viewer。
4. 点击顶部的 `静默打印测试` 或 `PDF 打印验证`。
5. 在扩展 Service Worker 控制台查看打印 API 返回的任务结果。

## 商用部署说明

零点击打印依赖 Chrome 扩展权限、打印机配置和浏览器策略。商用部署建议通过 Chrome 企业策略强制安装扩展，并统一下发打印机配置。普通浏览器场景仍可使用浏览器打印和 PDF 导出。
