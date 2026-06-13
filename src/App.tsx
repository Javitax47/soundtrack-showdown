import { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { RankingView } from './components/RankingView';
import { GameMode } from './lib/gameModes';

function App() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('all');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');

    if (sessionParam) {
      handleStartSession(sessionParam);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const savedSessionId = localStorage.getItem('soundtrackShowdown_sessionId');
      const savedMode = localStorage.getItem('soundtrackShowdown_gameMode') as GameMode | null;
      if (savedSessionId) {
        setCurrentSessionId(savedSessionId);
        if (savedMode) setGameMode(savedMode);
      }
    }
    setIsInitializing(false);
  }, []);

  const handleStartSession = (sessionId: string, mode: GameMode = 'all') => {
    localStorage.setItem('soundtrackShowdown_sessionId', sessionId);
    localStorage.setItem('soundtrackShowdown_gameMode', mode);
    setGameMode(mode);
    setCurrentSessionId(sessionId);
  };

  const handleNewSession = () => {
    localStorage.removeItem('soundtrackShowdown_sessionId');
    localStorage.removeItem('soundtrackShowdown_gameMode');
    setCurrentSessionId(null);
    setGameMode('all');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentSessionId ? (
        <RankingView
          sessionId={currentSessionId}
          gameMode={gameMode}
          onRestart={() => {
            handleNewSession();
          }}
        />
      ) : (
        <HomeScreen onStartSession={handleStartSession} />
      )}
    </>
  );
}

export default App;
