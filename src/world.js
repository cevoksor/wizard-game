import { COLOR, PLAYER_SIZE } from "./config.js?v=6";
import { dist } from "./utils.js?v=6";

export const world = {
  width: 0,
  height: 0,
  respawnPoint: { x: 100, y: 100 },
  merchant: null,
  enemySpawns: [],
  blobSpawns: [],
  bossSpawn: null
};

let mapData = null;

export function setMapData(data, w, h) {
  mapData = data;
  world.width = w;
  world.height = h;
}

export function getPixel(x, y) {
  x = Math.floor(x); y = Math.floor(y);
  if (x < 0 || y < 0 || x >= world.width || y >= world.height) return [0, 0, 0];
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
  return false;
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

function pixelAt(data, w, x, y) {
  const i = (y * w + x) * 4;
  return [data[i], data[i + 1], data[i + 2]];
}

function pickClusterCenters(bins, gridSize, minCount, minDistance) {
  const sorted = Array.from(bins.entries()).sort((a, b) => b[1] - a[1]);
  const centers = [];
  for (const [key, count] of sorted) {
    if (count < minCount) break;
    const [gx, gy] = key.split(",").map(Number);
    const cx = gx * gridSize + gridSize / 2;
    const cy = gy * gridSize + gridSize / 2;
    let ok = true;
    for (const c of centers) {
      const dx = cx - c.x;
      const dy = cy - c.y;
      if (dx * dx + dy * dy < minDistance * minDistance) { ok = false; break; }
    }
    if (ok) centers.push({ x: cx, y: cy, count });
  }
  return centers;
}

export function scanPlacementMap(imgData, w, h) {
  const data = imgData.data;
  const GRID = 60;
  const stride = 4;

  const enemyBins = new Map();
  const bossBins = new Map();
  const blobBins = new Map();
  const merchBins = new Map();
  const playerBins = new Map();

  const playerScanW = Math.floor(w / 2);
  const playerScanH = Math.floor(h / 2);

  for (let y = 0; y < h; y += stride) {
    for (let x = 0; x < w; x += stride) {
      const p = pixelAt(data, w, x, y);
      let bin = null;
      if (COLOR.ENEMY(p))         bin = enemyBins;
      else if (COLOR.BOSS(p))     bin = bossBins;
      else if (COLOR.BLOB(p))     bin = blobBins;
      else if (COLOR.MERCHANT(p)) bin = merchBins;
      else if (x < playerScanW && y < playerScanH && COLOR.PLAYER(p)) bin = playerBins;
      if (bin) {
        const key = `${Math.floor(x / GRID)},${Math.floor(y / GRID)}`;
        bin.set(key, (bin.get(key) || 0) + 1);
      }
    }
  }

  const enemies  = pickClusterCenters(enemyBins,  GRID, 8,  350);
  const bossCands = pickClusterCenters(bossBins,  GRID, 60, 600);
  const blobs    = pickClusterCenters(blobBins,   GRID, 15, 300);
  const merchant = pickClusterCenters(merchBins,  GRID, 15, 500);
  const players  = pickClusterCenters(playerBins, GRID, 2,  400);

  world.enemySpawns = enemies.map(c => ({ x: c.x, y: c.y }));
  world.blobSpawns  = blobs.map(c   => ({ x: c.x, y: c.y }));

  // Boss = strongest unique signal far from any enemy (wizard hat tips can mimic the boss yellow).
  let boss = null;
  for (const c of bossCands) {
    const tooCloseToEnemy = enemies.some(e => {
      const dx = e.x - c.x, dy = e.y - c.y;
      return dx * dx + dy * dy < 350 * 350;
    });
    if (!tooCloseToEnemy) { boss = c; break; }
  }
  world.bossSpawn = boss ? { x: boss.x, y: boss.y } : null;

  // Merchant: drop any candidate inside the boss's room.
  let merch = null;
  for (const c of merchant) {
    if (boss) {
      const dx = c.x - boss.x, dy = c.y - boss.y;
      if (dx * dx + dy * dy < 900 * 900) continue;
    }
    merch = c; break;
  }
  world.merchant = merch ? { x: merch.x, y: merch.y } : null;

  // Player respawn: brightest cluster, biased toward upper-left if multiple.
  if (players.length > 0) {
    players.sort((a, b) => (a.x + a.y) - (b.x + b.y));
    world.respawnPoint = { x: players[0].x, y: players[0].y };
  }
}
