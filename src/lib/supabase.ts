import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si faltan las credenciales (p. ej. el build se hizo sin los secrets en CI),
// mostramos un mensaje claro en pantalla en lugar de una pantalla negra críptica.
if (!supabaseUrl || !supabaseAnonKey) {
  const message =
    'Configuración incompleta: faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. ' +
    'Defínelas en tu archivo .env (local) o como secrets del workflow de despliegue.';
  console.error(`[Soundtrack Showdown] ${message}`);
  const root = typeof document !== 'undefined' ? document.getElementById('root') : null;
  if (root) {
    root.innerHTML =
      '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;' +
      'padding:24px;font-family:system-ui,sans-serif;background:#020617;color:#e2e8f0;' +
      'text-align:center;line-height:1.6"><div style="max-width:520px">' +
      '<h1 style="font-size:20px;margin-bottom:12px">⚙️ Configuración incompleta</h1>' +
      `<p style="color:#94a3b8;font-size:14px">${message}</p></div></div>`;
  }
  throw new Error(message);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Song = {
  id: string;
  title: string;
  game: string;
  artist: string | null;
  youtube_video_id: string;
  duration: number | null;
  thumbnail_url: string | null;
  release_year: number | null;
  legacy_description: string | null;
  created_at: string;
};

export type RankingSession = {
  id: string;
  session_id: string;
  status: 'in_progress' | 'completed';
  total_songs: number;
  songs_ranked: number;
  songs_excluded: number;
  current_song_index: number;
  created_at: string;
  updated_at: string;
};

export type RankedSong = {
  id: string;
  session_id: string;
  song_id: string;
  final_rank: number;
  created_at: string;
};

export type ExcludedSong = {
  id: string;
  session_id: string;
  song_id: string;
  excluded_at: string;
};
