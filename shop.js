/* Plaster Palz — shop, cart & checkout */

/* Large flat plaques and 3D figures — sold as single kits.
   P&P is added at checkout. (Not VAT registered — no VAT is charged.) */
const PRODUCTS = {
  "ghost-pumpkin": { name: "Ghost Pumpkin", price: 12.99, image: "images/plaque-front.webp" },
  "black-cat": { name: "Black Cat", price: 12.99, image: "images/product-cat.webp" },
  "ghost": { name: "Ghost", price: 12.99, image: "images/product-ghost.webp" },
  "pumpkin-witch": { name: "Pumpkin Witch", price: 14.99, image: "images/product-pumpkin-witch.webp" },
  "christmas-tree": { name: "Christmas Tree", price: 12.99, image: "images/product-christmas-tree.webp" },
  "reindeer": { name: "Reindeer", price: 12.99, image: "images/product-reindeer.webp" },
  "unicorn": { name: "Unicorn", price: 14.99, image: "images/product-unicorn.webp" },
  "rainbow": { name: "Rainbow", price: 12.99, image: "images/product-rainbow.webp" },
  "frog": { name: "Frog", price: 12.99, image: "images/product-frog.webp" }
};

const P_AND_P = 4.95;

/* Small figures — sold only in packs of 3 or 5 */
const MINIS = {
  "bat": { name: "Bat", image: "images/mini-bat.webp" },
  "jack-o-lantern": { name: "Jack-o'-Lantern", image: "images/mini-jack-o-lantern.webp" },
  "skull": { name: "Skull", image: "images/mini-skull.webp" },
  "highland-cow": { name: "Highland Cow", image: "images/mini-highland-cow.webp" }
};

const PACK_PRICES = { 3: 9.99, 5: 14.99 };

const ORDER_EMAIL = "orders@plasterpalz.com";

/* ---------- Cart state ----------
   cart is a map: key -> entry
   single entry: { type:"single", id, qty }
   pack entry:   { type:"pack", size, contents:{miniId:count}, qty } */

let cart = {};

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem("palz-cart")) || {};
    // discard entries from older cart formats
    cart = {};
    for (const [key, entry] of Object.entries(raw)) {
      if (entry && entry.type === "single" && PRODUCTS[entry.id]) cart[key] = entry;
      else if (entry && entry.type === "pack" && PACK_PRICES[entry.size]) cart[key] = entry;
    }
  } catch { cart = {}; }
}

function saveCart() {
  localStorage.setItem("palz-cart", JSON.stringify(cart));
}

function entryPrice(entry) {
  return entry.type === "single" ? PRODUCTS[entry.id].price : PACK_PRICES[entry.size];
}

function entryName(entry) {
  if (entry.type === "single") return PRODUCTS[entry.id].name;
  return `Minis ${entry.size}-Pack`;
}

function entryDetail(entry) {
  if (entry.type === "single") return "full kit";
  return Object.entries(entry.contents)
    .map(([id, n]) => (n > 1 ? `${n}× ` : "") + MINIS[id].name)
    .join(", ");
}

function entryImage(entry) {
  if (entry.type === "single") return PRODUCTS[entry.id].image;
  const first = Object.keys(entry.contents)[0];
  return MINIS[first].image;
}

function cartCount() {
  return Object.values(cart).reduce((a, e) => a + e.qty, 0);
}

function cartSubtotal() {
  return Object.values(cart).reduce((sum, e) => sum + entryPrice(e) * e.qty, 0);
}

function cartTotal() {
  return cartSubtotal() + (cartCount() ? P_AND_P : 0);
}

/* ---------- Cart actions ---------- */

function bumpBasket() {
  const badge = document.getElementById("cart-count");
  const btn = document.getElementById("cart-button");
  [badge, btn].forEach(el => {
    el.classList.remove("bump");
    void el.offsetWidth; // restart animation
    el.classList.add("bump");
  });
}

function addToCart(id) {
  const key = "single:" + id;
  if (cart[key]) cart[key].qty += 1;
  else cart[key] = { type: "single", id, qty: 1 };
  saveCart();
  renderCart();
  bumpBasket();
  openCart();
}

function addPackToCart(size, contents) {
  const sig = Object.entries(contents).sort((a, b) => a[0].localeCompare(b[0]))
    .map(([id, n]) => `${id}=${n}`).join(",");
  const key = `pack:${size}:${sig}`;
  if (cart[key]) cart[key].qty += 1;
  else cart[key] = { type: "pack", size, contents, qty: 1 };
  saveCart();
  renderCart();
  bumpBasket();
  openCart();
}

function changeQty(key, delta) {
  if (!cart[key]) return;
  cart[key].qty += delta;
  if (cart[key].qty <= 0) delete cart[key];
  saveCart();
  renderCart();
}

function removeItem(key) {
  delete cart[key];
  saveCart();
  renderCart();
}

/* ---------- Cart rendering ---------- */

