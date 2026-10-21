// InstaStory Desktop — sticker types: default styles, canvas rendering, and
// the configure_to_story parameters that make them tappable/interactive.
(() => {
  const IS = self.IS;
  if (!IS || IS.Stickers) return;
  const { W, H } = IS;

  /* ───────────── icons (24x24 SVG paths, drawn with Path2D) ───────────── */

  const ICONS = {
    link: 'M10.6 13.4a1 1 0 0 1-.7-.3 5 5 0 0 1 0-7.1l3-3a5 5 0 0 1 7.1 7.1l-1.5 1.5a1 1 0 1 1-1.4-1.4l1.5-1.5a3 3 0 0 0-4.3-4.3l-3 3a3 3 0 0 0 0 4.3 1 1 0 0 1-.7 1.7Zm-3.1 8.1a5 5 0 0 1-3.5-8.5l1.5-1.5a1 1 0 1 1 1.4 1.4l-1.5 1.5a3 3 0 0 0 4.3 4.3l3-3a3 3 0 0 0 0-4.3 1 1 0 1 1 1.4-1.4 5 5 0 0 1 0 7.1l-3 3a5 5 0 0 1-3.6 1.4Z',
    globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm7.93 9h-3.02a15.7 15.7 0 0 0-1.38-5.84A8.02 8.02 0 0 1 19.93 11ZM12 4.04c.83 1.2 1.8 3.4 2.04 6.96H9.96C10.2 7.44 11.17 5.24 12 4.04ZM4.07 13h3.02c.1 2.1.6 4.1 1.38 5.84A8.02 8.02 0 0 1 4.07 13Zm3.02-2H4.07a8.02 8.02 0 0 1 4.4-5.84A15.7 15.7 0 0 0 7.09 11ZM12 19.96c-.83-1.2-1.8-3.4-2.04-6.96h4.08c-.24 3.56-1.21 5.76-2.04 6.96Zm3.53-1.12A15.7 15.7 0 0 0 16.91 13h3.02a8.02 8.02 0 0 1-4.4 5.84Z',
    pin: 'M12.053 8.105a1.604 1.604 0 1 0 1.604 1.604 1.604 1.604 0 0 0-1.604-1.604Zm0-7.105a8.684 8.684 0 0 0-8.708 8.66c0 5.699 6.14 11.495 8.108 13.123a.939.939 0 0 0 1.2 0c1.969-1.628 8.109-7.424 8.109-13.123A8.684 8.684 0 0 0 12.053 1Z',
    cart: 'M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM1 2h3.3l.9 2H22l-3.6 9.3a2 2 0 0 1-1.9 1.2H8.1l-.9 1.6V17h12v2H7a2 2 0 0 1-1.8-2.9L6.6 13 3 4H1Z',
    bag: 'M18 6h-2a4 4 0 0 0-8 0H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Zm-6-2a2 2 0 0 1 2 2h-4a2 2 0 0 1 2-2Z',
    phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1Z',
    chat: 'M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z',
    play: 'M8 5v14l11-7Z',
    arrow: 'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8Z',
    star: 'm12 2.6 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9Z',
    heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54Z',
    calendar: 'M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V10h14Z',
    at: 'M12 2a10 10 0 1 0 5.2 18.55 1 1 0 1 0-1.04-1.71A8 8 0 1 1 20 12v1.5a2 2 0 0 1-4 0V8a1 1 0 0 0-2 0v.26A5 5 0 1 0 16.66 16 4 4 0 0 0 22 13.5V12A10 10 0 0 0 12 2Zm0 13a3 3 0 1 1 3-3 3 3 0 0 1-3 3Z',
    hash: 'M10 3 9.3 8H6v2h3l-.6 4H5v2h3.1L7.4 21h2l.7-5h4l-.7 5h2l.7-5H19v-2h-3l.6-4H20V8h-3.1l.7-5h-2l-.7 5h-4l.7-5Zm1 7h4l-.6 4h-4Z',
  };
  const paths = {};
  const path = (k) => (paths[k] ||= new Path2D(ICONS[k]));
  IS.ICONS = ICONS;

  /* ───────────────────────────── helpers ───────────────────────────── */

  const isLight = (hex) => {
    const n = parseInt(String(hex).replace('#', '').slice(0, 6), 16);
    return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 160;
  };
  IS.isLight = isLight;
  const rgba = (hex, a) => {
    const n = parseInt(String(hex).replace('#', '').slice(0, 6), 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  };
  const hasArabic = (t) => /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/.test(t);

  function grad(c, x0, x1, colors = IS.IG_GRAD) {
    const g = c.createLinearGradient(x0, 0, x1, 0);
    colors.forEach((col, i) => g.addColorStop(i / (colors.length - 1), col));
    return g;
  }
  // `fill` is a hex colour or 'gradient'.
  const paint = (c, fill, w) => (fill === 'gradient' ? grad(c, -w / 2, w / 2) : fill);

  function wrap(c, text, maxW) {
    const out = [];
    for (const para of String(text).split('\n')) {
      const words = para.split(' ');
      let line = '';
      for (const w of words) {
        const t = line ? line + ' ' + w : w;
        if (c.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
      }
      out.push(line);
    }
    return out;
  }

  function drawIcon(c, icon, cx, cy, sz, fill) {
    if (!icon || icon === 'none') return;
    if (icon.startsWith('emoji:')) {
      c.save();
      c.font = `${sz}px ${IS.SYS_FONT}`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(icon.slice(6), cx, cy + sz * 0.05);
      c.restore();
      return;
    }
    if (!ICONS[icon]) return;
    c.save();
    c.translate(cx - sz / 2, cy - sz / 2);
    c.scale(sz / 24, sz / 24);
    c.fillStyle = fill === 'gradient' ? grad(c, 0, 24) : fill;
    c.fill(path(icon));
    c.restore();
  }

  const text = (c, t, x, y, { font, fill, align = 'center', baseline = 'middle' }) => {
    c.font = font;
    c.textAlign = align; c.textBaseline = baseline;
    c.direction = hasArabic(t) ? 'rtl' : 'ltr';
    c.fillStyle = fill;
    c.fillText(t, x, y);
    c.direction = 'ltr';
  };

  /* ───────────────────────────── types ───────────────────────────── */

  const PILL_PRESETS = {
    white: (type) => ({ bg: '#ffffff', bgAlpha: 1, fg: type === 'link' ? '#3797f0' : 'gradient', outline: false }),
    color: (type) => ({ bg: type === 'link' ? '#3797f0' : '#d62976', bgAlpha: 1, fg: '#ffffff', outline: false }),
    dark: () => ({ bg: '#000000', bgAlpha: 1, fg: '#ffffff', outline: false }),
    glass: () => ({ bg: '#ffffff', bgAlpha: 0.28, fg: '#ffffff', outline: false }),
    outline: () => ({ bg: '#ffffff', bgAlpha: 0, fg: '#ffffff', outline: true }),
  };
  IS.PILL_PRESETS = PILL_PRESETS;

  const pillDefaults = (type, icon) => ({ preset: 'white', ...PILL_PRESETS.white(type), font: 'classic', size: 54, radius: 22, upper: true, icon });
  const cardDefaults = (extra = {}) => ({ font: 'classic', bg: '#ffffff', fg: '#262626', accent: 'gradient', radius: 30, ...extra });

  const TYPES = {
    text: { name: 'Text', defaults: () => ({ font: 'classic', color: '#ffffff', style: 'plain', align: 'center', size: 80 }) },
    mention: { name: 'Mention', pill: true, defaults: () => pillDefaults('mention', 'none') },
    hashtag: { name: 'Hashtag', pill: true, defaults: () => pillDefaults('hashtag', 'none') },
    location: { name: 'Location', pill: true, defaults: () => pillDefaults('location', 'pin') },
    link: { name: 'Link', pill: true, defaults: () => pillDefaults('link', 'link') },
    emoji: { name: 'Emoji', defaults: () => ({ size: 220 }) },
    poll: { name: 'Poll', defaults: () => cardDefaults({ accent: '#262626' }) },
    music: { name: 'Music', defaults: () => ({ font: 'classic', look: 'white', radius: 26 }) },
    photo: { name: 'Photo', defaults: () => ({ radius: 24, border: true, borderColor: '#ffffff', shadow: true }) },
    question: { name: 'Questions', defaults: () => cardDefaults({ bg: '#ffffff', accent: '#ffffff' }) },
    quiz: { name: 'Quiz', defaults: () => cardDefaults({ bg: '#ffffff', accent: '#262626' }) },
    slider: { name: 'Emoji slider', defaults: () => cardDefaults() },
    countdown: { name: 'Countdown', defaults: () => cardDefaults({ bg: '#ca2ee1', bg2: '#5eb1ff', fg: '#ffffff', accent: '#7e0091' }) },
  };
  IS.TYPES = TYPES;

  // Initial content for a new sticker of each type.
  IS.newSticker = (type, data = {}) => {
    const content = {
      text: { text: 'Text' },
      emoji: { emoji: '😍' },
      poll: { question: 'Ask a question…', options: ['Yes', 'No'] },
      question: { question: 'Ask me a question' },
      quiz: { question: 'Ask a question…', options: ['Option A', 'Option B'], correct: 0 },
      slider: { question: 'Ask a question…', emoji: '😍' },
      countdown: { title: 'COUNTDOWN', end: Date.now() + 24 * 3600 * 1000 },
    }[type] || {};
    const st = { ...TYPES[type].defaults(), ...(IS.defaults[type] || {}) };
    return { type, x: 0.5, y: 0.5, scale: 1, rot: 0, ...content, ...data, st };
  };

  IS.stickerLabel = (s) => {
    const raw = { mention: '@' + (s.username || ''), hashtag: '#' + (s.tag || ''), location: s.name || '', link: s.label || '' }[s.type];
    return s.st.upper ? raw.toUpperCase() : raw;
  };

  /* ───────────────────────────── layout ───────────────────────────── */

  // layout(ctx, s) -> { w, h, draw(ctx) } in sticker-local space centred on 0,0.
  IS.layout = (c, s) => {
    const st = s.st;
    if (s.type === 'text') return layoutText(c, s, st);
    if (TYPES[s.type].pill) return layoutPill(c, s, st);
    return ({ music: layoutMusic, photo: layoutPhoto, emoji: layoutEmoji, poll: layoutPoll, question: layoutQuestion, quiz: layoutQuiz, slider: layoutSlider, countdown: layoutCountdown })[s.type](c, s, st);
  };

  function layoutText(c, s, st) {
    const size = st.size, font = IS.fontCss(st.font, size);
    c.font = font;
    const lines = (s.text || ' ').split('\n');
    const widths = lines.map((l) => c.measureText(l || ' ').width);
    const lw = Math.max(...widths);
    const lh = size * 1.22, pad = size * 0.35;
    const w = lw + pad * 2, h = lines.length * lh + pad;
    const ax = st.align === 'left' ? -w / 2 + pad : st.align === 'right' ? w / 2 - pad : 0;
    return {
      w, h,
      draw(c) {
        c.font = font;
        c.textAlign = st.align; c.textBaseline = 'middle';
        if (st.style === 'box' || st.style === 'soft') {
          c.fillStyle = st.style === 'soft' ? rgba(st.color, 0.55) : st.color;
          // IG-style: one rounded box per line
          lines.forEach((l, i) => {
            const lwI = widths[i] + pad * 1.4;
            const x = st.align === 'left' ? -w / 2 + pad * 0.3 : st.align === 'right' ? w / 2 - pad * 0.3 - lwI : -lwI / 2;
            c.beginPath(); c.roundRect(x, -h / 2 + pad / 2 + lh * i - size * 0.02, lwI, lh + size * 0.04, size * 0.25); c.fill();
          });
        }
        const fill = st.style === 'box' ? (isLight(st.color) ? '#000000' : '#ffffff') : st.style === 'soft' || st.style === 'neon' ? '#ffffff' : st.color;
        lines.forEach((l, i) => {
          const y = -h / 2 + pad / 2 + lh * (i + 0.5);
          c.direction = hasArabic(l) ? 'rtl' : 'ltr';
          if (st.style === 'neon') {
            c.shadowColor = st.color; c.shadowBlur = size * 0.45;
            c.fillStyle = st.color; c.fillText(l, ax, y);
            c.shadowBlur = size * 0.15; c.fillStyle = fill; c.fillText(l, ax, y);
          } else if (st.style === 'outline') {
            c.lineJoin = 'round'; c.lineWidth = size * 0.12;
            c.strokeStyle = isLight(st.color) ? '#000000' : '#ffffff';
            c.strokeText(l, ax, y);
            c.fillStyle = st.color; c.fillText(l, ax, y);
          } else {
            if (st.style === 'plain') { c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = size * 0.15; }
            c.fillStyle = fill; c.fillText(l, ax, y);
          }
          c.shadowBlur = 0; c.shadowColor = 'transparent';
          c.direction = 'ltr';
        });
      },
    };
  }

  function layoutPill(c, s, st) {
    const size = st.size, font = IS.fontCss(st.font, size);
    const label = IS.stickerLabel(s);
    c.font = font;
    const tw = c.measureText(label).width;
    const hasIcon = st.icon && st.icon !== 'none';
    const iconSz = size * 0.95, gap = size * 0.25;
    const padX = size * 0.63, h = size * 1.93;
    const w = tw + (hasIcon ? iconSz + gap : 0) + padX * 2;
    const r = Math.min(h / 2, st.radius * (size / 54));
    return {
      w, h,
      draw(c) {
        c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, r);
        if (st.bgAlpha > 0) {
          if (st.bgAlpha === 1 && isLight(st.bg)) { c.shadowColor = 'rgba(0,0,0,.18)'; c.shadowBlur = 16; c.shadowOffsetY = 4; }
          c.fillStyle = rgba(st.bg, st.bgAlpha); c.fill();
          c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0;
        }
        if (st.outline) { c.lineWidth = size * 0.08; c.strokeStyle = st.fg === 'gradient' ? grad(c, -w / 2, w / 2) : st.fg; c.stroke(); }
        const fill = paint(c, st.fg, w);
        let x = -w / 2 + padX;
        if (hasIcon) { drawIcon(c, st.icon, x + iconSz / 2, 0, iconSz, st.fg); x += iconSz + gap; }
        text(c, label, x, size * 0.06, { font, fill, align: 'left' });
      },
    };
  }

  function layoutMusic(c, s, st) {
    const look = st.look; // white | dark | glass | text
    const title = s.title || 'Song', artist = s.artist || '';
    if (look === 'text') {
      const f1 = IS.fontCss(st.font, 56), f2 = IS.fontCss(st.font, 40).replace(/^\d+/, '500');
      c.font = f1; const w1 = c.measureText('♫  ' + title).width;
      c.font = f2; const w2 = artist ? c.measureText(artist).width : 0;
      const w = Math.max(w1, w2) + 40, h = artist ? 150 : 90;
      return {
        w, h,
        draw(c) {
          c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 10;
          text(c, '♫  ' + title, 0, artist ? -30 : 0, { font: f1, fill: '#ffffff' });
          if (artist) text(c, artist, 0, 40, { font: f2, fill: 'rgba(255,255,255,.85)' });
          c.shadowBlur = 0; c.shadowColor = 'transparent';
        },
      };
    }
    const cover = 170, pad = 26, w = 760, h = cover + pad * 2;
    const bg = look === 'dark' ? '#121212' : look === 'glass' ? 'rgba(255,255,255,.22)' : '#ffffff';
    const fg = look === 'white' ? '#262626' : '#ffffff';
    const sub = look === 'white' ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.75)';
    const tw = w - cover - pad * 3;
    const clip = (str, font) => {
      c.font = font;
      if (c.measureText(str).width <= tw) return str;
      while (str.length > 1 && c.measureText(str + '…').width > tw) str = str.slice(0, -1);
      return str + '…';
    };
    const f1 = IS.fontCss(st.font, 50), f2 = IS.fontCss(st.font, 38).replace(/^\d+/, '500');
    const t1 = clip(title, f1), t2 = clip(artist, f2);
    return {
      w, h,
      draw(c) {
        if (look !== 'glass') { c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 24; c.shadowOffsetY = 6; }
        c.fillStyle = bg;
        c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, st.radius); c.fill();
        c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0;
        const cx = -w / 2 + pad, cy = -h / 2 + pad;
        c.save();
        c.beginPath(); c.roundRect(cx, cy, cover, cover, 18); c.clip();
        if (s.cover) c.drawImage(s.cover, cx, cy, cover, cover);
        else {
          c.fillStyle = grad(c, cx, cx + cover); c.fillRect(cx, cy, cover, cover);
          text(c, '♫', cx + cover / 2, cy + cover / 2 + 6, { font: `700 96px ${IS.SYS_FONT}`, fill: '#ffffff' });
        }
        c.restore();
        const tx = cx + cover + pad;
        text(c, t1, tx, artist ? -24 : 0, { font: f1, fill: fg, align: 'left' });
        if (artist) text(c, t2, tx, 36, { font: f2, fill: sub, align: 'left' });
        // little equaliser bars
        c.fillStyle = look === 'white' ? '#d62976' : '#ffffff';
        [26, 44, 18, 36].forEach((bh, i) => c.fillRect(w / 2 - pad - 60 + i * 15, h / 2 - pad - bh, 9, bh));
      },
    };
  }

  function layoutPhoto(c, s, st) {
    const max = 640, k = Math.min(max / s.bmp.width, max / s.bmp.height);
    const iw = s.bmp.width * k, ih = s.bmp.height * k, b = st.border ? 16 : 0;
    const w = iw + b * 2, h = ih + b * 2;
    return {
      w, h,
      draw(c) {
        if (st.shadow) { c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 30; c.shadowOffsetY = 8; }
        if (b) { c.fillStyle = st.borderColor; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, st.radius + b); c.fill(); }
        c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0;
        c.save();
        c.beginPath(); c.roundRect(-iw / 2, -ih / 2, iw, ih, st.radius); c.clip();
        c.drawImage(s.bmp, -iw / 2, -ih / 2, iw, ih);
        c.restore();
      },
    };
  }

  // Interactive stickers Instagram may draw natively on top of the story.
  IS.INTERACTIVE = ['poll', 'question', 'quiz', 'slider', 'countdown'];

  function layoutEmoji(c, s, st) {
    const size = st.size;
    return {
      w: size * 1.2, h: size * 1.2,
      draw(c) { c.font = `${size}px ${IS.SYS_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s.emoji, 0, size * 0.06); },
    };
  }

  // Card-shaped stickers are 720 wide (logical px) before scaling.
  const CARD_W = 720;

  function cardBase(c, w, h, st, { gradientBg = false } = {}) {
    c.shadowColor = 'rgba(0,0,0,.2)'; c.shadowBlur = 24; c.shadowOffsetY = 6;
    c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, st.radius);
    if (gradientBg) {
      const g = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      g.addColorStop(0, st.bg); g.addColorStop(1, st.bg2 || st.bg);
      c.fillStyle = g;
    } else c.fillStyle = st.bg;
    c.fill();
    c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0;
  }

  function questionLines(c, s, st, size, maxW) {
    c.font = IS.fontCss(st.font, size);
    return s.question ? wrap(c, s.question, maxW) : [];
  }

  function layoutPoll(c, s, st) {
    const opts = s.options.filter(Boolean).slice(0, 4);
    const two = false; // current Instagram poll: stacked options
    const qSize = 52, qLines = questionLines(c, s, st, qSize, CARD_W - 80);
    const qH = qLines.length ? qLines.length * qSize * 1.25 + 40 : 0;
    const rowH = two ? 190 : 104;
    const bodyH = two ? rowH : opts.length * (rowH + 18) - 18 + 40;
    const w = CARD_W, h = qH + bodyH + (two ? 0 : 20);
    return {
      w, h,
      draw(c) {
        cardBase(c, w, h, st);
        const fq = IS.fontCss(st.font, qSize);
        qLines.forEach((l, i) => text(c, l, 0, -h / 2 + 32 + qSize * 1.25 * (i + 0.5), { font: fq, fill: st.fg }));
        const top = -h / 2 + qH;
        if (two) {
          c.strokeStyle = rgba(isLight(st.bg) ? '#000000' : '#ffffff', 0.12); c.lineWidth = 3;
          c.beginPath(); c.moveTo(0, top + 30); c.lineTo(0, top + rowH - 30); c.stroke();
          if (qH) { c.beginPath(); c.moveTo(-w / 2, top); c.lineTo(w / 2, top); c.stroke(); }
          const fo = IS.fontCss(st.font, 70);
          opts.forEach((o, i) => {
            c.save();
            c.translate((i === 0 ? -1 : 1) * w / 4, 0); // gradient centred on each option
            c.font = fo;
            text(c, o, 0, top + rowH / 2 + 4, { font: fo, fill: paint(c, st.accent, Math.max(80, c.measureText(o).width)) });
            c.restore();
          });
        } else {
          const fo = IS.fontCss(st.font, 48);
          opts.forEach((o, i) => {
            const y = top + 20 + i * (rowH + 18);
            c.fillStyle = rgba(isLight(st.bg) ? '#000000' : '#ffffff', 0.06);
            c.beginPath(); c.roundRect(-w / 2 + 30, y, w - 60, rowH, 24); c.fill();
            text(c, o, 0, y + rowH / 2 + 3, { font: fo, fill: paint(c, st.accent, w) });
          });
        }
      },
    };
  }

  function layoutQuestion(c, s, st) {
    const qSize = 54, qLines = questionLines(c, s, st, qSize, CARD_W - 100);
    const qH = Math.max(1, qLines.length) * qSize * 1.25;
    const w = CARD_W, top = 70, boxH = 120, h = top + qH + 40 + boxH + 40;
    return {
      w, h,
      draw(c) {
        cardBase(c, w, h, st);
        // avatar bubble
        c.fillStyle = grad(c, -40, 40);
        c.beginPath(); c.arc(0, -h / 2, 48, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#ffffff'; c.beginPath(); c.arc(0, -h / 2, 40, 0, Math.PI * 2); c.fill();
        drawIcon(c, 'chat', 0, -h / 2, 40, 'gradient');
        const fq = IS.fontCss(st.font, qSize);
        qLines.forEach((l, i) => text(c, l, 0, -h / 2 + top + qSize * 1.25 * (i + 0.5), { font: fq, fill: st.fg }));
        const by = -h / 2 + top + qH + 40;
        c.fillStyle = rgba(isLight(st.bg) ? '#000000' : '#ffffff', 0.07);
        c.beginPath(); c.roundRect(-w / 2 + 40, by, w - 80, boxH, 26); c.fill();
        text(c, 'Type something…', 0, by + boxH / 2 + 2, { font: IS.fontCss('classic', 40).replace(/^\d+/, '500'), fill: rgba(isLight(st.bg) ? '#000000' : '#ffffff', 0.4) });
      },
    };
  }

  function layoutQuiz(c, s, st) {
    const opts = s.options.filter(Boolean).slice(0, 4);
    const qSize = 50, qLines = questionLines(c, s, st, qSize, CARD_W - 100);
    const qH = Math.max(1, qLines.length) * qSize * 1.25 + 70;
    const rowH = 100, w = CARD_W, h = qH + opts.length * (rowH + 16) + 30;
    return {
      w, h,
      draw(c) {
        cardBase(c, w, h, st);
        // header band
        c.save();
        c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, st.radius); c.clip();
        c.fillStyle = st.accent === 'gradient' ? grad(c, -w / 2, w / 2) : st.accent;
        c.fillRect(-w / 2, -h / 2, w, qH);
        c.restore();
        const headFill = st.accent === 'gradient' || !isLight(st.accent) ? '#ffffff' : '#000000';
        const fq = IS.fontCss(st.font, qSize);
        qLines.forEach((l, i) => text(c, l, 0, -h / 2 + 35 + qSize * 1.25 * (i + 0.5), { font: fq, fill: headFill }));
        const fo = IS.fontCss(st.font, 42);
        opts.forEach((o, i) => {
          const y = -h / 2 + qH + 20 + i * (rowH + 16);
          c.fillStyle = rgba(isLight(st.bg) ? '#000000' : '#ffffff', 0.06);
          c.beginPath(); c.roundRect(-w / 2 + 30, y, w - 60, rowH, rowH / 2); c.fill();
          c.fillStyle = rgba(isLight(st.bg) ? '#000000' : '#ffffff', 0.12);
          c.beginPath(); c.arc(-w / 2 + 30 + rowH / 2, y + rowH / 2, rowH / 2 - 14, 0, Math.PI * 2); c.fill();
          text(c, 'ABCD'[i], -w / 2 + 30 + rowH / 2, y + rowH / 2 + 2, { font: IS.fontCss('classic', 36), fill: st.fg });
          text(c, o, -w / 2 + 30 + rowH + 10, y + rowH / 2 + 2, { font: fo, fill: st.fg, align: 'left' });
        });
      },
    };
  }

  function layoutSlider(c, s, st) {
    const qSize = 50, qLines = questionLines(c, s, st, qSize, CARD_W - 100);
    const qH = qLines.length * qSize * 1.25;
    const w = CARD_W, h = 50 + qH + (qH ? 40 : 0) + 110 + 40;
    return {
      w, h,
      draw(c) {
        cardBase(c, w, h, st);
        const fq = IS.fontCss(st.font, qSize);
        qLines.forEach((l, i) => text(c, l, 0, -h / 2 + 50 + qSize * 1.25 * (i + 0.5), { font: fq, fill: st.fg }));
        const ty = h / 2 - 95, x0 = -w / 2 + 70, x1 = w / 2 - 70;
        c.lineCap = 'round'; c.lineWidth = 22;
        c.strokeStyle = rgba(isLight(st.bg) ? '#000000' : '#ffffff', 0.1);
        c.beginPath(); c.moveTo(x0, ty); c.lineTo(x1, ty); c.stroke();
        const kx = x0 + (x1 - x0) * 0.22;
        c.strokeStyle = st.accent === 'gradient' ? grad(c, x0, kx) : st.accent;
        c.beginPath(); c.moveTo(x0, ty); c.lineTo(kx, ty); c.stroke();
        c.font = `96px ${IS.SYS_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(s.emoji, kx, ty + 6);
      },
    };
  }

  function layoutCountdown(c, s, st) {
    const tSize = 56, w = CARD_W, h = 380;
    return {
      w, h,
      draw(c) {
        cardBase(c, w, h, st, { gradientBg: true });
        text(c, s.title || 'COUNTDOWN', 0, -h / 2 + 75, { font: IS.fontCss(st.font, tSize), fill: st.fg });
        const left = Math.max(0, s.end - Date.now());
        const parts = [Math.floor(left / 864e5), Math.floor(left / 36e5) % 24, Math.floor(left / 6e4) % 60];
        const digits = parts.map((n) => String(n).padStart(2, '0'));
        const boxW = 76, boxH = 120, gapD = 10, groupGap = 60;
        const total = 3 * (2 * boxW + gapD) + 2 * groupGap;
        let x = -total / 2;
        const y = -h / 2 + 140;
        digits.forEach((d, gi) => {
          for (const ch of d) {
            c.fillStyle = st.digitCard || '#ffffff';
            c.beginPath(); c.roundRect(x, y, boxW, boxH, 16); c.fill();
            text(c, ch, x + boxW / 2, y + boxH / 2 + 4, { font: IS.fontCss('classic', 76), fill: st.accent === 'gradient' ? grad(c, x, x + boxW) : st.accent });
            x += boxW + gapD;
          }
          x += groupGap - gapD;
          if (gi < 2) text(c, ':', x - groupGap / 2 - gapD / 2, y + boxH / 2, { font: IS.fontCss('classic', 70), fill: st.fg });
        });
        const date = new Date(s.end).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        text(c, date, 0, h / 2 - 48, { font: IS.fontCss('classic', 34).replace(/^\d+/, '600'), fill: rgba(isLight(st.bg) ? '#000000' : '#ffffff', 0.8) });
      },
    };
  }

  /* ─────────────── configure_to_story params (tap areas) ─────────────── */

  // What we learned from real tests on Instagram:
  //  • story_link_stickers alone → link works (v3.0)
  //  • tap_models alone, entries WITH z:0 → link works (v3.1); without z → not tappable (v4.1)
  //  • legacy story_* fields make poll / question / quiz interactive (v4.0), but when they
  //    are present Instagram ignores tap_models, so the link must also be sent the legacy way.
  // Modes:
  //  'auto'   (default) — every sticker in its legacy field AND in tap_models (z:0).
  //  'legacy' — legacy fields only.   'modern' — tap_models only.
  IS.stickerParams = (stickers, mode = 'auto') => {
    const useLegacy = mode !== 'modern', useTap = mode !== 'legacy';
    const box = (s) => ({
      x: +s.x.toFixed(4), y: +s.y.toFixed(4), z: 0,
      width: +((s._w * s.scale) / W).toFixed(4), height: +((s._h * s.scale) / H).toFixed(4),
      rotation: s.rot > 180 ? s.rot - 360 : s.rot,
    });
    const of = (t) => stickers.filter((s) => s.type === t);
    const hex = (c, d) => (/^#[0-9a-f]{6}$/i.test(c) ? c : d);
    const tap = [], ids = [], p = {};
    // add(legacyKey, legacyItems, tapItems, stickerIds)
    const add = (key, legacy, taps, sid = []) => {
      if (!legacy.length && !taps.length) return;
      if (useLegacy && key && legacy.length) p[key] = JSON.stringify(legacy);
      if (useTap) tap.push(...taps);
      ids.push(...sid);
    };

    const mentions = of('mention').map((s) => ({ ...box(s), user_id: s.userId, is_sticker: false, display_type: 'mention_username' }));
    // reel_mentions has always been accepted, keep it in every mode
    if (mentions.length) p.reel_mentions = JSON.stringify(mentions);
    if (useTap) tap.push(...mentions.map((m) => ({ ...m, type: 'mention' })));

    const tags = of('hashtag').map((s) => ({ ...box(s), tag_name: s.tag, is_sticker: true }));
    add('story_hashtags', tags, tags.map((t) => ({ ...t, type: 'hashtag', tap_state: 0, tap_state_str_id: 'hashtag_sticker_gradient' })), tags.length ? ['hashtag_sticker'] : []);

    const locs = of('location').map((s) => ({ ...box(s), location_id: s.locationId, is_sticker: true }));
    add('story_locations', locs, locs.map((l) => ({ ...l, type: 'location', tap_state: 0, tap_state_str_id: 'location_sticker_vibrant' })), locs.length ? ['location_sticker'] : []);

    const links = of('link').map((s) => ({ ...box(s), link_type: 'web', url: s.url }));
    add('story_link_stickers', links, links.map((l) => ({ ...l, type: 'story_link', tap_state_str_id: 'link_sticker_default', is_sticker: true, selected_index: 0, tap_state: 0 })),
      links.length ? ['link_sticker_default'] : []);

    const polls = of('poll').map((s) => ({ s, opts: s.options.filter(Boolean).slice(0, 4) }));
    add('story_polls',
      polls.map(({ s, opts }) => ({ ...box(s), question: s.question || '', viewer_vote: 0, viewer_can_vote: true, is_shared_result: false, finished: false,
        tallies: opts.map((t) => ({ text: t, font_size: 28.0 })), is_sticker: true })),
      polls.map(({ s, opts }) => ({ ...box(s), type: 'poll', poll_type: '', is_sticker: true, tap_state: 0, tap_state_str_id: 'polling_sticker_v2',
        is_multi_option_poll: opts.length > 2, is_shared_result: false, viewer_can_vote: true, finished: false, color: 'black',
        question: s.question || '', tallies: opts.map((t) => ({ count: 0, font_size: 39.0, text: t })) })),
      polls.length ? ['polling_sticker_vibrant'] : []);
    if (polls.length && useLegacy) p.internal_features = 'polling_sticker';

    const questions = of('question').map((s) => ({ ...box(s), question: s.question || '', viewer_can_interact: false,
      background_color: hex(s.st.bg, '#ffffff'), profile_pic_url: IS.userPic || '', question_type: 'text', text_color: hex(s.st.fg, '#000000'), is_sticker: true }));
    add('story_questions', questions, questions.map((q) => ({ ...q, type: 'question', tap_state: 0, tap_state_str_id: 'question_sticker_ama' })),
      questions.length ? ['question_sticker_ama'] : []);

    const quizzes = of('quiz').map((s) => {
      const opts = s.options.filter(Boolean).slice(0, 4);
      const accent = s.st.accent === 'gradient' ? '#262626' : hex(s.st.accent, '#262626');
      return { ...box(s), question: s.question || '', options: opts.map((t) => ({ text: t, count: 0 })), correct_answer: Math.max(0, Math.min(s.correct, opts.length - 1)),
        viewer_can_answer: false, viewer_answer: -1, text_color: '#ffffff', start_background_color: accent, end_background_color: accent, is_sticker: true };
    });
    add('story_quizs', quizzes, quizzes.map((q) => ({ ...q, type: 'quiz', tap_state: 0, tap_state_str_id: 'quiz_story_sticker_default' })),
      quizzes.length ? ['quiz_story_sticker_default'] : []);

    const sliders = of('slider').map((s) => ({ ...box(s), question: s.question || '', emoji: s.emoji, background_color: hex(s.st.bg, '#ffffff'),
      text_color: hex(s.st.fg, '#000000'), viewer_can_vote: false, slider_vote_count: 0, viewer_vote: -1.0, slider_vote_average: 0.0, is_sticker: true }));
    add('story_sliders', sliders, sliders.map((q) => ({ ...q, type: 'slider', tap_state: 0, tap_state_str_id: 'emoji_slider_' + q.emoji })),
      sliders.map((q) => 'emoji_slider_' + q.emoji));

    const countdowns = of('countdown').map((s) => ({ ...box(s), text: s.title || 'COUNTDOWN', text_color: hex(s.st.fg, '#ffffff'),
      start_background_color: hex(s.st.bg, '#ca2ee1'), end_background_color: hex(s.st.bg2, '#5eb1ff'),
      digit_color: s.st.accent === 'gradient' ? '#7e0091' : hex(s.st.accent, '#7e0091'), digit_card_color: '#ffffffcc',
      end_ts: Math.floor(s.end / 1000), following_enabled: true, is_sticker: true }));
    add('story_countdowns', countdowns, countdowns.map((q) => ({ ...q, type: 'countdown', tap_state: 0, tap_state_str_id: 'countdown_sticker_time' })),
      countdowns.length ? ['countdown_sticker_time'] : []);

    if (tap.length) p.tap_models = JSON.stringify(tap);
    if (ids.length) p.story_sticker_ids = ids.join(',');
    return p;
  };

  IS.Stickers = true;
})();
