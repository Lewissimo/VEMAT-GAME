import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, Sparkles, Text, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { PlayerState, Snowball, GameStatus, Bonus, BonusType } from '../types';
import { Tree, Sleigh, Snowman, BonusItem } from './AssetLibrary';

// --- Constants ---
const MAP_SIZE = 40;
const PLAYER_SPEED = 10;
const ROTATION_SPEED = 3;
const FRICTION = 0.95;
const ACCELERATION = 0.5;
const SNOWBALL_SPEED = 20;
const PLAYER_RADIUS = 0.8;
const TREE_RADIUS = 0.5;
const SNOWBALL_RADIUS = 0.3;
const BONUS_RADIUS = 1.0;

const DEFAULT_COOLDOWN = 10; // Fast shooting by default
const BASE_DAMAGE = 10;

const SPAWN_INTERVAL_FRAMES = 300; // ~5 seconds
const MAX_BONUSES = 5;

interface GameSceneProps {
  status: GameStatus;
  onGameOver: (winnerId: number) => void;
  onStatsUpdate: (p1: PlayerState, p2: PlayerState) => void;
}

const GameScene: React.FC<GameSceneProps> = ({ status, onGameOver, onStatsUpdate }) => {
  const { camera } = useThree();
  
  // --- Game State Refs (Mutable for performance) ---
  const players = useRef<PlayerState[]>([
    { 
      id: 1, 
      position: { x: -10, y: 0, z: 0 }, 
      rotation: Math.PI / 2, 
      velocity: { x: 0, y: 0, z: 0 }, 
      health: 100, 
      color: '#ef4444', 
      name: 'Santa Red', 
      cooldown: 0,
      damageLevel: 1,
      shotCount: 1
    },
    { 
      id: 2, 
      position: { x: 10, y: 0, z: 0 }, 
      rotation: -Math.PI / 2, 
      velocity: { x: 0, y: 0, z: 0 }, 
      health: 100, 
      color: '#22c55e', 
      name: 'Elf Green', 
      cooldown: 0,
      damageLevel: 1,
      shotCount: 1
    },
  ]);
  
  const snowballs = useRef<Snowball[]>([]);
  const bonusesRef = useRef<Bonus[]>([]);
  const keys = useRef<{ [key: string]: boolean }>({});
  
  // State only for rendering bonuses as they appear/disappear infrequently
  const [activeBonuses, setActiveBonuses] = useState<Bonus[]>([]);
  
  const spawnTimer = useRef(0);

  // --- Map Generation ---
  const trees = useMemo(() => {
    const items = [];
    for (let i = 0; i < 30; i++) {
      const x = (Math.random() - 0.5) * MAP_SIZE * 0.8;
      const z = (Math.random() - 0.5) * MAP_SIZE * 0.8;
      // Keep center clear
      if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
      items.push({ x, z, type: Math.random() > 0.8 ? 'snowman' : 'tree' });
    }
    return items;
  }, []);

  // --- Input Handling ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // --- Helper Functions ---
  const checkCollision = (p1: {x: number, z: number}, r1: number, p2: {x: number, z: number}, r2: number) => {
    const dx = p1.x - p2.x;
    const dz = p1.z - p2.z;
    return (dx * dx + dz * dz) < (r1 + r2) * (r1 + r2);
  };

  // --- Game Loop ---
  useFrame((state, delta) => {
    if (status !== GameStatus.PLAYING) return;

    // 0. Bonus Spawning
    spawnTimer.current++;
    if (spawnTimer.current > SPAWN_INTERVAL_FRAMES && bonusesRef.current.length < MAX_BONUSES) {
      spawnTimer.current = 0;
      const x = (Math.random() - 0.5) * MAP_SIZE * 0.9;
      const z = (Math.random() - 0.5) * MAP_SIZE * 0.9;
      
      // Basic check to avoid spawning inside a tree
      const hitsTree = trees.some(t => checkCollision({x, z}, BONUS_RADIUS, {x: t.x, z: t.z}, TREE_RADIUS));
      
      if (!hitsTree) {
        const types = [BonusType.HEALTH, BonusType.DAMAGE, BonusType.MULTI_SHOT];
        const type = types[Math.floor(Math.random() * types.length)];
        const newBonus: Bonus = {
          id: Math.random().toString(),
          type,
          position: { x, y: 0, z }
        };
        bonusesRef.current.push(newBonus);
        setActiveBonuses([...bonusesRef.current]);
      }
    }

    // 1. Update Players
    players.current.forEach(p => {
      // Input Mapping
      let turn = 0;
      let accel = 0;
      let shoot = false;

      if (p.id === 1) {
        if (keys.current['KeyA']) turn += 1;
        if (keys.current['KeyD']) turn -= 1;
        if (keys.current['KeyW']) accel += 1;
        if (keys.current['KeyS']) accel -= 1;
        if (keys.current['Space']) shoot = true;
      } else {
        if (keys.current['ArrowLeft']) turn += 1;
        if (keys.current['ArrowRight']) turn -= 1;
        if (keys.current['ArrowUp']) accel += 1;
        if (keys.current['ArrowDown']) accel -= 1;
        if (keys.current['ShiftRight'] || keys.current['Enter']) shoot = true;
      }

      // Physics
      p.rotation += turn * ROTATION_SPEED * delta;
      
      const forwardX = Math.sin(p.rotation);
      const forwardZ = Math.cos(p.rotation);

      if (accel !== 0) {
        p.velocity.x += forwardX * accel * ACCELERATION;
        p.velocity.z += forwardZ * accel * ACCELERATION;
      }

      // Friction
      p.velocity.x *= FRICTION;
      p.velocity.z *= FRICTION;

      // Apply Velocity
      p.position.x += p.velocity.x * delta * PLAYER_SPEED;
      p.position.z += p.velocity.z * delta * PLAYER_SPEED;

      // Map Bounds
      if (p.position.x > MAP_SIZE/2) { p.position.x = MAP_SIZE/2; p.velocity.x *= -0.5; }
      if (p.position.x < -MAP_SIZE/2) { p.position.x = -MAP_SIZE/2; p.velocity.x *= -0.5; }
      if (p.position.z > MAP_SIZE/2) { p.position.z = MAP_SIZE/2; p.velocity.z *= -0.5; }
      if (p.position.z < -MAP_SIZE/2) { p.position.z = -MAP_SIZE/2; p.velocity.z *= -0.5; }

      // Tree Collisions
      trees.forEach(tree => {
        if (checkCollision({x: p.position.x, z: p.position.z}, PLAYER_RADIUS, {x: tree.x, z: tree.z}, TREE_RADIUS)) {
          const dx = p.position.x - tree.x;
          const dz = p.position.z - tree.z;
          const dist = Math.sqrt(dx*dx + dz*dz);
          const nx = dx / dist;
          const nz = dz / dist;
          p.position.x = tree.x + nx * (PLAYER_RADIUS + TREE_RADIUS + 0.1);
          p.position.z = tree.z + nz * (PLAYER_RADIUS + TREE_RADIUS + 0.1);
          p.velocity.x *= -0.5;
          p.velocity.z *= -0.5;
        }
      });

      // Bonus Collisions
      for (let i = bonusesRef.current.length - 1; i >= 0; i--) {
        const b = bonusesRef.current[i];
        if (checkCollision({x: p.position.x, z: p.position.z}, PLAYER_RADIUS, {x: b.position.x, z: b.position.z}, BONUS_RADIUS)) {
          // Apply Effect
          if (b.type === BonusType.HEALTH) {
            p.health = Math.min(100, p.health + 30);
          } else if (b.type === BonusType.DAMAGE) {
            p.damageLevel += 1;
          } else if (b.type === BonusType.MULTI_SHOT) {
            p.shotCount += 1;
          }
          
          bonusesRef.current.splice(i, 1);
          setActiveBonuses([...bonusesRef.current]);
        }
      }

      // Shooting
      if (p.cooldown > 0) p.cooldown--;
      
      if (shoot && p.cooldown <= 0) {
        p.cooldown = DEFAULT_COOLDOWN;
        const dmg = BASE_DAMAGE * p.damageLevel;
        
        // Multi-shot spread logic
        const spreadAngle = 0.2; // roughly 11 degrees
        
        for (let i = 0; i < p.shotCount; i++) {
          // Calculate angle offset to center the spread
          const angleOffset = (i - (p.shotCount - 1) / 2) * spreadAngle;
          const finalAngle = p.rotation + angleOffset;
          
          const shotDirX = Math.sin(finalAngle);
          const shotDirZ = Math.cos(finalAngle);

          snowballs.current.push({
            id: Math.random().toString(),
            ownerId: p.id,
            position: { 
              x: p.position.x + forwardX * 1.5, 
              y: 0.5, 
              z: p.position.z + forwardZ * 1.5 
            },
            velocity: { 
              x: shotDirX * SNOWBALL_SPEED + p.velocity.x * 5, 
              y: 0, 
              z: shotDirZ * SNOWBALL_SPEED + p.velocity.z * 5
            },
            active: true,
            damage: dmg
          });
        }
      }
    });

    // 2. Update Snowballs
    for (let i = snowballs.current.length - 1; i >= 0; i--) {
      const s = snowballs.current[i];
      s.position.x += s.velocity.x * delta;
      s.position.z += s.velocity.z * delta;

      if (Math.abs(s.position.x) > MAP_SIZE/2 || Math.abs(s.position.z) > MAP_SIZE/2) {
        s.active = false;
      }

      players.current.forEach(p => {
        if (p.id !== s.ownerId && s.active) {
          if (checkCollision({x: s.position.x, z: s.position.z}, SNOWBALL_RADIUS, {x: p.position.x, z: p.position.z}, PLAYER_RADIUS)) {
            s.active = false;
            p.health -= s.damage;
            if (p.health <= 0) {
               onGameOver(s.ownerId);
            }
          }
        }
      });

      trees.forEach(t => {
         if (s.active && checkCollision({x: s.position.x, z: s.position.z}, SNOWBALL_RADIUS, {x: t.x, z: t.z}, TREE_RADIUS)) {
           s.active = false;
         }
      });

      if (!s.active) {
        snowballs.current.splice(i, 1);
      }
    }

    // 3. Update Camera
    const p1 = players.current[0].position;
    const p2 = players.current[1].position;
    const cx = (p1.x + p2.x) / 2;
    const cz = (p1.z + p2.z) / 2;
    
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, cx, 0.1);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, cz + 20, 0.1);
    camera.position.y = 25; 
    camera.lookAt(cx, 0, cz);

    // 4. Sync UI
    // Shallow copy just to pass data
    onStatsUpdate({...players.current[0]}, {...players.current[1]});
  });

  return (
    <>
      <color attach="background" args={['#0f172a']} />
      
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={500} scale={[MAP_SIZE, 10, MAP_SIZE]} size={4} speed={0.4} opacity={0.5} color="#ffffff" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.1, 0]}>
        <planeGeometry args={[MAP_SIZE + 20, MAP_SIZE + 20]} />
        <meshStandardMaterial color="#e2e8f0" roughness={1} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[MAP_SIZE, MAP_SIZE]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.8} />
      </mesh>

      {trees.map((t, i) => (
        t.type === 'snowman' 
        ? <Snowman key={i} position={[t.x, 0, t.z]} />
        : <Tree key={i} position={[t.x, 0, t.z]} />
      ))}

      {activeBonuses.map((b) => (
        <BonusItem key={b.id} type={b.type} position={[b.position.x, 0, b.position.z]} />
      ))}

      <DynamicObjects playersRef={players} snowballsRef={snowballs} />
    </>
  );
};

