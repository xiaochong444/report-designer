const CHANNEL = 'report-designer.chrome-print';

window.addEventListener('message', (event) => {
  const message = event.data;
  if (!message || message.channel !== CHANNEL || message.direction !== 'page-to-extension') {
    return;
  }

  chrome.runtime.sendMessage(
    {
      ...message,
      pageOrigin: event.origin,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        window.postMessage({
          channel: CHANNEL,
          direction: 'extension-to-page',
          requestId: message.requestId,
          ok: false,
          error: chrome.runtime.lastError.message,
        }, event.origin || '*');
        return;
      }

      window.postMessage(response ?? {
        channel: CHANNEL,
        direction: 'extension-to-page',
        requestId: message.requestId,
        ok: false,
        error: 'No response from print bridge',
      }, event.origin || '*');
    },
  );
});
