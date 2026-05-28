# 静默打印联调说明

## 目标

用 Chrome 扩展把 Viewer 生成的 PDF 发送给 Windows 本机 Host，由 Host 调用本机静默打印命令。

## 一键部署 Host

1. 打开 `chrome://extensions`
2. 开启开发者模式
3. 加载目录 `extensions/chrome-silent-print`
4. 复制扩展 ID
5. 在项目根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\native-hosts\windows-print-host\scripts\install-chrome-native-host.ps1 -ExtensionId "你的扩展ID"
```

如果没有安装 SumatraPDF，执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\native-hosts\windows-print-host\scripts\install-chrome-native-host.ps1 -ExtensionId "你的扩展ID" -PrintCommand "C:\Tools\SumatraPDF.exe"
```

脚本会自动完成：

- 发布 `.NET` Host 到 `%LOCALAPPDATA%\Programs\ReportDesignerPrintHost`
- 生成 `%LOCALAPPDATA%\ReportDesignerPrintHost\config.json`
- 生成 Native Messaging manifest
- 写入 `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.report_designer.print_host`

## Viewer 打印配置

```ts
await printReport(renderDocument, {
  adapter: 'chrome-extension',
  chromeExtension: {
    printerId: '打印机名称',
    copies: 1,
    silent: true,
    backend: 'nativeMessaging',
  },
});
```

`printerId` 第一版直接传 Windows 打印机名称。

## 联调检查

1. 确认扩展选项页里的 `backend` 是 `nativeMessaging`
2. 打开示例 Viewer
3. 点击打印
4. 查看 `%LOCALAPPDATA%\ReportDesignerPrintHost\jobs`

成功时 job 记录里的 `status` 是 `completed`。

失败时 job 记录里的 `status` 是 `failed`，`error` 会记录失败原因。

## 卸载

```powershell
powershell -ExecutionPolicy Bypass -File .\native-hosts\windows-print-host\scripts\uninstall-chrome-native-host.ps1
```

卸载脚本会删除注册表和 Host 程序目录，但保留 `%LOCALAPPDATA%\ReportDesignerPrintHost` 里的队列和日志数据。
