const IMG_NAMES = {
  mapa: "mapa 2 hráč.png",
  mapa_places: "mapa 2 místa.png",
  krok_a: "krok_a.png",
  krok_b: "krok_b.png",
  klobouk1: "klobouk1.png",
  klobouk2: "klobouk2.png",
  zasah: "zasah.png",
  boss_text: "boss text .png",
  carodej: "carodej.png",
  hul: "hul.png",
  strela: "strela.png",
  kupec: "kupec.png",
  bublina: "bublina.png",
  telo: "telo.png",
  nohy: "nohy.png",
  blob: "blob.png",
  boss: "boss.png",
  dym1: "dym1.png",
  dym2: "dym2.png",
  dym3: "dym3.png",
  shield: "shield.png"
};

export const assets = {};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Nelze načíst: " + src));
  });
}

export async function loadAllAssets() {
  const entries = Object.entries(IMG_NAMES);
  const loaded = await Promise.all(entries.map(([, src]) => loadImage(src)));
  entries.forEach(([key], i) => { assets[key] = loaded[i]; });
}
