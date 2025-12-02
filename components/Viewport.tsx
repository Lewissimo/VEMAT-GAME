import React, { useRef } from 'react';
import { GameState, Player, Snowball, Tree, PowerUp, VendingMachine, Bomb, GameMode, Flag, FlagStatus, PowerUpType } from '../types';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Billboard, Stars, PerspectiveCamera, Sparkles, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { Heart, Trophy, Bomb as BombIcon, Flag as FlagIcon } from 'lucide-react';
import { POWERUP_CONFIG, VENDING_MACHINE_SIZE, TEAM_COLORS, CTF_STATS } from '../constants';

interface ViewportProps {
  gameState: GameState;
  player: Player;
  screenId: number;
  totalScreens: number;
}

// --- 3D Components ---

const Ground: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, -1, height / 2]} receiveShadow>
      <planeGeometry args={[width + 1000, height + 1000]} />
      <meshStandardMaterial color="#f1f5f9" roughness={0.8} metalness={0.1} />
    </mesh>
  );
};

const BaseZone: React.FC<{ position: {x: number, y: number}, color: string }> = ({ position, color }) => {
    return (
        <group position={[position.x, 0.5, position.y]}>
            <mesh rotation={[-Math.PI/2, 0, 0]}>
                <ringGeometry args={[CTF_STATS.BASE_RADIUS - 5, CTF_STATS.BASE_RADIUS, 32]} />
                <meshBasicMaterial color={color} opacity={0.5} transparent />
            </mesh>
             <mesh rotation={[-Math.PI/2, 0, 0]}>
                <circleGeometry args={[CTF_STATS.BASE_RADIUS, 32]} />
                <meshBasicMaterial color={color} opacity={0.1} transparent />
            </mesh>
        </group>
    );
};

const FlagModel: React.FC<{ flag: Flag }> = ({ flag }) => {
    const color = TEAM_COLORS[flag.teamId as keyof typeof TEAM_COLORS];
    
    // Don't render if carried (it will be attached to player or just icon)
    // Actually, let's not render 3D model if carried, HUD handles it.
    if (flag.status === FlagStatus.CARRIED) return null;

    return (
        <group position={[flag.position.x, 0, flag.position.y]}>
            {/* Pole */}
            <mesh position={[0, 30, 0]} castShadow>
                <cylinderGeometry args={[2, 2, 60]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Flag cloth */}
            <mesh position={[0, 50, 0]}>
                <boxGeometry args={[25, 18, 2]} />
                <meshStandardMaterial color={color} />
            </mesh>
            {/* Light beacon */}
            <pointLight position={[0, 65, 0]} color={color} intensity={1} distance={200} />
            
            {/* Base */}
            <mesh position={[0, 1, 0]}>
                 <cylinderGeometry args={[5, 10, 2]} />
                 <meshStandardMaterial color="#555" />
            </mesh>
        </group>
    );
};

