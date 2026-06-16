const allowedOrigins = document.getElementById('allowedOrigins');
const status = document.getElementById('status');

chrome.storage.local.get({
  allowedOrigins: [],
}, (settings) => {
  allowedOrigins.value = settings.allowedOrigins.join('\n');
});

document.getElementById('save').addEventListener('click', () => {
  chrome.storage.local.set({
    allowedOrigins: allowedOrigins.value
      .split(/\r?\n/g)
      .map((item) => item.trim())
      .filter(Boolean),
  }, () => {
    status.textContent = 'Saved.';
    setTimeout(() => { status.textContent = ''; }, 1800);
  });
});
