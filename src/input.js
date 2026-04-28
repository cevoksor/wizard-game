export const keys = {};
export const mouse = { x: 0, y: 0, down: false, rightDown: false };

window.addEventListener("keydown", e => { keys[e.key.toLowerCase()] = true; });
window.addEventListener("keyup",   e => { keys[e.key.toLowerCase()] = false; });
window.addEventListener("blur",    () => {
  for (const k in keys) keys[k] = false;
  mouse.down = false;
  mouse.rightDown = false;
});

window.addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener("mousedown", e => {
  if (e.button === 0) mouse.down = true;
  if (e.button === 2) mouse.rightDown = true;
});
window.addEventListener("mouseup", e => {
  if (e.button === 0) mouse.down = false;
  if (e.button === 2) mouse.rightDown = false;
});
window.addEventListener("contextmenu", e => e.preventDefault());
