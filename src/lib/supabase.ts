import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
