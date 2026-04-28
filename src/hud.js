let hpEl, coinsEl, deathsEl, enemiesEl, msgEl, winEl;
let msgTimer = null;

export function initHUD() {
  const hud = document.createElement("div");
  hud.id = "hud";
  hud.innerHTML = `
    <div class="hud-row">
      <span class="hud-label">HP</span><span id="hud-hp"></span>
      <span class="hud-sep"></span>
      <span class="hud-label">Mince:</span><span id="hud-coins">0</span>
      <span class="hud-sep"></span>
      <span class="hud-label">Smrtí:</span><span id="hud-deaths">0</span>
      <span class="hud-sep"></span>
      <span class="hud-label">Nepřátelé:</span><span id="hud-enemies">0</span>
    </div>
  `;
  document.body.appendChild(hud);

  msgEl = document.createElement("div");
  msgEl.id = "hud-msg";
  document.body.appendChild(msgEl);

  const ctrl = document.createElement("div");
  ctrl.id = "hud-controls";
  ctrl.textContent = "WASD pohyb · Shift sprint · LMB výstřel · E mluvit s kupcem · Esc zavřít menu";
  document.body.appendChild(ctrl);

  winEl = document.createElement("div");
  winEl.id = "win-screen";
  document.body.appendChild(winEl);

  hpEl = document.getElementById("hud-hp");
  coinsEl = document.getElementById("hud-coins");
  deathsEl = document.getElementById("hud-deaths");
  enemiesEl = document.getElementById("hud-enemies");
}

export function updateHP(current, max) {
  hpEl.textContent = "♥".repeat(Math.max(0, current)) + "♡".repeat(Math.max(0, max - current));
}
export function updateCoins(n)   { coinsEl.textContent = n; }
export function updateDeaths(n)  { deathsEl.textContent = n; }
export function updateEnemies(n) { enemiesEl.textContent = n; }

export function showMessage(text, durationMs = 2000) {
  msgEl.textContent = text;
  msgEl.classList.add("visible");
  if (msgTimer) clearTimeout(msgTimer);
  if (durationMs > 0) {
    msgTimer = setTimeout(() => msgEl.classList.remove("visible"), durationMs);
  }
}
export function hideMessage() {
  if (msgTimer) clearTimeout(msgTimer);
  msgEl.classList.remove("visible");
}

export function showWinScreen(deaths) {
  winEl.innerHTML = `VÍTĚZSTVÍ!<div class="sub">Porazil jsi všechny čaroděje. Smrtí: ${deaths}</div>`;
  winEl.classList.add("visible");
}
