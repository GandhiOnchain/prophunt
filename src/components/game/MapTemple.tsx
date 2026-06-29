import { Suspense, useMemo } from 'react';
import { Sky, Environment, ContactShadows, Float, Instances, Instance, Bvh } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS } from './utils';

import { useSafeTexture } from './SafeTexture';

const TextureMaterial = ({ textureName, repeat = [1, 1], color = '#ffffff' }: { textureName: string, repeat?: [number, number], color?: string }) => {
  const diffUrl = `https://textures.polyhaven.net/file/ph-assets/Textures/jpg/1k/${textureName}/${textureName}_diff_1k.jpg`;
  
  const diffuse = useSafeTexture(diffUrl);

  useMemo(() => {
    if (diffuse) {
      diffuse.wrapS = diffuse.wrapT = THREE.RepeatWrapping;
      diffuse.repeat.set(repeat[0], repeat[1]);
      diffuse.colorSpace = THREE.SRGBColorSpace;
      diffuse.needsUpdate = true;
    }
  }, [diffuse, repeat]);

  return (
    <meshStandardMaterial
      map={diffuse || undefined}
      color={color}
      roughness={0.9}
      metalness={0.1}
    />
  );
};


const Archway = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => (
  <group position={position} rotation={rotation}>
    {/* Pillars */}
    <mesh position={[6, 8, 0]} castShadow receiveShadow>
      <boxGeometry args={[4, 16, 4]} />
      <TextureMaterial textureName="stone_brick_wall_001" repeat={[0.5, 2]} color="#1a1816" />
    </mesh>
    <mesh position={[-6, 8, 0]} castShadow receiveShadow>
      <boxGeometry args={[4, 16, 4]} />
      <TextureMaterial textureName="stone_brick_wall_001" repeat={[0.5, 2]} color="#1a1816" />
    </mesh>
    {/* Arch Top */}
    <mesh position={[0, 16, 0]} castShadow receiveShadow>
      <torusGeometry args={[6, 2, 16, 32, Math.PI]} />
      <TextureMaterial textureName="stone_brick_wall_001" repeat={[2, 0.5]} color="#1a1816" />
    </mesh>
  </group>
);

const RuinChunk = ({ position, rotation, scale }: any) => (
  <mesh position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
    <dodecahedronGeometry args={[2, 0]} />
    <TextureMaterial textureName="stone_brick_wall_001" repeat={[1, 1]} color="#1a1816" />
  </mesh>
);

const Tree = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    <mesh castShadow receiveShadow position={[0, 2.5, 0]}>
      <cylinderGeometry args={[0.4, 0.6, 5, 8]} />
      <meshStandardMaterial color="#3d2b1f" roughness={1} />
    </mesh>
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
      <mesh castShadow receiveShadow position={[0, 6, 0]}>
        <dodecahedronGeometry args={[3, 0]} />
        <meshStandardMaterial color="#1e3d14" roughness={0.8} />
      </mesh>
    </Float>
    <mesh castShadow receiveShadow position={[1, 5, 0.5]}>
      <dodecahedronGeometry args={[1.5, 0]} />
      <meshStandardMaterial color="#2d4c1e" roughness={0.8} />
    </mesh>
    <mesh castShadow receiveShadow position={[-1, 4.5, -0.8]}>
      <dodecahedronGeometry args={[1.8, 0]} />
      <meshStandardMaterial color="#2d4c1e" roughness={0.8} />
    </mesh>
  </group>
);

const GrassField = () => {
  const count = 400;
  const positions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < count; i++) {
      let x = (Math.random() - 0.5) * (MAP_SIZE - 20);
      let z = (Math.random() - 0.5) * (MAP_SIZE - 20);
      if (Math.abs(x) < 25 && Math.abs(z) < 25) {
        x += x > 0 ? 25 : -25;
        z += z > 0 ? 25 : -25;
      }
      pos.push([x, 0.1, z]);
    }
    return pos;
  }, []);

  return (
    <Instances range={count}>
      <coneGeometry args={[0.1, 0.8, 3]} />
      <meshStandardMaterial color="#2d4c1e" roughness={1} />
      {positions.map((pos, i) => (
        <Instance 
          key={i} 
          position={pos as any} 
          rotation={[0, Math.random() * Math.PI, 0]} 
          scale={0.5 + Math.random()}
        />
      ))}
    </Instances>
  );
};

