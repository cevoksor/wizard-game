export const ZOOM = 2.0;

export const BASE_SPEED = 220;
export const SPRINT_MULTIPLIER = 2;
export const PLAYER_SIZE = 18;
export const PLAYER_BASE_SCALE = 1.35;
export const PLAYER_HITBOX = 24;

export const RESPAWN_DELAY = 0.5;
export const ANIM_SPEED = 6;

export const MAX_HP = 3;

export const PLAYER_FIRE_COOLDOWN = 0.4;
export const PLAYER_PROJECTILE_SPEED = 500;

export const ENEMY_DRAW_SCALE = 1.6;
export const ENEMY_MAX_HP = 2;
export const ENEMY_HITBOX = 36;
export const ENEMY_FIRE_INTERVAL_MIN = 0.35;
export const ENEMY_FIRE_INTERVAL_MAX = 0.9;
export const ENEMY_AGGRO_RANGE = 800;
export const ENEMY_LOS_STEP = 8;
export const ENEMY_PROJECTILE_SPEED = 400;
export const ENEMY_BURST_COUNT = 1;
export const ENEMY_BURST_SPREAD = 0;

export const MERCHANT_DRAW_SCALE = 1.6;
export const MERCHANT_INTERACT_RANGE = 120;
export const MERCHANT_BUBBLE_RANGE = 300;
export const BUBBLE_DRAW_SCALE = 1.6;

export const COIN_PER_KILL = 10;

export const STAMINA_MAX = 100;
export const STAMINA_DRAIN = 50;
export const STAMINA_REGEN = 25;
export const STAMINA_MIN_TO_START = 10;

export const SHIELD_RADIUS = 130;
export const SHIELD_DRAW_SCALE = 1.0;
export const BLOB_KNOCKBACK_DISTANCE = 70;
export const SHIELD_BLOB_PUSH_BUFFER = 8;

export const BLOB_HP = 3;
export const BLOB_SPEED = 80;
export const BLOB_DRAW_SCALE = 1.3;
export const BLOB_HITBOX = 65;
export const BLOB_TARGET_REPICK = 3.0;
export const BLOB_TARGET_RADIUS = 600;
export const BLOB_COIN_REWARD = 15;
export const BLOB_SMOKE_INTERVAL = 1.5;

export const SMOKE_DRAW_SCALE = 1.2;
export const SMOKE_HITBOX = 55;
export const SMOKE_FRAME_DURATION = 0.5;
export const SMOKE_LIFETIME = 8.0;
export const SMOKE_FADE_OUT = 1.0;

export const PROJECTILE_W = 84;
export const PROJECTILE_H = 184;

export const COLOR = {
  RESPAWN:  rgb => rgb[0] > 180 && rgb[1] > 180 && rgb[2] < 100,
  ENEMY:    rgb => rgb[0] > 200 && rgb[1] < 50  && rgb[2] < 50,
  MERCHANT: rgb => rgb[0] > 200 && rgb[1] < 100 && rgb[2] > 200,
  GREEN:    rgb => rgb[1] > 140 && rgb[1] > rgb[0] && rgb[1] > rgb[2],
  WALL:     rgb => rgb[0] < 120 && rgb[1] < 120 && rgb[2] < 140 && (rgb[0] !== 0 || rgb[1] !== 0)
};
