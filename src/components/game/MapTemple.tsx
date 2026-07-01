import { Suspense, useMemo, useRef, useLayoutEffect } from "react";
import {
  Sky,
  Environment,
  Float,
  Instances,
  Instance,
  Bvh,
} from "@react-three/drei";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS } from "./utils";
import { useSafeTexture } from "./SafeTexture";
import { AnimatedFire } from "./FireShader";

// Premium high-fidelity ancient temple color palette (Image 2 & 3 style)
const COLOR_WEATHERED_STONE = "#ab8a73"; // Rich, warm, sun-kissed terracotta sandstone
const COLOR_DARK_STONE = "#543f32"; // Deep, warm dark-chocolate basalt/volcanic stone
const COLOR_MOSSY_STONE = "#6e7a56"; // Weathered mossy-ochre ancient masonry
const COLOR_GOLD = "#d9a041"; // Warm ceremonial sacrificial gold inlay
const COLOR_LEAF_GREEN = "#355c25"; // Vibrant tropical jungle canopy green
const COLOR_LEAF_FOREST = "#1f3814"; // Dense forest shadow green
const COLOR_MARBLE_SLAB = "#ded0bb"; // Ancient cracked ivory marble tiles

// TextureMaterial that loads Poly Haven textures with high-quality settings
const TextureMaterial = ({
  textureName,
  repeat = [1, 1],
  color = "#ffffff",
  roughness = 0.85,
  metalness = 0.1,
  transparent = false,
  alphaTest = 0,
  side = THREE.FrontSide,
}: {
  textureName: string;
  repeat?: [number, number];
  color?: string;
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  alphaTest?: number;
  side?: THREE.Side;
}) => {
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
      transparent={transparent}
      alphaTest={alphaTest}
      side={side}
    />
  );
};

// Highly optimized instanced hanging ivy component
const InstancedHangingIvy = () => {
  const segments = useMemo(() => {
    const list: { pos: [number, number, number]; size: number; color: string }[] = [];
    const addIvy = (pos: [number, number, number], length: number) => {
      for (let i = 0; i < length; i++) {
        const xOffset = Math.sin(i * 1.4) * 0.15;
        const zOffset = Math.cos(i * 1.1) * 0.15;
        const size = 0.38 + Math.sin(i * 0.7) * 0.1;
        list.push({
          pos: [pos[0] + xOffset, pos[1] - i * 0.75, pos[2] + zOffset],
          size,
          color: i % 2 === 0 ? "#2a441e" : "#3e5c2f",
        });
      }
    };

    // Roof and high walls vines
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 20 + Math.random() * 20;
      addIvy([Math.cos(angle) * r, 30, Math.sin(angle) * r], 8 + Math.random() * 12);
    }
    // Mid walls vines
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 12 + Math.random() * 15;
      addIvy([Math.cos(angle) * r, 22, Math.sin(angle) * r], 6 + Math.random() * 8);
    }
    // Pillars vines
    [[-22, -22], [-22, 22], [22, -22], [22, 22]].forEach(([px, pz]) => {
      addIvy([px + 1.5, 20, pz + 1.5], 18);
      addIvy([px - 1.5, 20, pz - 1.5], 15);
    });
    // Skylight vines
    addIvy([7, 36, 7], 25);
    addIvy([-7, 36, -6], 20);
    addIvy([6, 36, -7], 22);
    addIvy([-6, 36, 8], 18);

    // Other specific locations
    addIvy([0, 24.5, 0], 8);
    addIvy([1.5, 21, 1.5], 5);
    addIvy([-1.5, 18, -1.5], 6);
    addIvy([0.8, 2.0, -0.1], 4);
    addIvy([-0.8, 2.0, -0.1], 3);
    addIvy([0, 14.5, 0], 7);
    addIvy([4.5, 12, 0.4], 5);
    addIvy([-4.5, 12, -0.4], 6);
    addIvy([4.0, 10.0, 2.0], 7);
    addIvy([-3.8, 10.2, -1.5], 6);
    addIvy([1.5, 11.2, 3.2], 8);
    addIvy([-1.5, 11.0, -3.0], 7);
    addIvy([0, 11.5, 0], 5);

    return list;
  }, []);

  return (
    <Instances range={segments.length} castShadow receiveShadow>
      <sphereGeometry args={[1, 5, 5]} />
      <meshStandardMaterial roughness={0.95} />
      {segments.map((seg, i) => (
        <Instance key={i} position={seg.pos} scale={seg.size} color={seg.color} />
      ))}
    </Instances>
  );
};

// Procedural Moss Clumps growing on bases of columns (Image 1 & 3 style)
const MossClump = ({
  position,
  scale = [1, 1, 1],
}: {
  position: [number, number, number];
  scale?: [number, number, number];
}) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[0.8, 5, 5]} />
      <meshStandardMaterial color="#354e2f" roughness={1.0} />
    </mesh>
    <mesh position={[0.4, -0.15, 0.3]}>
      <sphereGeometry args={[0.55, 4, 4]} />
      <meshStandardMaterial color="#253c1f" roughness={1.0} />
    </mesh>
  </group>
);

// Authentic Volumetric God Rays (Fake volumetric scattering)
const GodRays = () => (
  <group position={[10, 20, 0]} rotation={[0, 0, 0.4]}>
    {[...Array(12)].map((_, i) => (
      <mesh
        key={i}
        position={[
          (Math.random() - 0.5) * 120,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 120,
        ]}
        rotation={[0.55, 0.18, -0.3]}
      >
        <cylinderGeometry
          args={[1 + Math.random() * 4, 8 + Math.random() * 8, 80, 8]}
        />
        <meshBasicMaterial
          color="#fff8eb"
          transparent
          opacity={0.03 + Math.random() * 0.03}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    ))}
  </group>
);

// Monumental architectural columns exactly as shown in Image 1 & 2
const MonumentalColumn = ({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) => {
  return (
    <group position={position} scale={scale}>
      {/* Stacked Heavy Base Moldings */}
      <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[4.8, 1.8, 4.8]} />
        <TextureMaterial
          textureName="stone_brick_wall_001"
          color={COLOR_DARK_STONE}
        />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 2.2, 0]}>
        <cylinderGeometry args={[2.1, 2.4, 0.8, 16]} />
        <TextureMaterial
          textureName="stone_brick_wall_001"
          color={COLOR_WEATHERED_STONE}
        />
      </mesh>

      {/* Stacked Grooved Column Shaft Drums (Highly segmented with gold inlay details as in Image 1) */}
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} position={[0, 4.4 + i * 4.4, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[1.75, 1.82, 4.4, 16]} />
            <TextureMaterial
              textureName="stone_brick_wall_001"
              repeat={[1, 1]}
              color={COLOR_WEATHERED_STONE}
            />
          </mesh>

          {/* Detailed Fluting (Vertical Grooves) matching Image 1 & 2 */}
          {Array.from({ length: 12 }).map((_, j) => {
            const angle = (j / 12) * Math.PI * 2;
            const radius = 1.76;
            const fx = Math.sin(angle) * radius;
            const fz = Math.cos(angle) * radius;
            return (
              <mesh
                key={`flute-${j}`}
                position={[fx, 0, fz]}
                rotation={[0, angle, 0]}
                
               castShadow receiveShadow
              >
                <boxGeometry args={[0.3, 4.2, 0.18]} />
                <TextureMaterial
                  textureName="stone_brick_wall_001"
                  color={COLOR_WEATHERED_STONE}
                />
              </mesh>
            );
          })}

          {/* Vertically running gold engravings between some fluting segments */}
          {Array.from({ length: 4 }).map((_, j) => {
            const angle = (j / 4) * Math.PI * 2 + Math.PI / 8;
            const radius = 1.78;
            const fx = Math.sin(angle) * radius;
            const fz = Math.cos(angle) * radius;
            return (
              <mesh
                key={`gold-line-${j}`}
                position={[fx, 0, fz]}
                rotation={[0, angle, 0]}
                
              >
                <boxGeometry args={[0.08, 4.3, 0.08]} />
                <meshStandardMaterial
                  color={COLOR_GOLD}
                  metalness={0.9}
                  roughness={0.15}
                />
              </mesh>
            );
          })}

          {/* Detailed Golden Rings (Sacred Engravings style) */}
          <mesh position={[0, 2.2, 0]} >
            <torusGeometry args={[1.86, 0.16, 8, 20]} />
            <meshStandardMaterial
              color={COLOR_GOLD}
              metalness={0.85}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[0, -2.2, 0]} >
            <torusGeometry args={[1.86, 0.16, 8, 20]} />
            <meshStandardMaterial color={COLOR_DARK_STONE} roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Flared capital top crown */}
      <mesh  position={[0, 25.4, 0]}>
        <cylinderGeometry args={[2.4, 1.85, 1.4, 16]} />
        <TextureMaterial
          textureName="stone_brick_wall_001"
          color={COLOR_MOSSY_STONE}
        />
      </mesh>
      <mesh  position={[0, 26.5, 0]}>
        <boxGeometry args={[5.2, 0.8, 5.2]} />
        <TextureMaterial
          textureName="stone_brick_wall_001"
          color={COLOR_DARK_STONE}
        />
      </mesh>

      {/* Organic Creeping Roots climbing column shaft (Image 3 style) */}
      <group position={[0, 0, 0]}>
        <mesh
          position={[1.2, 6, 1.1]}
          rotation={[0.04, 0.25, -0.05]}
          
        >
          <cylinderGeometry args={[0.25, 0.45, 12, 6]} />
          <meshStandardMaterial color="#2c1e14" roughness={0.95} />
        </mesh>
        <mesh
          position={[-1.3, 11, -0.9]}
          rotation={[-0.06, -0.2, 0.06]}
          
        >
          <cylinderGeometry args={[0.18, 0.32, 16, 6]} />
          <meshStandardMaterial color="#352419" roughness={0.95} />
        </mesh>
      </group>

      <MossClump position={[1.8, 0.1, 1.8]} scale={[1.1, 1.1, 1.1]} />
    </group>
  );
};

