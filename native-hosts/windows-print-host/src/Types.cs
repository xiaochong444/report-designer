using System.Text.Json;

namespace ReportDesigner.WindowsPrintHost;

public enum PrintJobStatus
{
    Queued,
    Printing,
    Completed,
    Failed,
}

public sealed record PrintOffset(double XMm, double YMm);

public sealed record PrintPdfPayload(
    string RequestId,
    string PrinterId,
    string PdfBase64,
    string? JobName = null,
    int Copies = 1,
    bool Silent = true,
    PrintOffset? Offset = null,
    string? SourceOrigin = null
);

public sealed record PrintJobRecord(
    string JobId,
    string RequestId,
    string JobName,
    string PrinterId,
    int Copies,
    bool Silent,
    PrintOffset Offset,
    string? SourceOrigin,
    PrintJobStatus Status,
    string CreatedAt,
    string UpdatedAt,
    string SpoolFilePath,
    string RecordFilePath,
    string? ExternalJobId = null,
    string? Error = null
);

public sealed record NativeMessage(string? Type, JsonElement? Payload);

public sealed record PrintAdapterJob(
    string JobId,
    string JobName,
    string PrinterId,
    int Copies,
    bool Silent,
    PrintOffset Offset,
    string SpoolFilePath
);

public sealed record PrintAdapterResult(string? ExternalJobId, string? Output);

public interface IPrintAdapter
{
    Task<PrintAdapterResult> PrintAsync(PrintAdapterJob job, CancellationToken cancellationToken = default);
}

public sealed record PrintHostResponse(bool Ok, string? JobId = null, PrintJobStatus? Status = null, string? ExternalJobId = null, string? Error = null);
