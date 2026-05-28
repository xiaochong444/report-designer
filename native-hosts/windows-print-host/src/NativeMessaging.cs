using System.Buffers.Binary;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ReportDesigner.WindowsPrintHost;

public static class NativeMessaging
{
    public static readonly JsonSerializerOptions JsonOptions = CreateJsonOptions();

    public static byte[] EncodeMessage(object message)
    {
        byte[] body = JsonSerializer.SerializeToUtf8Bytes(message, JsonOptions);
        byte[] frame = new byte[4 + body.Length];
        BinaryPrimitives.WriteUInt32LittleEndian(frame.AsSpan(0, 4), (uint)body.Length);
        body.CopyTo(frame.AsSpan(4));
        return frame;
    }

    public static IReadOnlyList<JsonElement> DecodeMessages(ReadOnlySpan<byte> buffer, out byte[] remaining)
    {
        var messages = new List<JsonElement>();
        int offset = 0;

        while (buffer.Length - offset >= 4)
        {
            uint length = BinaryPrimitives.ReadUInt32LittleEndian(buffer.Slice(offset, 4));
            int messageStart = offset + 4;
            int messageEnd = messageStart + checked((int)length);
            if (buffer.Length < messageEnd)
            {
                break;
            }

            ReadOnlySpan<byte> jsonBytes = buffer.Slice(messageStart, checked((int)length));
            using JsonDocument document = JsonDocument.Parse(jsonBytes.ToArray());
            messages.Add(document.RootElement.Clone());
            offset = messageEnd;
        }

        remaining = buffer.Slice(offset).ToArray();
        return messages;
    }

    private static JsonSerializerOptions CreateJsonOptions()
    {
        JsonSerializerOptions options = new(JsonSerializerDefaults.Web);
        options.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
        return options;
    }
}