// Stylized Sacred Bird / Garuda Statue flanking central stairs exactly as shown in Image 3
const BlackBirdStatue = ({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) => (
  <group position={position} rotation={rotation}>
    {/* Stacked stone base */}
    <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
      <boxGeometry args={[3.2, 1.0, 3.2]} />
      <TextureMaterial
        textureName="stone_brick_wall_001"
        color={COLOR_DARK_STONE}
      />
    </mesh>
    <mesh  position={[0, 1.25, 0]}>
      <cylinderGeometry args={[1.2, 1.4, 0.5, 8]} />
      <meshStandardMaterial color={COLOR_DARK_STONE} roughness={0.9} />
    </mesh>

    {/* Black Eagle Body */}
    <mesh  position={[0, 2.3, 0]}>
      <cylinderGeometry args={[0.65, 0.85, 1.6, 8]} />
      <meshStandardMaterial color="#21241f" roughness={0.8} />
    </mesh>

    {/* Eagle Head with curved golden beak */}
    <group position={[0, 3.2, 0.18]}>
      <mesh >
        <sphereGeometry args={[0.42, 8, 8]} />
        <meshStandardMaterial color="#21241f" roughness={0.8} />
      </mesh>
      {/* Beak */}
      <mesh  position={[0, -0.12, 0.35]} rotation={[0.4, 0, 0]}>
        <coneGeometry args={[0.15, 0.55, 4]} />
        <meshStandardMaterial
          color={COLOR_GOLD}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </group>

    {/* Outstretched Wings (Multi-layered Feather Panels flanking stairs as in Image 3) */}
    {/* Right Wing (Layered) */}
    <group position={[1.0, 2.6, -0.25]} rotation={[0.2, -0.5, -0.6]}>
      <mesh  position={[0, 0, 0]}>
        <boxGeometry args={[2.0, 3.2, 0.15]} />
        <meshStandardMaterial color="#1a1c18" roughness={0.9} />
      </mesh>
      <mesh  position={[0.4, -0.4, 0.05]} rotation={[0, 0, -0.25]}>
        <boxGeometry args={[1.8, 2.6, 0.1]} />
        <meshStandardMaterial color="#131512" roughness={0.95} />
      </mesh>
      <mesh  position={[0.7, -0.8, 0.1]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[1.5, 1.8, 0.08]} />
        <meshStandardMaterial color="#2d3329" roughness={0.9} />
      </mesh>
    </group>
    {/* Left Wing (Layered) */}
    <group position={[-1.0, 2.6, -0.25]} rotation={[0.2, 0.5, 0.6]}>
      <mesh  position={[0, 0, 0]}>
        <boxGeometry args={[2.0, 3.2, 0.15]} />
        <meshStandardMaterial color="#1a1c18" roughness={0.9} />
      </mesh>
      <mesh  position={[-0.4, -0.4, 0.05]} rotation={[0, 0, 0.25]}>
        <boxGeometry args={[1.8, 2.6, 0.1]} />
        <meshStandardMaterial color="#131512" roughness={0.95} />
      </mesh>
      <mesh  position={[-0.7, -0.8, 0.1]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[1.5, 1.8, 0.08]} />
        <meshStandardMaterial color="#2d3329" roughness={0.9} />
      </mesh>
    </group>

    {/* Claws grasping the pedestal base */}
    <group position={[0, 1.5, 0.5]}>
      <mesh  position={[0.3, 0, 0]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.25, 0.15, 0.65]} />
        <meshStandardMaterial
          color={COLOR_GOLD}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <mesh  position={[-0.3, 0, 0]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.25, 0.15, 0.65]} />
        <meshStandardMaterial
          color={COLOR_GOLD}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </group>

    {/* Glowing Relic Chest core */}
    <mesh position={[0, 2.2, 0.8]}>
      <sphereGeometry args={[0.18, 6, 6]} />
      <meshStandardMaterial
        color="#e0a82e"
        emissive="#ea580c"
        emissiveIntensity={6}
      />
    </mesh>
  </group>
);

// High-fidelity procedural Paving Slabs to replicate the mossy floor of Image 1 & 2
const MossyPavingSlabs = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const slabs = useMemo(() => {
    const data: { position: [number, number, number], rotation: [number, number, number], scale: [number, number, number], color: string }[] = [];

    // 1. DENSE PAVEMENT FOR CENTRAL GALLERY PATHS
    for (let i = -60; i <= 60; i += 4.5) {
      if (Math.abs(i) < 18) continue;

      const z = i + (Math.random() - 0.5) * 1.5;
      data.push({
        position: [-2.2 + (Math.random() - 0.5) * 0.4, 0.12, z],
        rotation: [(Math.random() - 0.5) * 0.04, Math.random() * 0.1, (Math.random() - 0.5) * 0.04],
        scale: [2.5 + Math.random() * 0.8, 0.15 + Math.random() * 0.1, 3.2 + Math.random() * 0.8],
        color: Math.random() > 0.45 ? COLOR_MARBLE_SLAB : "#9c8e7f",
      });
      data.push({
        position: [2.2 + (Math.random() - 0.5) * 0.4, 0.12, z],
        rotation: [(Math.random() - 0.5) * 0.04, Math.random() * 0.1, (Math.random() - 0.5) * 0.04],
        scale: [2.5 + Math.random() * 0.8, 0.15 + Math.random() * 0.1, 3.2 + Math.random() * 0.8],
        color: Math.random() > 0.45 ? COLOR_MARBLE_SLAB : "#9c8e7f",
      });

      const x = i + (Math.random() - 0.5) * 1.5;
      data.push({
        position: [x, 0.12, -2.2 + (Math.random() - 0.5) * 0.4],
        rotation: [(Math.random() - 0.5) * 0.04, Math.random() * 0.1, (Math.random() - 0.5) * 0.04],
        scale: [3.2 + Math.random() * 0.8, 0.15 + Math.random() * 0.1, 2.5 + Math.random() * 0.8],
        color: Math.random() > 0.45 ? COLOR_MARBLE_SLAB : "#9c8e7f",
      });
      data.push({
        position: [x, 0.12, 2.2 + (Math.random() - 0.5) * 0.4],
        rotation: [(Math.random() - 0.5) * 0.04, Math.random() * 0.1, (Math.random() - 0.5) * 0.04],
        scale: [3.2 + Math.random() * 0.8, 0.15 + Math.random() * 0.1, 2.5 + Math.random() * 0.8],
        color: Math.random() > 0.45 ? COLOR_MARBLE_SLAB : "#9c8e7f",
      });
    }

    // 2. SCATTERED RUINED COURTYARD SLABS
    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 18 + Math.random() * 95;
      data.push({
        position: [Math.sin(angle) * dist, (0.12 + Math.random() * 0.18) / 2, Math.cos(angle) * dist],
        rotation: [(Math.random() - 0.5) * 0.06, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.06],
        scale: [2.8 + Math.random() * 3.8, 0.12 + Math.random() * 0.18, 2.8 + Math.random() * 3.8],
        color: Math.random() > 0.5 ? COLOR_MARBLE_SLAB : (Math.random() > 0.5 ? "#8d7b6e" : "#a39382"),
      });
    }

    return data;
  }, []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    slabs.forEach((s, i) => {
      dummy.position.set(s.position[0], s.position[1], s.position[2]);
      dummy.rotation.set(s.rotation[0], s.rotation[1], s.rotation[2]);
      dummy.scale.set(s.scale[0], s.scale[1], s.scale[2]);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, c.set(s.color));
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [slabs]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, slabs.length]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <TextureMaterial textureName="mossy_marble_slab" color={COLOR_WEATHERED_STONE} roughness={0.4} />
    </instancedMesh>
  );
};

