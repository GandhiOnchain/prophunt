import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { Sky, useTexture } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { MAP_SIZE, WALL_HEIGHT, WALL_THICKNESS } from './utils';

import { useSafeTexture } from './SafeTexture';

const EnvironmentMaterial = ({ textureName, repeat = 10, color = '#ffffff' }: { textureName: string, repeat?: number, color?: string }) => {
  const diffUrl = `https://textures.polyhaven.net/file/ph-assets/Textures/jpg/1k/${textureName}/${textureName}_diff_1k.jpg`;
  
  const diffuse = useSafeTexture(diffUrl);

  useMemo(() => {
    if (diffuse) {
      diffuse.wrapS = diffuse.wrapT = THREE.RepeatWrapping;
      diffuse.repeat.set(repeat, repeat);
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


export function MapBeach() {
  return (
    <>
      <fog attach="fog" args={['#e0f2fe', 80, 250]} />
      <Sky sunPosition={[120, 45, 80]} turbidity={0.08} rayleigh={0.25} inclination={0.6} azimuth={0.25} />
      
      <ambientLight intensity={0.5} color="#ffffff" />
      <directionalLight 
        position={[60, 40, 50]} 
        intensity={1.2} 
        color="#ffffff"
        castShadow 
        shadow-mapSize={[1024, 1024]} 
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
          <EnvironmentMaterial textureName="coast_sand_01" repeat={MAP_SIZE / 4} color="#fef08a" />
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
