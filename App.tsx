import React, { useState, useEffect, useRef } from 'react';
import { Menu } from './components/Menu';
import { Viewport } from './components/Viewport';
import { useGameEngine } from './hooks/useGameEngine';
import { MapSize, GameMode } from './types';
import { Pause, LogOut, Play, Volume2, VolumeX } from 'lucide-react';
import { MUSIC_URL, TEAM_COLORS } from './constants';

const App = () => {
  const [gameActive, setGameActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [config, setConfig] = useState({ players: 2, mapSize: MapSize.SMALL, gameMode: GameMode.DEATHMATCH });
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { gameState, initGame } = useGameEngine(config.players, config.mapSize, config.gameMode, gameActive, isPaused);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio(MUSIC_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    
    return () => {
        if(audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
  }, []);

  // Handle Play/Pause of Music
  useEffect(() => {
    if (!audioRef.current) return;

    if (gameActive && !isPaused && !isMuted) {
        audioRef.current.play().catch((e) => console.log("Audio play blocked by browser policy until interaction", e));
    } else {
        audioRef.current.pause();
    }
  }, [gameActive, isPaused, isMuted]);

  const handleStart = (players: number, mapSize: MapSize, gameMode: GameMode) => {
    setConfig({ players, mapSize, gameMode });
    setGameActive(true);
    setIsPaused(false);
  };

  const handleQuit = () => {
    setGameActive(false);
    setIsPaused(false);
  };

  // Escape Key Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && gameActive && !gameState?.isGameOver) {
        setIsPaused(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameActive, gameState?.isGameOver]);

  const getWinnerName = () => {
    if (!gameState) return "";
    if (config.gameMode === GameMode.CTF) {
        return gameState.winningTeam === 0 ? "DRUŻYNA CZERWONA" : "DRUŻYNA NIEBIESKA";
    } else {
        return gameState.players.find(p => p.id === gameState.winnerId)?.name || "GRACZ";
    }
  };
  
  const getWinnerColor = () => {
     if (!gameState) return "#fff";
     if (config.gameMode === GameMode.CTF) {
         return gameState.winningTeam === 0 ? TEAM_COLORS[0] : TEAM_COLORS[1];
     } else {
         return gameState.players.find(p => p.id === gameState.winnerId)?.color;
     }
  };

  return (
    <div className="w-full h-screen bg-slate-900 relative">
      {!gameActive && <Menu onStart={handleStart} />}
      
      {gameActive && gameState && (
        <>
            <div className="flex flex-wrap w-full h-full relative z-0">
            {gameState.players.map((p, i) => (
                <Viewport 
                key={p.id}
                gameState={gameState}
                player={p}
                screenId={i}
                totalScreens={gameState.players.length}
                />
            ))}
            </div>

            {/* Mute Button (always visible in game) */}
            <button 
                onClick={() => setIsMuted(prev => !prev)}
                className="absolute bottom-4 left-4 z-40 p-2 bg-slate-800/80 text-white rounded-full hover:bg-slate-700 transition-colors border border-slate-600"
                title={isMuted ? "Włącz muzykę" : "Wycisz muzykę"}
            >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* PAUSE MENU */}
            {isPaused && !gameState.isGameOver && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
                     <div className="bg-slate-800 p-8 rounded-2xl border-4 border-slate-600 shadow-2xl max-w-sm w-full text-center">
                        <div className="flex justify-center mb-4">
                             <Pause className="w-16 h-16 text-blue-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-8">PAUZA</h2>
                        
                        <div className="space-y-4">
                            <button 
                                onClick={() => setIsPaused(false)}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
                            >
                                <Play className="w-5 h-5 fill-current" /> WZNÓW GRĘ
                            </button>
                            
                            <button 
                                onClick={handleQuit}
                                className="w-full bg-slate-700 hover:bg-red-600/80 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
                            >
                                <LogOut className="w-5 h-5" /> WYJDŹ DO MENU
                            </button>
                        </div>
                     </div>
                </div>
            )}

            {/* GAME OVER SCREEN */}
            {gameState.isGameOver && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-800 p-8 rounded-2xl border-4 border-yellow-500 text-center max-w-lg shadow-2xl shadow-yellow-500/20">
                        <h2 className="text-5xl font-black text-yellow-400 mb-4 drop-shadow-lg">KONIEC GRY!</h2>
                        <div className="text-2xl text-white mb-8">
                            Wygrywa <span className="font-bold underline decoration-4 underline-offset-4" style={{color: getWinnerColor()}}>
                                {getWinnerName()}
                            </span>
                        </div>
                        <button 
                            onClick={handleQuit}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg shadow-blue-900/50"
                        >
                            Wróć do Menu
                        </button>
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default App;
