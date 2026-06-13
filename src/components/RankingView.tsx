import { useState, useEffect, useCallback } from 'react';
import { Song, RankedSong, ExcludedSong } from '../lib/supabase';
import {
  getAllSongs,
  rankSong,
  excludeSong,
  getRankedSongs,
  getExcludedSongs,
  updateSession,
  completeSession,
} from '../lib/api';
import { SongCard } from './SongCard';
import { RankingPanel } from './RankingPanel';
import { ResultsScreen } from './ResultsScreen';
import { Volume2, VolumeX, ChevronDown, BarChart2, ArrowRight, ArrowLeft, MoveHorizontal, Clock, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { getDefaultTierBounds, shiftBoundsForInsertion } from '../lib/tierUtils';
import { GameMode, filterSongsByMode } from '../lib/gameModes';

export type TutorialPhase = 'TOP1' | 'SKIP' | 'FAN_OPEN' | 'PREVIEW' | 'LOCK' | 'EXPLORE' | 'UNLOCK' | 'REORDER' | 'DONE';
const TUTORIAL_PHASES: TutorialPhase[] = ['TOP1', 'SKIP', 'FAN_OPEN', 'PREVIEW', 'LOCK', 'EXPLORE', 'UNLOCK', 'REORDER', 'DONE'];

interface RankingViewProps {
  sessionId: string;
  gameMode?: GameMode;
  onRestart?: () => void;
}

type ViewState = 'ranking' | 'results';

export function RankingView({ sessionId, gameMode = 'all', onRestart }: RankingViewProps) {
  const [viewState, setViewState] = useState<ViewState>('ranking');
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [rankedSongs, setRankedSongs] = useState<(RankedSong & { song?: Song })[]>([]);
  const [excludedSongs, setExcludedSongs] = useState<ExcludedSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [previewSong, setPreviewSong] = useState<Song | null>(null);
  const [isFlyingAway, setIsFlyingAway] = useState(false);
  const [tierBounds, setTierBounds] = useState<Record<string, number> | null>(null);

  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const tutorialPhase = sessionId === 'tutorial' ? TUTORIAL_PHASES[tutorialStepIndex] : null;

  const handleTutorialAdvance = useCallback(() => {
    setTutorialStepIndex(i => {
      const next = Math.min(i + 1, TUTORIAL_PHASES.length - 1);
      if (TUTORIAL_PHASES[next] === 'DONE') {
        setTimeout(finishRanking, 1000);
      }
      return next;
    });
  }, []);

  const availableSongs = allSongs.filter(
    (song) =>
      !excludedSongs.some((e) => e.song_id === song.id) &&
      !rankedSongs.some((r) => r.song_id === song.id)
  );

  const currentSong = availableSongs[0];

  useEffect(() => {
    loadInitialData();
  }, [sessionId]);

  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveProgress();
    }, 30000);

    return () => clearInterval(saveInterval);
  }, [sessionId, rankedSongs, excludedSongs]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      let songs = await getAllSongs();
      // Filter by game mode
      songs = filterSongsByMode(songs, gameMode);
      // Randomize the queue for every session load
      songs = [...songs].sort(() => Math.random() - 0.5);

      if (sessionId === 'tutorial') {
        const baseSongs = songs.slice(0, 5);
        const tutorialModeSongs = [];
        // Give 50 songs so they don't run out while practicing or skipping
        for (let i = 0; i < 10; i++) {
          tutorialModeSongs.push(...baseSongs.map(s => ({ ...s, id: `${s.id}_${i}` })));
        }
        setAllSongs(tutorialModeSongs);
        setRankedSongs([]);
        setExcludedSongs([]);
        setIsLoading(false);
        return;
      }

      setAllSongs(songs);

      const ranked = await getRankedSongs(sessionId);
      const excluded = await getExcludedSongs(sessionId);

      const enrichedRanked = ranked.map((r) => ({
        ...r,
        song: songs.find((s) => s.id === r.song_id),
      }));

      setRankedSongs(enrichedRanked);
      setExcludedSongs(excluded);

      // Load custom tier boundaries
      const params = new URLSearchParams(window.location.search);
      const urlTiers = params.get('tiers');
      if (urlTiers) {
        const parts = urlTiers.split(',').map(Number);
        if (parts.length === 4) {
          setTierBounds({ S: 0, A: parts[0], B: parts[1], C: parts[2], D: parts[3] });
        }
      } else {
        const localTiers = localStorage.getItem(`tiers_${sessionId}`);
        if (localTiers) {
          setTierBounds(JSON.parse(localTiers));
        } else {
          setTierBounds(getDefaultTierBounds(songs.length));
        }
      }

      if (ranked.length === songs.length - excluded.length && songs.length > 0) {
        setViewState('results');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tierBounds && sessionId !== 'tutorial') {
      localStorage.setItem(`tiers_${sessionId}`, JSON.stringify(tierBounds));

      // Update URL silently for easy sharing
      const params = new URLSearchParams(window.location.search);
      const tierStr = `${tierBounds.A},${tierBounds.B},${tierBounds.C},${tierBounds.D}`;
      if (params.get('tiers') !== tierStr) {
        params.set('tiers', tierStr);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [tierBounds, sessionId]);

  const saveProgress = useCallback(async () => {
    if (sessionId === 'tutorial') return;
    try {
      await updateSession(sessionId, {
        songs_ranked: rankedSongs.length,
        songs_excluded: excludedSongs.length,
        current_song_index: 0,
        total_songs: allSongs.length,
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [sessionId, rankedSongs.length, excludedSongs.length, allSongs.length]);

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (tutorialPhase === 'REORDER') {
      handleTutorialAdvance();
    }

    // Handle Tier Header Drag
    if (String(active.id).startsWith('tier-')) {
      const tierKey = String(active.id).replace('tier-', '');
      const overIndex = rankedSongs.findIndex(s => s.song_id === over.id);
      if (overIndex !== -1) {
        setTierBounds(prev => {
          if (!prev) return prev;
          const newBounds = { ...prev, [tierKey]: overIndex };
          // Enforce logical order
          newBounds.A = Math.max(1, newBounds.A);
          newBounds.B = Math.max(newBounds.A, newBounds.B);
          newBounds.C = Math.max(newBounds.B, newBounds.C);
          newBounds.D = Math.max(newBounds.C, newBounds.D);
          return newBounds;
        });
      }
      return;
    }

    // Handle Song dropped on Tier Header
    if (String(over.id).startsWith('tier-')) {
      const tierKey = String(over.id).replace('tier-', '');
      const targetIndex = tierBounds?.[tierKey] ?? 0;

      setRankedSongs((items) => {
        const oldIndex = items.findIndex((i) => i.song_id === active.id);
        if (oldIndex === -1) return items;

        const newItems = [...items];
        const [movedItem] = newItems.splice(oldIndex, 1);

        // If moving down, targetIndex needs to be adjusted because of the removal
        const adjustedTarget = oldIndex < targetIndex ? targetIndex - 1 : targetIndex;
        newItems.splice(Math.max(0, adjustedTarget), 0, movedItem);

        if (tierBounds) {
          setTierBounds(prev => prev ? shiftBoundsForInsertion(prev, adjustedTarget, oldIndex) : prev);
        }

        const fullyUpdated = newItems.map((song, idx) => ({ ...song, final_rank: idx + 1 }));
        if (sessionId !== 'tutorial') {
          Promise.all(fullyUpdated.map(r => rankSong(sessionId, r.song_id, r.final_rank))).catch(console.error);
        }
        return fullyUpdated;
      });
      return;
    }

    setRankedSongs((items) => {
      const oldIndex = items.findIndex((i) => i.song_id === active.id);
      if (oldIndex === -1) return items;
      const newIndex = items.findIndex((i) => i.song_id === over.id);

      const newItems = [...items];
      const [movedItem] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, movedItem);

      // Shift tier bounds to protect existing assignments
      if (tierBounds) {
        setTierBounds(prev => prev ? shiftBoundsForInsertion(prev, newIndex, oldIndex) : prev);
      }

      const fullyUpdated = newItems.map((song, idx) => ({ ...song, final_rank: idx + 1 }));

      if (sessionId !== 'tutorial') {
        Promise.all(fullyUpdated.map(r => rankSong(sessionId, r.song_id, r.final_rank))).catch(console.error);
      }

      return fullyUpdated;
    });
  };

  const finalizeRanking = async (songId: string, zeroBasedIndex: number) => {
    const newRankedSongs = [...rankedSongs];

    // Create new ranked song entry. Display position is index + 1
    const newEntry: RankedSong & { song?: Song } = {
      id: Math.random().toString(),
      session_id: sessionId,
      song_id: songId,
      final_rank: zeroBasedIndex + 1,
      created_at: new Date().toISOString(),
      song: currentSong,
    };

    // Insert at the chosen exact position
    newRankedSongs.splice(zeroBasedIndex, 0, newEntry);

    // Re-index all songs to maintain order (1-based final_rank)
    const updatedRanked = newRankedSongs.map((song, idx) => ({
      ...song,
      final_rank: idx + 1,
    }));

    // Shift tier bounds for organic feel
    if (tierBounds) {
      setTierBounds(prev => prev ? shiftBoundsForInsertion(prev, zeroBasedIndex) : prev);
    }

    setRankedSongs(updatedRanked);

    // Clear preview if it was active
    setPreviewSong(null);

    // Save all updated ranks to Supabase (simplistic bulk mapping)
    // The RLS policy allows upsert on final_rank
    if (sessionId !== 'tutorial') {
      await Promise.all(
        updatedRanked.map(r => rankSong(sessionId, r.song_id, r.final_rank))
      );
    }

    playSound();

    if (sessionId === 'tutorial' && updatedRanked.length >= 5) {
      finishRanking();
    } else if (availableSongs.length <= 1) {
      finishRanking();
    }

    setIsFlyingAway(false);
  };

  const handleTopRank = () => {
    if (!currentSong) return;
    setIsFlyingAway(true);
    setTimeout(() => {
      finalizeRanking(currentSong.id, 0); // Rank #1
    }, 500);
  };

  const handleInsertAt = (index: number) => {
    if (!currentSong) return;
    setIsFlyingAway(true);
    setTimeout(() => {
      finalizeRanking(currentSong.id, index);
    }, 500);
  };

  const handleSkipSong = async () => {
    if (!currentSong) return;

    setExcludedSongs([...excludedSongs, {
      id: Math.random().toString(),
      session_id: sessionId,
      song_id: currentSong.id,
      excluded_at: new Date().toISOString(),
    }]);

    // Clear preview if it was active
    setPreviewSong(null);
    setIsFlyingAway(true);

    if (sessionId !== 'tutorial') {
      await excludeSong(sessionId, currentSong.id);
    }
    playSound();

    setTimeout(() => {
      if (availableSongs.length <= 1) {
        finishRanking();
      }
      setIsFlyingAway(false);
    }, 500);
  };

  const handlePreviewToggle = (song: Song) => {
    if (previewSong?.id === song.id) {
      setPreviewSong(null); // Toggle off
    } else {
      setPreviewSong(song);
    }
  };

  const playSound = () => {
    if (!soundEnabled) return;
    const audio = new Audio(
      'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=='
    );
    audio.play().catch(() => { });
  };

  const finishRanking = async () => {
    if (sessionId !== 'tutorial') {
      await completeSession(sessionId);
    }
    setViewState('results');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading Mario soundtracks...</p>
        </div>
      </div>
    );
  }

  if (viewState === 'results') {
    return (
      <ResultsScreen
        rankedSongs={rankedSongs}
        excludedCount={excludedSongs.length}
        totalSongs={allSongs.length}
        sessionDuration={Math.round((Date.now() - sessionStartTime) / 1000)}
        onRestart={() => {
          if (onRestart) onRestart();
          else window.location.reload();
        }}
        onContinueEditing={() => setViewState('ranking')}
        tierBounds={tierBounds}
      />
    );
  }

  const progress = Math.round(
    ((rankedSongs.length + excludedSongs.length) / (allSongs.length || 1)) * 100
  );

  const getTutorialOverlay = () => {
    if (sessionId !== 'tutorial' || !tutorialPhase || tutorialPhase === 'DONE') return null;

    const overlays: Record<Exclude<TutorialPhase, 'DONE'>, { title: string, desc: string, icon: JSX.Element }> = {
      TOP1: { title: "PUNTUAR RÁPIDO", desc: "Desliza la carta hacia la DERECHA del todo para darle el Top #1.", icon: <ArrowRight className="animate-bounce" size={24} /> },
      SKIP: { title: "OMITIR", desc: "Desliza la carta hacia la IZQUIERDA del todo para omitirla y pasar de ella.", icon: <ArrowLeft className="animate-bounce" size={24} /> },
      FAN_OPEN: { title: "EL ABANICO", desc: "Arrastra la carta lentamente hacia un lado sin soltar hasta que el abanico parezca, y suéltala allí.", icon: <MoveHorizontal className="animate-pulse" size={24} /> },
      PREVIEW: { title: "AUTO-PREVIEW", desc: "Abre el abanico y mantén la carta QUIETA sobre él 1 segundo para escuchar cómo sonaba cada posición.", icon: <Clock className="animate-pulse" size={24} /> },
      LOCK: { title: "BLOQUEAR (MANTENER)", desc: "Abre el abanico y desliza hacia ARRIBA. La carta se congelará mágicamente en el aire.", icon: <ArrowUp className="animate-bounce" size={24} /> },
      EXPLORE: { title: "EXPLORAR", desc: "Con la carta bloqueada, arrastra en HORIZONTAL para explorar el abanico y las vistas previas relajadamente.", icon: <MoveHorizontal className="animate-pulse" size={24} /> },
      UNLOCK: { title: "INSERTAR (O CANCELAR)", desc: "Haz un CLIC (toque) en la carta bloqueada para insertarla. O tira hacia abajo para cancelar.", icon: <ArrowDown className="animate-bounce" size={24} /> },
      REORDER: { title: "REORDENAR LISTA", desc: "En la lista, mantén pulsado el icono de los seis puntos de tu canción y cámbiala a arriba o abajo.", icon: <GripVertical className="animate-bounce" size={24} /> }
    };

    const current = overlays[tutorialPhase as Exclude<TutorialPhase, 'DONE'>];
    if (!current) return null;

    return (
      <div className="fixed z-[100] pointer-events-none flex flex-col items-center animate-fade-in transition-all duration-500 top-4 md:top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-lg md:max-w-xl">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-blue-500/50 shadow-[0_10px_40px_rgba(59,130,246,0.4)] flex items-center gap-3 md:gap-4 pointer-events-auto p-3 md:p-4 rounded-3xl w-full">
          <div className="text-blue-400 bg-blue-500/20 rounded-2xl border border-blue-400/30 flex-shrink-0 flex items-center justify-center p-3">
            {current.icon}
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-blue-400 font-black tracking-widest uppercase text-[10px] md:text-xs mb-0.5 drop-shadow-md">{current.title}</h3>
            <p className="text-white font-bold leading-tight text-[11px] md:text-sm">{current.desc}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mario-gradient min-h-[100dvh] lg:h-[100dvh] overflow-x-hidden overflow-y-auto lg:overflow-hidden p-4 md:p-8 flex flex-col relative w-full">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col lg:min-h-0 relative">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6 animate-fade-in shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] md:text-[10px] font-black tracking-widest rounded-sm">LIVE</span>
              <span className="text-blue-400 text-[10px] md:text-[11px] font-bold tracking-[0.1em] uppercase">Soundtrack Ranking Session</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase drop-shadow-lg font-display leading-none">
              Soundtrack <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500">Showdown</span>
            </h1>
            <p className="text-slate-400 mt-1 md:mt-2 text-xs md:text-sm font-medium">
              Discover and rank the most iconic melodies in gaming history.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-end">
            <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase hidden md:inline">Status</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="w-10 h-10 rounded-xl bg-slate-900/50 border border-white/10 flex items-center justify-center text-blue-400 hover:bg-slate-800 hover:text-white transition-all"
                title={!soundEnabled ? 'Unmute All' : 'Mute All'}
              >
                {!soundEnabled ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <div className="hidden md:flex items-center justify-center px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-xl mr-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)] animate-pulse mr-2" />
                <span className="text-[9px] font-black tracking-widest text-green-400/90 uppercase">Auto-Save</span>
              </div>

              <button
                onClick={finishRanking}
                className="group flex flex-col items-center justify-center px-5 py-2 bg-slate-900/50 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer relative"
              >
                <div className="flex items-center gap-2 relative z-10 w-full">
                  <span className="text-[10px] md:text-xs font-black tracking-[0.2em] text-red-500/90 group-hover:text-red-400 transition-colors uppercase">Terminar</span>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Progress Bar Toggle */}
        <div className="mb-4 md:mb-6 shrink-0 relative z-20">
          <button
            onClick={() => setIsProgressOpen(!isProgressOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 hover:bg-slate-800/80 border border-white/10 rounded-lg text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest transition-all shadow-lg backdrop-blur-md"
          >
            <BarChart2 size={14} className="text-blue-400" />
            <span>Progress: <strong className="text-white">{Math.round(progress)}%</strong></span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isProgressOpen ? 'rotate-180' : ''}`} />
          </button>

          <div className={`transition-all duration-300 ease-in-out overflow-hidden absolute top-full left-0 w-full md:w-[400px] mt-2 ${isProgressOpen ? 'max-h-32 opacity-100 pointer-events-auto' : 'max-h-0 opacity-0 pointer-events-none'}`}>
            <div className="bg-slate-900/90 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 md:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-end mb-2">
                <h3 className="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">Global Progress</h3>
                <div className="text-right">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-[9px] md:text-[10px] font-bold tracking-wider mr-2 md:mr-3">
                    {Math.round(progress)}% COMPLETE
                  </span>
                  <span className="text-xl md:text-2xl font-black text-white">{rankedSongs.length}</span>
                  <span className="text-slate-500 text-xs md:text-sm font-bold">/{allSongs.length}</span>
                </div>
              </div>
              <div className="w-full h-1.5 md:h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-300 rounded-full shadow-[0_0_15px_rgba(56,189,248,0.5)] transition-all duration-1000 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-8 flex-1 lg:min-h-0 relative">

          {getTutorialOverlay()}

          <main className={`flex-1 flex flex-col min-h-[500px] lg:min-h-0 perspective-[1000px] transition-all duration-500 z-10 ${tutorialPhase === 'REORDER' ? 'opacity-30 blur-sm pointer-events-none grayscale' : ''}`}>

            {currentSong ? (
              <div className={`flex-1 flex flex-col min-h-[500px] lg:min-h-0 relative w-full h-full transition-all duration-500 ease-in-out ${isFlyingAway ? 'fly-away' : ''}`}>
                <SongCard
                  key={currentSong.id}
                  song={currentSong}
                  onSkip={handleSkipSong}
                  onTopRank={handleTopRank}
                  canSwipe={!previewSong} // Disable swiping while previewing another song
                  index={rankedSongs.length + excludedSongs.length}
                  total={allSongs.length}
                  previewSong={previewSong}
                  onClearPreview={() => setPreviewSong(null)}
                  rankedSongs={rankedSongs}
                  onInsertAt={handleInsertAt}
                  soundEnabled={soundEnabled}
                  tutorialPhase={tutorialPhase}
                  onTutorialAdvance={handleTutorialAdvance}
                  tierBounds={tierBounds}
                />
              </div>
            ) : (
              <div className="flex-1 glass-card rounded-3xl flex items-center justify-center p-12 text-center h-full">
                <div className="max-w-md">
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-yellow-500/20 animate-bounce">
                    <span className="text-4xl">⭐</span>
                  </div>
                  <h2 className="text-4xl font-black text-white tracking-tighter mb-4">MAMMA MIA!</h2>
                  <p className="text-slate-400 mb-10 text-lg">
                    Has clasificado todas las canciones. Puedes seguir modificando tu lista final utilizando el panel lateral, o ver los resultados.
                  </p>
                  <button
                    onClick={finishRanking}
                    className="btn-premium btn-glow-blue w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-sm"
                  >
                    Ir a Resultados Finales
                  </button>
                </div>
              </div>
            )}
          </main>

          <aside className={`lg:w-[450px] flex flex-col h-[500px] lg:h-full lg:min-h-0 shrink-0 z-10 transition-all duration-500 ${tutorialPhase && tutorialPhase !== 'REORDER' ? 'opacity-30 blur-sm pointer-events-none grayscale' : ''}`}>
            <RankingPanel
              rankedSongs={rankedSongs}
              isCompact={false}
              isRankingMode={!!currentSong}
              onInsertAt={handleInsertAt}
              onPreview={handlePreviewToggle}
              activePreviewId={previewSong?.id}
              onDragEnd={handleDragEnd}
              tutorialPhase={tutorialPhase}
              onTutorialAdvance={handleTutorialAdvance}
              tierBounds={tierBounds}
            />
          </aside>
        </div >
      </div >
    </div >
  );
}
