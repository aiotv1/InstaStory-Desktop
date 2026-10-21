// InstaStory Desktop — the story composer dialog injected into instagram.com.
// Instagram-styled (shadow root + Instagram's own --ig-* theme variables).
(() => {
  const IS = self.IS;
  if (!IS || IS.ui) return;
  IS.ui = true;
  const { W, H } = IS;

  const S = {
    open: false, user: null, busy: false,
    media: null,        // { kind:'photo', bmp, w, h } | { kind:'video', file, url, el, w, h, duration }
    fit: 'contain', bg: 'blur', bgColor: '#000000',
    stickers: [], sel: null,
    audience: 'all',
    section: null,
    tray: null,         // null | 'mention' | 'location' | 'hashtag' | 'link'
    music: null,       // { buffer, title, artist, cover, start, length, volume, videoVolume }
    musicResults: null,
    mode: 'auto',       // interactive sticker format, see IS.stickerParams
  };

  /* ───────────────────────────── drawing ───────────────────────────── */

  const tiny = document.createElement('canvas');
  tiny.width = 108; tiny.height = 192;
  const tctx = tiny.getContext('2d');

  const mediaSource = () => (S.media ? (S.media.kind === 'photo' ? S.media.bmp : S.media.el) : null);

  function drawFit(ctx, src, sw, sh, w, h, mode) {
    const s = mode === 'cover' ? Math.max(w / sw, h / sh) : Math.min(w / sw, h / sh);
    ctx.drawImage(src, (w - sw * s) / 2, (h - sh * s) / 2, sw * s, sh * s);
  }

  function drawBackground(ctx, src, sw, sh) {
    if (S.bg === 'blur' && src) {
      tctx.filter = 'blur(5px) brightness(0.75)';
      drawFit(tctx, src, sw, sh, tiny.width, tiny.height, 'cover');
      tctx.filter = 'none';
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(tiny, -20, -20, W + 40, H + 40);
    } else if (S.bg === 'gradient') {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#833ab4'); g.addColorStop(0.5, '#fd1d1d'); g.addColorStop(1, '#fcb045');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = S.bgColor;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawAll(ctx, { selection = false } = {}) {
    const src = mediaSource(), m = S.media;
    drawBackground(ctx, src, m?.w, m?.h);
    if (src) drawFit(ctx, src, m.w, m.h, W, H, S.fit);
    for (const s of S.stickers) {
      const L = IS.layout(ctx, s);
      s._w = L.w; s._h = L.h;
      ctx.save();
      ctx.translate(s.x * W, s.y * H);
      ctx.rotate((s.rot * Math.PI) / 180);
      ctx.scale(s.scale, s.scale);
      const drawn = s.burn !== false || !IS.INTERACTIVE.includes(s.type);
      if (drawn) L.draw(ctx);
      else if (selection) { ctx.globalAlpha = 0.45; L.draw(ctx); ctx.globalAlpha = 1; }
      if (selection && S.sel === s) {
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 4 / s.scale; ctx.setLineDash([14, 10]);
        ctx.strokeRect(-L.w / 2 - 12, -L.h / 2 - 12, L.w + 24, L.h + 24);
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
  }

  /* ───────────────────────────── DOM ───────────────────────────── */

  const host = document.createElement('div');
  host.id = 'instastory-root';
  const root = host.attachShadow({ mode: 'open' });

  const svg = (d, size = 22, fill = 'currentColor') => `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><path d="${d}" fill="${fill}"/></svg>`;
  const ICON = {
    media: '<svg viewBox="0 0 97.6 77.3" width="96" height="77"><path d="M16.3 24h.3c2.8-.2 4.9-2.6 4.8-5.4-.2-2.8-2.6-4.9-5.4-4.8s-4.9 2.6-4.8 5.4c.1 2.7 2.4 4.8 5.1 4.8zm-2.4-7.2c.5-.6 1.3-1 2.1-1h.2c1.7 0 3.1 1.4 3.1 3.1 0 1.7-1.4 3.1-3.1 3.1-1.7 0-3.1-1.4-3.1-3.1 0-.8.3-1.5.8-2.1z" fill="currentColor"/><path d="M84.7 18.4 58 16.9l-.2-3c-.3-5.7-5.2-10.1-11-9.8L12.9 6c-5.7.3-10.1 5.3-9.8 11L5 51v.8c.7 5.2 5.1 9.1 10.3 9.1h.6l21.7-1.2v.6c-.3 5.7 4 10.7 9.8 11l34 2h.6c5.5 0 10.1-4.3 10.4-9.8l2-34c.4-5.8-4-10.7-9.7-11.1zM7.2 10.8C8.7 9.1 10.8 8.1 13 8l34-1.9c4.6-.3 8.6 3.3 8.9 7.9l.2 2.8-5.3-.3c-5.7-.3-10.7 4-11 9.8l-.6 9.5-9.5 10.7c-.2.3-.6.4-1 .5-.4 0-.7-.1-1-.4l-7.8-7c-1.4-1.3-3.5-1.1-4.8.3L7 49 5.2 17c-.2-2.3.6-4.5 2-6.2zm8.7 48c-4.3.2-8.1-2.8-8.8-7.1l9.4-10.5c.2-.3.6-.4 1-.5.4 0 .7.1 1 .4l7.8 7c.7.6 1.6.9 2.5.9.9 0 1.7-.5 2.3-1.1l7.8-8.8-1.1 18.6-21.9 1.1zm76.5-29.5-2 34c-.3 4.6-4.3 8.2-8.9 7.9l-34-2c-4.6-.3-8.2-4.3-7.9-8.9l2-34c.3-4.4 3.9-7.9 8.4-7.9h.5l34 2c4.7.3 8.2 4.3 7.9 8.9z" fill="currentColor"/><path d="M78.2 41.6 61.3 30.5c-2.1-1.4-4.9-.8-6.2 1.3-.4.7-.7 1.4-.7 2.2l-1.2 20.1c-.1 2.5 1.7 4.6 4.2 4.8h.3c.7 0 1.4-.2 2-.5l18-9c2.2-1.1 3.1-3.8 2-6-.4-.7-.9-1.3-1.5-1.8zm-1.4 6-18 9c-.4.2-.8.3-1.3.3-.4 0-.9-.2-1.2-.4-.7-.5-1.2-1.3-1.1-2.2l1.2-20.1c.1-.9.6-1.7 1.4-2.1.8-.4 1.7-.3 2.5.1L77 43.3c1.2.8 1.5 2.3.7 3.4-.2.4-.5.7-.9.9z" fill="currentColor"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="24" height="24"><line fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="2.909" x2="22.001" y1="12.004" y2="12.004"/><polyline fill="none" points="9.276 4.726 2.001 12.004 9.276 19.274" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="18" height="18"><polyline fill="none" points="20.643 3.357 12 12 3.353 20.647" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/><line fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" x1="20.649" x2="3.354" y1="20.649" y2="3.354"/></svg>',
    chevron: svg('M21 17.502a.997.997 0 0 1-.707-.293L12 8.913l-8.293 8.296a1 1 0 1 1-1.414-1.414l9-9.004a1.03 1.03 0 0 1 1.414 0l9 9.004A1 1 0 0 1 21 17.502Z', 16),
    text: '<svg viewBox="0 0 24 24" width="22" height="22"><text x="12" y="17" text-anchor="middle" font-size="15" font-weight="700" font-family="Arial" fill="currentColor">Aa</text></svg>',
    sticker: svg('M12 2a10 10 0 1 0 10 10V11.6A9.6 9.6 0 0 0 12.4 2Zm8 10a8 8 0 0 1-.13 1.4A6.5 6.5 0 0 0 13.4 19.9 8 8 0 1 1 20 12Zm-6.5 7.7a4.5 4.5 0 0 1 6.2-6.2 8 8 0 0 1-6.2 6.2ZM8.5 11A1.5 1.5 0 1 0 7 9.5 1.5 1.5 0 0 0 8.5 11Zm7 0A1.5 1.5 0 1 0 14 9.5a1.5 1.5 0 0 0 1.5 1.5Z'),
    layout: '<svg viewBox="0 0 24 24" width="22" height="22"><rect x="6" y="2" width="12" height="20" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 15l4-4 3 3 2-2 3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    star: svg(IS.ICONS.star),
    music: svg('M12 3v10.55A4 4 0 1 0 14 17V7h4V3Z'),
    play: svg(IS.ICONS.play, 18),
    stop: svg('M6 6h12v12H6Z', 18),
    brush: svg('M20.7 3.3a1 1 0 0 0-1.4 0l-9 9 1.4 1.4 9-9a1 1 0 0 0 0-1.4ZM7 14a3 3 0 0 0-3 3c0 1.3-1.2 2-2 2 .9 1.2 2.5 2 4 2a4 4 0 0 0 4-4 3 3 0 0 0-3-3Z'),
    trash: svg('M19 6.5h-3.5v-1A2.5 2.5 0 0 0 13 3h-2a2.5 2.5 0 0 0-2.5 2.5v1H5a1 1 0 0 0 0 2h.6l.9 11A2.5 2.5 0 0 0 9 21.8h6a2.5 2.5 0 0 0 2.5-2.3l.9-11h.6a1 1 0 0 0 0-2Zm-8.5-1A.5.5 0 0 1 11 5h2a.5.5 0 0 1 .5.5v1h-3Zm5 13.9a.5.5 0 0 1-.5.4H9a.5.5 0 0 1-.5-.4l-.9-10.9h8.8Z', 20),
    copy: svg('M16 1H4a2 2 0 0 0-2 2v14h2V3h12Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11Z', 20),
    front: svg('M4 4h10v2H6v8H4Zm6 6h10v10H10Z', 20),
    check: '<svg viewBox="0 0 96 96" width="96" height="96"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".5" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><circle cx="48" cy="48" r="45" fill="none" stroke="url(#g)" stroke-width="3"/><path d="M30 49l12 12 24-26" fill="none" stroke="url(#g)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    story: '<svg aria-label="Story" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M12 1.5a10.5 10.5 0 0 1 3.5.6 1 1 0 0 1-.66 1.89A8.5 8.5 0 1 0 20.5 12a1 1 0 0 1 2 0A10.5 10.5 0 1 1 12 1.5Zm6.36 2.23a1 1 0 0 1 1.41.03 10.5 10.5 0 0 1 1.17 1.5 1 1 0 1 1-1.68 1.08 8.6 8.6 0 0 0-.94-1.2 1 1 0 0 1 .04-1.41ZM12 7a1 1 0 0 1 1 1v3h3a1 1 0 0 1 0 2h-3v3a1 1 0 0 1-2 0v-3H8a1 1 0 0 1 0-2h3V8a1 1 0 0 1 1-1Z"/></svg>',
  };

  const PALETTE = ['#ffffff', '#000000', '#262626', '#3797f0', '#70c050', '#fdcb5c', '#fd8d32', '#ed4956', '#d10869', '#a307ba', '#5eb1ff', '#ca2ee1'];
  const EMOJIS = '😍 😂 🔥 ❤️ 😎 🥳 🤩 😱 👏 🙏 💯 ✨ 🎉 💪 👀 😢 😡 🤔 🌹 ☕ 🍕 ⚽ 🎵 📍 🛍️ 💸 🚀 ⭐ 🌙 🇲🇦'.split(' ');

  root.innerHTML = `
<style>
  :host { all: initial; }
  * { box-sizing: border-box; }
  .ov { position: fixed; inset: 0; z-index: 2147483000; background: rgba(0,0,0,.65); display: none;
    align-items: center; justify-content: center;
    font-family: ${IS.SYS_FONT}; font-size: 14px; line-height: 18px;
    color: rgb(var(--ig-primary-text, 0,0,0));
    --bg: rgb(var(--ig-elevated-background, var(--ig-primary-background, 255,255,255)));
    --bg2: rgb(var(--ig-secondary-background, 250,250,250));
    --sep: rgb(var(--ig-elevated-separator, var(--ig-separator, 219,219,219)));
    --mut: rgb(var(--ig-secondary-text, 115,115,115));
    --blue: rgb(var(--ig-primary-button, 0,149,246));
    --hover: rgba(var(--ig-primary-text, 0,0,0), .05); }
  .ov.open { display: flex; animation: fade .15s ease-out; }
  @keyframes fade { from { opacity: 0 } }
  @keyframes pop { from { transform: scale(1.08); opacity: 0 } }
  .x { position: fixed; top: 12px; right: 16px; color: #fff; background: none; border: 0; padding: 8px; cursor: pointer; }
  .dlg { background: var(--bg); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column;
    animation: pop .2s ease-out; max-width: calc(100vw - 64px); max-height: calc(100vh - 40px); }
  .hd { height: 43px; flex: none; display: grid; grid-template-columns: 64px 1fr 64px; align-items: center; border-bottom: 1px solid var(--sep); }
  .hd h1 { margin: 0; font-size: 16px; font-weight: 600; text-align: center; }
  .hd button { background: none; border: 0; color: inherit; cursor: pointer; padding: 8px 12px; font: inherit; }
  .hd .share { color: var(--blue); font-weight: 600; justify-self: end; }
  .hd .share:disabled { opacity: .3; cursor: default; }
  .bd { display: flex; min-height: 0; }
  .empty { width: min(calc(100vh - 140px), 720px); height: min(calc(100vh - 140px), 720px); min-width: 348px; min-height: 348px;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; text-align: center; padding: 24px; }
  .empty.over { background: var(--hover); }
  .empty h2 { margin: 0; font-size: 20px; font-weight: 400; line-height: 25px; }
  .empty p { margin: 0; color: var(--mut); }
  .btn { background: var(--blue); color: #fff; border: 0; border-radius: 8px; padding: 7px 16px; font: inherit; font-weight: 600; cursor: pointer; }
  .btn:hover { filter: brightness(.92); }
  .btn.sec { background: rgb(var(--ig-secondary-button-background, 239,239,239)); color: inherit; }
  .btn.full { width: 100%; margin-top: 12px; }
  .editor { display: flex; }
  .stage { position: relative; background: #000; height: min(calc(100vh - 84px), 860px); aspect-ratio: 9/16; flex: none; touch-action: none; }
  .stage canvas { width: 100%; height: 100%; display: block; }
  .stage canvas.grab { cursor: grab; } .stage canvas.grabbing { cursor: grabbing; }
  .bin { position: absolute; left: 50%; bottom: 22px; transform: translateX(-50%); width: 52px; height: 52px; border-radius: 50%;
    border: 2px solid #fff; color: #fff; display: none; place-items: center; background: rgba(0,0,0,.3); transition: transform .12s, background .12s; }
  .bin.show { display: grid; } .bin.hot { transform: translateX(-50%) scale(1.25); background: #ed4956; border-color: #ed4956; }
  .hint { position: absolute; left: 0; right: 0; top: 10px; text-align: center; color: rgba(255,255,255,.85); font-size: 12px;
    text-shadow: 0 1px 3px rgba(0,0,0,.6); pointer-events: none; }
  .side { width: 360px; border-left: 1px solid var(--sep); display: flex; flex-direction: column; min-height: 0; }
  .me { display: flex; align-items: center; gap: 12px; padding: 16px 16px 12px; }
  .me img { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; background: var(--sep); }
  .me b { font-weight: 600; }
  .scroll { overflow-y: auto; flex: 1; border-top: 1px solid var(--sep); }
  .row { display: flex; align-items: center; gap: 12px; padding: 13px 16px; cursor: pointer; user-select: none; border-bottom: 1px solid var(--sep); }
  .row:hover { background: var(--hover); }
  .row .lbl { flex: 1; font-size: 16px; }
  .row .chev { transform: rotate(180deg); transition: transform .15s; display: flex; }
  .sec.open > .row .chev { transform: none; }
  .sec > .panel { display: none; padding: 4px 16px 16px; border-bottom: 1px solid var(--sep); }
  .sec.open > .panel { display: block; }
  .sec.open > .row { border-bottom: 0; }
  input[type=text], input[type=url], input[type=datetime-local], textarea, select { width: 100%; font: inherit; font-size: 14px; color: inherit; background: var(--bg2);
    border: 1px solid var(--sep); border-radius: 8px; padding: 9px 12px; outline: none; }
  input:focus, textarea:focus { border-color: var(--mut); }
  textarea { resize: vertical; min-height: 64px; }
  .results { margin-top: 8px; max-height: 280px; overflow-y: auto; }
  .res { display: flex; align-items: center; gap: 12px; padding: 8px 6px; border-radius: 8px; cursor: pointer; }
  .res:hover { background: var(--hover); }
  .res img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; background: var(--sep); flex: none; }
  .res .ic { width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--sep); display: grid; place-items: center; flex: none; }
  .res b { font-weight: 600; display: block; } .res small { color: var(--mut); font-size: 13px; }
  .muted { color: var(--mut); font-size: 13px; padding: 6px 2px; }
  .lab { color: var(--mut); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .02em; margin: 14px 0 6px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { border: 1px solid var(--sep); border-radius: 8px; padding: 6px 11px; cursor: pointer; background: none; color: inherit; font: inherit; font-size: 13px; }
  .chip.on { border-color: var(--blue); color: var(--blue); font-weight: 600; }
  .fonts .chip { font-size: 16px; padding: 6px 12px; }
  .colors { display: flex; gap: 7px; flex-wrap: wrap; align-items: center; }
  .colors button { width: 26px; height: 26px; border-radius: 50%; border: 2px solid var(--sep); cursor: pointer; padding: 0; }
  .colors button.on { outline: 2px solid var(--blue); outline-offset: 2px; }
  .colors .grad { background: linear-gradient(45deg, #feda75, #d62976, #4f5bd5); }
  .colors input[type=color] { width: 30px; height: 30px; border: 0; padding: 0; background: none; cursor: pointer; }
  .line { display: flex; gap: 10px; align-items: center; }
  .line input[type=range] { flex: 1; }
  .line small { color: var(--mut); min-width: 34px; text-align: right; }
  .icons { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; }
  .icons button { aspect-ratio: 1; border: 1px solid var(--sep); border-radius: 8px; background: none; color: inherit; cursor: pointer; display: grid; place-items: center; font-size: 18px; padding: 0; }
  .icons button.on { border-color: var(--blue); color: var(--blue); }
  .emojis { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; margin-top: 8px; }
  .emojis button { border: 0; background: none; font-size: 24px; cursor: pointer; border-radius: 8px; padding: 4px 0; }
  .emojis button:hover { background: var(--hover); }
  .tray { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; padding: 6px 0; }
  .tray button { border: 0; cursor: pointer; font: 800 13px/1 ${IS.SYS_FONT}; padding: 9px 12px; border-radius: 8px; background: #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,.18); display: inline-flex; align-items: center; gap: 5px; letter-spacing: .02em; }
  .tray button:hover { transform: scale(1.05); }
  .tray .g { background: linear-gradient(90deg, #fa7e1e, #d62976, #962fbf); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .tray .blue { color: #3797f0; }
  .tray .dark { background: #262626; color: #fff; }
  .tray .pur { background: linear-gradient(45deg, #ca2ee1, #5eb1ff); color: #fff; }
  .tray svg { flex: none; }
  .backlink { background: none; border: 0; color: var(--blue); font: inherit; font-weight: 600; cursor: pointer; padding: 4px 0 8px; }
  .edit { border-bottom: 1px solid var(--sep); padding: 12px 16px 16px; background: var(--bg2); }
  .edit .top { display: flex; align-items: center; gap: 4px; }
  .edit .top b { flex: 1; font-size: 15px; }
  .ib { background: none; border: 0; color: inherit; cursor: pointer; padding: 6px; border-radius: 8px; display: flex; }
  .ib:hover { background: var(--hover); }
  .ib.red { color: #ed4956; }
  .opts .line { margin-top: 6px; }
  .opts input[type=radio] { accent-color: var(--blue); }
  .aud { display: flex; align-items: center; gap: 12px; padding: 10px 4px; cursor: pointer; border-radius: 8px; }
  .aud:hover { background: var(--hover); }
  .aud .av { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; flex: none; color: #fff; }
  .aud .av.all { background: linear-gradient(45deg, #feda75, #d62976, #4f5bd5); }
  .aud .av.all img { width: 34px; height: 34px; border-radius: 50%; border: 2px solid var(--bg); object-fit: cover; }
  .aud .av.cf { background: #1cd14f; }
  .aud .t { flex: 1; } .aud small { color: var(--mut); display: block; }
  .radio { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--sep); flex: none; }
  .aud.on .radio { border: 6px solid var(--blue); }
  .foot { padding: 14px 16px; border-top: 1px solid var(--sep); display: flex; gap: 8px; }
  .foot .btn { flex: 1; padding: 10px; }
  .stickers { display: flex; flex-direction: column; gap: 2px; }
  .st { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 8px; cursor: pointer; }
  .st:hover, .st.on { background: var(--hover); }
  .st span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .state { width: min(calc(100vh - 140px), 560px); height: min(calc(100vh - 140px), 560px); min-width: 348px; min-height: 348px;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; text-align: center; padding: 24px; }
  .state h2 { margin: 0; font-size: 20px; font-weight: 400; }
  .state p { margin: 0; color: var(--mut); max-width: 380px; word-break: break-word; }
  .spin { width: 96px; height: 96px; border-radius: 50%;
    background: conic-gradient(#feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5, #feda75);
    -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px));
    mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px));
    animation: rot 1s linear infinite; }
  @keyframes rot { to { transform: rotate(1turn) } }
  .confirm { position: fixed; inset: 0; z-index: 2; display: none; place-items: center; background: rgba(0,0,0,.4); }
  .confirm.open { display: grid; }
  .confirm .box { width: 400px; background: var(--bg); border-radius: 12px; text-align: center; overflow: hidden; animation: pop .15s; }
  .confirm .box div { padding: 32px 32px 16px; } .confirm h3 { margin: 0 0 6px; font-size: 20px; font-weight: 400; }
  .confirm p { margin: 0 0 8px; color: var(--mut); }
  .confirm button { display: block; width: 100%; border: 0; border-top: 1px solid var(--sep); background: none; color: inherit;
    font: inherit; padding: 14px; cursor: pointer; min-height: 48px; }
  .confirm .red { color: #ed4956; font-weight: 700; }
  input[type=file] { display: none; }
</style>
<div class="ov">
  <button class="x" title="Close">${ICON.close}</button>
  <div class="dlg">
    <div class="hd"><button class="back" title="Back">${ICON.back}</button><h1>Create new story</h1><button class="share" disabled>Share</button></div>
    <div class="bd"></div>
  </div>
  <div class="confirm"><div class="box"><div><h3>Discard story?</h3><p>If you leave, your edits won't be saved.</p></div>
    <button class="red" data-c="discard">Discard</button><button data-c="cancel">Cancel</button></div></div>
  <input type="file" class="media" accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm">
  <input type="file" class="fontfile" accept=".ttf,.otf,.woff,.woff2">
  <input type="file" class="photofile" accept="image/*">
  <input type="file" class="audiofile" accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg">
</div>`;

  const $ = (sel, el = root) => el.querySelector(sel);
  const ov = $('.ov'), bd = $('.bd'), fileInput = $('input.media'), fontInput = $('input.fontfile'), photoInput = $('input.photofile'), audioInput = $('input.audiofile'), shareBtn = $('.share');
  const h = (tag, props = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'style') el.style.cssText = v;
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach((c) => c != null && c !== false && el.append(c));
    return el;
  };

  /* ── keyboard ── */

  const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.composedPath()[0]?.tagName);
  ['keydown', 'keyup', 'keypress'].forEach((t) => ov.addEventListener(t, (e) => {
    e.stopPropagation(); // keep Instagram's shortcuts out of the dialog
    if (t !== 'keydown') return;
    if (e.key === 'Escape') { e.preventDefault(); requestClose(); return; }
    if (!S.sel || typing(e)) return;
    const s = S.sel, step = e.shiftKey ? 0.02 : 0.004;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSticker(s); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicate(s); }
    else if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      if (e.key === 'ArrowLeft') s.x -= step; if (e.key === 'ArrowRight') s.x += step;
      if (e.key === 'ArrowUp') s.y -= step; if (e.key === 'ArrowDown') s.y += step;
      draw();
    }
  }));

  /* ───────────────────────────── screens ───────────────────────────── */

  let canvas, cctx, bin, raf = 0;

  function screenEmpty() {
    shareBtn.disabled = true;
    $('.back').style.visibility = 'hidden';
    const empty = h('div', { class: 'empty' },
      h('div', { html: ICON.media }),
      h('h2', {}, 'Drag photos and videos here'),
      h('button', { class: 'btn', onclick: () => fileInput.click() }, 'Select from computer'),
      h('p', {}, 'Or paste an image with Ctrl+V'));
    bd.replaceChildren(empty);
    const over = (on) => (e) => { e.preventDefault(); empty.classList.toggle('over', on); };
    empty.addEventListener('dragover', over(true));
    empty.addEventListener('dragleave', over(false));
    empty.addEventListener('drop', (e) => { over(false)(e); loadFile(e.dataTransfer.files[0]); });
  }

  function screenState({ spinner, icon, title, text, actions = [] }) {
    $('.back').style.visibility = 'hidden';
    shareBtn.disabled = true;
    bd.replaceChildren(h('div', { class: 'state' },
      spinner ? h('div', { class: 'spin' }) : icon ? h('div', { style: 'font-size:56px;line-height:96px' }, icon) : h('div', { html: ICON.check }),
      h('h2', {}, title),
      text ? h('p', {}, text) : null,
      actions.length ? h('div', { style: 'display:flex;gap:8px' }, actions) : null));
  }

  function screenEditor() {
    cancelAnimationFrame(raf);
    $('.back').style.visibility = 'visible';
    shareBtn.disabled = false;
    canvas = h('canvas', { width: 720, height: 1280 });
    cctx = canvas.getContext('2d');
    bin = h('div', { class: 'bin', html: ICON.trash });
    const stage = h('div', { class: 'stage' }, canvas, bin,
      h('div', { class: 'hint' }, 'Drag · scroll to resize · Shift+scroll to rotate · Del to delete'));
    stage.addEventListener('dragover', (e) => e.preventDefault());
    stage.addEventListener('drop', (e) => { e.preventDefault(); loadFile(e.dataTransfer.files[0]); });
    bindStage(canvas);

    const side = h('div', { class: 'side' },
      h('div', { class: 'me' }, h('img', { src: S.user?.profile_pic_url || '', alt: '', referrerpolicy: 'no-referrer' }), h('b', {}, S.user?.username || '')),
      h('div', { class: 'scroll' },
        h('div', { class: 'edit-wrap' }),
        h('div', { class: 'row', onclick: () => addSticker(IS.newSticker('text', { text: 'Tap to type' }), { focus: true }) },
          h('span', { html: ICON.text, style: 'display:flex' }), h('span', { class: 'lbl' }, 'Add text')),
        section('stickers', ICON.sticker, 'Stickers', panelTray),
        section('music', ICON.music, 'Music', panelMusic),
        section('layout', ICON.layout, 'Fit & background', panelLayout),
        section('audience', ICON.star, 'Share to', panelAudience),
        section('brand', ICON.brush, 'Brand kit · fonts & defaults', panelBrand),
        h('div', { class: 'list-wrap', style: 'padding:8px 12px' })),
      h('div', { class: 'foot' },
        h('button', { class: 'btn sec', onclick: () => fileInput.click() }, 'Replace'),
        h('button', { class: 'btn', onclick: publish }, 'Share to story')));

    bd.replaceChildren(h('div', { class: 'editor' }, stage, side));
    renderEdit();
    renderList();
    loop();
  }

  function section(key, icon, label, build) {
    const sec = h('div', { class: 'sec' + (S.section === key ? ' open' : ''), 'data-sec': key });
    const panel = h('div', { class: 'panel' });
    const row = h('div', { class: 'row', onclick: () => {
      const open = !sec.classList.contains('open');
      root.querySelectorAll('.sec.open').forEach((s) => s.classList.remove('open'));
      S.section = open ? key : null;
      if (open) { sec.classList.add('open'); panel.replaceChildren(build()); }
    } }, h('span', { html: icon, style: 'display:flex' }), h('span', { class: 'lbl' }, label), h('span', { class: 'chev', html: ICON.chevron }));
    if (S.section === key) panel.replaceChildren(build());
    sec.append(row, panel);
    return sec;
  }

  function refreshSection(key) {
    const sec = root.querySelector(`.sec[data-sec="${key}"]`);
    if (sec?.classList.contains('open')) sec.querySelector('.panel').replaceChildren({ stickers: panelTray, music: panelMusic, layout: panelLayout, audience: panelAudience, brand: panelBrand }[key]());
  }

  /* ───────────────────────────── controls ───────────────────────────── */

  const lab = (t) => h('div', { class: 'lab' }, t);

  function chips(options, value, onChange, cls = '') {
    const wrap = h('div', { class: 'chips ' + cls });
    for (const o of options) {
      const [v, label, style] = Array.isArray(o) ? o : [o, o];
      wrap.append(h('button', { class: 'chip' + (v === value ? ' on' : ''), style, onclick: (e) => {
        wrap.querySelectorAll('.chip').forEach((b) => b.classList.toggle('on', b === e.currentTarget));
        onChange(v);
      } }, label));
    }
    return wrap;
  }

  function colorPicker(value, onChange, { gradient = false } = {}) {
    const wrap = h('div', { class: 'colors' });
    const mark = (el) => wrap.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === el));
    if (gradient) wrap.append(h('button', { class: 'grad' + (value === 'gradient' ? ' on' : ''), title: 'Instagram gradient', onclick: (e) => { mark(e.currentTarget); onChange('gradient'); } }));
    for (const c of PALETTE) wrap.append(h('button', { class: c === value ? 'on' : '', style: `background:${c}`, title: c, onclick: (e) => { mark(e.currentTarget); onChange(c); } }));
    const custom = h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff', title: 'Custom colour' });
    custom.addEventListener('input', () => { mark(null); onChange(custom.value); });
    wrap.append(custom);
    return wrap;
  }

  function range(min, max, step, value, onChange, fmt = (v) => v) {
    const r = h('input', { type: 'range', min, max, step, value });
    const out = h('small', {}, fmt(value));
    r.addEventListener('input', () => { out.textContent = fmt(+r.value); onChange(+r.value); });
    return h('div', { class: 'line' }, r, out);
  }

  function fontPicker(value, onChange) {
    IS.FONTS.forEach((f) => IS.ensureFont(f.id));
    return chips(IS.FONTS.map((f) => [f.id, f.name, `font-family:${f.family ? `"${f.family}",` : ''}${IS.SYS_FONT};font-weight:${f.weight}`]), value, onChange, 'fonts');
  }

  function iconPicker(value, onChange) {
    const wrap = h('div', { class: 'icons' });
    const mark = (el) => wrap.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === el));
    wrap.append(h('button', { class: value === 'none' ? 'on' : '', title: 'No icon', onclick: (e) => { mark(e.currentTarget); onChange('none'); } }, '∅'));
    for (const k of Object.keys(IS.ICONS)) wrap.append(h('button', { class: value === k ? 'on' : '', title: k, html: svg(IS.ICONS[k], 18), onclick: (e) => { mark(e.currentTarget); onChange(k); } }));
    const emoji = h('input', { type: 'text', placeholder: 'or type an emoji 😀', value: value?.startsWith('emoji:') ? value.slice(6) : '', style: 'margin-top:8px' });
    emoji.addEventListener('input', () => { const v = emoji.value.trim(); if (v) { mark(null); onChange('emoji:' + v); } });
    return h('div', {}, wrap, emoji);
  }

  const input = (value, onInput, props = {}) => {
    const el = h(props.multiline ? 'textarea' : 'input', { type: props.type || 'text', placeholder: props.placeholder, value });
    el.addEventListener('input', () => onInput(el.value));
    return el;
  };

  /* ───────────────────────────── sticker editor ───────────────────────────── */

  function renderEdit() {
    const wrap = root.querySelector('.edit-wrap');
    if (!wrap) return;
    const s = S.sel;
    if (!s) { wrap.replaceChildren(); return; }
    const st = s.st, T = IS.TYPES[s.type];
    const ch = (fn) => (v) => { fn(v); draw(); renderList(); };

    const top = h('div', { class: 'top' },
      h('b', {}, `Edit · ${T.name}`),
      h('button', { class: 'ib', title: 'Duplicate (Ctrl+D)', html: ICON.copy, onclick: () => duplicate(s) }),
      h('button', { class: 'ib', title: 'Bring to front', html: ICON.front, onclick: () => { S.stickers = S.stickers.filter((x) => x !== s).concat(s); draw(); renderList(); } }),
      h('button', { class: 'ib red', title: 'Delete (Del)', html: ICON.trash, onclick: () => removeSticker(s) }));
    const body = [];

    // ── content ──
    if (s.type === 'text') body.push(lab('Text'), input(s.text, ch((v) => (s.text = v)), { multiline: true, placeholder: 'Type something…' }));
    if (s.type === 'link') body.push(lab('URL'), input(s.url, ch((v) => (s.url = /^https?:\/\//i.test(v) ? v : 'https://' + v)), { type: 'url' }),
      lab('Sticker text'), input(s.label, ch((v) => (s.label = v)), { placeholder: 'e.g. SHOP NOW' }));
    if (s.type === 'location') body.push(lab('Sticker text'), input(s.name, ch((v) => (s.name = v))));
    if (s.type === 'emoji') body.push(lab('Emoji'), input(s.emoji, ch((v) => (s.emoji = v || '😍'))),
      h('div', { class: 'emojis' }, EMOJIS.map((e) => h('button', { onclick: () => { s.emoji = e; draw(); renderList(); } }, e))));
    if (['poll', 'question', 'quiz', 'slider'].includes(s.type)) body.push(lab('Question'), input(s.question, ch((v) => (s.question = v)), { multiline: true }));
    if (s.type === 'poll' || s.type === 'quiz') {
      const opts = h('div', { class: 'opts' });
      const build = () => opts.replaceChildren(...s.options.map((o, i) => h('div', { class: 'line' },
        s.type === 'quiz' ? h('input', { type: 'radio', name: 'correct', title: 'Correct answer', checked: s.correct === i, onchange: () => { s.correct = i; } }) : null,
        input(o, ch((v) => (s.options[i] = v)), { placeholder: `Option ${i + 1}` }),
        s.options.length > 2 ? h('button', { class: 'ib', html: ICON.trash, onclick: () => { s.options.splice(i, 1); s.correct = Math.min(s.correct, s.options.length - 1); build(); draw(); } }) : null)),
        s.options.length < 4 ? h('button', { class: 'backlink', onclick: () => { s.options.push(''); build(); draw(); } }, '+ Add option') : null);
      build();
      body.push(lab(s.type === 'quiz' ? 'Options (select the correct one)' : 'Options'), opts);
    }
    if (s.type === 'slider') body.push(lab('Slider emoji'), input(s.emoji, ch((v) => (s.emoji = v || '😍'))),
      h('div', { class: 'emojis' }, EMOJIS.slice(0, 16).map((e) => h('button', { onclick: () => { s.emoji = e; draw(); } }, e))));
    if (s.type === 'countdown') {
      const local = new Date(s.end - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
      body.push(lab('Title'), input(s.title, ch((v) => (s.title = v))),
        lab('Ends at'), input(local, ch((v) => { const t = new Date(v).getTime(); if (t) s.end = t; }), { type: 'datetime-local' }));
    }

    // ── style ──
    if (s.type !== 'emoji' && s.type !== 'photo') {
      body.push(lab('Font'), fontPicker(st.font, ch((v) => (st.font = v))));
    }
    if (s.type === 'text') {
      body.push(lab('Style'), chips([['plain', 'Shadow'], ['box', 'Box'], ['soft', 'Soft box'], ['neon', 'Neon'], ['outline', 'Outline'], ['none', 'No shadow']], st.style, ch((v) => (st.style = v))),
        lab('Colour'), colorPicker(st.color, ch((v) => (st.color = v))),
        lab('Align'), chips([['left', 'Left'], ['center', 'Center'], ['right', 'Right']], st.align, ch((v) => (st.align = v))),
        lab('Size'), range(30, 240, 2, st.size, ch((v) => (st.size = v))));
    }
    if (T.pill) {
      body.push(lab('Style'), chips([['white', 'White'], ['color', 'Colour'], ['dark', 'Dark'], ['glass', 'Glass'], ['outline', 'Outline']], st.preset, (v) => {
        Object.assign(st, { preset: v }, IS.PILL_PRESETS[v](s.type)); draw(); renderEdit();
      }),
      lab('Background'), colorPicker(st.bg, ch((v) => (st.bg = v))),
      lab('Background opacity'), range(0, 1, 0.05, st.bgAlpha, ch((v) => (st.bgAlpha = v)), (v) => Math.round(v * 100) + '%'),
      lab('Text & icon colour'), colorPicker(st.fg, ch((v) => (st.fg = v)), { gradient: true }),
      lab('Icon'), iconPicker(st.icon, ch((v) => (st.icon = v))),
      lab('Corners'), range(0, 60, 1, st.radius, ch((v) => (st.radius = v))),
      lab('Text size'), range(30, 110, 1, st.size, ch((v) => (st.size = v))),
      h('label', { class: 'line', style: 'margin-top:12px;cursor:pointer' },
        h('input', { type: 'checkbox', checked: st.upper, onchange: (e) => { st.upper = e.target.checked; draw(); renderList(); } }), 'UPPERCASE'),
      h('label', { class: 'line', style: 'margin-top:6px;cursor:pointer' },
        h('input', { type: 'checkbox', checked: st.outline, onchange: (e) => { st.outline = e.target.checked; draw(); } }), 'Border'));
    }
    if (s.type === 'emoji') body.push(lab('Size'), range(80, 600, 5, st.size, ch((v) => (st.size = v))));
    if (s.type === 'music') body.push(lab('Look'), chips([['white', 'White'], ['dark', 'Dark'], ['glass', 'Glass'], ['text', 'Text only']], st.look, ch((v) => (st.look = v))),
      lab('Corners'), range(0, 80, 1, st.radius, ch((v) => (st.radius = v))));
    if (s.type === 'photo') body.push(lab('Corners'), range(0, 120, 1, st.radius, ch((v) => (st.radius = v))),
      h('label', { class: 'line', style: 'margin-top:12px;cursor:pointer' }, h('input', { type: 'checkbox', checked: st.border, onchange: (e) => { st.border = e.target.checked; draw(); } }), 'Frame'),
      lab('Frame colour'), colorPicker(st.borderColor, ch((v) => (st.borderColor = v))),
      h('label', { class: 'line', style: 'margin-top:12px;cursor:pointer' }, h('input', { type: 'checkbox', checked: st.shadow, onchange: (e) => { st.shadow = e.target.checked; draw(); } }), 'Shadow'));
    if (IS.INTERACTIVE.includes(s.type)) body.push(
      h('label', { class: 'line', style: 'margin-top:14px;cursor:pointer' },
        h('input', { type: 'checkbox', checked: s.burn !== false, onchange: (e) => { s.burn = e.target.checked; draw(); } }), 'Draw this design on the image'),
      h('div', { class: 'muted' }, 'If Instagram shows its own sticker on top (double), turn this off.'));
    if (['poll', 'question', 'quiz', 'slider', 'countdown'].includes(s.type)) {
      body.push(lab(s.type === 'countdown' ? 'Background (start)' : 'Card colour'), colorPicker(st.bg, ch((v) => (st.bg = v))));
      if (s.type === 'countdown') body.push(lab('Background (end)'), colorPicker(st.bg2, ch((v) => (st.bg2 = v))));
      body.push(lab('Text colour'), colorPicker(st.fg, ch((v) => (st.fg = v))),
        lab(s.type === 'quiz' ? 'Header colour' : s.type === 'countdown' ? 'Digit colour' : 'Accent colour'), colorPicker(st.accent, ch((v) => (st.accent = v)), { gradient: true }),
        lab('Corners'), range(0, 80, 1, st.radius, ch((v) => (st.radius = v))));
    }
    body.push(lab('Scale & rotation'),
      range(0.2, 4, 0.05, s.scale, ch((v) => (s.scale = v)), (v) => Math.round(v * 100) + '%'),
      range(-180, 180, 1, s.rot > 180 ? s.rot - 360 : s.rot, ch((v) => (s.rot = (v + 360) % 360)), (v) => v + '°'));
    body.push(h('div', { style: 'display:flex;gap:8px;margin-top:14px' },
      h('button', { class: 'btn sec', style: 'flex:1', onclick: async (e) => { await IS.saveDefault(s.type, st); e.target.textContent = 'Saved ✓'; } }, 'Save as default'),
      h('button', { class: 'btn sec', style: 'flex:1', onclick: () => { s.st = { ...IS.TYPES[s.type].defaults(), ...(IS.defaults[s.type] || {}) }; draw(); renderEdit(); } }, 'Reset style')));

    wrap.replaceChildren(h('div', { class: 'edit' }, top, ...body));
  }

  /* ───────────────────────────── panels ───────────────────────────── */

  function panelTray() {
    if (S.tray === 'link') return panelLink();
    if (S.tray) return panelSearch(S.tray);
    const open = (t) => () => { S.tray = t; refreshSection('stickers'); root.querySelector('.sec.open input')?.focus(); };
    const add = (t) => () => addSticker(IS.newSticker(t));
    const ic = (k, color) => svg(IS.ICONS[k], 15, color);
    return h('div', { class: 'tray' },
      h('button', { onclick: open('location'), html: `${ic('pin', '#d62976')}<span class="g">LOCATION</span>` }),
      h('button', { onclick: open('mention'), html: '<span class="g">@MENTION</span>' }),
      h('button', { onclick: open('hashtag'), html: '<span class="g">#HASHTAG</span>' }),
      h('button', { onclick: open('link'), html: `${ic('link', '#3797f0')}<span class="blue">LINK</span>` }),
      h('button', { onclick: add('poll'), html: '<span class="g">POLL</span>' }),
      h('button', { onclick: add('question'), html: '<span class="g">QUESTIONS</span>' }),
      h('button', { class: 'dark', onclick: add('quiz') }, 'QUIZ'),
      h('button', { onclick: add('slider'), html: '😍 <span class="g">SLIDER</span>' }),
      h('button', { class: 'pur', onclick: add('countdown'), html: `${ic('calendar', '#fff')} COUNTDOWN` }),
      h('button', { onclick: add('emoji') }, '😀 EMOJI'),
      h('button', { onclick: () => photoInput.click(), html: `<svg viewBox="0 0 24 24" width="15" height="15"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 16H5l3.5-4.5 2.5 3 3.5-4.5L19 19Z" fill="#16a34a"/></svg><span style="color:#16a34a">PHOTO</span>` }));
  }

  function backToTray() { S.tray = null; refreshSection('stickers'); }

  function panelSearch(kind) {
    const placeholder = { mention: 'Search people', location: 'Search places', hashtag: 'Search hashtags' }[kind];
    const inp = h('input', { type: 'text', placeholder });
    const results = h('div', { class: 'results' });
    let t = 0, seq = 0;
    inp.addEventListener('input', () => {
      clearTimeout(t);
      const q = inp.value.trim().replace(/^[@#]/, '');
      if (!q) { results.replaceChildren(); return; }
      t = setTimeout(async () => {
        const my = ++seq;
        results.replaceChildren(h('div', { class: 'muted' }, 'Searching…'));
        const data = await IS.search(q, kind === 'mention' ? 'user' : kind === 'location' ? 'place' : 'hashtag');
        if (my !== seq) return;
        const pick = (sticker) => { addSticker(sticker); backToTray(); };
        const items = [];
        if (kind === 'mention') for (const u of data.users) items.push(h('div', { class: 'res', onclick: () =>
          pick(IS.newSticker('mention', { userId: u.id, username: u.username })) },
        h('img', { src: u.pic, alt: '', referrerpolicy: 'no-referrer' }), h('div', {}, h('b', {}, u.username), h('small', {}, u.full_name))));
        if (kind === 'location') for (const l of data.places) items.push(h('div', { class: 'res', onclick: () =>
          pick(IS.newSticker('location', { locationId: l.id, name: l.name })) },
        h('div', { class: 'ic', html: svg(IS.ICONS.pin) }), h('div', {}, h('b', {}, l.title), h('small', {}, l.subtitle))));
        if (kind === 'hashtag') {
          const tags = data.tags.slice();
          if (!tags.some((x) => x.name.toLowerCase() === q.toLowerCase())) tags.unshift({ name: q.replace(/\s+/g, ''), count: null });
          for (const x of tags) items.push(h('div', { class: 'res', onclick: () => pick(IS.newSticker('hashtag', { tag: x.name })) },
            h('div', { class: 'ic', html: svg(IS.ICONS.hash) }), h('div', {}, h('b', {}, '#' + x.name),
              h('small', {}, x.label || (x.count != null ? `${x.count.toLocaleString()} posts` : 'Use this hashtag')))));
        }
        if (!items.length && kind === 'mention' && /^[\w.]{1,30}$/.test(q)) {
          // search unavailable: still allow mentioning by exact username
          items.push(h('div', { class: 'res', onclick: async () => {
            try {
              const r = await IS.api(`/api/v1/users/web_profile_info/?username=${encodeURIComponent(q)}`);
              const u = r.data?.user;
              if (!u) throw new Error('not found');
              pick(IS.newSticker('mention', { userId: String(u.id), username: u.username }));
            } catch { results.replaceChildren(h('div', { class: 'muted' }, `@${q} was not found.`)); }
          } }, h('div', { class: 'ic', html: svg(IS.ICONS.at) }), h('div', {}, h('b', {}, '@' + q), h('small', {}, 'Mention this exact username'))));
        }
        if (items.length <= 1 && data.log?.length) items.push(h('details', { class: 'muted', style: 'margin-top:8px' },
          h('summary', { style: 'cursor:pointer' }, 'No results — details (send a screenshot of this)'),
          h('div', { style: 'font:11px/1.4 ui-monospace,Consolas,monospace;direction:ltr;text-align:left;margin-top:6px;word-break:break-all' },
            data.log.map((l) => h('div', {}, `${l.how} ${l.path} → ${l.result}`)))));
        results.replaceChildren(...(items.length ? items : [h('div', { class: 'muted' }, 'No results found.')]));
      }, 250);
    });
    return h('div', {}, h('button', { class: 'backlink', onclick: backToTray }, '‹ All stickers'), inp, results);
  }

  function panelLink() {
    const url = h('input', { type: 'url', placeholder: 'https://example.com' });
    const label = h('input', { type: 'text', placeholder: 'Sticker text (optional) — e.g. SHOP NOW', style: 'margin-top:8px' });
    const err = h('div', { class: 'muted', style: 'color:#ed4956;display:none' });
    const add = h('button', { class: 'btn full', onclick: () => {
      let u = url.value.trim();
      if (!u) return url.focus();
      if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
      try { new URL(u); } catch { err.textContent = 'Enter a valid URL.'; err.style.display = 'block'; return; }
      if (S.stickers.some((s) => s.type === 'link')) { err.textContent = 'Instagram allows one link sticker per story.'; err.style.display = 'block'; return; }
      addSticker(IS.newSticker('link', { url: u, label: label.value.trim() || new URL(u).hostname.replace(/^www\./, '') }));
      backToTray();
    } }, 'Add link sticker');
    url.addEventListener('keydown', (e) => e.key === 'Enter' && add.click());
    return h('div', {}, h('button', { class: 'backlink', onclick: backToTray }, '‹ All stickers'), url, label, err, add);
  }

  function fmtTime(t) { t = Math.max(0, Math.round(t)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; }

  function storyLength() {
    return S.media?.kind === 'video' ? Math.min(S.media.duration, IS.MAX_VIDEO_SEC) : S.music?.length || 15;
  }

  async function chooseTrack(loader) {
    const panel = root.querySelector('.sec[data-sec="music"] .panel');
    panel?.replaceChildren(h('div', { class: 'muted' }, 'Loading music…'));
    try {
      const t = await loader();
      IS.Music.stopPreview();
      const isVideo = S.media?.kind === 'video';
      S.music = { ...t, length: Math.min(15, t.buffer.duration), volume: 1, videoVolume: isVideo ? 0.3 : 0 };
      S.music.start = Math.min(S.music.start, Math.max(0, t.buffer.duration - storyLength()));
      if (!S.stickers.some((x) => x.type === 'music')) addSticker(IS.newSticker('music', { title: t.title, artist: t.artist, cover: t.cover }));
      else S.stickers.filter((x) => x.type === 'music').forEach((x) => Object.assign(x, { title: t.title, artist: t.artist, cover: t.cover }));
    } catch (e) {
      alert('Could not load this music: ' + e.message);
    }
    refreshSection('music'); draw(); renderList();
  }

  function panelMusic() {
    const mu = S.music, wrap = h('div');
    if (mu) {
      const thumb = h('canvas', { width: 88, height: 88, style: 'width:44px;height:44px;border-radius:6px;flex:none;background:linear-gradient(45deg,#feda75,#d62976,#4f5bd5)' });
      if (mu.cover) thumb.getContext('2d').drawImage(mu.cover, 0, 0, 88, 88);
      const playBtn = h('button', { class: 'ib', title: 'Preview', html: ICON.play });
      const setPlay = (on) => { playBtn.innerHTML = on ? ICON.stop : ICON.play; };
      playBtn.onclick = () => {
        if (IS.Music.isPlaying()) { IS.Music.stopPreview(); setPlay(false); return; }
        IS.Music.preview(mu, storyLength(), () => setPlay(false)); setPlay(true);
      };
      const dur = mu.buffer.duration, isVideo = S.media?.kind === 'video';
      const startOut = h('small', { style: 'min-width:80px' });
      const startRange = h('input', { type: 'range', min: 0, max: Math.max(0, dur - storyLength()), step: 0.1, value: mu.start, style: 'flex:1' });
      const showStart = () => { startOut.textContent = `${fmtTime(mu.start)} – ${fmtTime(mu.start + storyLength())}`; };
      startRange.addEventListener('input', () => { mu.start = +startRange.value; showStart(); });
      startRange.addEventListener('change', () => { if (IS.Music.isPlaying()) { IS.Music.preview(mu, storyLength(), () => setPlay(false)); setPlay(true); } });
      showStart();
      wrap.append(...[
        h('div', { class: 'res', style: 'cursor:default' }, thumb,
          h('div', { style: 'flex:1;min-width:0' }, h('b', { style: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }, mu.title), h('small', {}, `${mu.artist || 'Audio'} · ${fmtTime(dur)}`)),
          playBtn,
          h('button', { class: 'ib red', title: 'Remove music', html: ICON.trash, onclick: () => {
            IS.Music.stopPreview(); S.music = null;
            S.stickers.filter((x) => x.type === 'music').forEach(removeSticker);
            refreshSection('music');
          } })),
        lab('Part of the song'), h('div', { class: 'line' }, startRange, startOut),
        !isVideo ? h('div', {}, lab('Story length'), range(3, Math.min(IS.MAX_VIDEO_SEC, Math.floor(dur)), 1, Math.round(mu.length), (v) => {
          mu.length = v; startRange.max = Math.max(0, dur - v); if (mu.start > +startRange.max) { mu.start = +startRange.max; startRange.value = mu.start; } showStart();
        }, (v) => v + 's')) : null,
        lab('Music volume'), range(0, 1, 0.05, mu.volume, (v) => (mu.volume = v), (v) => Math.round(v * 100) + '%'),
        isVideo ? h('div', {}, lab('Original video sound'), range(0, 1, 0.05, mu.videoVolume, (v) => (mu.videoVolume = v), (v) => Math.round(v * 100) + '%')) : null,
        !S.stickers.some((x) => x.type === 'music') ? h('button', { class: 'btn sec full', onclick: () => addSticker(IS.newSticker('music', { title: mu.title, artist: mu.artist, cover: mu.cover })) }, '+ Add music sticker') : null,
        h('div', { class: 'muted', style: 'margin-top:8px' }, isVideo ? 'The music is mixed into your video.' : 'Your photo will be shared as a video with this music.'),
        lab('Change music')].filter(Boolean));
    }
    const inp = h('input', { type: 'text', placeholder: 'Search Instagram music' });
    const results = h('div', { class: 'results' });
    const show = (data, label) => {
      const rows = data.tracks.map((t) => h('div', { class: 'res', onclick: () => chooseTrack(() => IS.Music.loadTrack(t)) },
        t.cover ? h('img', { src: t.cover, alt: '', referrerpolicy: 'no-referrer', style: 'border-radius:6px' }) : h('div', { class: 'ic', html: ICON.music }),
        h('div', { style: 'flex:1;min-width:0' }, h('b', {}, t.title), h('small', {}, [t.artist, t.duration ? fmtTime(t.duration) : ''].filter(Boolean).join(' · ')))));
      results.replaceChildren(label ? lab(label) : '', ...rows);
      if (!rows.length) results.append(h('div', { class: 'muted' }, 'Instagram music search is not available from the web right now. Upload an audio file instead.'),
        h('details', { class: 'muted' }, h('summary', { style: 'cursor:pointer' }, 'details'),
          h('div', { style: 'font:11px/1.4 ui-monospace,Consolas,monospace;direction:ltr;text-align:left;word-break:break-all' }, data.log.map((l) => h('div', {}, `${l.how} ${l.path} → ${l.result}`)))));
    };
    let t = 0, seq = 0;
    const run = async (q) => {
      const my = ++seq;
      results.replaceChildren(h('div', { class: 'muted' }, q ? 'Searching…' : 'Loading trending…'));
      const data = await IS.Music.searchIG(q);
      if (my !== seq) return;
      if (!q) S.musicResults = data;
      show(data, q ? '' : 'Trending');
    };
    inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => run(inp.value.trim()), 350); });
    if (S.musicResults) show(S.musicResults, 'Trending'); else setTimeout(() => run(''), 0);
    wrap.append(inp, h('button', { class: 'btn sec full', onclick: () => audioInput.click() }, '⬆ Upload audio file (MP3, M4A, WAV)'), results);
    return wrap;
  }

  function panelLayout() {
    const isPhoto = S.media?.kind === 'photo';
    return h('div', {},
      lab('Fit'), chips([['contain', 'Fit (whole media)'], ['cover', 'Fill screen']], S.fit, (v) => { S.fit = v; draw(); }),
      lab('Background'), chips([['blur', 'Blur'], ['solid', 'Colour'], ['gradient', 'Gradient']], S.bg === 'blur' || S.bg === 'gradient' ? S.bg : 'solid', (v) => { S.bg = v; draw(); refreshSection('layout'); }),
      S.bg === 'solid' ? h('div', { style: 'margin-top:10px' }, colorPicker(S.bgColor, (v) => { S.bgColor = v; draw(); })) : null,
      !isPhoto ? h('div', { class: 'muted', style: 'margin-top:10px' }, 'Videos with stickers or a custom background are re-rendered in real time before upload.') : null);
  }

  function panelAudience() {
    const opt = (key, av, title, sub) => h('div', { class: 'aud' + (S.audience === key ? ' on' : ''), onclick: (e) => {
      S.audience = key;
      e.currentTarget.parentNode.querySelectorAll('.aud').forEach((a) => a.classList.toggle('on', a === e.currentTarget));
    } }, av, h('div', { class: 't' }, title, h('small', {}, sub)), h('div', { class: 'radio' }));
    return h('div', {},
      opt('all', h('div', { class: 'av all' }, h('img', { src: S.user?.profile_pic_url || '', alt: '', referrerpolicy: 'no-referrer' })), 'Your story', 'Everyone who follows you'),
      opt('besties', h('div', { class: 'av cf', html: svg(IS.ICONS.star, 22, '#fff') }), 'Close Friends', 'Only people on your Close Friends list'));
  }

  function panelBrand() {
    const custom = IS.FONTS.filter((f) => f.custom);
    const saved = Object.keys(IS.defaults);
    return h('div', {},
      lab('Your fonts'),
      custom.length ? h('div', { class: 'stickers' }, custom.map((f) => h('div', { class: 'st' },
        h('span', { style: `font-family:"${f.family}";font-size:17px` }, f.name),
        h('button', { class: 'ib', html: ICON.trash, onclick: async () => { await IS.removeCustomFont(f.id); refreshSection('brand'); renderEdit(); } })))) :
        h('div', { class: 'muted' }, 'Upload any .ttf / .otf font — it will be available for all stickers and saved for next time.'),
      h('button', { class: 'btn sec full', onclick: () => fontInput.click() }, '+ Upload font'),
      lab('Default styles'),
      h('div', { class: 'muted' }, saved.length ? `Saved for: ${saved.map((t) => IS.TYPES[t]?.name || t).join(', ')}` :
        'Select a sticker, style it, then press "Save as default" — new stickers of that type will use your style.'),
      saved.length ? h('button', { class: 'btn sec full', onclick: async () => { await IS.resetDefaults(); refreshSection('brand'); } }, 'Reset all default styles') : null,
      lab('Interactive sticker format'),
      chips([['auto', 'Auto (recommended)'], ['legacy', 'Old format only'], ['modern', 'New format only']], S.mode, (v) => { S.mode = v; chrome.storage.local.set({ stickerFormat: v }); }),
      h('div', { class: 'muted' }, 'Auto sends every sticker in both formats Instagram understands. Only change this if a sticker is not interactive.'));
  }

  photoInput.addEventListener('change', async () => {
    const f = photoInput.files[0];
    photoInput.value = '';
    if (!f) return;
    try { addSticker(IS.newSticker('photo', { bmp: await createImageBitmap(f) })); } catch { alert('This image could not be opened.'); }
  });

  audioInput.addEventListener('change', () => {
    const f = audioInput.files[0];
    audioInput.value = '';
    if (f) chooseTrack(() => IS.Music.loadFile(f));
  });

  fontInput.addEventListener('change', async () => {
    const f = fontInput.files[0];
    fontInput.value = '';
    if (!f) return;
    try {
      const font = await IS.addCustomFont(f);
      if (S.sel && S.sel.type !== 'emoji') S.sel.st.font = font.id;
      refreshSection('brand'); renderEdit(); draw();
    } catch { alert('This font file could not be loaded.'); }
  });

  function renderList() {
    const wrap = root.querySelector('.list-wrap');
    if (!wrap) return;
    if (!S.stickers.length) { wrap.replaceChildren(); return; }
    const desc = (s) => s.type === 'text' ? s.text.split('\n')[0] : IS.TYPES[s.type].pill ? IS.stickerLabel(s) :
      s.type === 'emoji' ? s.emoji : s.type === 'photo' ? 'image' : s.type === 'music' ? s.title : s.type === 'countdown' ? s.title : s.question;
    wrap.replaceChildren(lab('Layers'), h('div', { class: 'stickers' }, S.stickers.slice().reverse().map((s) =>
      h('div', { class: 'st' + (S.sel === s ? ' on' : ''), onclick: () => select(s) },
        h('span', {}, `${IS.TYPES[s.type].name} · ${desc(s) || ''}`),
        h('button', { class: 'ib', title: 'Remove', html: ICON.trash, onclick: (e) => { e.stopPropagation(); removeSticker(s); } })))));
  }

  /* ───────────────────────────── stickers ───────────────────────────── */

  function addSticker(s, { focus = false } = {}) {
    const n = S.stickers.length;
    s.y = 0.5 + ((n % 5) - 2) * 0.085;
    S.stickers.push(s);
    select(s);
    if (focus) { const el = root.querySelector('.edit textarea, .edit input[type=text]'); el?.focus(); el?.select?.(); }
  }

  function duplicate(s) {
    const c = structuredClone({ ...s, _w: 0, _h: 0 });
    c.x = Math.min(1, s.x + 0.03); c.y = Math.min(1, s.y + 0.03);
    S.stickers.push(c);
    select(c);
  }

  function removeSticker(s) {
    S.stickers = S.stickers.filter((x) => x !== s);
    if (S.sel === s) S.sel = null;
    draw(); renderEdit(); renderList();
  }

  function select(s) {
    const changed = S.sel !== s;
    S.sel = s;
    draw(); renderList();
    if (changed) { renderEdit(); root.querySelector('.scroll')?.scrollTo({ top: 0, behavior: 'smooth' }); }
  }

  function hit(px, py) {
    for (let i = S.stickers.length - 1; i >= 0; i--) {
      const s = S.stickers[i];
      if (!s._w) continue;
      const dx = px - s.x * W, dy = py - s.y * H;
      const a = (-s.rot * Math.PI) / 180;
      const lx = (dx * Math.cos(a) - dy * Math.sin(a)) / s.scale;
      const ly = (dx * Math.sin(a) + dy * Math.cos(a)) / s.scale;
      if (Math.abs(lx) <= s._w / 2 + 16 && Math.abs(ly) <= s._h / 2 + 16) return s;
    }
    return null;
  }

  function bindStage(cv) {
    let drag = null;
    const pt = (e) => {
      const r = cv.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
    };
    const overBin = (e) => {
      const b = bin.getBoundingClientRect();
      return Math.hypot(e.clientX - (b.left + b.width / 2), e.clientY - (b.top + b.height / 2)) < 50;
    };
    cv.addEventListener('pointerdown', (e) => {
      const [x, y] = pt(e);
      const s = hit(x, y);
      if (!s) { if (S.sel) { S.sel = null; draw(); renderEdit(); renderList(); } return; }
      S.stickers = S.stickers.filter((v) => v !== s).concat(s);
      select(s);
      drag = { s, ox: x - s.x * W, oy: y - s.y * H, moved: false };
      cv.setPointerCapture(e.pointerId);
      cv.className = 'grabbing';
    });
    cv.addEventListener('pointermove', (e) => {
      const [x, y] = pt(e);
      if (!drag) { cv.className = hit(x, y) ? 'grab' : ''; return; }
      drag.moved = true;
      drag.s.x = Math.min(1, Math.max(0, (x - drag.ox) / W));
      drag.s.y = Math.min(1, Math.max(0, (y - drag.oy) / H));
      bin.classList.add('show');
      bin.classList.toggle('hot', overBin(e));
      draw();
    });
    const end = (e) => {
      if (!drag) return;
      if (drag.moved && overBin(e)) removeSticker(drag.s);
      else if (drag.moved) renderEdit();
      drag = null;
      bin.classList.remove('show', 'hot');
      cv.className = '';
      draw();
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    cv.addEventListener('dblclick', (e) => {
      const [x, y] = pt(e);
      if (hit(x, y)) { const el = root.querySelector('.edit textarea, .edit input[type=text]'); el?.focus(); el?.select?.(); }
    });
    let wheelT = 0;
    cv.addEventListener('wheel', (e) => {
      const [x, y] = pt(e);
      const s = hit(x, y) || S.sel;
      if (!s) return;
      e.preventDefault();
      if (e.shiftKey) s.rot = (s.rot + (e.deltaY > 0 ? 5 : -5) + 360) % 360;
      else s.scale = Math.min(4, Math.max(0.2, s.scale * (e.deltaY > 0 ? 0.93 : 1.07)));
      if (S.sel !== s) select(s); else draw();
      clearTimeout(wheelT); wheelT = setTimeout(renderEdit, 300);
    }, { passive: false });
  }

  /* ───────────────────────────── render loop ───────────────────────────── */

  function draw() {
    if (!canvas) return;
    cctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    drawAll(cctx, { selection: true });
  }
  IS.onFontLoaded = () => draw();

  function loop() {
    cancelAnimationFrame(raf);
    const tick = () => {
      if (!S.open || !canvas?.isConnected) return;
      if (S.media?.kind === 'video') draw();
      raf = requestAnimationFrame(tick);
    };
    draw();
    raf = requestAnimationFrame(tick);
  }

  /* ───────────────────────────── media ───────────────────────────── */

  function releaseMedia() {
    const m = S.media;
    if (!m) return;
    if (m.kind === 'video') { m.el.pause(); m.el.removeAttribute('src'); m.el.load(); URL.revokeObjectURL(m.url); }
    else m.bmp.close?.();
    S.media = null;
  }

  async function loadFile(file) {
    if (!file) return;
    try {
      if (file.type.startsWith('image/')) {
        const bmp = await createImageBitmap(file);
        releaseMedia();
        S.media = { kind: 'photo', bmp, w: bmp.width, h: bmp.height };
      } else if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        const el = document.createElement('video');
        el.muted = true; el.loop = true; el.playsInline = true; el.src = url;
        await new Promise((res, rej) => { el.onloadeddata = res; el.onerror = () => rej(new Error('This video format is not supported.')); });
        releaseMedia();
        S.media = { kind: 'video', file, url, el, w: el.videoWidth, h: el.videoHeight, duration: el.duration };
        el.play().catch(() => {});
      } else {
        throw new Error('Only photos and videos can be shared to your story.');
      }
      screenEditor();
    } catch (e) {
      screenState({ icon: '⚠️', title: "Couldn't open this file", text: e.message, actions: [h('button', { class: 'btn', onclick: screenEmpty }, 'Try again')] });
    }
  }

  fileInput.addEventListener('change', () => { loadFile(fileInput.files[0]); fileInput.value = ''; });
  window.addEventListener('paste', (e) => {
    if (!S.open || S.busy) return;
    const f = [...(e.clipboardData?.files || [])][0];
    if (f) { e.preventDefault(); loadFile(f); }
  });

  /* ───────────────────────────── export ───────────────────────────── */

  const toJpeg = (cv, q = 0.92) => new Promise((r) => cv.toBlob(r, 'image/jpeg', q));

  async function exportPhoto() {
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    drawAll(cv.getContext('2d'));
    return toJpeg(cv);
  }

  const recorderMime = () => ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4']
    .find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t));

  // Render the story to MP4 in real time (like the app): background, fit and
  // stickers burned in, original sound and music mixed. Works for a video, or
  // for a photo + music (the photo becomes a video).
  async function exportVideo(onProgress) {
    const mime = recorderMime();
    if (!mime) throw new Error('This Chrome cannot record MP4 video. Please update Chrome.');
    const m = S.media, mu = S.music, isVid = m.kind === 'video';
    const dur = storyLength();
    let v = null;
    if (isVid) {
      v = document.createElement('video');
      v.src = m.url; v.playsInline = true;
      await new Promise((r) => { v.onloadeddata = r; });
    }
    const cv = document.createElement('canvas');
    cv.width = 720; cv.height = 1280;
    const c = cv.getContext('2d');
    c.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
    const stream = cv.captureStream(30);
    const ac = new AudioContext();
    const dest = ac.createMediaStreamDestination();
    if (v) {
      try {
        const g = ac.createGain();
        g.gain.value = mu ? mu.videoVolume : 1;
        ac.createMediaElementSource(v).connect(g).connect(dest); // captured, not played out loud
      } catch {}
    }
    let src = null, mg = null;
    if (mu) {
      src = ac.createBufferSource();
      src.buffer = mu.buffer;
      mg = ac.createGain();
      src.connect(mg).connect(dest);
    }
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000, audioBitsPerSecond: 160_000 });
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise((r) => { rec.onstop = r; });
    const realEl = m.el;
    if (v) m.el = v;
    await ac.resume().catch(() => {});
    drawAll(c);
    rec.start(1000);
    const t0 = ac.currentTime;
    if (src) {
      mg.gain.setValueAtTime(mu.volume, t0);
      mg.gain.setValueAtTime(mu.volume, t0 + Math.max(0, dur - 0.8));
      mg.gain.linearRampToValueAtTime(0, t0 + dur); // soft fade-out at the end
      src.start(t0, mu.start, dur + 0.2);
    }
    if (v) {
      try { await v.play(); } catch { v.muted = true; await v.play(); }
      const frame = () => {
        drawAll(c);
        onProgress(Math.min(1, v.currentTime / dur));
        if (!v.ended && !v.paused && v.currentTime < dur) v.requestVideoFrameCallback(frame);
      };
      v.requestVideoFrameCallback(frame);
      await new Promise((r) => {
        v.onended = r;
        const iv = setInterval(() => { if (v.currentTime >= dur) { clearInterval(iv); v.pause(); r(); } }, 100);
      });
    } else {
      // still photo: repaint at ~30fps until the music part has played
      await new Promise((r) => {
        const iv = setInterval(() => {
          const el = ac.currentTime - t0;
          drawAll(c);
          onProgress(Math.min(1, el / dur));
          if (el >= dur) { clearInterval(iv); r(); }
        }, 33);
      });
    }
    drawAll(c);
    rec.stop();
    await done;
    try { src?.stop(); } catch {}
    m.el = realEl;
    ac.close();
    return { blob: new Blob(chunks, { type: 'video/mp4' }), w: cv.width, h: cv.height, duration: dur };
  }

  async function firstFrame(url) {
    const v = document.createElement('video');
    v.muted = true; v.src = url;
    await new Promise((r) => { v.onloadeddata = r; });
    v.currentTime = 0.05;
    await new Promise((r) => { v.onseeked = r; });
    const cv = document.createElement('canvas');
    cv.width = v.videoWidth; cv.height = v.videoHeight;
    cv.getContext('2d').drawImage(v, 0, 0);
    return { blob: await toJpeg(cv), w: cv.width, h: cv.height };
  }

  /* ───────────────────────────── publish ───────────────────────────── */

  async function publish() {
    if (!S.media || S.busy) return;
    const back = h('button', { class: 'btn', onclick: screenEditor }, 'Back');
    if (!IS.cookie('csrftoken') || !IS.cookie('ds_user_id')) {
      screenState({ icon: '🔒', title: 'Log in to Instagram', text: 'You need to be logged in on instagram.com to share a story.', actions: [back] });
      return;
    }
    const m = S.media;
    if (m.kind === 'video' && m.duration > IS.MAX_VIDEO_SEC + 0.5) {
      screenState({ icon: '⏱️', title: 'Video is too long', text: `Stories can be up to ${IS.MAX_VIDEO_SEC} seconds. This one is ${Math.round(m.duration)}s — trim it and try again.`, actions: [back] });
      return;
    }
    S.busy = true;
    S.sel = null;
    draw(); // refresh sticker sizes without the selection box
    const params = IS.stickerParams(S.stickers, S.mode);
    const name = `story_${Date.now()}`;
    const status = (text) => screenState({ spinner: true, title: 'Sharing', text });
    try {
      for (const s of S.stickers.filter((x) => x.type === 'link')) await IS.validateLink(s.url);
      if (m.kind === 'photo' && !S.music) {
        status('Uploading photo…');
        await IS.rupload('photo', name, await exportPhoto(), { media_type: 1, upload_media_width: W, upload_media_height: H, image_compression: '{"lib_name":"moz","lib_version":"3.1.m","quality":"92"}' });
      } else {
        m.el?.pause?.();
        IS.Music.stopPreview();
        let video = m.file, cover, durMs = Math.round((m.duration || 0) * 1000);
        const needsRender = m.kind === 'photo' || S.music || S.stickers.length > 0 || S.bg !== 'blur' || S.fit !== 'contain' || Math.abs(m.w / m.h - 9 / 16) > 0.02;
        if (needsRender) {
          const out = await exportVideo((p) => status(`Preparing video… ${Math.round(p * 100)}%  (keep this tab open)`));
          if (out) {
            video = out.blob;
            durMs = Math.round(out.duration * 1000);
            const u = URL.createObjectURL(video);
            try { cover = await firstFrame(u); } catch {} finally { URL.revokeObjectURL(u); }
          }
        }
        cover ||= m.kind === 'photo' ? { blob: await exportPhoto(), w: W, h: H } : await firstFrame(m.url);
        if (!video) throw new Error('Could not prepare the video.');
        status('Uploading video…');
        await IS.rupload('video', name, video, { 'client-passthrough': '1', is_sidecar: '0', media_type: 2, for_album: true, is_unified_video: '0',
          upload_media_width: cover.w, upload_media_height: cover.h, upload_media_duration_ms: durMs });
        status('Uploading cover…');
        await IS.rupload('photo', name, cover.blob, { media_type: 2, upload_media_width: cover.w, upload_media_height: cover.h });
        status('Instagram is processing your video…');
      }
      await IS.configureToStory({
        upload_id: name.split('_').pop(),
        configure_mode: '1',
        source_type: '4',
        ...(S.audience === 'besties' && { audience: 'besties' }),
        ...params,
      });
      S.busy = false;
      screenState({ title: 'Your story has been shared.', actions: [
        h('button', { class: 'btn sec', onclick: () => { reset(); screenEmpty(); } }, 'Share another'),
        h('button', { class: 'btn', onclick: () => { reset(); close(); } }, 'Done'),
      ] });
    } catch (e) {
      S.busy = false;
      console.error('[InstaStory]', e, e.json);
      screenState({ icon: '⚠️', title: "Your story couldn't be shared", text: e.message, actions: [
        h('button', { class: 'btn sec', onclick: screenEditor }, 'Back to editing'),
        h('button', { class: 'btn', onclick: publish }, 'Try again'),
      ] });
    }
  }

  shareBtn.addEventListener('click', publish);

  /* ───────────────────────────── open / close ───────────────────────────── */

  function reset() {
    releaseMedia();
    IS.Music?.stopPreview();
    Object.assign(S, { stickers: [], sel: null, section: null, tray: null, fit: 'contain', bg: 'blur', audience: 'all', music: null });
  }

  let prepared = null;
  const prepare = () => (prepared ||= Promise.all([IS.loadDefaults(), IS.loadCustomFonts(),
    chrome.storage.local.get('stickerFormat').then((r) => { S.mode = r.stickerFormat || 'auto'; }).catch(() => {})]));

  async function open() {
    if (!host.isConnected) document.documentElement.append(host);
    if (S.open) return;
    S.open = true;
    ov.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
    await prepare();
    if (S.media) screenEditor(); else screenEmpty();
    S.user ||= await IS.currentUser();
    const me = root.querySelector('.me');
    if (me && S.user) { if (S.user.profile_pic_url) me.querySelector('img').src = S.user.profile_pic_url; me.querySelector('b').textContent = S.user.username; }
    refreshSection('audience');
  }
  IS.open = open;

  function close() {
    S.open = false;
    cancelAnimationFrame(raf);
    S.media?.el?.pause?.();
    ov.classList.remove('open');
    $('.confirm').classList.remove('open');
    document.documentElement.style.overflow = '';
  }

  function requestClose() {
    if (S.busy) return;
    if ($('.confirm').classList.contains('open')) { $('.confirm').classList.remove('open'); return; }
    if (S.media && root.querySelector('.editor')) { $('.confirm').classList.add('open'); return; }
    reset(); close();
  }

  $('.x').addEventListener('click', requestClose);
  ov.addEventListener('mousedown', (e) => { if (e.target === ov) requestClose(); });
  $('.back').addEventListener('click', () => { if (S.media) $('.confirm').classList.add('open'); });
  $('.confirm').addEventListener('click', (e) => {
    const c = e.target.closest('[data-c]')?.dataset.c;
    if (c === 'discard') { $('.confirm').classList.remove('open'); reset(); screenEmpty(); }
    else if (c === 'cancel' || e.target === e.currentTarget) $('.confirm').classList.remove('open');
  });

  chrome.runtime.onMessage.addListener((msg) => { if (msg?.type === 'open') open(); });

  /* ─────────────── "Story" entry in Instagram's left navigation ─────────────── */

  function navItemFor(a) {
    let item = a;
    while (item.parentElement && !item.parentElement.querySelector('a[href="/explore/"], a[href="/direct/inbox/"]')) item = item.parentElement;
    return item.parentElement ? item : null;
  }

  function injectNav() {
    if (document.querySelector('[data-instastory-nav]')) return true;
    const reels = [...document.querySelectorAll('a[href="/reels/"]')].find((a) => a.querySelector('svg'));
    const item = reels && navItemFor(reels);
    if (!item) return false;
    const label = (reels.innerText || '').trim();
    const clone = item.cloneNode(true);
    clone.setAttribute('data-instastory-nav', '');
    const a = clone.matches('a') ? clone : clone.querySelector('a');
    a.setAttribute('href', '#instastory');
    a.removeAttribute('aria-current');
    const old = clone.querySelector('svg');
    if (old) {
      const tmp = document.createElement('div');
      tmp.innerHTML = ICON.story;
      const ns = tmp.firstChild;
      ns.setAttribute('width', old.getAttribute('width') || '24');
      ns.setAttribute('height', old.getAttribute('height') || '24');
      if (old.getAttribute('class')) ns.setAttribute('class', old.getAttribute('class'));
      old.replaceWith(ns);
    }
    if (label) {
      const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
      for (let n; (n = walker.nextNode());) if (n.nodeValue.trim() === label) n.nodeValue = 'Story';
    }
    clone.querySelectorAll('[aria-label]').forEach((el) => el.setAttribute('aria-label', 'Story'));
    clone.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); open(); }, true);
    item.after(clone);
    return true;
  }

  const fab = h('button', {
    title: 'New story (Alt+Shift+S)',
    style: 'position:fixed;right:24px;bottom:24px;z-index:2147482000;width:52px;height:52px;border-radius:50%;border:0;cursor:pointer;display:none;color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.25);background:linear-gradient(45deg,#feda75,#d62976 50%,#4f5bd5)',
    html: ICON.story.replace('<svg ', '<svg style="display:block;margin:auto" '),
    onclick: open,
  });

  let pending = 0;
  const ensureEntry = () => {
    pending = 0;
    const loggedIn = !!IS.cookie('ds_user_id');
    const ok = loggedIn && injectNav();
    if (!fab.isConnected) document.body.append(fab);
    fab.style.display = loggedIn && !ok ? 'block' : 'none';
  };
  new MutationObserver(() => { if (!pending) pending = setTimeout(ensureEntry, 400); })
    .observe(document.body, { childList: true, subtree: true });
  ensureEntry();

  if (location.hash === '#instastory') {
    history.replaceState(history.state, '', location.pathname + location.search);
    open();
  }
})();
