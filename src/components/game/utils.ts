import { MapID } from '../../store/gameStore';

export const MAP_SIZE = 140;
export const WALL_HEIGHT = 8;
export const WALL_THICKNESS = 1;

export function isInsideWall(x: number, z: number, mapId?: MapID): boolean {
  if (Math.abs(x) >= 68.5 || Math.abs(z) >= 68.5) return true;

  if (mapId === 'TEMPLE') {
    // 4 Corner Pillars
    if (Math.abs(x) >= 45 && Math.abs(x) <= 50 && Math.abs(z) >= 45 && Math.abs(z) <= 50) return true;
    // Walls surrounding the central area but leaving entrances
    if (Math.abs(x) >= 20 && Math.abs(x) <= 22 && Math.abs(z) >= 10 && Math.abs(z) <= 22) return true;
    if (Math.abs(z) >= 20 && Math.abs(z) <= 22 && Math.abs(x) >= 10 && Math.abs(x) <= 22) return true;
  } else if (mapId === 'LOST_MINE') {
    // Large cross wall in middle
    if (Math.abs(x) <= 5 && Math.abs(z) >= 20 && Math.abs(z) <= 60) return true;
    if (Math.abs(z) <= 5 && Math.abs(x) >= 20 && Math.abs(x) <= 60) return true;
  } else if (mapId === 'BLUE_SANDS') {
    // 4 rock formations
    if (Math.abs(x) >= 30 && Math.abs(x) <= 35 && Math.abs(z) >= 30 && Math.abs(z) <= 35) return true;
  } else if (mapId === 'NEXUS') {
    // Inner arena walls
    if (Math.abs(x) >= 15 && Math.abs(x) <= 17 && Math.abs(z) >= 5 && Math.abs(z) <= 40) return true;
    if (Math.abs(z) >= 15 && Math.abs(z) <= 17 && Math.abs(x) >= 5 && Math.abs(x) <= 40) return true;
  }

  return false;
}

export function getGroundHeight(x: number, z: number, mapId?: MapID): number {
  if (mapId === 'TEMPLE') {
    if (Math.abs(x) <= 15 && Math.abs(z) <= 15) return 2.0; // Central raised platform
  } else if (mapId === 'LOST_MINE') {
    if (x >= -40 && x <= -20 && z >= 20 && z <= 40) return 4.0;
    if (x >= 20 && x <= 40 && z >= -40 && z <= -20) return 4.0;
  } else if (mapId === 'NEXUS') {
    if (Math.abs(x) <= 10 && Math.abs(z) <= 10) return 3.0; // Core
  }
  return 0.0;
}

export function safeRequestPointerLock() {
  const canvas = document.querySelector('canvas');
  if (canvas && document.body.contains(canvas)) {
    try {
      const promise = canvas.requestPointerLock();
      if (promise && typeof promise.catch === 'function') {
        promise.catch((err) => {
          console.warn('Pointer lock request rejected or failed:', err);
        });
      }
    } catch (err) {
      console.warn('Pointer lock request exception caught safely:', err);
    }
  }
}
