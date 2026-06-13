import { supabase, Song, RankingSession, RankedSong, ExcludedSong } from './supabase';

export async function getAllSongs(): Promise<Song[]> {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .order('game', { ascending: true })
    .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching songs:', error);
    return [];
  }

  return data || [];
}

export async function createSession(): Promise<RankingSession | null> {
  const sessionId = generateSessionId();

  const { data, error } = await supabase
    .from('ranking_sessions')
    .insert([
      {
        session_id: sessionId,
        status: 'in_progress',
        total_songs: 0,
        songs_ranked: 0,
        songs_excluded: 0,
        current_song_index: 0,
      },
    ])
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating session:', error);
    return null;
  }

  return data;
}

export async function getSession(sessionId: string): Promise<RankingSession | null> {
  const { data, error } = await supabase
    .from('ranking_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }

  return data;
}

export async function updateSession(sessionId: string, updates: Partial<RankingSession>): Promise<void> {
  const { error } = await supabase
    .from('ranking_sessions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error updating session:', error);
  }
}

export async function rankSong(
  sessionId: string,
  songId: string,
  finalRank: number
): Promise<void> {
  const { error } = await supabase
    .from('ranked_songs')
    .upsert(
      {
        session_id: sessionId,
        song_id: songId,
        final_rank: finalRank,
      },
      { onConflict: 'session_id,song_id' }
    );

  if (error) {
    console.error('Error ranking song:', error);
  }
}

export async function excludeSong(sessionId: string, songId: string): Promise<void> {
  const { error } = await supabase
    .from('excluded_songs')
    .insert([
      {
        session_id: sessionId,
        song_id: songId,
      },
    ]);

  if (error && !error.message.includes('duplicate key')) {
    console.error('Error excluding song:', error);
  }
}

export async function unexcludeSong(sessionId: string, songId: string): Promise<void> {
  const { error } = await supabase
    .from('excluded_songs')
    .delete()
    .eq('session_id', sessionId)
    .eq('song_id', songId);

  if (error) {
    console.error('Error unexcluding song:', error);
  }
}

export async function getRankedSongs(sessionId: string): Promise<RankedSong[]> {
  const { data, error } = await supabase
    .from('ranked_songs')
    .select('*')
    .eq('session_id', sessionId)
    .order('final_rank', { ascending: true });

  if (error) {
    console.error('Error fetching ranked songs:', error);
    return [];
  }

  return data || [];
}

export async function getExcludedSongs(sessionId: string): Promise<ExcludedSong[]> {
  const { data, error } = await supabase
    .from('excluded_songs')
    .select('*')
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error fetching excluded songs:', error);
    return [];
  }

  return data || [];
}

export async function getAvailableSongs(
  sessionId: string,
  allSongs: Song[]
): Promise<Song[]> {
  const excluded = await getExcludedSongs(sessionId);
  const ranked = await getRankedSongs(sessionId);

  const excludedIds = new Set(excluded.map((e) => e.song_id));
  const rankedIds = new Set(ranked.map((r) => r.song_id));

  return allSongs.filter((song) => !excludedIds.has(song.id) && !rankedIds.has(song.id));
}

export function generateSessionId(): string {
  return 'session_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function completeSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('ranking_sessions')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error completing session:', error);
  }
}
