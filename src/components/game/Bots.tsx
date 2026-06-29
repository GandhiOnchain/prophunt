import { useRef, useEffect, useState, Suspense, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider, useRapier } from '@react-three/rapier';
import { Vector3, Quaternion } from 'three';
import { useGameStore } from '../../store/gameStore';
import { PropRegistry, PropType } from './PropModels';
import { MAP_SIZE } from './utils';
import { audioSystem } from './AudioSystem';

interface DroneLaser {
  id: string;
  start: Vector3;
  end: Vector3;
}

export interface LaserTracersRef {
  addLaser: (id: string, start: Vector3, end: Vector3) => void;
}

// 1. Isolated Laser Tracers component to prevent re-rendering drone meshes or rigid bodies
const LaserTracersRender = forwardRef<LaserTracersRef, {}>((props, ref) => {
  const [lasers, setLasers] = useState<DroneLaser[]>([]);

  useImperativeHandle(ref, () => ({
    addLaser(id, start, end) {
      setLasers(prev => {
        if (prev.some(l => l.id === id)) return prev;
        return [...prev, { id, start, end }];
      });
      setTimeout(() => {
        setLasers(prev => prev.filter(l => l.id !== id));
      }, 120);
    }
  }));

  return (
    <>
      {lasers.map(laser => {
        const dir = new Vector3().subVectors(laser.end, laser.start);
        const len = dir.length();
        const mid = new Vector3().addVectors(laser.start, laser.end).multiplyScalar(0.5);
        const alignQ = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize());
        return (
          <mesh key={laser.id} position={mid} quaternion={alignQ}>
            <cylinderGeometry args={[0.02, 0.02, len, 4]} />
            <meshBasicMaterial color="#ef4444" toneMapped={false} />
          </mesh>
        );
      })}
    </>
  );
});

