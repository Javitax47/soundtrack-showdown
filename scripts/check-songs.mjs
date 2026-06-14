// Auditoría del catálogo: comprueba cada youtube_video_id contra el oEmbed de
// YouTube (sin API key). Detecta dos problemas:
//   1) Vídeos NO DISPONIBLES / no incrustables (oEmbed != 200).
//   2) Vídeos probablemente MAL ASIGNADOS (el título real de YouTube no comparte
//      ninguna palabra significativa con el título de la canción).
//
// Uso:  node scripts/check-songs.mjs
// Lee las credenciales de .env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
// Genera: song-link-report.json y song-link-report.txt

import { readFileSync, writeFileSync } from 'node:fs';

// ── Cargar .env ─────────────────────────────────────────────────────────────
function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* ignore */
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en .env');
  process.exit(1);
}

// ── Normalización de texto para el heurístico de coincidencia ───────────────
const STOPWORDS = new Set([
  'theme', 'music', 'ost', 'soundtrack', 'official', 'the', 'a', 'of', 'and',
  'hd', 'extended', 'full', 'version', 'original', 'game', 'video', 'audio',
  'super', 'mario', 'bros', 'nintendo', 'remix', 'remastered', 'main', 'feat',
]);

function tokens(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita diacríticos
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

// ── oEmbed ───────────────────────────────────────────────────────────────────
async function checkVideo(videoId) {
  const url = `https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${videoId}`;
  try {
    const res = await fetch(url);
    if (res.status !== 200) return { available: false, status: res.status };
    const data = await res.json();
    return { available: true, status: 200, ytTitle: data.title, ytAuthor: data.author_name };
  } catch (e) {
    return { available: false, status: 0, error: String(e) };
  }
}

// ── Pool de concurrencia simple ─────────────────────────────────────────────
async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

// ── Main ─────────────────────────────────────────────────────────────────────
const songsRes = await fetch(
  `${SUPABASE_URL}/rest/v1/songs?select=id,title,game,artist,youtube_video_id&order=game,title`,
  { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
);
const songs = await songsRes.json();
console.log(`Auditando ${songs.length} canciones...\n`);

let done = 0;
const checked = await mapPool(songs, 8, async (song) => {
  const r = await checkVideo(song.youtube_video_id);
  done++;
  if (done % 25 === 0) console.log(`  ...${done}/${songs.length}`);

  let status = 'OK';
  let matchRatio = null;
  if (!r.available) {
    status = 'UNAVAILABLE';
  } else {
    // Tokens distintivos de la PISTA (sin el nombre del juego).
    const trackTok = [...new Set(tokens(song.title))];
    const ytTok = new Set(tokens(r.ytTitle));
    if (trackTok.length > 0) {
      const present = trackTok.filter((t) => ytTok.has(t)).length;
      matchRatio = present / trackTok.length;
      // Si menos de la mitad de las palabras de la pista aparecen en el título
      // real de YouTube, es muy probable que sea una asignación errónea.
      if (matchRatio < 0.5) status = 'SUSPECT';
    }
  }
  return { ...song, ...r, status, matchRatio };
});

const unavailable = checked.filter((c) => c.status === 'UNAVAILABLE');
const suspect = checked.filter((c) => c.status === 'SUSPECT');
const ok = checked.filter((c) => c.status === 'OK');

// ── Informe ──────────────────────────────────────────────────────────────────
const line = (c) =>
  `[${c.status}] "${c.title}" — ${c.game}\n` +
  `        id=${c.youtube_video_id}  https://youtu.be/${c.youtube_video_id}\n` +
  (c.available ? `        YouTube: "${c.ytTitle}" (${c.ytAuthor})\n` : `        (oEmbed status ${c.status})\n`);

const txt =
  `Auditoría de catálogo — ${new Date().toISOString()}\n` +
  `Total: ${checked.length} | OK: ${ok.length} | NO DISPONIBLES: ${unavailable.length} | SOSPECHOSOS: ${suspect.length}\n\n` +
  `===== NO DISPONIBLES (${unavailable.length}) =====\n` +
  unavailable.map(line).join('\n') +
  `\n\n===== POSIBLE MALA ASIGNACIÓN (${suspect.length}) =====\n` +
  suspect.map(line).join('\n');

writeFileSync(new URL('../song-link-report.txt', import.meta.url), txt);
writeFileSync(new URL('../song-link-report.json', import.meta.url), JSON.stringify(checked, null, 2));

console.log(`\n========================================`);
console.log(`Total:          ${checked.length}`);
console.log(`OK:             ${ok.length}`);
console.log(`NO DISPONIBLES: ${unavailable.length}`);
console.log(`SOSPECHOSOS:    ${suspect.length}`);
console.log(`========================================`);
console.log(`Informe: song-link-report.txt  /  song-link-report.json`);
