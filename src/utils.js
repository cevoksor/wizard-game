export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
