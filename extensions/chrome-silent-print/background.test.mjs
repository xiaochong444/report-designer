import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

function createContext(printingResult = { status: 'OK', jobId: 'chrome-job-1' }) {
  const context = {
    atob: (value) => Buffer.from(value, 'base64').toString('binary'),
    Blob,
    chrome: {
      runtime: {
        lastError: null,
        onMessage: { addListener() {} },
      },
      printing: {
        submitJob(_job, callback) {
          callback(printingResult);
        },
      },
      storage: {
        local: {
          get(defaults, callback) {
            callback(defaults);
          },
        },
      },
    },
  };
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL('./background.js', import.meta.url), 'utf8'), context);
  return context;
}

test('chrome printing failures are forwarded as extension failures', async () => {
  const context = createContext({ status: 'FAILED' });

  const response = await context.submitChromePrintJob({
    requestId: 'req-1',
    printerId: 'printer-01',
    pdfBase64: Buffer.from('PDF').toString('base64'),
  });

  assert.equal(response.ok, false);
  assert.equal(response.error, 'FAILED');
});

test('chrome printing success is unwrapped for the page response', async () => {
  const context = createContext({ status: 'OK', jobId: 'chrome-job-1' });

  const response = await context.submitChromePrintJob({
    requestId: 'req-1',
    printerId: 'printer-01',
    pdfBase64: Buffer.from('PDF').toString('base64'),
  });

  assert.equal(response.ok, true);
  assert.equal(JSON.stringify(response.result), JSON.stringify({
    backend: 'chromePrinting',
    jobId: 'chrome-job-1',
    status: 'OK',
  }));
});
