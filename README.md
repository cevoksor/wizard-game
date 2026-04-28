# Wizard Dungeon

Top-down 2D čaroděj v podzemí. Vanilla JavaScript + canvas, žádné dependencies.

## Spuštění

`<script type="module">` nefunguje přes `file://`, takže potřebuješ lokální HTTP server:

```bash
python3 -m http.server 8000
```

Pak otevři `http://localhost:8000`.

## Ovládání

- **WASD** / šipky — pohyb
- **Shift** — sprint
- **Levé tlačítko myši** — výstřel směrem na kurzor
- **E** — mluvit s kupcem (když jsi blízko)
- **Esc** — zavřít kupcovo menu

## Cíl

Poraz všechny čaroděje. Cestou sbírej mince a u kupce si nakup vylepšení.

## Struktura

```
index.html              entry, HUD/shop CSS
src/
  main.js               init + game loop, glue
  config.js             konstanty + barevné klíče mapy
  assets.js             loader obrázků
  audio.js              Web Audio sfx (syntézované)
  input.js              klávesy + myš
  world.js              mapa, kolize, line-of-sight
  hud.js                HP, mince, smrti, win screen
  shop.js               kupcovo menu
  utils.js
  entities/
    player.js
    enemy.js
    projectile.js
```

## Mapa

Kolize a spawn pointy se čtou z `mapa.png` podle barev jednotlivých pixelů:

| Barva    | Význam                       |
|----------|------------------------------|
| tmavá    | zeď                          |
| zelená   | teleport (vrátí na respawn)  |
| žlutá    | respawn point hráče          |
| červená  | spawn nepřítele              |
| fialová  | kupec                        |

`mapa_vizual.png` je vlastní vizuál a může vypadat jakkoli.
