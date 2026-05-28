using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ReportDesigner.WindowsPrintHost;

public sealed class PrintQueue
{
    private static readonly JsonSerializerOptions JobRecordJsonOptions = CreateJobRecordJsonOptions();
    private readonly string _jobsDir;
    private readonly string _spoolDir;
    private readonly Func<DateTime> _now;

    public PrintQueue(string rootDir, Func<DateTime>? now = null)
    {
        _jobsDir = Path.Combine(rootDir, "jobs");
        _spoolDir = Path.Combine(rootDir, "spool");
        _now = now ?? (() => DateTime.UtcNow);
    }

    public async Task<PrintJobRecord> EnqueuePdfAsync(PrintPdfPayload payload, CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(_jobsDir);
        Directory.CreateDirectory(_spoolDir);

        string jobId = CreateJobId(_now());
        string spoolFilePath = Path.Combine(_spoolDir, $"{jobId}.pdf");
        string recordFilePath = Path.Combine(_jobsDir, $"{jobId}.json");
        string timestamp = _now().ToString("O");
        PrintJobRecord record = new(
            jobId,
            payload.RequestId,
            string.IsNullOrWhiteSpace(payload.JobName) ? "Report" : payload.JobName.Trim(),
            payload.PrinterId,
            payload.Copies < 1 ? 1 : payload.Copies,
            payload.Silent,
            payload.Offset ?? new PrintOffset(0, 0),
            payload.SourceOrigin,
            PrintJobStatus.Queued,
            timestamp,
            timestamp,
            spoolFilePath,
            recordFilePath
        );

        await File.WriteAllBytesAsync(spoolFilePath, Convert.FromBase64String(payload.PdfBase64), cancellationToken);
        return await SaveAsync(record, cancellationToken);
    }

    public Task<PrintJobRecord> MarkPrintingAsync(string jobId, CancellationToken cancellationToken = default)
        => UpdateStatusAsync(jobId, PrintJobStatus.Printing, cancellationToken: cancellationToken);

    public Task<PrintJobRecord> MarkCompletedAsync(string jobId, string? externalJobId = null, CancellationToken cancellationToken = default)
        => UpdateStatusAsync(jobId, PrintJobStatus.Completed, externalJobId, cancellationToken: cancellationToken);

    public Task<PrintJobRecord> MarkFailedAsync(string jobId, Exception error, CancellationToken cancellationToken = default)
        => UpdateStatusAsync(jobId, PrintJobStatus.Failed, error: error.Message, cancellationToken: cancellationToken);

    private async Task<PrintJobRecord> UpdateStatusAsync(
        string jobId,
        PrintJobStatus status,
        string? externalJobId = null,
        string? error = null,
        CancellationToken cancellationToken = default)
    {
        PrintJobRecord record = await ReadAsync(jobId, cancellationToken);
        PrintJobRecord updated = record with
        {
            Status = status,
            ExternalJobId = externalJobId ?? record.ExternalJobId,
            Error = error ?? record.Error,
            UpdatedAt = _now().ToString("O"),
        };
        return await SaveAsync(updated, cancellationToken);
    }

    private async Task<PrintJobRecord> ReadAsync(string jobId, CancellationToken cancellationToken)
    {
        string filePath = Path.Combine(_jobsDir, $"{jobId}.json");
        string json = await File.ReadAllTextAsync(filePath, cancellationToken);
        return JsonSerializer.Deserialize<PrintJobRecord>(json, JobRecordJsonOptions) ?? throw new InvalidOperationException($"Invalid job record: {jobId}");
    }

    private async Task<PrintJobRecord> SaveAsync(PrintJobRecord record, CancellationToken cancellationToken)
    {
        string json = JsonSerializer.Serialize(record, JobRecordJsonOptions);
        await File.WriteAllTextAsync(record.RecordFilePath, json + Environment.NewLine, cancellationToken);
        return record;
    }

    private static JsonSerializerOptions CreateJobRecordJsonOptions()
    {
        JsonSerializerOptions options = new(JsonSerializerDefaults.Web) { WriteIndented = true };
        options.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
        return options;
    }

    private static string CreateJobId(DateTime now)
    {
        string stamp = now.ToString("yyyyMMddHHmmss");
        string random = Convert.ToHexString(RandomNumberGenerator.GetBytes(6)).ToLowerInvariant();
        return $"job_{stamp}_{random}";
    }
}
