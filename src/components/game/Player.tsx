import { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CuboidCollider, useRapier } from '@react-three/rapier';
import { Vector3, Vector2, Raycaster, Object3D, Euler, Quaternion, MathUtils, Group } from 'three';
import { PointerLockControls, useGLTF } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';
import { PropRegistry, PropType } from './PropModels';
import { MAP_SIZE } from './utils';
import { audioSystem } from './AudioSystem';

// Pre-load the weapon model
const BLASTER_URL = 'https://raw.githubusercontent.com/pmndrs/market-assets/main/files/models/blaster-a/model.gltf';
useGLTF.preload(BLASTER_URL);

function WeaponModel() {
  const { scene } = useGLTF(BLASTER_URL);
  const clone = useMemo(() => {
    const c = scene.clone();
    c.traverse((node: any) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);
  return <primitive object={clone} scale={0.5} position={[0, -0.1, -0.1]} rotation={[0, Math.PI, 0]} />;
}

function usePlayerControls(isChatFocused: boolean) {
  const movement = useRef({ forward: false, backward: false, left: false, right: false, jump: false, sprint: false, up: false, down: false });
  
  useEffect(() => {
    if (isChatFocused) {
      movement.current = { forward: false, backward: false, left: false, right: false, jump: false, sprint: false, up: false, down: false };
    }
  }, [isChatFocused]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (useGameStore.getState().isChatFocused) return;
      if (e.code === 'KeyW') movement.current.forward = true;
      if (e.code === 'KeyS') movement.current.backward = true;
      if (e.code === 'KeyA') movement.current.left = true;
      if (e.code === 'KeyD') movement.current.right = true;
      if (e.code === 'Space' && !e.repeat) movement.current.jump = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') movement.current.sprint = true;
      if (e.code === 'KeyQ') movement.current.up = true;
      if (e.code === 'KeyE') movement.current.down = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') movement.current.forward = false;
      if (e.code === 'KeyS') movement.current.backward = false;
      if (e.code === 'KeyA') movement.current.left = false;
      if (e.code === 'KeyD') movement.current.right = false;
      if (e.code === 'Space') movement.current.jump = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') movement.current.sprint = false;
      if (e.code === 'KeyQ') movement.current.up = false;
      if (e.code === 'KeyE') movement.current.down = false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return movement;
}

const PLAYER_USER_DATA = { isPlayer: true };
const ENABLED_ROTATIONS: [boolean, boolean, boolean] = [false, false, false];
const HUNTER_COLLIDER_ARGS: [number, number, number] = [0.4, 0.9, 0.4];
const HUNTER_COLLIDER_POS: [number, number, number] = [0, 0.9, 0];

export function Player() {
  const isHunter = useGameStore(state => state.isHunter);
  const initialSpawnPosition = useMemo(() => {
    // Hunters spawn high up (ready to drop or stay in cage)
    if (isHunter) return [0, 50, 0] as [number, number, number];
    
    // Props spawn spread out and at a safe height to avoid clipping into map objects like the Temple pyramid
    const x = (Math.random() - 0.5) * 60;
    const z = (Math.random() - 0.5) * 60;
    // If spawning near center (pyramid area), spawn even higher
    const y = (Math.abs(x) < 25 && Math.abs(z) < 25) ? 15 : 8;
    
    return [x, y, z] as [number, number, number];
  }, [isHunter]);

  // Handle initial spawn and team-change respawn
  const spawnKey = useMemo(() => isHunter ? 'hunter' : 'prop', [isHunter]);

  useEffect(() => {
    if (ref.current) {
      const [x, y, z] = initialSpawnPosition;
      ref.current.setTranslation({ x, y, z }, true);
      ref.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      ref.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
  }, [initialSpawnPosition]);

  const ref = useRef<RapierRigidBody>(null);
  const weaponRef = useRef<Group>(null);
  const meshRef = useRef<Group>(null);
  const { camera, scene } = useThree();
  const { rapier, world } = useRapier();
  const isChatFocused = useGameStore(state => state.isChatFocused);
  const movement = usePlayerControls(isChatFocused);
  
  // Use selectors to prevent unnecessary re-renders
  const gamePhase = useGameStore(state => state.gamePhase);
  const playerPropType = useGameStore(state => state.playerPropType);
  const isLocked = useGameStore(state => state.isLocked);
  
  // Non-reactive actions can be extracted without selector as they are stable
  const { setPlayerPropType, setIsLocked } = useGameStore.getState();
  const PlayerModel = PropRegistry[playerPropType as PropType];

  useEffect(() => {
    console.log("Player mounted!");
    return () => console.log("Player unmounted!");
  }, []);

  const direction = new Vector3();
  const frontVector = new Vector3();
  const sideVector = new Vector3();
  const [tracers, setTracers] = useState<{id: number, start: Vector3, end: Vector3}[]>([]);
  
  const recoil = useRef(0);
  const bobbing = useRef(0);
  const isGrounded = useRef(false);
  const lastGroundedTime = useRef(0);
  const hasJumped = useRef(false);
  const ghostPos = useRef<Vector3 | null>(null);
  const wasLocked = useRef(false);
  const lockedPhysicalPos = useRef<Vector3 | null>(null);
  const lastStoreUpdate = useRef(0);
  const lastPropChange = useRef(0);
  const lastTaunt = useRef(0);

  // Physics Movement & Camera
  useFrame((state, delta) => {
    if (!ref.current || gamePhase === 'GAME_OVER') return;
    // Allow hunters to move during HIDING phase (contained inside cage)

    const velocity = ref.current.linvel();
    let position = ref.current.translation();

    // Throttle store update for player position to 50ms to keep it ultra-performant
    const now = performance.now();
    if (now - lastStoreUpdate.current > 50) {
      if (isLocked && lockedPhysicalPos.current) {
        useGameStore.getState().setPlayerPosition([lockedPhysicalPos.current.x, lockedPhysicalPos.current.y, lockedPhysicalPos.current.z]);
      } else {
        useGameStore.getState().setPlayerPosition([position.x, position.y, position.z]);
      }
      if (isLocked && ghostPos.current) {
        useGameStore.getState().setGhostPosition([ghostPos.current.x, ghostPos.current.y, ghostPos.current.z]);
      } else {
        useGameStore.getState().setGhostPosition(null);
      }
      lastStoreUpdate.current = now;
    }

    const isMoving = movement.current.forward || movement.current.backward || movement.current.left || movement.current.right;

    // Sanity check for NaN positions or falling off the map
    if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z) || position.y < -30) {
      const [spawnX, spawnY, spawnZ] = initialSpawnPosition;
      ref.current.setTranslation({ x: spawnX, y: spawnY, z: spawnZ }, true);
      ref.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    // Detect state changes for locking to initialize ghost spectator camera
    if (isLocked && !wasLocked.current) {
      const startPos = new Vector3(position.x, position.y, position.z);
      ghostPos.current = startPos;
      lockedPhysicalPos.current = new Vector3(position.x, position.y, position.z);
      wasLocked.current = true;
      useGameStore.getState().setGhostPosition([startPos.x, startPos.y, startPos.z]);
    } else if (!isLocked) {
      ghostPos.current = null;
      lockedPhysicalPos.current = null;
      wasLocked.current = false;
      useGameStore.getState().setGhostPosition(null);
    }

    // Ground detection via high-density 9-point grid covering center, cardinal edges, and corners.
    // We add a tiny 2% extra skin thickness buffer to offsets to reliably catch the most minimal pixel-level edge contacts.
    const halfWidth = isHunter ? 0.45 : Math.max(0.15, (PlayerModel.size[0] / 2) * 1.02);
    const halfDepth = isHunter ? 0.45 : Math.max(0.15, (PlayerModel.size[2] / 2) * 1.02);

    const rayOffsets = [
      { x: 0, z: 0 },
      // Cardinal edges
      { x: halfWidth, z: 0 },
      { x: -halfWidth, z: 0 },
      { x: 0, z: halfDepth },
      { x: 0, z: -halfDepth },
      // Corner points
      { x: halfWidth, z: halfDepth },
      { x: -halfWidth, z: halfDepth },
      { x: halfWidth, z: -halfDepth },
      { x: -halfWidth, z: -halfDepth },
    ];

    let grounded = false;
    let maxGroundHeight = position.y;

    for (let i = 0; i < rayOffsets.length; i++) {
      const offset = rayOffsets[i];
      const rayOrigin = { x: position.x + offset.x, y: position.y + 0.2, z: position.z + offset.z };
      const ray = new rapier.Ray(rayOrigin, { x: 0, y: -1, z: 0 });
      // Generous maxToi of 0.55 allows ground checks to succeed even when hovering/stepping over pixel ridges
      const hit = world.castRay(ray, 0.55, true, undefined, undefined, undefined, ref.current as any) as any;

      if (hit) {
        const hitToi = hit.timeOfImpact !== undefined ? hit.timeOfImpact : hit.toi;
        if (hitToi === undefined || isNaN(hitToi) || hitToi < 0.01) continue;
        const groundHeight = position.y + 0.2 - hitToi;
        const distanceToGround = hitToi - 0.2; // negative means clipping, positive means floating

        // We use a flexible detection threshold to support step climbing and minimal corners
        if (distanceToGround <= 0.15 && distanceToGround >= -0.25) {
          grounded = true;
          if (groundHeight > maxGroundHeight) {
            maxGroundHeight = groundHeight;
          }
        }
      }
    }

    // Secondary fallback: If the vertical velocity is small or downward, we might be resting
    // on a very minimal corner where normal raycasts missed due to rounding or floating point.
    if (!grounded && velocity.y <= 0.1) {
      for (let i = 0; i < rayOffsets.length; i++) {
        const offset = rayOffsets[i];
        const rayOrigin = { x: position.x + offset.x, y: position.y + 0.2, z: position.z + offset.z };
        const ray = new rapier.Ray(rayOrigin, { x: 0, y: -1, z: 0 });
        const hit = world.castRay(ray, 0.6, true, undefined, undefined, undefined, ref.current as any) as any;
        if (hit) {
          const hitToi = hit.timeOfImpact !== undefined ? hit.timeOfImpact : hit.toi;
          if (hitToi === undefined || isNaN(hitToi) || hitToi < 0.01) continue;
          const groundHeight = position.y + 0.2 - hitToi;
          const distanceToGround = hitToi - 0.2;
          if (distanceToGround <= 0.25 && distanceToGround >= -0.35) {
            grounded = true;
            if (groundHeight > maxGroundHeight) {
              maxGroundHeight = groundHeight;
            }
          }
        }
      }
    }

    // Track grounded timestamps for coyote time (allows jump right as player slips off pixel-edges)
    if (grounded) {
      lastGroundedTime.current = performance.now();
      hasJumped.current = false;
    }

    isGrounded.current = grounded;

    // Solid Ground Constraint: Let Rapier handle normal ground contact to prevent physics collision conflicts and sudden teleport glitches.
    if (grounded && !movement.current.jump && !isLocked) {
      // Zero out downward velocity when standing still/moving horizontally on flat surfaces
      if (velocity.y < 0) {
        ref.current.setLinvel({ x: velocity.x, y: 0, z: velocity.z }, true);
      }
    }

    // Movement
    if (!isLocked) {
      ref.current.setGravityScale(1, true);
      const speed = isHunter ? (movement.current.sprint ? 12 : 7) : (movement.current.sprint ? 8 : 5);
      const isMoving = movement.current.forward || movement.current.backward || movement.current.left || movement.current.right;

      if (isMoving) {
        const forward = new Vector3(0, 0, -1);
        const right = new Vector3(1, 0, 0);

        // Transform directions based on current camera orientation
        forward.applyQuaternion(camera.quaternion);
        forward.y = 0; // Keep movement purely horizontal
        forward.normalize();

        right.applyQuaternion(camera.quaternion);
        right.y = 0; // Keep movement purely horizontal
        right.normalize();

        direction.set(0, 0, 0);
        if (movement.current.forward) direction.add(forward);
        if (movement.current.backward) direction.sub(forward);
        if (movement.current.left) direction.sub(right);
        if (movement.current.right) direction.add(right);

        direction.normalize().multiplyScalar(speed);
        ref.current.setLinvel({ x: direction.x, y: velocity.y, z: direction.z }, true);
        
        // Auto-rotate Prop body to face camera direction roughly (if not locked)
        if (!isHunter) {
          const cameraForward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
          const yawAngle = Math.atan2(cameraForward.x, cameraForward.z);
          const { propRotationOffset } = useGameStore.getState();
          ref.current.setRotation(new Quaternion().setFromEuler(new Euler(0, yawAngle + propRotationOffset, 0)), true);
        }
      } else {
        ref.current.setLinvel({ x: 0, y: velocity.y, z: 0 }, true);
      }
    } else {
      // Freezing Logic: During lock, we use kinematic or fixed simulation to prevent physics drift
      ref.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      ref.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

      // Ghost mode camera flying navigation
      if (ghostPos.current) {
        const speed = (movement.current.sprint ? 24 : 12) * delta; // Free-roaming speed
        
        // Horizontal movement vectors derived from camera quaternion but projected onto horizontal plane (y = 0)
        const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        forward.y = 0;
        forward.normalize();

        const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        right.y = 0;
        right.normalize();

        const flyDirection = new Vector3();
        if (movement.current.forward) flyDirection.add(forward);
        if (movement.current.backward) flyDirection.sub(forward);
        if (movement.current.left) flyDirection.sub(right);
        if (movement.current.right) flyDirection.add(right);

        // Normalize horizontal movement to avoid speedups when moving diagonally
        if (flyDirection.lengthSq() > 0) {
          flyDirection.normalize().multiplyScalar(speed);
        }

        // Vertical movement is strictly dictated by Q to climb and E to descend
        let verticalMove = 0;
        if (movement.current.up) verticalMove += 1;
        if (movement.current.down) verticalMove -= 1;
        flyDirection.y = verticalMove * speed * 0.8; // Vertical speed factor

        if (flyDirection.lengthSq() > 0) {
          ghostPos.current.add(flyDirection);

          // Bound ghost positions within map size
          const ghostLimit = MAP_SIZE / 2 - 1.5;
          ghostPos.current.x = MathUtils.clamp(ghostPos.current.x, -ghostLimit, ghostLimit);
          ghostPos.current.z = MathUtils.clamp(ghostPos.current.z, -ghostLimit, ghostLimit);
          ghostPos.current.y = MathUtils.clamp(ghostPos.current.y, 0.2, 25);
        }
      }
    }

    // Jump with Coyote Time support
    const canJump = isGrounded.current || (performance.now() - lastGroundedTime.current < 150 && !hasJumped.current);
    if (movement.current.jump) {
      if (canJump && !isLocked) {
        ref.current.setLinvel({ x: velocity.x, y: 8.5, z: velocity.z }, true);
        isGrounded.current = false;
        hasJumped.current = true;
      }
      movement.current.jump = false;
    }

    // Camera Logic & Bobbing
    if (isHunter) {
      // Bobbing
      if (isMoving && Math.abs(velocity.y) < 0.1) {
        bobbing.current += delta * (movement.current.sprint ? 15 : 10);
      } else {
        bobbing.current = MathUtils.lerp(bobbing.current, 0, 0.1);
      }
      const bobY = Math.sin(bobbing.current) * 0.05;
      
      camera.position.set(position.x, position.y + 1.6 + bobY, position.z);

      // Weapon Recoil Recovery
      if (recoil.current > 0) {
         recoil.current = MathUtils.lerp(recoil.current, 0, 0.1);
      }
      
      if (weaponRef.current) {
         // Smoothly sync weapon with camera in world space
         weaponRef.current.position.copy(camera.position);
         weaponRef.current.quaternion.copy(camera.quaternion);
         
         // Modern FPP Weapon Feel: Sway & Lag
         const weaponSwayX = Math.sin(bobbing.current * 0.5) * 0.015;
         const weaponSwayY = Math.cos(bobbing.current) * 0.01;
         
         const offset = new Vector3(
           0.22 + weaponSwayX, 
           -0.22 + bobY * 0.4 + weaponSwayY + (recoil.current * 0.08), 
           -0.45 + recoil.current * 0.25
         );
         offset.applyQuaternion(camera.quaternion);
         weaponRef.current.position.add(offset);
         
         // Dynamic tilt and recoil rotation
         weaponRef.current.rotateZ(weaponSwayX * 1.5);
         weaponRef.current.rotateX(recoil.current * 0.35);
      }

    } else {
      // Third Person
      if (isLocked && ghostPos.current) {
        camera.position.copy(ghostPos.current);
      } else {
        // Calculate offset based on camera's quaternion (which stays stable without Euler rotation-order issues)
        const dir = new Vector3(0, 0, 1).applyQuaternion(camera.quaternion);
        const targetCamPos = new Vector3(position.x, position.y + 0.5, position.z).addScaledVector(dir, 4);

        // Raycast from player center to target camera position to prevent wall clipping
        const rayOrigin = new Vector3(position.x, position.y + 0.5, position.z);
        const rayDir = dir.clone().normalize();
        const rapierRay = new rapier.Ray(rayOrigin, rayDir);
        const hit = world.castRay(rapierRay, 4, true, undefined, undefined, undefined, ref.current as any) as any;

        if (hit) {
          const hitToi = hit.timeOfImpact !== undefined ? hit.timeOfImpact : hit.toi;
          if (hitToi !== undefined && !isNaN(hitToi) && hitToi > 0.6) {
            const safeDist = Math.max(0.5, hitToi - 0.2);
            camera.position.copy(rayOrigin).addScaledVector(dir, safeDist);
          } else {
            camera.position.copy(targetCamPos);
          }
        } else {
          camera.position.copy(targetCamPos);
        }
      }
    }
  });

  // Action Logic (Shooting / Transforming / Taunting / Rotating)
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!document.pointerLockElement || gamePhase === 'GAME_OVER') return;
      if (gamePhase === 'HIDING' && isHunter) return;

      if (isHunter && e.button === 0) {
        // Hunter Shoot
        recoil.current = 1; // Trigger recoil
        audioSystem.playShootSound();

        const rc = new Raycaster();
        rc.setFromCamera(new Vector2(0, 0), camera);
        const hits = rc.intersectObjects(scene.children, true);
        
        let target: Object3D | null = null;
        let hitPoint = null;

        for (const hit of hits) {
          let obj: Object3D | null = hit.object;
          while (obj) {
            if (obj.userData?.isEnvironmentProp || obj.userData?.isPropBot) {
              target = obj;
              hitPoint = hit.point;
              break;
            }
            obj = obj.parent;
          }
          if (target) break;
        }

        // Visual Tracer
        const startPos = new Vector3(0.3, -0.2, -0.5).unproject(camera);
        const endPos = hitPoint || rc.ray.at(50, new Vector3());
        const tracerId = Date.now();
        setTracers(prev => [...prev, { id: tracerId, start: startPos, end: endPos }]);
        setTimeout(() => setTracers(prev => prev.filter(t => t.id !== tracerId)), 100);

        if (target) {
          const { killPropBot, addScore, triggerHitMarker, setHp } = useGameStore.getState();
          if (target.userData.isPropBot) {
            killPropBot(target.userData.id);
            addScore(500);
            triggerHitMarker();
            audioSystem.playHitSound();
            setHp(prev => Math.min(100, prev + 15));
            useGameStore.getState().addChatMessage(
              `🎯 CRITICAL HIT! Eliminated Prop Bot! +15 HP`,
              'System',
              'SYSTEM',
              false,
              'global'
            );
          } else if (target.userData.isEnvironmentProp) {
            audioSystem.playMisfireSound();
            setHp(prev => {
              const newHp = Math.max(0, prev - 8);
              if (newHp === 0) {
                setTimeout(() => {
                  useGameStore.getState().setGameOver('BLASTER OVERHEATED! Weapon feedback destroyed core.');
                }, 100);
              }
              return newHp;
            });
            useGameStore.getState().addChatMessage(
              `⚠️ MISFIRE: Shot incorrect prop! Backlash dealt -8 HP damage.`,
              'System',
              'SYSTEM',
              false,
              'global'
            );
          }
        } else {
          const { setHp } = useGameStore.getState();
          audioSystem.playMisfireSound();
          setHp(prev => {
            const newHp = Math.max(0, prev - 4);
            if (newHp === 0) {
              setTimeout(() => {
                useGameStore.getState().setGameOver('BLASTER OVERHEATED! Spent too much charge on vacuum.');
              }, 100);
            }
            return newHp;
          });
        }

      } else if (!isHunter) {
        if (e.button === 0) {
          // Prop Transform - With Cooldown
          if (performance.now() - lastPropChange.current < 2000) {
             // Still on cooldown
             return;
          }

          const rc = new Raycaster();
          rc.setFromCamera(new Vector2(0, 0), camera);
          const hits = rc.intersectObjects(scene.children, true);
          
          for (const hit of hits) {
            // Only allow transforming into props within close reach (8 units distance)
            if (hit.distance > 8) continue;
            
            let obj: Object3D | null = hit.object;
            while (obj) {
              if (obj.userData?.isEnvironmentProp && obj.userData?.propType) {
                const newProp = obj.userData.propType;
                 if (newProp !== playerPropType) {
                  setPlayerPropType(newProp);
                  lastPropChange.current = performance.now();
                  
                  audioSystem.playDisguiseSound();

                  // Add nice chat confirmation of disguise switch
                  useGameStore.getState().addChatMessage(
                    `Disguised successfully as a ${newProp.toUpperCase()}!`,
                    'System',
                    'SYSTEM',
                    false,
                    'team'
                  );
                }
                return;
              }
              obj = obj.parent;
            }
          }
        } else if (e.button === 2) {
          // Right click: Lock Position
          setIsLocked(prev => !prev);
        }
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!document.pointerLockElement || gamePhase === 'GAME_OVER' || isHunter) return;
      if (useGameStore.getState().isChatFocused) return;

      // Taunting (F key)
      if (e.code === 'KeyF') {
        if (performance.now() - lastTaunt.current < 5000) return; // 5s cooldown
        lastTaunt.current = performance.now();
        useGameStore.getState().addScore(50); // Reward for taunting
        
        const taunts = [
          { name: '🔊 *WHISTLES LOUDLY*', fn: () => audioSystem.playWhistleTaunt() },
          { name: '🔊 *RETRO CHIRP*', fn: () => audioSystem.playChirpTaunt() },
          { name: '🔊 *PANIC ALARM*', fn: () => audioSystem.playAlarmTaunt() },
          { name: '🔊 *SLIDE WHISTLE*', fn: () => audioSystem.playSlideTaunt() }
        ];
        
        const selectedTaunt = taunts[Math.floor(Math.random() * taunts.length)];
        selectedTaunt.fn();

        useGameStore.getState().addChatMessage(selectedTaunt.name, 'You', 'PROP', true, 'global');
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!document.pointerLockElement || isHunter) return;
      // Scroll to rotate prop manually
      const { setPropRotationOffset } = useGameStore.getState();
      const rotationAmount = e.deltaY > 0 ? -0.2 : 0.2;
      setPropRotationOffset(prev => prev + rotationAmount);
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('wheel', onWheel);
    
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('wheel', onWheel);
    };
  }, [camera, scene, isHunter, gamePhase, playerPropType]);

  // Context menu prevention for right click lock
  useEffect(() => {
    const preventContext = (e: Event) => e.preventDefault();
    window.addEventListener('contextmenu', preventContext);
    return () => window.removeEventListener('contextmenu', preventContext);
  }, []);

  const propColliderArgs = useMemo<[number, number, number]>(() => {
    return [PlayerModel.size[0]/2, PlayerModel.size[1]/2, PlayerModel.size[2]/2];
  }, [PlayerModel.size]);

  return (
    <>
      <PointerLockControls pointerSpeed={1.2} />
      
      <RigidBody 
        key={spawnKey}
        ref={ref} 
        type={isLocked ? "fixed" : "dynamic"}
        colliders={false}
        mass={1} 
        position={initialSpawnPosition}
        enabledRotations={ENABLED_ROTATIONS} // Keep upright
        ccd={true}
        linearDamping={0.5}
        userData={PLAYER_USER_DATA}
      >
        {isHunter ? (
          <CuboidCollider args={HUNTER_COLLIDER_ARGS} position={HUNTER_COLLIDER_POS} />
        ) : (
          <CuboidCollider 
            args={propColliderArgs} 
            position={PlayerModel.offset} 
          />
        )}
        
        {/* Render the prop model if we are a prop */}
        {!isHunter && (
           <group ref={meshRef} position={PlayerModel.meshOffset}>
             <Suspense fallback={null}>
               <PlayerModel.component />
             </Suspense>
           </group>
        )}
      </RigidBody>
      
      {/* Hunter Weapon Model */}
      {isHunter && (
        <group ref={weaponRef} position={[0.2, -0.2, -0.6]}>
          <Suspense fallback={
            <group>
              <mesh castShadow position={[0, 0, 0.2]}>
                <boxGeometry args={[0.06, 0.1, 0.5]} />
                <meshStandardMaterial color="#1f1f1f" metalness={0.9} roughness={0.4} />
              </mesh>
            </group>
          }>
            <WeaponModel />
          </Suspense>
        </group>
      )}

      {/* Tracers */}
      {tracers.map(t => {
        const dir = new Vector3().subVectors(t.end, t.start);
        const len = dir.length();
        const mid = new Vector3().addVectors(t.start, t.end).multiplyScalar(0.5);
        const alignQ = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize());
        return (
          <mesh key={t.id} position={mid} quaternion={alignQ}>
            <cylinderGeometry args={[0.015, 0.015, len, 4]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.8} />
          </mesh>
        );
      })}
    </>
  );
}
