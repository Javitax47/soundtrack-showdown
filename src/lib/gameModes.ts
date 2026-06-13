import { Song } from './supabase';

export type GameMode = 'all' | 'top50';

// The 50 most iconic Mario soundtrack pieces based on cultural impact,
// YouTube views, community polls, and universal recognition.
// It's OK for Galaxy/SM64/Odyssey to dominate — they genuinely have the most famous tracks.
export const TOP_50_TITLES: Set<string> = new Set([
    'Ground Theme (Overworld)',
    'Underground Theme',
    'Underwater Theme',
    'Castle Theme',
    'Starman Theme',
    'Overworld Theme',
    'Character Select',
    'Athletic Theme',
    'Overworld 1',
    'Airship Theme',
    'Birabuto Kingdom',
    'Ending Theme',
    'Flower Garden',
    'Beware the Forest\'s Mushrooms',
    'Bob-omb Battlefield',
    'Dire, Dire Docks',
    'Slider',
    'Bowser\'s Road',
    'Staff Roll',
    'Delfino Plaza',
    'Ricco Harbor',
    'Secret Course (A Cappella)',
    'Gusty Garden Galaxy',
    'Rosalina in the Observatory',
    'Egg Planet (Good Egg Galaxy)',
    'Buoy Base Galaxy',
    'Bowser\'s Galaxy Reactor',
    'Overture',
    'Sky Station Galaxy',
    'Yoshi Star Galaxy',
    'Puzzle Plank Galaxy',
    'Main Theme',
    'Super Bell Hill',
    'Waluigi Pinball',
    'Coconut Mall',
    'Rainbow Road',
    'In the Final (The Grand Finale)',
    'Mount Wario',
    'Dolphin Shoals',
    'Jump Up, Super Star!',
    'Fossil Falls',
    'Steam Gardens',
    'Break Free (Lead the Way)',
    'Piranha Plants on Parade',
    'Fungi Mines',
]);

// Filter by matching title (since video IDs can change, title matching is more robust)
// For titles that appear in multiple games (like "Menu Theme"), we keep ALL matches
export function filterSongsByMode(songs: Song[], mode: GameMode): Song[] {
    if (mode === 'all') return songs;
    return songs.filter(song => TOP_50_TITLES.has(song.title));
}

export const GAME_MODE_INFO: Record<GameMode, { label: string; description: string; icon: string }> = {
    all: {
        label: 'Colección Completa',
        description: 'Puntúa todas las canciones de Mario, Smash y más',
        icon: '🎵',
    },
    top50: {
        label: 'Clásicos Imprescindibles',
        description: 'Solo las canciones más icónicas e inolvidables',
        icon: '👑',
    },
};
