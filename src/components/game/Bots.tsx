import { Suspense } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useGameStore } from '../../store/gameStore';
import { PropRegistry, PropType } from './PropModels';

function OtherPlayerPropsRender() {
  const otherPlayers = useGameStore(state => state.otherPlayers);

  return (
    <>
      {Object.values(otherPlayers).map(player => {
        // If the other player is a Hunter, or is dead, don't render as a prop here
        if (player.isHunter || player.isDead) return null;

        const propConfig = PropRegistry[player.activePropType as PropType];
        if (!propConfig) return null;
        const Model = propConfig.component;

        return (
          <group 
            key={player.id} 
            position={player.position}
            userData={{ isOtherPlayer: true, id: player.id }}
          >
            {/* Visual group applying movement rotations and offsets */}
            <group 
              position={propConfig.meshOffset} 
              rotation={[0, player.rotation[1] + player.propRotationOffset, 0]}
            >
              <Suspense fallback={null}>
                <Model />
              </Suspense>
              
              {/* Optional glowing outline or indicator when they are locked */}
              {player.isLocked && (
                <mesh position={[0, propConfig.size[1]/2, 0]}>
                  <sphereGeometry args={[0.08, 8, 8]} />
                  <meshBasicMaterial color="#a855f7" toneMapped={false} />
                </mesh>
              )}
            </group>
          </group>
        );
      })}
    </>
  );
}

function OtherPlayerHuntersRender() {
  const otherPlayers = useGameStore(state => state.otherPlayers);

  return (
    <>
      {Object.values(otherPlayers).map(player => {
        // If the other player is a Prop, or is dead, don't render as a hunter here
        if (!player.isHunter || player.isDead) return null;

        return (
          <group key={player.id} position={player.position}>
            {/* Visual character capsule for a Hunter */}
            <mesh castShadow position={[0, 0.9, 0]}>
              <capsuleGeometry args={[0.3, 1.2, 8, 16]} />
              <meshStandardMaterial color="#ef4444" metalness={0.7} roughness={0.3} />
            </mesh>
            
            {/* Glowing visor / cyber-eye representing gaze direction */}
            <group rotation={[player.rotation[0], player.rotation[1], player.rotation[2]]}>
              <mesh position={[0, 1.3, -0.3]}>
                <boxGeometry args={[0.35, 0.08, 0.1]} />
                <meshBasicMaterial color="#00f0ff" toneMapped={false} />
              </mesh>
            </group>

            {/* Glowing red base indicator */}
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.4, 0.5, 32]} />
              <meshBasicMaterial color="#ef4444" toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

export function Bots() {
  return (
    <group>
      <OtherPlayerPropsRender />
      <OtherPlayerHuntersRender />
    </group>
  );
}