// Detailed Archway over the corridor gallery
const Archway = ({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) => (
  <group position={position} rotation={rotation}>
    {/* Pillars */}
    <mesh position={[6, 8, 0]} castShadow receiveShadow>
      <boxGeometry args={[3, 16, 3]} />
      <TextureMaterial
        textureName="stone_brick_wall_001"
        repeat={[0.5, 2]}
        color={COLOR_WEATHERED_STONE}
      />
    </mesh>
    <mesh position={[-6, 8, 0]} castShadow receiveShadow>
      <boxGeometry args={[3, 16, 3]} />
      <TextureMaterial
        textureName="stone_brick_wall_001"
        repeat={[0.5, 2]}
        color={COLOR_WEATHERED_STONE}
      />
    </mesh>
    {/* Arch Crown */}
    <mesh position={[0, 16, 0]} castShadow receiveShadow>
      <torusGeometry args={[6, 1.5, 12, 24, Math.PI]} />
      <TextureMaterial
        textureName="stone_brick_wall_001"
        repeat={[2, 0.5]}
        color={COLOR_MOSSY_STONE}
      />
    </mesh>
  </group>
);

const FoliageClump = ({ scale, position, args }: any) => {
  const s = args[0] * 2.2; // Expand the size to cover the volume of the original sphere
  const matProps = { textureName: "tree_leaves", roughness: 0.6, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide };
  return (
    <group position={position} scale={scale}>
      <mesh castShadow receiveShadow>
        <planeGeometry args={[s, s]} />
        <TextureMaterial {...matProps} />
      </mesh>
      <mesh castShadow receiveShadow rotation={[0, Math.PI / 3, 0]}>
        <planeGeometry args={[s, s]} />
        <TextureMaterial {...matProps} />
      </mesh>
      <mesh castShadow receiveShadow rotation={[0, -Math.PI / 3, 0]}>
        <planeGeometry args={[s, s]} />
        <TextureMaterial {...matProps} />
      </mesh>
      <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[s, s]} />
        <TextureMaterial {...matProps} />
      </mesh>
    </group>
  );
};

