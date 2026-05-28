# Windows Print Host Design

## Goal

Add a desktop Native Messaging host for silent PDF printing. The Chrome extension remains the browser bridge; the host receives PDF print jobs, persists queue state locally, invokes a configured Windows PDF print command, and returns a structured result to the extension.

## Shape

The first version is a .NET `WinExe` Native Messaging stdio host, not a visible console app and not a Windows Service. Chrome starts it on demand. Queue files, spool PDFs, and logs are written to a local application data directory so job status survives individual host process exits.

The host does not include a management UI in this phase. Operational visibility comes from JSON job files and log files. A later tray app or service can reuse the same queue directory and job schema to show history, retries, printer status, and calibration.

## Responsibilities

- Decode and encode Chrome Native Messaging length-prefixed JSON messages.
- Accept `printPdf` requests with `requestId`, `jobName`, `printerId`, `copies`, `silent`, `offset`, and `pdfBase64`.
- Validate required fields and persist the PDF under `spool`.
- Persist queue records under `jobs` with `queued`, `printing`, `completed`, or `failed` status.
- Execute a configurable print command template, such as SumatraPDF or a future PDFium print runner.
- Return `{ ok, jobId, status }` or `{ ok: false, error, jobId? }`.

## Non-goals

- No chart-specific printing work.
- No Windows Service in this phase.
- No management GUI in this phase.
- No dependency on a specific PDF reader bundled into the repository.

## Testing

Unit tests cover Native Messaging frame encoding/decoding, durable queue writes, configured command expansion, successful print job execution, and validation failures.
