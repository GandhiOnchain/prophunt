import { MapID } from "../../store/gameStore";

export const MAP_SIZE = 250;
export const WALL_HEIGHT = 8;
export const WALL_THICKNESS = 1;

export function isInsideWall(x: number, z: number, mapId?: MapID): boolean {
  if (Math.abs(x) >= MAP_SIZE / 2 - 1.5 || Math.abs(z) >= MAP_SIZE / 2 - 1.5)
    return true;

  if (mapId === "TEMPLE") {
    const ax = Math.abs(x);
    const az = Math.abs(z);
    // 4 Corner Pillars
    if (ax >= 45 && ax <= 50 && az >= 45 && az <= 50) return true;
    
    // NEW Shrine Walls (Walls at +/- 26, thickness 2, gap +/- 8)
    if (az >= 25.0 && az <= 27.0 && ax >= 8.0 && ax <= 27.0) return true;
    if (ax >= 25.0 && ax <= 27.0 && az >= 8.0 && az <= 27.0) return true;
    // Shrine Corner Pillars (at 27,27)
    if (ax >= 25.0 && ax <= 29.0 && az >= 25.0 && az <= 29.0) return true;
    // Shrine Altar Table
    if (ax <= 2.0 && az <= 2.0) return true;
    // Shrine Canopy Pillars (at 6,6)
    if (ax >= 5.5 && ax <= 6.5 && az >= 5.5 && az <= 6.5) return true;
    // Fire Rock Stands (at 16,16, radius up to 2.5)
    if (ax >= 13.5 && ax <= 18.5 && az >= 13.5 && az <= 18.5) return true;

    // Monumental columns at [-38, 38]
    if (ax >= 36.5 && ax <= 39.5 && az >= 36.5 && az <= 39.5) return true;

    // Archway Pillars (Archways are at +/- 35, pillars at +/- 6 relative to that)
    // For East/West Archways (x = +/- 35, z = +/- 6)
    if (ax >= 33.5 && ax <= 36.5 && az >= 4.5 && az <= 7.5) return true;
    // For North/South Archways (z = +/- 35, x = +/- 6)
    if (az >= 33.5 && az <= 36.5 && ax >= 4.5 && ax <= 7.5) return true;
  } else if (mapId === "LOST_MINE") {
    // Large cross wall in middle
    if (Math.abs(x) <= 5 && Math.abs(z) >= 20 && Math.abs(z) <= 60) return true;
    if (Math.abs(z) <= 5 && Math.abs(x) >= 20 && Math.abs(x) <= 60) return true;
  } else if (mapId === "BLUE_SANDS") {
    // 4 rock formations
    if (
      Math.abs(x) >= 30 &&
      Math.abs(x) <= 35 &&
      Math.abs(z) >= 30 &&
      Math.abs(z) <= 35
    )
      return true;
  } else if (mapId === "NEXUS") {
    // Inner arena walls
    if (
      Math.abs(x) >= 15 &&
      Math.abs(x) <= 17 &&
      Math.abs(z) >= 5 &&
      Math.abs(z) <= 40
    )
      return true;
    if (
      Math.abs(z) >= 15 &&
      Math.abs(z) <= 17 &&
      Math.abs(x) >= 5 &&
      Math.abs(x) <= 40
    )
      return true;
  }

  return false;
}

export function getGroundHeight(x: number, z: number, mapId?: MapID): number {
  if (mapId === "TEMPLE") {
    const ax = Math.abs(x);
    const az = Math.abs(z);
    // New Shrine Base Platform is 64x64, so from -32 to 32. Height is 3.0.
    if (ax <= 32 && az <= 32) return 3.0;
  } else if (mapId === "LOST_MINE") {
    if (x >= -40 && x <= -20 && z >= 20 && z <= 40) return 4.0;
    if (x >= 20 && x <= 40 && z >= -40 && z <= -20) return 4.0;
  } else if (mapId === "NEXUS") {
    if (Math.abs(x) <= 10 && Math.abs(z) <= 10) return 3.0; // Core
  }
  return 0.0;
}

export function safeRequestPointerLock() {
  const canvas = document.querySelector("canvas");
  if (canvas && document.body.contains(canvas) && canvas.isConnected) {
    try {
      const promise = canvas.requestPointerLock();
      if (promise && typeof promise.catch === "function") {
        promise.catch((err) => {
          console.warn("Pointer lock request rejected or failed:", err);
        });
      }
    } catch (err) {
      console.warn("Pointer lock request exception caught safely:", err);
    }
  }
}