// High-fidelity photorealistic ancient banyan/jungle trees (Image 3 style)
const InstancedBackgroundTrees = () => {
  const meshRefTrunks = useRef<THREE.InstancedMesh>(null);
  const meshRefLeaves = useRef<THREE.InstancedMesh>(null);
  
  const trees = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 50 + Math.random() * 60;
      arr.push({
        pos: [Math.cos(angle) * r, 0, Math.sin(angle) * r],
        scale: 0.8 + Math.random() * 0.7,
        rotY: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  useLayoutEffect(() => {
    if (!meshRefTrunks.current || !meshRefLeaves.current) return;
    const dummy = new THREE.Object3D();
    
    // Set up trunks
    trees.forEach((t, i) => {
      dummy.position.set(t.pos[0], 4.5 * t.scale, t.pos[2]);
      dummy.rotation.set(0, t.rotY, 0);
      dummy.scale.set(t.scale, t.scale, t.scale);
      dummy.updateMatrix();
      meshRefTrunks.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRefTrunks.current.instanceMatrix.needsUpdate = true;
    
    // Leaves (3 planes per tree)
    let leafIdx = 0;
    trees.forEach((t) => {
      const cy = 10 * t.scale;
      const s = 14 * t.scale;
      
      dummy.position.set(t.pos[0], cy, t.pos[2]);
      dummy.rotation.set(0, t.rotY, 0);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      meshRefLeaves.current!.setMatrixAt(leafIdx++, dummy.matrix);

      dummy.rotation.set(0, t.rotY + Math.PI / 3, 0);
      dummy.updateMatrix();
      meshRefLeaves.current!.setMatrixAt(leafIdx++, dummy.matrix);

      dummy.rotation.set(0, t.rotY - Math.PI / 3, 0);
      dummy.updateMatrix();
      meshRefLeaves.current!.setMatrixAt(leafIdx++, dummy.matrix);
    });
    meshRefLeaves.current.instanceMatrix.needsUpdate = true;
  }, [trees]);

  return (
    <group>
      <instancedMesh ref={meshRefTrunks} args={[undefined, undefined, trees.length]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 2.5, 9, 8]} />
        <TextureMaterial textureName="tree_bark" repeat={[1.5, 4]} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={meshRefLeaves} args={[undefined, undefined, trees.length * 3]} castShadow receiveShadow>
        <planeGeometry args={[1, 1]} />
        <TextureMaterial textureName="tree_leaves" roughness={0.7} transparent alphaTest={0.3} side={THREE.DoubleSide} color={COLOR_LEAF_FOREST} />
      </instancedMesh>
    </group>
  );
};

const AncientJungleTree = ({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) => {
  // Deterministic "random" rotation and scale variation based on position
  const rotY = (position[0] * 13.5 + position[2] * 41.2) % (Math.PI * 2);
  const scaleVar = 0.85 + Math.abs((position[0] * 7.1 + position[2] * 19.3) % 0.3);
  
  return (
  <group position={position} scale={[scale * scaleVar, scale * scaleVar, scale * scaleVar]} rotation={[0, rotY, 0]}>
    {/* 1. Central Massive Weathered Trunk */}
    <mesh castShadow receiveShadow position={[0, 4.5, 0]}>
      <cylinderGeometry args={[1.2, 2.0, 9, 10]} />
      <TextureMaterial
        textureName="tree_bark"
        repeat={[1.5, 4]}
        roughness={0.9}
      />
    </mesh>

    {/* 2. Interwoven Flanking Gnarled Buttress Roots */}
    <mesh
      
     castShadow receiveShadow
      position={[0.9, 2.5, 0.9]}
      rotation={[0.2, 0.3, -0.12]}
    >
      <cylinderGeometry args={[0.4, 0.95, 6, 6]} />
      <TextureMaterial
        textureName="tree_bark"
        repeat={[0.6, 2.5]}
        roughness={0.92}
      />
    </mesh>
    <mesh
      
     castShadow receiveShadow
      position={[-0.9, 2.0, -0.7]}
      rotation={[-0.25, -0.1, 0.15]}
    >
      <cylinderGeometry args={[0.35, 0.85, 5, 6]} />
      <TextureMaterial
        textureName="tree_bark"
        repeat={[0.5, 2.0]}
        roughness={0.92}
      />
    </mesh>
    <mesh
      
     castShadow receiveShadow
      position={[-0.6, 2.2, 1.0]}
      rotation={[0.15, -0.4, 0.2]}
    >
      <cylinderGeometry args={[0.38, 0.9, 5.5, 6]} />
      <TextureMaterial
        textureName="tree_bark"
        repeat={[0.5, 2.2]}
        roughness={0.92}
      />
    </mesh>
    <mesh
      
     castShadow receiveShadow
      position={[0.7, 1.8, -0.9]}
      rotation={[-0.1, 0.5, -0.25]}
    >
      <cylinderGeometry args={[0.32, 0.8, 4.5, 6]} />
      <TextureMaterial
        textureName="tree_bark"
        repeat={[0.4, 1.8]}
        roughness={0.92}
      />
    </mesh>

    {/* 3. Sprawling Heavy Structural Branches */}
    <mesh
      
     castShadow receiveShadow
      position={[1.8, 7.5, 1.2]}
      rotation={[0.3, 0.2, 0.55]}
    >
      <cylinderGeometry args={[0.55, 0.85, 7, 8]} />
      <TextureMaterial
        textureName="tree_bark"
        repeat={[0.8, 3.0]}
        roughness={0.9}
      />
    </mesh>
    <mesh
      
     castShadow receiveShadow
      position={[-1.7, 8.0, -1.0]}
      rotation={[-0.25, -0.4, -0.45]}
    >
      <cylinderGeometry args={[0.52, 0.8, 7.5, 8]} />
      <TextureMaterial
        textureName="tree_bark"
        repeat={[0.8, 3.2]}
        roughness={0.9}
      />
    </mesh>
    <mesh
      
     castShadow receiveShadow
      position={[-0.5, 9.0, 1.8]}
      rotation={[0.5, -0.35, 0.2]}
    >
      <cylinderGeometry args={[0.45, 0.75, 6.5, 8]} />
      <TextureMaterial
        textureName="tree_bark"
        repeat={[0.7, 2.8]}
        roughness={0.9}
      />
    </mesh>
    <mesh
      
     castShadow receiveShadow
      position={[1.3, 8.5, -1.5]}
      rotation={[-0.35, 0.45, -0.3]}
    >
      <cylinderGeometry args={[0.42, 0.7, 6, 8]} />
      <TextureMaterial
        textureName="tree_bark"
        repeat={[0.6, 2.5]}
        roughness={0.9}
      />
    </mesh>

    {/* 4. Twisting Slender Outward Twigs */}
    <mesh
      
     castShadow receiveShadow
      position={[4.2, 10.5, 2.2]}
      rotation={[0.25, 0.4, 0.75]}
    >
      <cylinderGeometry args={[0.25, 0.4, 5, 5]} />
      <TextureMaterial
        textureName="tree_bark"
        repeat={[0.4, 2.0]}
        roughness={0.92}
      />
    </mesh>
    <mesh
      
     castShadow receiveShadow
      position={[-4.0, 10.8, -1.8]}
      rotation={[-0.2, -0.5, -0.65]}
    >
      <cylinderGeometry args={[0.22, 0.38, 5, 5]} />
      <TextureMaterial
        textureName="tree_bark"
        repeat={[0.4, 2.0]}
        roughness={0.92}
      />
    </mesh>
    <mesh
      
     castShadow receiveShadow
      position={[-1.2, 11.5, 4.0]}
      rotation={[0.7, -0.3, 0.35]}
    >
      <cylinderGeometry args={[0.2, 0.35, 5, 5]} />
      <TextureMaterial
        textureName="tree_bark"
        repeat={[0.3, 1.8]}
        roughness={0.92}
      />
    </mesh>
    <mesh
      
     castShadow receiveShadow
      position={[2.8, 11.0, -3.5]}
      rotation={[-0.5, 0.4, -0.55]}
    >
      <cylinderGeometry args={[0.18, 0.32, 4.5, 5]} />
      <TextureMaterial
        textureName="tree_bark"
        repeat={[0.3, 1.8]}
        roughness={0.92}
      />
    </mesh>

    {/* 5. Cloud-like Organic Clustered Foliage (Squashed Ellipsoids for Realistic Layering) */}
    {/* Center Top Main Canopy */}
    <FoliageClump position={[0, 12.5, 0]} scale={[1.1, 0.75, 1.1]} args={[4.2]} />
    <FoliageClump position={[0.5, 13.5, -0.5]} scale={[1.1, 0.75, 1.1]} args={[3.4]} />
    <FoliageClump position={[-0.6, 13.0, 0.6]} scale={[1.1, 0.75, 1.1]} args={[3.6]} />

    {/* Branch A Foliage Clump */}
    <FoliageClump position={[5.5, 11.5, 2.8]} scale={[1.15, 0.78, 1.15]} args={[3.3]} />
    <FoliageClump position={[6.5, 12.2, 3.2]} scale={[1.1, 0.75, 1.1]} args={[2.5]} />

    {/* Branch B Foliage Clump */}
    <FoliageClump position={[-5.3, 11.8, -2.4]} scale={[1.15, 0.78, 1.15]} args={[3.2]} />
    <FoliageClump position={[-6.2, 12.5, -2.8]} scale={[1.1, 0.75, 1.1]} args={[2.4]} />

    {/* Branch C Foliage Clump */}
    <FoliageClump position={[-1.8, 12.8, 5.0]} scale={[1.15, 0.78, 1.15]} args={[3.0]} />
    <FoliageClump position={[-2.4, 13.3, 5.8]} scale={[1.1, 0.75, 1.1]} args={[2.2]} />

    {/* Branch D Foliage Clump */}
    <FoliageClump position={[3.8, 12.2, -4.5]} scale={[1.15, 0.78, 1.15]} args={[2.9]} />
    <FoliageClump position={[4.4, 12.8, -5.2]} scale={[1.1, 0.75, 1.1]} args={[2.1]} />

    {/* Density Fills / Soft Shadows */}
    <FoliageClump position={[2.5, 12.0, 1.2]} scale={[1.1, 0.75, 1.1]} args={[2.5]} />
    <FoliageClump position={[-2.5, 12.2, -1.0]} scale={[1.1, 0.75, 1.1]} args={[2.5]} />
    <FoliageClump position={[1.0, 12.5, -2.5]} scale={[1.1, 0.75, 1.1]} args={[2.4]} />
    <FoliageClump position={[-1.0, 12.4, 2.5]} scale={[1.1, 0.75, 1.1]} args={[2.4]} />
  </group>
  );
};

const InstancedJungleBushes = () => {
  const bushes = useMemo(() => {
    const list: { pos: [number, number, number]; scale: number }[] = [];
    // Random heavy bushes
    for (let i = 0; i < 250; i++) {
      const x = (Math.random() - 0.5) * 120;
      const z = (Math.random() - 0.5) * 120;
      if (Math.abs(x) < 8 && Math.abs(z) < 8) continue;
      list.push({ pos: [x, 0, z], scale: 1 + Math.random() * 2.0 });
    }
    // Bushes around pillars
    [[-22, -22], [-22, 22], [22, -22], [22, 22]].forEach(([px, pz]) => {
      list.push({ pos: [px + 2, 0, pz], scale: 1.2 });
      list.push({ pos: [px - 2, 0, pz], scale: 1.5 });
    });
    // Bushes around fire pits
    [[-16, -16], [-16, 16], [16, -16], [16, 16]].forEach(([px, pz]) => {
      list.push({ pos: [px, 3, pz], scale: 1.2 });
    });
    return list;
  }, []);

  return (
    <Instances range={bushes.length * 3} castShadow receiveShadow>
      <planeGeometry args={[3.5, 2.5]} />
      <TextureMaterial textureName="tree_leaves" roughness={0.7} transparent alphaTest={0.3} side={THREE.DoubleSide} />
      {bushes.map((bush, i) => {
        const rotY = (bush.pos[0] * 13.5 + bush.pos[2] * 41.2) % (Math.PI * 2);
        const s = bush.scale * (0.8 + Math.abs((bush.pos[0] * 7.1 + bush.pos[2] * 19.3) % 0.4));
        return (
          <group key={i} position={bush.pos} rotation={[0, rotY, 0]} scale={[s, s, s]}>
            <Instance position={[0, 1.2, 0]} />
            <Instance position={[0, 1.2, 0]} rotation={[0, Math.PI / 3, 0]} />
            <Instance position={[0, 1.2, 0]} rotation={[0, -Math.PI / 3, 0]} />
          </group>
        );
      })}
    </Instances>
  );
};

const InstancedMossyRocks = () => {
  const rocks = useMemo(() => {
    const list: { pos: [number, number, number]; rot: [number, number, number]; scale: [number, number, number] }[] = [];
    for (let i = 0; i < 50; i++) {
      const x = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      if (Math.abs(x) < 12 && Math.abs(z) < 12) continue;
      const s = 1.5 + Math.random() * 3.5;
      list.push({
        pos: [x, s / 2 - 0.5, z],
        rot: [Math.random(), Math.random(), Math.random()],
        scale: [s, s * 0.7, s],
      });
    }
    return list;
  }, []);

  return (
    <Instances range={rocks.length} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 1]} />
      <TextureMaterial textureName="mossy_marble_slab" roughness={0.9} color={COLOR_WEATHERED_STONE} />
      {rocks.map((rock, i) => (
        <Instance key={i} position={rock.pos} rotation={rock.rot} scale={rock.scale} />
      ))}
    </Instances>
  );
};

// Fern clump component that creates one cluster of leaves
const FernClump = ({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {Array.from({ length: 5 }).map((_, i) => {
        const rotY = (i / 5) * Math.PI * 2 + Math.random() * 0.4;
        const rotX = 0.2 + Math.random() * 0.35;
        return (
          <mesh
            key={i}
            rotation={[rotX, rotY, 0]}
            
            position={[0, 0.4, 0]}
          >
            <boxGeometry args={[0.16, 1.3, 0.04]} />
            <meshStandardMaterial
              color="#355e2b"
              roughness={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
};

const OvergrownTempleDecorations = () => {
  return (
    <group>
      <InstancedHangingIvy />
      <InstancedJungleBushes />
      <InstancedMossyRocks />
      
      {/* Massive trees wrapping the pillars */}
      {[[-22, -22], [-22, 22], [22, -22], [22, 22]].map(([px, pz], i) => (
        <group key={`roots-${i}`} position={[px, 0, pz]}>
          <AncientJungleTree position={[3, 0, -3]} scale={0.4} />
        </group>
      ))}
    </group>
  );
}

// Highly optimized instanced ferns clustered around columns, steps, and ruins
const FernsCollection = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const positions = useMemo(() => {
    const list: {
      pos: [number, number, number];
      scale: number;
      rotY: number;
      rotX: number;
    }[] = [];

    // Spread fern leaves around pillars, corners, and stairs
    const centers = [
      [-22, -22],
      [-22, 22],
      [22, -22],
      [22, 22], // pillars
      [-15, -15],
      [-15, 15],
      [15, -15],
      [15, 15], // ziggurat corners
      [-5, 15],
      [5, 15],
      [-5, 19],
      [5, 19], // +Z stairs
      [-5, -15],
      [5, -15],
      [-5, -19],
      [5, -19], // -Z stairs
    ];

    centers.forEach(([cx, cz]) => {
      for (let i = 0; i < 5; i++) {
        const x = cx + (Math.random() - 0.5) * 4;
        const z = cz + (Math.random() - 0.5) * 4;
        // 5 leaves per fern
        for (let j = 0; j < 5; j++) {
          list.push({
            pos: [x, 0.4, z],
            scale: 0.8 + Math.random() * 0.7,
            rotY: (j / 5) * Math.PI * 2 + Math.random() * 0.4,
            rotX: 0.2 + Math.random() * 0.35,
          });
        }
      }
    });

    // Scattered around outer walls
    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 35 + Math.random() * 80;
      const x = Math.sin(angle) * dist;
      const z = Math.cos(angle) * dist;
      for (let j = 0; j < 5; j++) {
        list.push({
          pos: [x, 0.4, z],
          scale: 0.8 + Math.random() * 1.5,
          rotY: (j / 5) * Math.PI * 2 + Math.random() * 0.4,
          rotX: 0.2 + Math.random() * 0.35,
        });
      }
    }
    return list;
  }, []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    positions.forEach((leaf, i) => {
      dummy.position.set(leaf.pos[0], leaf.pos[1], leaf.pos[2]);
      dummy.rotation.set(leaf.rotX, leaf.rotY, 0);
      dummy.scale.set(leaf.scale, leaf.scale, leaf.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, positions.length]} castShadow receiveShadow>
      <planeGeometry args={[1.5, 4.0]} />
      <TextureMaterial
        textureName="fern_leaf"
        transparent
        alphaTest={0.5}
        side={THREE.DoubleSide}
        roughness={0.4}
      />
    </instancedMesh>
  );
};

// Ground Undergrowth and Ferns (Image 3 style) - upgraded from tiny cones to leafy blades
const UndergrowthAndFerns = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 4000;
  
  const positions = useMemo(() => {
    const list = [];
    for (let i = 0; i < count; i++) {
      let x = (Math.random() - 0.5) * (MAP_SIZE - 20);
      let z = (Math.random() - 0.5) * (MAP_SIZE - 20);
      if (Math.abs(x) < 20 && Math.abs(z) < 20) {
        x += x > 0 ? 30 : -30;
        z += z > 0 ? 30 : -30;
      }
      list.push({
        pos: [x, 0.4, z],
        rotX: (Math.random() - 0.5) * 0.4 + 0.3,
        rotY: Math.random() * Math.PI * 2,
        scale: 0.5 + Math.random() * 1.5,
      });
    }
    return list;
  }, []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    positions.forEach((p, i) => {
      dummy.position.set(p.pos[0], p.pos[1], p.pos[2]);
      dummy.rotation.set(p.rotX, p.rotY, 0);
      dummy.scale.set(p.scale, p.scale, p.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <planeGeometry args={[1.5, 4.5]} />
      <TextureMaterial textureName="fern_leaf" transparent alphaTest={0.5} side={THREE.DoubleSide} roughness={0.4} />
    </instancedMesh>
  );
};

// Beautiful low-profile organic moss patches on the courtyard floor (Image 2 & 3 style)
const MossyPatches = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const patches = useMemo(() => {
    const arr = [];
    const colorOpts = ["#2d4424", "#425a32", "#1d3215"];
    for (let i = 0; i < 600; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 6 + Math.random() * 95;
      const radius = 4.0 + Math.random() * 9.0;
      const height = 0.15 + Math.random() * 0.35;
      arr.push({
        position: [Math.sin(angle) * dist, 0.02, Math.cos(angle) * dist],
        scale: [radius, height, radius],
        color: colorOpts[Math.floor(Math.random() * colorOpts.length)],
      });
    }
    return arr;
  }, []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    patches.forEach((p, i) => {
      dummy.position.set(p.position[0], p.position[1], p.position[2]);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(p.scale[0], p.scale[1], p.scale[2]);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, c.set(p.color));
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [patches]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, patches.length]} castShadow receiveShadow>
      <sphereGeometry args={[1, 16, 12]} />
      <meshStandardMaterial roughness={1.0} />
    </instancedMesh>
  );
};

// A hollow box (ring) used for creating roofs with skylights
const HollowBox = ({ outerSize, innerSize, height, position, materialProps, castShadow = true, receiveShadow = true }: any) => {
  const o = outerSize / 2;
  const i = innerSize / 2;
  const t = (outerSize - innerSize) / 2; // thickness of one side
  const offset = i + t / 2;
  return (
    <group position={position}>
      {/* North */}
      <mesh position={[0, 0, -offset]} castShadow={castShadow} receiveShadow={receiveShadow}>
        <boxGeometry args={[outerSize, height, t]} />
        <TextureMaterial {...materialProps} />
      </mesh>
      {/* South */}
      <mesh position={[0, 0, offset]} castShadow={castShadow} receiveShadow={receiveShadow}>
        <boxGeometry args={[outerSize, height, t]} />
        <TextureMaterial {...materialProps} />
      </mesh>
      {/* East */}
      <mesh position={[offset, 0, 0]} castShadow={castShadow} receiveShadow={receiveShadow}>
        <boxGeometry args={[t, height, innerSize]} />
        <TextureMaterial {...materialProps} />
      </mesh>
      {/* West */}
      <mesh position={[-offset, 0, 0]} castShadow={castShadow} receiveShadow={receiveShadow}>
        <boxGeometry args={[t, height, innerSize]} />
        <TextureMaterial {...materialProps} />
      </mesh>
    </group>
  );
};

// Fire Pit / Sacred Brazier
const FirePit = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    {/* Stone Bowl */}
    <mesh  position={[0, 0.6, 0]}>
      <cylinderGeometry args={[1.7, 1.4, 1.2, 12]} />
      <TextureMaterial
        textureName="stone_brick_wall_001"
        color={COLOR_MOSSY_STONE}
      />
    </mesh>
    <mesh  position={[0, 1.2, 0]}>
      <torusGeometry args={[1.5, 0.28, 8, 24]} />
      <meshStandardMaterial color="#4a5347" roughness={0.8} />
    </mesh>

    {/* Coals */}
    <mesh position={[0, 1.2, 0]}>
      <sphereGeometry args={[1.2, 8, 8]} />
      <meshStandardMaterial color="#1a1c18" roughness={1.0} />
    </mesh>

    {/* Flame light */}
    <pointLight
      position={[0, 2.3, 0]}
      intensity={30}
      color="#f97316"
      distance={28}
      decay={1.4}
      
    />

    <group position={[0, 2.5, 0]}>
      <AnimatedFire scale={3.5} />
    </group>

    {/* Floating Ember Particles */}
    <Float speed={2.4} rotationIntensity={0.8} floatIntensity={1.0}>
      <mesh position={[0.4, 2.8, -0.35]}>
        <boxGeometry args={[0.09, 0.09, 0.09]} />
        <meshStandardMaterial
          color="#f97316"
          emissive="#f97316"
          emissiveIntensity={15}
        />
      </mesh>
    </Float>
    <Float speed={2.8} rotationIntensity={0.6} floatIntensity={1.4}>
      <mesh position={[-0.35, 3.2, 0.4]}>
        <boxGeometry args={[0.07, 0.07, 0.07]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#fbbf24"
          emissiveIntensity={18}
        />
      </mesh>
    </Float>
  </group>
);

// Detailed Guardian Statue
const DetailedStatue = ({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) => (
  <group position={position} rotation={rotation}>
    {/* Ornate Base Pedestal with Decorative Moldings */}
    <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
      <boxGeometry args={[4.4, 1.5, 4.4]} />
      <TextureMaterial
        textureName="stone_brick_wall_001"
        color={COLOR_MOSSY_STONE}
      />
    </mesh>
    <mesh castShadow receiveShadow position={[0, 1.75, 0]}>
      <cylinderGeometry args={[1.8, 2.1, 0.5, 12]} />
      <TextureMaterial
        textureName="stone_brick_wall_001"
        color={COLOR_WEATHERED_STONE}
      />
    </mesh>

    {/* Guardian Torso */}
    <mesh castShadow receiveShadow position={[0, 4.5, 0]}>
      <boxGeometry args={[2.2, 5, 1.8]} />
      <TextureMaterial
        textureName="stone_brick_wall_001"
        color={COLOR_WEATHERED_STONE}
      />
    </mesh>

    {/* Ornate Diagonal Gold Chest Sash */}
    <mesh  position={[0, 5.0, 0.94]} rotation={[0, 0, 0.6]}>
      <boxGeometry args={[2.8, 0.35, 0.12]} />
      <meshStandardMaterial
        color={COLOR_GOLD}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>

    {/* Flowing Back Cape (Image 2 style) */}
    <mesh  position={[0, 4.0, -1.02]} rotation={[0.1, 0, 0]}>
      <boxGeometry args={[2.5, 5.0, 0.25]} />
      <TextureMaterial
        textureName="stone_brick_wall_001"
        color={COLOR_DARK_STONE}
      />
    </mesh>

    {/* Circular Stone Shield on Left Arm with Gold Center Boss */}
    <group position={[-1.4, 4.5, 0.8]} rotation={[0, 0.4, 0.2]}>
      <mesh >
        <cylinderGeometry args={[1.2, 1.2, 0.15, 12]} />
        <TextureMaterial
          textureName="stone_brick_wall_001"
          color={COLOR_MOSSY_STONE}
        />
      </mesh>
      {/* Gold center spike/boss */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} >
        <coneGeometry args={[0.25, 0.5, 8]} />
        <meshStandardMaterial
          color={COLOR_GOLD}
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>
    </group>

    {/* Gold Pauldrons */}
    <mesh  position={[1.4, 6.2, 0]} rotation={[0, 0, -0.35]}>
      <sphereGeometry args={[1.05, 8, 8]} />
      <meshStandardMaterial
        color={COLOR_GOLD}
        metalness={0.75}
        roughness={0.25}
      />
    </mesh>
    <mesh  position={[-1.4, 6.2, 0]} rotation={[0, 0, 0.35]}>
      <sphereGeometry args={[1.05, 8, 8]} />
      <meshStandardMaterial
        color={COLOR_GOLD}
        metalness={0.75}
        roughness={0.25}
      />
    </mesh>

    {/* Weapon Staff */}
    <group position={[1.3, 5.5, 2.1]} rotation={[0.08, 0, 0]}>
      <mesh >
        <cylinderGeometry args={[0.11, 0.11, 10.5, 8]} />
        <meshStandardMaterial color="#35241b" roughness={0.9} />
      </mesh>
      <mesh position={[0, 5.8, 0]} >
        <coneGeometry args={[0.36, 1.7, 4]} />
        <meshStandardMaterial
          color="#fbbf24"
          metalness={0.85}
          roughness={0.15}
          emissive="#d97706"
          emissiveIntensity={0.6}
        />
      </mesh>
    </group>

    {/* Ancient Helmet / Headwear */}
    <mesh  position={[0, 7.8, 0]}>
      <sphereGeometry args={[1.15, 12, 12]} />
      <TextureMaterial
        textureName="stone_brick_wall_001"
        color={COLOR_WEATHERED_STONE}
      />
    </mesh>
    <mesh  position={[0, 8.7, 0]} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[1.05, 1.4, 4]} />
      <meshStandardMaterial
        color={COLOR_GOLD}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>

    {/* Glowing Eye Relics */}
    <mesh position={[0.34, 7.85, 0.96]}>
      <sphereGeometry args={[0.11, 6, 6]} />
      <meshStandardMaterial
        color="#06b6d4"
        emissive="#06b6d4"
        emissiveIntensity={8}
      />
    </mesh>
    <mesh position={[-0.34, 7.85, 0.96]}>
      <sphereGeometry args={[0.11, 6, 6]} />
      <meshStandardMaterial
        color="#06b6d4"
        emissive="#06b6d4"
        emissiveIntensity={8}
      />
    </mesh>

    <MossClump position={[1.4, 0.1, -1.3]} scale={[1, 0.75, 1]} />
  </group>
);

// ==========================================
// NEW: Visitable Main Shrine Enclosure
// ==========================================
const MainShrineEnclosure = () => {
  return (
    <group>
      {/* Grand Base Platform: 64x64 area, height 3 */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[64, 3, 64]} />
        <TextureMaterial
          textureName="stone_brick_wall_001"
          repeat={[16, 1]}
          color={COLOR_WEATHERED_STONE}
        />
      </mesh>

      {/* Main Stairs (North, South, East, West) */}
      {[
        { pos: [0, 0, 33.0], rot: [0, 0, 0] }, // South
        { pos: [0, 0, -33.0], rot: [0, Math.PI, 0] }, // North
        { pos: [33.0, 0, 0], rot: [0, Math.PI / 2, 0] }, // East
        { pos: [-33.0, 0, 0], rot: [0, -Math.PI / 2, 0] }, // West
      ].map((stair, idx) => (
        <group
          key={`stair-${idx}`}
          position={stair.pos as [number, number, number]}
          rotation={stair.rot as [number, number, number]}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh
              key={`step-${i}`}
              position={[0, i * 0.5 + 0.25, 1.75 - i * 0.5]}
              
             castShadow receiveShadow
            >
              <boxGeometry args={[16, 0.5, 0.5]} />
              <TextureMaterial
                textureName="mossy_marble_slab"
                color={COLOR_WEATHERED_STONE}
                roughness={0.9}
              />
            </mesh>
          ))}
          {/* Invisible physics ramp for smooth walking up stairs */}
          <mesh
            position={[0, 1.5, 0.5]}
            rotation={[Math.PI / 4, 0, 0]}
            visible={false}
          >
            <boxGeometry args={[16, 0.2, 4.25]} />
          </mesh>
        </group>
      ))}

      {/* Shrine Interior Walls (visitable room inside) */}
      {/* South Wall (with doorway) */}
      <group position={[0, 11, 26]}>
        <mesh position={[-17, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[18, 16, 2]} />
          <TextureMaterial textureName="stone_brick_wall_001" repeat={[4.5, 4]} color={COLOR_MOSSY_STONE} />
        </mesh>
        <mesh position={[17, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[18, 16, 2]} />
          <TextureMaterial textureName="stone_brick_wall_001" repeat={[4.5, 4]} color={COLOR_MOSSY_STONE} />
        </mesh>
        <mesh position={[0, 5, 0]} castShadow receiveShadow>
          <boxGeometry args={[16, 6, 2]} />
          <TextureMaterial textureName="stone_brick_wall_001" repeat={[4, 1.5]} color={COLOR_MOSSY_STONE} />
        </mesh>
      </group>
      {/* North Wall (with doorway) */}
      <group position={[0, 11, -26]}>
        <mesh position={[-17, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[18, 16, 2]} />
          <TextureMaterial textureName="stone_brick_wall_001" repeat={[4.5, 4]} color={COLOR_MOSSY_STONE} />
        </mesh>
        <mesh position={[17, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[18, 16, 2]} />
          <TextureMaterial textureName="stone_brick_wall_001" repeat={[4.5, 4]} color={COLOR_MOSSY_STONE} />
        </mesh>
        <mesh position={[0, 5, 0]} castShadow receiveShadow>
          <boxGeometry args={[16, 6, 2]} />
          <TextureMaterial textureName="stone_brick_wall_001" repeat={[4, 1.5]} color={COLOR_MOSSY_STONE} />
        </mesh>
      </group>
      {/* East Wall (with doorway) */}
      <group position={[26, 11, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[-17, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[18, 16, 2]} />
          <TextureMaterial textureName="stone_brick_wall_001" repeat={[4.5, 4]} color={COLOR_MOSSY_STONE} />
        </mesh>
        <mesh position={[17, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[18, 16, 2]} />
          <TextureMaterial textureName="stone_brick_wall_001" repeat={[4.5, 4]} color={COLOR_MOSSY_STONE} />
        </mesh>
        <mesh position={[0, 5, 0]} castShadow receiveShadow>
          <boxGeometry args={[16, 6, 2]} />
          <TextureMaterial textureName="stone_brick_wall_001" repeat={[4, 1.5]} color={COLOR_MOSSY_STONE} />
        </mesh>
      </group>
      {/* West Wall (with doorway) */}
      <group position={[-26, 11, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[-17, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[18, 16, 2]} />
          <TextureMaterial textureName="stone_brick_wall_001" repeat={[4.5, 4]} color={COLOR_MOSSY_STONE} />
        </mesh>
        <mesh position={[17, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[18, 16, 2]} />
          <TextureMaterial textureName="stone_brick_wall_001" repeat={[4.5, 4]} color={COLOR_MOSSY_STONE} />
        </mesh>
        <mesh position={[0, 5, 0]} castShadow receiveShadow>
          <boxGeometry args={[16, 6, 2]} />
          <TextureMaterial textureName="stone_brick_wall_001" repeat={[4, 1.5]} color={COLOR_MOSSY_STONE} />
        </mesh>
      </group>

      {/* 4 Corner Pillars for the shrine room */}
      {[-27, 27].map((x) =>
        [-27, 27].map((z) => (
          <mesh
            key={`shrine-pillar-${x}-${z}`}
            position={[x, 11, z]}
            
           castShadow receiveShadow
          >
            <boxGeometry args={[4, 16, 4]} />
            <TextureMaterial
              textureName="stone_brick_wall_001"
              repeat={[1, 4]}
              color={COLOR_WEATHERED_STONE}
            />
          </mesh>
        )),
      )}

      {/* Main Shrine Roof (Tiered Pyramid shape, resting on walls, with central skylight opening) */}
      <HollowBox 
        position={[0, 20, 0]} outerSize={60} innerSize={16} height={2} 
        materialProps={{ textureName: "stone_brick_wall_001", repeat: [15, 0.5], color: COLOR_MOSSY_STONE }} 
      />
      <HollowBox 
        position={[0, 22.5, 0]} outerSize={52} innerSize={16} height={3} 
        materialProps={{ textureName: "stone_brick_wall_001", repeat: [13, 0.75], color: COLOR_MOSSY_STONE }} 
      />
      <HollowBox 
        position={[0, 26, 0]} outerSize={40} innerSize={16} height={4} 
        materialProps={{ textureName: "stone_brick_wall_001", repeat: [10, 1], color: COLOR_MOSSY_STONE }} 
      />
      <HollowBox 
        position={[0, 31, 0]} outerSize={24} innerSize={16} height={6} 
        materialProps={{ textureName: "stone_brick_wall_001", repeat: [6, 1.5], color: COLOR_MOSSY_STONE }} 
      />
      {/* Top ring */}
      <HollowBox 
        position={[0, 36, 0]} outerSize={16} innerSize={12} height={4} 
        materialProps={{ textureName: "stone_brick_wall_001", repeat: [4, 1], color: COLOR_WEATHERED_STONE }} 
      />

      {/* Interior Altar / Pedestal Canopy in the center */}
      <group position={[0, 3, 0]}>
        {/* 4 Canopy Pillars */}
        {[-6, 6].map((x) =>
          [-6, 6].map((z) => (
            <mesh key={`canopy-pillar-${x}-${z}`} position={[x, 3, z]} castShadow receiveShadow>
              <boxGeometry args={[1, 6, 1]} />
              <TextureMaterial textureName="stone_brick_wall_001" repeat={[0.25, 1.5]} color={COLOR_WEATHERED_STONE} />
            </mesh>
          )),
        )}
        {/* Canopy Roof */}
        <mesh position={[0, 6.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[16, 1.5, 16]} />
          <TextureMaterial textureName="stone_brick_wall_001" repeat={[4, 0.4]} color={COLOR_MOSSY_STONE} />
        </mesh>
        
        {/* Center Stone Table */}
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[4, 1.5, 4]} />
          <TextureMaterial textureName="mossy_marble_slab" color={COLOR_WEATHERED_STONE} />
        </mesh>

        {/* Central Magical Relic Orb */}
        <mesh position={[0, 2.5, 0]}>
          <octahedronGeometry args={[0.5, 1]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={3} />
        </mesh>
        
        {/* Soft, warm ambient light bouncing from the floor/stone */}
        <pointLight position={[0, 3, 0]} intensity={10} color="#ffedd5" distance={50} decay={1.8} />
        {/* Sun beam coming through the skylight */}
        <spotLight 
          position={[0, 40, 0]} 
          angle={0.25} 
          penumbra={0.5} 
          intensity={80} 
          color="#fff6e5" 
          distance={60} 
          decay={1.2} 
          castShadow 
          shadow-bias={-0.001} 
        />
      </group>
      
      {/* 4 Rock Stands with Fire in the corners of the enclosure */}
      {[-16, 16].map((x) =>
        [-16, 16].map((z) => (
          <group key={`fire-rock-${x}-${z}`} position={[x, 3, z]}>
            <mesh position={[0, 4, 0]} castShadow receiveShadow rotation={[0, Math.random() * Math.PI, 0]}>
              <cylinderGeometry args={[1.5, 2.5, 8, 5]} />
              <meshStandardMaterial color={COLOR_DARK_STONE} roughness={0.9} />
            </mesh>
            {/* Fire Base Plate */}
            <mesh position={[0, 8.2, 0]} castShadow receiveShadow>
              <boxGeometry args={[2, 0.4, 2]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            {/* Fire Light and core mesh */}
            <pointLight position={[0, 9, 0]} intensity={25} color="#ff8c00" distance={40} decay={1.5}  />
            <group position={[0, 9.5, 0]}>
              <AnimatedFire scale={2.5} />
            </group>
          </group>
        ))
      )}

      {/* Decorative Statues flanking the 4 stairways (like the birds in image 1) */}
      {[
        { pos: [10, 3, 31], rot: [0, 0, 0] },
        { pos: [-10, 3, 31], rot: [0, 0, 0] },
        { pos: [10, 3, -31], rot: [0, Math.PI, 0] },
        { pos: [-10, 3, -31], rot: [0, Math.PI, 0] },
        { pos: [31, 3, 10], rot: [0, Math.PI / 2, 0] },
        { pos: [31, 3, -10], rot: [0, Math.PI / 2, 0] },
        { pos: [-31, 3, 10], rot: [0, -Math.PI / 2, 0] },
        { pos: [-31, 3, -10], rot: [0, -Math.PI / 2, 0] },
      ].map((statue, idx) => (
        <group
          key={`bird-statue-${idx}`}
          position={statue.pos as [number, number, number]}
          rotation={statue.rot as [number, number, number]}
        >
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.5, 1, 2.5]} />
            <TextureMaterial textureName="stone_brick_wall_001" color={COLOR_MOSSY_STONE} />
          </mesh>
          <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.8, 1.2, 3, 8]} />
            <meshStandardMaterial color="#222" roughness={0.7} metalness={0.2} />
          </mesh>
          <mesh position={[0, 4.5, 0.4]} castShadow receiveShadow>
            <sphereGeometry args={[0.6, 8, 8]} />
            <meshStandardMaterial color="#222" roughness={0.7} metalness={0.2} />
          </mesh>
          <mesh position={[0, 4.5, 1.2]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.2, 1, 4]} />
            <meshStandardMaterial color="#444" roughness={0.5} />
          </mesh>
          <mesh position={[1, 3, -0.3]} rotation={[0, 0, -0.4]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 0.2, 0.8]} />
            <meshStandardMaterial color="#222" roughness={0.7} />
          </mesh>
          <mesh position={[-1, 3, -0.3]} rotation={[0, 0, 0.4]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 0.2, 0.8]} />
            <meshStandardMaterial color="#222" roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export function MapTemple() {
  return (
    <>
      {/* Overwrite the canvas background dynamically with a beautiful warm misty jungle-sage color */}
      <color attach="background" args={["#242b1d"]} />

      {/* High-quality warm sunlit forest atmospheric fog mist to blend sky and ground (Image 3 style) */}
      <fog attach="fog" args={["#242b1d", 60, 300]} />
      <Sky
        sunPosition={[55, 45, 35]}
        turbidity={1.5}
        rayleigh={0.8}
        inclination={0.55}
        azimuth={0.18}
      />

      {/* Authentic, highly detailed ambient lighting using a professional forest preset */}
      <Environment preset="forest" />

      {/* Brilliant, warm, sun-kissed lighting combination (resolving dark spots completely!) */}
      <ambientLight intensity={0.9} color="#a9b89f" />
      <directionalLight
        position={[55, 45, 35]}
        intensity={6.0}
        color="#ffe8c2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-125}
        shadow-camera-right={125}
        shadow-camera-top={125}
        shadow-camera-bottom={-125}
        shadow-bias={-0.0003}
      />
      <hemisphereLight intensity={1.5} color="#ffffff" groundColor="#504030" />

      <Bvh firstHitOnly>
        {/* Beautiful organic moss patches covering the courtyard floors */}
        <MossyPatches />

        {/* Hand-placed dense clusters of tropical ferns around pillars & ruins */}
        <FernsCollection />

        {/* Ancient uneven stone paving slabs scattered across the floor */}
        <MossyPavingSlabs />

        {/* Ancient vegetation layers */}
        <UndergrowthAndFerns />

        {/* Giant ancient jungle Banyan trees (Image 3 style) */}
        <AncientJungleTree position={[-60, 0, -60]} scale={1.2} />
        <AncientJungleTree position={[60, 0, -60]} scale={1.15} />
        <AncientJungleTree position={[-60, 0, 60]} scale={1.1} />
        <AncientJungleTree position={[60, 0, 60]} scale={1.25} />
        <AncientJungleTree position={[0, 0, -65]} scale={1.1} />
        <AncientJungleTree position={[0, 0, 65]} scale={1.2} />
        <AncientJungleTree position={[-55, 0, 0]} scale={1.1} />
        <AncientJungleTree position={[55, 0, 0]} scale={1.15} />

        <GodRays />
        
        {/* Render our heavily overgrown thick jungle and moss elements */}
        <OvergrownTempleDecorations />

        {/* Outer perimeter Banyan trees for expanded map */}
        <InstancedBackgroundTrees />
        
        {/* Overgrown trees ON the temple itself */}
        <AncientJungleTree position={[-25, 20, -25]} scale={0.7} />
        <AncientJungleTree position={[25, 20, 25]} scale={0.8} />
        <AncientJungleTree position={[-15, 30, 15]} scale={0.6} />
        <AncientJungleTree position={[15, 30, -15]} scale={0.65} />
        <AncientJungleTree position={[0, 35, 10]} scale={0.5} />

        {/* Outer perimeter Banyan trees for expanded 200x200 map */}
        <AncientJungleTree position={[-90, 0, -90]} scale={1.3} />
        <AncientJungleTree position={[90, 0, -90]} scale={1.2} />
        <AncientJungleTree position={[-90, 0, 90]} scale={1.25} />
        <AncientJungleTree position={[90, 0, 90]} scale={1.35} />
        <AncientJungleTree position={[0, 0, -92]} scale={1.2} />
        <AncientJungleTree position={[0, 0, 92]} scale={1.15} />
        <AncientJungleTree position={[-92, 0, 0]} scale={1.2} />
        <AncientJungleTree position={[92, 0, 0]} scale={1.25} />

        {/* Imposing Guardian statues holding golden sacred spears */}
        <DetailedStatue
          position={[-32, 0, -32]}
          rotation={[0, Math.PI / 4, 0]}
        />
        <DetailedStatue
          position={[32, 0, -32]}
          rotation={[0, -Math.PI / 4, 0]}
        />
        <DetailedStatue
          position={[-32, 0, 32]}
          rotation={[0, Math.PI * 0.75, 0]}
        />
        <DetailedStatue
          position={[32, 0, 32]}
          rotation={[0, -Math.PI * 0.75, 0]}
        />

        {/* Sacred Bird / Garuda Statues flanking staircases exactly as shown in Image 3 */}
        <BlackBirdStatue position={[0, 0, 17]} rotation={[0, Math.PI, 0]} />
        <BlackBirdStatue position={[0, 0, -17]} rotation={[0, 0, 0]} />

        {/* Flickering sacred fire braziers */}
        <FirePit position={[15, 0, 15]} />
        <FirePit position={[-15, 0, 15]} />
        <FirePit position={[15, 0, -15]} />
        <FirePit position={[-15, 0, -15]} />
        <FirePit position={[0, 11, 0]} />

        <RigidBody
          type="fixed"
          colliders="cuboid"
          position={[0, -0.5, 0]}
          friction={1}
        >
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[MAP_SIZE, 1, MAP_SIZE]} />
            <TextureMaterial
              textureName="brown_mud_dry"
              repeat={[MAP_SIZE / 4, MAP_SIZE / 4]}
              color="#ab7a5e"
              roughness={0.95}
            />
          </mesh>
        </RigidBody>

        <RigidBody type="fixed" colliders="cuboid">
          {/* Outer Boundary Walls */}
          <mesh
            position={[0, WALL_HEIGHT / 2, -(MAP_SIZE / 2)]}
            
           castShadow receiveShadow
          >
            <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
            <TextureMaterial
              textureName="stone_brick_wall_001"
              repeat={[MAP_SIZE / 8, WALL_HEIGHT / 4]}
              color={COLOR_MOSSY_STONE}
            />
          </mesh>
          <mesh
            position={[0, WALL_HEIGHT / 2, MAP_SIZE / 2]}
            
           castShadow receiveShadow
          >
            <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
            <TextureMaterial
              textureName="stone_brick_wall_001"
              repeat={[MAP_SIZE / 8, WALL_HEIGHT / 4]}
              color={COLOR_MOSSY_STONE}
            />
          </mesh>
          <mesh
            position={[-(MAP_SIZE / 2), WALL_HEIGHT / 2, 0]}
            rotation={[0, Math.PI / 2, 0]}
            
           castShadow receiveShadow
          >
            <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
            <TextureMaterial
              textureName="stone_brick_wall_001"
              repeat={[MAP_SIZE / 8, WALL_HEIGHT / 4]}
              color={COLOR_MOSSY_STONE}
            />
          </mesh>
          <mesh
            position={[MAP_SIZE / 2, WALL_HEIGHT / 2, 0]}
            rotation={[0, Math.PI / 2, 0]}
            
           castShadow receiveShadow
          >
            <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
            <TextureMaterial
              textureName="stone_brick_wall_001"
              repeat={[MAP_SIZE / 8, WALL_HEIGHT / 4]}
              color={COLOR_MOSSY_STONE}
            />
          </mesh>

          {/* New Visitable Main Shrine Enclosure (Image 1 style) */}
          <MainShrineEnclosure />

          {/* Giant Monumental Columns with Grooves, Gold Rings, climbing roots (Image 1 & 3 style) */}
          {[-38, 38].map((x) =>
            [-38, 38].map((z) => (
              <MonumentalColumn key={`pillar-${x}-${z}`} position={[x, 0, z]} />
            )),
          )}

          {/* Archways forming the main gallery halls */}
          <Archway position={[35, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
          <Archway position={[-35, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
          <Archway position={[0, 0, 35]} rotation={[0, 0, 0]} />
          <Archway position={[0, 0, -35]} rotation={[0, 0, 0]} />
        </RigidBody>
      </Bvh>
    </>
  );
}
