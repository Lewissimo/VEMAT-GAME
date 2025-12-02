import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  GameState, Player, Snowball, PowerUp, Tree, MapSize, PowerUpType, InputState, VendingMachine, Bomb, GameMode, Flag, FlagStatus 
} from '../types';
import { 
  MAP_DIMENSIONS, CONTROLS, BASE_STATS, PLAYER_RADIUS, SNOWBALL_RADIUS, 
  COLORS, TREE_RADIUS, POWERUP_RADIUS, VENDING_MACHINE_RADIUS, VENDING_MACHINE_SIZE,
  BOMB_STATS, PHYSICS, VM_PHYSICS, CTF_STATS, TEAM_COLORS
} from '../constants';
import { checkCollision, constrainMap, generateRandomPosition, getRandomEnum, getDistance } from '../utils/physics';

export const useGameEngine = (
  playerCount: number,
  mapSize: MapSize,
  gameMode: GameMode,
  gameActive: boolean,
  isPaused: boolean
) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const inputRef = useRef<InputState>({});
  const requestRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(isPaused);

  // Sync ref with prop
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Initialize Game
  const initGame = useCallback(() => {
    const dim = MAP_DIMENSIONS[mapSize];
    const flags: Flag[] = [];

    // Setup for CTF: Define Bases positions
    const redBasePos = { x: 250, y: 250 };
    const blueBasePos = { x: dim.width - 250, y: dim.height - 250 };

    if (gameMode === GameMode.CTF) {
        flags.push({
            teamId: 0, // Red Team Flag
            position: { ...redBasePos },
            homePosition: { ...redBasePos },
            status: FlagStatus.HOME,
            carrierId: null
        });
        flags.push({
            teamId: 1, // Blue Team Flag
            position: { ...blueBasePos },
            homePosition: { ...blueBasePos },
            status: FlagStatus.HOME,
            carrierId: null
        });
    }

    const initialPlayers: Player[] = Array.from({ length: playerCount }).map((_, i) => {
        let startX, startY, color, teamId = -1;
        
        if (gameMode === GameMode.CTF) {
            // Even numbers = Team 0 (Red), Odd = Team 1 (Blue)
            teamId = i % 2; 
            const basePos = teamId === 0 ? redBasePos : blueBasePos;
            
            // Scatter slightly around base
            startX = basePos.x + (Math.random() * 200 - 100);
            startY = basePos.y + (Math.random() * 200 - 100);
            
            // Assign team color for clarity
            color = TEAM_COLORS[teamId as keyof typeof TEAM_COLORS];
        } else {
            // Deathmatch: Corners
            const isRight = i % 2 !== 0;
            const isBottom = i > 1;
            startX = isRight ? dim.width - 200 : 200;
            startY = isBottom ? dim.height - 200 : 200;
            color = Object.values(COLORS)[i];
        }

        return {
          id: i,
          teamId,
          name: `Gracz ${i + 1}`,
          color: color,
          position: { x: startX, y: startY },
          z: 0,
          velocity: { x: 0, y: 0 },
          velocityZ: 0,
          rotation: teamId === 1 ? Math.PI : 0, // Face centerish
          health: BASE_STATS.MAX_HEALTH,
          score: 0,
          cooldown: 0,
          bombCooldown: 0,
          bombCount: 0,
          hasFlag: false,
          keys: CONTROLS[i],
          activePowerUps: [],
          stats: {
            maxSpeed: BASE_STATS.MAX_SPEED,
            turnSpeed: BASE_STATS.TURN_SPEED,
            shootCooldown: BASE_STATS.SHOOT_COOLDOWN,
            damage: BASE_STATS.DAMAGE,
            projectileCount: 1,
          },
          isDead: false,
          respawnTimer: 0,
        };
    });

    // Generate Trees (Obstacles)
    const trees: Tree[] = [];
    const treeCount = mapSize === MapSize.LARGE ? 40 : 20;
    for (let i = 0; i < treeCount; i++) {
      let pos = generateRandomPosition(dim.width, dim.height, 100);
      let valid = true;
      initialPlayers.forEach(p => { if (getDistance(pos, p.position) < 300) valid = false; });
      // Keep clear of bases in CTF
      if (gameMode === GameMode.CTF) {
          if (getDistance(pos, redBasePos) < 400) valid = false;
          if (getDistance(pos, blueBasePos) < 400) valid = false;
      }

      if (valid) {
        trees.push({ id: `tree-${i}`, position: pos, radius: TREE_RADIUS * (0.8 + Math.random() * 0.4) });
      }
    }

    // Generate Vending Machines
    const vendingMachines: VendingMachine[] = [];
    const machineCount = mapSize === MapSize.LARGE ? 40 : 20;
    for (let i = 0; i < machineCount; i++) {
        let pos = generateRandomPosition(dim.width, dim.height, 150);
        let valid = true;
        initialPlayers.forEach(p => { if (getDistance(pos, p.position) < 300) valid = false; });
        trees.forEach(t => { if (getDistance(pos, t.position) < 150) valid = false; });
        if (gameMode === GameMode.CTF) {
            if (getDistance(pos, redBasePos) < 400) valid = false;
            if (getDistance(pos, blueBasePos) < 400) valid = false;
        }

        if (valid) {
            vendingMachines.push({
                id: `vm-${i}`,
                position: pos,
                velocity: { x: 0, y: 0 },
                width: VENDING_MACHINE_SIZE.width,
                height: VENDING_MACHINE_SIZE.depth,
                rotation: Math.random() * Math.PI * 2
            });
        }
    }

    const state: GameState = {
      gameMode,
      players: initialPlayers,
      snowballs: [],
      powerUps: [],
      bombs: [],
      trees,
      vendingMachines,
      flags,
      teamScores: { 0: 0, 1: 0 },
      mapSize: dim,
      gameTime: 0,
      isGameOver: false,
      winnerId: null,
      winningTeam: null,
    };
    
    gameStateRef.current = state;
    setGameState(state);
  }, [playerCount, mapSize, gameMode]);

  useEffect(() => {
    if (gameActive) {
      initGame();
    }
  }, [gameActive, initGame]);

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      inputRef.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      inputRef.current[e.key] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game Loop
  const update = useCallback((time: number) => {
    if (isPausedRef.current) {
        requestRef.current = requestAnimationFrame(() => update(time));
        return;
    }

    if (!gameStateRef.current || gameStateRef.current.isGameOver) return;
    const state = gameStateRef.current;
    const now = Date.now();

    // Spawn Powerups randomly
    if (Math.random() < 0.005 && state.powerUps.length < 5) {
       state.powerUps.push({
         id: `powerup-${now}`,
         type: getRandomEnum(PowerUpType) as PowerUpType,
         position: generateRandomPosition(state.mapSize.width, state.mapSize.height, 100),
       });
    }

    // --- Update Vending Machines Physics ---
    state.vendingMachines.forEach(vm => {
        vm.position.x += vm.velocity.x;
        vm.position.y += vm.velocity.y;
        vm.velocity.x *= VM_PHYSICS.FRICTION;
        vm.velocity.y *= VM_PHYSICS.FRICTION;
        
        // Bounds
        if (vm.position.x < VENDING_MACHINE_RADIUS) { vm.position.x = VENDING_MACHINE_RADIUS; vm.velocity.x *= -0.5; }
        if (vm.position.x > state.mapSize.width - VENDING_MACHINE_RADIUS) { vm.position.x = state.mapSize.width - VENDING_MACHINE_RADIUS; vm.velocity.x *= -0.5; }
        if (vm.position.y < VENDING_MACHINE_RADIUS) { vm.position.y = VENDING_MACHINE_RADIUS; vm.velocity.y *= -0.5; }
        if (vm.position.y > state.mapSize.height - VENDING_MACHINE_RADIUS) { vm.position.y = state.mapSize.height - VENDING_MACHINE_RADIUS; vm.velocity.y *= -0.5; }

        state.trees.forEach(tree => {
            if (checkCollision(vm.position, VENDING_MACHINE_RADIUS, tree.position, tree.radius * 0.5)) {
                 const angle = Math.atan2(vm.position.y - tree.position.y, vm.position.x - tree.position.x);
                 const dist = (tree.radius * 0.5) + VENDING_MACHINE_RADIUS + 1;
                 vm.position.x = tree.position.x + Math.cos(angle) * dist;
                 vm.position.y = tree.position.y + Math.sin(angle) * dist;
                 vm.velocity.x *= -0.3;
                 vm.velocity.y *= -0.3;
            }
        });
    });

    // --- Update Players ---
    state.players.forEach(p => {
      if (p.isDead) {
        p.respawnTimer--;
        if (p.respawnTimer <= 0) {
          p.isDead = false;
          p.health = BASE_STATS.MAX_HEALTH;
          // Respawn logic
          if (state.gameMode === GameMode.CTF) {
               // Respawn at team base
               const basePos = p.teamId === 0 ? state.flags[0].homePosition : state.flags[1].homePosition;
               p.position.x = basePos.x + (Math.random() * 200 - 100);
               p.position.y = basePos.y + (Math.random() * 200 - 100);
          } else {
               p.position = generateRandomPosition(state.mapSize.width, state.mapSize.height, 200);
          }
          p.z = 0;
          p.velocityZ = 0;
          p.bombCount = 0;
          p.activePowerUps = [];
          p.hasFlag = false; // Just in case
        }
        return;
      }

      // Stats
      let speedMult = 1, damageMult = 1, cooldownMult = 1, projCount = 1;
      p.activePowerUps.forEach(pu => {
        if (pu.type === PowerUpType.SPEED_BOOST) speedMult = 1.5;
        if (pu.type === PowerUpType.COFFEE) speedMult = 1.8; // Caffeine Hit!
        if (pu.type === PowerUpType.MEGA_DAMAGE) damageMult = 2;
        if (pu.type === PowerUpType.RAPID_FIRE) cooldownMult = 0.5;
        if (pu.type === PowerUpType.TRIPLE_SHOT) projCount = 3;
      });
      p.stats.maxSpeed = BASE_STATS.MAX_SPEED * speedMult;
      p.stats.shootCooldown = BASE_STATS.SHOOT_COOLDOWN * cooldownMult;
      p.stats.damage = BASE_STATS.DAMAGE * damageMult;
      p.stats.projectileCount = projCount;

      // Movement
      if (inputRef.current[p.keys.up]) {
        p.velocity.x += Math.cos(p.rotation) * BASE_STATS.ACCELERATION;
        p.velocity.y += Math.sin(p.rotation) * BASE_STATS.ACCELERATION;
      }
      if (inputRef.current[p.keys.down]) {
         p.velocity.x -= Math.cos(p.rotation) * (BASE_STATS.ACCELERATION * 0.5);
         p.velocity.y -= Math.sin(p.rotation) * (BASE_STATS.ACCELERATION * 0.5);
      }
      if (inputRef.current[p.keys.left]) p.rotation -= p.stats.turnSpeed;
      if (inputRef.current[p.keys.right]) p.rotation += p.stats.turnSpeed;

      // Jump
      if (inputRef.current[p.keys.jump] && p.z === 0) p.velocityZ = PHYSICS.JUMP_FORCE;

      // Gravity
      if (p.z > 0 || p.velocityZ !== 0) {
          p.velocityZ -= PHYSICS.GRAVITY;
          p.z += p.velocityZ;
          if (p.z <= 0) { p.z = 0; p.velocityZ = 0; }
      }

      // Friction & Cap
      p.velocity.x *= BASE_STATS.FRICTION;
      p.velocity.y *= BASE_STATS.FRICTION;
      const speed = Math.sqrt(p.velocity.x ** 2 + p.velocity.y ** 2);
      if (speed > p.stats.maxSpeed) {
        const ratio = p.stats.maxSpeed / speed;
        p.velocity.x *= ratio;
        p.velocity.y *= ratio;
      }

      const nextPos = { x: p.position.x + p.velocity.x, y: p.position.y + p.velocity.y };
      p.position = constrainMap(nextPos, state.mapSize.width, state.mapSize.height, PLAYER_RADIUS);

      // Collisions
      if (p.z < 20) {
        // Trees
        state.trees.forEach(tree => {
           if (checkCollision(p.position, PLAYER_RADIUS, tree.position, tree.radius * 0.3)) {
              const angle = Math.atan2(p.position.y - tree.position.y, p.position.x - tree.position.x);
              const dist = (tree.radius * 0.3) + PLAYER_RADIUS + 1;
              p.position.x = tree.position.x + Math.cos(angle) * dist;
              p.position.y = tree.position.y + Math.sin(angle) * dist;
              p.velocity.x *= -0.5;
              p.velocity.y *= -0.5;
           }
        });

        // Vending Machines
        state.vendingMachines.forEach(vm => {
            if (checkCollision(p.position, PLAYER_RADIUS, vm.position, VENDING_MACHINE_RADIUS)) {
                const vmSpeed = Math.sqrt(vm.velocity.x ** 2 + vm.velocity.y ** 2);
                const pSpeed = Math.sqrt(p.velocity.x ** 2 + p.velocity.y ** 2);
                if (vmSpeed > VM_PHYSICS.DAMAGE_THRESHOLD && vmSpeed > pSpeed) {
                    p.health -= VM_PHYSICS.COLLISION_DAMAGE;
                    p.velocity.x += vm.velocity.x * 1.5;
                    p.velocity.y += vm.velocity.y * 1.5;
                    vm.velocity.x *= 0.5;
                    vm.velocity.y *= 0.5;
                } else {
                    const angle = Math.atan2(p.position.y - vm.position.y, p.position.x - vm.position.x);
                    const dist = VENDING_MACHINE_RADIUS + PLAYER_RADIUS + 1;
                    p.position.x = vm.position.x + Math.cos(angle) * dist;
                    p.position.y = vm.position.y + Math.sin(angle) * dist;
                    p.velocity.x *= -0.3;
                    p.velocity.y *= -0.3;
                    const pushForce = 5.0; 
                    vm.velocity.x += (Math.cos(p.rotation) * p.stats.maxSpeed) * pushForce;
                    vm.velocity.y += (Math.sin(p.rotation) * p.stats.maxSpeed) * pushForce;
                }
            }
        });

        // --- CTF LOGIC ---
        if (state.gameMode === GameMode.CTF) {
            // Check Flag Pickup
            state.flags.forEach(flag => {
                // Cannot pick up own flag unless dropped (to return it)
                if (flag.teamId === p.teamId) {
                    if (flag.status === FlagStatus.DROPPED && checkCollision(p.position, PLAYER_RADIUS, flag.position, CTF_STATS.FLAG_RADIUS)) {
                        // Return to base
                        flag.status = FlagStatus.HOME;
                        flag.position = { ...flag.homePosition };
                        flag.carrierId = null;
                    }
                } else {
                    // Enemy flag
                    if (flag.status !== FlagStatus.CARRIED && checkCollision(p.position, PLAYER_RADIUS, flag.position, CTF_STATS.FLAG_RADIUS)) {
                        // Pick up
                        flag.status = FlagStatus.CARRIED;
                        flag.carrierId = p.id;
                        p.hasFlag = true;
                    }
                }
            });

            // Check Capture (Bringing enemy flag to own base)
            if (p.hasFlag) {
                const myBase = state.flags[p.teamId]; // My team's flag defines my base location
                if (checkCollision(p.position, PLAYER_RADIUS, myBase.homePosition, CTF_STATS.BASE_RADIUS)) {
                    // CAPTURE!
                    const enemyFlag = state.flags.find(f => f.teamId !== p.teamId);
                    if (enemyFlag && enemyFlag.carrierId === p.id) {
                        state.teamScores[p.teamId]++;
                        // Reset enemy flag
                        enemyFlag.status = FlagStatus.HOME;
                        enemyFlag.position = { ...enemyFlag.homePosition };
                        enemyFlag.carrierId = null;
                        p.hasFlag = false;

                        // Check Win
                        if (state.teamScores[p.teamId] >= CTF_STATS.WIN_SCORE) {
                            state.isGameOver = true;
                            state.winningTeam = p.teamId;
                        }
                    }
                }
            }
        }
      }

      // Bomb Drop
      if (p.bombCooldown > 0) p.bombCooldown--;
      if (inputRef.current[p.keys.dropBomb] && p.bombCooldown <= 0 && p.bombCount > 0) {
          p.bombCooldown = BOMB_STATS.COOLDOWN;
          p.bombCount--;
          state.bombs.push({
              id: `bomb-${now}-${p.id}`,
              ownerId: p.id,
              position: { ...p.position },
              plantedAt: now,
              explodeAt: now + BOMB_STATS.TIMER,
              radius: BOMB_STATS.RADIUS,
              damage: BOMB_STATS.DAMAGE
          });
      }

      // Shooting
      if (p.cooldown > 0) p.cooldown--;
      if (inputRef.current[p.keys.shoot] && p.cooldown <= 0) {
        p.cooldown = p.stats.shootCooldown;
        const spread = 0.2;
        const count = p.stats.projectileCount;
        for(let k = 0; k < count; k++) {
             let angleOffset = 0;
             if (count > 1) angleOffset = -spread/2 + (spread / (count-1)) * k;
             const fireAngle = p.rotation + angleOffset;
             state.snowballs.push({
              id: `sb-${now}-${p.id}-${k}`,
              ownerId: p.id,
              position: { x: p.position.x + Math.cos(p.rotation) * (PLAYER_RADIUS + 5), y: p.position.y + Math.sin(p.rotation) * (PLAYER_RADIUS + 5) },
              velocity: {
                x: Math.cos(fireAngle) * BASE_STATS.SNOWBALL_SPEED + p.velocity.x * 0.5,
                y: Math.sin(fireAngle) * BASE_STATS.SNOWBALL_SPEED + p.velocity.y * 0.5,
              },
              damage: p.stats.damage,
              createdAt: now,
            });
        }
      }

      // Collect Powerups
      for (let i = state.powerUps.length - 1; i >= 0; i--) {
        const pu = state.powerUps[i];
        if (checkCollision(p.position, PLAYER_RADIUS, pu.position, POWERUP_RADIUS)) {
           if (pu.type === PowerUpType.HEAL) {
               p.health = Math.min(p.health + 50, BASE_STATS.MAX_HEALTH);
           } else if (pu.type === PowerUpType.BOMB_PACK) {
               p.bombCount += BOMB_STATS.PACK_AMOUNT;
           } else {
               p.activePowerUps = p.activePowerUps.filter(x => x.type !== pu.type);
               p.activePowerUps.push({
                   type: pu.type,
                   expiresAt: Number.MAX_SAFE_INTEGER 
               });
           }
           state.powerUps.splice(i, 1);
        }
      }
    });

    // Sync Flag Position with Carrier
    if (state.gameMode === GameMode.CTF) {
        state.flags.forEach(flag => {
            if (flag.status === FlagStatus.CARRIED && flag.carrierId !== null) {
                const carrier = state.players.find(p => p.id === flag.carrierId);
                if (carrier) {
                    flag.position = { ...carrier.position };
                }
            }
        });
    }

    // Bombs
    for (let i = state.bombs.length - 1; i >= 0; i--) {
        const bomb = state.bombs[i];
        if (now >= bomb.explodeAt) {
            state.players.forEach(p => {
                if (!p.isDead && getDistance(p.position, bomb.position) < bomb.radius) {
                    p.health -= bomb.damage;
                    if (p.health <= 0) {
                         p.isDead = true;
                         p.respawnTimer = 180;
                         // Handle Flag Drop on death by bomb
                         if (state.gameMode === GameMode.CTF && p.hasFlag) {
                            const enemyFlag = state.flags.find(f => f.teamId !== p.teamId);
                            if (enemyFlag) {
                                enemyFlag.status = FlagStatus.DROPPED;
                                enemyFlag.position = { ...p.position };
                                enemyFlag.carrierId = null;
                                p.hasFlag = false;
                            }
                         }
                         const owner = state.players.find(pl => pl.id === bomb.ownerId);
                         if (owner && state.gameMode === GameMode.DEATHMATCH) {
                             owner.score += 1;
                             if (owner.score >= 10) { state.isGameOver = true; state.winnerId = owner.id; }
                         }
                    }
                }
            });
            state.bombs.splice(i, 1);
        }
    }

    // Snowballs
    for (let i = state.snowballs.length - 1; i >= 0; i--) {
      const sb = state.snowballs[i];
      sb.position.x += sb.velocity.x;
      sb.position.y += sb.velocity.y;
      if (now - sb.createdAt > BASE_STATS.SNOWBALL_LIFETIME || 
          sb.position.x < 0 || sb.position.x > state.mapSize.width ||
          sb.position.y < 0 || sb.position.y > state.mapSize.height) {
        state.snowballs.splice(i, 1);
        continue;
      }

      let hitObstacle = false;
      for (const tree of state.trees) {
          if (checkCollision(sb.position, SNOWBALL_RADIUS, tree.position, tree.radius * 0.5)) { hitObstacle = true; break; }
      }
      if (!hitObstacle) {
          for (const vm of state.vendingMachines) {
              if (checkCollision(sb.position, SNOWBALL_RADIUS, vm.position, VENDING_MACHINE_RADIUS)) {
                  hitObstacle = true;
                  vm.velocity.x += sb.velocity.x * 0.1;
                  vm.velocity.y += sb.velocity.y * 0.1;
                  break;
              }
          }
      }
      if (hitObstacle) { state.snowballs.splice(i, 1); continue; }

      // Hit Player
      for (const p of state.players) {
        // In CTF, no friendly fire
        const isFriendly = state.gameMode === GameMode.CTF && state.players.find(owner => owner.id === sb.ownerId)?.teamId === p.teamId;

        if (p.id !== sb.ownerId && !p.isDead && !isFriendly) {
            const canHit = p.z < 15;
            if (canHit && checkCollision(sb.position, SNOWBALL_RADIUS, p.position, PLAYER_RADIUS)) {
                p.health -= sb.damage;
                if (p.health <= 0) {
                    p.isDead = true;
                    p.respawnTimer = 180;
                    
                    // Handle Flag Drop on death by snowball
                    if (state.gameMode === GameMode.CTF && p.hasFlag) {
                        const enemyFlag = state.flags.find(f => f.teamId !== p.teamId);
                        if (enemyFlag) {
                            enemyFlag.status = FlagStatus.DROPPED;
                            enemyFlag.position = { ...p.position };
                            enemyFlag.carrierId = null;
                            p.hasFlag = false;
                        }
                    }

                    const shooter = state.players.find(pl => pl.id === sb.ownerId);
                    if (shooter && state.gameMode === GameMode.DEATHMATCH) {
                        shooter.score += 1;
                        if (shooter.score >= 10) { state.isGameOver = true; state.winnerId = shooter.id; }
                    }
                }
                state.snowballs.splice(i, 1);
                break; 
            }
        }
      }
    }

    setGameState({ ...state });
    requestRef.current = requestAnimationFrame(() => update(time));
  }, []);

  useEffect(() => {
    if (gameActive) {
      requestRef.current = requestAnimationFrame(() => update(Date.now()));
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameActive, update]);

  return { gameState, initGame };
};
