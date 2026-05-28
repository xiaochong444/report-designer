using System.Diagnostics;

namespace ReportDesigner.WindowsPrintHost;

public sealed class CommandPrintAdapter : IPrintAdapter
{
    private readonly string _command;
    private readonly IReadOnlyList<string> _args;
    private readonly Func<string, IReadOnlyList<string>, CancellationToken, Task<CommandExecutionResult>> _execute;

    public CommandPrintAdapter(
        string command,
        IReadOnlyList<string> args,
        Func<string, IReadOnlyList<string>, CancellationToken, Task<CommandExecutionResult>>? execute = null)
    {
        _command = command;
        _args = args;
        _execute = execute ?? ExecuteAsync;
    }

    public async Task<PrintAdapterResult> PrintAsync(PrintAdapterJob job, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_command))
        {
            throw new InvalidOperationException("No print command configured");
        }

        string[] expandedArgs = _args.Select(arg => ExpandToken(arg, job)).ToArray();
        CommandExecutionResult result = await _execute(_command, expandedArgs, cancellationToken);
        if (result.ExitCode != 0)
        {
            throw new InvalidOperationException(string.IsNullOrWhiteSpace(result.Stderr)
                ? $"Print command exited with code {result.ExitCode}"
                : result.Stderr.Trim());
        }

        return new PrintAdapterResult(null, result.Stdout.Trim());
    }

    private static string ExpandToken(string value, PrintAdapterJob job)
    {
        return value
            .Replace("{file}", job.SpoolFilePath, StringComparison.OrdinalIgnoreCase)
            .Replace("{printerId}", job.PrinterId, StringComparison.OrdinalIgnoreCase)
            .Replace("{copies}", job.Copies.ToString(), StringComparison.OrdinalIgnoreCase)
            .Replace("{jobName}", job.JobName, StringComparison.OrdinalIgnoreCase)
            .Replace("{silent}", job.Silent ? "true" : "false", StringComparison.OrdinalIgnoreCase)
            .Replace("{offsetXmm}", job.Offset.XMm.ToString(), StringComparison.OrdinalIgnoreCase)
            .Replace("{offsetYmm}", job.Offset.YMm.ToString(), StringComparison.OrdinalIgnoreCase);
    }

    private static async Task<CommandExecutionResult> ExecuteAsync(string command, IReadOnlyList<string> args, CancellationToken cancellationToken)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = command,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
        };

        foreach (string arg in args)
        {
            startInfo.ArgumentList.Add(arg);
        }

        using Process process = new() { StartInfo = startInfo };
        if (!process.Start())
        {
            throw new InvalidOperationException($"Failed to start print command: {command}");
        }

        string stdout = await process.StandardOutput.ReadToEndAsync(cancellationToken);
        string stderr = await process.StandardError.ReadToEndAsync(cancellationToken);
        await process.WaitForExitAsync(cancellationToken);
        return new CommandExecutionResult(process.ExitCode, stdout, stderr);
    }
}

public sealed record CommandExecutionResult(int ExitCode, string Stdout, string Stderr);
