import React from 'react';
import { MapSize, GameMode } from '../types';
import { Snowflake, Users, Map as MapIcon, Play, Flag, Crosshair } from 'lucide-react';
import { VEMAT_LOGO_URL } from '../constants';
import { SnowOverlay } from './SnowOverlay';

interface MenuProps {
  onStart: (players: number, mapSize: MapSize, gameMode: GameMode) => void;
}

export const Menu: React.FC<MenuProps> = ({ onStart }) => {
  const [players, setPlayers] = React.useState<number>(2);
  const [mapSize, setMapSize] = React.useState<MapSize>(MapSize.SMALL);
  const [gameMode, setGameMode] = React.useState<GameMode>(GameMode.DEATHMATCH);

  // Auto-select large map for CTF
  React.useEffect(() => {
    if (gameMode === GameMode.CTF) {
      setMapSize(MapSize.LARGE);
      if (players < 4) setPlayers(4); // Suggest 4 players for CTF
    }
  }, [gameMode]);

  return (
    <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center z-50 text-white backdrop-blur-sm overflow-hidden">
      {/* Snow Effect */}
      <SnowOverlay />

      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border-4 border-slate-700 max-w-2xl w-full relative z-10 flex gap-8">
        
        {/* Left Column */}
        <div className="flex-1 space-y-6">
            <div className="text-center mb-6">
                 {/* LOGO */}
                <div className="mb-4 bg-white p-2 rounded-lg w-full mx-auto max-w-[180px] flex justify-center">
                        <img src={VEMAT_LOGO_URL} alt="Vemat Logo" className="h-10 object-contain" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent">
                    Świąteczna Bitwa
                </h1>
            </div>

             {/* Game Mode */}
            <div>
                <label className="flex items-center gap-2 text-lg font-semibold mb-3">
                <Flag className="w-5 h-5 text-red-400" /> Tryb Gry
                </label>
                <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => setGameMode(GameMode.DEATHMATCH)}
                    className={`p-4 rounded-xl border-2 transition-all ${gameMode === GameMode.DEATHMATCH ? 'border-red-500 bg-red-500/20 text-white' : 'border-slate-600 hover:border-slate-500 text-slate-400'}`}
                >
                    <div className="flex flex-col items-center">
                        <Crosshair className="w-6 h-6 mb-1" />
                        <span className="font-bold">Deathmatch</span>
                        <span className="text-xs opacity-70">Każdy na każdego</span>
                    </div>
                </button>
                <button 
                    onClick={() => setGameMode(GameMode.CTF)}
                    className={`p-4 rounded-xl border-2 transition-all ${gameMode === GameMode.CTF ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-slate-600 hover:border-slate-500 text-slate-400'}`}
                >
                    <div className="flex flex-col items-center">
                         <Flag className="w-6 h-6 mb-1" />
                        <span className="font-bold">Przejmij Flagę</span>
                        <span className="text-xs opacity-70">Drużynowo (3 pkt)</span>
                    </div>
                </button>
                </div>
            </div>

            <button 
                onClick={() => onStart(players, mapSize, gameMode)}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-3 transition-colors text-xl shadow-lg shadow-red-900/50 mt-4"
            >
                <Play className="fill-white" /> GRAJ
            </button>
        </div>

        {/* Right Column (Settings) */}
        <div className="flex-1 space-y-6 pt-4">
          
          {/* Player Count */}
          <div>
            <label className="flex items-center gap-2 text-lg font-semibold mb-3">
              <Users className="w-5 h-5 text-yellow-400" /> Liczba Graczy
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setPlayers(2)}
                className={`p-4 rounded-xl border-2 transition-all ${players === 2 ? 'border-green-500 bg-green-500/20 text-white' : 'border-slate-600 hover:border-slate-500 text-slate-400'}`}
              >
                <div className="text-2xl font-bold">2</div>
                <div className="text-sm">Pojedynek</div>
              </button>
              <button 
                onClick={() => setPlayers(4)}
                className={`p-4 rounded-xl border-2 transition-all ${players === 4 ? 'border-green-500 bg-green-500/20 text-white' : 'border-slate-600 hover:border-slate-500 text-slate-400'}`}
              >
                 <div className="text-2xl font-bold">4</div>
                 <div className="text-sm">Chaos</div>
              </button>
            </div>
          </div>

          {/* Map Size */}
          <div>
            <label className="flex items-center gap-2 text-lg font-semibold mb-3">
              <MapIcon className="w-5 h-5 text-blue-400" /> Rozmiar Mapy
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                 onClick={() => setMapSize(MapSize.SMALL)}
                 className={`p-4 rounded-xl border-2 transition-all ${mapSize === MapSize.SMALL ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-slate-600 hover:border-slate-500 text-slate-400'}`}
                 disabled={gameMode === GameMode.CTF}
              >
                <div className="font-bold">Mała</div>
                <div className="text-xs text-slate-400 mt-1">Szybka akcja</div>
              </button>
              <button 
                 onClick={() => setMapSize(MapSize.LARGE)}
                 className={`p-4 rounded-xl border-2 transition-all ${mapSize === MapSize.LARGE ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-slate-600 hover:border-slate-500 text-slate-400'}`}
              >
                <div className="font-bold">Duża</div>
                 <div className="text-xs text-slate-400 mt-1">Taktyczna</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
