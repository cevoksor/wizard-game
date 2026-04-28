import { COLOR, PLAYER_SIZE } from "./config.js";
import { dist } from "./utils.js";

export const world = {
  width: 0,
  height: 0,
  respawnPoint: { x: 100, y: 100 },
  merchant: null,
  enemySpawns: []
};

let mapData = null;

export function setMapData(data, w, h) {
  mapData = data;
  world.width = w;
  world.height = h;
}

export function getPixel(x, y) {
  x = Math.floor(x); y = Math.floor(y);
  if (x < 0 || y < 0 || x >= world.width || y >= world.height) return [255, 255, 255];
  const i = (y * world.width + x) * 4;
  return [mapData.data[i], mapData.data[i + 1], mapData.data[i + 2]];
}

export function isWallPoint(x, y) {
  return COLOR.WALL(getPixel(x, y));
}

export function isWall(x, y) {
  const r = PLAYER_SIZE;
  return (
    isWallPoint(x - r, y) ||
    isWallPoint(x + r, y) ||
    isWallPoint(x, y - r) ||
    isWallPoint(x, y + r)
  );
}

export function isGreen(x, y) {
  return COLOR.GREEN(getPixel(x, y));
}

export function hasLineOfSight(ax, ay, bx, by, step = 8) {
  const d = dist(ax, ay, bx, by);
  const steps = Math.max(1, Math.floor(d / step));
  const dx = (bx - ax) / steps;
  const dy = (by - ay) / steps;
  for (let i = 1; i < steps; i++) {
    if (isWallPoint(ax + dx * i, ay + dy * i)) return false;
  }
  return true;
}

export function scanMap() {
  const seenEnemyClusters = [];
  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      const p = getPixel(x, y);
      if (COLOR.RESPAWN(p)) {
        world.respawnPoint = { x, y };
      } else if (COLOR.ENEMY(p)) {
        if (!seenEnemyClusters.some(s => dist(s.x, s.y, x, y) < 100)) {
          world.enemySpawns.push({ x, y });
          seenEnemyClusters.push({ x, y });
        }
      } else if (COLOR.MERCHANT(p)) {
        if (!world.merchant) world.merchant = { x, y };
      }
    }
  }
}
