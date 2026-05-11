import {
  ZOOM, COIN_PER_KILL, MERCHANT_INTERACT_RANGE, MERCHANT_BUBBLE_RANGE,
  MERCHANT_DRAW_SCALE, BUBBLE_DRAW_SCALE, BLOB_COIN_REWARD,
  PLAYER_HITBOX, SHIELD_RADIUS, BLOB_KNOCKBACK_DISTANCE,
  SHIELD_BLOB_PUSH_BUFFER, BOSS_COIN_REWARD,
  BOSS_ROOM_TRIGGER_RANGE, CINEMATIC_PAN_TIME, CINEMATIC_HOLD_TIME, CINEMATIC_RETURN_TIME,
  BOSS_DRAW_SCALE
} from "./config.js?v=6";
import { assets, loadAllAssets } from "./assets.js?v=6";
import { keys, mouse } from "./input.js?v=6";
import { world, setMapData, scanPlacementMap } from "./world.js?v=6";
import { Player } from "./entities/player.js?v=6";
import { Enemy } from "./entities/enemy.js?v=6";
import { Blob } from "./entities/blob.js?v=6";
import { Smoke } from "./entities/smoke.js?v=6";
import { Projectile } from "./entities/projectile.js?v=6";
import { Boss } from "./entities/boss.js?v=6";
import {
  initHUD, updateHP, updateCoins, updateDeaths, updateEnemies,
  updateStamina, showMessage, hideMessage, showWinScreen
} from "./hud.js?v=6";
import * as Shop from "./shop.js?v=6";
import { sfx } from "./audio.js?v=6";
import { dist } from "./utils.js?v=6";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const loadingEl = document.getElementById("loading");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let player;
let enemies = [];
let blobs = [];
let smokes = [];
let projectiles = [];
let boss = null;
let coins = 0;
let deaths = 0;
let gameWon = false;

let ePressedLast = false;
let escPressedLast = false;
let merchantPromptShown = false;

const cinematic = { state: "idle", timer: 0, played: false };
const camera = { x: 0, y: 0 };

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function buyItem(item) {
  if (coins < item.cost) {
    showMessage("Nemáš dost mincí!");
    sfx.deny();
    return;
  }
  coins -= item.cost;
  updateCoins(coins);
  if (item.id === "fastfire") player.speedUpFire();
  if (item.id === "hat")      player.addHat();
  showMessage("Koupeno: " + item.name);
  sfx.buy();
}

function aimDirection() {
  const dx = mouse.x - canvas.width / 2;
  const dy = mouse.y - canvas.height / 2;
  return { dx, dy };
}

const playerHooks = {
  onTeleport: () => { projectiles = []; },
  onDeath: () => {
    deaths++;
    updateDeaths(deaths);
    projectiles = [];
  }
};

function updateCinematic(dt) {
  if (cinematic.state === "idle") return false;
  cinematic.timer += dt;
  if (cinematic.state === "pan-in" && cinematic.timer >= CINEMATIC_PAN_TIME) {
    cinematic.state = "hold";
    cinematic.timer = 0;
  } else if (cinematic.state === "hold" && cinematic.timer >= CINEMATIC_HOLD_TIME) {
    cinematic.state = "pan-out";
    cinematic.timer = 0;
  } else if (cinematic.state === "pan-out" && cinematic.timer >= CINEMATIC_RETURN_TIME) {
    cinematic.state = "idle";
    cinematic.timer = 0;
  }
  return true;
}

function maybeStartBossCinematic() {
  if (cinematic.played || !boss || !boss.alive) return;
  if (dist(player.x, player.y, boss.x, boss.y) < BOSS_ROOM_TRIGGER_RANGE) {
    cinematic.played = true;
    cinematic.state = "pan-in";
    cinematic.timer = 0;
  }
}