// 2. High-performance Hunter Bots patrol and combat manager
function HunterBotsRender({ isHunter, gamePhase }: { isHunter: boolean; gamePhase: string }) {
  const { rapier, world } = useRapier();
  const localHuntersRef = useRef<{ id: string; pos: Vector3; target: Vector3; speed: number }[]>([]);
  const meshRefs = useRef<{ [id: string]: any }>({});
  const lastSyncTime = useRef(0);
  const lasersRef = useRef<LaserTracersRef>(null);

  // Drone AI combat state
  const droneAIState = useRef<{
    [id: string]: {
      spottedPlayer: boolean;
      lastSpottedTime: number;
      lastShootTime: number;
      lastChatTime: number;
    };
  }>({});

  // Reset local combat state when phase or role swaps
  useEffect(() => {
    localHuntersRef.current = [];
    droneAIState.current = {};
  }, [isHunter, gamePhase]);

  // Transiently synchronize hunter positions from the store without triggering component re-renders
  useEffect(() => {
    const sync = (state: any) => {
      const hBots = state.hunterBots;
      if (!isHunter && hBots.length > 0 && localHuntersRef.current.length === 0) {
        localHuntersRef.current = hBots.map((h: any) => ({
          id: h.id,
          pos: new Vector3(...h.position),
          target: new Vector3(...h.target),
          speed: h.speed
        }));
      }
    };
    
    sync(useGameStore.getState());
    return useGameStore.subscribe(sync);
  }, [isHunter]);

  // Read initial hunter bots list for spawning the static mesh tree once.
  // Movement is animated purely imperatively inside useFrame to bypass React entirely.
  const [renderHunters, setRenderHunters] = useState<{ id: string; position: [number, number, number] }[]>([]);
  useEffect(() => {
    const hBots = useGameStore.getState().hunterBots;
    if (hBots.length > 0) {
      setRenderHunters(hBots.map(h => ({ id: h.id, position: h.position })));
    } else {
      const unsubscribe = useGameStore.subscribe((state) => {
        if (state.hunterBots.length > 0) {
          setRenderHunters(state.hunterBots.map(h => ({ id: h.id, position: h.position })));
          unsubscribe();
        }
      });
      return unsubscribe;
    }
  }, [isHunter, gamePhase]);

  useFrame((state, delta) => {
    if (isHunter || localHuntersRef.current.length === 0 || gamePhase === 'GAME_OVER') return;

    const limit = MAP_SIZE / 2 - 5;
    let changed = false;

    const playerPosRaw = useGameStore.getState().playerPosition;
    const playerPos = new Vector3(...playerPosRaw);
    const isLocked = useGameStore.getState().isLocked;

    localHuntersRef.current.forEach(hunter => {
      // Initialize state if missing
      if (!droneAIState.current[hunter.id]) {
        droneAIState.current[hunter.id] = {
          spottedPlayer: false,
          lastSpottedTime: 0,
          lastShootTime: 0,
          lastChatTime: 0
        };
      }

      const ai = droneAIState.current[hunter.id];
      const distToPlayer = hunter.pos.distanceTo(playerPos);
      
      const detectionRadius = isLocked ? 4.5 : 14.0;
      let hasLOS = false;

      if (distToPlayer < detectionRadius && gamePhase === 'HUNTING') {
        const dirToPlayer = new Vector3().subVectors(playerPos.clone().add(new Vector3(0, 0.4, 0)), hunter.pos).normalize();
        const ray = new rapier.Ray(hunter.pos, dirToPlayer);
        const hit = world.castRay(ray, detectionRadius, true, undefined, undefined, undefined, undefined) as any;

        if (hit) {
          const hitToi = hit.timeOfImpact !== undefined ? hit.timeOfImpact : hit.toi;
          if (hitToi === undefined || hitToi >= distToPlayer - 1.0) {
            hasLOS = true;
          }
        } else {
          hasLOS = true;
        }
      }

      if (hasLOS) {
        ai.spottedPlayer = true;
        ai.lastSpottedTime = state.clock.getElapsedTime();
        hunter.target.copy(playerPos).add(new Vector3(0, 2.5, 0));

        const now = performance.now();
        if (now - ai.lastShootTime > 650) {
          ai.lastShootTime = now;

          const laserId = `${hunter.id}-${now}`;
          lasersRef.current?.addLaser(
            laserId,
            hunter.pos.clone().add(new Vector3(0, -0.2, 0)),
            playerPos.clone().add(new Vector3(0, 0.4, 0))
          );

          audioSystem.playDamageSound();
          useGameStore.getState().setHp(prevHp => {
            const nextHp = Math.max(0, prevHp - 12);
            if (nextHp === 0) {
              setTimeout(() => {
                useGameStore.getState().setGameOver('VAPORIZED! The security drone identified you as a prop and engaged lethal force.');
              }, 100);
            }
            return nextHp;
          });
        }

        if (now - ai.lastChatTime > 10000) {
          ai.lastChatTime = now;
          useGameStore.getState().addChatMessage(
            '🚨 CHASSIS LOCKED! Target identified at coordinates. Engaging fire.',
            `Drone [${hunter.id.substring(0, 4)}]`,
            'HUNTER',
            false,
            'global'
          );
        }
      } else {
        if (ai.spottedPlayer && state.clock.getElapsedTime() - ai.lastSpottedTime > 3.0) {
          ai.spottedPlayer = false;
          useGameStore.getState().addChatMessage(
            '⚠️ Anomaly lost. Returning to primary sector patrol routing.',
            `Drone [${hunter.id.substring(0, 4)}]`,
            'HUNTER',
            false,
            'global'
          );
          
          hunter.target.set(
            (Math.random() - 0.5) * limit * 2,
            2.5,
            (Math.random() - 0.5) * limit * 2
          );
          changed = true;
        }
      }

      const speedFactor = ai.spottedPlayer ? 1.45 : 1.0;
      const flyDir = new Vector3().subVectors(hunter.target, hunter.pos);
      const distToTarget = flyDir.length();

      if (distToTarget < 1.5 && !ai.spottedPlayer) {
        hunter.target.set(
          (Math.random() - 0.5) * limit * 2,
          2.5,
          (Math.random() - 0.5) * limit * 2
        );
        changed = true;
      } else {
        flyDir.normalize().multiplyScalar(hunter.speed * speedFactor * delta);
        hunter.pos.add(flyDir);
      }

      const mesh = meshRefs.current[hunter.id];
      if (mesh) {
        mesh.position.copy(hunter.pos);
        mesh.position.y += Math.sin(state.clock.getElapsedTime() * 3.5 + hunter.speed) * 0.06;
        
        if (flyDir.lengthSq() > 0.001) {
          const yawAngle = Math.atan2(flyDir.x, flyDir.z);
          mesh.rotation.y = yawAngle;
        }
      }
    });

    const now = performance.now();
    if (now - lastSyncTime.current > 50 || changed) {
      const updatedHunters = localHuntersRef.current.map(h => ({
        id: h.id,
        position: [h.pos.x, h.pos.y, h.pos.z] as [number, number, number],
        target: [h.target.x, h.target.y, h.target.z] as [number, number, number],
        speed: h.speed
      }));
      useGameStore.getState().initHunterBots(updatedHunters);
      lastSyncTime.current = now;
    }
  });

  return (
    <group>
      {renderHunters.map(h => {
        const spotted = droneAIState.current[h.id]?.spottedPlayer;
        return (
          <group 
            key={h.id} 
            ref={el => { if (el) meshRefs.current[h.id] = el; }} 
            position={h.position}
          >
            {/* Main Drone Chassis Sphere */}
            <mesh castShadow>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshStandardMaterial color={spotted ? "#ef4444" : "#2d2d2d"} metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Glowing Sensor Core Eye */}
            <mesh position={[0, 0, -0.3]}>
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>

            {/* Rotor Brackets */}
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[1.2, 0.05, 0.05]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            <mesh rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[1.2, 0.05, 0.05]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>

            {/* Rotor Blades */}
            {[[-0.6, 0.1, 0], [0.6, 0.1, 0], [0, 0.1, -0.6], [0, 0.1, 0.6]].map((pos, idx) => (
              <mesh key={idx} position={pos as [number, number, number]} rotation={[0, idx * Math.PI / 2, 0]}>
                <boxGeometry args={[0.25, 0.01, 0.03]} />
                <meshStandardMaterial color="#000" />
              </mesh>
            ))}

            {/* Downward scanning light projection */}
            <mesh position={[0, -1.2, 0]} rotation={[0, 0, 0]}>
              <coneGeometry args={[0.8, 2.4, 16, 1, true]} />
              <meshBasicMaterial 
                color={spotted ? "#ef4444" : "#f59e0b"} 
                transparent 
                opacity={spotted ? 0.4 : 0.12} 
                depthWrite={false} 
              />
            </mesh>
          </group>
        );
      })}

      <LaserTracersRender ref={lasersRef} />
    </group>
  );
}

// 3. Isolated static Prop Bots so they never re-render unless killed
function PropBotsRender() {
  const propBots = useGameStore(state => state.propBots);

  return (
    <>
      {propBots.filter(b => !b.isDead).map(bot => {
        const propConfig = PropRegistry[bot.type as PropType];
        if (!propConfig) return null;
        const Model = propConfig.component;
        return (
          <RigidBody 
            key={bot.id} 
            type="fixed" 
            colliders={false}
            position={bot.position}
            userData={{ isPropBot: true, id: bot.id }}
          >
            <CuboidCollider args={[propConfig.size[0]/2, propConfig.size[1]/2, propConfig.size[2]/2]} position={propConfig.offset} />
            <group position={propConfig.meshOffset}>
              <Suspense fallback={null}>
                <Model />
              </Suspense>
            </group>
          </RigidBody>
        );
      })}
    </>
  );
}

// 4. Main Export (Structural controller)
export function Bots() {
  const isHunter = useGameStore(state => state.isHunter);
  const gamePhase = useGameStore(state => state.gamePhase);

  if (!isHunter) {
    return <HunterBotsRender isHunter={isHunter} gamePhase={gamePhase} />;
  }

  return <PropBotsRender />;
}
