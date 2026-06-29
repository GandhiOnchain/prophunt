import { Suspense, useMemo } from 'react';
import { Sky, Environment, ContactShadows, Float, Instances, Instance, Bvh } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS } from './utils';

import { useSafeTexture } from './SafeTexture';

// Natural stone and jungle color variables
const COLOR_WEATHERED_STONE = '#9c927f'; // Beautiful aged sandstone
const COLOR_MOSSY_STONE = '#687e65';     // Moss-covered ruin blocks
const COLOR_DARK_STONE = '#51584f';      // Shaded wet stones
const COLOR_GOLD = '#d4af37';            // Ancient sacred gold details
const COLOR_LEAF_GREEN = '#2c4a21';      // Vibrant rainforest green
const COLOR_LEAF_FOREST = '#1e3815';     // Shadow canopy green

const TextureMaterial = ({ textureName, repeat = [1, 1], color = '#ffffff', roughness = 0.8, metalness = 0.15 }: { textureName: string, repeat?: [number, number], color?: string, roughness?: number, metalness?: number }) => {
  const diffUrl = `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/${textureName}/${textureName}_diff_1k.jpg`;
  const norUrl = `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/${textureName}/${textureName}_nor_gl_1k.jpg`;
  const roughUrl = `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/${textureName}/${textureName}_rough_1k.jpg`;
  
  const diffuse = useSafeTexture(diffUrl);
  const normal = useSafeTexture(norUrl);
  const rough = useSafeTexture(roughUrl);

  useMemo(() => {
    [diffuse, normal, rough].forEach((tex) => {
      if (tex) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeat[0], repeat[1]);
        tex.needsUpdate = true;
      }
    });
    if (diffuse) diffuse.colorSpace = THREE.SRGBColorSpace;
  }, [diffuse, normal, rough, repeat]);

  return (
    <meshStandardMaterial
      map={diffuse || undefined}
      normalMap={normal || undefined}
      roughnessMap={rough || undefined}
      color={color}
      roughness={rough ? 1.0 : roughness}
      metalness={metalness}
    />
  );
};

