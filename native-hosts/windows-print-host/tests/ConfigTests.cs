namespace ReportDesigner.WindowsPrintHost.Tests;

public class ConfigTests
{
    [Fact]
    public async Task LoadAsync_ParsesDefaultPrinterId()
    {
        string rootDir = Path.Combine(Path.GetTempPath(), "print-host-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(rootDir);
        string configPath = Path.Combine(rootDir, "config.json");
        await File.WriteAllTextAsync(configPath, """
        {
          "rootDir": "C:\\Temp\\ReportDesignerPrintHost",
          "defaultPrinterId": "Office Printer",
          "printCommand": "SumatraPDF.exe",
          "printArgs": ["-silent", "{file}"]
        }
        """);

        PrintHostConfig config = await PrintHostConfigLoader.LoadAsync(configPath);

        Assert.Equal("Office Printer", config.DefaultPrinterId);
        Assert.Equal("C:\\Temp\\ReportDesignerPrintHost", config.RootDir);
    }
}
