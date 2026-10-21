// InstaStory Desktop — music for stories.
// Like Inssist, the music is mixed into the story itself: a photo becomes a
// video with sound, a video gets the track mixed with its own audio. Tracks
// come from Instagram's music library (when its search answers) or from an
// audio file the user picks.
(() => {
  const IS = self.IS;
  if (!IS || IS.Music) return;

  let ctx = null;
  const audioCtx = () => (ctx ||= new AudioContext());

  async function decode(arrayBuffer) {
    return audioCtx().decodeAudioData(arrayBuffer);
  }

  async function fetchBinary(url) {
    const r = await chrome.runtime.sendMessage({ type: 'fetchBinary', url });
    if (!r?.ok) throw new Error(r?.error || 'download failed');
    return (await fetch(r.dataUrl)).blob();
  }

  // Pull track objects out of whatever shape Instagram's music endpoints return.
  function collectTracks(json, out) {
    const seen = new Set();
    const walk = (o, d = 0) => {
      if (!o || typeof o !== 'object' || d > 10 || seen.has(o)) return;
      seen.add(o);
      if (Array.isArray(o)) { o.forEach((x) => walk(x, d + 1)); return; }
      const url = o.progressive_download_url || o.fast_start_progressive_download_url;
      if (typeof url === 'string' && /^https?:/.test(url)) {
        const id = String(o.audio_cluster_id || o.audio_asset_id || o.id || url);
        if (!out.has(id)) out.set(id, {
          id, url,
          title: o.title || o.song_name || 'Untitled',
          artist: o.display_artist || o.artist_name || '',
          cover: o.cover_artwork_thumbnail_uri || o.cover_artwork_uri || '',
          duration: (o.duration_in_ms || 0) / 1000,
          highlight: ((o.highlight_start_times_in_ms || [])[0] || 0) / 1000,
        });
      }
      for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v, d + 1);
    };
    walk(json);
  }

  async function searchIG(query) {
    const q = encodeURIComponent(query);
    const paths = query
      ? [`/api/v1/music/audio_global_search/?query=${q}&search_surface=audio_serp_page`, `/api/v1/music/search/?q=${q}`,
        `/api/v1/clips/music/search/?query=${q}`, `/api/v1/fbsearch/web/top_serp/?enable_metadata=true&query=${q}`]
      : ['/api/v1/music/trending/', '/api/v1/music/browse/?browse_session_id=web', '/api/v1/clips/music/trending/'];
    const out = new Map(), log = [];
    for (const p of paths) {
      for (const [how, run] of [['ext', IS.api], ['page', IS.pageFetch]]) {
        try {
          const before = out.size;
          collectTracks(await run(p), out);
          log.push({ path: p.split('?')[0], how, result: `ok, ${out.size - before} tracks` });
          break;
        } catch (e) { log.push({ path: p.split('?')[0], how, result: `${e.status || ''} ${e.message}`.trim().slice(0, 120) }); }
      }
      if (out.size >= 5) break;
    }
    return { tracks: [...out.values()], log };
  }

  async function loadTrack(track) {
    const [audio, coverBlob] = await Promise.all([
      fetchBinary(track.url).then((b) => b.arrayBuffer()).then(decode),
      track.cover ? fetchBinary(track.cover).catch(() => null) : null,
    ]);
    return {
      buffer: audio, title: track.title, artist: track.artist,
      cover: coverBlob ? await createImageBitmap(coverBlob).catch(() => null) : null,
      start: Math.min(track.highlight || 0, Math.max(0, audio.duration - 15)),
    };
  }

  async function loadFile(file) {
    const audio = await decode(await file.arrayBuffer());
    const name = file.name.replace(/\.[^.]+$/, '');
    const [artist, title] = name.includes(' - ') ? name.split(' - ', 2) : ['', name];
    return { buffer: audio, title: title.trim(), artist: artist.trim(), cover: null, start: 0 };
  }

  // Short preview of the selected part.
  let previewNode = null;
  function preview(music, seconds, onEnd) {
    stopPreview();
    const c = audioCtx();
    c.resume();
    const src = c.createBufferSource();
    const g = c.createGain();
    g.gain.value = music.volume ?? 1;
    src.buffer = music.buffer;
    src.connect(g).connect(c.destination);
    src.start(0, music.start, Math.min(seconds, music.buffer.duration - music.start));
    src.onended = () => { if (previewNode === src) previewNode = null; onEnd?.(); };
    previewNode = src;
  }
  function stopPreview() { try { previewNode?.stop(); } catch {} previewNode = null; }

  IS.Music = { searchIG, loadTrack, loadFile, preview, stopPreview, audioCtx, isPlaying: () => !!previewNode };
})();
