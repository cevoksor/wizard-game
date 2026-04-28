import {
  ENEMY_PROJECTILE_SPEED, PLAYER_PROJECTILE_SPEED,
  ZOOM, PROJECTILE_W, PROJECTILE_H, PLAYER_HITBOX, ENEMY_HITBOX
} from "../config.js";
import { isWallPoint } from "../world.js";
import { assets } from "../assets.js";
import { dist } from "../utils.js";

export class Projectile {
  constructor(x, y, tx, ty, owner = "enemy") {
    this.x = x; this.y = y;
    const angle = Math.atan2(ty - y, tx - x);
    const speed = owner === "player" ? PLAYER_PROJECTILE_SPEED : ENEMY_PROJECTILE_SPEED;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.angle = angle + Math.PI / 2;
    this.alive = true;
    this.owner = owner;
    this.life = 0;
  }

  update(dt, player, enemies) {
    this.life += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (isWallPoint(this.x, this.y)) {
      this.alive = false;
      return;
    }

    if (this.owner === "enemy") {
      if (!player.isHit && player.animState === "idle"
          && dist(this.x, this.y, player.x, player.y) < PLAYER_HITBOX) {
        player.takeDamage();
        this.alive = false;
      }
    } else {
      for (const e of enemies) {
        if (e.alive && dist(this.x, this.y, e.x, e.y) < ENEMY_HITBOX) {
          e.takeDamage();
          this.alive = false;
          break;
        }
      }
    }

    if (this.life > 4) this.alive = false;
  }

  draw(canvas, ctx, camX, camY) {
    const sx = canvas.width / 2 + (this.x - camX) * ZOOM;
    const sy = canvas.height / 2 + (this.y - camY) * ZOOM;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.angle);
    if (this.owner === "player") ctx.filter = "hue-rotate(180deg) brightness(1.4)";
    ctx.drawImage(assets.strela, -PROJECTILE_W / 2, -PROJECTILE_H / 2, PROJECTILE_W, PROJECTILE_H);
    ctx.restore();
  }
}
