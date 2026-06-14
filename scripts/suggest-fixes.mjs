// Para cada canción marcada como UNAVAILABLE o SUSPECT en song-link-report.json,
// busca en YouTube (yt-search, sin API key) el vídeo correcto, lo verifica
// (incrustable vía oEmbed + el título coincide con el de la pista) y propone un
// reemplazo. Genera fix-songs.sql con los UPDATE listos para revisar y ejecutar
// en el SQL Editor de Supabase.
//
// Uso:  node scripts/suggest-fixes.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import yts from 'yt-search';

const STOPWORDS = new Set([
  'theme', 'music', 'ost', 'soundtrack', 'official', 'the', 'a', 'of', 'and',
  'hd', 'extended', 'full', 'version', 'original', 'game', 'video', 'audio',
  'super', 'mario', 'bros', 'nintendo', 'remix', 'remastered', 'main', 'feat',
]);
const tokens = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));

const ratio = (trackTitle, candTitle) => {
  const t = [...new Set(tokens(trackTitle))];
  if (!t.length) return 1; // título genérico: no penalizamos por palabras
  const c = new Set(tokens(candTitle));
  return t.filter((x) => c.has(x)).length / t.length;
};

const oembedOk = async (id) => {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${id}`);
    return r.status === 200;
  } catch { return false; }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const songs = JSON.parse(readFileSync(new URL('../song-link-report.json', import.meta.url), 'utf8'));
const flagged = songs.filter((s) => s.status === 'UNAVAILABLE' || s.status === 'SUSPECT');
console.log(`Buscando reemplazos para ${flagged.length} canciones...\n`);

const fixes = [];
const review = [];

for (const song of flagged) {
  let candidates = [];
  try {
    const res = await yts(`${song.title} ${song.game} OST`);
    candidates = res.videos || [];
  } catch (e) {
    review.push({ song, reason: `error de búsqueda: ${e.message}` });
    continue;
  }

  // Descarta vídeos que no son la pista original (mods, remixes, gameplay…)
  const BLOCK = /\bmod\b|remix|cover|gameplay|walkthrough|playthrough|coins?\b|reaction|expansion|speedrun|how to|piano|guitar|8.?bit|lo.?fi|jazz|movie|timestamps?|all (coins|moons|stars)|purple|perfect boss|100%/i;
  const MUSIC = /\bost\b|soundtrack|\bmusic\b|\btheme\b|\bbgm\b/i;

  // Marca de "versión hermana" equivocada: nº de serie o "new" presentes en el
  // candidato pero NO en el nombre del juego de la canción (p. ej. Galaxy 2, New Island).
  const gameLc = song.game.toLowerCase();
  const risky = (title) => {
    const t = title.toLowerCase();
    for (const n of ['2', '3', '4', '64']) if (t.includes(' ' + n) && !gameLc.includes(n)) return true;
    if (/\bnew\b/.test(t) && !/\bnew\b/.test(gameLc)) return true;
    return false;
  };

  const gameTok = [...new Set(tokens(song.game))];
  const scored = candidates
    .filter((v) => v.videoId && v.videoId !== song.youtube_video_id && !BLOCK.test(v.title))
    .map((v) => {
      const trackR = ratio(song.title, v.title);
      const gameR = gameTok.length ? gameTok.filter((t) => new Set(tokens(v.title)).has(t)).length / gameTok.length : 0;
      const secs = v.duration?.seconds ?? 0;
      const longPenalty = secs > 900 ? 1 : 0;          // > 15 min: probable álbum completo
      const shortPenalty = secs > 0 && secs < 20 ? 1 : 0;
      const musicBonus = MUSIC.test(v.title) ? 1.5 : 0; // prioriza vídeos de música sobre gameplay
      const riskyPenalty = risky(v.title) ? 2 : 0;
      return { v, gameR, score: trackR * 2 + gameR + musicBonus - longPenalty - shortPenalty - riskyPenalty, trackR, isRisky: risky(v.title) };
    })
    .sort((a, b) => b.score - a.score);

  // Acepta solo candidatos de alta confianza: ≥67% de la pista, juego correcto
  // (si los tokens del juego son evaluables), sin marca de versión equivocada e
  // incrustable. El resto va a revisión manual.
  let picked = null;
  for (const c of scored.slice(0, 8)) {
    const gameOk = gameTok.length === 0 || c.gameR > 0;
    const isMusic = MUSIC.test(c.v.title); // exige que sea claramente un vídeo de música
    if (c.trackR >= 0.67 && gameOk && isMusic && !c.isRisky && (await oembedOk(c.v.videoId))) { picked = c; break; }
  }

  if (picked) {
    fixes.push({ song, cand: picked.v, trackR: picked.trackR });
    console.log(`✓ "${song.title}" (${song.game})\n    → ${picked.v.videoId}  "${picked.v.title}"  [match ${(picked.trackR * 100) | 0}%]`);
  } else {
    review.push({ song, reason: 'sin candidato fiable (revisar a mano)', top: scored[0]?.v });
    console.log(`✗ "${song.title}" (${song.game}) — sin candidato fiable`);
  }
  await sleep(400); // cortesía con YouTube
}

// ── fix-songs.sql ────────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/'/g, "''");
const sql =
  `-- Correcciones de youtube_video_id generadas por scripts/suggest-fixes.mjs\n` +
  `-- Revisa cada línea antes de ejecutar en el SQL Editor de Supabase.\n` +
  `-- Generado: ${new Date().toISOString()}\n\n` +
  fixes
    .map(
      (f) =>
        `UPDATE public.songs SET youtube_video_id = '${f.cand.videoId}' WHERE id = '${f.song.id}';` +
        `  -- "${esc(f.song.title)}" — ${esc(f.song.game)} | YT: "${esc(f.cand.title)}" (${(f.trackR * 100) | 0}%)`
    )
    .join('\n') +
  '\n';
writeFileSync(new URL('../fix-songs.sql', import.meta.url), sql);

// ── Lista de revisión manual ─────────────────────────────────────────────────
const reviewTxt =
  `Sin reemplazo automático fiable (${review.length}) — revisar a mano:\n\n` +
  review
    .map(
      (r) =>
        `"${r.song.title}" — ${r.song.game}\n  actual: https://youtu.be/${r.song.youtube_video_id} (${r.song.status})\n` +
        (r.top ? `  mejor candidato: https://youtu.be/${r.top.videoId} "${r.top.title}"\n` : `  ${r.reason}\n`)
    )
    .join('\n');
writeFileSync(new URL('../fixes-review.txt', import.meta.url), reviewTxt);

console.log(`\n========================================`);
console.log(`Reemplazos propuestos: ${fixes.length}  ->  fix-songs.sql`);
console.log(`Para revisar a mano:   ${review.length}  ->  fixes-review.txt`);
console.log(`========================================`);
