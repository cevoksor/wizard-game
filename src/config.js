export const ZOOM = 3.5;

export const BASE_SPEED = 220;
export const SPRINT_MULTIPLIER = 2;
export const PLAYER_SIZE = 18;
export const PLAYER_BASE_SCALE = 3.0;
export const PLAYER_HITBOX = 24;

export const RESPAWN_DELAY = 0.5;
export const ANIM_SPEED = 6;

export const MAX_HP = 3;

export const PLAYER_FIRE_COOLDOWN = 0.4;
export const PLAYER_PROJECTILE_SPEED = 500;

export const ENEMY_DRAW_SCALE = 3.0;
export const ENEMY_MAX_HP = 2;
export const ENEMY_HITBOX = 32;
export const ENEMY_FIRE_INTERVAL = 3.0;
export const ENEMY_AGGRO_RANGE = 600;
export const ENEMY_LOS_STEP = 8;
export const ENEMY_PROJECTILE_SPEED = 350;

export const MERCHANT_DRAW_SCALE = 3.0;
export const MERCHANT_INTERACT_RANGE = 120;
export const MERCHANT_BUBBLE_RANGE = 300;
export const BUBBLE_DRAW_SCALE = 3.0;

export const COIN_PER_KILL = 10;

export const BLOB_COUNT = 4;
export const BLOB_HP = 3;
export const BLOB_SPEED = 80;
export const BLOB_DRAW_SCALE = 1.2;
export const BLOB_HITBOX = 50;
export const BLOB_TARGET_REPICK = 3.0;
export const BLOB_TARGET_RADIUS = 600;
export const BLOB_COIN_REWARD = 15;

export const PROJECTILE_W = 150;
export const PROJECTILE_H = 330;

export const COLOR = {
  RESPAWN:  rgb => rgb[0] > 180 && rgb[1] > 180 && rgb[2] < 100,
  ENEMY:    rgb => rgb[0] > 200 && rgb[1] < 50  && rgb[2] < 50,
  MERCHANT: rgb => rgb[0] > 200 && rgb[1] < 100 && rgb[2] > 200,
  GREEN:    rgb => rgb[1] > 140 && rgb[1] > rgb[0] && rgb[1] > rgb[2],
  WALL:     rgb => rgb[0] < 120 && rgb[1] < 120 && rgb[2] < 140 && (rgb[0] !== 0 || rgb[1] !== 0)
};
