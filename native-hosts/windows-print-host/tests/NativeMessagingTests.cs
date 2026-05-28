using System.Text.Json;

namespace ReportDesigner.WindowsPrintHost.Tests;

public class NativeMessagingTests
{
    [Fact]
    public void EncodeMessage_WritesLengthPrefixedJson()
    {
        byte[] frame = NativeMessaging.EncodeMessage(new PrintHostResponse(true, "job-1", PrintJobStatus.Completed));

        int length = BitConverter.ToInt32(frame, 0);
        using JsonDocument document = JsonDocument.Parse(frame.AsSpan(4).ToArray());

        Assert.Equal(frame.Length - 4, length);
        Assert.Equal("job-1", document.RootElement.GetProperty("jobId").GetString());
        Assert.True(document.RootElement.GetProperty("ok").GetBoolean());
        Assert.Equal("completed", document.RootElement.GetProperty("status").GetString());
    }

    [Fact]
    public void DecodeMessages_ReturnsCompleteMessagesAndRemainingBytes()
    {
        byte[] first = NativeMessaging.EncodeMessage(new { type = "ping" });
        byte[] second = NativeMessaging.EncodeMessage(new { type = "printPdf", payload = new { requestId = "r1" } });
        byte[] partial = second.Take(second.Length - 2).ToArray();
        byte[] buffer = first.Concat(partial).ToArray();

        IReadOnlyList<JsonElement> messages = NativeMessaging.DecodeMessages(buffer, out byte[] remaining);

        Assert.Single(messages);
        Assert.Equal("ping", messages[0].GetProperty("type").GetString());
        Assert.Equal(partial, remaining);
    }

    [Fact]
    public void JsonOptions_DeserializesChromeCamelCaseMessages()
    {
        NativeMessage? message = JsonSerializer.Deserialize<NativeMessage>(
            """
            {
              "type": "printPdf",
              "payload": { "requestId": "req-1" }
            }
            """,
            NativeMessaging.JsonOptions);

        Assert.NotNull(message);
        Assert.Equal("printPdf", message.Type);
        Assert.Equal("req-1", message.Payload!.Value.GetProperty("requestId").GetString());
    }
}