const FirePit = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    <mesh castShadow position={[0, 0.5, 0]}>
      <cylinderGeometry args={[1.5, 1.8, 1, 8]} />
      <TextureMaterial textureName="stone_brick_wall_001" color="#1a1816" />
    </mesh>
    <pointLight position={[0, 1.5, 0]} intensity={50} color="#ff6600" distance={20} decay={2} castShadow />
    <Float speed={4} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh position={[0, 1.2, 0]}>
        <icosahedronGeometry args={[0.4, 1]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ff6600" emissiveIntensity={5} />
      </mesh>
    </Float>
  </group>
);

const DetailedStatue = ({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) => (
  <group position={position} rotation={rotation}>
    <mesh castShadow receiveShadow position={[0, 1, 0]}>
      <boxGeometry args={[4, 2, 4]} />
      <TextureMaterial textureName="stone_brick_wall_001" color="#111" />
    </mesh>
    <mesh castShadow receiveShadow position={[0, 6, 0]}>
      <cylinderGeometry args={[1.2, 1.5, 8, 8]} />
      <TextureMaterial textureName="stone_brick_wall_001" color="#222" />
    </mesh>
    <mesh castShadow receiveShadow position={[0, 11, 0]}>
      <sphereGeometry args={[1.5, 16, 16]} />
      <TextureMaterial textureName="stone_brick_wall_001" color="#222" />
    </mesh>
    <mesh castShadow position={[2, 8, 0]} rotation={[0, 0, 0.5]}>
      <boxGeometry args={[0.5, 6, 3]} />
      <TextureMaterial textureName="stone_brick_wall_001" color="#333" />
    </mesh>
    <mesh castShadow position={[-2, 8, 0]} rotation={[0, 0, -0.5]}>
      <boxGeometry args={[0.5, 6, 3]} />
      <TextureMaterial textureName="stone_brick_wall_001" color="#333" />
    </mesh>
  </group>
);

export function MapTemple() {
  return (
    <>
      <fog attach="fog" args={['#0a0908', 30, 150]} />
      <Sky sunPosition={[120, 20, 80]} turbidity={0.01} rayleigh={0.1} inclination={0.6} azimuth={0.25} />
      <Environment preset="night" />
      
      <ambientLight intensity={0.2} color="#4060ff" />
      <directionalLight 
        position={[60, 100, 40]} 
        intensity={1.5} 
        color="#aaccff"
        castShadow 
        shadow-mapSize={[4096, 4096]} 
        shadow-camera-left={-100} 
        shadow-camera-right={100} 
        shadow-camera-top={100} 
        shadow-camera-bottom={-100} 
        shadow-bias={-0.0001}
      />
      <hemisphereLight intensity={0.2} color="#80a0ff" groundColor="#000000" />
      <ContactShadows opacity={0.6} scale={MAP_SIZE} blur={3} far={10} resolution={1024} color="#000000" />

      <Bvh firstHitOnly>
        {/* Decorative Elements */}
        <GrassField />
        
        <Tree position={[-80, 0, -80]} />
        <Tree position={[80, 0, -80]} />
        <Tree position={[-80, 0, 80]} />
        <Tree position={[80, 0, 80]} />
        <Tree position={[0, 0, -85]} />
        <Tree position={[0, 0, 85]} />
        <Tree position={[-60, 0, 0]} />
        <Tree position={[60, 0, 0]} />
        
        <DetailedStatue position={[-35, 0, -35]} rotation={[0, Math.PI / 4, 0]} />
        <DetailedStatue position={[35, 0, -35]} rotation={[0, -Math.PI / 4, 0]} />
        <DetailedStatue position={[-35, 0, 35]} rotation={[0, Math.PI * 0.75, 0]} />
        <DetailedStatue position={[35, 0, 35]} rotation={[0, -Math.PI * 0.75, 0]} />

        {/* Fire Pits */}
        <FirePit position={[15, 0, 15]} />
        <FirePit position={[-15, 0, 15]} />
        <FirePit position={[15, 0, -15]} />
        <FirePit position={[-15, 0, -15]} />
        <FirePit position={[0, 11, 0]} />

      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]} friction={1}>
        <mesh receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[MAP_SIZE, 1, MAP_SIZE]} />
          <TextureMaterial textureName="stone_brick_wall_001" repeat={[MAP_SIZE / 4, MAP_SIZE / 4]} color="#1a1816" />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid">
        
          {/* Outer Boundary Walls */}
          <mesh position={[0, WALL_HEIGHT / 2, -(MAP_SIZE / 2)]} castShadow receiveShadow>
            <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[MAP_SIZE / 8, WALL_HEIGHT / 4]} color="#1a1816" />
          </mesh>
          <mesh position={[0, WALL_HEIGHT / 2, MAP_SIZE / 2]} castShadow receiveShadow>
            <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[MAP_SIZE / 8, WALL_HEIGHT / 4]} color="#1a1816" />
          </mesh>
          <mesh position={[-25, WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[MAP_SIZE / 8, WALL_HEIGHT / 4]} color="#1a1816" />
          </mesh>
          <mesh position={[MAP_SIZE / 2, WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[MAP_SIZE / 8, WALL_HEIGHT / 4]} color="#1a1816" />
          </mesh>

          {/* Temple Central Pyramid / Altar */}
          {/* Base Tier */}
          <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[40, 3, 40]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[4, 1]} color="#1a1816" />
          </mesh>
          {/* Second Tier */}
          <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[32, 3, 32]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[3, 1]} color="#1a1816" />
          </mesh>
          {/* Third Tier */}
          <mesh position={[0, 7.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[24, 3, 24]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[2.5, 1]} color="#1a1816" />
          </mesh>
          {/* Top Altar */}
          <mesh position={[0, 10, 0]} castShadow receiveShadow>
            <boxGeometry args={[12, 2, 12]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[1.2, 0.5]} color="#1a1816" />
          </mesh>

          {/* Giant Pillars around the altar */}
          {[-25, 25].map(x => 
            [-25, 25].map(z => (
              <group key={`pillar-${x}-${z}`} position={[x, 15, z]}>
                <mesh castShadow receiveShadow>
                  <cylinderGeometry args={[2.5, 2.5, 30, 16]} />
                  <TextureMaterial textureName="stone_brick_wall_001" repeat={[1, 3]} color="#1a1816" />
                </mesh>
                {/* Pillar Base */}
                <mesh position={[0, -14, 0]} castShadow receiveShadow>
                  <boxGeometry args={[7, 2, 7]} />
                  <TextureMaterial textureName="stone_brick_wall_001" repeat={[1, 0.5]} color="#1a1816" />
                </mesh>
                {/* Pillar Top */}
                <mesh position={[0, 14, 0]} castShadow receiveShadow>
                  <boxGeometry args={[7, 2, 7]} />
                  <TextureMaterial textureName="stone_brick_wall_001" repeat={[1, 0.5]} color="#1a1816" />
                </mesh>
              </group>
            ))
          )}

          {/* Archways forming a cross */}
          <Archway position={[40, 0, 0]} rotation={[0, Math.PI/2, 0]} />
          <Archway position={[-40, 0, 0]} rotation={[0, Math.PI/2, 0]} />
          <Archway position={[0, 0, 40]} rotation={[0, 0, 0]} />
          <Archway position={[0, 0, -40]} rotation={[0, 0, 0]} />

          {/* Courtyard Enclosing Walls to form a labyrinth around the pyramid */}
          {/* North Courtyard Walls */}
          <mesh position={[-20, 4, -45]} castShadow receiveShadow>
            <boxGeometry args={[20, 8, 4]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[2, 1]} color="#1a1816" />
          </mesh>
          <mesh position={[20, 4, -45]} castShadow receiveShadow>
            <boxGeometry args={[20, 8, 4]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[2, 1]} color="#1a1816" />
          </mesh>
          
          {/* South Courtyard Walls */}
          <mesh position={[-20, 4, 45]} castShadow receiveShadow>
            <boxGeometry args={[20, 8, 4]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[2, 1]} color="#1a1816" />
          </mesh>
          <mesh position={[20, 4, 45]} castShadow receiveShadow>
            <boxGeometry args={[20, 8, 4]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[2, 1]} color="#1a1816" />
          </mesh>

          {/* East Courtyard Walls */}
          <mesh position={[45, 4, -20]} castShadow receiveShadow>
            <boxGeometry args={[4, 8, 20]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[1, 2]} color="#1a1816" />
          </mesh>
          <mesh position={[45, 4, 20]} castShadow receiveShadow>
            <boxGeometry args={[4, 8, 20]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[1, 2]} color="#1a1816" />
          </mesh>

          {/* West Courtyard Walls */}
          <mesh position={[-45, 4, -20]} castShadow receiveShadow>
            <boxGeometry args={[4, 8, 20]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[1, 2]} color="#1a1816" />
          </mesh>
          <mesh position={[-45, 4, 20]} castShadow receiveShadow>
            <boxGeometry args={[4, 8, 20]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[1, 2]} color="#1a1816" />
          </mesh>

          {/* Fallen Ruin Blocks Scattered */}
          <RuinChunk position={[30, 2, 40]} rotation={[0.2, 0.4, -0.1]} scale={[2, 2, 4]} />
          <RuinChunk position={[-35, 1.5, 30]} rotation={[-0.1, 0.7, 0.3]} scale={[3, 1.5, 2]} />
          <RuinChunk position={[40, 2.5, -30]} rotation={[0.5, -0.2, 0.1]} scale={[2.5, 2.5, 2.5]} />
          <RuinChunk position={[-30, 1.5, -40]} rotation={[-0.3, 0.1, -0.2]} scale={[2, 1.5, 5]} />
          <RuinChunk position={[10, 2, 28]} rotation={[0.1, 0.9, -0.2]} scale={[2, 2, 2]} />
          <RuinChunk position={[-15, 1, 25]} rotation={[0.8, 0.2, 0.1]} scale={[1.5, 1.5, 1.5]} />
          <RuinChunk position={[-25, 3, -15]} rotation={[0.2, 0.4, 0.8]} scale={[2.5, 2, 2.5]} />

          {/* Stairs on all 4 sides of the pyramid */}
          {/* +Z Stairs */}
          <mesh position={[0, 3, 23]} castShadow receiveShadow rotation={[0.5, 0, 0]}>
            <boxGeometry args={[10, 20, 2]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[1, 2]} color="#1a1816" />
          </mesh>
          {/* -Z Stairs */}
          <mesh position={[0, 3, -23]} castShadow receiveShadow rotation={[-0.5, 0, 0]}>
            <boxGeometry args={[10, 20, 2]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[1, 2]} color="#1a1816" />
          </mesh>
          {/* +X Stairs */}
          <mesh position={[23, 3, 0]} castShadow receiveShadow rotation={[0, 0, -0.5]}>
            <boxGeometry args={[2, 20, 10]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[2, 1]} color="#1a1816" />
          </mesh>
          {/* -X Stairs */}
          <mesh position={[-23, 3, 0]} castShadow receiveShadow rotation={[0, 0, 0.5]}>
            <boxGeometry args={[2, 20, 10]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[2, 1]} color="#1a1816" />
          </mesh>
      </RigidBody>
      </Bvh>
    </>
  );
}