function renderCart() {
  const badge = document.getElementById("cart-count");
  const count = cartCount();
  badge.textContent = count;
  badge.style.display = count ? "grid" : "none";

  const list = document.getElementById("cart-items");
  const empty = document.getElementById("cart-empty");
  const footer = document.getElementById("cart-footer");

  list.innerHTML = "";
  const keys = Object.keys(cart);
  empty.style.display = keys.length ? "none" : "block";
  footer.style.display = keys.length ? "block" : "none";

  keys.forEach(key => {
    const entry = cart[key];
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <img src="${entryImage(entry)}" alt="${entryName(entry)}">
      <div class="cart-row-info">
        <b>${entryName(entry)}</b>
        <span>£${entryPrice(entry).toFixed(2)} · ${entryDetail(entry)}</span>
        <div class="qty-controls">
          <button type="button" aria-label="Remove one ${entryName(entry)}" data-qty="-1" data-key="${key}">−</button>
          <span aria-live="polite">${entry.qty}</span>
          <button type="button" aria-label="Add one ${entryName(entry)}" data-qty="1" data-key="${key}">+</button>
          <button type="button" class="cart-remove" aria-label="Remove ${entryName(entry)} from basket" data-remove="${key}">Remove</button>
        </div>
      </div>
      <b class="cart-row-price">£${(entryPrice(entry) * entry.qty).toFixed(2)}</b>`;
    list.appendChild(row);
  });

  document.getElementById("cart-subtotal").textContent = "£" + cartSubtotal().toFixed(2);
  document.getElementById("cart-pp").textContent = "£" + (cartCount() ? P_AND_P : 0).toFixed(2);
  document.getElementById("cart-total").textContent = "£" + cartTotal().toFixed(2);
}

/* ---------- Minis pack builder ---------- */

let packSize = 3;
let packPicks = {};

function packPicked() {
  return Object.values(packPicks).reduce((a, b) => a + b, 0);
}

function renderPackBuilder() {
  const picked = packPicked();

  document.querySelectorAll(".pack-size-btn").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.dataset.size, 10) === packSize);
  });

  document.querySelectorAll(".mini-tile").forEach(tile => {
    const id = tile.dataset.mini;
    const n = packPicks[id] || 0;
    tile.querySelector(".mini-count").textContent = n;
    tile.classList.toggle("picked", n > 0);
    tile.querySelector("[data-mini-plus]").disabled = picked >= packSize;
    tile.querySelector("[data-mini-minus]").disabled = n === 0;
  });

  const status = document.getElementById("pack-status");
  const btn = document.getElementById("pack-add");
  if (picked < packSize) {
    status.textContent = `Picked ${picked} of ${packSize} — choose ${packSize - picked} more`;
    btn.disabled = true;
  } else {
    status.textContent = `Pack complete! ${packSize} minis picked.`;
    btn.disabled = false;
  }
  btn.textContent = `Add ${packSize}-Pack — £${PACK_PRICES[packSize].toFixed(2)}`;
}

function setPackSize(size) {
  packSize = size;
  const over = packPicked() - packSize;
  if (over > 0) {
    // trim picks that no longer fit the smaller pack
    for (const id of Object.keys(packPicks)) {
      while (packPicks[id] > 0 && packPicked() > packSize) {
        packPicks[id] -= 1;
        if (packPicks[id] === 0) delete packPicks[id];
      }
    }
  }
  renderPackBuilder();
}

/* ---------- Drawer & modal ---------- */

function openCart() {
  document.getElementById("cart-drawer").classList.add("open");
  document.getElementById("shop-overlay").classList.add("open");
}

function closeCart() {
  document.getElementById("cart-drawer").classList.remove("open");
  if (!document.getElementById("checkout-modal").classList.contains("open")) {
    document.getElementById("shop-overlay").classList.remove("open");
  }
}

function openCheckout() {
  closeCart();
  document.getElementById("checkout-modal").classList.add("open");
  document.getElementById("shop-overlay").classList.add("open");
  document.getElementById("checkout-form").style.display = "block";
  document.getElementById("checkout-done").style.display = "none";
  renderCheckoutSummary();
}

function closeCheckout() {
  document.getElementById("checkout-modal").classList.remove("open");
  document.getElementById("shop-overlay").classList.remove("open");
}

function renderCheckoutSummary() {
  const box = document.getElementById("checkout-summary");
  const lines = Object.values(cart).map(e =>
    `<div class="summary-line"><span>${e.qty} × ${entryName(e)}${e.type === "pack" ? ` <small>(${entryDetail(e)})</small>` : ""}</span><b>£${(entryPrice(e) * e.qty).toFixed(2)}</b></div>`);
  box.innerHTML = lines.join("") +
    `<div class="summary-line"><span>Subtotal</span><b>£${cartSubtotal().toFixed(2)}</b></div>` +
    `<div class="summary-line"><span>P&amp;P (UK tracked)</span><b>£${P_AND_P.toFixed(2)}</b></div>` +
    `<div class="summary-line summary-total"><span>Total</span><b>£${cartTotal().toFixed(2)}</b></div>`;
}

/* ---------- Checkout submit ---------- */

function submitOrder(event) {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);

  const itemLines = Object.values(cart)
    .map(e => `${e.qty} x ${entryName(e)}${e.type === "pack" ? ` (${entryDetail(e)})` : ""} @ £${entryPrice(e).toFixed(2)}`)
    .join("\n");

  const body =
`NEW PLASTER PALZ ORDER REQUEST

${itemLines}

Subtotal: £${cartSubtotal().toFixed(2)}
P&P: £${P_AND_P.toFixed(2)}
Order total: £${cartTotal().toFixed(2)}

Deliver to:
${data.get("name")}
${data.get("address")}
${data.get("postcode")}

Contact email: ${data.get("email")}
Notes: ${data.get("notes") || "—"}`;

  const subject = `Plaster Palz order request — ${data.get("name")}`;
  window.location.href = `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  form.style.display = "none";
  document.getElementById("checkout-done").style.display = "block";
  cart = {};
  saveCart();
  renderCart();
}

/* ---------- Stripe payment links ---------- */

function wireStripeLinks() {
  fetch("stripe-config.json")
    .then(r => (r.ok ? r.json() : null))
    .then(cfg => {
      if (!cfg) return;
      document.querySelectorAll(".product-card [data-add]").forEach(btn => {
        const entry = cfg.products[btn.dataset.add];
        if (!entry) return;
        const a = document.createElement("a");
        a.className = "buy-now-link";
        a.href = entry.payment_link;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "or buy now by card ↗";
        btn.closest(".product-card").appendChild(a);
      });
      const packRow = document.getElementById("pack-card-links");
      if (packRow) {
        const p3 = cfg.products["minis-3-pack"], p5 = cfg.products["minis-5-pack"];
        if (p3 && p5) {
          packRow.innerHTML =
            `Prefer card? <a href="${p3.payment_link}" target="_blank" rel="noopener">Buy a 3-Pack ↗</a> or ` +
            `<a href="${p5.payment_link}" target="_blank" rel="noopener">a 5-Pack ↗</a> — tell us your minis in the checkout form.`;
        }
      }
    })
    .catch(() => {});
}

/* ---------- Scroll reveal animations ---------- */

function wireRevealAnimations() {
  const targets = document.querySelectorAll(
    ".section-title, .section-sub, .product-card, .step, .gcard, .kit-item, .plaque-card, .feature-art, .feature-copy, .pack-builder, .watch-copy, .phone-frame"
  );
  targets.forEach(el => el.classList.add("reveal"));

  const groups = new Map();
  targets.forEach(el => {
    const parent = el.parentElement;
    if (!groups.has(parent)) groups.set(parent, 0);
    el.style.transitionDelay = (groups.get(parent) * 0.08) + "s";
    groups.set(parent, groups.get(parent) + 1);
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(el => observer.observe(el));
}

/* ---------- Wire up ---------- */

document.addEventListener("DOMContentLoaded", () => {
  loadCart();
  renderCart();
  renderPackBuilder();
  wireStripeLinks();
  wireRevealAnimations();

  document.querySelectorAll("[data-add]").forEach(btn =>
    btn.addEventListener("click", () => addToCart(btn.dataset.add)));

  document.querySelectorAll(".pack-size-btn").forEach(btn =>
    btn.addEventListener("click", () => setPackSize(parseInt(btn.dataset.size, 10))));

  document.querySelectorAll("[data-mini-plus]").forEach(btn =>
    btn.addEventListener("click", () => {
      const tile = btn.closest(".mini-tile");
      const id = tile.dataset.mini;
      if (packPicked() < packSize) {
        packPicks[id] = (packPicks[id] || 0) + 1;
        renderPackBuilder();
        tile.classList.remove("pop");
        void tile.offsetWidth;
        tile.classList.add("pop");
      }
    }));

  document.querySelectorAll("[data-mini-minus]").forEach(btn =>
    btn.addEventListener("click", () => {
      const id = btn.closest(".mini-tile").dataset.mini;
      if (packPicks[id]) {
        packPicks[id] -= 1;
        if (packPicks[id] === 0) delete packPicks[id];
        renderPackBuilder();
      }
    }));

  document.getElementById("pack-add").addEventListener("click", () => {
    if (packPicked() === packSize) {
      addPackToCart(packSize, { ...packPicks });
      packPicks = {};
      renderPackBuilder();
    }
  });

  document.getElementById("cart-button").addEventListener("click", openCart);
  document.getElementById("cart-close").addEventListener("click", closeCart);
  document.getElementById("shop-overlay").addEventListener("click", () => { closeCart(); closeCheckout(); });
  document.getElementById("checkout-open").addEventListener("click", openCheckout);
  document.getElementById("checkout-close").addEventListener("click", closeCheckout);
  document.getElementById("checkout-form").addEventListener("submit", submitOrder);

  document.getElementById("cart-items").addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.dataset.remove) removeItem(btn.dataset.remove);
    else if (btn.dataset.qty) changeQty(btn.dataset.key, parseInt(btn.dataset.qty, 10));
  });
});
