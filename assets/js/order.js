import { getProducts } from "./services/product-service.js";
import {
  getCart,
  updateQuantity,
  removeFromCart,
  resetCart,
  createOrder,
  getOrder,
  getOrders,
} from "./services/order-service.js";
import { toast, formatPrice, escapeHTML } from "./ui.js";

const $ = (selector) => document.querySelector(selector);
const cartItems = $("#cart-items");
const feedback = $("#order-feedback");
const createButton = $("#create-order");
let catalog = new Map();
let cart = [];
let submitting = false;
let renderSequence = 0;
let confirmedNumber = "";

function showError(error) {
  feedback.textContent =
    error.message || "We could not update your demo order. Please try again.";
  if (error.code === "CORRUPT_CART") {
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "text-button";
    reset.textContent = "Reset selected items";
    reset.addEventListener("click", async () => {
      try {
        await resetCart();
        feedback.textContent = "";
        toast("Your selection has been reset. Saved orders were kept.");
      } catch (failure) {
        showError(failure);
      }
    });
    feedback.append(reset);
  }
}

async function renderCart() {
  const sequence = ++renderSequence;
  try {
    const items = await getCart();
    if (sequence !== renderSequence) return;
    cart = items;
    $("#cart-content").hidden = !cart.length;
    $("#cart-empty").hidden = Boolean(cart.length) || Boolean(confirmedNumber);
    let totalCents = 0;
    cartItems.innerHTML = cart
      .map((item) => {
        const product = catalog.get(item.productId);
        if (!product) return "";
        const lineTotal = Math.round(product.price * 100) * item.quantity;
        totalCents += lineTotal;
        const id = escapeHTML(product.id),
          name = escapeHTML(product.name);
        return `<article class="cart-item" data-product-id="${id}">
        <img class="cart-item-image" src="${escapeHTML(product.image)}" alt="${name}" width="115" height="125">
        <div class="cart-item-info"><h3>${name}</h3><p>${formatPrice(product.price)} each · Sample product</p>
          <div class="quantity-control"><button class="quantity-button" type="button" data-change="-1" aria-label="Decrease quantity of ${name}" ${item.quantity === 1 ? "disabled" : ""}>−</button><label class="sr-only" for="qty-${id}">Quantity of ${name}</label><input id="qty-${id}" type="number" inputmode="numeric" min="1" max="99" step="1" value="${item.quantity}" data-quantity><button class="quantity-button" type="button" data-change="1" aria-label="Increase quantity of ${name}" ${item.quantity === 99 ? "disabled" : ""}>+</button></div>
        </div><div class="cart-item-price">${formatPrice(lineTotal / 100)}<button class="remove-item" type="button" data-remove aria-label="Remove ${name} from order">Remove</button></div>
      </article>`;
      })
      .join("");
    $("#cart-subtotal").textContent = formatPrice(totalCents / 100);
    $("#cart-total").textContent = formatPrice(totalCents / 100);
    createButton.disabled = !cart.length || submitting;
  } catch (error) {
    $("#cart-content").hidden = true;
    $("#cart-empty").hidden = true;
    showError(error);
  }
}

async function changeItem(id, quantity, remove = false, focusSelector = null) {
  feedback.textContent = "";
  try {
    if (
      !remove &&
      (!Number.isInteger(quantity) || quantity < 1 || quantity > 99)
    ) {
      throw new Error(
        "Choose a whole-number quantity between 1 and 99. Use Remove to delete a piece.",
      );
    }
    if (remove) await removeFromCart(id);
    else await updateQuantity(id, quantity);
    await renderCart();
    if (remove) {
      toast("Item removed from your demo order.");
      (
        cartItems.querySelector("button:not([disabled])") || $("#cart-empty a")
      )?.focus({ preventScroll: true });
    } else if (focusSelector) {
      document.querySelector(focusSelector)?.focus({ preventScroll: true });
    }
  } catch (error) {
    showError(error);
    await renderCart();
  }
}

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  const row = button?.closest("[data-product-id]");
  if (!row || submitting) return;
  const id = row.dataset.productId;
  const current = cart.find((item) => item.productId === id);
  if (!current) return;
  if (button.hasAttribute("data-remove")) void changeItem(id, 0, true);
  else if (button.dataset.change)
    void changeItem(
      id,
      current.quantity + Number(button.dataset.change),
      false,
      `[data-product-id="${CSS.escape(id)}"] [data-change="${button.dataset.change}"]`,
    );
});
cartItems.addEventListener("change", (event) => {
  if (!event.target.matches("[data-quantity]") || submitting) return;
  const id = event.target.closest("[data-product-id]").dataset.productId;
  void changeItem(
    id,
    event.target.valueAsNumber,
    false,
    `#qty-${CSS.escape(id)}`,
  );
});

