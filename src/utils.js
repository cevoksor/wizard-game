export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function drawShadow(ctx, cx, cy, rx, ry, opacity = 0.35) {
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
