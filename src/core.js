// InstaStory Desktop — shared core: constants, Instagram web API, fonts, saved settings.
// Files in src/ are loaded in order as content scripts and share `self.IS`.
(() => {
  if (window.top !== window || self.IS) return;
  const IS = (self.IS = {});

  IS.APP_ID = '936619743392459';
  IS.W = 1080;
  IS.H = 1920;
  IS.MAX_VIDEO_SEC = 60;
  IS.SYS_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Segoe UI Emoji", sans-serif';
  IS.IG_GRAD = ['#feda75', '#fa7e1e', '#d62976', '#962fbf', '#4f5bd5'];
  IS.sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ───────────── Instagram web API (same flow as Inssist) ───────────── */

  const cookie = (IS.cookie = (n) => {
    const c = document.cookie.split('; ').find((x) => x.startsWith(n + '='));
    return c ? decodeURIComponent(c.slice(n.length + 1)) : '';
  });

  function igHeaders(extra = {}) {
    const h = { 'x-ig-app-id': IS.APP_ID, 'x-requested-with': 'XMLHttpRequest', 'x-csrftoken': cookie('csrftoken') };
    try { const claim = sessionStorage.getItem('www-claim-v2'); if (claim) h['x-ig-www-claim'] = claim; } catch {}
    // headers Instagram's own page uses (recorded by hook.js)
    try { Object.assign(h, JSON.parse(document.documentElement.dataset.isHeaders || '{}')); } catch {}
    h['x-csrftoken'] = cookie('csrftoken');
    return { ...h, ...extra };
  }

  function parseResponse(status, text) {
    let json = null;
    try { json = JSON.parse(text); } catch {}
    if (status >= 200 && status < 300 && json && (json.status === undefined || json.status === 'ok')) return json;
    if (status >= 200 && status < 300 && !json && !text.trim()) return {};
    const msg = json?.message || json?.feedback_message || (/^\s*</.test(text) ? `HTTP ${status}: got a web page instead of data (login/redirect?)` : text.slice(0, 200)) || `HTTP ${status}`;
    throw Object.assign(new Error(msg), { status, json });
  }

  const api = (IS.api = async (path, { method = 'GET', form, json } = {}) => {
    const headers = igHeaders({ accept: '*/*' });
    let body;
    if (form) { body = new URLSearchParams(form).toString(); headers['content-type'] = 'application/x-www-form-urlencoded'; }
    if (json) { body = JSON.stringify(json); headers['content-type'] = 'application/json'; }
    const r = await fetch(path, { method, body, headers, credentials: 'include' });
    return parseResponse(r.status, await r.text());
  });

  // Same request, but executed inside Instagram's page (see hook.js).
  let reqId = 0;
  IS.pageFetch = (path) => new Promise((resolve, reject) => {
    const id = ++reqId;
    const t = setTimeout(() => { window.removeEventListener('message', on); reject(new Error('page request timed out')); }, 15000);
    const on = (e) => {
      if (e.source !== window || e.data?.__is !== 'res' || e.data.id !== id) return;
      clearTimeout(t); window.removeEventListener('message', on);
      try { resolve(parseResponse(e.data.status, e.data.text)); } catch (err) { reject(err); }
    };
    window.addEventListener('message', on);
    window.postMessage({ __is: 'req', id, path, headers: igHeaders({ accept: '*/*' }) }, location.origin);
  });

  // Profile: try several endpoints, then fall back to what Instagram's own
  // page shows (nav avatar), so the avatar is never blank.
  IS.currentUser = async () => {
    const id = cookie('ds_user_id');
    let user = null;
    for (const path of ['/api/v1/accounts/current_user/?edit=true', id && `/api/v1/users/${id}/info/`]) {
      if (!path) continue;
      try { const r = await api(path); if (r.user?.username) { user = r.user; break; } } catch {}
    }
    if (user && !user.profile_pic_url) {
      try { user.profile_pic_url = (await api(`/api/v1/users/web_profile_info/?username=${user.username}`)).data?.user?.profile_pic_url; } catch {}
    }
    const domPic = () => {
      const imgs = [...document.querySelectorAll('nav img, [role="navigation"] img, a[href^="/"] img[alt]')];
      const byName = user && imgs.find((i) => i.closest(`a[href="/${user.username}/"]`));
      return (byName || imgs.find((i) => /profile/i.test(i.alt)))?.src || null;
    };
    user ||= { username: '', profile_pic_url: null };
    user.profile_pic_url ||= domPic();
    if (!user.username) {
      const a = [...document.querySelectorAll('a[href^="/"]')].find((x) => x.querySelector('img') && /profile/i.test(x.querySelector('img').alt));
      user.username = a?.getAttribute('href').replace(/\//g, '') || '';
    }
    IS.userPic = user.profile_pic_url || '';
    return user;
  };

  // Search: Instagram changes its web search endpoints often, so try several
  // and pull users / places / hashtags out of whatever shape comes back.
  function collect(json, out) {
    const seen = new Set();
    const walk = (o, depth = 0) => {
      if (!o || typeof o !== 'object' || depth > 8 || seen.has(o)) return;
      seen.add(o);
      if (Array.isArray(o)) { o.forEach((x) => walk(x, depth + 1)); return; }
      const id = o.pk ?? o.pk_id ?? o.id;
      if (typeof o.username === 'string' && id != null && !o.media_count_raw) out.users.set(String(id), { id: String(id), username: o.username, full_name: o.full_name || '', pic: o.profile_pic_url || '' });
      if (o.location && typeof o.location === 'object' && (o.location.pk ?? o.location.facebook_places_id) != null) {
        const l = o.location, lid = String(l.pk ?? l.facebook_places_id);
        out.places.set(lid, { id: lid, name: l.short_name || l.name || o.title, title: o.title || l.name, subtitle: o.subtitle || l.address || l.city || '' });
      }
      if (o.external_id && typeof o.name === 'string' && o.lat != null) {
        out.places.set(String(o.external_id), { id: String(o.external_id), name: o.name, title: o.name, subtitle: o.address || '' });
      }
      if (typeof o.name === 'string' && (o.media_count != null || o.formatted_media_count) && !o.username && !o.location) {
        out.tags.set(o.name.toLowerCase(), { name: o.name, count: o.media_count ?? null, label: o.formatted_media_count || o.search_result_subtitle || '' });
      }
      for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v, depth + 1);
    };
    walk(json);
  }

  IS.search = async (query, kind) => {
    const q = encodeURIComponent(query);
    const paths = {
      user: [`/api/v1/web/search/topsearch/?context=blended&query=${q}&include_reel=true`, `/api/v1/web/search/topsearch/?context=user&query=${q}&include_reel=true`,
        `/api/v1/users/search/?q=${q}&count=30`, `/web/search/topsearch/?context=blended&query=${q}&include_reel=true`,
        `/api/v1/fbsearch/web/top_serp/?enable_metadata=true&query=${q}`],
      place: [`/api/v1/web/search/topsearch/?context=place&query=${q}`, `/api/v1/fbsearch/places/?query=${q}`,
        `/api/v1/location_search/?search_query=${q}&latitude=0&longitude=0`, `/api/v1/web/search/topsearch/?context=blended&query=${q}`],
      hashtag: [`/api/v1/web/search/topsearch/?context=hashtag&query=${q}`, `/api/v1/tags/search/?q=${q}`,
        `/api/v1/web/search/topsearch/?context=blended&query=${q}`],
    }[kind].slice();
    // The URL Instagram's own search box used (recorded by hook.js) goes first.
    try {
      const learned = document.documentElement.dataset.isSearchUrl;
      if (learned) {
        const u = new URL(learned);
        for (const k of ['query', 'q']) if (u.searchParams.has(k)) u.searchParams.set(k, query);
        if (kind !== 'user' && u.searchParams.has('context')) u.searchParams.set('context', kind);
        if (u.origin === location.origin) paths.unshift(u.pathname + u.search);
      }
    } catch {}
    const out = { users: new Map(), places: new Map(), tags: new Map() };
    const want = { user: 'users', place: 'places', hashtag: 'tags' }[kind];
    const log = [];
    for (const p of paths) {
      for (const [how, run] of [['ext', api], ['page', IS.pageFetch]]) {
        try {
          const before = out[want].size;
          collect(await run(p), out);
          log.push({ path: p.split('?')[0], how, result: `ok, ${out[want].size - before} found` });
          break;
        } catch (e) {
          log.push({ path: p.split('?')[0], how, result: `${e.status || ''} ${e.message}`.trim().slice(0, 120) });
        }
      }
      if (out[want].size >= 3) break;
    }
    console.debug('[InstaStory] search', kind, query, log);
    return { users: [...out.users.values()], places: [...out.places.values()], tags: [...out.tags.values()], log };
  };

  const blobToDataUrl = (IS.blobToDataUrl = (blob) => new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => rej(fr.error);
    fr.readAsDataURL(blob);
  }));

  IS.rupload = async (kind, name, blob, params) => {
    const url = `https://i.instagram.com/rupload_ig${kind}/${name}`;
    const headers = {
      accept: '*/*', offset: '0',
      'x-entity-name': name,
      'x-entity-length': String(blob.size),
      'x-ig-app-id': IS.APP_ID,
      'x-instagram-rupload-params': JSON.stringify({ upload_id: name.split('_').pop(), ...params }),
    };
    try {
      const r = await fetch(url, { method: 'POST', body: blob, headers, credentials: 'include' });
      return parseResponse(r.status, await r.text());
    } catch (e) {
      if (e.status) throw e; // Instagram answered with an error
    }
    // Direct request blocked (CORS) -> upload from the extension background.
    const r = await chrome.runtime.sendMessage({ type: 'rupload', url, headers, dataUrl: await blobToDataUrl(blob) });
    return parseResponse(r.status, r.text);
  };

  IS.configureToStory = async (params) => {
    let last;
    for (let i = 0; i < 10; i++) {
      try { return await api('/api/v1/media/configure_to_story/', { method: 'POST', form: params }); } catch (e) {
        last = e;
        const transcoding = /transcode|not finished|processing/i.test(e.message) || e.status === 202;
        if (!transcoding && i >= 2) break;
        await IS.sleep(3000);
      }
    }
    throw last;
  };

  IS.validateLink = async (url) => {
    try { await api('/api/v1/media/validate_reel_url/', { method: 'POST', form: { url } }); } catch (e) {
      if (e.status && e.status < 500 && e.json?.status === 'fail') throw new Error(`Instagram rejected the link: ${e.message}`);
    }
  };

  /* ───────────────────────────── Fonts ───────────────────────────── */

  // Bundled fonts are fetched from the extension and registered with the
  // FontFace API from an ArrayBuffer, so Instagram's CSP doesn't block them.
  IS.FONTS = [
    { id: 'classic', name: 'Classic', family: null, weight: 800 },
    { id: 'modern', name: 'Modern', family: 'IS Bebas', file: 'BebasNeue-Regular.ttf', weight: 400 },
    { id: 'strong', name: 'Strong', family: 'IS Anton', file: 'Anton-Regular.ttf', weight: 400 },
    { id: 'script', name: 'Script', family: 'IS Pacifico', file: 'Pacifico-Regular.ttf', weight: 400 },
    { id: 'marker', name: 'Marker', family: 'IS Marker', file: 'PermanentMarker-Regular.ttf', weight: 400 },
    { id: 'typewriter', name: 'Typewriter', family: 'IS Courier', file: 'CourierPrime-Bold.ttf', weight: 700 },
    { id: 'editor', name: 'Editor', family: 'IS Playfair', file: 'PlayfairDisplay.ttf', weight: 800, range: '400 900' },
    { id: 'cairo', name: 'القاهرة Cairo', family: 'IS Cairo', file: 'Cairo.ttf', weight: 800, range: '200 1000' },
    { id: 'lalezar', name: 'لاله‌زار Lalezar', family: 'IS Lalezar', file: 'Lalezar-Regular.ttf', weight: 400 },
    { id: 'kufi', name: 'ريم كوفي Kufi', family: 'IS Kufi', file: 'ReemKufi.ttf', weight: 700, range: '400 700' },
    { id: 'ruqaa', name: 'رقعة Ruqaa', family: 'IS Ruqaa', file: 'ArefRuqaa-Bold.ttf', weight: 700 },
  ];
  const fontState = new Map(); // id -> 'loading' | 'ready' | 'error'
  IS.onFontLoaded = () => {};

  IS.fontById = (id) => IS.FONTS.find((f) => f.id === id) || IS.FONTS[0];

  async function registerFont(f, buffer) {
    const face = new FontFace(f.family, buffer, f.range ? { weight: f.range } : {});
    await face.load();
    document.fonts.add(face);
  }

  IS.ensureFont = (id) => {
    const f = IS.fontById(id);
    if (!f.family || fontState.get(f.id) === 'ready') return true;
    if (!fontState.has(f.id) && f.file) {
      fontState.set(f.id, 'loading');
      fetch(chrome.runtime.getURL('fonts/' + f.file))
        .then((r) => r.arrayBuffer())
        .then((b) => registerFont(f, b))
        .then(() => { fontState.set(f.id, 'ready'); IS.onFontLoaded(); })
        .catch(() => fontState.set(f.id, 'error'));
    }
    return false;
  };

  IS.fontCss = (id, size) => {
    const f = IS.fontById(id);
    IS.ensureFont(f.id);
    return `${f.weight} ${size}px ${f.family ? `"${f.family}", ` : ''}${IS.SYS_FONT}`;
  };

  // Fonts the user uploads (.ttf/.otf/.woff2) are kept in chrome.storage.
  IS.addCustomFont = async (file, persist = true) => {
    const name = file.name.replace(/\.(ttf|otf|woff2?|)$/i, '');
    const id = 'u:' + name;
    const f = { id, name, family: 'IS U ' + name, weight: 400, custom: true };
    await registerFont(f, await file.arrayBuffer());
    IS.FONTS = IS.FONTS.filter((x) => x.id !== id).concat(f);
    fontState.set(id, 'ready');
    if (persist) {
      const { customFonts = [] } = await chrome.storage.local.get('customFonts');
      const data = await blobToDataUrl(file);
      await chrome.storage.local.set({ customFonts: customFonts.filter((c) => c.name !== name).concat({ name, data }) });
    }
    return f;
  };

  IS.removeCustomFont = async (id) => {
    IS.FONTS = IS.FONTS.filter((x) => x.id !== id);
    const { customFonts = [] } = await chrome.storage.local.get('customFonts');
    await chrome.storage.local.set({ customFonts: customFonts.filter((c) => 'u:' + c.name !== id) });
  };

  IS.loadCustomFonts = async () => {
    try {
      const { customFonts = [] } = await chrome.storage.local.get('customFonts');
      for (const c of customFonts) {
        const blob = await (await fetch(c.data)).blob();
        await IS.addCustomFont(new File([blob], c.name), false).catch(() => {});
      }
    } catch {}
  };

  /* ─────────────── Saved default styles ("brand kit") ─────────────── */

  IS.defaults = {};
  IS.loadDefaults = async () => {
    try { IS.defaults = (await chrome.storage.local.get('defaults')).defaults || {}; } catch {}
  };
  IS.saveDefault = async (type, style) => {
    IS.defaults[type] = structuredClone(style);
    await chrome.storage.local.set({ defaults: IS.defaults });
  };
  IS.resetDefaults = async () => {
    IS.defaults = {};
    await chrome.storage.local.set({ defaults: {} });
  };
})();