function update(dt) {
  if (gameWon) return;

  if (cinematic.state !== "idle") {
    updateCinematic(dt);
    return;
  }
  maybeStartBossCinematic();
  if (cinematic.state !== "idle") return;

  const ePressed = !!keys["e"];
  const escPressed = !!keys["escape"];

  if (escPressed && !escPressedLast && Shop.isShopOpen()) Shop.close();
  escPressedLast = escPressed;

  if (ePressed && !ePressedLast) {
    if (Shop.isShopOpen()) {
      Shop.close();
    } else if (world.merchant
        && dist(player.x, player.y, world.merchant.x, world.merchant.y) < MERCHANT_INTERACT_RANGE) {
      Shop.open();
    }
  }
  ePressedLast = ePressed;

  if (Shop.isShopOpen()) return;

  player.update(dt, playerHooks);
  updateHP(player.hp, player.maxHp, player.hasHat);
  updateStamina(player.stamina, player.maxStamina);

  if (player.shieldActive) {
    for (const b of blobs) {
      if (!b.alive) continue;
      const d = dist(player.x, player.y, b.x, b.y);
      const minDist = SHIELD_RADIUS + b.hitbox;
      if (d < minDist) {
        const angle = d > 0.001
          ? Math.atan2(b.y - player.y, b.x - player.x)
          : Math.random() * Math.PI * 2;
        const push = minDist - d + SHIELD_BLOB_PUSH_BUFFER;
        b.x += Math.cos(angle) * push;
        b.y += Math.sin(angle) * push;
        b.pickNewTarget();
        b.targetTimer = 0;
      }
    }
    for (const s of smokes) {
      if (s.alive && dist(player.x, player.y, s.x, s.y) < SHIELD_RADIUS + s.hitbox) {
        s.alive = false;
      }
    }
  }

  if (mouse.down && player.canFire()) {
    const { dx, dy } = aimDirection();
    if (dx !== 0 || dy !== 0) {
      projectiles.push(new Projectile(player.x, player.y, player.x + dx, player.y + dy, "player"));
      player.fire();
    }
  }

  enemies.forEach(e => e.update(dt, player, projectiles));
  if (boss && boss.alive) boss.update(dt, player, projectiles, blobs);
  blobs.forEach(b => b.update(dt, smokes));
  smokes.forEach(s => s.update(dt));
  smokes = smokes.filter(s => s.alive);
  projectiles = projectiles.filter(p => p.alive);
  const damageables = enemies.concat(blobs).concat(smokes);
  if (boss && boss.alive) damageables.push(boss);
  projectiles.forEach(p => p.update(dt, player, damageables));

  if (!player.isHit && player.animState === "idle" && !player.shieldActive) {
    for (const s of smokes) {
      if (s.alive && dist(player.x, player.y, s.x, s.y) < s.hitbox) {
        s.alive = false;
        player.takeDamage();
        break;
      }
    }
  }

  if (!player.isHit && player.animState === "idle" && !player.shieldActive) {
    for (const b of blobs) {
      if (!b.alive) continue;
      if (dist(player.x, player.y, b.x, b.y) < PLAYER_HITBOX + b.hitbox) {
        const angle = Math.atan2(player.y - b.y, player.x - b.x);
        player.knockback(angle, BLOB_KNOCKBACK_DISTANCE);
        player.takeDamage();
        break;
      }
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    if (!enemies[i].alive) {
      coins += COIN_PER_KILL;
      sfx.coin();
      enemies.splice(i, 1);
    }
  }
  for (let i = blobs.length - 1; i >= 0; i--) {
    if (!blobs[i].alive) {
      coins += BLOB_COIN_REWARD;
      sfx.coin();
      blobs.splice(i, 1);
    }
  }
  if (boss && !boss.alive && !gameWon) {
    coins += BOSS_COIN_REWARD;
    sfx.coin();
    gameWon = true;
    showWinScreen(deaths);
    sfx.win();
  }
  updateCoins(coins);
  updateEnemies((boss && boss.alive ? 1 : 0) + enemies.length);

  if (world.merchant) {
    const inRange = dist(player.x, player.y, world.merchant.x, world.merchant.y) < MERCHANT_INTERACT_RANGE;
    if (inRange && !merchantPromptShown) {
      showMessage("Stiskni E pro obchod", 1500);
      merchantPromptShown = true;
    } else if (!inRange) {
      merchantPromptShown = false;
    }
  }
}

function computeCamera() {
  if (!boss || cinematic.state === "idle") {
    camera.x = player.x;
    camera.y = player.y;
    return;
  }
  if (cinematic.state === "pan-in") {
    const t = easeInOut(Math.min(1, cinematic.timer / CINEMATIC_PAN_TIME));
    camera.x = player.x + (boss.x - player.x) * t;
    camera.y = player.y + (boss.y - player.y) * t;
  } else if (cinematic.state === "hold") {
    camera.x = boss.x;
    camera.y = boss.y;
  } else {
    const t = easeInOut(Math.min(1, cinematic.timer / CINEMATIC_RETURN_TIME));
    camera.x = boss.x + (player.x - boss.x) * t;
    camera.y = boss.y + (player.y - boss.y) * t;
  }
}

function render() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  computeCamera();
  const camX = camera.x;
  const camY = camera.y;
  const mx = canvas.width / 2 - camX * ZOOM;
  const my = canvas.height / 2 - camY * ZOOM;
  ctx.drawImage(assets.mapa, mx, my, world.width * ZOOM, world.height * ZOOM);

  if (world.merchant) {
    const msx = canvas.width / 2 + (world.merchant.x - camX) * ZOOM;
    const msy = canvas.height / 2 + (world.merchant.y - camY) * ZOOM;
    const mScale = MERCHANT_DRAW_SCALE;
    const mW = assets.kupec.width * mScale;
    const mH = assets.kupec.height * mScale;
    ctx.drawImage(assets.kupec, msx - mW / 2, msy - mH / 1.1, mW, mH);

    if (dist(player.x, player.y, world.merchant.x, world.merchant.y) < MERCHANT_BUBBLE_RANGE) {
      const bScale = BUBBLE_DRAW_SCALE;
      const bW = assets.bublina.width * bScale;
      const bH = assets.bublina.height * bScale;
      ctx.drawImage(assets.bublina, msx - bW / 2, msy - mH - bH + 20, bW, bH);
    }
  }

  smokes.forEach(s => s.draw(canvas, ctx, camX, camY));
  enemies.forEach(e => e.draw(canvas, ctx, camX, camY));
  blobs.forEach(b => b.draw(canvas, ctx, camX, camY));
  if (boss) boss.draw(canvas, ctx, camX, camY);
  projectiles.forEach(p => p.draw(canvas, ctx, camX, camY));

  if (cinematic.state === "idle") {
    player.draw(canvas, ctx);
  } else {
    drawPlayerAtWorld(player.x, player.y, camX, camY);
  }

  if (boss && (cinematic.state === "pan-in" || cinematic.state === "hold")) {
    const bsx = canvas.width / 2 + (boss.x - camX) * ZOOM;
    const bsy = canvas.height / 2 + (boss.y - camY) * ZOOM;
    const bossH = assets.boss.height * BOSS_DRAW_SCALE;
    let alpha = 1;
    if (cinematic.state === "pan-in") {
      alpha = Math.min(1, cinematic.timer / (CINEMATIC_PAN_TIME * 0.6));
    }
    const tScale = 1.6;
    const tW = assets.boss_text.width * tScale;
    const tH = assets.boss_text.height * tScale;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(assets.boss_text, bsx - tW / 2, bsy - bossH / 2 - tH - 10, tW, tH);
    ctx.restore();
  }
}

