namespace ReportDesigner.WindowsPrintHost.Tests;

public class QueueTests
{
    [Fact]
    public async Task EnqueuePdf_PersistsSpoolAndStatus()
    {
        string rootDir = Path.Combine(Path.GetTempPath(), "print-host-" + Guid.NewGuid().ToString("N"));
        PrintQueue queue = new(rootDir, () => new DateTime(2026, 05, 28, 10, 0, 0, DateTimeKind.Utc));

        PrintJobRecord job = await queue.EnqueuePdfAsync(new PrintPdfPayload(
            "req-1",
            "Printer A",
            Convert.ToBase64String(Encoding.UTF8.GetBytes("%PDF-1.7")),
            "Invoice",
            2,
            true,
            new PrintOffset(1, -2),
            "http://localhost:5173"
        ));

        Assert.Equal("queued", job.Status.ToString().ToLowerInvariant());
        Assert.Equal("%PDF-1.7", await File.ReadAllTextAsync(job.SpoolFilePath));

        PrintJobRecord printing = await queue.MarkPrintingAsync(job.JobId);
        PrintJobRecord completed = await queue.MarkCompletedAsync(job.JobId, "win-42");
        string savedJson = await File.ReadAllTextAsync(job.RecordFilePath);
        PrintJobRecord saved = JsonSerializer.Deserialize<PrintJobRecord>(savedJson, NativeMessaging.JsonOptions)!;

        Assert.Equal(PrintJobStatus.Printing, printing.Status);
        Assert.Equal(PrintJobStatus.Completed, completed.Status);
        Assert.Equal("win-42", saved.ExternalJobId);
        Assert.Contains("\"status\": \"completed\"", savedJson);
    }
}
