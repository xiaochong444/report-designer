namespace ReportDesigner.WindowsPrintHost.Tests;

public class PrintAdapterTests
{
    [Fact]
    public async Task PrintAsync_ExpandsTokensAndRunsCommand()
    {
        List<(string Command, string[] Args)> calls = [];
        CommandPrintAdapter adapter = new(
            "SumatraPDF.exe",
            ["-print-to", "{printerId}", "-print-settings", "{copies}x", "-silent", "{file}"],
            (command, args, _) =>
            {
                calls.Add((command, args.ToArray()));
                return Task.FromResult(new CommandExecutionResult(0, "queued", string.Empty));
            });

        PrintAdapterResult result = await adapter.PrintAsync(new PrintAdapterJob(
            "job-1",
            "Order",
            "Warehouse Printer",
            3,
            true,
            new PrintOffset(0, 0),
            @"C:\spool\job.pdf"
        ));

        Assert.Equal("queued", result.Output);
        Assert.Single(calls);
        Assert.Equal("SumatraPDF.exe", calls[0].Command);
        Assert.Equal(["-print-to", "Warehouse Printer", "-print-settings", "3x", "-silent", @"C:\spool\job.pdf"], calls[0].Args);
    }

    [Fact]
    public async Task PrintAsync_OmitsSilentSwitchForInteractiveJobs()
    {
        List<(string Command, string[] Args)> calls = [];
        CommandPrintAdapter adapter = new(
            "SumatraPDF.exe",
            ["-print-to", "{printerId}", "-print-settings", "{copies}x", "-silent", "{file}"],
            (command, args, _) =>
            {
                calls.Add((command, args.ToArray()));
                return Task.FromResult(new CommandExecutionResult(0, "queued", string.Empty));
            });

        await adapter.PrintAsync(new PrintAdapterJob(
            "job-1",
            "Order",
            "Microsoft Print to PDF",
            1,
            false,
            new PrintOffset(0, 0),
            @"C:\spool\job.pdf"
        ));

        Assert.Single(calls);
        Assert.Equal(["-print-to", "Microsoft Print to PDF", "-print-settings", "1x", @"C:\spool\job.pdf"], calls[0].Args);
    }

    [Fact]
    public async Task PrintAsync_RequiresConfiguredCommand()
    {
        CommandPrintAdapter adapter = new(string.Empty, []);

        await Assert.ThrowsAsync<InvalidOperationException>(() => adapter.PrintAsync(new PrintAdapterJob(
            "job-1",
            "Order",
            "Printer",
            1,
            true,
            new PrintOffset(0, 0),
            @"C:\spool\job.pdf"
        )));
    }
}