function drawPlayerAtWorld(wx, wy, camX, camY) {
  const sx = canvas.width / 2 + (wx - camX) * ZOOM;
  const sy = canvas.height / 2 + (wy - camY) * ZOOM;
  const img = player.hasHat ? assets.klobouk1 : assets.krok_a;
  const w = img.width * 1.35;
  const h = img.height * 1.35;
  ctx.drawImage(img, sx - w / 2, sy - h / 2, w, h);
}


let last = null;
function loop(t) {
  const dt = last === null ? 0 : Math.min((t - last) / 1000, 0.1);
  last = t;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function imageToData(img) {
  const off = document.createElement("canvas");
  off.width = img.width;
  off.height = img.height;
  const c = off.getContext("2d");
  c.drawImage(img, 0, 0);
  return c.getImageData(0, 0, img.width, img.height);
}

async function init() {
  try {
    await loadAllAssets();

    setMapData(imageToData(assets.mapa), assets.mapa.width, assets.mapa.height);
    scanPlacementMap(imageToData(assets.mapa_places), assets.mapa_places.width, assets.mapa_places.height);

    enemies = world.enemySpawns.map(s => new Enemy(s.x, s.y));
    blobs = world.blobSpawns.map(s => new Blob(s.x, s.y));
    boss = world.bossSpawn ? new Boss(world.bossSpawn.x, world.bossSpawn.y) : null;
    player = new Player(world.respawnPoint.x, world.respawnPoint.y);

    initHUD();
    Shop.initShop({ onBuy: buyItem, onClose: () => hideMessage() });
    updateHP(player.hp, player.maxHp, player.hasHat);
    updateCoins(coins);
    updateDeaths(deaths);
    updateEnemies(enemies.length + (boss ? 1 : 0));

    loadingEl.style.display = "none";
    requestAnimationFrame(loop);
  } catch (e) {
    loadingEl.innerHTML = "CHYBA: " + e.message;
    console.error(e);
  }
}

init();
