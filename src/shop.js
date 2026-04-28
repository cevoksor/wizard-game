const ITEMS = [
  { id: "heal",     name: "Lektvar života",    cost: 15, desc: "Doplní HP na max" },
  { id: "fastfire", name: "Rychlejší výstřel", cost: 30, desc: "Sníží cooldown na polovinu" },
  { id: "shield",   name: "Magický štít",      cost: 50, desc: "Pohltí jeden zásah" }
];

let overlay, buyCb, closeCb;
let isOpen = false;

export function initShop({ onBuy, onClose }) {
  buyCb = onBuy;
  closeCb = onClose;

  overlay = document.createElement("div");
  overlay.id = "shop";
  overlay.innerHTML = `
    <div class="shop-box">
      <h2>Kupec</h2>
      <p>Co bys chtěl koupit, čaroději?</p>
      <ul>
        ${ITEMS.map(it => `
          <li data-id="${it.id}">
            <b>${it.name}</b> – ${it.desc}
            <span class="price">${it.cost} 💰</span>
          </li>`).join("")}
      </ul>
      <button id="shop-close">Odejít (Esc / E)</button>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelectorAll("li").forEach(li => {
    li.addEventListener("click", () => {
      const item = ITEMS.find(x => x.id === li.dataset.id);
      buyCb(item);
    });
  });
  overlay.querySelector("#shop-close").addEventListener("click", close);
}

export function open() {
  if (isOpen) return;
  isOpen = true;
  overlay.classList.add("visible");
}

export function close() {
  if (!isOpen) return;
  isOpen = false;
  overlay.classList.remove("visible");
  closeCb && closeCb();
}

export function isShopOpen() {
  return isOpen;
}
