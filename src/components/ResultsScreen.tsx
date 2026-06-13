import { useState } from 'react';
import { Song, RankedSong } from '../lib/supabase';
import { ExternalLink, Play, BarChart3, Share2, Edit3 } from 'lucide-react';
import { YouTubePlayer } from './YouTubePlayer';
import { getTierForRank, TIERS } from '../lib/tierUtils';

interface ResultsScreenProps {
  rankedSongs: (RankedSong & { song?: Song })[];
  excludedCount: number;
  totalSongs: number;
  sessionDuration?: number;
  onRestart: () => void;
  onContinueEditing?: () => void;
  tierBounds: Record<string, number> | null;
}

export function ResultsScreen({
  rankedSongs,
  excludedCount,
  totalSongs,
  sessionDuration = 0,
  onRestart,
  onContinueEditing,
  tierBounds,
}: ResultsScreenProps) {
  const [selectedSongForPreview, setSelectedSongForPreview] = useState<string | null>(null);

  const gameBreakdown = rankedSongs.reduce(
    (acc, item) => {
      const game = item.song?.game || 'Unknown';
      acc[game] = (acc[game] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleOpenOnYouTube = (song: Song) => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${song.youtube_video_id}`;
    window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
  };

  const selectedSong = selectedSongForPreview
    ? rankedSongs.find((r) => r.song_id === selectedSongForPreview)?.song
    : null;

  return (
    <div className="mario-gradient min-h-screen p-4 md:p-12 text-white">
      <div className="max-w-6xl mx-auto animate-fade-in">
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/20 rounded-full border border-yellow-400/30 text-yellow-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <span className="animate-pulse">★</span> Session Completed
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 drop-shadow-2xl">
            YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">MASTER</span> LIST
          </h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
            Mamma Mia! You've successfully curated your ultimate Mario soundtrack collection.
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Ranked', value: rankedSongs.length, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
            { label: 'Excluded', value: excludedCount, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
            { label: 'Library', value: totalSongs, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
            { label: 'Time', value: formatDuration(sessionDuration), color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
          ].map((stat) => (
            <div key={stat.label} className={`glass-card rounded-[2rem] p-6 text-center border ${stat.border} ${stat.bg} animate-slide-up`}>
              <div className={`text-3xl md:text-4xl font-black mb-1 ${stat.color} tracking-tighter`}>
                {stat.value}
              </div>
              <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Game Breakdown */}
        {Object.keys(gameBreakdown).length > 0 && (
          <div className="glass-card rounded-[2.5rem] p-8 mb-12 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <BarChart3 size={120} />
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter">Legacy Breakdown</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(gameBreakdown)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([game, count]) => (
                  <div key={game} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-colors group">
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 truncate">
                      {game}
                    </div>
                    <div className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">
                      {count} <span className="text-[10px] text-slate-600 uppercase">Tracks</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Preview Section */}
        {selectedSong && (
          <div className="mb-12 glass-card rounded-[3rem] p-8 md:p-12 border-2 border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.15)] animate-fade-in relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/5 pointer-events-none" />
            <div className="grid md:grid-cols-2 gap-10 items-center relative z-10">
              <div className="order-2 md:order-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2 py-1 bg-blue-600 text-white text-[10px] font-black rounded uppercase tracking-widest">Selected Masterpiece</span>
                </div>
                <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 leading-none">
                  {selectedSong.title}
                </h3>
                <p className="text-xl text-blue-400 font-bold uppercase tracking-widest mb-8">
                  {selectedSong.game}
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => handleOpenOnYouTube(selectedSong)}
                    className="btn-premium btn-glow-blue flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
                  >
                    <ExternalLink size={18} strokeWidth={3} />
                    Ver en YouTube
                  </button>
                  <button
                    onClick={() => setSelectedSongForPreview(null)}
                    className="btn-premium bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-white/5"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                  <YouTubePlayer videoId={selectedSong.youtube_video_id} title={selectedSong.title} autoplay={true} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Master Ranking Table */}
        <div className="glass-card rounded-[3rem] overflow-hidden border border-white/5 mb-16">
          <div className="bg-white/5 border-b border-white/10 px-8 py-6 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tighter uppercase">The Master Hall of Fame</h2>
            <div className="hidden sm:flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <span>Scroll to explore</span>
              <div className="w-1 h-1 rounded-full bg-slate-600" />
              <span>{rankedSongs.length} Tracks Total</span>
            </div>
          </div>

          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
            {rankedSongs.map((item, index) => {
              const song = item.song;
              const isSelected = selectedSongForPreview === song?.id;
              const isTop3 = index < 3;
              const tierId = getTierForRank(index + 1, rankedSongs.length, tierBounds);
              const tier = TIERS[tierId];

              return (
                <div
                  key={`${item.session_id}-${item.song_id}`}
                  className={`px-8 py-5 flex items-center gap-6 transition-all duration-300 ${isSelected ? 'bg-blue-600/10' : 'hover:bg-white/5'}`}
                >
                  <div className="flex-shrink-0 relative">
                    <div className={`
                      w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all relative z-10
                      ${isTop3
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-slate-900 shadow-xl shadow-yellow-500/20 scale-110'
                        : tier.bgColor + ' ' + tier.color + ' border ' + tier.borderColor}
                    `}>
                      {item.final_rank}
                    </div>
                  </div>

                  {song?.thumbnail_url && (
                    <img
                      src={song.thumbnail_url}
                      alt=""
                      className="w-16 h-16 rounded-2xl object-cover shadow-2xl border border-white/10 flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-white truncate text-lg tracking-tight mb-1">
                      {song?.title}
                    </h3>
                    <div className="flex items-center gap-3">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest truncate">{song?.game}</p>
                      <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${tier.bgColor} ${tier.color} border ${tier.borderColor}`}>
                        {tier.emoji} {tier.label}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedSongForPreview(isSelected ? null : song?.id || null)}
                      className={`p-3 rounded-xl transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                    >
                      <Play size={20} fill={isSelected ? "currentColor" : "none"} />
                    </button>

                    <button
                      onClick={() => song && handleOpenOnYouTube(song)}
                      title="Ver en YouTube"
                      className="p-3 bg-slate-800 text-slate-400 hover:text-green-400 hover:bg-slate-700 rounded-xl transition-all"
                    >
                      <ExternalLink size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center pb-20">
          <button
            onClick={onRestart}
            className="btn-premium btn-glow-blue w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs md:text-sm"
          >
            Start New
          </button>

          {onContinueEditing && (
            <button
              onClick={onContinueEditing}
              className="btn-premium bg-slate-800 hover:bg-slate-700 text-white w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs md:text-sm border border-white/5 flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_5px_20px_rgba(0,0,0,0.3)] hover:border-blue-500/30"
            >
              <Edit3 size={18} />
              Seguir Editando
            </button>
          )}

          <button
            onClick={() => {
              const sessionId = rankedSongs[0]?.session_id || '';
              const origin = window.location.origin;
              const shareUrl = `${origin}?session=${sessionId}`;

              const top5 = rankedSongs.slice(0, 5);
              const top5Text = top5.map((r, i) => {
                const g = r.song?.game || '';
                let emoji = '🍄';
                if (g.toLowerCase().includes('galaxy')) emoji = '🌌';
                else if (g.toLowerCase().includes('odyssey')) emoji = '🌍';
                else if (g.toLowerCase().includes('kart')) emoji = '🏎️';
                else if (g.toLowerCase().includes('sunshine')) emoji = '☀️';
                else if (g.toLowerCase().includes('64')) emoji = '✨';
                return `${i + 1}. ${emoji} ${r.song?.title}`;
              }).join('\n');

              const tierCounts = rankedSongs.reduce((acc, _, i) => {
                const tId = getTierForRank(i + 1, rankedSongs.length, tierBounds);
                acc[tId] = (acc[tId] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);

              const tierSummary = Object.entries(tierCounts)
                .map(([tId, count]) => `${TIERS[tId].emoji} ${tId}: ${count}`)
                .join(' | ');

              const text = `🎧 He clasificado ${rankedSongs.length} melodías épicas de Mario en Soundtrack Showdown.\n\n📊 Mi distribución:\n${tierSummary}\n\n🏆 Mi Top 5 definitivo:\n${top5Text}\n\n👉 Mira el resto de mi ranking o crea el tuyo aquí:\n${shareUrl}`;

              navigator.clipboard.writeText(text);
              const btn = document.getElementById('share-btn');
              if (btn) btn.innerText = '¡ENLACE COPIADO!';
              setTimeout(() => { if (btn) btn.innerText = 'COMPARTIR RESULTADOS'; }, 2000);
            }}
            id="share-btn"
            className="btn-premium bg-white/5 hover:bg-white/10 text-white w-full sm:w-auto px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm border border-white/10 flex items-center justify-center gap-3"
          >
            <Share2 size={20} />
            Share My Ranking
          </button>
        </div>
      </div>
    </div>
  );
}