const DynamicObjects = ({ playersRef, snowballsRef }: { playersRef: React.MutableRefObject<PlayerState[]>, snowballsRef: React.MutableRefObject<Snowball[]> }) => {
  const groupRef = useRef<THREE.Group>(null);
  const snowballMeshRef = useRef<THREE.InstancedMesh>(null);
  const tempObj = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (groupRef.current) {
      playersRef.current.forEach((p, i) => {
        const child = groupRef.current!.children[i];
        if (child) {
          child.position.set(p.position.x, 0, p.position.z);
          child.rotation.y = p.rotation;
        }
      });
    }

    if (snowballMeshRef.current) {
        const activeSnowballs = snowballsRef.current;
        snowballMeshRef.current.count = activeSnowballs.length;
        activeSnowballs.forEach((s, i) => {
            tempObj.position.set(s.position.x, s.position.y, s.position.z);
            tempObj.updateMatrix();
            snowballMeshRef.current!.setMatrixAt(i, tempObj.matrix);
        });
        snowballMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <group ref={groupRef}>
        {playersRef.current.map(p => (
           <Sleigh key={p.id} color={p.color} />
        ))}
      </group>
      <instancedMesh ref={snowballMeshRef} args={[undefined, undefined, 100]}>
        <sphereGeometry args={[SNOWBALL_RADIUS, 8, 8]} />
        <meshStandardMaterial color="white" emissive="#ccf" emissiveIntensity={0.2} />
      </instancedMesh>
    </>
  );
}

export default GameScene;