// Runs in Instagram's own page (MAIN world) before its scripts. Records the
// extra headers Instagram attaches to its API calls (x-asbd-id, www-claim, …)
// and the URL of its own search requests, so our requests look identical.
// Shared with the content scripts through a data attribute on <html>.
(() => {
  if (window.__isHook) return;
  window.__isHook = true;
  const KEEP = /^(x-asbd-id|x-ig-www-claim|x-ig-app-id|x-web-session-id|x-bloks-version-id|x-fb-lsd|x-requested-with)$/i;
  const headers = {};
  let saveT = 0;
  const save = () => {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      try { document.documentElement.dataset.isHeaders = JSON.stringify(headers); } catch {}
    }, 50);
  };
  const note = (k, v) => { if (KEEP.test(k) && v) { headers[k.toLowerCase()] = String(v); save(); } };
  const noteUrl = (u) => {
    try {
      const url = String(u);
      if (/search/i.test(url) && /query=|q=/.test(url)) document.documentElement.dataset.isSearchUrl = new URL(url, location.href).href;
    } catch {}
  };

  const setH = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function (k, v) { note(k, v); return setH.call(this, k, v); };
  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u, ...rest) { noteUrl(u); return open.call(this, m, u, ...rest); };

  // Page-context fetch for the content script: same JS realm and headers as
  // Instagram's own requests. Only same-origin API paths are accepted.
  window.addEventListener('message', async (e) => {
    const m = e.data;
    if (e.source !== window || !m || m.__is !== 'req' || !/^\/(api|web|graphql)\//.test(m.path)) return;
    let status = 0, text = '';
    try {
      const r = await f(m.path, { credentials: 'include', headers: { ...headers, ...m.headers } });
      status = r.status; text = await r.text();
    } catch (err) { text = String(err); }
    window.postMessage({ __is: 'res', id: m.id, status, text }, location.origin);
  });

  const f = window.fetch;
  window.fetch = function (input, init) {
    try {
      noteUrl(typeof input === 'string' ? input : input?.url);
      const h = init?.headers || (input instanceof Request ? input.headers : null);
      if (h) (h instanceof Headers ? [...h.entries()] : Object.entries(h)).forEach(([k, v]) => note(k, v));
    } catch {}
    return f.apply(this, arguments);
  };
})();
