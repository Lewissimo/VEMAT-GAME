import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  GameState, Player, Snowball, PowerUp, Tree, MapSize, PowerUpType, InputState, VendingMachine, Bomb 
} from '../types';
import { 
  MAP_DIMENSIONS, CONTROLS, BASE_STATS, PLAYER_RADIUS, SNOWBALL_RADIUS, 
  COLORS, TREE_RADIUS, POWERUP_RADIUS, POWERUP_DURATION, VENDING_MACHINE_RADIUS, VENDING_MACHINE_SIZE,
  BOMB_STATS, PHYSICS, VM_PHYSICS
} from '../constants';
import { checkCollision, constrainMap, generateRandomPosition, getRandomEnum, getDistance } from '../utils/physics';

export const useGameEngine = (
  playerCount: number,
  mapSize: MapSize,
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
    const initialPlayers: Player[] = Array.from({ length: playerCount }).map((_, i) => {
        // Spawn players in corners
        const isRight = i % 2 !== 0;
        const isBottom = i > 1;
        const startX = isRight ? dim.width - 200 : 200;
        const startY = isBottom ? dim.height - 200 : 200;

        return {
          id: i,
          name: `Gracz ${i + 1}`,
          color: Object.values(COLORS)[i],
          position: { x: startX, y: startY },
          z: 0,
          velocity: { x: 0, y: 0 },
          velocityZ: 0,
          rotation: isRight ? Math.PI : 0,
          health: BASE_STATS.MAX_HEALTH,
          score: 0,
          cooldown: 0,
          bombCooldown: 0,
          bombCount: 0,
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
    // 50/50 Split - 40 trees for large map, 20 for small
    const treeCount = mapSize === MapSize.LARGE ? 40 : 20;
    for (let i = 0; i < treeCount; i++) {
      let pos = generateRandomPosition(dim.width, dim.height, 100);
      // Don't spawn too close to players
      let valid = true;
      initialPlayers.forEach(p => {
        if (getDistance(pos, p.position) < 300) valid = false;
      });
      if (valid) {
        trees.push({ id: `tree-${i}`, position: pos, radius: TREE_RADIUS * (0.8 + Math.random() * 0.4) });
      }
    }

    // Generate Vending Machines
    const vendingMachines: VendingMachine[] = [];
    // 50/50 Split - 40 machines for large map, 20 for small
    const machineCount = mapSize === MapSize.LARGE ? 40 : 20;
    for (let i = 0; i < machineCount; i++) {
        let pos = generateRandomPosition(dim.width, dim.height, 150);
        let valid = true;
        initialPlayers.forEach(p => {
            if (getDistance(pos, p.position) < 300) valid = false;
        });
        trees.forEach(t => {
            if (getDistance(pos, t.position) < 150) valid = false; // avoid clipping trees
        });

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
      players: initialPlayers,
      snowballs: [],
      powerUps: [],
      bombs: [],
      trees,
      vendingMachines,
      mapSize: dim,
      gameTime: 0,
      isGameOver: false,
      winnerId: null,
    };
    
    gameStateRef.current = state;
    setGameState(state);
  }, [playerCount, mapSize]);

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
    // If paused, just loop without updating physics
    if (isPausedRef.current) {
        requestRef.current = requestAnimationFrame(() => update(time));
        return;
    }

    if (!gameStateRef.current || gameStateRef.current.isGameOver) return;
    const state = gameStateRef.current;
    const now = Date.now();

    // Spawn Powerups randomly
    if (Math.random() < 0.005 && state.powerUps.length < 5) { // Roughly every 3-4 seconds at 60fps
       state.powerUps.push({
         id: `powerup-${now}`,
         type: getRandomEnum(PowerUpType) as PowerUpType,
         position: generateRandomPosition(state.mapSize.width, state.mapSize.height, 100),
       });
    }

    // --- Update Vending Machines Physics ---
    state.vendingMachines.forEach(vm => {
        // Apply Velocity
        vm.position.x += vm.velocity.x;
        vm.position.y += vm.velocity.y;

        // Friction
        vm.velocity.x *= VM_PHYSICS.FRICTION;
        vm.velocity.y *= VM_PHYSICS.FRICTION;

        // Map Bounds (Bounce)
        if (vm.position.x < VENDING_MACHINE_RADIUS) {
            vm.position.x = VENDING_MACHINE_RADIUS;
            vm.velocity.x *= -0.5;
        }
        if (vm.position.x > state.mapSize.width - VENDING_MACHINE_RADIUS) {
            vm.position.x = state.mapSize.width - VENDING_MACHINE_RADIUS;
            vm.velocity.x *= -0.5;
        }
        if (vm.position.y < VENDING_MACHINE_RADIUS) {
            vm.position.y = VENDING_MACHINE_RADIUS;
            vm.velocity.y *= -0.5;
        }
        if (vm.position.y > state.mapSize.height - VENDING_MACHINE_RADIUS) {
            vm.position.y = state.mapSize.height - VENDING_MACHINE_RADIUS;
            vm.velocity.y *= -0.5;
        }

        // Tree Collision for VMs (Stop them)
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
          p.position = generateRandomPosition(state.mapSize.width, state.mapSize.height, 200);
          p.z = 0;
          p.velocityZ = 0;
          p.bombCount = 0; // Reset bombs on death
          p.activePowerUps = []; // Reset powerups on death
        }
        return;
      }

      // PERMANENT POWERUPS: No expiry check here.
      
      // Recalculate stats based on powerups
      let speedMult = 1;
      let damageMult = 1;
      let cooldownMult = 1;
      let projCount = 1;

      p.activePowerUps.forEach(pu => {
        if (pu.type === PowerUpType.SPEED_BOOST) speedMult = 1.5;
        if (pu.type === PowerUpType.MEGA_DAMAGE) damageMult = 2;
        if (pu.type === PowerUpType.RAPID_FIRE) cooldownMult = 0.5;
        if (pu.type === PowerUpType.TRIPLE_SHOT) projCount = 3;
      });

      p.stats.maxSpeed = BASE_STATS.MAX_SPEED * speedMult;
      p.stats.shootCooldown = BASE_STATS.SHOOT_COOLDOWN * cooldownMult;
      p.stats.damage = BASE_STATS.DAMAGE * damageMult;
      p.stats.projectileCount = projCount;


      // Movement Logic
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

      // Jumping Logic
      if (inputRef.current[p.keys.jump] && p.z === 0) {
          p.velocityZ = PHYSICS.JUMP_FORCE;
      }

      // Physics: Gravity & Z-Axis
      if (p.z > 0 || p.velocityZ !== 0) {
          p.velocityZ -= PHYSICS.GRAVITY;
          p.z += p.velocityZ;
          if (p.z <= 0) {
              p.z = 0;
              p.velocityZ = 0;
          }
      }

      // Friction
      p.velocity.x *= BASE_STATS.FRICTION;
      p.velocity.y *= BASE_STATS.FRICTION;

      // Cap Speed
      const speed = Math.sqrt(p.velocity.x ** 2 + p.velocity.y ** 2);
      if (speed > p.stats.maxSpeed) {
        const ratio = p.stats.maxSpeed / speed;
        p.velocity.x *= ratio;
        p.velocity.y *= ratio;
      }

      // Apply Velocity
      const nextPos = {
          x: p.position.x + p.velocity.x,
          y: p.position.y + p.velocity.y
      };

      // Map Bounds Collision
      p.position = constrainMap(nextPos, state.mapSize.width, state.mapSize.height, PLAYER_RADIUS);

      // Collision handling
      if (p.z < 20) { // Only collide if near ground
        
        // Tree Collision (Bounce)
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

        // Vending Machine Collision (Interaction)
        state.vendingMachines.forEach(vm => {
            if (checkCollision(p.position, PLAYER_RADIUS, vm.position, VENDING_MACHINE_RADIUS)) {
                
                const vmSpeed = Math.sqrt(vm.velocity.x ** 2 + vm.velocity.y ** 2);
                const pSpeed = Math.sqrt(p.velocity.x ** 2 + p.velocity.y ** 2);

                // Check if VM crashes INTO Player (Deal damage)
                if (vmSpeed > VM_PHYSICS.DAMAGE_THRESHOLD && vmSpeed > pSpeed) {
                    p.health -= VM_PHYSICS.COLLISION_DAMAGE;
                    // Knockback player
                    p.velocity.x += vm.velocity.x * 1.5;
                    p.velocity.y += vm.velocity.y * 1.5;
                    // Slow down VM
                    vm.velocity.x *= 0.5;
                    vm.velocity.y *= 0.5;
                } else {
                    // Player pushes VM
                    // 1. Separate positions
                    const angle = Math.atan2(p.position.y - vm.position.y, p.position.x - vm.position.x);
                    const dist = VENDING_MACHINE_RADIUS + PLAYER_RADIUS + 1;
                    p.position.x = vm.position.x + Math.cos(angle) * dist;
                    p.position.y = vm.position.y + Math.sin(angle) * dist;

                    // 2. Transfer Momentum
                    // Player bounces off slightly
                    p.velocity.x *= -0.3;
                    p.velocity.y *= -0.3;
                    
                    // VM gets pushed (add player velocity to VM)
                    // Increased push force so it flies away
                    const pushForce = 5.0; 
                    vm.velocity.x += (Math.cos(p.rotation) * p.stats.maxSpeed) * pushForce;
                    vm.velocity.y += (Math.sin(p.rotation) * p.stats.maxSpeed) * pushForce;
                }
            }
        });
      }

      // Bomb Dropping
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
        
        const spread = 0.2; // radians
        const count = p.stats.projectileCount;
        
        for(let k = 0; k < count; k++) {
             let angleOffset = 0;
             if (count > 1) {
                 angleOffset = -spread/2 + (spread / (count-1)) * k;
             }
             
             const fireAngle = p.rotation + angleOffset;

             state.snowballs.push({
              id: `sb-${now}-${p.id}-${k}`,
              ownerId: p.id,
              position: { 
                  x: p.position.x + Math.cos(p.rotation) * (PLAYER_RADIUS + 5), 
                  y: p.position.y + Math.sin(p.rotation) * (PLAYER_RADIUS + 5) 
              },
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
        // Can collect powerups even if jumping (simpler gameplay)
        if (checkCollision(p.position, PLAYER_RADIUS, pu.position, POWERUP_RADIUS)) {
           if (pu.type === PowerUpType.HEAL) {
               p.health = Math.min(p.health + 50, BASE_STATS.MAX_HEALTH);
           } else if (pu.type === PowerUpType.BOMB_PACK) {
               p.bombCount += BOMB_STATS.PACK_AMOUNT;
           } else {
               p.activePowerUps = p.activePowerUps.filter(x => x.type !== pu.type);
               p.activePowerUps.push({
                   type: pu.type,
                   expiresAt: Number.MAX_SAFE_INTEGER // Permanent until death
               });
           }
           state.powerUps.splice(i, 1);
        }
      }
    });

    // Update Bombs
    for (let i = state.bombs.length - 1; i >= 0; i--) {
        const bomb = state.bombs[i];
        if (now >= bomb.explodeAt) {
            // EXPLODE
            // Check radius damage
            state.players.forEach(p => {
                if (!p.isDead && getDistance(p.position, bomb.position) < bomb.radius) {
                    p.health -= bomb.damage;
                    if (p.health <= 0) {
                         p.isDead = true;
                         p.respawnTimer = 180;
                         const owner = state.players.find(pl => pl.id === bomb.ownerId);
                         if (owner) {
                             owner.score += 1;
                             if (owner.score >= 10) {
                                 state.isGameOver = true;
                                 state.winnerId = owner.id;
                             }
                         }
                    }
                }
            });
            state.bombs.splice(i, 1);
        }
    }

    // Update Snowballs
    for (let i = state.snowballs.length - 1; i >= 0; i--) {
      const sb = state.snowballs[i];
      sb.position.x += sb.velocity.x;
      sb.position.y += sb.velocity.y;

      // Remove if too old or out of bounds
      if (now - sb.createdAt > BASE_STATS.SNOWBALL_LIFETIME || 
          sb.position.x < 0 || sb.position.x > state.mapSize.width ||
          sb.position.y < 0 || sb.position.y > state.mapSize.height) {
        state.snowballs.splice(i, 1);
        continue;
      }

      // Check Tree Collision
      let hitObstacle = false;
      for (const tree of state.trees) {
          if (checkCollision(sb.position, SNOWBALL_RADIUS, tree.position, tree.radius * 0.5)) {
              hitObstacle = true;
              break;
          }
      }
      // Check Vending Machine Collision
      if (!hitObstacle) {
          for (const vm of state.vendingMachines) {
              if (checkCollision(sb.position, SNOWBALL_RADIUS, vm.position, VENDING_MACHINE_RADIUS)) {
                  hitObstacle = true;
                  // Push VM slightly when shot
                  vm.velocity.x += sb.velocity.x * 0.1;
                  vm.velocity.y += sb.velocity.y * 0.1;
                  break;
              }
          }
      }

      if (hitObstacle) {
          state.snowballs.splice(i, 1);
          continue;
      }

      // Check Player Collision
      for (const p of state.players) {
        if (p.id !== sb.ownerId && !p.isDead) {
            // Can dodge snowball by jumping if height > 15
            const canHit = p.z < 15;
            if (canHit && checkCollision(sb.position, SNOWBALL_RADIUS, p.position, PLAYER_RADIUS)) {
                // HIT!
                p.health -= sb.damage;
                if (p.health <= 0) {
                p.isDead = true;
                p.respawnTimer = 180; // 3 seconds at 60fps
                // Award point to shooter
                const shooter = state.players.find(pl => pl.id === sb.ownerId);
                if (shooter) {
                    shooter.score += 1;
                    // WIN CONDITION
                    if (shooter.score >= 10) { 
                        state.isGameOver = true;
                        state.winnerId = shooter.id;
                    }
                }
                }
                state.snowballs.splice(i, 1);
                break; 
            }
        }
      }
    }

    // Trigger Render
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
