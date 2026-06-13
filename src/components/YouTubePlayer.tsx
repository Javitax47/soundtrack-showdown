import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
  onEnded?: () => void;
  autoplay?: boolean;
  forceShowControls?: boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function YouTubePlayer({ videoId, title, onEnded, autoplay = true, forceShowControls = false }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const progressIntervalRef = useRef<number | null>(null);

  // Initialize API and Player
  useEffect(() => {
    const loadAPI = () => {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        window.onYouTubeIframeAPIReady = initPlayer;
        document.body.appendChild(tag);
      } else {
        initPlayer();
      }
    };

    loadAPI();

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Handle videoId and autoplay changes
  useEffect(() => {
    if (playerRef.current && playerRef.current.loadVideoById) {
      setIsLoading(true);
      setHasError(false);
      playerRef.current.loadVideoById({
        videoId,
        startSeconds: 0,
        suggestedQuality: 'hd720'
      });
      if (autoplay) {
        playerRef.current.playVideo();
      }
    }
  }, [videoId, autoplay]);

  const initPlayer = () => {
    if (!containerRef.current || playerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError,
      },
    });
  };

  const onPlayerReady = (event: any) => {
    setDuration(Math.round(event.target.getDuration()));
    setIsLoading(false);

    if (autoplay) {
      event.target.playVideo();
      setIsPlaying(true);
    }

    startProgressTracking();
  };

  const onPlayerStateChange = (event: any) => {
    const state = event.data;
    if (state === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      setIsLoading(false);
      setDuration(Math.round(event.target.getDuration()));
      startProgressTracking();
    } else if (state === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
    } else if (state === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      onEnded?.();
    } else if (state === window.YT.PlayerState.BUFFERING) {
      setIsLoading(true);
    }
  };

  const onPlayerError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = window.setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrentTime(Math.round(playerRef.current.getCurrentTime()));
      }
    }, 500);
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
    } else {
      playerRef.current.mute();
    }
    setIsMuted(!isMuted);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const newTime = percentage * duration;
    playerRef.current.seekTo(newTime);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`no-drag-container w-full bg-black/90 rounded-xl overflow-hidden shadow-2xl border border-white/10 relative group cursor-pointer ${forceShowControls ? 'no-drag' : ''}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={() => {
        togglePlay();
        setShowControls(true);
      }}
    >
      <div className="relative w-full aspect-video bg-gray-950">
        <div ref={containerRef} className="w-full h-full pointer-events-none" />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80 z-20">
            <div className="w-12 h-12 border-4 border-gray-700 border-t-red-600 rounded-full animate-spin" />
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-30 p-6 text-center">
            <p className="text-red-500 font-bold mb-2 text-sm">VIDEO UNAVAILABLE</p>
            <p className="text-gray-400 text-[10px] leading-tight">This video might be restricted or deleted by YouTube.</p>
          </div>
        )}
      </div>

      {title && (
        <div className={`absolute top-0 left-0 right-0 px-4 pt-3 pb-6 bg-gradient-to-b from-black/90 to-transparent text-white text-[10px] font-bold tracking-widest uppercase italic z-40 transition-all duration-300 pointer-events-none ${(showControls || forceShowControls) ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
          <span className="text-red-500 mr-2">●</span> NOW PLAYING: {title}
        </div>
      )}

      <div className={`no-drag absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent px-4 py-3 pb-4 space-y-3 z-40 transition-all duration-300 ${(showControls || forceShowControls) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div
          onClick={(e) => { e.stopPropagation(); handleProgressClick(e); }}
          className="no-drag w-full h-1.5 bg-white/20 rounded-full cursor-pointer hover:h-2 transition-all group/progress relative"
        >
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full relative z-10"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
          <div className="absolute inset-0 bg-red-600 opacity-20 blur-sm rounded-full" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              disabled={isLoading}
              className="no-drag p-2 hover:bg-white/10 rounded-full transition-all active:scale-90 disabled:opacity-50"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-600 border-t-red-500 rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause size={22} className="fill-red-500 text-red-500" />
              ) : (
                <Play size={22} className="fill-red-500 text-red-500" />
              )}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              className="no-drag p-2 hover:bg-white/10 rounded-full transition-all active:scale-90 text-slate-300 hover:text-white"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>

          <div className="text-[10px] font-mono text-slate-300 tracking-tighter">
            {formatTime(currentTime)} <span className="mx-1 opacity-40">/</span> {formatTime(duration)}
          </div>
        </div>
      </div>
    </div>
  );
}
