import { useState, useRef, useEffect } from 'react';
import { Song, RankedSong } from '../lib/supabase';
import { YouTubePlayer } from './YouTubePlayer';
import { X, ChevronLeft, Crown, AlertOctagon, Lock } from 'lucide-react';
import { getTierForRank, TIERS } from '../lib/tierUtils';

interface SongCardProps {
  song: Song;
  onSkip: () => void;
  onTopRank: () => void;
  canSwipe?: boolean;
  index?: number;
  total?: number;
  previewSong?: Song | null;
  onClearPreview?: () => void;
  rankedSongs?: (RankedSong & { song?: Song })[];
  onInsertAt?: (index: number) => void;
  soundEnabled?: boolean;
  tutorialPhase?: string | null;
  onTutorialAdvance?: () => void;
  tierBounds?: Record<string, number> | null;
}

export function SongCard({
  song,
  onSkip,
  onTopRank,
  canSwipe = true,
  index = 0,
  total = 0,
  previewSong = null,
  onClearPreview,
  rankedSongs = [],
  onInsertAt,
  soundEnabled = true,
  tutorialPhase,
  onTutorialAdvance,
  tierBounds,
}: SongCardProps) {
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isVideoControlActive, setIsVideoControlActive] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'cancel' | 'lock' | null>(null);
  const [hoverTier, setHoverTier] = useState<string | null>(null);
  const hoverTierRef = useRef<string | null>(null);

  // Auto-Preview State
  const [autoPreviewSong, setAutoPreviewSong] = useState<Song | null>(null);
  const hoverPreviewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fan Gamification State
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isFanOpen, setIsFanOpen] = useState(false);
  const hoverIndexRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Stale closure prevention refs for PC window event listeners
  const currentXRef = useRef(0);
  const currentYRef = useRef(0);
  const swipeDirectionRef = useRef<'left' | 'right' | 'cancel' | 'lock' | null>(null);
  const isFanOpenRef = useRef(false);
  const wasLockedOnGrabRef = useRef(false);
  const touchStartTargetRef = useRef<EventTarget | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);

  // Fallback state for broken media
  const [imgError, setImgError] = useState(false);

  // Reset img error on new song
  useEffect(() => {
    setImgError(false);
  }, [song?.id, previewSong?.id]);

  const FAN_THRESHOLD = 20;

  const playTick = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // Ignore audio errors
    }
  };

  const processDragMove = (newX: number, newY: number) => {
    if (!isDragging || !canSwipe) return;

    let allowedX = newX;
    let allowedY = newY;

    // Strict Tutorial Constraints
    if (tutorialPhase === 'TOP1') {
      allowedX = Math.max(0, newX);
      allowedY = 0;
    } else if (tutorialPhase === 'SKIP') {
      allowedX = Math.min(0, newX);
      allowedY = 0;
    } else if (tutorialPhase === 'FAN_OPEN' || tutorialPhase === 'PREVIEW') {
      const boundary = 140;
      allowedX = Math.max(-boundary, Math.min(boundary, newX));
      allowedY = 0;
    } else if (tutorialPhase === 'LOCK') {
      allowedX = currentXRef.current; // Freeze X
      allowedY = Math.min(0, newY);   // Only allow Up
    } else if (tutorialPhase === 'EXPLORE') {
      if (isLocked) {
        allowedY = 0; // Prevent down swipe unlock
        // Check if explored
        if (Math.abs(allowedX - currentXRef.current) > 10 && onTutorialAdvance) {
          onTutorialAdvance();
        }
      }
    } else if (tutorialPhase === 'UNLOCK') {
      const boundary = 140;
      allowedX = Math.max(-boundary, Math.min(boundary, newX));
      allowedY = Math.max(0, newY); // Only allow Down to unlock
    } else if (tutorialPhase === 'REORDER') {
      allowedX = 0;
      allowedY = 0;
    }

    setCurrentX(allowedX);
    setCurrentY(allowedY);
    currentXRef.current = allowedX;
    currentYRef.current = allowedY;

    // Detect Lock (Swipe Up - Auto Snap)
    if (allowedY <= -100 && !isLocked) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 40, 30]);
      setIsLocked(true);
      wasLockedOnGrabRef.current = true;
      setSwipeDirection('lock');
      swipeDirectionRef.current = 'lock';
      if (tutorialPhase === 'LOCK' && onTutorialAdvance) onTutorialAdvance();
    }
    // Detect Cancel or Quick Drop (Swipe Down)
    else if (allowedY > 50 && tutorialPhase !== 'UNLOCK') {
      // Quick Tier Drop detection
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const dropZoneY = isMobile ? 120 : 150;

      if (allowedY > dropZoneY) {
        const screenWidth = window.innerWidth;
        const x = allowedX + screenWidth / 2;
        const segment = screenWidth / 5;
        const tiers = ['S', 'A', 'B', 'C', 'D'];
        const idx = Math.max(0, Math.min(4, Math.floor(x / segment)));
        const t = tiers[idx];

        if (hoverTierRef.current !== t) {
          setHoverTier(t);
          hoverTierRef.current = t;
          if (t) playTick();
        }
        setSwipeDirection(null);
      } else {
        setHoverTier(null);
        hoverTierRef.current = null;
        setSwipeDirection('cancel');
        swipeDirectionRef.current = 'cancel';
      }

      if (isFanOpenRef.current) {
        setIsFanOpen(false);
        isFanOpenRef.current = false;
      }
      if (hoverIndexRef.current !== null) {
        setHoverIndex(null);
        hoverIndexRef.current = null;
      }
      if (hoverPreviewTimeoutRef.current) clearTimeout(hoverPreviewTimeoutRef.current);
      return;
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const extremeThreshold = isMobile ? 100 : 150;
    const fanBoundary = isMobile ? 100 : 150;
    const fanCloseThreshold = isMobile ? 120 : 180;
    const fanTotalWidth = fanBoundary * 2;

    // Extreme swipe
    if (allowedY >= -80) {
      if (Math.abs(allowedX) > extremeThreshold) {
        const dir = allowedX > 0 ? 'right' : 'left';
        setSwipeDirection(dir);
        swipeDirectionRef.current = dir;
      } else {
        setSwipeDirection(null);
        swipeDirectionRef.current = null;
      }
    }

    // Fan logic calculation
    const n = rankedSongs.length;
    const isFanActive = isFanOpenRef.current || Math.abs(allowedX) > FAN_THRESHOLD;

    if (isFanActive && n > 0 && Math.abs(allowedX) < fanCloseThreshold) {
      if (!isFanOpenRef.current) {
        setIsFanOpen(true);
        isFanOpenRef.current = true;
      }
      const cappedX = Math.max(-fanBoundary, Math.min(fanBoundary, allowedX));
      const percentage = (cappedX + fanBoundary) / fanTotalWidth; // 0 (left) to 1 (right)
      const mapped = 1 - percentage; // left -> N (bottom), right -> 0 (top)
      const newHoverIndex = Math.max(0, Math.min(n, Math.round(mapped * n)));

      if (hoverIndexRef.current !== newHoverIndex) {
        hoverIndexRef.current = newHoverIndex;
        playTick();
        setHoverIndex(newHoverIndex);

        // Auto Preview Logic
        if (hoverPreviewTimeoutRef.current) clearTimeout(hoverPreviewTimeoutRef.current);
        setAutoPreviewSong(null);

        hoverPreviewTimeoutRef.current = setTimeout(() => {
          const songToPreview = rankedSongs[newHoverIndex]?.song;
          if (songToPreview) setAutoPreviewSong(songToPreview);

          if (tutorialPhase === 'PREVIEW' && onTutorialAdvance) {
            onTutorialAdvance();
          }
        }, 1200);
      }
    } else if (Math.abs(allowedX) >= fanCloseThreshold) {
      if (isFanOpen) {
        setIsFanOpen(false);
        isFanOpenRef.current = false;
      }
      if (hoverIndexRef.current !== null) {
        hoverIndexRef.current = null;
        setHoverIndex(null);
        if (hoverPreviewTimeoutRef.current) clearTimeout(hoverPreviewTimeoutRef.current);
        setAutoPreviewSong(null);
      }
    }
  };

  const processDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    let released = false;

    if (isLocked) {
      if (swipeDirectionRef.current === 'cancel') {
        setIsLocked(false); // Let it fall through
      } else if (hoverTierRef.current) {
        // Handled in general released logic below
      } else {
        // Tap to insert?
        const dx = Math.abs(currentXRef.current - dragStartXRef.current);
        const dy = Math.abs(currentYRef.current - dragStartYRef.current);
        if (dx < 15 && dy < 15) {
          if (hoverIndexRef.current !== null && onInsertAt) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([20, 30, 20]);
            if (tutorialPhase === 'UNLOCK' && onTutorialAdvance) onTutorialAdvance();
            onInsertAt(hoverIndexRef.current);
          }
          // If they tapped but weren't hovering anything, or if they just want video controls?
          // Fall through to video control check if no insertion happened
          const videoArea = document.querySelector('.video-area-container');
          if (videoArea && !released) {
            // Logic for video toggle could go here if we want tap-to-insert to take precedence
          }
        }
        if (!released) return;
      }
    }

    if (!released && Math.abs(currentXRef.current - dragStartXRef.current) < 10 && Math.abs(currentYRef.current - dragStartYRef.current) < 10) {
      // Check if tap was in video area
      const isVideoArea = (touchStartTargetRef.current as HTMLElement)?.closest('.video-area-container');
      if (isVideoArea) {
        setIsVideoControlActive(true);
      }
    }

    if (swipeDirectionRef.current === 'lock') {
      if (tutorialPhase === 'LOCK' && onTutorialAdvance) onTutorialAdvance();
      setIsLocked(true);
      setCurrentY(0); // Snap vertically so it sits cleanly on the fan
      currentYRef.current = 0;
      setSwipeDirection(null);
      swipeDirectionRef.current = null;
      // DO NOT reset X, hoverIndex, or fan state
      return;
    }

    if (swipeDirectionRef.current === 'right' && hoverIndexRef.current === null) {
      if (tutorialPhase === 'TOP1' && onTutorialAdvance) onTutorialAdvance();
      onTopRank();
      released = true;
    } else if (swipeDirectionRef.current === 'left' && hoverIndexRef.current === null) {
      if (tutorialPhase === 'SKIP' && onTutorialAdvance) onTutorialAdvance();
      onSkip();
      released = true;
    } else if (hoverTierRef.current && onInsertAt && tierBounds) {
      const tId = hoverTierRef.current;
      // Target the END of the tier (before the next header starts)
      let targetIdx = 0;
      if (tId === 'S') targetIdx = tierBounds.A - 1;
      else if (tId === 'A') targetIdx = tierBounds.B - 1;
      else if (tId === 'B') targetIdx = tierBounds.C - 1;
      else if (tId === 'C') targetIdx = tierBounds.D - 1;
      else targetIdx = rankedSongs.length;

      onInsertAt(Math.max(0, targetIdx));
      released = true;
    } else if (isFanOpenRef.current && hoverIndexRef.current !== null && onInsertAt) {
      if (tutorialPhase === 'FAN_OPEN' && onTutorialAdvance) onTutorialAdvance();
      if (tutorialPhase === 'UNLOCK' && onTutorialAdvance) onTutorialAdvance();
      onInsertAt(hoverIndexRef.current);
      released = true;
    }

    if (!released) {
      // Snap back to zero
      setCurrentX(0);
      setCurrentY(0);
      currentXRef.current = 0;
      currentYRef.current = 0;
      setSwipeDirection(null);
      swipeDirectionRef.current = null;
      setHoverIndex(null);
      hoverIndexRef.current = null;
    }
    setIsFanOpen(false);
    isFanOpenRef.current = false;
    if (hoverPreviewTimeoutRef.current) clearTimeout(hoverPreviewTimeoutRef.current);
    setAutoPreviewSong(null);
    setHoverTier(null);
    hoverTierRef.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!canSwipe) return;
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    touchStartTargetRef.current = e.target;
    setStartX(e.touches[0].clientX - currentX); // track relative grab
    setStartY(e.touches[0].clientY - currentY);
    dragStartXRef.current = currentX;
    dragStartYRef.current = currentY;
    setIsDragging(true);
    setIsVideoControlActive(false);
    wasLockedOnGrabRef.current = isLocked;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    processDragMove(e.touches[0].clientX - startX, e.touches[0].clientY - startY);
  };

  const handleTouchEnd = () => processDragEnd();

  const handleMouseDown = (e: MouseEvent | React.MouseEvent) => {
    if (!canSwipe) return;
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    touchStartTargetRef.current = e.target;

    // Crucial for PC: Prevents native HTML5 drag-and-drop & highlighting from freezing the card
    e.preventDefault();

    setStartX(e.clientX - currentX);
    setStartY(e.clientY - currentY);
    dragStartXRef.current = currentX;
    dragStartYRef.current = currentY;
    setIsDragging(true);
    setIsVideoControlActive(false);
    wasLockedOnGrabRef.current = isLocked;
  };

  const handleMouseMove = (e: MouseEvent) => {
    processDragMove(e.clientX - startX, e.clientY - startY);
  };

  const handleMouseUp = () => processDragEnd();

  // Attach window event listeners for smooth drag out of bounds
  useEffect(() => {
    if (!cardRef.current) return;
    cardRef.current.addEventListener('mousedown', handleMouseDown as any);
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      cardRef.current?.removeEventListener('mousedown', handleMouseDown as any);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startX, canSwipe]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const rotationAngle = (currentX / 200) * 15;
  const clampedY = Math.max(0, currentY); // Only fade out on pull down
  const opacityX = isLocked ? 1 : 1 - Math.abs(currentX) / (isMobile ? 200 : 300);
  const opacityY = isLocked ? 1 : 1 - clampedY / 300;
  const opacity = Math.min(opacityX, opacityY);

  const activeSong = previewSong || song;
  const isAutoPreviewing = !!autoPreviewSong;
  const videoIdToPlay = autoPreviewSong ? autoPreviewSong.youtube_video_id : activeSong.youtube_video_id;
  const isPreviewing = !!previewSong;
  const showFan = (isDragging || isLocked) && isFanOpen && hoverIndex !== null && rankedSongs.length > 0;

  const currentTierId = getTierForRank((hoverIndex ?? 0) + 1, rankedSongs.length, tierBounds);
  const currentTier = TIERS[currentTierId];

  // Compute robust thumbnail URL
  const fallbackThumb = `https://i.ytimg.com/vi/${activeSong.youtube_video_id}/hqdefault.jpg`;
  const imgSrc = imgError ? fallbackThumb : (activeSong.thumbnail_url || fallbackThumb);

  return (
    <div className="flex-1 w-full h-full relative perspective-[1000px]">

      {/* THE FAN OVERLAY */}
      <div
        className={`absolute inset-x-0 z-50 flex items-center justify-center transition-opacity duration-300 pointer-events-none drop-shadow-2xl ${showFan ? 'opacity-100' : 'opacity-0'}`}
        style={{
          transform: `translateX(${-currentX * 0.25}px)`,
          top: '10%'
        }}
      >
        <div className="relative w-full flex items-center justify-center">

          {/* Fan items */}
          {rankedSongs.map((rs, idx) => {
            const hIdx = hoverIndex ?? 0;
            const relativePos = idx - hIdx;
            const sideOffset = idx < hIdx ? -1.5 : 0.5;
            const pos = relativePos + sideOffset;

            const translateX = -pos * 55;
            const translateY = Math.pow(Math.abs(pos), 1.8) * 8;
            const rotate = -pos * 6;

            // Limit render to items close to center to prevent giant DOM and crazy spreads
            if (Math.abs(pos) > 5) return null;

            const scale = Math.max(0.6, 1 - Math.abs(pos) * 0.08);
            const itemOpacity = Math.max(0, 1 - Math.abs(pos) * 0.1);

            return (
              <div
                key={rs.song_id}
                className="absolute transition-all duration-150 ease-out flex flex-col items-center"
                style={{
                  transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg) scale(${scale})`,
                  opacity: itemOpacity,
                  zIndex: 20 - Math.abs(Math.round(pos)),
                  willChange: 'transform'
                }}
              >
                {isAutoPreviewing && autoPreviewSong?.id === rs.song?.id && (
                  <div className="absolute -top-7 bg-blue-600/95 border border-blue-400 text-white text-[8px] font-bold px-2 py-0.5 rounded-full flex gap-1 items-center animate-bounce shadow-[0_0_15px_rgba(59,130,246,0.8)] whitespace-nowrap z-50">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Comparando
                  </div>
                )}
                <img src={rs.song?.thumbnail_url || undefined} className="w-20 h-20 rounded-xl border-2 border-white/30 shadow-md object-cover bg-slate-800" />
                <span className="absolute -bottom-6 text-[9px] font-bold text-white truncate w-24 text-center bg-slate-900/80 px-1 py-0.5 rounded-sm border border-white/10">
                  {rs.song?.title}
                </span>
              </div>
            );
          })}

          {/* insertion slot indicator */}
          <div
            className="absolute transition-all duration-300 ease-out"
            style={{ transform: `translateY(-30px) scale(1.2)`, zIndex: 100 }}
          >
            <div className={`w-28 h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center animate-pulse shadow-lg transition-colors duration-500 ${currentTier.borderColor} ${currentTier.bgColor}`}>
              <span className={`font-black text-[10px] uppercase tracking-widest mb-1 drop-shadow-md ${currentTier.color}`}>
                {currentTier.emoji} {currentTier.label}
              </span>
              <div className="flex flex-col items-center leading-none">
                <span className="text-white/60 font-bold text-[8px] uppercase tracking-tighter mb-0.5">Mover A</span>
                <span className="text-white font-black text-3xl drop-shadow-md">#{(hoverIndex ?? 0) + 1}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`select-none touch-none absolute inset-0 flex flex-col rounded-[2.5rem] overflow-hidden z-20 ${isDragging ? 'cursor-grabbing scale-[0.98]' : 'cursor-grab hover:scale-[1.01]'
          } song-card-shadow border transition-all duration-300 ${isPreviewing ? 'border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.15)] bg-slate-900' : isLocked ? 'border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.4)] bg-slate-900 border-2' : 'border-white/10 glass-card'
          }`}
        style={{
          transform: `translateX(${currentX}px) translateY(${isLocked ? 0 : currentY}px) rotate(${isLocked ? 0 : rotationAngle}deg)`,
          opacity: opacity,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease-out, scale 0.3s ease-out',
          willChange: 'transform, opacity',
          zIndex: isVideoControlActive ? 100 : 20
        }}
      >
        {/* Floating Lock Badge */}
        <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isLocked ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-50'}`}>
          <div className="bg-gradient-to-b from-blue-400 to-blue-600 p-2 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.6)] mb-1">
            <Lock size={16} className="text-white" />
          </div>
          <span className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-lg border border-blue-400/50">
            Bloqueada
          </span>
        </div>
        {/* Background Ambient Glow */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img
            src={imgSrc}
            onError={() => setImgError(true)}
            alt=""
            draggable={false}
            className="w-full h-full object-cover blur-xl scale-150 opacity-50"
          />
        </div>
        {/* Front Face of the Card */}
        <div
          className="w-full h-full absolute top-0 left-0 rounded-3xl shadow-2xl flex flex-col overflow-hidden bg-slate-900 border border-slate-700/50"
        >
          {/* Premium Swipe Stamps moved to card root */}
          {swipeDirection && !isPreviewing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100] overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300" />

              {swipeDirection === 'right' ? (
                <div className="animate-stamp-in border-4 border-yellow-400 text-yellow-400 bg-yellow-900/40 backdrop-blur-xl rounded-[2rem] px-10 py-8 flex flex-col items-center gap-3 shadow-[0_0_100px_rgba(250,204,21,0.6)] z-10 scale-125">
                  <Crown size={100} strokeWidth={2.5} className="drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                  <div className="text-center mt-4">
                    <span className="font-black text-6xl md:text-7xl uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] block leading-none">TOP #1</span>
                    <span className="font-bold text-sm md:text-base tracking-[0.5em] uppercase text-yellow-200 mt-3 block">Legendary Tier</span>
                  </div>
                </div>
              ) : swipeDirection === 'lock' ? (
                <div className="animate-stamp-in border-4 border-blue-400 text-blue-400 bg-blue-900/40 backdrop-blur-xl rounded-[2rem] px-10 py-8 flex flex-col items-center gap-3 shadow-[0_0_100px_rgba(59,130,246,0.6)] z-10 scale-125">
                  <div className="text-center mt-4">
                    <span className="font-black text-5xl md:text-6xl uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] block leading-none">BLOQUEAR</span>
                    <span className="font-bold text-xs md:text-sm tracking-[0.2em] uppercase text-blue-200 mt-3 block">Mantener en Abanico</span>
                  </div>
                </div>
              ) : swipeDirection === 'cancel' ? (
                <div className="animate-stamp-bad border-4 border-slate-500 text-slate-400 bg-slate-900/60 backdrop-blur-xl rounded-[2rem] px-10 py-8 flex flex-col items-center gap-3 shadow-[0_0_100px_rgba(100,116,139,0.4)] z-10 scale-125">
                  <X size={100} strokeWidth={3} className="drop-shadow-[0_0_15px_rgba(100,116,139,0.5)]" />
                  <div className="text-center mt-4">
                    <span className="font-black text-6xl md:text-7xl uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(100,116,139,0.5)] block leading-none">CANCEL</span>
                  </div>
                </div>
              ) : (
                <div className="animate-stamp-bad border-4 border-red-500 text-red-500 bg-red-950/60 backdrop-blur-xl rounded-[2rem] px-10 py-8 flex flex-col items-center gap-3 shadow-[0_0_100px_rgba(239,68,68,0.6)] z-10 scale-125">
                  <AlertOctagon size={100} strokeWidth={2.5} className="drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                  <div className="text-center mt-4">
                    <span className="font-black text-6xl md:text-7xl uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] block leading-none">OMIT</span>
                    <span className="font-bold text-sm md:text-base tracking-[0.5em] uppercase text-red-300 mt-3 block">Skipped</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={`${isPreviewing || isLocked ? 'flex-[0.5] md:flex-none' : 'flex-1'} flex flex-col px-4 pb-4 pt-4 md:px-6 md:pb-6 relative overflow-hidden justify-center transition-all duration-500`}>
            <div className="relative z-10 flex flex-col h-full justify-between">
              {/* Card Badge */}
              {isPreviewing && (
                <div className="flex justify-between items-center mb-2 pointer-events-none">
                  <button
                    onClick={onClearPreview}
                    className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-red-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 pointer-events-auto"
                  >
                    <X size={12} strokeWidth={3} /> Return to Rating
                  </button>
                </div>
              )}

              {/* Responsive Horizontal Header */}
              <div className="flex-1 flex flex-row items-center justify-start pointer-events-none gap-4 md:gap-6">
                <div className="relative group shrink-0">
                  <div className={`absolute inset-0 blur-xl rounded-full pulse-glow ${isPreviewing ? 'bg-yellow-500/20' : 'bg-blue-500/20'}`} />
                  {imgSrc && (
                    <img
                      src={imgSrc}
                      onError={() => setImgError(true)}
                      alt={activeSong.title}
                      draggable={false}
                      className={`w-20 h-20 md:w-28 md:h-28 rounded-2xl object-cover shadow-2xl relative z-10 border-2 transition-all duration-500 ${isPreviewing ? 'border-yellow-500/50 grayscale-[20%]' : 'border-white/20 group-hover:scale-105'
                        }`}
                    />
                  )}
                  {/* 1st Place Crown Overlay */}
                  {index === 0 && !isPreviewing && (
                    <div className="absolute -top-3 -right-3 z-20 bg-gradient-to-br from-yellow-400 to-orange-500 text-slate-900 w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900 animate-bounce">
                      <Crown size={14} strokeWidth={3} />
                    </div>
                  )}
                </div>

                <div className="text-left flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3 md:mb-4 pointer-events-none">
                    <div className={`px-2 py-0.5 rounded border text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-colors inline-block ${isPreviewing
                      ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 animate-pulse'
                      : 'bg-white/10 border-white/10 text-slate-300'
                      }`}>
                      {isPreviewing ? 'Preview Mode' : `#${index + 1} OF ${total}`}
                    </div>
                  </div>

                  <h2 className={`text-xl md:text-3xl font-black leading-tight tracking-tight drop-shadow-xl font-display transition-colors truncate ${isPreviewing ? 'text-yellow-400' : 'text-white'}`}>
                    {activeSong.title}
                  </h2>

                  <p className={`text-xs md:text-sm font-bold uppercase tracking-widest mt-0.5 truncate drop-shadow-md transition-colors ${isPreviewing ? 'text-yellow-500' : 'text-blue-400'}`}>
                    {activeSong.game}
                  </p>

                  {activeSong.artist && (
                    <p className="text-[10px] md:text-xs text-slate-400 font-medium tracking-wide mt-1.5 opacity-80 italic truncate">
                      Composed by {activeSong.artist}
                    </p>
                  )}

                  {activeSong.legacy_description && (
                    <div className="mt-3 bg-blue-500/10 border-l-2 border-blue-500/50 p-3 rounded-r-lg max-h-24 overflow-y-auto no-scrollbar hidden md:block">
                      <p className="text-[11px] leading-relaxed text-blue-200/90 italic font-medium">
                        {activeSong.legacy_description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Premium Swipe Stamps moved to card root */}
            </div>
          </div>

          {/* Control Surface */}
          <div className={`flex flex-col transition-all duration-500 backdrop-blur-2xl border-t p-4 md:p-5 relative z-20 pointer-events-auto ${isPreviewing ? 'flex-1 justify-center bg-yellow-900/20 border-yellow-500/20' : 'justify-end bg-slate-900/80 border-white/10'}`}>
            <div className={`video-area-container w-full mx-auto transition-all duration-500 relative ${isPreviewing ? 'max-w-full' : 'max-w-[340px] md:max-w-md mb-3 md:mb-4 lg:mb-5'}`}>
              {/* Invisible overlay to prevent iframe from swallowing touch events */}
              {!isVideoControlActive && (
                <div className="absolute inset-0 z-50 cursor-pointer"></div>
              )}

              {isVideoControlActive && (
                <button
                  onClick={() => setIsVideoControlActive(false)}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-[60] bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-xl border border-blue-400 animate-fade-in flex items-center gap-1.5 hover:bg-blue-500 transition-colors"
                >
                  <Lock size={10} /> Volver a modo arrastre
                </button>
              )}

              <YouTubePlayer
                videoId={videoIdToPlay}
                title={activeSong.title}
                autoplay={true}
                forceShowControls={isVideoControlActive}
              />
            </div>

            {!isPreviewing && (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={onSkip}
                    disabled={!canSwipe || isLocked}
                    className="btn-premium btn-glow-red flex items-center justify-center gap-2 py-2.5 md:py-3 rounded-xl disabled:opacity-50"
                  >
                    <ChevronLeft size={20} strokeWidth={3} />
                    <span className="font-black uppercase text-xs tracking-widest">Skip</span>
                  </button>

                  <button
                    onClick={onTopRank}
                    disabled={!canSwipe || isLocked}
                    className="btn-premium animate-glint bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 hover:from-yellow-300 hover:to-yellow-500 disabled:from-slate-600 disabled:to-slate-700 text-slate-900 disabled:text-slate-500 flex items-center justify-center gap-2 py-2.5 md:py-3 rounded-xl shadow-[0_0_30px_rgba(250,204,21,0.5)] border border-yellow-300/50"
                  >
                    <span className="font-black uppercase text-xs tracking-widest drop-shadow-sm">Top #1</span>
                    <Crown size={18} strokeWidth={3} className="animate-pulse drop-shadow-sm" />
                  </button>
                </div>

                <div className="text-center mt-2 animate-pulse">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                    {isLocked ? "Toca la tarjeta o muévela para desbloquear" : "Drag to rank smoothly or swipe to edges ➔"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QUICK TIER DROP BUBBLES */}
      <div className={`fixed bottom-10 inset-x-4 z-[100] flex justify-between gap-2 transition-all duration-300 ${isDragging && currentY > 80 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'}`}>
        {['S', 'A', 'B', 'C', 'D'].map((t) => {
          const tier = TIERS[t];
          const isHovered = hoverTier === t;
          return (
            <div
              key={t}
              className={`flex-1 h-20 rounded-[2rem] border-2 flex flex-col items-center justify-center transition-all ${isHovered ? `${tier.bgColor} ${tier.borderColor} scale-110 shadow-2xl` : 'bg-slate-900/60 border-white/5 opacity-40'}`}
            >
              <span className="text-xl drop-shadow-md">{tier.emoji}</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isHovered ? tier.color : 'text-slate-500'}`}>{tier.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
