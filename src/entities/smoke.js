import {
  ZOOM, SMOKE_HITBOX, SMOKE_DRAW_SCALE,
  SMOKE_FRAME_DURATION, SMOKE_LIFETIME, SMOKE_FADE_OUT
} from "../config.js?v=3";
import { assets } from "../assets.js?v=3";

export class Smoke {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.alive = true;
    this.hitbox = SMOKE_HITBOX;
    this.frameIndex = Math.floor(Math.random() * 3);
    this.frameTimer = Math.random() * SMOKE_FRAME_DURATION;
    this.life = 0;
    this.appearScale = 0;
  }

  takeDamage() { this.alive = false; }

  update(dt) {
    if (!this.alive) return;
    this.life += dt;
    if (this.life >= SMOKE_LIFETIME) { this.alive = false; return; }

    this.frameTimer += dt;
    if (this.frameTimer >= SMOKE_FRAME_DURATION) {
      this.frameTimer -= SMOKE_FRAME_DURATION;
      this.frameIndex = (this.frameIndex + 1) % 3;
    }
    if (this.appearScale < 1) this.appearScale = Math.min(1, this.appearScale + dt * 4);
  }

  draw(canvas, ctx, camX, camY) {
    if (!this.alive) return;
    const sx = canvas.width / 2 + (this.x - camX) * ZOOM;
    const sy = canvas.height / 2 + (this.y - camY) * ZOOM;
    const img = [assets.dym1, assets.dym2, assets.dym3][this.frameIndex];
    const scale = SMOKE_DRAW_SCALE * this.appearScale;
    const w = img.width * scale;
    const h = img.height * scale;

    const remaining = SMOKE_LIFETIME - this.life;
    const fade = remaining < SMOKE_FADE_OUT ? Math.max(0, remaining / SMOKE_FADE_OUT) : 1;

    ctx.save();
    ctx.globalAlpha = 0.85 * fade;
    ctx.drawImage(img, sx - w / 2, sy - h / 2, w, h);
    ctx.restore();
  }
}