// Procedural hanging ivy vines to drape columns, pillars and arches
const HangingIvy = ({ position, length = 8 }: { position: [number, number, number], length?: number }) => {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i < length; i++) {
      const xOffset = Math.sin(i * 1.5) * 0.18;
      const zOffset = Math.cos(i * 1.2) * 0.18;
      const size = 0.45 + Math.sin(i * 0.8) * 0.12;
      pts.push({ y: -i * 0.7, x: xOffset, z: zOffset, size });
    }
    return pts;
  }, [length]);

  return (
    <group position={position}>
      {points.map((pt, idx) => (
        <mesh key={idx} position={[pt.x, pt.y, pt.z]} castShadow receiveShadow>
          <sphereGeometry args={[pt.size, 6, 6]} />
          <meshStandardMaterial color={idx % 2 === 0 ? '#385e34' : '#557c4f'} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
};

// Procedural moss clumps growing on stones and pedestal bases
const MossClump = ({ position, scale = [1, 1, 1] }: { position: [number, number, number], scale?: [number, number, number] }) => (
  <group position={position} scale={scale}>
    <mesh castShadow receiveShadow position={[0, 0, 0]}>
      <sphereGeometry args={[0.9, 6, 6]} />
      <meshStandardMaterial color="#4f6e4a" roughness={1.0} />
    </mesh>
    <mesh castShadow receiveShadow position={[0.4, -0.15, 0.25]}>
      <sphereGeometry args={[0.7, 6, 6]} />
      <meshStandardMaterial color="#3d5838" roughness={1.0} />
    </mesh>
    <mesh castShadow receiveShadow position={[-0.35, -0.2, -0.4]}>
      <sphereGeometry args={[0.8, 6, 6]} />
      <meshStandardMaterial color="#5c8257" roughness={1.0} />
    </mesh>
  </group>
);

const Archway = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => (
  <group position={position} rotation={rotation}>
    {/* Pillars */}
    <mesh position={[6, 8, 0]} castShadow receiveShadow>
      <boxGeometry args={[3, 16, 3]} />
      <TextureMaterial textureName="stone_brick_wall_001" repeat={[0.5, 2]} color={COLOR_WEATHERED_STONE} />
    </mesh>
    <mesh position={[-6, 8, 0]} castShadow receiveShadow>
      <boxGeometry args={[3, 16, 3]} />
      <TextureMaterial textureName="stone_brick_wall_001" repeat={[0.5, 2]} color={COLOR_WEATHERED_STONE} />
    </mesh>
    {/* Arch Top */}
    <mesh position={[0, 16, 0]} castShadow receiveShadow>
      <torusGeometry args={[6, 1.6, 12, 24, Math.PI]} />
      <TextureMaterial textureName="stone_brick_wall_001" repeat={[2, 0.5]} color={COLOR_MOSSY_STONE} />
    </mesh>

    {/* Elegant Hanging Ivy Creepers */}
    <HangingIvy position={[0, 14.5, 0]} length={7} />
    <HangingIvy position={[4.5, 12, 0.4]} length={5} />
    <HangingIvy position={[-4.5, 12, -0.4]} length={6} />
  </group>
);

const RuinChunk = ({ position, rotation, scale }: any) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh castShadow receiveShadow>
      <dodecahedronGeometry args={[2, 0]} />
      <TextureMaterial textureName="stone_brick_wall_001" repeat={[1, 1]} color={COLOR_MOSSY_STONE} />
    </mesh>
    {/* Moss growth on scattered boulders */}
    <MossClump position={[0.6, 1.2, 0.5]} scale={[0.8, 0.8, 0.8]} />
  </group>
);

const JungleTree = ({ position, scale = 1 }: { position: [number, number, number], scale?: number }) => (
  <group position={position} scale={scale}>
    {/* Massive Gnarly Ancient Trunk */}
    <mesh castShadow receiveShadow position={[0, 5, 0]}>
      <cylinderGeometry args={[0.7, 1.5, 10, 8]} />
      <meshStandardMaterial color="#3e2d21" roughness={0.95} />
    </mesh>
    {/* Ivy vines wrapping around trunk */}
    <mesh position={[0, 3.5, 0]} rotation={[0.4, 0.25, 0.35]}>
      <torusGeometry args={[1.25, 0.18, 8, 16]} />
      <meshStandardMaterial color="#416139" roughness={0.9} />
    </mesh>
    <mesh position={[0, 6.5, 0]} rotation={[-0.3, 0.4, -0.2]}>
      <torusGeometry args={[1.0, 0.15, 8, 16]} />
      <meshStandardMaterial color="#324f2b" roughness={0.9} />
    </mesh>
    
    {/* Organic dense, deep-green leafy canopy spheres */}
    <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.12}>
      <group position={[0, 11, 0]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[4.8, 8, 8]} />
          <meshStandardMaterial color={COLOR_LEAF_FOREST} roughness={0.8} />
        </mesh>
        <HangingIvy position={[2, -2.8, 1.8]} length={7} />
        <HangingIvy position={[-1.8, -3.0, -1.8]} length={6} />
      </group>
    </Float>
    
    {/* Additional canopy cluster layers for volume */}
    <mesh castShadow position={[2.8, 9, 1]}>
      <sphereGeometry args={[2.8, 8, 8]} />
      <meshStandardMaterial color={COLOR_LEAF_GREEN} roughness={0.8} />
    </mesh>
    <mesh castShadow position={[-2.8, 8.5, -1.2]}>
      <sphereGeometry args={[3.0, 8, 8]} />
      <meshStandardMaterial color="#213a18" roughness={0.8} />
    </mesh>
  </group>
);

const UndergrowthAndFerns = () => {
  const count = 350;
  const positions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < count; i++) {
      let x = (Math.random() - 0.5) * (MAP_SIZE - 20);
      let z = (Math.random() - 0.5) * (MAP_SIZE - 20);
      // Keep clear of the immediate central pyramid path
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
      <coneGeometry args={[0.15, 0.9, 3]} />
      <meshStandardMaterial color="#3c592f" roughness={1} />
      {positions.map((pos, i) => (
        <Instance 
          key={i} 
          position={pos as any} 
          rotation={[0, Math.random() * Math.PI, 0]} 
          scale={0.6 + Math.random() * 0.8}
        />
      ))}
    </Instances>
  );
};