const PlayerModel: React.FC<{ player: Player; isSelf: boolean; gameState: GameState }> = ({ player, isSelf, gameState }) => {
  return (
    <group position={[player.position.x, player.z, player.position.y]} rotation={[0, -player.rotation, 0]}>
      {/* Sled Body */}
      <mesh position={[0, 5, 0]} castShadow>
        <boxGeometry args={[35, 10, 15]} />
        <meshStandardMaterial color={player.color} />
      </mesh>
      
      {/* Runners */}
      <mesh position={[0, 1, 10]}>
        <boxGeometry args={[35, 2, 2]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      <mesh position={[0, 1, -10]}>
        <boxGeometry args={[35, 2, 2]} />
        <meshStandardMaterial color="#555" />
      </mesh>

      {/* Character Body */}
      <mesh position={[-5, 15, 0]} castShadow>
        <capsuleGeometry args={[8, 15, 4, 8]} />
        <meshStandardMaterial color={player.color} roughness={0.5} />
      </mesh>
      
      {/* Head */}
      <mesh position={[-5, 26, 0]}>
        <sphereGeometry args={[7]} />
        <meshStandardMaterial color="#ffccaa" />
      </mesh>

      {/* Hat */}
      <mesh position={[-5, 32, 0]} rotation={[0, 0, -0.2]}>
        <coneGeometry args={[6, 12]} />
        <meshStandardMaterial color={isSelf ? "#ffffff" : "#333"} />
      </mesh>
      
      {/* Name Tag */}
      {!isSelf && (
         <Billboard position={[0, 50, 0]}>
           <Text fontSize={20} color={player.color} outlineWidth={1} outlineColor="black">
             {player.name}
           </Text>
         </Billboard>
      )}

      {/* Flag Carrier Indicator */}
      {player.hasFlag && (
          <group position={[0, 60, 0]}>
               <mesh position={[0, 0, 0]}>
                   <boxGeometry args={[10, 8, 2]} />
                   {/* Flag color is opposite of player team */}
                   <meshStandardMaterial color={player.teamId === 0 ? TEAM_COLORS[1] : TEAM_COLORS[0]} />
               </mesh>
               <mesh position={[-5, -10, 0]}>
                   <cylinderGeometry args={[1, 1, 20]} />
                   <meshStandardMaterial color="#333" />
               </mesh>
          </group>
      )}

      {/* Shield/Powerup Glow */}
      {player.activePowerUps.length > 0 && (
        <mesh position={[0, 10, 0]}>
          <sphereGeometry args={[25, 16, 16]} />
          <meshBasicMaterial color="white" transparent opacity={0.2} wireframe />
        </mesh>
      )}
    </group>
  );
};

const TreeModel: React.FC<{ tree: Tree }> = ({ tree }) => {
  return (
    <group position={[tree.position.x, 0, tree.position.y]}>
      <mesh position={[0, 15, 0]} castShadow>
        <cylinderGeometry args={[5, 8, 30]} />
        <meshStandardMaterial color="#5c4033" />
      </mesh>
      <mesh position={[0, 40, 0]} castShadow>
        <coneGeometry args={[tree.radius * 0.8, 60, 8]} />
        <meshStandardMaterial color="#166534" roughness={0.8} />
      </mesh>
      <mesh position={[0, 60, 0]} castShadow>
        <coneGeometry args={[tree.radius * 0.6, 50, 8]} />
        <meshStandardMaterial color="#15803d" roughness={0.8} />
      </mesh>
      <mesh position={[0, 65, 0]}>
         <coneGeometry args={[tree.radius * 0.4, 20, 8]} />
         <meshStandardMaterial color="white" />
      </mesh>
    </group>
  );
};

const VendingMachineModel: React.FC<{ vm: VendingMachine }> = ({ vm }) => {
    return (
        <group position={[vm.position.x, 0, vm.position.y]} rotation={[0, vm.rotation, 0]}>
            <mesh position={[0, VENDING_MACHINE_SIZE.height/2, 0]} castShadow>
                <boxGeometry args={[VENDING_MACHINE_SIZE.width, VENDING_MACHINE_SIZE.height, VENDING_MACHINE_SIZE.depth]} />
                <meshStandardMaterial color="#1f2937" metalness={0.6} roughness={0.2} />
            </mesh>
            <mesh position={[0, VENDING_MACHINE_SIZE.height/2 + 5, VENDING_MACHINE_SIZE.depth/2 + 1]}>
                <planeGeometry args={[VENDING_MACHINE_SIZE.width - 10, VENDING_MACHINE_SIZE.height - 25]} />
                <meshStandardMaterial color="#81dafc" emissive="#0ea5e9" emissiveIntensity={0.5} opacity={0.8} transparent />
            </mesh>
            <mesh position={[0, VENDING_MACHINE_SIZE.height - 10, VENDING_MACHINE_SIZE.depth/2 + 1.1]}>
                 <planeGeometry args={[VENDING_MACHINE_SIZE.width - 4, 15]} />
                 <meshStandardMaterial color="#f97316" />
            </mesh>
            <group position={[0, VENDING_MACHINE_SIZE.height - 10, VENDING_MACHINE_SIZE.depth/2 + 1.2]}>
               <Text fontSize={10} color="white" anchorX="center" anchorY="middle" fontWeight="bold">
                   VEMAT
               </Text>
            </group>
            <mesh position={[0, 10, VENDING_MACHINE_SIZE.depth/2 + 2]}>
                 <boxGeometry args={[VENDING_MACHINE_SIZE.width - 10, 10, 5]} />
                 <meshStandardMaterial color="#111" />
            </mesh>
             <pointLight position={[0, 60, 25]} color="#0ea5e9" intensity={0.5} distance={100} />
        </group>
    );
};

const SnowballModel: React.FC<{ sb: Snowball }> = ({ sb }) => {
  return (
    <mesh position={[sb.position.x, 10, sb.position.y]} castShadow>
      <sphereGeometry args={[5]} />
      <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
    </mesh>
  );
};

const BombModel: React.FC<{ bomb: Bomb }> = ({ bomb }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if(meshRef.current) {
            const scale = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.1;
            meshRef.current.scale.set(scale, scale, scale);
            const timeLeft = bomb.explodeAt - Date.now();
            if(timeLeft < 2000 && Math.floor(state.clock.elapsedTime * 10) % 2 === 0) {
                 (meshRef.current.material as THREE.MeshStandardMaterial).color.set('#ff0000');
            } else {
                 (meshRef.current.material as THREE.MeshStandardMaterial).color.set('#222222');
            }
        }
    });

    return (
        <mesh ref={meshRef} position={[bomb.position.x, 10, bomb.position.y]} castShadow>
            <sphereGeometry args={[12]} />
            <meshStandardMaterial color="#222" />
            <Sparkles count={10} scale={20} color="orange" size={2} speed={2} />
        </mesh>
    );
}

