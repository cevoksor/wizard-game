import { keys, mouse } from "../input.js";
import {
  BASE_SPEED, SPRINT_MULTIPLIER, RESPAWN_DELAY, ANIM_SPEED,
  PLAYER_BASE_SCALE, MAX_HP, PLAYER_FIRE_COOLDOWN,
  STAMINA_MAX, STAMINA_DRAIN, STAMINA_REGEN, STAMINA_MIN_TO_START,
  SHIELD_RADIUS, SHIELD_DRAW_SCALE, ZOOM
} from "../config.js";
import { isWall, isGreen, world } from "../world.js";
import { assets } from "../assets.js";
import { sfx } from "../audio.js";

export class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.walkTime = 0;
    this.moving = false;
    this.isHit = false;
    this.hitTimer = 0;
    this.isSprinting = false;
    this.scale = 1.0;
    this.animState = "idle";
    this.hp = MAX_HP;
    this.maxHp = MAX_HP;
    this.fireCooldown = 0;
    this.fireRate = PLAYER_FIRE_COOLDOWN;
    this.shieldCharges = 0;
    this.stamina = STAMINA_MAX;
    this.maxStamina = STAMINA_MAX;
    this.shieldActive = false;
  }

  takeDamage() {
    if (this.shieldCharges > 0) {
      this.shieldCharges--;
      sfx.hit();
      return;
    }
    this.hp--;
    sfx.hit();
    this.isHit = true;
    this.hitTimer = 0;
    if (this.hp <= 0) {
      this.hp = this.maxHp;
      this._diedThisRespawn = true;
    }
  }

  knockback(angle, distance) {
    const nx = this.x + Math.cos(angle) * distance;
    const ny = this.y + Math.sin(angle) * distance;
    if (!isWall(nx, this.y)) this.x = nx;
    if (!isWall(this.x, ny)) this.y = ny;
  }

  heal()         { this.hp = this.maxHp; }
  addShield()    { this.shieldCharges = 1; }
  speedUpFire()  { this.fireRate = Math.max(0.1, this.fireRate * 0.5); }

  canFire() {
    return this.fireCooldown <= 0 && !this.isHit && this.animState === "idle" && !this.shieldActive;
  }
  fire() {
    this.fireCooldown = this.fireRate;
    sfx.shoot();
  }

  update(dt, hooks) {
    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    if (this.animState === "shrinking") {
      this.shieldActive = false;
      this.scale -= dt * ANIM_SPEED;
      if (this.scale <= 0) {
        this.scale = 0;
        this.x = world.respawnPoint.x;
        this.y = world.respawnPoint.y;
        this.animState = "growing";
        hooks.onTeleport && hooks.onTeleport();
      }
      return;
    }
    if (this.animState === "growing") {
      this.scale += dt * ANIM_SPEED;
      if (this.scale >= 1.0) {
        this.scale = 1.0;
        this.animState = "idle";
      }
      return;
    }

    if (this.isHit) {
      this.shieldActive = false;
      this.hitTimer += dt;
      if (this.hitTimer >= RESPAWN_DELAY) {
        this.isHit = false;
        this.hitTimer = 0;
        this.scale = 1.0;
        this.animState = "idle";
        if (this._diedThisRespawn) {
          this.x = world.respawnPoint.x;
          this.y = world.respawnPoint.y;
          this._diedThisRespawn = false;
          hooks.onDeath && hooks.onDeath();
        }
      }
      return;
    }

    this.shieldActive = !!mouse.rightDown;

    let dx = 0, dy = 0;
    if (keys["w"] || keys["arrowup"])    dy--;
    if (keys["s"] || keys["arrowdown"])  dy++;
    if (keys["a"] || keys["arrowleft"])  dx--;
    if (keys["d"] || keys["arrowright"]) dx++;
    const moving = !!(dx || dy);

    const wantSprint = !!keys["shift"] && !this.shieldActive;
    if (wantSprint && moving && (this.isSprinting ? this.stamina > 0 : this.stamina > STAMINA_MIN_TO_START)) {
      this.isSprinting = true;
    } else {
      this.isSprinting = false;
    }

    if (this.isSprinting) {
      this.stamina = Math.max(0, this.stamina - STAMINA_DRAIN * dt);
      if (this.stamina <= 0) this.isSprinting = false;
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + STAMINA_REGEN * dt);
    }

    const baseSpeed = this.shieldActive ? BASE_SPEED * 0.55 : BASE_SPEED;
    const speed = this.isSprinting ? baseSpeed * SPRINT_MULTIPLIER : baseSpeed;

    if (moving) {
      const len = Math.hypot(dx, dy);
      dx /= len; dy /= len;
      this.moving = true;
      this.walkTime += this.isSprinting ? dt * 2 : dt;
    } else {
      this.moving = false;
    }

    if (isGreen(this.x, this.y) && this.animState === "idle") {
      this.animState = "shrinking";
      sfx.teleport();
      return;
    }

    const nextX = this.x + dx * speed * dt;
    const nextY = this.y + dy * speed * dt;
    if (!isWall(nextX, this.y)) this.x = nextX;
    if (!isWall(this.x, nextY)) this.y = nextY;
  }

  draw(canvas, ctx) {
    const sx = canvas.width / 2;
    const sy = canvas.height / 2;
    const currentScale = PLAYER_BASE_SCALE * this.scale;

    let img;
    if (this.isHit) {
      img = assets.zasah;
    } else if (this.moving && Math.floor(this.walkTime * 5) % 2 === 0) {
      img = assets.krok_b;
    } else {
      img = assets.krok_a;
    }

    const w = img.width * currentScale;
    const h = img.height * currentScale;
    ctx.drawImage(img, sx - w / 2, sy - h / 2, w, h);

    if (this.shieldCharges > 0 && this.animState === "idle" && !this.shieldActive) {
      ctx.save();
      ctx.strokeStyle = "rgba(120, 200, 255, 0.6)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(w, h) * 0.45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.shieldActive) {
      const radius = SHIELD_RADIUS * ZOOM * SHIELD_DRAW_SCALE;
      const bw = radius * 2;
      const bh = radius * 2;
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.drawImage(assets.bublina, sx - bw / 2, sy - bh / 2, bw, bh);
      ctx.restore();
    }
  }
}
