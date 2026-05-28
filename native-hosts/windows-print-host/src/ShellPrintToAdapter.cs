using System.Diagnostics;

namespace ReportDesigner.WindowsPrintHost;

public sealed class ShellPrintToAdapter : IPrintAdapter
{
    private readonly Func<PrintAdapterJob, CancellationToken, Task> _launch;

    public ShellPrintToAdapter(Func<PrintAdapterJob, CancellationToken, Task>? launch = null)
    {
        _launch = launch ?? LaunchAsync;
    }

    public async Task<PrintAdapterResult> PrintAsync(PrintAdapterJob job, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(job.PrinterId))
        {
            throw new InvalidOperationException("printerId is required for shell printto");
        }

        await _launch(job, cancellationToken);
        return new PrintAdapterResult(null, "shell-printto");
    }

    private static Task LaunchAsync(PrintAdapterJob job, CancellationToken cancellationToken)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = job.SpoolFilePath,
            Arguments = job.PrinterId,
            Verb = "printto",
            UseShellExecute = true,
            WindowStyle = ProcessWindowStyle.Hidden,
            CreateNoWindow = true,
        };

        Process? process = Process.Start(startInfo);
        if (process is null)
        {
            throw new InvalidOperationException($"Failed to shell print file: {job.SpoolFilePath}");
        }

        return Task.CompletedTask;
    }
}