const CoffeeCupModel: React.FC = () => {
    const steamRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (steamRef.current) {
            steamRef.current.position.y = 8 + Math.sin(state.clock.elapsedTime * 2) * 1;
            steamRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.2;
            steamRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.2);
        }
    });
    return (
        <group scale={[2, 2, 2]}>
             {/* Cup */}
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[4, 3, 7]} />
                <meshStandardMaterial color="#fef3c7" />
            </mesh>
             {/* Coffee Liquid */}
             <mesh position={[0, 3.51, 0]} rotation={[-Math.PI/2, 0, 0]}>
                 <circleGeometry args={[3]} />
                 <meshStandardMaterial color="#3f2e22" />
             </mesh>
             {/* Handle */}
             <mesh position={[3, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                <torusGeometry args={[2, 0.6, 8, 16, Math.PI]} />
                <meshStandardMaterial color="#fef3c7" />
             </mesh>
             {/* Steam */}
             <group ref={steamRef}>
                 <Billboard position={[0, 0, 0]}>
                     <Text fontSize={6} color="#ddd" fillOpacity={0.6}>♨</Text>
                 </Billboard>
             </group>
        </group>
    );
};

const PowerUpModel: React.FC<{ pu: PowerUp }> = ({ pu }) => {
  const config = POWERUP_CONFIG[pu.type];
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.05;
      meshRef.current.position.y = 15 + Math.sin(state.clock.elapsedTime * 3) * 5;
    }
  });

  return (
    <group ref={meshRef} position={[pu.position.x, 15, pu.position.y]}>
      {pu.type === PowerUpType.COFFEE ? (
           <CoffeeCupModel />
      ) : (
        <>
            <mesh castShadow>
                <boxGeometry args={[20, 20, 20]} />
                <meshStandardMaterial color={config.color} metalness={0.5} roughness={0.2} emissive={config.color} emissiveIntensity={0.5} />
            </mesh>
            <Billboard position={[0, 25, 0]}>
                <Text fontSize={20} color="white" outlineWidth={1} outlineColor="black">
                {config.icon}
                </Text>
            </Billboard>
        </>
      )}
    </group>
  );
};

const SceneContent: React.FC<{ gameState: GameState; currentPlayerId: number }> = ({ gameState, currentPlayerId }) => {
  const player = gameState.players.find(p => p.id === currentPlayerId);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  useFrame((state) => {
    if (!player || !cameraRef.current) return;
    const targetX = player.position.x;
    const targetZ = player.position.y;
    const distance = 350;
    const height = 200;
    const idealX = targetX - Math.cos(player.rotation) * distance;
    const idealZ = targetZ - Math.sin(player.rotation) * distance;
    const currentPos = cameraRef.current.position;
    const t = 0.1; 
    currentPos.x += (idealX - currentPos.x) * t;
    currentPos.z += (idealZ - currentPos.z) * t;
    currentPos.y += (height - currentPos.y) * t;
    const lookAtX = targetX + Math.cos(player.rotation) * 100;
    const lookAtZ = targetZ + Math.sin(player.rotation) * 100;
    cameraRef.current.lookAt(lookAtX, 50, lookAtZ);
  });

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault fov={60} near={1} far={5000} />
      <ambientLight intensity={0.6} color="#dbeafe" />
      <directionalLight position={[1000, 2000, 500]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} color="#fff7ed" />
      <Stars radius={2000} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <Ground width={gameState.mapSize.width} height={gameState.mapSize.height} />
      
      {/* CTF Elements */}
      {gameState.gameMode === GameMode.CTF && gameState.flags && (
          <>
            {/* Draw Bases */}
            {gameState.flags.map(f => (
                <BaseZone key={`base-${f.teamId}`} position={f.homePosition} color={TEAM_COLORS[f.teamId as keyof typeof TEAM_COLORS]} />
            ))}
            {/* Draw Flags */}
            {gameState.flags.map(f => (
                <FlagModel key={`flag-${f.teamId}`} flag={f} />
            ))}
          </>
      )}

      {gameState.players.map(p => !p.isDead && (
        <PlayerModel key={p.id} player={p} isSelf={p.id === currentPlayerId} gameState={gameState} />
      ))}
      
      {gameState.trees.map(t => <TreeModel key={t.id} tree={t} />)}
      {gameState.vendingMachines.map(vm => <VendingMachineModel key={vm.id} vm={vm} />)}
      {gameState.snowballs.map(sb => <SnowballModel key={sb.id} sb={sb} />)}
      {gameState.powerUps.map(pu => <PowerUpModel key={pu.id} pu={pu} />)}
      {gameState.bombs.map(b => <BombModel key={b.id} bomb={b} />)}
    </>
  );
};

