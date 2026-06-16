# 静默打印

静默打印用于在受控 Chrome 环境中把报表 PDF 提交给配置好的打印机，而不打开普通浏览器打印对话框。它适合门店收银台、仓库工作站、产线工位等由组织统一管理的设备。

## 架构概览

Report Designer 使用 Chrome 扩展桥接：

1. **Viewer** 渲染报表并生成 PDF 打印负载。
2. **Chrome 扩展** 从网页接收打印负载。
3. **Chrome 打印 API** 把 PDF 提交给配置好的打印机。

这已经替代早期的 Windows 辅助程序方案。当前项目依赖 Chrome 扩展和 Chrome 打印 API。

## Viewer 配置

```tsx
<Viewer
  template={template}
  data={data}
  printOptions={{
    adapter: 'chrome-extension',
    chromeExtension: {
      backend: 'chromePrinting',
      printerId: 'receipt-printer-01',
      copies: 1,
      silent: true,
    },
  }}
/>
```

`printerId` 应匹配 Chrome 可用的打印机 ID。企业部署时，建议通过 Chrome 管理策略统一安装扩展并配置打印机，保证工作站可以稳定提交打印任务。

## 打印流程

1. 用户在 Viewer 中点击打印，或业务代码以编程方式触发打印。
2. Viewer 将报表渲染为 PDF 负载。
3. 页面把 base64 PDF 消息发送给 Chrome 扩展。
4. 扩展校验网页来源，并调用 `chrome.printing.submitJob`。
5. Chrome 返回打印任务 ID/状态或错误。
6. 扩展把结果返回给网页。

## 错误处理

桥接返回 `ChromePrintResponse`：

```ts
interface ChromePrintResponse {
  channel: 'report-designer.chrome-print';
  direction: 'extension-to-page';
  requestId: string;
  ok: boolean;
  result?: unknown;
  error?: string;
}
```

常见问题：

| 问题 | 检查项 |
| --- | --- |
| 扩展不可用 | 扩展已安装、已启用，并允许当前 Web 应用 origin。 |
| `chrome.printing` 不可用 | 当前 Chrome 环境支持打印 API，且扩展具有打印权限。 |
| 找不到打印机 | `printerId` 匹配 Chrome 已配置的打印机或企业打印机策略项。 |
| PDF 生成失败 | 报表在发送打印请求前可以正常渲染并导出 PDF。 |

## 备选方案

如果当前环境不需要扩展打印，可以继续使用浏览器打印或 PDF 导出：

```tsx
<Viewer
  template={template}
  data={data}
  printOptions={{
    adapter: 'browser',
  }}
/>
```

浏览器打印会打开原生打印对话框，让用户自行选择打印机。
