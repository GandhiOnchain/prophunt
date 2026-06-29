import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
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


export function MapMine() {
  return (
    <>
      <fog attach="fog" args={['#18181b', 40, 150]} />
      <ambientLight intensity={0.15} color="#fed7aa" />
      {/* Point lights for mine lamps */}
      <pointLight position={[0, 10, 0]} intensity={1} distance={50} color="#fbbf24" castShadow />
      <pointLight position={[30, 10, 30]} intensity={0.8} distance={40} color="#fbbf24" castShadow />
      <pointLight position={[-30, 10, -30]} intensity={0.8} distance={40} color="#fbbf24" castShadow />
      <pointLight position={[30, 10, -30]} intensity={0.8} distance={40} color="#fbbf24" castShadow />
      <pointLight position={[-30, 10, 30]} intensity={0.8} distance={40} color="#fbbf24" castShadow />

      <RigidBody type="fixed" colliders={false} position={[0, -0.5, 0]}>
        <CuboidCollider args={[MAP_SIZE / 2, 0.5, MAP_SIZE / 2]} />
        <mesh receiveShadow position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[MAP_SIZE, MAP_SIZE]} />
          <EnvironmentMaterial textureName="brown_mud_dry" repeat={MAP_SIZE / 4} color="#78350f" />
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
