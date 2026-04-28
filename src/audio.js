let ctx;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function beep({ freq = 440, duration = 0.1, type = "square", volume = 0.08, attack = 0.005, release = 0.05, freqEnd = null }) {
  const c = getCtx();
  const t = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd !== null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + duration);
  }
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + attack);
  gain.gain.linearRampToValueAtTime(0, t + duration + release);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + release + 0.02);
}

export const sfx = {
  shoot:    () => beep({ freq: 700, freqEnd: 250,  duration: 0.10, type: "sawtooth", volume: 0.05 }),
  hit:      () => beep({ freq: 220, freqEnd: 60,   duration: 0.22, type: "square",   volume: 0.10 }),
  enemyShot:() => beep({ freq: 320, freqEnd: 90,   duration: 0.16, type: "triangle", volume: 0.05 }),
  enemyDie: () => beep({ freq: 380, freqEnd: 50,   duration: 0.40, type: "sawtooth", volume: 0.09 }),
  teleport: () => beep({ freq: 100, freqEnd: 1400, duration: 0.32, type: "sine",     volume: 0.08 }),
  coin:     () => beep({ freq: 1200,freqEnd: 1800, duration: 0.07, type: "square",   volume: 0.06 }),
  buy:      () => { beep({ freq: 800, duration: 0.08, type: "square", volume: 0.06 });
                    setTimeout(() => beep({ freq: 1200, duration: 0.10, type: "square", volume: 0.06 }), 80); },
  deny:     () => beep({ freq: 180, freqEnd: 90,   duration: 0.20, type: "square",   volume: 0.07 }),
  win:      () => {
                    [0, 1, 2, 3].forEach(i => setTimeout(
                      () => beep({ freq: 400 + i * 200, duration: 0.18, type: "square", volume: 0.09 }),
                      i * 150));
                  }
};
