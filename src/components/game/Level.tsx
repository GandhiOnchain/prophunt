import { useMemo, Suspense } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { PropRegistry, PROP_TYPES } from './PropModels';
import { MAP_SIZE, isInsideWall, getGroundHeight } from './utils';
import { useGameStore } from '../../store/gameStore';
import { MapTemple } from './MapTemple';
import { MapMine } from './MapMine';
import { MapBeach } from './MapBeach';
import { MapNexus } from './MapNexus';

// Translucent Futuristic Energy Containment Cage for Hunter during Setup Phase
function HunterSpawnCage() {
  const gamePhase = useGameStore((state) => state.gamePhase);

  if (gamePhase !== 'HIDING') return null;

  return (
    <RigidBody type="fixed" colliders={false} position={[0, 50, 0]}>
      {/* 4 walls, a ceiling, and a floor for the cage */}
      <CuboidCollider args={[5, 5, 0.1]} position={[0, 0, -5]} />
      <CuboidCollider args={[5, 5, 0.1]} position={[0, 0, 5]} />
      <CuboidCollider args={[0.1, 5, 5]} position={[-5, 0, 0]} />
      <CuboidCollider args={[0.1, 5, 5]} position={[5, 0, 0]} />
      <CuboidCollider args={[5, 0.1, 5]} position={[0, 5, 0]} />
      <CuboidCollider args={[5, 0.1, 5]} position={[0, -5, 0]} />
      
      <mesh>
        <boxGeometry args={[10, 10, 10]} />
        <meshStandardMaterial
          color="#0ea5e9"
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.8}
          emissive="#0ea5e9"
          emissiveIntensity={0.5}
        />
      </mesh>
    </RigidBody>
  );
}

export function Level() {
  const currentMapId = useGameStore((state) => state.currentMapId);

  // Spawn 75 environment props to populate our massive 250x250 map
  const props = useMemo(() => {
    const arr = [];
    
    // Define map-specific props for realism and coherence
    const mapSpecificProps: Record<string, typeof PROP_TYPES[number][]> = {
      'TEMPLE': ['stone', 'pillar'],
      'LOST_MINE': ['box', 'barrel', 'cabinet'],
      'BLUE_SANDS': ['box', 'chair', 'plant'],
      'NEXUS': ['monitor', 'vending', 'server', 'desk', 'sofa', 'mug', 'chair', 'cabinet']
    };
    
    const seedTypes = mapSpecificProps[currentMapId] || PROP_TYPES;
    
    for (let i = 0; i < 75; i++) {
      const type = seedTypes[Math.floor(Math.random() * seedTypes.length)];
      let x = 0;
      let z = 0;
      let tries = 0;
      do {
        x = (Math.random() - 0.5) * (MAP_SIZE - 12);
        z = (Math.random() - 0.5) * (MAP_SIZE - 12);
        tries++;
      } while (isInsideWall(x, z, currentMapId) && tries < 20);

      const y = getGroundHeight(x, z, currentMapId);

      arr.push({
        id: `env-prop-${i}`,
        type,
        position: [x, y, z] as [number, number, number],
        rotation: [0, Math.random() * Math.PI * 2, 0] as [number, number, number],
      });
    }
    return arr;
  }, [currentMapId]);

  return (
    <>
      {currentMapId === 'TEMPLE' && <MapTemple />}
      {currentMapId === 'LOST_MINE' && <MapMine />}
      {currentMapId === 'BLUE_SANDS' && <MapBeach />}
      {currentMapId === 'NEXUS' && <MapNexus />}

      {/* Hunter starting barrier cage during setup */}
      <HunterSpawnCage />

      {/* MAP ENVIRONMENT PROPS */}
      {props.map((p) => {
        const propConfig = PropRegistry[p.type];
        if (!propConfig) return null;
        const Model = propConfig.component;
        return (
          <RigidBody 
            key={p.id} 
            type="fixed" 
            position={p.position} 
            rotation={p.rotation}
          >
            <CuboidCollider args={[propConfig.size[0]/2, propConfig.size[1]/2, propConfig.size[2]/2]} position={propConfig.offset} />
            <group position={propConfig.meshOffset} userData={{ isEnvironmentProp: true, propType: p.type }}>
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
