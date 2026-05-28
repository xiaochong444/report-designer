# 静默打印联调说明

## 目标

用 Chrome 扩展把 Viewer 生成的 PDF 发送给 Windows 本机 Host，由 Host 调用本机静默打印命令。

## 一键安装

在项目根目录执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\installer\windows\install.ps1
```

或者直接双击：

```text
installer\windows\install.cmd
```

脚本会自动完成：

- 发布 `.NET` Host
- 生成 `%LOCALAPPDATA%\ReportDesignerPrintHost\config.json`
- 生成 Native Messaging manifest
- 写入 `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.report_designer.print_host`
- 复制固定 ID 扩展
- 创建桌面快捷方式 `Report Designer Print Chrome.lnk`

固定扩展 ID：

```text
ehppgngdhfmokcmjihddljjfjmcponik
```

如果没有安装 SumatraPDF，执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\installer\windows\install.ps1 -PrintCommand "C:\Tools\SumatraPDF.exe"
```

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
如果 Host 已配置默认打印机，Host 会优先使用自己的默认值。

## 联调检查

1. 确认扩展选项页里的 `backend` 是 `nativeMessaging`
2. 打开示例 Viewer
3. 点击打印
4. 查看 `%LOCALAPPDATA%\ReportDesignerPrintHost\jobs`

成功时 job 记录里的 `status` 是 `completed`。

失败时 job 记录里的 `status` 是 `failed`，`error` 会记录失败原因。

## 打印机归属

打印机选择现在由 Host 负责。安装器会尝试读取 Windows 默认打印机并写入 Host 配置；如果没有默认打印机，Host 仍可接受 payload 里的 `printerId` 作为兜底。

## 卸载

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\installer\windows\uninstall.ps1
```

卸载脚本会删除注册表和 Host 程序目录，但保留 `%LOCALAPPDATA%\ReportDesignerPrintHost` 里的队列和日志数据。

## 商用安装说明

非企业管理的 Chrome 不允许本地安装包把任意本地扩展静默安装到用户主浏览器配置里。因此本地安装器使用专用 Chrome 快捷方式加载固定 ID 扩展。真正的商用零操作安装需要把扩展发布到 Chrome Web Store，或通过 Chrome 企业策略强制安装扩展。
