import { useState, useEffect } from 'react';
import { createSession, getSession } from '../lib/api';
import { Play, Link as LinkIcon, Trash2, ChevronDown, Gamepad2, Music, Trophy, Star, Sparkles } from 'lucide-react';
import { GameMode, GAME_MODE_INFO } from '../lib/gameModes';

interface RecentSession {
  id: string;
  date: string;
}

interface HomeScreenProps {
  onStartSession: (sessionId: string, mode: GameMode) => void;
}

export function HomeScreen({ onStartSession }: HomeScreenProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [sessionInput, setSessionInput] = useState('');
  const [error, setError] = useState('');

  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [selectedMode, setSelectedMode] = useState<GameMode>('all');
  const [showResume, setShowResume] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('soundtrackShowdown_recentSessions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const migrated: RecentSession[] = parsed.map((item: any) =>
          typeof item === 'string' ? { id: item, date: new Date().toISOString() } : item
        );
        setRecentSessions(migrated);
      } catch (e) { }
    }
  }, []);

  const saveToRecent = (id: string) => {
    if (id === 'tutorial') return;
    const now = new Date().toISOString();
    setRecentSessions((prev) => {
      const filtered = prev.filter(s => s.id !== id);
      const updated = [{ id, date: now }, ...filtered].slice(0, 5);
      localStorage.setItem('soundtrackShowdown_recentSessions', JSON.stringify(updated));
      return updated;
    });
  };

  const removeSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSessions((prev) => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('soundtrackShowdown_recentSessions', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCreateSession = async () => {
    setIsCreating(true);
    setError('');
    try {
      const session = await createSession();
      if (session) {
        saveToRecent(session.session_id);
        onStartSession(session.session_id, selectedMode);
      } else {
        setError('Failed to create session');
      }
    } catch (err) {
      setError('Error creating session');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleResumeSession = async () => {
    setError('');
    if (!sessionInput.trim()) {
      setError('Introduce un ID de sesión');
      return;
    }
    try {
      const session = await getSession(sessionInput);
      if (session) {
        saveToRecent(session.session_id);
        onStartSession(session.session_id, 'all');
      } else {
        setError('Sesión no encontrada');
      }
    } catch (err) {
      setError('Error cargando sesión');
      console.error(err);
    }
  };

  const resumeSpecificSession = async (id: string) => {
    setError('');
    try {
      const session = await getSession(id);
      if (session) {
        saveToRecent(session.session_id);
        onStartSession(session.session_id, 'all');
      } else {
        setError('Sesión expirada o no encontrada');
        setRecentSessions(prev => {
          const updated = prev.filter(s => s.id !== id);
          localStorage.setItem('soundtrackShowdown_recentSessions', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      setError('Error cargando sesión');
      console.error(err);
    }
  };

  return (
    <div className="mario-gradient min-h-screen relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[100px] animate-float" style={{ background: 'var(--mario-red)', top: '-10%', left: '-10%' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.07] blur-[100px] animate-float" style={{ background: 'var(--mario-blue)', bottom: '-10%', right: '-10%', animationDelay: '2s' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-[0.05] blur-[80px] animate-float" style={{ background: 'var(--mario-yellow)', top: '30%', right: '20%', animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-8 md:py-16">
        {/* Hero Section */}
        <div className="text-center mb-10 md:mb-14 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 backdrop-blur-md">
            <Sparkles size={12} className="text-yellow-400" />
            Soundtrack Ranker
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-white tracking-tighter font-display leading-[0.9] mb-4">
            Soundtrack
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400">
              Showdown
            </span>
          </h1>

          <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed mt-4">
            Escucha, compara y clasifica las melodías más icónicas de la saga Mario.
            ¿Cuál merece el <span className="text-white font-semibold">número uno</span>?
          </p>
        </div>

        {/* Mode Selector & Start */}
        <div className="w-full max-w-2xl mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {(Object.entries(GAME_MODE_INFO) as [GameMode, typeof GAME_MODE_INFO['all']][]).map(([mode, info]) => (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left backdrop-blur-md overflow-hidden ${selectedMode === mode
                  ? 'border-blue-500/70 bg-blue-500/10 shadow-[0_0_40px_rgba(59,130,246,0.15)] scale-[1.02]'
                  : 'border-white/[0.07] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
              >
                {/* Glint effect on selected */}
                {selectedMode === mode && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-glint" />
                )}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{info.icon}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedMode === mode ? 'border-blue-400 bg-blue-500' : 'border-white/20'
                      }`}>
                      {selectedMode === mode && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                  <div className="text-white font-black text-base uppercase tracking-wider mb-1">{info.label}</div>
                  <div className="text-slate-400 text-xs leading-relaxed">{info.description}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Start Button */}
          <button
            onClick={handleCreateSession}
            disabled={isCreating}
            className="group relative w-full py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-sm flex items-center justify-center gap-3 overflow-hidden transition-all duration-300 active:scale-[0.97] disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #e52521, #dc2626, #b91c1c)',
              boxShadow: '0 0 40px rgba(229, 37, 33, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Play size={22} fill="currentColor" className="relative z-10" />
            <span className="relative z-10 text-white">{isCreating ? 'Creando sesión...' : 'Empezar a Puntuar'}</span>
          </button>

          {/* Tutorial link */}
          <button
            onClick={() => onStartSession('tutorial', 'all')}
            className="w-full mt-3 py-2.5 text-[11px] text-slate-500 hover:text-slate-300 font-bold uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2"
          >
            <Gamepad2 size={14} />
            Tutorial Interactivo
          </button>
        </div>

        {/* Stats ribbon */}
        <div className="w-full max-w-2xl flex items-center justify-center gap-6 md:gap-10 mb-10 py-4 border-t border-b border-white/[0.06]">
          {[
            { icon: Music, label: '250+ Temas', sub: 'Verificados' },
            { icon: Trophy, label: '30+ Juegos', sub: 'Mario & Smash' },
            { icon: Star, label: '2 Modos', sub: 'Clásicos & Completo' },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-2.5 text-center">
              <stat.icon size={18} className="text-slate-600" />
              <div>
                <div className="text-white font-bold text-xs">{stat.label}</div>
                <div className="text-slate-500 text-[10px] uppercase tracking-wider">{stat.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Resume Session (Collapsible) */}
        <div className="w-full max-w-2xl mb-6">
          <button
            onClick={() => setShowResume(!showResume)}
            className="w-full flex items-center justify-between py-3 px-5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] transition-all text-sm"
          >
            <span className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              <LinkIcon size={14} />
              Continuar Sesión
            </span>
            <ChevronDown size={16} className={`text-slate-500 transition-transform duration-300 ${showResume ? 'rotate-180' : ''}`} />
          </button>

          {showResume && (
            <div className="mt-3 p-5 rounded-xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-md space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={sessionInput}
                  onChange={(e) => { setSessionInput(e.target.value); setError(''); }}
                  placeholder="Pega tu ID de sesión..."
                  className="flex-1 px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-xs"
                />
                <button
                  onClick={handleResumeSession}
                  className="px-5 py-3 bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl font-bold uppercase tracking-wider text-xs shrink-0 transition-colors"
                >
                  Cargar
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-medium text-center">
                  {error}
                </div>
              )}

              {recentSessions.length > 0 && (
                <div className="pt-3 border-t border-white/[0.06]">
                  <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3">Recientes</h4>
                  <div className="space-y-2">
                    {recentSessions.map(session => (
                      <div key={session.id} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3 hover:bg-white/[0.06] transition-colors">
                        <div>
                          <span className="font-mono text-[11px] text-slate-300 block">{session.id.replace('session_', '').substring(0, 16)}...</span>
                          <span className="text-[9px] text-slate-600">{new Date(session.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => resumeSpecificSession(session.id)}
                            className="text-blue-400 hover:text-blue-300 font-bold uppercase text-[10px] tracking-wider px-3 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20 transition-all hover:bg-blue-500/20 active:scale-95"
                          >
                            Abrir
                          </button>
                          <button
                            onClick={(e) => removeSession(session.id, e)}
                            className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* How to Play (Collapsible) */}
        <div className="w-full max-w-2xl mb-10">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between py-3 px-5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] transition-all text-sm"
          >
            <span className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              <Gamepad2 size={14} />
              Cómo Jugar
            </span>
            <ChevronDown size={16} className={`text-slate-500 transition-transform duration-300 ${showGuide ? 'rotate-180' : ''}`} />
          </button>

          {showGuide && (
            <div className="mt-3 p-6 rounded-xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-blue-400 font-black text-xs uppercase tracking-widest flex items-center gap-2 mb-4">
                    <span className="text-base">🎴</span> Con la Tarjeta
                  </h4>
                  <ul className="space-y-3 text-xs text-slate-400">
                    <li><span className="text-white font-semibold">Abanico:</span> Arrastra hacia los lados para navegar por posiciones y suelta para colocar.</li>
                    <li><span className="text-white font-semibold">Preview:</span> Mantén quieta la tarjeta sobre una posición para comparar audio.</li>
                    <li><span className="text-white font-semibold">Bloquear:</span> Desliza arriba para fijar la tarjeta y escuchar sin pulsar.</li>
                    <li><span className="text-white font-semibold">Extremos:</span> Desliza rápido a izquierda (Omitir) o derecha (Top #1).</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-yellow-400 font-black text-xs uppercase tracking-widest flex items-center gap-2 mb-4">
                    <span className="text-base">📝</span> Con la Lista
                  </h4>
                  <ul className="space-y-3 text-xs text-slate-400">
                    <li><span className="text-white font-semibold">Colocar:</span> Bloquea la tarjeta y pulsa en la lista para insertar directamente.</li>
                    <li><span className="text-white font-semibold">Reordenar:</span> Usa el icono de agarre para mover canciones arriba o abajo.</li>
                    <li><span className="text-white font-semibold">Escuchar:</span> Pulsa "Play" en cualquier canción de la lista.</li>
                    <li><span className="text-white font-semibold">Terminar:</span> Pulsa "Terminar" para ver tus resultados.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-slate-600 text-[10px] font-medium uppercase tracking-[0.3em] mt-auto pb-4">
          Super Mario Bros — The Complete Soundtracks
        </div>
      </div>
    </div>
  );
}
