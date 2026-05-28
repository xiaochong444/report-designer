const backend = document.getElementById('backend');
const nativeHostName = document.getElementById('nativeHostName');
const allowedOrigins = document.getElementById('allowedOrigins');
const status = document.getElementById('status');

chrome.storage.local.get({
  backend: 'nativeMessaging',
  nativeHostName: 'com.report_designer.print_host',
  allowedOrigins: [],
}, (settings) => {
  backend.value = settings.backend;
  nativeHostName.value = settings.nativeHostName;
  allowedOrigins.value = settings.allowedOrigins.join('\n');
});

document.getElementById('save').addEventListener('click', () => {
  chrome.storage.local.set({
    backend: backend.value,
    nativeHostName: nativeHostName.value.trim() || 'com.report_designer.print_host',
    allowedOrigins: allowedOrigins.value
      .split(/\r?\n/g)
      .map((item) => item.trim())
      .filter(Boolean),
  }, () => {
    status.textContent = 'Saved.';
    setTimeout(() => { status.textContent = ''; }, 1800);
  });
});
