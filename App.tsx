import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameStatus, PlayerState } from './types';
import GameScene from './components/GameScene';
import UI from './components/UI';
import { generateBattleCommentary } from './services/geminiService';

// Default initial state for a player
const initialPlayerState = (id: number): PlayerState => ({
    id, 
    position: { x: 0, y: 0, z: 0 }, 
    rotation: 0, 
    velocity: { x: 0, y: 0, z: 0 },
    health: 100, 
    color: '', 
    name: '', 
    cooldown: 0,
    damageLevel: 1,
    shotCount: 1
});

const App: React.FC = () => { 
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  
  // We keep a local copy of player states for UI rendering
  const [p1State, setP1State] = useState<PlayerState>(initialPlayerState(1));
  const [p2State, setP2State] = useState<PlayerState>(initialPlayerState(2));
  
  const [commentary, setCommentary] = useState<string>("Loading report from the North Pole...");
  const [gameKey, setGameKey] = useState(0);

  const handleStart = () => {
    setStatus(GameStatus.PLAYING);
    // Reset specific UI values if needed, but GameScene handles logic reset via key
  };

  const handleGameOver = useCallback(async (losingPlayerId: number) => {
    const winningId = losingPlayerId === 1 ? 2 : 1;
    setWinnerId(winningId);
    setStatus(GameStatus.GAME_OVER);
    
    const winnerName = winningId === 1 ? "Santa Red" : "Elf Green";
    const loserName = winningId === 1 ? "Elf Green" : "Santa Red";
    
    setCommentary("Generating battle report...");
    const text = await generateBattleCommentary(winnerName, loserName);
    setCommentary(text);
  }, []);

  const handleRestart = () => {
    setGameKey(k => k + 1);
    setStatus(GameStatus.PLAYING);
    setWinnerId(null);
    setP1State(initialPlayerState(1));
    setP2State(initialPlayerState(2));
  };

  const handleStatsUpdate = useCallback((p1: PlayerState, p2: PlayerState) => {
    // We can throttle this if performance becomes an issue, but for this simple app direct update is fine
    setP1State(p1);
    setP2State(p2);
  }, []);

  return (
    <div className="relative w-full h-screen bg-slate-900">
      <Canvas shadows camera={{ position: [0, 20, 20], fov: 45 }}>
        <GameScene 
            key={gameKey}
            status={status} 
            onGameOver={handleGameOver} 
            onStatsUpdate={handleStatsUpdate}
        />
      </Canvas>
      
      <UI 
        status={status} 
        p1={p1State} 
        p2={p2State} 
        winnerId={winnerId}
        commentary={commentary}
        onStart={handleStart}
        onRestart={handleRestart}
      />
    </div>
  );
};

export default App;