import { useRef, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Vector3, Euler } from 'three';
import { useGameStore } from '../../store/gameStore';
import { PropRegistry, PropType } from './PropModels';
import { MAP_SIZE } from './utils';

export function Bots() {
  const propBots = useGameStore(state => state.propBots);
  const hunterBots = useGameStore(state => state.hunterBots);
  const isHunter = useGameStore(state => state.isHunter);
  const initHunterBots = useGameStore(state => state.initHunterBots);
  const gamePhase = useGameStore(state => state.gamePhase);

  // Keep local refs for smooth 60 FPS rendering in 3D without React re-render lag
  const localHuntersRef = useRef<{ id: string; pos: Vector3; target: Vector3; speed: number }[]>([]);
  const meshRefs = useRef<{ [id: string]: any }>({});
  const lastSyncTime = useRef(0);

  // Synchronize initial hunter bots from store to local refs
  useEffect(() => {
    if (!isHunter && hunterBots.length > 0 && localHuntersRef.current.length === 0) {
      localHuntersRef.current = hunterBots.map(h => ({
        id: h.id,
        pos: new Vector3(...h.position),
        target: new Vector3(...h.target),
        speed: h.speed
      }));
    }
  }, [hunterBots, isHunter]);

  // Reset local hunters when game initializes or role changes
  useEffect(() => {
    localHuntersRef.current = [];
  }, [isHunter, gamePhase]);

  useFrame((state, delta) => {
    if (isHunter || localHuntersRef.current.length === 0 || gamePhase === 'GAME_OVER') return;

    const limit = MAP_SIZE / 2 - 5; // Search the entire playable arena up to the outer walls
    let changed = false;

    localHuntersRef.current.forEach(hunter => {
      const dir = new Vector3().subVectors(hunter.target, hunter.pos);
      const dist = dir.length();

      if (dist < 1.5) {
        // Pick new random target on patio
        hunter.target.set(
          (Math.random() - 0.5) * limit * 2,
          2.5,
          (Math.random() - 0.5) * limit * 2
        );
        changed = true;
      } else {
        // Move towards target
        dir.normalize().multiplyScalar(hunter.speed * delta);
        hunter.pos.add(dir);
      }

      // Update actual 3D mesh position directly for buttery-smooth rendering
      const mesh = meshRefs.current[hunter.id];
      if (mesh) {
        mesh.position.copy(hunter.pos);
        // Add floating/hovering animation and subtle rotation
        mesh.position.y += Math.sin(state.clock.getElapsedTime() * 3 + hunter.speed) * 0.05;
        mesh.rotation.y += delta * 0.5;
      }
    });

    // Throttled sync to Zustand store for outer 2D radar (20hz / 50ms)
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

  if (!isHunter) {
    return (
      <group>
        {hunterBots.map(h => (
          <group 
            key={h.id} 
            ref={el => { if (el) meshRefs.current[h.id] = el; }} 
            position={h.position}
          >
            {/* Main Drone Chassis Sphere */}
            <mesh castShadow>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshStandardMaterial color="#2d2d2d" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Glowing Red Sensor Core Eye */}
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

            {/* Tiny Rotor Blades */}
            {[[-0.6, 0.1, 0], [0.6, 0.1, 0], [0, 0.1, -0.6], [0, 0.1, 0.6]].map((pos, idx) => (
              <mesh key={idx} position={pos as [number, number, number]} rotation={[0, idx * Math.PI / 2, 0]}>
                <boxGeometry args={[0.25, 0.01, 0.03]} />
                <meshStandardMaterial color="#000" />
              </mesh>
            ))}

            {/* Scanning spotlight projection on ground (Downward cone) */}
            <mesh position={[0, -1.2, 0]} rotation={[0, 0, 0]}>
              <coneGeometry args={[0.8, 2.4, 16, 1, true]} />
              <meshBasicMaterial color="#ef4444" transparent opacity={0.12} depthWrite={false} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  return (
    <>
      {propBots.filter(b => !b.isDead).map(bot => {
        const propConfig = PropRegistry[bot.type as PropType];
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
