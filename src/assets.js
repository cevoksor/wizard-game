const IMG_NAMES = {
  mapa: "mapa.png",
  mapa_vizual: "mapa_vizual.png",
  krok_a: "krok_a.png",
  krok_b: "krok_b.png",
  zasah: "zasah.png",
  carodej: "carodej.png",
  hul: "hul.png",
  strela: "strela.png",
  kupec: "kupec.png",
  bublina: "bublina.png",
  telo: "telo.png",
  nohy: "nohy.png"
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