createButton.addEventListener("click", async () => {
  if (submitting) return;
  submitting = true;
  createButton.disabled = true;
  createButton.setAttribute("aria-busy", "true");
  feedback.textContent = "";
  try {
    const order = await createOrder();
    confirmedNumber = order.number;
    $("#confirmation-number").textContent = order.number;
    const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
    $("#confirmation-summary").textContent =
      `${count} sample ${count === 1 ? "piece" : "pieces"} · Estimated total ${formatPrice(order.total)} · Simulated status: received`;
    $("#order-confirmation").hidden = false;
    $("#lookup-number").value = order.number;
    if (order.warning) feedback.textContent = order.warning;
    await renderCart();
    $("#order-confirmation").focus({ preventScroll: true });
    $("#order-confirmation").scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "center",
    });
    await renderRecentOrders();
  } catch (error) {
    showError(error);
  } finally {
    submitting = false;
    createButton.removeAttribute("aria-busy");
    createButton.disabled = !cart.length;
  }
});

$("#copy-order-number").addEventListener("click", async () => {
  try {
    if (!navigator.clipboard?.writeText)
      throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(confirmedNumber);
    toast("Demo order number copied.");
  } catch {
    const range = document.createRange();
    range.selectNodeContents($("#confirmation-number"));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    toast(
      "Order number selected. Press Ctrl+C (or Command+C) to copy, or touch and hold it.",
      "error",
    );
  }
});

// This built-in example is intentionally separate from browser-created orders.
// It is a static tutorial fixture; it does not imply cross-device order storage.
const EXAMPLE = {
  number: "FD-2026-001234",
  total: 1048,
  status: "received",
  example: true,
  items: [
    { name: "Haven Upholstered Sofa", quantity: 1 },
    { name: "Terra Round Coffee Table", quantity: 1 },
  ],
};

async function lookup(number) {
  const result = $("#lookup-result");
  $("#lookup-feedback").textContent = "";
  result.innerHTML = "";
  const button = $("#lookup-form button");
  button.disabled = true;
  try {
    const normalized = number.trim().toUpperCase();
    const order =
      (await getOrder(normalized)) ||
      (normalized === EXAMPLE.number ? EXAMPLE : null);
    if (!order)
      throw new Error(
        "No demo order with that number was found in this browser. Check the number and use the same browser and device where you created it.",
      );
    result.innerHTML = `<section class="lookup-status"><span class="availability">Simulated status · Received</span><h3>${escapeHTML(order.number)}</h3><p>${order.example ? "Built-in example only. This order was not created or submitted by you." : `Saved ${new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} in this browser. Nothing was sent to the store.`}</p><ol class="status-steps" aria-label="Simulated order progress"><li class="is-current" aria-current="step">Demo received</li><li>Preparing (example)</li><li>Ready (example)</li></ol><ul class="lookup-items">${order.items.map((item) => `<li>${escapeHTML(item.name)} × ${item.quantity}</li>`).join("")}</ul><p><strong>Example total: ${formatPrice(order.total)}</strong></p><p class="small">Status is simulated and will not trigger fulfillment, delivery, or payment.</p></section>`;
  } catch (error) {
    $("#lookup-feedback").textContent = error.message;
  } finally {
    button.disabled = false;
  }
}
$("#lookup-form").addEventListener("submit", (event) => {
  event.preventDefault();
  void lookup($("#lookup-number").value);
});

async function renderRecentOrders() {
  try {
    const orders = (await getOrders()).slice(-3).reverse();
    let recent = $("#recent-orders");
    if (!orders.length) {
      recent?.remove();
      return;
    }
    if (!recent) {
      recent = document.createElement("div");
      recent.id = "recent-orders";
      recent.className = "recent-orders";
      $("#lookup-form").after(recent);
    }
    recent.innerHTML = `<p class="small">Recently saved in this browser</p>${orders.map((order) => `<button class="text-button" type="button" data-order-number="${escapeHTML(order.number)}">${escapeHTML(order.number)}</button>`).join("")}`;
    recent.onclick = (event) => {
      const number = event.target.closest("[data-order-number]")?.dataset
        .orderNumber;
      if (number) {
        $("#lookup-number").value = number;
        void lookup(number);
      }
    };
  } catch {
    /* Explicit lookup surfaces any storage error; keep the cart usable. */
  }
}

window.addEventListener("cart-updated", () => {
  void renderCart();
});
window.addEventListener("storage", (event) => {
  if (event.key === "fd.demo.orders.v1" || event.key === null)
    void renderRecentOrders();
});
try {
  catalog = new Map(
    (await getProducts()).map((product) => [product.id, product]),
  );
  await renderCart();
  await renderRecentOrders();
} catch (error) {
  showError(error);
}