const FallenLeaves = () => {
  const count = 120;
  const leafData = useMemo(() => {
    const data = [];
    const colors = ['#2b481f', '#446836', '#698c59', '#a2762a', '#b45a16'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * 52;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = 0.05;
      const rotation = [Math.random() * 0.15, Math.random() * Math.PI, Math.random() * 0.15];
      const size = 0.35 + Math.random() * 0.45;
      const color = colors[Math.floor(Math.random() * colors.length)];
      data.push({ position: [x, y, z], rotation, scale: [size, 0.04, size * 1.6], color });
    }
    return data;
  }, []);

  const groupedLeaves = useMemo(() => {
    const groups: { [color: string]: any[] } = {};
    leafData.forEach(leaf => {
      if (!groups[leaf.color]) {
        groups[leaf.color] = [];
      }
      groups[leaf.color].push(leaf);
    });
    return Object.entries(groups);
  }, [leafData]);

  return (
    <group>
      {groupedLeaves.map(([color, leaves]) => (
        <Instances key={color} limit={leaves.length} range={leaves.length}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={color} roughness={1.0} />
          {leaves.map((leaf, idx) => (
            <Instance
              key={idx}
              position={leaf.position as any}
              rotation={leaf.rotation as any}
              scale={leaf.scale as any}
            />
          ))}
        </Instances>
      ))}
    </group>
  );
};

