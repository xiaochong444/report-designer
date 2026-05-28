using System.Text.Json;

using ReportDesigner.WindowsPrintHost;

CancellationTokenSource cts = new();
PrintHostConfig config = await PrintHostConfigLoader.LoadAsync();
PrintQueue queue = new(config.RootDir);
IPrintAdapter printAdapter = new CommandPrintAdapter(config.PrintCommand, config.PrintArgs);
PrintHost host = new(queue, printAdapter);

await RunAsync(host, cts.Token);

static async Task RunAsync(PrintHost host, CancellationToken cancellationToken)
{
    Stream input = Console.OpenStandardInput();
    Stream output = Console.OpenStandardOutput();
    byte[] buffer = Array.Empty<byte>();
    byte[] chunk = new byte[4096];

    while (!cancellationToken.IsCancellationRequested)
    {
        int read = await input.ReadAsync(chunk, cancellationToken);
        if (read <= 0)
        {
            break;
        }

        byte[] next = new byte[buffer.Length + read];
        Buffer.BlockCopy(buffer, 0, next, 0, buffer.Length);
        Buffer.BlockCopy(chunk, 0, next, buffer.Length, read);
        buffer = next;

        IReadOnlyList<JsonElement> messages = NativeMessaging.DecodeMessages(buffer, out byte[] remaining);
        buffer = remaining;

        foreach (JsonElement message in messages)
        {
            PrintHostResponse response = await host.HandleMessageAsync(
                JsonSerializer.Deserialize<NativeMessage>(message.GetRawText(), NativeMessaging.JsonOptions) ?? new NativeMessage(null, null),
                cancellationToken);

            byte[] frame = NativeMessaging.EncodeMessage(response);
            await output.WriteAsync(frame, cancellationToken);
            await output.FlushAsync(cancellationToken);
        }
    }
}
