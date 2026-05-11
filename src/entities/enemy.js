import {
  ENEMY_DRAW_SCALE, ENEMY_FIRE_INTERVAL_MIN, ENEMY_FIRE_INTERVAL_MAX,
  ENEMY_AGGRO_RANGE, ENEMY_LOS_STEP, ENEMY_MAX_HP, ENEMY_HITBOX, ZOOM,
  ENEMY_BURST_COUNT, ENEMY_BURST_SPREAD,
  ENEMY_RADIAL_INTERVAL_MIN, ENEMY_RADIAL_INTERVAL_MAX,
  ENEMY_RADIAL_CHARGE_TIME, ENEMY_RADIAL_COUNT
} from "../config.js?v=6";
import { hasLineOfSight } from "../world.js?v=6";
import { assets } from "../assets.js?v=6";
import { dist } from "../utils.js?v=6";
import { sfx } from "../audio.js?v=6";
import { Projectile } from "./projectile.js?v=6";

function randomInterval() {
  return ENEMY_FIRE_INTERVAL_MIN + Math.random() * (ENEMY_FIRE_INTERVAL_MAX - ENEMY_FIRE_INTERVAL_MIN);
}

function randomRadialCooldown() {
  return ENEMY_RADIAL_INTERVAL_MIN + Math.random() * (ENEMY_RADIAL_INTERVAL_MAX - ENEMY_RADIAL_INTERVAL_MIN);
}

export class Enemy {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.nextInterval = randomInterval();
    this.timer = Math.random() * this.nextInterval;
    this.hp = ENEMY_MAX_HP;
    this.alive = true;
    this.hitFlash = 0;
    this.hitbox = ENEMY_HITBOX;
    this.radialCooldown = randomRadialCooldown();
    this.radialState = "idle"; // "idle" | "charging"
    this.radialTimer = 0;
  }

  takeDamage() {
    this.hp--;
    this.hitFlash = 0.15;
    if (this.hp <= 0) {
      this.alive = false;
      sfx.enemyDie();
    } else {
      sfx.hit();
    }
  }

  update(dt, player, projectiles) {
    if (!this.alive) return;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (player.isHit || player.animState !== "idle") return;

    if (dist(this.x, this.y, player.x, player.y) > ENEMY_AGGRO_RANGE) return;

    if (this.radialState === "charging") {
      this.radialTimer += dt;
      if (this.radialTimer >= ENEMY_RADIAL_CHARGE_TIME) {
        const offset = Math.random() * Math.PI * 2;
        for (let i = 0; i < ENEMY_RADIAL_COUNT; i++) {
          const a = offset + (i / ENEMY_RADIAL_COUNT) * Math.PI * 2;
          const tx = this.x + Math.cos(a) * 1000;
          const ty = this.y + Math.sin(a) * 1000;
          projectiles.push(new Projectile(this.x, this.y, tx, ty, "enemy"));
        }
        sfx.enemyShot();
        this.radialState = "idle";
        this.radialTimer = 0;
        this.radialCooldown = randomRadialCooldown();
      }
      return;
    }

    if (!hasLineOfSight(this.x, this.y, player.x, player.y, ENEMY_LOS_STEP)) return;

    this.radialCooldown -= dt;
    if (this.radialCooldown <= 0) {
      this.radialState = "charging";
      this.radialTimer = 0;
      return;
    }

    this.timer += dt;
    if (this.timer >= this.nextInterval) {
      this.timer = 0;
      this.nextInterval = randomInterval();
      const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
      for (let i = 0; i < ENEMY_BURST_COUNT; i++) {
        const offset = ENEMY_BURST_COUNT === 1
          ? 0
          : (i / (ENEMY_BURST_COUNT - 1) - 0.5) * ENEMY_BURST_SPREAD;
        const a = baseAngle + offset;
        const tx = this.x + Math.cos(a) * 1000;
        const ty = this.y + Math.sin(a) * 1000;
        projectiles.push(new Projectile(this.x, this.y, tx, ty, "enemy"));
      }
      sfx.enemyShot();
    }
  }

  draw(canvas, ctx, camX, camY) {
    if (!this.alive) return;
    const sx = canvas.width / 2 + (this.x - camX) * ZOOM;
    const sy = canvas.height / 2 + (this.y - camY) * ZOOM;
    const scale = ENEMY_DRAW_SCALE;

    const eW = assets.carodej.width * scale;
    const eH = assets.carodej.height * scale;

    ctx.save();
    ctx.translate(sx, sy);
    if (this.radialState === "charging") {
      const pulse = 0.5 + 0.5 * Math.sin(this.radialTimer * 20);
      ctx.filter = `brightness(${1 + pulse * 0.8}) saturate(1.4) hue-rotate(${pulse * 30}deg)`;
    } else if (this.hitFlash > 0) {
      ctx.filter = "brightness(2.5) saturate(0)";
    }

    const hW = assets.hul.width * scale;
    const hH = assets.hul.height * scale;
    ctx.save();
    ctx.translate(-55 * scale, 5 * scale);
    ctx.rotate(Math.sin(Date.now() * 0.005) * 0.2);
    ctx.drawImage(assets.hul, -hW / 2, -hH / 1.2, hW, hH);
    ctx.restore();

    ctx.drawImage(assets.carodej, -eW / 2, -eH / 1.2, eW, eH);
    ctx.restore();
  }
}
