namespace ReportDesigner.WindowsPrintHost.Tests;

public class PrintHostTests
{
    [Fact]
    public async Task HandleMessage_QueuesPrintJobAndReturnsSuccess()
    {
        string rootDir = Path.Combine(Path.GetTempPath(), "print-host-" + Guid.NewGuid().ToString("N"));
        List<string> printed = [];
        PrintHost host = new(
            new PrintQueue(rootDir, () => new DateTime(2026, 05, 28, 10, 0, 0, DateTimeKind.Utc)),
            new StubAdapter(job =>
            {
                printed.Add(job.SpoolFilePath);
                return Task.FromResult(new PrintAdapterResult("adapter-1", string.Empty));
            }));

        PrintHostResponse response = await host.HandleMessageAsync(new NativeMessage(
            "printPdf",
            JsonDocument.Parse("""
            {
              "requestId": "req-1",
              "printerId": "Printer A",
              "copies": 1,
              "silent": true,
              "offset": { "xMm": 0, "yMm": 0 },
              "pdfBase64": "JVBERi0xLjc="
            }
            """).RootElement.Clone()));

        Assert.True(response.Ok);
        Assert.Equal(PrintJobStatus.Completed, response.Status);
        Assert.Single(printed);
        string? recordPath = Directory.GetFiles(rootDir, "*.json", SearchOption.AllDirectories).SingleOrDefault();
        Assert.NotNull(recordPath);
        PrintJobRecord record = JsonSerializer.Deserialize<PrintJobRecord>(await File.ReadAllTextAsync(recordPath!), NativeMessaging.JsonOptions)!;
        Assert.Equal(PrintJobStatus.Completed, record.Status);
    }

    [Fact]
    public async Task HandleMessage_ReturnsValidationErrorForUnsupportedType()
    {
        string rootDir = Path.Combine(Path.GetTempPath(), "print-host-" + Guid.NewGuid().ToString("N"));
        PrintHost host = new(new PrintQueue(rootDir), new StubAdapter(_ => Task.FromResult(new PrintAdapterResult(null, null))));

        PrintHostResponse response = await host.HandleMessageAsync(new NativeMessage("unknown", null));

        Assert.False(response.Ok);
        Assert.Equal("Unsupported message type: unknown", response.Error);
    }

    [Fact]
    public async Task HandleMessage_MarksQueuedJobFailedWhenAdapterFails()
    {
        string rootDir = Path.Combine(Path.GetTempPath(), "print-host-" + Guid.NewGuid().ToString("N"));
        PrintHost host = new(
            new PrintQueue(rootDir, () => new DateTime(2026, 05, 28, 10, 0, 0, DateTimeKind.Utc)),
            new StubAdapter(_ => throw new InvalidOperationException("Printer is offline")));

        PrintHostResponse response = await host.HandleMessageAsync(new NativeMessage(
            "printPdf",
            JsonDocument.Parse("""
            {
              "requestId": "req-1",
              "printerId": "Printer A",
              "pdfBase64": "JVBERi0xLjc="
            }
            """).RootElement.Clone()));

        Assert.False(response.Ok);
        Assert.Equal(PrintJobStatus.Failed, response.Status);
        string recordPath = Directory.GetFiles(rootDir, "*.json", SearchOption.AllDirectories).Single();
        PrintJobRecord record = JsonSerializer.Deserialize<PrintJobRecord>(await File.ReadAllTextAsync(recordPath), NativeMessaging.JsonOptions)!;
        Assert.Equal(PrintJobStatus.Failed, record.Status);
        Assert.Equal("Printer is offline", record.Error);
    }

    [Fact]
    public async Task HandleMessage_UsesConfiguredDefaultPrinterWhenPayloadOmitsPrinterId()
    {
        string rootDir = Path.Combine(Path.GetTempPath(), "print-host-" + Guid.NewGuid().ToString("N"));
        string? resolvedPrinterId = null;
        PrintHost host = new(
            new PrintQueue(rootDir, () => new DateTime(2026, 05, 28, 10, 0, 0, DateTimeKind.Utc)),
            new StubAdapter(job =>
            {
                resolvedPrinterId = job.PrinterId;
                return Task.FromResult(new PrintAdapterResult("adapter-1", string.Empty));
            }),
            defaultPrinterId: "Office Printer");

        PrintHostResponse response = await host.HandleMessageAsync(new NativeMessage(
            "printPdf",
            JsonDocument.Parse("""
            {
              "requestId": "req-1",
              "pdfBase64": "JVBERi0xLjc="
            }
            """).RootElement.Clone()));

        Assert.True(response.Ok);
        Assert.Equal("Office Printer", resolvedPrinterId);
        string recordPath = Directory.GetFiles(rootDir, "*.json", SearchOption.AllDirectories).Single();
        PrintJobRecord record = JsonSerializer.Deserialize<PrintJobRecord>(await File.ReadAllTextAsync(recordPath), NativeMessaging.JsonOptions)!;
        Assert.Equal("Office Printer", record.PrinterId);
    }

    [Fact]
    public async Task HandleMessage_PrefersConfiguredDefaultPrinterOverPayloadPrinterId()
    {
        string rootDir = Path.Combine(Path.GetTempPath(), "print-host-" + Guid.NewGuid().ToString("N"));
        string? resolvedPrinterId = null;
        PrintHost host = new(
            new PrintQueue(rootDir, () => new DateTime(2026, 05, 28, 10, 0, 0, DateTimeKind.Utc)),
            new StubAdapter(job =>
            {
                resolvedPrinterId = job.PrinterId;
                return Task.FromResult(new PrintAdapterResult("adapter-1", string.Empty));
            }),
            defaultPrinterId: "Office Printer");

        PrintHostResponse response = await host.HandleMessageAsync(new NativeMessage(
            "printPdf",
            JsonDocument.Parse("""
            {
              "requestId": "req-1",
              "printerId": "Ignored Printer",
              "pdfBase64": "JVBERi0xLjc="
            }
            """).RootElement.Clone()));

        Assert.True(response.Ok);
        Assert.Equal("Office Printer", resolvedPrinterId);
        string recordPath = Directory.GetFiles(rootDir, "*.json", SearchOption.AllDirectories).Single();
        PrintJobRecord record = JsonSerializer.Deserialize<PrintJobRecord>(await File.ReadAllTextAsync(recordPath), NativeMessaging.JsonOptions)!;
        Assert.Equal("Office Printer", record.PrinterId);
    }

    private sealed class StubAdapter : IPrintAdapter
    {
        private readonly Func<PrintAdapterJob, Task<PrintAdapterResult>> _handler;

        public StubAdapter(Func<PrintAdapterJob, Task<PrintAdapterResult>> handler)
        {
            _handler = handler;
        }

        public Task<PrintAdapterResult> PrintAsync(PrintAdapterJob job, CancellationToken cancellationToken = default) => _handler(job);
    }
}
