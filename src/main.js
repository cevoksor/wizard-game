import {
  ZOOM, COIN_PER_KILL, MERCHANT_INTERACT_RANGE, MERCHANT_BUBBLE_RANGE,
  MERCHANT_DRAW_SCALE, BUBBLE_DRAW_SCALE, BLOB_COIN_REWARD,
  PLAYER_HITBOX, SHIELD_RADIUS, BLOB_KNOCKBACK_DISTANCE,
  SHIELD_BLOB_PUSH_BUFFER
} from "./config.js";
import { assets, loadAllAssets } from "./assets.js";
import { keys, mouse } from "./input.js";
import { world, setMapData, scanMap } from "./world.js";
import { Player } from "./entities/player.js";
import { Enemy } from "./entities/enemy.js";
import { Blob } from "./entities/blob.js";
import { Smoke } from "./entities/smoke.js";
import { Projectile } from "./entities/projectile.js";
import {
  initHUD, updateHP, updateCoins, updateDeaths, updateEnemies,
  updateStamina, showMessage, hideMessage, showWinScreen
} from "./hud.js";
import * as Shop from "./shop.js";
import { sfx } from "./audio.js";
import { dist } from "./utils.js";

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
let coins = 0;
let deaths = 0;
let gameWon = false;

let ePressedLast = false;
let escPressedLast = false;
let merchantPromptShown = false;

function buyItem(item) {
  if (coins < item.cost) {
    showMessage("Nemáš dost mincí!");
    sfx.deny();
    return;
  }
  coins -= item.cost;
  updateCoins(coins);
  if (item.id === "heal")     player.heal();
  if (item.id === "fastfire") player.speedUpFire();
  if (item.id === "shield")   player.addShield();
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

function update(dt) {
  if (gameWon) return;

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
  updateHP(player.hp, player.maxHp);
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
  blobs.forEach(b => b.update(dt, smokes));
  smokes.forEach(s => s.update(dt));
  smokes = smokes.filter(s => s.alive);
  projectiles = projectiles.filter(p => p.alive);
  const damageables = enemies.concat(blobs).concat(smokes);
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
  updateCoins(coins);
  updateEnemies(enemies.length);

  if (world.merchant) {
    const inRange = dist(player.x, player.y, world.merchant.x, world.merchant.y) < MERCHANT_INTERACT_RANGE;
    if (inRange && !merchantPromptShown) {
      showMessage("Stiskni E pro obchod", 1500);
      merchantPromptShown = true;
    } else if (!inRange) {
      merchantPromptShown = false;
    }
  }

  if (enemies.length === 0 && !gameWon) {
    gameWon = true;
    showWinScreen(deaths);
    sfx.win();
  }
}

function render() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const camX = player.x;
  const camY = player.y;
  const mx = canvas.width / 2 - camX * ZOOM;
  const my = canvas.height / 2 - camY * ZOOM;
  ctx.drawImage(assets.mapa_vizual, mx, my, world.width * ZOOM, world.height * ZOOM);

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
  projectiles.forEach(p => p.draw(canvas, ctx, camX, camY));
  player.draw(canvas, ctx);
}


let last = null;
function loop(t) {
  const dt = last === null ? 0 : Math.min((t - last) / 1000, 0.1);
  last = t;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

async function init() {
  try {
    await loadAllAssets();

    const off = document.createElement("canvas");
    off.width = assets.mapa.width;
    off.height = assets.mapa.height;
    const offCtx = off.getContext("2d");
    offCtx.drawImage(assets.mapa, 0, 0);
    setMapData(
      offCtx.getImageData(0, 0, assets.mapa.width, assets.mapa.height),
      assets.mapa.width,
      assets.mapa.height
    );

    scanMap();
    enemies = world.enemySpawns.map(s => new Enemy(s.x, s.y));
    blobs = world.enemySpawns.map(s => new Blob(s.x, s.y));
    player = new Player(world.respawnPoint.x, world.respawnPoint.y);

    initHUD();
    Shop.initShop({ onBuy: buyItem, onClose: () => hideMessage() });
    updateHP(player.hp, player.maxHp);
    updateCoins(coins);
    updateDeaths(deaths);
    updateEnemies(enemies.length);

    loadingEl.style.display = "none";
    requestAnimationFrame(loop);
  } catch (e) {
    loadingEl.innerHTML = "CHYBA: " + e.message;
    console.error(e);
  }
}

init();
