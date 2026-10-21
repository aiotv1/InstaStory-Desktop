// 1. Toolbar button / Alt+Shift+S opens the story dialog inside instagram.com.
// 2. Fallback uploader: if the page can't reach i.instagram.com directly (CORS),
//    the content script hands the file here and we upload it the way Inssist
//    does — from the extension, with Origin rewritten to www.instagram.com.

async function installRules() {
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [1],
    addRules: [{
      id: 1,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [
          { header: 'Origin', operation: 'set', value: 'https://www.instagram.com' },
          { header: 'Referer', operation: 'set', value: 'https://www.instagram.com/' },
        ],
      },
      condition: {
        requestDomains: ['instagram.com'],
        initiatorDomains: [chrome.runtime.id],
        resourceTypes: ['xmlhttprequest', 'other'],
      },
    }],
  });
}

chrome.runtime.onInstalled.addListener(installRules);
chrome.runtime.onStartup.addListener(installRules);

chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.url?.startsWith('https://www.instagram.com/')) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'open' });
      return;
    } catch { /* content script not loaded yet (tab opened before install) */ }
    await chrome.tabs.update(tab.id, { url: 'https://www.instagram.com/#instastory' });
    await chrome.tabs.reload(tab.id);
    return;
  }
  await chrome.tabs.create({ url: 'https://www.instagram.com/#instastory' });
});

// Download a file from Instagram's CDN (music tracks, album covers) for the
// content script; the page itself can't read those cross-origin bytes.
chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg?.type !== 'fetchBinary') return;
  const host = (() => { try { return new URL(msg.url).hostname; } catch { return ''; } })();
  if (!/(\.|^)(cdninstagram\.com|fbcdn\.net|instagram\.com)$/.test(host)) { reply({ ok: false, error: 'blocked host' }); return; }
  (async () => {
    const r = await fetch(msg.url, { credentials: 'omit' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const blob = await r.blob();
    const dataUrl = await new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.readAsDataURL(blob);
    });
    reply({ ok: true, dataUrl });
  })().catch((e) => reply({ ok: false, error: String(e) }));
  return true;
});

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg?.type !== 'rupload') return;
  (async () => {
    await installRules();
    const blob = await (await fetch(msg.dataUrl)).blob();
    const r = await fetch(msg.url, { method: 'POST', body: blob, headers: msg.headers, credentials: 'include' });
    reply({ ok: r.ok, status: r.status, text: await r.text() });
  })().catch((e) => reply({ ok: false, status: 0, text: String(e) }));
  return true;
});
