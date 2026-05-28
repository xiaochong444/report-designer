using System.Text.Json;

namespace ReportDesigner.WindowsPrintHost;

public sealed record PrintHostConfig(string RootDir, string PrintCommand, string[] PrintArgs);

public static class PrintHostConfigLoader
{
    public static async Task<PrintHostConfig> LoadAsync(string? configPath = null, CancellationToken cancellationToken = default)
    {
        string rootDir = GetDefaultRootDir();
        string resolvedPath = configPath ?? Path.Combine(rootDir, "config.json");
        PrintHostConfig defaults = new(rootDir, string.Empty, Array.Empty<string>());

        try
        {
            string json = await File.ReadAllTextAsync(resolvedPath, cancellationToken);
            using JsonDocument document = JsonDocument.Parse(json);
            JsonElement root = document.RootElement;
            return new PrintHostConfig(
                root.TryGetProperty("rootDir", out JsonElement rootDirValue) && rootDirValue.ValueKind == JsonValueKind.String
                    ? rootDirValue.GetString() ?? rootDir
                    : rootDir,
                root.TryGetProperty("printCommand", out JsonElement commandValue) && commandValue.ValueKind == JsonValueKind.String
                    ? commandValue.GetString() ?? string.Empty
                    : string.Empty,
                root.TryGetProperty("printArgs", out JsonElement argsValue) && argsValue.ValueKind == JsonValueKind.Array
                    ? argsValue.EnumerateArray().Where(x => x.ValueKind == JsonValueKind.String).Select(x => x.GetString() ?? string.Empty).ToArray()
                    : Array.Empty<string>()
            );
        }
        catch (IOException) when (FileNotFound(resolvedPath))
        {
            return defaults;
        }
    }

    private static string GetDefaultRootDir()
    {
        string baseDir = Environment.GetEnvironmentVariable("LOCALAPPDATA")
            ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "AppData", "Local");
        return Path.Combine(baseDir, "ReportDesignerPrintHost");
    }

    private static bool FileNotFound(string path) => !File.Exists(path);
}
