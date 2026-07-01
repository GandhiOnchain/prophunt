import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { Sky, Environment } from '@react-three/drei';
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


export function MapBeach() {
  return (
    <>
      <fog attach="fog" args={['#e0f2fe', 80, 300]} />
      <Sky sunPosition={[120, 45, 80]} turbidity={0.08} rayleigh={0.25} inclination={0.6} azimuth={0.25} />
      <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kiara_1_dawn_1k.hdr" />
      
      <ambientLight intensity={0.4} color="#ffffff" />
      <directionalLight 
        position={[60, 40, 50]} 
        intensity={1.0} 
        color="#ffffff"
        castShadow 
        shadow-mapSize={[2048, 2048]} 
        shadow-camera-left={-80} 
        shadow-camera-right={80} 
        shadow-camera-top={80} 
        shadow-camera-bottom={-80} 
        shadow-bias={-0.0005}
      />

      <RigidBody type="fixed" colliders={false} position={[0, -0.5, 0]}>
        <CuboidCollider args={[MAP_SIZE / 2, 0.5, MAP_SIZE / 2]} />
        <mesh receiveShadow position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[MAP_SIZE, MAP_SIZE]} />
          <TextureMaterial textureName="coast_sand_01" repeat={[MAP_SIZE / 4, MAP_SIZE / 4]} color="#fef08a" />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid">
        {/* Outer Boundary Walls - Light blue sky walls */}
        <mesh position={[0, WALL_HEIGHT / 2, -(MAP_SIZE / 2)]} castShadow receiveShadow>
          <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.8} />
        </mesh>
        <mesh position={[0, WALL_HEIGHT / 2, MAP_SIZE / 2]} castShadow receiveShadow>
          <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.8} />
        </mesh>
        <mesh position={[-(MAP_SIZE / 2), WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.8} />
        </mesh>
        <mesh position={[MAP_SIZE / 2, WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.8} />
        </mesh>

        {/* Rock formations */}
        <mesh position={[32.5, WALL_HEIGHT / 2, 32.5]} castShadow receiveShadow>
          <boxGeometry args={[5, WALL_HEIGHT, 5]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.8} />
        </mesh>
        <mesh position={[-32.5, WALL_HEIGHT / 2, -32.5]} castShadow receiveShadow>
          <boxGeometry args={[5, WALL_HEIGHT, 5]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.8} />
        </mesh>
        <mesh position={[32.5, WALL_HEIGHT / 2, -32.5]} castShadow receiveShadow>
          <boxGeometry args={[5, WALL_HEIGHT, 5]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.8} />
        </mesh>
        <mesh position={[-32.5, WALL_HEIGHT / 2, 32.5]} castShadow receiveShadow>
          <boxGeometry args={[5, WALL_HEIGHT, 5]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.8} />
        </mesh>
        
        <mesh position={[0, WALL_HEIGHT / 4, 0]} castShadow receiveShadow>
          <boxGeometry args={[15, WALL_HEIGHT / 2, 15]} />
          <meshStandardMaterial color="#d1d5db" roughness={0.9} />
        </mesh>
        
        {/* Some other barrier walls */}
        <mesh position={[0, WALL_HEIGHT / 2, 15]} castShadow receiveShadow>
          <boxGeometry args={[25, WALL_HEIGHT, 2]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.9} />
        </mesh>
        <mesh position={[0, WALL_HEIGHT / 2, -15]} castShadow receiveShadow>
          <boxGeometry args={[25, WALL_HEIGHT, 2]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.9} />
        </mesh>
      </RigidBody>
    </>
  );
}
