import React, { useEffect } from 'react';
import { GameStatus, PlayerState } from '../types';
import { RefreshCw, Play, Trophy, Heart, Zap, Flame, Snowflake } from 'lucide-react';

interface UIProps {
  status: GameStatus;
  p1: PlayerState;
  p2: PlayerState;
  winnerId: number | null;
  commentary: string;
  onStart: () => void;
  onRestart: () => void;
}

const UI: React.FC<UIProps> = ({ status, p1, p2, winnerId, commentary, onStart, onRestart }) => {

  // ENTER restartuje grę globalnie, gdy jest GAME_OVER
  useEffect(() => {
    if (status !== GameStatus.GAME_OVER) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onRestart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, onRestart]);

  if (status === GameStatus.MENU) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm">
        <div className="bg-white/10 p-8 rounded-2xl border border-white/20 text-center shadow-2xl max-w-md">
          <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            🛷 VEMAT BATTLE
          </h1>
          <div className="space-y-4 text-gray-200 mb-8 text-left text-sm bg-black/20 p-4 rounded-lg">
            <p className="font-bold text-red-400">Gracz 1 (Czerwony)</p>

            <div className="h-px bg-white/20 my-2"></div>
            <p className="font-bold text-green-400">Gracz 2 (Zielony)</p>
            <div className="h-px bg-white/20 my-2"></div>
            <p className="font-bold text-yellow-400">Stałe bonusy</p>
            <div className="flex gap-4 text-xs flex-wrap">
              <span className="flex items-center">
                <div className="w-3 h-3 bg-green-500 mr-1"></div> Życie (+30 HP)
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 bg-red-500 mr-1"></div> Atak Lvl Up
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 mr-1"></div> Multi-Atak (+1 Śnieżek)
              </span>
            </div>
          </div>
          <button
            
            onClick={onStart}
            className="group relative inline-flex items-center justify-center px-8 py-3 font-bold text-white transition-all duration-200 bg-red-600 font-lg rounded-full hover:bg-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] focus:outline-none ring-offset-2 focus:ring-2 ring-red-400"
          >
            <Play className="w-5 h-5 mr-2 fill-current" />
            Start
          </button>
        </div>
      </div>
    );
  }

  if (status === GameStatus.GAME_OVER) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50 backdrop-blur-md">
        <div className="bg-slate-900/90 p-8 rounded-2xl border border-blue-500/30 text-center shadow-2xl max-w-lg w-full mx-4">
          <Trophy className="w-16 h-16 mx-auto text-yellow-400 mb-4 animate-bounce" />
          <h2 className="text-4xl font-bold text-white mb-2">
            {winnerId === 1 ? (
              <span className="text-red-500">Gracz 1 Wygrywa!</span>
            ) : (
              <span className="text-green-500">Gracz 2 Wygrywa!</span>
            )}
          </h2>

          <button
            onClick={onRestart}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold transition-all shadow-lg hover:shadow-blue-500/25 mt-4"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Zagraj jeszcze raz! (X)
          </button>
        </div>
      </div>
    );
  }

  // Helper to render stats
  const renderStats = (p: PlayerState) => (
    <div className="flex gap-2 mt-2">
      <div className="flex items-center px-3 py-1 bg-red-900/60 rounded-full text-white text-xs font-bold border border-red-500/30">
        <Flame className="w-3 h-3 mr-1 text-red-400" />
        DMG x{p.damageLevel}
      </div>
      <div className="flex items-center px-3 py-1 bg-blue-900/60 rounded-full text-white text-xs font-bold border border-blue-500/30">
        <Snowflake className="w-3 h-3 mr-1 text-blue-400" />
        SHOT x{p.shotCount}
      </div>
    </div>
  );

  // HUD
  return (
    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-10">
      {/* Player 1 HUD */}
      <div className="flex flex-col items-start w-64">
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-2 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
          <span className="text-white font-bold text-lg shadow-black drop-shadow-md">Gracz 1</span>
        </div>
        <div className="w-full h-4 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
            style={{ width: `${Math.max(0, p1.health)}%` }}
          />
        </div>
        {renderStats(p1)}
      </div>

      {/* VS Badge */}
      <div className="mt-2 font-black text-2xl text-white/20 tracking-widest">VS</div>

      {/* Player 2 HUD */}
      <div className="flex flex-col items-end w-64">
        <div className="flex items-center mb-1">
          <span className="text-white font-bold text-lg shadow-black drop-shadow-md">Gracz 2</span>
          <div className="w-3 h-3 rounded-full bg-green-500 ml-2 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
        </div>
        <div className="w-full h-4 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
          <div
            className="h-full bg-gradient-to-l from-green-600 to-green-400 transition-all duration-300"
            style={{ width: `${Math.max(0, p2.health)}%` }}
          />
        </div>
        {renderStats(p2)}
      </div>
    </div>
  );
};

export default UI;
