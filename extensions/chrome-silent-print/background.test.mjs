import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

function createContext(nativeResult) {
  const context = {
    atob: (value) => Buffer.from(value, 'base64').toString('binary'),
    Blob,
    chrome: {
      runtime: {
        lastError: null,
        onMessage: { addListener() {} },
        sendNativeMessage(_hostName, _message, callback) {
          callback(nativeResult);
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

test('native host failures are forwarded as extension failures', async () => {
  const context = createContext({ ok: false, error: 'No print command configured' });

  const response = await context.submitNativeHostPrintJob({ requestId: 'req-1' }, 'com.report_designer.print_host');

  assert.equal(response.ok, false);
  assert.equal(response.error, 'No print command configured');
});

test('native host success is unwrapped for the page response', async () => {
  const context = createContext({ ok: true, jobId: 'job-1', status: 'completed' });

  const response = await context.submitNativeHostPrintJob({ requestId: 'req-1' }, 'com.report_designer.print_host');

  assert.equal(response.ok, true);
  assert.equal(JSON.stringify(response.result), JSON.stringify({
    backend: 'nativeMessaging',
    ok: true,
    jobId: 'job-1',
    status: 'completed',
  }));
});