const FirePit = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    {/* Engraved Ancient Stone Bowl */}
    <mesh castShadow position={[0, 0.6, 0]}>
      <cylinderGeometry args={[1.7, 1.4, 1.2, 12]} />
      <TextureMaterial textureName="stone_brick_wall_001" color={COLOR_MOSSY_STONE} />
    </mesh>
    <mesh castShadow position={[0, 1.2, 0]}>
      <torusGeometry args={[1.5, 0.28, 8, 24]} />
      <meshStandardMaterial color="#4a5347" roughness={0.8} />
    </mesh>
    
    {/* Charcoal base */}
    <mesh position={[0, 1.2, 0]}>
      <sphereGeometry args={[1.2, 8, 8]} />
      <meshStandardMaterial color="#171c15" roughness={1.0} />
    </mesh>

    {/* Vibrant Warm Dynamic Firelight */}
    <pointLight position={[0, 2.3, 0]} intensity={25} color="#f97316" distance={28} decay={1.4} castShadow />

    {/* Multi-layered flickering flame geometry with Float motion */}
    <Float speed={4.5} rotationIntensity={0.5} floatIntensity={0.35}>
      <group position={[0, 1.7, 0]}>
        {/* Intense Core Flame */}
        <mesh>
          <coneGeometry args={[0.55, 1.7, 5]} />
          <meshStandardMaterial color="#fef08a" emissive="#eab308" emissiveIntensity={12} />
        </mesh>
        {/* Outer Burning Fire Layers */}
        <mesh position={[0.18, -0.15, -0.1]} rotation={[0.2, 0.4, -0.12]}>
          <coneGeometry args={[0.38, 1.3, 4]} />
          <meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={9} />
        </mesh>
        <mesh position={[-0.18, -0.08, 0.18]} rotation={[-0.12, -0.3, 0.18]}>
          <coneGeometry args={[0.42, 1.4, 4]} />
          <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={7} />
        </mesh>
      </group>
    </Float>

    {/* Levitating glowing ember particles */}
    <Float speed={2.2} rotationIntensity={0.8} floatIntensity={0.9}>
      <mesh position={[0.4, 2.9, -0.35]}>
        <boxGeometry args={[0.09, 0.09, 0.09]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={14} />
      </mesh>
    </Float>
    <Float speed={2.8} rotationIntensity={0.6} floatIntensity={1.3}>
      <mesh position={[-0.35, 3.3, 0.4]}>
        <boxGeometry args={[0.07, 0.07, 0.07]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={18} />
      </mesh>
    </Float>
  </group>
);

const DetailedStatue = ({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) => (
  <group position={position} rotation={rotation}>
    {/* Ornate Base Pedestal with Decorative Moldings */}
    <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
      <boxGeometry args={[4.4, 1.5, 4.4]} />
      <TextureMaterial textureName="stone_brick_wall_001" color={COLOR_MOSSY_STONE} />
    </mesh>
    <mesh castShadow receiveShadow position={[0, 1.75, 0]}>
      <cylinderGeometry args={[1.8, 2.1, 0.5, 12]} />
      <TextureMaterial textureName="stone_brick_wall_001" color={COLOR_WEATHERED_STONE} />
    </mesh>

    {/* Guardian Body Armoured Torso */}
    <mesh castShadow receiveShadow position={[0, 4.5, 0]}>
      <boxGeometry args={[2.2, 5, 1.8]} />
      <TextureMaterial textureName="stone_brick_wall_001" color={COLOR_WEATHERED_STONE} />
    </mesh>

    {/* Aged Ceremonial Gold Pauldrons */}
    <mesh castShadow position={[1.4, 6.2, 0]} rotation={[0, 0, -0.35]}>
      <sphereGeometry args={[1.05, 8, 8]} />
      <meshStandardMaterial color={COLOR_GOLD} metalness={0.75} roughness={0.25} />
    </mesh>
    <mesh castShadow position={[-1.4, 6.2, 0]} rotation={[0, 0, 0.35]}>
      <sphereGeometry args={[1.05, 8, 8]} />
      <meshStandardMaterial color={COLOR_GOLD} metalness={0.75} roughness={0.25} />
    </mesh>

    {/* Guardian Arms holding weapon */}
    <mesh castShadow position={[1.3, 4.5, 0.75]} rotation={[0.75, 0, -0.25]}>
      <cylinderGeometry args={[0.38, 0.38, 3.2]} />
      <TextureMaterial textureName="stone_brick_wall_001" color={COLOR_WEATHERED_STONE} />
    </mesh>
    <mesh castShadow position={[-1.3, 4.5, 0.75]} rotation={[0.75, 0, 0.25]}>
      <cylinderGeometry args={[0.38, 0.38, 3.2]} />
      <TextureMaterial textureName="stone_brick_wall_001" color={COLOR_WEATHERED_STONE} />
    </mesh>

    {/* Sacred Relic Staff / Spear */}
    <group position={[1.3, 5.5, 2.1]} rotation={[0.08, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.11, 0.11, 10.5, 8]} />
        <meshStandardMaterial color="#35241b" roughness={0.9} />
      </mesh>
      <mesh position={[0, 5.8, 0]} castShadow>
        <coneGeometry args={[0.36, 1.7, 4]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.15} emissive="#d97706" emissiveIntensity={0.6} />
      </mesh>
    </group>

    {/* Ancient Helmet / Headwear */}
    <mesh castShadow position={[0, 7.8, 0]}>
      <sphereGeometry args={[1.15, 12, 12]} />
      <TextureMaterial textureName="stone_brick_wall_001" color={COLOR_WEATHERED_STONE} />
    </mesh>
    <mesh castShadow position={[0, 8.7, 0]} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[1.05, 1.4, 4]} />
      <meshStandardMaterial color={COLOR_GOLD} metalness={0.8} roughness={0.2} />
    </mesh>

    {/* Glowing Sapphire Core relics */}
    <mesh position={[0, 4.5, 0.95]}>
      <octahedronGeometry args={[0.28, 0]} />
      <meshStandardMaterial color="#06b6d4" emissive="#0a91b5" emissiveIntensity={3} />
    </mesh>

    {/* Glowing Magic Eyes */}
    <mesh position={[0.34, 7.85, 0.96]}>
      <sphereGeometry args={[0.11, 6, 6]} />
      <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={8} />
    </mesh>
    <mesh position={[-0.34, 7.85, 0.96]}>
      <sphereGeometry args={[0.11, 6, 6]} />
      <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={8} />
    </mesh>

    {/* Clinging base moss */}
    <MossClump position={[1.4, 0.1, -1.3]} scale={[1, 0.75, 1]} />
    <MossClump position={[-1.7, 0.1, 1.6]} scale={[0.85, 0.6, 0.85]} />
  </group>
);

export function MapTemple() {
  return (
    <>
      {/* High-quality jade forest fog mist for outstanding environmental depth */}
      <fog attach="fog" args={['#132017', 40, 175]} />
      <Sky sunPosition={[100, 30, 70]} turbidity={0.05} rayleigh={0.15} inclination={0.55} azimuth={0.22} />
      
      {/* Authentic, highly detailed ambient lighting using a professional forest preset */}
      <Environment preset="forest" />
      
      {/* Dynamic warm/green ambient light combination */}
      <ambientLight intensity={0.45} color="#d4e8d3" />
      <directionalLight 
        position={[50, 90, 35]} 
        intensity={2.2} 
        color="#fef3c7" // Warm sun shafts
        castShadow 
        shadow-mapSize={[2048, 2048]} 
        shadow-camera-left={-75} 
        shadow-camera-right={75} 
        shadow-camera-top={75} 
        shadow-camera-bottom={-75} 
        shadow-bias={-0.0003}
      />
      <hemisphereLight intensity={0.35} color="#a7f3d0" groundColor="#2d2118" />
      <ContactShadows opacity={0.65} scale={MAP_SIZE} blur={2.8} far={12} resolution={1024} color="#050a06" />

      <Bvh firstHitOnly>
        {/* Ancient vegetation layers */}
        <UndergrowthAndFerns />
        <FallenLeaves />
        
        {/* Jungle Trees with wrap-around creeping ivy */}
        <JungleTree position={[-60, 0, -60]} scale={1.1} />
        <JungleTree position={[60, 0, -60]} scale={1.05} />
        <JungleTree position={[-60, 0, 60]} scale={1.0} />
        <JungleTree position={[60, 0, 60]} scale={1.15} />
        <JungleTree position={[0, 0, -65]} scale={1.0} />
        <JungleTree position={[0, 0, 65]} scale={1.1} />
        <JungleTree position={[-55, 0, 0]} scale={1.0} />
        <JungleTree position={[55, 0, 0]} scale={1.05} />
        
        {/* Imposing Guardian statues holding golden sacred spears */}
        <DetailedStatue position={[-32, 0, -32]} rotation={[0, Math.PI / 4, 0]} />
        <DetailedStatue position={[32, 0, -32]} rotation={[0, -Math.PI / 4, 0]} />
        <DetailedStatue position={[-32, 0, 32]} rotation={[0, Math.PI * 0.75, 0]} />
        <DetailedStatue position={[32, 0, 32]} rotation={[0, -Math.PI * 0.75, 0]} />

        {/* Flickering sacred fire braziers */}
        <FirePit position={[15, 0, 15]} />
        <FirePit position={[-15, 0, 15]} />
        <FirePit position={[15, 0, -15]} />
        <FirePit position={[-15, 0, -15]} />
        <FirePit position={[0, 11, 0]} />

      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]} friction={1}>
        <mesh receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[MAP_SIZE, 1, MAP_SIZE]} />
          <TextureMaterial textureName="stone_brick_wall_001" repeat={[MAP_SIZE / 4, MAP_SIZE / 4]} color={COLOR_WEATHERED_STONE} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid">
          {/* Outer Boundary Walls (Properly aligned to prevent clipping and dark box effect) */}
          <mesh position={[0, WALL_HEIGHT / 2, -(MAP_SIZE / 2)]} castShadow receiveShadow>
            <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[MAP_SIZE / 8, WALL_HEIGHT / 4]} color={COLOR_MOSSY_STONE} />
          </mesh>
          <mesh position={[0, WALL_HEIGHT / 2, MAP_SIZE / 2]} castShadow receiveShadow>
            <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[MAP_SIZE / 8, WALL_HEIGHT / 4]} color={COLOR_MOSSY_STONE} />
          </mesh>
          {/* CRITICAL FIX: Repositioned from -25 to properly bound western map edge at -(MAP_SIZE / 2) */}
          <mesh position={[-(MAP_SIZE / 2), WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[MAP_SIZE / 8, WALL_HEIGHT / 4]} color={COLOR_MOSSY_STONE} />
          </mesh>
          <mesh position={[MAP_SIZE / 2, WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[MAP_SIZE / 8, WALL_HEIGHT / 4]} color={COLOR_MOSSY_STONE} />
          </mesh>

          {/* Temple Central Pyramid / Altar */}
          {/* Base Tier */}
          <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[40, 3, 40]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[4, 1]} color={COLOR_WEATHERED_STONE} />
          </mesh>
          {/* Second Tier */}
          <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[32, 3, 32]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[3, 1]} color={COLOR_WEATHERED_STONE} />
          </mesh>
          {/* Third Tier */}
          <mesh position={[0, 7.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[24, 3, 24]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[2.5, 1]} color={COLOR_MOSSY_STONE} />
          </mesh>
          {/* Top Altar */}
          <mesh position={[0, 10, 0]} castShadow receiveShadow>
            <boxGeometry args={[12, 2, 12]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[1.2, 0.5]} color={COLOR_MOSSY_STONE} />
          </mesh>

          {/* Giant Pillars around the altar with hanging vines */}
          {[-22, 22].map(x => 
            [-22, 22].map(z => (
              <group key={`pillar-${x}-${z}`} position={[x, 15, z]}>
                <mesh castShadow receiveShadow>
                  <cylinderGeometry args={[2.2, 2.2, 30, 16]} />
                  <TextureMaterial textureName="stone_brick_wall_001" repeat={[1, 3]} color={COLOR_WEATHERED_STONE} />
                </mesh>
                {/* Pillar Base */}
                <mesh position={[0, -14, 0]} castShadow receiveShadow>
                  <boxGeometry args={[6, 2, 6]} />
                  <TextureMaterial textureName="stone_brick_wall_001" repeat={[1, 0.5]} color={COLOR_MOSSY_STONE} />
                </mesh>
                {/* Pillar Top */}
                <mesh position={[0, 14, 0]} castShadow receiveShadow>
                  <boxGeometry args={[6, 2, 6]} />
                  <TextureMaterial textureName="stone_brick_wall_001" repeat={[1, 0.5]} color={COLOR_MOSSY_STONE} />
                </mesh>
                <HangingIvy position={[0, 12, 0]} length={8} />
              </group>
            ))
          )}

          {/* Archways forming a cross */}
          <Archway position={[35, 0, 0]} rotation={[0, Math.PI/2, 0]} />
          <Archway position={[-35, 0, 0]} rotation={[0, Math.PI/2, 0]} />
          <Archway position={[0, 0, 35]} rotation={[0, 0, 0]} />
          <Archway position={[0, 0, -35]} rotation={[0, 0, 0]} />

          {/* Courtyard Enclosing Walls forming a labyrinth */}
          {/* North Courtyard Walls */}
          <mesh position={[-20, 4, -40]} castShadow receiveShadow>
            <boxGeometry args={[20, 8, 3]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[2, 1]} color={COLOR_WEATHERED_STONE} />
          </mesh>
          <mesh position={[20, 4, -40]} castShadow receiveShadow>
            <boxGeometry args={[20, 8, 3]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[2, 1]} color={COLOR_WEATHERED_STONE} />
          </mesh>
          
          {/* South Courtyard Walls */}
          <mesh position={[-20, 4, 40]} castShadow receiveShadow>
            <boxGeometry args={[20, 8, 3]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[2, 1]} color={COLOR_WEATHERED_STONE} />
          </mesh>
          <mesh position={[20, 4, 40]} castShadow receiveShadow>
            <boxGeometry args={[20, 8, 3]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[2, 1]} color={COLOR_WEATHERED_STONE} />
          </mesh>

          {/* East Courtyard Walls */}
          <mesh position={[40, 4, -20]} castShadow receiveShadow>
            <boxGeometry args={[3, 8, 20]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[1, 2]} color={COLOR_MOSSY_STONE} />
          </mesh>
          <mesh position={[40, 4, 20]} castShadow receiveShadow>
            <boxGeometry args={[3, 8, 20]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[1, 2]} color={COLOR_MOSSY_STONE} />
          </mesh>

          {/* West Courtyard Walls */}
          <mesh position={[-40, 4, -20]} castShadow receiveShadow>
            <boxGeometry args={[3, 8, 20]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[1, 2]} color={COLOR_MOSSY_STONE} />
          </mesh>
          <mesh position={[-40, 4, 20]} castShadow receiveShadow>
            <boxGeometry args={[3, 8, 20]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[1, 2]} color={COLOR_MOSSY_STONE} />
          </mesh>

          {/* Scattered Fallen Ruin chunks with grown moss */}
          <RuinChunk position={[28, 2, 35]} rotation={[0.2, 0.4, -0.1]} scale={[2, 2, 4]} />
          <RuinChunk position={[-32, 1.5, 28]} rotation={[-0.1, 0.7, 0.3]} scale={[3, 1.5, 2]} />
          <RuinChunk position={[35, 2.5, -28]} rotation={[0.5, -0.2, 0.1]} scale={[2.5, 2.5, 2.5]} />
          <RuinChunk position={[-28, 1.5, -35]} rotation={[-0.3, 0.1, -0.2]} scale={[2, 1.5, 5]} />
          <RuinChunk position={[10, 2, 25]} rotation={[0.1, 0.9, -0.2]} scale={[2, 2, 2]} />
          <RuinChunk position={[-15, 1, 22]} rotation={[0.8, 0.2, 0.1]} scale={[1.5, 1.5, 1.5]} />
          <RuinChunk position={[-22, 3, -15]} rotation={[0.2, 0.4, 0.8]} scale={[2.5, 2, 2.5]} />

          {/* Stairs on all 4 sides of the pyramid */}
          {/* +Z Stairs */}
          <mesh position={[0, 3, 22]} castShadow receiveShadow rotation={[0.5, 0, 0]}>
            <boxGeometry args={[10, 20, 2]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[1, 2]} color={COLOR_WEATHERED_STONE} />
          </mesh>
          {/* -Z Stairs */}
          <mesh position={[0, 3, -22]} castShadow receiveShadow rotation={[-0.5, 0, 0]}>
            <boxGeometry args={[10, 20, 2]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[1, 2]} color={COLOR_WEATHERED_STONE} />
          </mesh>
          {/* +X Stairs */}
          <mesh position={[22, 3, 0]} castShadow receiveShadow rotation={[0, 0, -0.5]}>
            <boxGeometry args={[2, 20, 10]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[2, 1]} color={COLOR_WEATHERED_STONE} />
          </mesh>
          {/* -X Stairs */}
          <mesh position={[-22, 3, 0]} castShadow receiveShadow rotation={[0, 0, 0.5]}>
            <boxGeometry args={[2, 20, 10]} />
            <TextureMaterial textureName="stone_brick_wall_001" repeat={[2, 1]} color={COLOR_WEATHERED_STONE} />
          </mesh>
      </RigidBody>
      </Bvh>
    </>
  );
}
