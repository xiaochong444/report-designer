const CHANNEL = 'report-designer.chrome-print';
const DEFAULT_NATIVE_HOST = 'com.report_designer.print_host';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.channel !== CHANNEL || message.direction !== 'page-to-extension') {
    return false;
  }

  handlePrintMessage(message, sender)
    .then((response) => sendResponse(response))
    .catch((error) => sendResponse(makeErrorResponse(message.requestId, error)));

  return true;
});

async function handlePrintMessage(message, sender) {
  const settings = await loadSettings();
  if (message.payload?.format !== 'pdf') {
    return makeErrorResponse(message.requestId, 'Only PDF print jobs are supported.');
  }

  if (!isAllowedOrigin(message.pageOrigin, settings.allowedOrigins)) {
    return makeErrorResponse(message.requestId, `Origin not allowed: ${message.pageOrigin || 'unknown'}`);
  }

  const payload = {
    requestId: message.requestId,
    jobName: message.payload.jobName,
    printerId: message.payload.printerId,
    copies: message.payload.copies ?? 1,
    silent: message.payload.silent !== false,
    offset: message.payload.offset ?? { xMm: 0, yMm: 0 },
    pdfBase64: message.payload.pdfBase64,
    sourceOrigin: message.pageOrigin,
  };

  const backend = message.payload.backend || settings.backend;
  if (backend === 'chromePrinting' && chrome.printing?.submitJob) {
    return await submitChromeOsPrintJob(payload, settings);
  }

  return await submitNativeHostPrintJob(payload, settings.nativeHostName);
}

async function submitChromeOsPrintJob(payload, settings) {
  const pdfBytes = base64ToUint8Array(payload.pdfBase64);
  const printerId = payload.printerId;
  if (!printerId) {
    return makeErrorResponse(payload.requestId, 'A printerId is required for chrome.printing jobs.');
  }

  const jobTicket = {
    version: '1.0',
    print: {
      color: { type: 'STANDARD_MONOCHROME' },
      duplex: { type: 'NO_DUPLEX' },
      copies: { copies: payload.copies },
    },
  };

  const document = new Blob([pdfBytes], { type: 'application/pdf' });

  return await new Promise((resolve) => {
    chrome.printing.submitJob({
      job: {
        printerId,
        title: payload.jobName || 'Report',
        ticket: jobTicket,
        contentType: 'application/pdf',
        document,
      },
    }, (result) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        resolve(makeErrorResponse(payload.requestId, lastError.message));
        return;
      }
      if (!result || result.status !== 'OK') {
        resolve(makeErrorResponse(payload.requestId, result?.status || 'Printing was rejected.'));
        return;
      }
      resolve({
        channel: CHANNEL,
        direction: 'extension-to-page',
        requestId: payload.requestId,
        ok: true,
        result: { backend: 'chromePrinting', jobId: result.jobId, status: result.status },
      });
    });
  });
}

async function submitNativeHostPrintJob(payload, nativeHostName) {
  return await new Promise((resolve) => {
    chrome.runtime.sendNativeMessage(
      nativeHostName || DEFAULT_NATIVE_HOST,
      {
        type: 'printPdf',
        payload,
      },
      (result) => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          resolve(makeErrorResponse(payload.requestId, lastError.message));
          return;
        }
        resolve({
          channel: CHANNEL,
          direction: 'extension-to-page',
          requestId: payload.requestId,
          ok: true,
          result: { backend: 'nativeMessaging', result },
        });
      },
    );
  });
}

function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) return true;
  if (!Array.isArray(allowedOrigins) || allowedOrigins.length === 0) {
    return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(origin) || origin.startsWith('file://');
  }
  return allowedOrigins.includes(origin);
}

async function loadSettings() {
  return await new Promise((resolve) => {
    chrome.storage.local.get({
      backend: 'nativeMessaging',
      nativeHostName: DEFAULT_NATIVE_HOST,
      allowedOrigins: [],
    }, resolve);
  });
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function makeErrorResponse(requestId, error) {
  return {
    channel: CHANNEL,
    direction: 'extension-to-page',
    requestId,
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  };
}
