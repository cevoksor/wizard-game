import {
  ENEMY_PROJECTILE_SPEED, PLAYER_PROJECTILE_SPEED,
  ZOOM, PROJECTILE_W, PROJECTILE_H, PLAYER_HITBOX, SHIELD_RADIUS
} from "../config.js?v=6";
import { isWallPoint } from "../world.js?v=6";
import { assets } from "../assets.js?v=6";
import { dist } from "../utils.js?v=6";

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

  update(dt, player, targets) {
    this.life += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (isWallPoint(this.x, this.y)) {
      this.alive = false;
      return;
    }

    if (this.owner === "enemy") {
      const dToPlayer = dist(this.x, this.y, player.x, player.y);
      if (player.shieldActive && dToPlayer < SHIELD_RADIUS) {
        this.alive = false;
        return;
      }
      if (!player.isHit && player.animState === "idle" && dToPlayer < PLAYER_HITBOX) {
        player.takeDamage();
        this.alive = false;
      }
    } else {
      for (const t of targets) {
        if (t.alive && dist(this.x, this.y, t.x, t.y) < t.hitbox) {
          t.takeDamage();
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
