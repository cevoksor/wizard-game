import {
  ZOOM, BLOB_HP, BLOB_SPEED, BLOB_DRAW_SCALE, BLOB_HITBOX,
  BLOB_TARGET_REPICK, BLOB_TARGET_RADIUS
} from "../config.js";
import { isWall } from "../world.js";
import { assets } from "../assets.js";
import { sfx } from "../audio.js";
import { dist } from "../utils.js";

export class Blob {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.hp = BLOB_HP;
    this.alive = true;
    this.hitFlash = 0;
    this.hitbox = BLOB_HITBOX;
    this.bobTime = Math.random() * Math.PI * 2;
    this.target = { x, y };
    this.targetTimer = 0;
    this.pickNewTarget();
  }

  pickNewTarget() {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 150 + Math.random() * BLOB_TARGET_RADIUS;
      const tx = this.x + Math.cos(angle) * radius;
      const ty = this.y + Math.sin(angle) * radius;
      if (!isWall(tx, ty)) {
        this.target = { x: tx, y: ty };
        return;
      }
    }
    this.target = { x: this.x, y: this.y };
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

  update(dt) {
    if (!this.alive) return;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    this.bobTime += dt;
    this.targetTimer += dt;

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const d = Math.hypot(dx, dy);

    if (d < 30 || this.targetTimer >= BLOB_TARGET_REPICK) {
      this.pickNewTarget();
      this.targetTimer = 0;
      return;
    }

    const nx = this.x + (dx / d) * BLOB_SPEED * dt;
    const ny = this.y + (dy / d) * BLOB_SPEED * dt;
    if (!isWall(nx, this.y)) this.x = nx;
    else { this.pickNewTarget(); this.targetTimer = 0; }
    if (!isWall(this.x, ny)) this.y = ny;
    else { this.pickNewTarget(); this.targetTimer = 0; }
  }

  draw(canvas, ctx, camX, camY) {
    if (!this.alive) return;
    const sx = canvas.width / 2 + (this.x - camX) * ZOOM;
    const sy = canvas.height / 2 + (this.y - camY) * ZOOM + Math.sin(this.bobTime * 3) * 8;

    ctx.save();
    ctx.translate(sx, sy);
    if (this.hitFlash > 0) ctx.filter = "brightness(2.5) saturate(0)";
    const w = assets.blob.width * BLOB_DRAW_SCALE;
    const h = assets.blob.height * BLOB_DRAW_SCALE;
    ctx.drawImage(assets.blob, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
}
