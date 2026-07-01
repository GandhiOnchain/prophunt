import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { Environment } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS } from './utils';

import { useSafeTexture } from './SafeTexture';

const TextureMaterial = ({ textureName, repeat = [1, 1], color = '#ffffff', roughness = 0.9, metalness = 0.1 }: { textureName: string, repeat?: [number, number], color?: string, roughness?: number, metalness?: number }) => {
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


export function MapMine() {
  return (
    <>
      <fog attach="fog" args={['#18181b', 40, 250]} />
      <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/industrial_sunset_02_1k.hdr" />
      <ambientLight intensity={0.15} color="#fed7aa" />
      {/* Point lights for mine lamps */}
      <pointLight position={[0, 10, 0]} intensity={1.2} distance={55} color="#fbbf24" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005} />
      <pointLight position={[30, 10, 30]} intensity={0.8} distance={40} color="#fbbf24" />
      <pointLight position={[-30, 10, -30]} intensity={0.8} distance={40} color="#fbbf24" />
      <pointLight position={[30, 10, -30]} intensity={0.8} distance={40} color="#fbbf24" />
      <pointLight position={[-30, 10, 30]} intensity={0.8} distance={40} color="#fbbf24" />

      <RigidBody type="fixed" colliders={false} position={[0, -0.5, 0]}>
        <CuboidCollider args={[MAP_SIZE / 2, 0.5, MAP_SIZE / 2]} />
        <mesh receiveShadow position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[MAP_SIZE, MAP_SIZE]} />
          <TextureMaterial textureName="brown_mud_dry" repeat={[MAP_SIZE / 4, MAP_SIZE / 4]} color="#78350f" />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid">
        {/* Outer Boundary Walls - Dark rock */}
        <mesh position={[0, WALL_HEIGHT / 2, -(MAP_SIZE / 2)]} castShadow receiveShadow>
          <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color="#27272a" roughness={0.9} />
        </mesh>
        <mesh position={[0, WALL_HEIGHT / 2, MAP_SIZE / 2]} castShadow receiveShadow>
          <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color="#27272a" roughness={0.9} />
        </mesh>
        <mesh position={[-(MAP_SIZE / 2), WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color="#27272a" roughness={0.9} />
        </mesh>
        <mesh position={[MAP_SIZE / 2, WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color="#27272a" roughness={0.9} />
        </mesh>

        {/* Large cross wall forming mine shafts */}
        <mesh position={[0, WALL_HEIGHT, 40]} castShadow receiveShadow>
          <boxGeometry args={[10, WALL_HEIGHT * 2, 40]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.9} />
        </mesh>
        <mesh position={[0, WALL_HEIGHT, -40]} castShadow receiveShadow>
          <boxGeometry args={[10, WALL_HEIGHT * 2, 40]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.9} />
        </mesh>
        <mesh position={[40, WALL_HEIGHT, 0]} castShadow receiveShadow>
          <boxGeometry args={[40, WALL_HEIGHT * 2, 10]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.9} />
        </mesh>
        <mesh position={[-40, WALL_HEIGHT, 0]} castShadow receiveShadow>
          <boxGeometry args={[40, WALL_HEIGHT * 2, 10]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.9} />
        </mesh>
        
        {/* Raised rocky areas */}
        <mesh position={[-30, 2, 30]} castShadow receiveShadow>
           <boxGeometry args={[20, 4, 20]} />
           <meshStandardMaterial color="#52525b" roughness={0.9} />
        </mesh>
        <mesh position={[30, 2, -30]} castShadow receiveShadow>
           <boxGeometry args={[20, 4, 20]} />
           <meshStandardMaterial color="#52525b" roughness={0.9} />
        </mesh>
      </RigidBody>
    </>
  );
}
