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


export function MapNexus() {
  return (
    <>
      <fog attach="fog" args={['#0f172a', 60, 280]} />
      <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dikhololo_night_1k.hdr" />
      <ambientLight intensity={0.4} color="#fed7aa" />
      
      {/* Neon glowing lights */}
      <pointLight position={[0, 15, 0]} intensity={2} distance={80} color="#ec4899" />
      <pointLight position={[30, 10, 30]} intensity={1.5} distance={60} color="#4f46e5" />
      <pointLight position={[-30, 10, -30]} intensity={1.5} distance={60} color="#4f46e5" />
      <pointLight position={[30, 10, -30]} intensity={1.5} distance={60} color="#14b8a6" />
      <pointLight position={[-30, 10, 30]} intensity={1.5} distance={60} color="#14b8a6" />

      <RigidBody type="fixed" colliders={false} position={[0, -0.5, 0]}>
        <CuboidCollider args={[MAP_SIZE / 2, 0.5, MAP_SIZE / 2]} />
        <mesh receiveShadow position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[MAP_SIZE, MAP_SIZE]} />
          <TextureMaterial textureName="blue_metal_plate" repeat={[MAP_SIZE / 2, MAP_SIZE / 2]} color="#94a3b8" />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid">
        {/* Outer Boundary Walls - Sci fi dark walls */}
        <mesh position={[0, WALL_HEIGHT / 2, -(MAP_SIZE / 2)]} castShadow receiveShadow>
          <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        <mesh position={[0, WALL_HEIGHT / 2, MAP_SIZE / 2]} castShadow receiveShadow>
          <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        <mesh position={[-(MAP_SIZE / 2), WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        <mesh position={[MAP_SIZE / 2, WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>

        {/* Inner arena walls */}
        <mesh position={[16, WALL_HEIGHT / 2, 22.5]} castShadow receiveShadow>
          <boxGeometry args={[2, WALL_HEIGHT, 35]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.8} emissive="#4f46e5" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[16, WALL_HEIGHT / 2, -22.5]} castShadow receiveShadow>
          <boxGeometry args={[2, WALL_HEIGHT, 35]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.8} emissive="#4f46e5" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[-16, WALL_HEIGHT / 2, 22.5]} castShadow receiveShadow>
          <boxGeometry args={[2, WALL_HEIGHT, 35]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.8} emissive="#4f46e5" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[-16, WALL_HEIGHT / 2, -22.5]} castShadow receiveShadow>
          <boxGeometry args={[2, WALL_HEIGHT, 35]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.8} emissive="#4f46e5" emissiveIntensity={0.2} />
        </mesh>

        <mesh position={[22.5, WALL_HEIGHT / 2, 16]} castShadow receiveShadow>
          <boxGeometry args={[35, WALL_HEIGHT, 2]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.8} emissive="#ec4899" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[22.5, WALL_HEIGHT / 2, -16]} castShadow receiveShadow>
          <boxGeometry args={[35, WALL_HEIGHT, 2]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.8} emissive="#ec4899" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[-22.5, WALL_HEIGHT / 2, 16]} castShadow receiveShadow>
          <boxGeometry args={[35, WALL_HEIGHT, 2]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.8} emissive="#ec4899" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[-22.5, WALL_HEIGHT / 2, -16]} castShadow receiveShadow>
          <boxGeometry args={[35, WALL_HEIGHT, 2]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.8} emissive="#ec4899" emissiveIntensity={0.2} />
        </mesh>
        
        {/* Central Core */}
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[20, 3, 20]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.7} emissive="#ec4899" emissiveIntensity={0.5} />
        </mesh>
      </RigidBody>
    </>
  );
}