export const Viewport: React.FC<ViewportProps> = ({ gameState, player, screenId, totalScreens }) => {
  const isFourPlayers = totalScreens === 4;
  const viewportStyle: React.CSSProperties = {
     width: isFourPlayers ? '50%' : '100%',
     height: isFourPlayers ? '50%' : (totalScreens === 2 ? '50%' : '100%'),
     borderRight: (screenId === 0 || (isFourPlayers && screenId === 2)) ? '4px solid white' : 'none',
     borderBottom: (screenId === 0 || (isFourPlayers && screenId === 1)) ? '4px solid white' : 'none',
     position: 'relative',
     overflow: 'hidden',
     backgroundColor: '#0f172a',
  };

  return (
    <div style={viewportStyle} className="relative box-border border-slate-900">
      <Canvas shadows dpr={[1, 2]}>
         <SceneContent gameState={gameState} currentPlayerId={player.id} />
      </Canvas>

      {/* HUD Layer */}
      <div className="absolute top-4 left-4 z-20 bg-slate-900/60 text-white p-3 rounded-xl border border-white/20 backdrop-blur-md min-w-[180px]">
         <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: player.color, color: player.color }}></div>
            <span className="font-bold text-lg shadow-black drop-shadow-md">{player.name}</span>
         </div>
         
         <div className="space-y-2">
           <div className="flex items-center justify-between gap-4 text-sm font-medium">
              <div className="flex items-center gap-1 text-red-400">
                  <Heart className="w-4 h-4 fill-current" /> 
                  <span>{Math.ceil(player.health)}</span>
              </div>
              
              {/* Score Display (Differnet for CTF vs Deathmatch) */}
              {gameState.gameMode === GameMode.DEATHMATCH ? (
                 <div className="flex items-center gap-1 text-yellow-400">
                     <Trophy className="w-4 h-4 fill-current" /> 
                     <span>{player.score}</span>
                 </div>
              ) : (
                  // CTF Score is displayed globally at top, but local bomb count here
                  <div className="flex items-center gap-1 text-blue-300">
                     <span className="text-xs">Team {player.teamId === 0 ? "RED" : "BLUE"}</span>
                  </div>
              )}

              <div className="flex items-center gap-1 text-orange-400">
                   <BombIcon className="w-4 h-4 fill-current" />
                   <span>{player.bombCount}</span>
              </div>
           </div>

           {/* Flag Indicator for Player HUD */}
           {player.hasFlag && (
               <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 text-xs font-bold px-2 py-1 rounded text-center animate-pulse">
                   MASZ FLAGĘ! WRACAJ DO BAZY!
               </div>
           )}

           {player.activePowerUps.length > 0 && (
             <div className="flex gap-1 pt-1 border-t border-white/10">
               {player.activePowerUps.map((pu, i) => (
                 <div key={i} className="text-xs bg-white/20 px-1.5 py-0.5 rounded" title={pu.type}>
                    {POWERUP_CONFIG[pu.type].icon}
                 </div>
               ))}
             </div>
           )}
         </div>
      </div>

      {/* GLOBAL CTF SCOREBOARD (Visible on all screens in same spot, or per screen) */}
      {gameState.gameMode === GameMode.CTF && (
          <div className="absolute top-4 right-4 z-20 flex gap-4 bg-black/50 p-2 rounded-lg">
              <div className="flex items-center gap-2 text-red-500 font-bold text-xl">
                  <FlagIcon className="fill-current" /> {gameState.teamScores[0]}
              </div>
              <div className="text-white font-bold text-xl">-</div>
              <div className="flex items-center gap-2 text-blue-500 font-bold text-xl">
                  {gameState.teamScores[1]} <FlagIcon className="fill-current" />
              </div>
          </div>
      )}

      {/* Dead Message */}
      {player.isDead && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30 backdrop-blur-sm">
           <div className="text-center animate-bounce">
              <h2 className="text-4xl font-black text-red-500 stroke-white drop-shadow-lg">JESTEŚ ZAMROŻONY!</h2>
              <p className="text-white font-bold mt-2">Powrót za {Math.ceil(player.respawnTimer / 60)}s</p>
           </div>
        </div>
      )}
    </div>
  );
};
