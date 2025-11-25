import React from 'react';
import { MapSize } from '../types';
import { Snowflake, Users, Map as MapIcon, Play } from 'lucide-react';
import { VEMAT_LOGO_URL } from '../constants';
import { SnowOverlay } from './SnowOverlay';

interface MenuProps {
  onStart: (players: number, mapSize: MapSize) => void;
}

export const Menu: React.FC<MenuProps> = ({ onStart }) => {
  const [players, setPlayers] = React.useState<number>(2);
  const [mapSize, setMapSize] = React.useState<MapSize>(MapSize.SMALL);

  return (
    <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center z-50 text-white backdrop-blur-sm overflow-hidden">
      {/* Snow Effect */}
      <SnowOverlay />

      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border-4 border-slate-700 max-w-md w-full relative z-10">
        <div className="text-center mb-8 flex flex-col items-center">
            {/* LOGO */}
           <div className="mb-4 bg-white p-2 rounded-lg w-full max-w-[200px] flex justify-center">
                <img src={VEMAT_LOGO_URL} alt="Vemat Logo" className="h-12 object-contain" />
           </div>
           
           <div className="flex justify-center mb-2">
             <Snowflake className="w-10 h-10 text-blue-400 animate-spin-slow" />
           </div>
           <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent">
             VEMAT SNOWBALL FIGHT
           </h1>
        </div>

        <div className="space-y-6">
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

          <button 
            onClick={() => onStart(players, mapSize)}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-3 transition-colors text-xl shadow-lg shadow-red-900/50"
          >
            <Play className="fill-white" /> GRAJ
          </button>
        </div>
      </div>
    </div>
  );
};