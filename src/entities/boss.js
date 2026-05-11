import {
  ZOOM, BOSS_MAX_HP, BOSS_DRAW_SCALE, BOSS_HITBOX,
  BOSS_FIRE_INTERVAL_MIN, BOSS_FIRE_INTERVAL_MAX,
  BOSS_AGGRO_RANGE, BOSS_SUMMON_INTERVAL, BOSS_SUMMON_CHARGE_TIME,
  BOSS_SUMMON_COUNT, BOSS_BURST_INTERVAL, BOSS_BURST_CHARGE_TIME,
  BOSS_BURST_COUNT, ENEMY_LOS_STEP
} from "../config.js?v=3";
import { hasLineOfSight } from "../world.js?v=3";
import { assets } from "../assets.js?v=3";
import { dist } from "../utils.js?v=3";
import { sfx } from "../audio.js?v=3";
import { Projectile } from "./projectile.js?v=3";
import { Blob } from "./blob.js?v=3";

function randomFireInterval() {
  return BOSS_FIRE_INTERVAL_MIN + Math.random() * (BOSS_FIRE_INTERVAL_MAX - BOSS_FIRE_INTERVAL_MIN);
}

export class Boss {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.hp = BOSS_MAX_HP;
    this.maxHp = BOSS_MAX_HP;
    this.alive = true;
    this.hitFlash = 0;
    this.hitbox = BOSS_HITBOX;
    this.bobTime = Math.random() * Math.PI * 2;

    this.fireTimer = Math.random() * BOSS_FIRE_INTERVAL_MAX;
    this.nextFireInterval = randomFireInterval();

    this.summonCooldown = BOSS_SUMMON_INTERVAL;
    this.burstCooldown = BOSS_BURST_INTERVAL + 2;
    this.specialState = "idle"; // "idle" | "summoning" | "bursting"
    this.specialTimer = 0;
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

  update(dt, player, projectiles, blobs) {
    if (!this.alive) return;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    this.bobTime += dt;
    if (player.isHit || player.animState !== "idle") return;

    const d = dist(this.x, this.y, player.x, player.y);
    if (d > BOSS_AGGRO_RANGE) return;

    if (this.specialState === "summoning") {
      this.specialTimer += dt;
      if (this.specialTimer >= BOSS_SUMMON_CHARGE_TIME) {
        for (let i = 0; i < BOSS_SUMMON_COUNT; i++) {
          const angle = (i / BOSS_SUMMON_COUNT) * Math.PI * 2 + Math.random() * 0.5;
          const r = 60;
          blobs.push(new Blob(this.x + Math.cos(angle) * r, this.y + Math.sin(angle) * r));
        }
        this.specialState = "idle";
        this.specialTimer = 0;
        this.summonCooldown = BOSS_SUMMON_INTERVAL;
      }
      return;
    }

    if (this.specialState === "bursting") {
      this.specialTimer += dt;
      if (this.specialTimer >= BOSS_BURST_CHARGE_TIME) {
        const offset = Math.random() * Math.PI * 2;
        for (let i = 0; i < BOSS_BURST_COUNT; i++) {
          const a = offset + (i / BOSS_BURST_COUNT) * Math.PI * 2;
          const tx = this.x + Math.cos(a) * 1000;
          const ty = this.y + Math.sin(a) * 1000;
          projectiles.push(new Projectile(this.x, this.y, tx, ty, "enemy"));
        }
        sfx.enemyShot();
        this.specialState = "idle";
        this.specialTimer = 0;
        this.burstCooldown = BOSS_BURST_INTERVAL;
      }
      return;
    }

    this.summonCooldown -= dt;
    this.burstCooldown -= dt;
    if (this.burstCooldown <= 0) {
      this.specialState = "bursting";
      this.specialTimer = 0;
      return;
    }
    if (this.summonCooldown <= 0) {
      this.specialState = "summoning";
      this.specialTimer = 0;
      return;
    }

    if (!hasLineOfSight(this.x, this.y, player.x, player.y, ENEMY_LOS_STEP)) return;

    this.fireTimer += dt;
    if (this.fireTimer >= this.nextFireInterval) {
      this.fireTimer = 0;
      this.nextFireInterval = randomFireInterval();
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      const tx = this.x + Math.cos(angle) * 1000;
      const ty = this.y + Math.sin(angle) * 1000;
      projectiles.push(new Projectile(this.x, this.y, tx, ty, "enemy"));
      sfx.enemyShot();
    }
  }

  draw(canvas, ctx, camX, camY) {
    if (!this.alive) return;
    const sx = canvas.width / 2 + (this.x - camX) * ZOOM;
    const sy = canvas.height / 2 + (this.y - camY) * ZOOM + Math.sin(this.bobTime * 2) * 6;

    ctx.save();
    ctx.translate(sx, sy);
    if (this.specialState === "summoning") {
      const pulse = 0.5 + 0.5 * Math.sin(this.specialTimer * 18);
      ctx.filter = `brightness(${1 + pulse * 0.7}) saturate(1.4)`;
    } else if (this.specialState === "bursting") {
      const pulse = 0.5 + 0.5 * Math.sin(this.specialTimer * 22);
      ctx.filter = `brightness(${1 + pulse * 0.8}) hue-rotate(${pulse * 40}deg)`;
    } else if (this.hitFlash > 0) {
      ctx.filter = "brightness(2.5) saturate(0)";
    }
    const w = assets.boss.width * BOSS_DRAW_SCALE;
    const h = assets.boss.height * BOSS_DRAW_SCALE;
    ctx.drawImage(assets.boss, -w / 2, -h / 2, w, h);
    ctx.restore();

    const barW = 180;
    const barH = 14;
    const bx = sx - barW / 2;
    const by = sy - assets.boss.height * BOSS_DRAW_SCALE / 2 - 24;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(bx - 2, by - 2, barW + 4, barH + 4);
    ctx.fillStyle = "#4a0a0a";
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = "#ff3344";
    ctx.fillRect(bx, by, barW * Math.max(0, this.hp / this.maxHp), barH);
    ctx.restore();
  }
}
