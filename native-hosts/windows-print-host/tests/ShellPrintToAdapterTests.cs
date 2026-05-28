namespace ReportDesigner.WindowsPrintHost.Tests;

public class ShellPrintToAdapterTests
{
    [Fact]
    public async Task PrintAsync_UsesShellPrintToWhenNoExternalCommandIsConfigured()
    {
        PrintAdapterJob? launchedJob = null;
        ShellPrintToAdapter adapter = new((job, _) =>
        {
            launchedJob = job;
            return Task.CompletedTask;
        });

        PrintAdapterResult result = await adapter.PrintAsync(new PrintAdapterJob(
            "job-1",
            "Demo",
            "Office Printer",
            1,
            true,
            new PrintOffset(0, 0),
            @"C:\spool\job.pdf"));

        Assert.NotNull(launchedJob);
        Assert.Equal(@"C:\spool\job.pdf", launchedJob!.SpoolFilePath);
        Assert.Equal("Office Printer", launchedJob.PrinterId);
        Assert.Equal("shell-printto", result.Output);
    }
}
