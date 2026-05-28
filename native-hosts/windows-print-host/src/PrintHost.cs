using System.Text.Json;

namespace ReportDesigner.WindowsPrintHost;

public sealed class PrintHost
{
    private readonly PrintQueue _queue;
    private readonly IPrintAdapter _printAdapter;
    private readonly string? _defaultPrinterId;

    public PrintHost(PrintQueue queue, IPrintAdapter printAdapter, string? defaultPrinterId = null)
    {
        _queue = queue;
        _printAdapter = printAdapter;
        _defaultPrinterId = defaultPrinterId;
    }

    public async Task<PrintHostResponse> HandleMessageAsync(NativeMessage message, CancellationToken cancellationToken = default)
    {
        if (!string.Equals(message.Type, "printPdf", StringComparison.Ordinal))
        {
            return new PrintHostResponse(false, Error: $"Unsupported message type: {message.Type}");
        }

        string? jobId = null;
        try
        {
            PrintPdfPayload payload = ValidatePayload(message.Payload);
            string resolvedPrinterId = ResolvePrinterId(payload.PrinterId);
            PrintPdfPayload normalizedPayload = payload with { PrinterId = resolvedPrinterId };
            PrintJobRecord queued = await _queue.EnqueuePdfAsync(normalizedPayload, cancellationToken);
            jobId = queued.JobId;
            PrintJobRecord printing = await _queue.MarkPrintingAsync(queued.JobId, cancellationToken);
            PrintAdapterResult result = await _printAdapter.PrintAsync(new PrintAdapterJob(
                printing.JobId,
                printing.JobName,
                printing.PrinterId,
                printing.Copies,
                printing.Silent,
                printing.Offset,
                printing.SpoolFilePath
            ), cancellationToken);

            PrintJobRecord completed = await _queue.MarkCompletedAsync(printing.JobId, result.ExternalJobId, cancellationToken);
            return new PrintHostResponse(true, completed.JobId, completed.Status, completed.ExternalJobId);
        }
        catch (Exception ex)
        {
            if (!string.IsNullOrWhiteSpace(jobId))
            {
                PrintJobRecord failed = await _queue.MarkFailedAsync(jobId, ex, cancellationToken);
                return new PrintHostResponse(false, failed.JobId, failed.Status, Error: ex.Message);
            }

            return new PrintHostResponse(false, Error: ex.Message);
        }
    }

    private string ResolvePrinterId(string? payloadPrinterId)
    {
        if (!string.IsNullOrWhiteSpace(_defaultPrinterId))
        {
            return _defaultPrinterId;
        }

        if (!string.IsNullOrWhiteSpace(payloadPrinterId))
        {
            return payloadPrinterId;
        }

        throw new InvalidOperationException("printerId is required when no default printer is configured");
    }

    private static PrintPdfPayload ValidatePayload(JsonElement? payload)
    {
        if (payload is null || payload.Value.ValueKind != JsonValueKind.Object)
        {
            throw new InvalidOperationException("printPdf payload is required");
        }

        JsonElement root = payload.Value;
        string requestId = ReadRequiredString(root, "requestId");
        string? printerId = ReadOptionalString(root, "printerId");
        string pdfBase64 = ReadRequiredString(root, "pdfBase64");
        string? jobName = ReadOptionalString(root, "jobName");
        string? sourceOrigin = ReadOptionalString(root, "sourceOrigin");
        int copies = ReadOptionalInt(root, "copies") ?? 1;
        bool silent = ReadOptionalBool(root, "silent") ?? true;
        PrintOffset offset = ReadOptionalOffset(root, "offset");

        return new PrintPdfPayload(requestId, printerId, pdfBase64, jobName, copies < 1 ? 1 : copies, silent, offset, sourceOrigin);
    }

    private static string ReadRequiredString(JsonElement root, string propertyName)
    {
        if (root.TryGetProperty(propertyName, out JsonElement property) && property.ValueKind == JsonValueKind.String)
        {
            return property.GetString() ?? throw new InvalidOperationException($"{propertyName} is required");
        }

        throw new InvalidOperationException($"{propertyName} is required");
    }

    private static string? ReadOptionalString(JsonElement root, string propertyName)
        => root.TryGetProperty(propertyName, out JsonElement property) && property.ValueKind == JsonValueKind.String
            ? property.GetString()
            : null;

    private static int? ReadOptionalInt(JsonElement root, string propertyName)
        => root.TryGetProperty(propertyName, out JsonElement property) && property.ValueKind == JsonValueKind.Number && property.TryGetInt32(out int value)
            ? value
            : null;

    private static bool? ReadOptionalBool(JsonElement root, string propertyName)
        => root.TryGetProperty(propertyName, out JsonElement property) && (property.ValueKind == JsonValueKind.True || property.ValueKind == JsonValueKind.False)
            ? property.GetBoolean()
            : null;

    private static PrintOffset ReadOptionalOffset(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out JsonElement property) || property.ValueKind != JsonValueKind.Object)
        {
            return new PrintOffset(0, 0);
        }

        double xMm = property.TryGetProperty("xMm", out JsonElement xValue) && xValue.ValueKind == JsonValueKind.Number ? xValue.GetDouble() : 0;
        double yMm = property.TryGetProperty("yMm", out JsonElement yValue) && yValue.ValueKind == JsonValueKind.Number ? yValue.GetDouble() : 0;
        return new PrintOffset(xMm, yMm);
    }
}
